/*
 * Copyright (c) 2020-2021 Cynthia K. Rey, All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. Neither the name of the copyright holder nor the names of its contributors
 *    may be used to endorse or promote products derived from this software without
 *    specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

const { Plugin } = require('powercord/entities')
const { inject, uninject } = require('powercord/injector')
const { React, getModule, getModuleByDisplayName, FluxDispatcher, channels } = require('powercord/webpack')
const { open: openModal, close: closeModal } = require('powercord/modal')
const { Confirm } = require('powercord/components/modal')
const { Menu, FormTitle, AsyncComponent } = require('powercord/components')
const { findInReactTree, findInTree } = require('powercord/util')
const { wrapInHooks, formatPronouns } = require('./util.js')
const { Pronouns: AvailablePronouns } = require('./constants.js')
const prideify = require('./prideify.js');

const usePronouns = require('./store/usePronouns.js')
const Pronouns = require('./components/Pronouns.js')
const PrideRing = require('./components/PrideRing.js')
const Settings = require('./components/Settings.jsx')

const SelectInput = AsyncComponent.from(getModuleByDisplayName('SelectTempWrapper'))
const PronounsKeys = Object.keys(AvailablePronouns).filter((p) => p !== 'ask' && p !== 'unspecified')

class PronounDB extends Plugin {
  async startPlugin () {
    this.loadStylesheet('style.css')
    powercord.api.settings.registerSettings('pronoundb', {
      category: this.entityID,
      label: 'PronounDB',
      render: Settings
    })

    const _this = this;
    const GuildChannelUserContextMenu = await getModule((m) => m.default?.displayName == 'GuildChannelUserContextMenu')
    const DMUserContextMenu = await getModule((m) => m.default?.displayName == 'DMUserContextMenu')
    const UserInfoBase = await getModule((m) => m.default?.displayName == 'UserInfoBase')
    const MessageHeader = await this._getMessageHeader()
    const UserPopOut = await this._getUserPopOut()
    const Autocomplete = await getModuleByDisplayName('Autocomplete')

    inject('pronoundb-messages-header', MessageHeader, 'default', function ([ props ], res) {
      res.props.children[1].props.children.push(
        React.createElement(
          'span',
          {
            className: 'pronoundb-pronouns',
            style: { color: 'var(--text-muted)', fontSize: '.9rem', marginRight: props.compact ? '.6rem' : '' }
          },
          React.createElement(Pronouns, {
            userId: props.message.author.id,
            region: props.message.id === 'pronoundb-fake' ? 'settings' : 'chat',
            prefix: ' • '
          })
        )
      )

      return res
    })

    inject('pronoundb-popout-render', UserPopOut.prototype, 'renderBody', function (_, res) {
      const id = findInReactTree(res, (n) => n.userId)?.userId
      if (!id) return res

      res.props.children.props.children.push(
        React.createElement(Pronouns, {
          userId: id,
          region: 'popout',
          render: (p) => React.createElement(
            React.Fragment,
            null,
            React.createElement('div', { className: 'bodyTitle-3FWCs2' }, 'Pronouns'),
            React.createElement('div', { className: 'marginBottom8-AtZOdT size14-e6ZScH' }, p)
          )
        })
      )

      return res
    })

    inject('pronoundb-profile-render', UserInfoBase, 'default', function ([ props ], res) {
      res.props.children[0].props.children.push(
        React.createElement(Pronouns, {
          userId: props.user.id,
          region: 'profile',
          render: (p) => React.createElement(
            React.Fragment,
            null,
            React.createElement('div', { className: 'userInfoSectionHeader-3TYk6R base-1x0h_U size12-3cLvbJ uppercase-3VWUQ9' }, 'Pronouns'),
            React.createElement('div', { className: 'marginBottom8-AtZOdT size14-e6ZScH colorStandard-2KCXvj' }, p)
          )
        })
      );

      return res;
    });

    inject('pronoundb-autocomplete-render', Autocomplete.User.prototype, 'renderContent', function (_, res) {
      if (!_this.settings.get('display-autocomplete', true)) return res

      const section = res.props.children[2].props.children
      section.push(
        React.createElement(
          'span',
          { className: 'pronoundb-pronouns' },
          React.createElement(Pronouns, { userId: this.props.user.id, region: 'autocomplete', prefix: ' • ' })
        )
      )

      return res
    })

    function ctxMenuInjection ([ { user } ], res) {
      const pronouns = usePronouns(user.id)
      const group = findInReactTree(res, (n) => n.children?.find?.((c) => c?.props?.id === 'note'))
      if (!group) return res

      const note = group.children.indexOf((n) => n?.props?.id === 'note')
      if (pronouns === 'unspecified') {
        group.children.splice(note, 0, React.createElement(Menu.MenuItem, { id: 'pronoundb', label: 'Add Pronouns', action: () => _this._promptAddPronouns(user) }))
      }

      return res
    }

    inject('pronoundb-user-add-pronouns-guild', GuildChannelUserContextMenu, 'default', ctxMenuInjection)
    inject('pronoundb-user-add-pronouns-dm', DMUserContextMenu, 'default', ctxMenuInjection)

    UserInfoBase.default.displayName = 'UserInfoBase'
    GuildChannelUserContextMenu.default.displayName = 'GuildChannelUserContextMenu'
    DMUserContextMenu.default.displayName = 'DMUserContextMenu'

    if (this.settings.get('experiment-pride-flags')) {
      await this._injectPride()
    }

    // fix for messages in search and inbox
    for (const component of [ 'ChannelMessage', 'InboxMessage' ]) {
      const mdl = await getModule(m => m.type && m.type.displayName === component);
      if (mdl) {
        inject(`pronoundb-fix-${component}`, mdl, 'type', (_, res) => {
          if (res.props.childrenHeader) {
            res.props.childrenHeader.type.type = MessageHeader.default;
          }
          return res;
        });
        mdl.type.displayName = component;
      }
    }

    this._forceUpdate()
  }

  pluginWillUnload () {
    powercord.api.settings.unregisterSettings('pronoundb')
    uninject('pronoundb-messages-header')
    uninject('pronoundb-popout-render')
    uninject('pronoundb-profile-render')
    uninject('pronoundb-autocomplete-render')
    uninject('pronoundb-user-add-pronouns-guild')
    uninject('pronoundb-user-add-pronouns-dm')
    uninject('pronoundb-pride-avatar')
    uninject('pronoundb-pride-avatar-voice')
    uninject('pronoundb-pride-avatar-message')
    uninject('pronoundb-pride-avatar-reply')
    uninject('pronoundb-pride-direct-message')
    uninject('pronoundb-pride-notification')

    uninject('pronoundb-fix-ChannelMessage')
    uninject('pronoundb-fix-InboxMessage')

    const { GroupData: SearchGroupData } = getModule([ 'SearchPopoutComponent' ], false)
    const sendNotificationMdl = getModule([ 'requestPermission', 'showNotification' ], false);

    if (SearchGroupData.FILTER_FROM.__$pdb_og_component) {
      SearchGroupData.FILTER_FROM.component = SearchGroupData.FILTER_FROM.__$pdb_og_component
    }

    if (sendNotificationMdl.__$pdb_og_showNotification) {
      sendNotificationMdl.showNotification = sendNotificationMdl.__$pdb_og_showNotification
    }

    this._forceUpdate()
  }

  async _injectPride () {
    const Avatar = await getModule([ 'AnimatedAvatar' ]);
    const MessageHeader = await this._getMessageHeader()
    const RepliedMessage = await getModule((m) => m.default?.displayName === 'RepliedMessage')
    const DirectMessage = await getModuleByDisplayName('DirectMessage');
    const VoiceUser = await getModuleByDisplayName('VoiceUser');
    const { GroupData: SearchGroupData } = await getModule([ 'SearchPopoutComponent' ])
    const sendNotificationMdl = await getModule([ 'requestPermission', 'showNotification' ]);
    const makeNotificationMdl = await getModule([ 'makeTextChatNotification' ]);

    inject('pronoundb-pride-avatar', Avatar, 'default', function (_, res) {
      const svg = findInReactTree(res, (n) => n.viewBox)
      const fe = findInReactTree(svg, (n) => n.type === 'foreignObject')
      const idx = svg.children.indexOf(fe)
      svg.children[idx] = React.createElement(PrideRing, null, fe)
      return res;
    })

    inject('pronoundb-pride-avatar-voice', VoiceUser.prototype, 'renderAvatar', function (_, res) {
      return (
        React.createElement(PrideRing.PrideAvatar, {
          userId: this.props.user.id,
          src: res.props.style.backgroundImage.slice(4, -1),
          className: res.props.className,
          onClick: res.props.onClick,
          onContextMenu: res.props.onContextMenu,
          onKeyDown: res.props.onKeyDown,
          onMouseDown: res.props.onMouseDown,
          size: 24
        })
      )
    })

    inject('pronoundb-pride-avatar-message', MessageHeader, 'default', function ([ props ], res) {
      if (res.props.children[0].type === 'img') {
        res.props.children[0] = React.createElement(PrideRing.PrideAvatar, {
          userId: props.message.author.id,
          src: res.props.children[0].props.src,
          className: res.props.children[0].props.className,
          onClick: res.props.children[0].props.onClick,
          onContextMenu: res.props.children[0].props.onContextMenu,
          onKeyDown: res.props.children[0].props.onKeyDown,
          onMouseDown: res.props.children[0].props.onMouseDown,
          size: 40
        })

        return res
      }

      const ogChild = res.props.children[0].props.children
      res.props.children[0].props.children = (p) => {
        const res = ogChild(p)
        return res.type === 'img'
          ? React.createElement(PrideRing.PrideAvatar, {
              userId: props.message.author.id,
              src: res.props.src,
              className: res.props.className,
              onClick: res.props.onClick,
              onContextMenu: res.props.onContextMenu,
              onKeyDown: res.props.onKeyDown,
              onMouseDown: res.props.onMouseDown,
              size: 40
            })
          : res
      }

      return res
    })

    inject('pronoundb-pride-avatar-reply', RepliedMessage, 'default', function ([ props ], res) {
      const userId = props.referencedMessage.message?.author.id
      if (res.props.children[0].type === 'img') {
        res.props.children[0] = React.createElement(PrideRing.PrideAvatar, {
          userId: userId,
          src: res.props.children[0].props.src,
          className: res.props.children[0].props.className,
          onClick: res.props.children[0].props.onClick,
          onContextMenu: res.props.children[0].props.onContextMenu,
          onKeyDown: res.props.children[0].props.onKeyDown,
          onMouseDown: res.props.children[0].props.onMouseDown,
          size: 16
        })
        return res
      }

      if (res.props.children[0].type === 'div') {
        return res
      }

      const ogChild = res.props.children[0].props.children
      res.props.children[0].props.children = (p) => {
        const res = ogChild(p)
        return res.type === 'img'
          ? React.createElement(PrideRing.PrideAvatar, {
              userId: userId,
              src: res.props.src,
              className: res.props.className,
              onClick: res.onClick,
              onContextMenu: res.onContextMenu,
              onKeyDown: res.onKeyDown,
              onMouseDown: res.onMouseDown,
              size: 16
            })
          : res
      }

      return res
    })

    inject('pronoundb-pride-direct-message', DirectMessage.prototype, 'render', function (_, res) {
      if (this.props.channel.type !== 1) {
        return res
      }

      const props = findInReactTree(res, (n) => typeof n.children === 'function')
      const ogChildren = props.children
      props.children = (p) => {
        const res = ogChildren(p)
        const ogType = res.type
        res.type = (p) => {
          const res = ogType(p)
          res.props.children[1] = React.createElement(PrideRing.PrideAvatar, {
            userId: this.props.channel.recipients[0],
            src: res.props.children[1].props.src,
            className: res.props.children[1].props.className,
            onClick: res.props.children[1].props.onClick,
            onContextMenu: res.props.children[1].props.onContextMenu,
            onKeyDown: res.props.children[1].props.onKeyDown,
            onMouseDown: res.props.children[1].props.onMouseDown,
            size: 48
          })
          return res
        }
        return res
      }
      return res
    })

    RepliedMessage.default.displayName = 'RepliedMessage'
    Avatar.default.Sizes = Avatar.Sizes;

    const ogSearchFrom = SearchGroupData.FILTER_FROM.component
    SearchGroupData.FILTER_FROM.__$pdb_og_component = ogSearchFrom
    function renderResult (fn, searchId, filterType, result) {
      const res = fn(searchId, filterType, result)
      res[0] = React.createElement(PrideRing.PrideAvatar, {
        userId: result.id,
        src: res[0].props.src,
        className: res[0].props.className,
        onClick: res[0].props.onClick,
        onContextMenu: res[0].props.onContextMenu,
        onKeyDown: res[0].props.onKeyDown,
        onMouseDown: res[0].props.onMouseDown,
        size: 16
      })
      return res
    }

    let boundRenderResult = null
    SearchGroupData.FILTER_FROM.component = (props) => {
      const res = ogSearchFrom(props)
      if (!boundRenderResult) boundRenderResult = renderResult.bind(null, res.props.renderResult)
      res.props.renderResult = boundRenderResult
      return res
    }

    inject('pronoundb-pride-notification', makeNotificationMdl, 'makeTextChatNotification', function ([ ,, user ], res) {
      res.icon += ` ${user.id}`
      return res
    })

    const ogSend = sendNotificationMdl.showNotification
    sendNotificationMdl.__$pdb_og_showNotification = ogSend
    async function showNotif (rawIcon, title, body, meta) {
      let [ icon, userId ] = rawIcon.split(' ')
      if (userId === '94762492923748352' || userId === '343383572805058560') {
        icon = await prideify(icon)
      }

      return ogSend(icon, title, body, meta)
    }

    sendNotificationMdl.showNotification = (rawIcon, title, body, meta) => {
      let res = null
      showNotif(rawIcon, title, body, meta).then((n) => (res = n))
      return { close: () => res?.close() }
    }
  }

  async _forceUpdate () {
    const channel = channels.getChannelId()
    for (const msg of document.querySelectorAll('[id^=chat-messages-]')) {
      const id = msg.id.slice(14)
      FluxDispatcher.dirtyDispatch({ type: 'MESSAGE_UPDATE', message: { id: id, channel_id: channel, author: {} } })
    }

    const statusMdl = await getModule([ 'getStatus' ])
    const activitiesMdl = await getModule([ 'getActivities' ])
    for (const user of document.querySelectorAll('.member-3-YXUe, [id^=private-channels-]')) {
      const res = findInTree(user.__reactInternalInstance$, (n) => n.user || n.channel, { walkable: [ 'memoizedProps', 'return' ] })
      if (!res || (!res.user && res.channel.type !== 1)) continue

      const id = res.user?.id ?? res.channel.recipients[0]
      const status = statusMdl.getStatus(id)
      const activities = activitiesMdl.getActivities(id)
      const tmpStatus = status === 'online' ? 'dnd' : 'online'
      FluxDispatcher.dirtyDispatch({ type: 'PRESENCE_UPDATE', user: { id: id }, activities: activities, status: tmpStatus })
      FluxDispatcher.dirtyDispatch({ type: 'PRESENCE_UPDATE', user: { id: id }, activities: activities, status: status })
    }

    for (const voice of document.querySelectorAll('.voiceUser-1K6Xox')) voice.click()
    setTimeout(() => document.body.click(), 0)

    for (const guild of document.querySelectorAll('.listItem-GuPuDH')) {
      const res = findInTree(guild, (n) => n.type?.displayName === 'DirectMessage', { walkable: [ 'return' ] })
      if (!res) continue

      res.stateNode.forceUpdate()
    }

  }

  _promptAddPronouns (user) {
    openModal(() => {
      const [ pronouns, setPronouns ] = React.useState(this.settings.get(`pronouns-${user.id}`, 'unspecified'))
      const format = this.settings.get('format', 'lower')

      return React.createElement(
        Confirm,
        {
          header: `Set pronouns for ${user.tag}`,
          confirmText: 'Apply',
          cancelText: 'Cancel',
          className: 'pronoundb-modal',
          confirmButtonColor: 'colorBrand-3pXr91',
          onConfirm: () => this.settings.set(`pronouns-${user.id}`, pronouns),
          onCancel: closeModal
        },
        React.createElement(
          'div',
          { className: 'powercord-text' },
          React.createElement(FormTitle, null, 'Pronouns'),
          React.createElement(SelectInput, {
            searchable: false,
            onChange: (e) => setPronouns(e.value),
            value: pronouns,
            options: [
              { label: 'Unset', value: 'unspecified' },
              ...PronounsKeys.map((k) => ({ label: formatPronouns(k, format), value: k }))
            ]
          }),
          React.createElement(
            'p',
            { style: { marginBottom: 0 } },
            'If the person registers an account on PronounDB, the pronouns they set will override your local settings.'
          )
        )
      )
    });
  }

  async _getMessageHeader () {
    const d = (m) => {
      const def = m.__powercordOriginal_default ?? m.default
      return typeof def === 'function' ? def : null
    }
    return getModule((m) => d(m)?.toString().includes('showTimestampOnHover'))
  }

  async _getUserPopOut () {
    const userStore = await getModule([ 'getCurrentUser' ])
    const fnUserPopOut = await getModule((m) => m.type?.displayName === 'UserPopoutContainer')

    const ogGetCurrentUser = userStore.getCurrentUser
    userStore.getCurrentUser = () => ({ id: '0' })
    let res
    try {
      res = wrapInHooks(() => fnUserPopOut.type({ user: { isNonUserBot: () => void 0 } }).type)()
    } finally {
      userStore.getCurrentUser = ogGetCurrentUser
    }
    console.log(res)
    return res
  }
}

module.exports = PronounDB
