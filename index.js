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
const { findInReactTree } = require('powercord/util')
const { wrapInHooks } = require('./util.js')

const Pronouns = require('./components/Pronouns.js')
const Settings = require('./components/Settings.jsx')

class PronounDB extends Plugin {
  async startPlugin () {
    this.loadStylesheet('style.css')
    powercord.api.settings.registerSettings('pronoundb', {
      category: this.entityID,
      label: 'PronounDB',
      render: Settings
    })

    const _this = this;
    const MessageHeader = await this._getMessageHeader()
    const UserPopOut = await this._getUserPopOut()
    const UserProfileInfo = await this._getUserProfileInfo()
    const Autocomplete = await this._getAutocomplete()

    inject('pronoundb-messages-header', MessageHeader, 'default', function ([ props ], res) {
      res.props.children[1].props.children.push(
        React.createElement(
          'span',
          { style: { color: 'var(--text-muted)', fontSize: '.9rem', marginRight: props.compact ? '.6rem' : '' } },
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
            React.createElement('div', { className: 'bodyTitle-Y0qMQz marginBottom8-AtZOdT size12-3R0845' }, 'Pronouns'),
            React.createElement('div', { className: 'marginBottom8-AtZOdT size14-e6ZScH' }, p)
          )
        })
      )

      return res
    })

    inject('pronoundb-profile-render', UserProfileInfo.prototype, 'render', function (_, res) {
      res.props.children[0].props.children.push(
        React.createElement(Pronouns, {
          userId: this.props.user.id,
          region: 'profile',
          render: (p) => React.createElement(
            React.Fragment,
            null,
            React.createElement('div', { className: 'userInfoSectionHeader-CBvMDh' }, 'Pronouns'),
            React.createElement('div', { className: 'marginBottom8-AtZOdT size14-e6ZScH colorStandard-2KCXvj' }, p)
          )
        })
      )

      return res
    })

    inject('pronoundb-autocomplete-render', Autocomplete.User.prototype, 'renderContent', function (_, res) {
      if (!_this.settings.get('display-autocomplete', true)) return res

      const section = res.props.children[2].props.children
      section.push(
        React.crateElement('span', null, React.createElement(Pronouns, { userId: this.props.user.id, region: 'autocomplete', prefix: ' • ' }))
      )

      return res
    })
  }

  pluginWillUnload () {
    powercord.api.settings.unregisterSettings('pronoundb')
    uninject('pronoundb-messages-header')
    uninject('pronoundb-popout-render')
    uninject('pronoundb-profile-render')
    uninject('pronoundb-autocomplete-render')
  }

  async _getMessageHeader () {
    return getModule([ 'MessageTimestamp' ])
  }

  async _getUserPopOut () {
    const fnUserPopOut = await getModuleByDisplayName('ConnectedUserPopout')
    return wrapInHooks(() => fnUserPopOut({ user: { isNonUserBot: () => void 0 } }).type)()
  }

  async _getUserProfileInfo () {
    const VeryVeryDecoratedUserProfile = await getModuleByDisplayName('UserProfile')
    const VeryDecoratedUserProfileBody = VeryVeryDecoratedUserProfile.prototype.render().type
    const DecoratedUserProfileBody = this._extractFromFlux(VeryDecoratedUserProfileBody).render().type
    const UserProfile = DecoratedUserProfileBody.prototype.render.call({ props: { forwardedRef: null } }).type

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
}

module.exports = PronounDB
