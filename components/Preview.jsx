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

const { React, getModule } = require('powercord/webpack');
const { WEBSITE } = require('../constants.js');

const ChannelMessage = getModule([ 'getElementFromMessageId' ], false).default;
const Message = getModule(m => m.prototype && m.prototype.getReaction && m.prototype.isSystemDM, false);
const DiscordSettings = getModule([ 'MessageDisplayCompact' ], false);
const { getCurrentUser } = getModule([ 'getCurrentUser', 'getUser' ], false);

const CHANNEL = {
  isPrivate: () => false,
  isSystemDM: () => false,
  getGuildId: () => 'uwu',
  isThread: () => false,
  isArchivedThread: () => false,
  isForumChannel: () => false,
  isForumPost: () => false,
};

const EMOJIS = [ '🎀', '🍩', '🍭', '☕', '🌸', '🌹', '🐿️', '🐈', '👒', '🧣' ]

function useMessages () {
  const emoji = React.useMemo(() => {
    const today = new Date()
    if (today.getUTCMonth() === 4 && today.getUTCDate() === 30)
      return '🎂'
    if (today.getUTCMonth() === 6 && today.getUTCDate() === 14)
      return '🇫🇷'

    return EMOJIS[Math.floor(Math.random() * EMOJIS.length)]
  })

  return React.useMemo(() => [
    new Message({
      id: 'pronoundb-fake-1',
      type: 0,
      author: getCurrentUser(),
      content: 'Hey look, its me 🤩'
    }),
    new Message({
      id: 'pronoundb-fake-2',
      type: 0,
      author: {
        id: '94762492923748352',
        username: `Cynthia ${emoji}`,
        toString: () => `Cynthia ${emoji}`,
        isSystemUser: () => false,
        isVerifiedBot: () => false,
        isNonUserBot: () => false,
        getAvatarURL: () => 'https://powercord.dev/api/v3/avatars/94762492923748352.png'
      },
      content: `By the way, to share your own pronouns go to ${WEBSITE} and set them there. <a:ablobcatheart:501940715077763072>`
    })
  ])
}

function Settings ({ appearance }) {
  const compact = DiscordSettings.MessageDisplayCompact.useSetting()
  const [ message1, message2 ] = useMessages()

  return (
    <ul className={`group-spacing-${compact ? '0' : '16'} pronoundb-preview`}>
      <ChannelMessage
        compact={compact}
        channel={CHANNEL}
        message={message1}
        id={`uwu-1-${appearance}`}
        groupId='pronoundb-fake-1'
      />
      <ChannelMessage
        compact={compact}
        channel={CHANNEL}
        message={message2}
        id={`uwu-2-${appearance}`}
        groupId='pronoundb-fake-2'
      />
    </ul>
  );
}

module.exports = React.memo(Settings);
