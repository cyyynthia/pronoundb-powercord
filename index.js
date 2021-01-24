/*
 * Copyright (c) 2020 Cynthia K. Rey, All rights reserved.
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
const { fetchPronouns, fetchPronounsBulk } = require('./fetch')
const { wrapInHooks, formatPronouns } = require('./util')

const PronounsWrapper = require('./PronounsWrapper')

class PronounDB extends Plugin {
  constructor () {
    super()

    this.Pronouns = this.settings.connectStore(
      React.memo(
        function ({ pronouns, getSetting }) {
          // getSetting('styling', 'lower')
          return formatPronouns(pronouns)
        }
      )
    )
  }

  async startPlugin () {
    // todo: add settings for pronouns styling (and do disable pronouns from showing up in some places)

    this.loadStylesheet('style.css')

    const _this = this
    const Messages = await this._getMessages()
    const MessageHeader = await this._getMessageHeader()
    const UserPopOut = await this._getUserPopOut()
    const UserProfileBody = await this._getUserProfileBody()
    const UserProfileInfo = await this._getUserProfileInfo()
    const Autocomplete = await this._getAutocomplete()

    inject('pronoundb-messages-list', Messages, 'type', function (_, res) {
      // ok discord, if you can't make up your mind I'll do it for ya
      if (typeof res.props.children.props.children[1].props.children === 'function') {
        const ogFn = res.props.children.props.children[1].props.children;

        res.props.children.props.children[1].props.children = function (e) {
          const res = ogFn(e);
          const items = res.props.children.props.children[1];
          res.props.children.props.children[1] = React.createElement(PronounsWrapper, { items })
          return res
        }
      } else {
        const target = res.props.children.props.children[1].props.children.props.children
        target[1] = React.createElement(PronounsWrapper, { items: target[1] })
      }

      return res
    })

    inject('pronoundb-messages-header', MessageHeader, 'default', function ([ props ], res) {
      if (props.message.__$pronouns) {
        res.props.children[1].props.children.push(
          React.createElement(
            'span',
            { style: { color: 'var(--text-muted)', fontSize: '.9rem', marginRight: props.compact ? '.6rem' : '' } },
            ' • ',
            React.createElement(_this.Pronouns, { pronouns: props.message.__$pronouns })
          )
        )
      }
      return res
    })

    inject('pronoundb-popout-render', UserPopOut.prototype, 'renderBody', function (_, res) {
      if (this.state?.__$pronouns) {
        res.props.children.props.children.push([
          React.createElement('div', { key: 'title', className: 'bodyTitle-Y0qMQz marginBottom8-AtZOdT size12-3R0845' }, 'Pronouns'),
          React.createElement(
            'div',
            { key: 'pronouns', className: 'marginBottom8-AtZOdT size14-e6ZScH' },
            React.createElement(_this.Pronouns, { pronouns: this.state.__$pronouns })
          )
        ])
      }
      return res
    })

    inject('pronoundb-profile-render', UserProfileBody.prototype, 'render', function (_, res) {
      if (this.props.section === 'USER_INFO') {
        res.props.children.props.children[1].props.children.props.__$pronouns = this.state?.__$pronouns
      }
      return res
    })

    inject('pronoundb-profile-info-render', UserProfileInfo.prototype, 'render', function (_, res) {
      if (this.props.__$pronouns) {
        res.props.children[0].props.className += ' has-pronouns'
        res.props.children[0].props.children.push([
          React.createElement('div', { key: 'title', className: 'userInfoSectionHeader-CBvMDh' }, 'Pronouns'),
          React.createElement(
            'div',
            { key: 'pronouns', className: 'marginBottom8-AtZOdT size14-e6ZScH colorStandard-2KCXvj' },
            React.createElement(_this.Pronouns, { pronouns: this.props.__$pronouns })
          )
        ])
      }
      return res
    })

    function autocompleteFetch () {
      const items = this.props.children?.[0].props.children?.[1]
      if (!items || !items[0].props.user) return null

      let ids = items.map((item) => item.props.user.id)
      if (!ids) return

      ids = ids.filter((id) => !(id in this.state.__$pronouns))
      if (ids.length === 0) return

      // Mark ids as seen so they aren't re-fetched
      this.setState((state) => ({
        __$pronouns: {
          ...(state?.__$pronouns ?? {}),
          ...Object.fromEntries(ids.map((id) => [ id, null ]))
        }
      }))

      fetchPronounsBulk(ids).then((pronouns) => {
        this.setState((state) => ({
          __$pronouns: {
            ...(state?.__$pronouns ?? {}),
            ...pronouns
          }
        }))

        setTimeout(() => {
          let child = this._reactInternalFiber.child.child.child.child.sibling.child
          while (child) {
            child.stateNode.forceUpdate()
            child = child.sibling
          }
        }, 10)
      })
    }

    inject('pronoundb-autocomplete-mount', Autocomplete.prototype, 'componentDidMount', function () {
      this.state = { __$pronouns: {} }
      autocompleteFetch.call(this)
    })
    inject('pronoundb-autocomplete-update', Autocomplete.prototype, 'componentDidUpdate', autocompleteFetch)

    inject('pronoundb-autocomplete-render', Autocomplete.prototype, 'render', function (_, res) {
      if (!this.state?.__$pronouns) return res

      const items = res.props.children.props.children[0].props.children?.[1]
      if (!items|| !items[0].props.user) return res

      for (const item of items) {
        item.props.__$pronouns = this.state.__$pronouns[item.props.user.id]
      }
    
      return res
    })

    inject('pronoundb-autocomplete-render-row', Autocomplete.User.prototype, 'renderContent', function (_, res) {
      if (!this.props.__$pronouns) return res

      const section = res.props.children[2].props.children
      section.push(
        React.cloneElement(
          section[0],
          { style: { marginLeft: 4 } },
          ' • ',
          React.createElement(_this.Pronouns, { pronouns: this.props.__$pronouns })
        )
      )

      return res
    })

    // Generic data fetching
    inject('pronoundb-popout-mount', UserPopOut.prototype, 'componentDidMount', this._fetchPronounsInReact)
    inject('pronoundb-profile-mount', UserProfileBody.prototype, 'componentDidMount', this._fetchPronounsInReact)
    inject('pronoundb-profile-update', UserProfileBody.prototype, 'componentDidUpdate', this._fetchPronounsInReact)
  }

  pluginWillUnload () {
    uninject('pronoundb-messages-list')
    uninject('pronoundb-messages-header')
    uninject('pronoundb-popout-render')
    uninject('pronoundb-profile-render')
    uninject('pronoundb-profile-info-render')
    uninject('pronoundb-autocomplete-mount')
    uninject('pronoundb-autocomplete-update')
    uninject('pronoundb-autocomplete-render')
    uninject('pronoundb-autocomplete-render-row')

    uninject('pronoundb-popout-mount')
    uninject('pronoundb-profile-mount')
    uninject('pronoundb-profile-update')
  }

  async _getMessages () {
    const fnMessagesWrapper = await getModule(m => (m.__powercordOriginal_type || m.type)?.toString().includes('getOldestUnreadMessageId'))
    return wrapInHooks(() => fnMessagesWrapper.type({ channel: { getGuildId: () => 'a' } }).props.children.type)()
  }

  async _getMessageHeader () {
    return getModule([ 'MessageTimestamp' ])
  }

  async _getUserPopOut () {
    const fnUserPopOut = await getModuleByDisplayName('ConnectedUserPopout')
    return wrapInHooks(() => fnUserPopOut({ user: { isNonUserBot: () => void 0 } }).type)()
  }

  async _getUserProfileBody () {
    const UserProfile = await getModuleByDisplayName('UserProfile')
    const VeryDecoratedUserProfileBody = UserProfile.prototype.render().type
    const DecoratedUserProfileBody = this._extractFromFlux(VeryDecoratedUserProfileBody).render().type
    return DecoratedUserProfileBody.prototype.render.call({ props: { forwardedRef: null } }).type
  }

  async _getUserProfileInfo () {
    const UserProfile = await this._getUserProfileBody()
    const fakeThis = {
      getMode: () => null,
      renderHeader: () => null,
      renderCustomStatusActivity: () => null,
      renderTabBar: UserProfile.prototype.renderTabBar.bind({ props: {}, isCurrentUser: () => true }),
      props: {}
    }

    return this._extractFromFlux(
      UserProfile.prototype.render.call(fakeThis).props.children.props.children[1].props.children.type
    )
  }

  async _getAutocomplete () {
    return getModuleByDisplayName('Autocomplete')
  }

  _extractFromFlux (FluxContainer) {
    return FluxContainer.prototype.render.call({ memoizedGetStateFromStores: () => null }).type
  }

  _fetchPronounsInReact ([ prevProps ]) {
    if (!this.props.user || this.props.user.bot) return

    if (prevProps && this.props.user.id !== prevProps.user.id) {
      this.setState({ __$pronouns: null })
    }

    fetchPronouns(this.props.user.id).then(pronouns => this.setState({ __$pronouns: pronouns }))
  }
}

module.exports = PronounDB
