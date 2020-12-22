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
const { fetchPronouns } = require('./fetch')
const { wrapInHooks } = require('./util')

const PronounsWrapper = require('./PronounsWrapper')

class PronounDB extends Plugin {
  async startPlugin () {
    this.loadStylesheet('style.css')

    const Messages = await this._getMessages()
    const MessageHeader = await this._getMessageHeader()
    const UserPopOut = await this._getUserPopOut()
    const UserProfileBody = await this._getUserProfileBody()
    const UserProfileInfo = await this._getUserProfileInfo()

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
          React.createElement('span', { style: { color: 'var(--text-muted)', fontSize: '.9rem', marginRight: props.compact ? '.6rem' : '' } }, ' • ', props.message.__$pronouns)
        )
      }
      return res
    })

    inject('pronoundb-popout-render', UserPopOut.prototype, 'renderBody', function (_, res) {
      if (this.state?.__$pronouns) {
        res.props.children.props.children.push([
          React.createElement('div', { key: 'title', className: 'bodyTitle-Y0qMQz marginBottom8-AtZOdT size12-3R0845' }, 'Pronouns'),
          React.createElement('div', { key: 'pronouns', className: 'marginBottom8-AtZOdT size14-e6ZScH' }, this.state.__$pronouns)
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
          React.createElement('div', { key: 'pronouns', className: 'marginBottom8-AtZOdT size14-e6ZScH colorStandard-2KCXvj' }, this.props.__$pronouns)
        ])
      }
      return res
    })

    // Data fetching
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
    const fnUserPopOut = await getModuleByDisplayName('UserPopout')
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
