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
const { React, getModule, getModuleByDisplayName } = require('powercord/webpack')
const { open: openModal, close: closeModal } = require('powercord/modal')
const { Confirm } = require('powercord/components/modal')
const { Menu, FormTitle } = require('powercord/components')
const { findInReactTree, getReactInstance, injectContextMenu } = require('powercord/util')
const { formatPronouns } = require('./util.js')
const { Pronouns: AvailablePronouns } = require('./constants.js')

const usePronouns = require('./store/usePronouns.js')
const Pronouns = require('./components/Pronouns.js')
const Settings = require('./components/Settings.jsx')

const SelectInput = getModule([ 'SingleSelect' ], false).SingleSelect
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
    const UserInfoBase = await getModule((m) => m.default?.displayName == 'UserInfoBase')
    const MessageHeader = await this._getMessageHeader()
    const UserPopOutComponents = await getModule([ 'UserPopoutProfileText' ])
    const Autocomplete = await getModuleByDisplayName('Autocomplete')

    let memoizedType
    inject('pronoundb-messages-header', MessageHeader, 'default', function ([ props ], res) {
      if (!memoizedType) {
        const ogType = res.type
        memoizedType = (props) => {
          const res = ogType(props)
          res.props.children[1].props.children.push(
            React.createElement(
              'span',
              { className: 'pronoundb-pronouns' },
              React.createElement(Pronouns, {
                userId: props.message.author.id,
                region: props.message.id.startsWith('pronoundb-fake') ? 'settings' : 'chat',
                prefix: ' • '
              })
            )
          )

          return res
        }
      }

      res.type = memoizedType
      return res
    })

    inject('pronoundb-popout-render', UserPopOutComponents, 'UserPopoutProfileText', function ([ { user } ], res) {
      if (!res.props.children[3]) {
        res.props.children.push(
          React.createElement(Pronouns, {
            userId: user.id,
            region: 'popout',
            render: (p) => React.createElement(
              'div',
              { className: 'aboutMeSection-PUghFQ' },
              React.createElement('h3', { className: 'aboutMeTitle-3pjiS7 base-21yXnu size12-oc4dx4 muted-eZM05q uppercase-2unHJn' }, 'Pronouns'),
              React.createElement('div', { className: 'aboutMeBody-1J8rhz markup-eYLPri clamped-2ZePhX' }, p)
            )
          })
        )
      } else {
        res.props.children[3].props.children.push(
          React.createElement(
            'div',
            { className: 'pronoundb-pronouns aboutMeBody-1J8rhz markup-eYLPri clamped-2ZePhX' },
            React.createElement(Pronouns, {
              userId: user.id,
              region: 'popout',
              prefix: '\n'
            })
          )
        )
      }

      return res
    })

    /*
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
    UserInfoBase.default.displayName = 'UserInfoBase'
    */

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

    injectContextMenu('pronoundb-user-add-pronouns-guild', 'GuildChannelUserContextMenu', ctxMenuInjection)
    injectContextMenu('pronoundb-user-add-pronouns-dm', 'DMUserContextMenu', ctxMenuInjection)

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

    uninject('pronoundb-fix-ChannelMessage')
    uninject('pronoundb-fix-InboxMessage')

    this._forceUpdate()
  }

  _forceUpdate () {
    document.querySelectorAll('[id^="chat-messages-"] > div').forEach((e) => getReactInstance(e).memoizedProps.onMouseMove());
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
          confirmButtonColor: 'colorBrand-I6CyqQ',
          onConfirm: () => this.settings.set(`pronouns-${user.id}`, pronouns),
          onCancel: closeModal
        },
        React.createElement(
          'div',
          { className: 'powercord-text' },
          React.createElement(FormTitle, null, 'Pronouns'),
          React.createElement(SelectInput, {
            searchable: false,
            onChange: (v) => setPronouns(v),
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
}

module.exports = PronounDB
