var entities = require('powercord/entities');
var http = require('powercord/http');
var injector = require('powercord/injector');
var webpack = require('powercord/webpack');
var settings = require('powercord/components/settings');
var components = require('powercord/components');

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
function wrapInHooks(fn) {
  return function (React, ...args) {
    const owo = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher.current;
    const ogUseMemo = owo.useMemo;
    const ogUseState = owo.useState;
    const ogUseEffect = owo.useEffect;
    const ogUseLayoutEffect = owo.useLayoutEffect;
    const ogUseRef = owo.useRef;

    owo.useMemo = f => f();

    owo.useState = v => [v, () => void 0];

    owo.useEffect = () => null;

    owo.useLayoutEffect = () => null;

    owo.useRef = () => ({});

    const res = fn(...args);
    owo.useMemo = ogUseMemo;
    owo.useState = ogUseState;
    owo.useEffect = ogUseEffect;
    owo.useLayoutEffect = ogUseLayoutEffect;
    owo.useRef = ogUseRef;
    return res;
  };
}

const extractMessages = wrapInHooks(function (fnMessagesWrapper) {
  return fnMessagesWrapper({
    channel: {
      getGuildId: () => 'a'
    }
  }).props.children.type;
});
const extractUserPopOut = wrapInHooks(f => f({
  user: {
    isNonUserBot: () => void 0
  }
}).type);
function extractUserProfileBody(UserProfile) {
  const VeryDecoratedUserProfileBody = UserProfile.prototype.render().type;
  const DecoratedUserProfileBody = extractFromFlux(VeryDecoratedUserProfileBody).render().type;
  return DecoratedUserProfileBody.prototype.render.call({
    props: {
      forwardedRef: null
    }
  }).type;
}
function extractUserProfileInfo(UserProfile) {
  const fakeThis = {
    getMode: () => null,
    renderHeader: () => null,
    renderCustomStatusActivity: () => null,
    renderTabBar: UserProfile.prototype.renderTabBar.bind({
      props: {},
      isCurrentUser: () => true
    }),
    props: {}
  };
  return extractFromFlux(UserProfile.prototype.render.call(fakeThis).props.children.props.children[1].props.children.type);
}
function extractFromFlux(FluxContainer) {
  return FluxContainer.prototype.render.call({
    memoizedGetStateFromStores: () => null
  }).type;
}

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

const Pronouns = Object.freeze({
  unspecified: null,
  avoid: 'Avoid pronouns, use my name',
  any: 'Any pronouns',
  // -- Contributors: please keep the list sorted alphabetically.
  hh: 'he/him',
  hs: 'he/she',
  ht: 'he/they',
  shh: 'she/he',
  sh: 'she/her',
  st: 'she/they',
  th: 'they/he',
  ts: 'they/she',
  tt: 'they/them',
  // --
  other: 'Other pronouns',
  other_ask: 'Other pronouns (Ask me)'
});
const PlatformNames = Object.freeze({
  discord: 'Discord',
  github: 'GitHub',
  twitch: 'Twitch',
  twitter: 'Twitter'
});
const WEBSITE =  'https://pronoundb.org';
const Endpoints = Object.freeze({
  LOOKUP: (platform, id) => `${WEBSITE}/api/v1/lookup?platform=${platform}&id=${id}`,
  LOOKUP_BULK: (platform, ids) => `${WEBSITE}/api/v1/lookup-bulk?platform=${platform}&ids=${ids.join(',')}`
});

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

function createDeferred() {
  let deferred = {};
  deferred.promise = new Promise(resolve => Object.assign(deferred, {
    resolve
  }));
  return deferred;
}

function doFetchSingle(platform, id) {
  if (fetchPronouns.__customFetch) {
    // Powercord, BD, ...
    return fetchPronouns.__customFetch(platform, id);
  } // Use background script


  return new Promise(resolve => chrome.runtime.sendMessage({
    kind: 'http',
    target: 'lookup',
    platform,
    id
  }, function (res) {
    if (res.success) return resolve(res.data);
    console.error('[PronounDB] Failed to fetch:', res.error);
  }));
}

function doFetchBulk(platform, ids) {
  if (fetchPronounsBulk.__customFetch) {
    // Powercord, BD, ...
    return fetchPronounsBulk.__customFetch(platform, ids);
  } // Use background script


  return new Promise(resolve => chrome.runtime.sendMessage({
    kind: 'http',
    target: 'lookup-bulk',
    platform,
    ids
  }, function (res) {
    if (res.success) return resolve(res.data);
    console.error('[PronounDB] Failed to fetch:', res.error);
  }));
}

const cache = {};
function fetchPronouns(platform, id) {
  if (!cache[platform]) cache[platform] = {};

  if (!cache[platform][id]) {
    cache[platform][id] = doFetchSingle(platform, id).then(data => data.pronouns ? Pronouns[data.pronouns] : null);
  }

  return cache[platform][id];
}
async function fetchPronounsBulk(platform, ids) {
  if (!cache[platform]) cache[platform] = {};
  const toFetch = [];
  const res = {};
  const def = {};

  for (const id of ids) {
    if (cache[platform][id]) {
      res[id] = await cache[platform][id];
    } else {
      def[id] = createDeferred();
      cache[platform][id] = def[id].promise;
      toFetch.push(id);
    }
  }

  if (toFetch.length > 0) {
    const data = await doFetchBulk(platform, toFetch);

    for (const id of toFetch) {
      const pronouns = data[id] ? Pronouns[data[id]] : null;
      def[id].resolve(pronouns);
      res[id] = pronouns;
    }
  }

  return res;
}

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

function doReq(url) {
  return http.get(url).set('x-pronoundb-source', 'Powercord (v0.1.0-powercord)').then(r => r.body).catch(() => ({}));
}

fetchPronouns.__customFetch = (platform, id) => doReq(Endpoints.LOOKUP(platform, id));

fetchPronounsBulk.__customFetch = (platform, ids) => doReq(Endpoints.LOOKUP_BULK(platform, ids));

const injections = [];
function inject(mdl, meth, repl) {
  const iid = `pronoundb-${mdl.constructor.displayName || mdl.constructor.name}-${meth}`;
  injector.inject(iid, mdl, meth, repl);
  injections.push(iid);
}
const Settings = webpack.React.memo(function ({
  getSetting,
  toggleSetting
}) {
  return webpack.React.createElement(webpack.React.Fragment, null, webpack.React.createElement(components.FormNotice, {
    type: 'cardPrimary',
    className: 'marginBottom20-32qID7',
    body: webpack.React.createElement(webpack.React.Fragment, null, 'To set your pronouns, go to ', webpack.React.createElement('a', {
      href: WEBSITE,
      target: '_blank'
    }, WEBSITE), ' and link your Discord account.')
  }), webpack.React.createElement(settings.SwitchItem, {
    value: getSetting('showInChat', true),
    onChange: () => toggleSetting('showInChat', true)
  }, 'Show pronouns in chat'));
});
function exporter(exp) {
  class PronounDB extends entities.Plugin {
    startPlugin() {
      exp();
    }

    pluginWillUnload() {
      injections.forEach(i => injector.uninject(i));
    }

  }

  module.exports = PronounDB;
}
async function getModules() {
  const fnMessagesWrapper = await webpack.getModule(m => {
    var _m$type;

    return (_m$type = m.type) == null ? void 0 : _m$type.toString().includes('getOldestUnreadMessageId');
  });
  const UserProfile = await webpack.getModuleByDisplayName('UserProfile');
  const fnUserPopOut = await webpack.getModuleByDisplayName('UserPopout');
  const MessageHeader = await webpack.getModule(['MessageTimestamp']);
  const UserProfileBody = extractUserProfileBody(UserProfile);
  return {
    React: webpack.React,
    Messages: extractMessages(webpack.React, fnMessagesWrapper.type),
    MessageHeader,
    UserProfileBody,
    UserProfileInfo: extractUserProfileInfo(UserProfileBody),
    UserPopOut: extractUserPopOut(webpack.React, fnUserPopOut)
  };
}

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

function run() {
  exporter(async function () {
    const {
      React,
      Messages,
      MessageHeader,
      UserPopOut,
      UserProfileBody,
      UserProfileInfo
    } = await getModules();
    const PronounsWrapper = React.memo(props => {
      const [pronouns, setPronouns] = React.useState({});
      React.useEffect(() => {
        const toFetch = [...new Set(props.items.filter(i => i.props.message && !i.props.message.author.bot).map(i => i.props.message.author.id))];
        fetchPronounsBulk('discord', toFetch).then(setPronouns);
      }, [props.items]);
      const elements = React.useMemo(() => {
        const res = [];

        for (const i of props.items) {
          var _i$props$message;

          const authorId = (_i$props$message = i.props.message) == null ? void 0 : _i$props$message.author.id;

          if (authorId && pronouns[authorId]) {
            const message = window._.clone(i.props.message);

            message.__$pronouns = pronouns[authorId];
            res.push(React.cloneElement(i, {
              message
            }));
          } else {
            res.push(i);
          }
        }

        return res;
      }, [props.items, pronouns]);
      return React.createElement(React.Fragment, null, ...elements);
    });
    inject(Messages, 'type', function (_, res) {
      // ok discord, if you can't make up your mind I'll do it for ya
      console.log(res.props.children.props.children[1].props);

      if (typeof res.props.children.props.children[1].props.children === 'function') {
        const ogFn = res.props.children.props.children[1].props.children;

        res.props.children.props.children[1].props.children = function (e) {
          const res = ogFn(e);
          const items = res.props.children.props.children[1];
          res.props.children.props.children[1] = React.createElement(PronounsWrapper, {
            items
          });
          return res;
        };
      } else {
        const target = res.props.children.props.children[1].props.children.props.children;
        target[1] = React.createElement(PronounsWrapper, {
          items: target[1]
        });
      }

      return res;
    });
    inject(MessageHeader, 'default', function ([props], res) {
      if (props.message.__$pronouns) {
        res.props.children[1].props.children.push(React.createElement('span', {
          style: {
            color: 'var(--text-muted)',
            fontSize: '.9rem',
            marginRight: props.compact ? '.6rem' : ''
          }
        }, ' • ', props.message.__$pronouns));
      }

      return res;
    }); // User pop-out/profile

    function loadPronouns([prevProps]) {
      if (!this.props.user || this.props.user.bot) return;

      if (prevProps && this.props.user.id !== prevProps.user.id) {
        this.setState({
          __$pronouns: null
        });
      }

      fetchPronouns('discord', this.props.user.id).then(pronouns => this.setState({
        __$pronouns: pronouns
      }));
    } // State management


    inject(UserPopOut.prototype, 'componentDidMount', loadPronouns);
    inject(UserProfileBody.prototype, 'componentDidMount', loadPronouns);
    inject(UserProfileBody.prototype, 'componentDidUpdate', loadPronouns); // Render

    inject(UserPopOut.prototype, 'renderBody', function (_, res) {
      var _this$state;

      if ((_this$state = this.state) != null && _this$state.__$pronouns) {
        res.props.children.props.children.push([React.createElement('div', {
          key: 'title',
          className: 'bodyTitle-Y0qMQz marginBottom8-AtZOdT size12-3R0845'
        }, 'Pronouns'), React.createElement('div', {
          key: 'pronouns',
          className: 'marginBottom8-AtZOdT size14-e6ZScH'
        }, this.state.__$pronouns)]);
      }

      return res;
    });
    inject(UserProfileBody.prototype, 'render', function (_, res) {
      if (this.props.section === 'USER_INFO') {
        var _this$state2;

        res.props.children.props.children[1].props.children.props.__$pronouns = (_this$state2 = this.state) == null ? void 0 : _this$state2.__$pronouns;
      }

      return res;
    });
    inject(UserProfileInfo.prototype, 'render', function (_, res) {
      if (this.props.__$pronouns) {
        res.props.children[0].props.children.push([React.createElement('div', {
          key: 'title',
          className: 'userInfoSectionHeader-CBvMDh'
        }, 'Pronouns'), React.createElement('div', {
          key: 'pronouns',
          className: 'marginBottom8-AtZOdT size14-e6ZScH colorStandard-2KCXvj'
        }, this.props.__$pronouns)]);
      }

      return res;
    });
  });
}
const match = /^https:\/\/(.+\.)?discord\.com\/(channels|activity|login|app|library|store)/;
const displayName = 'Discord';
run();

exports.displayName = displayName;
exports.match = match;
exports.run = run;
