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
const discordSettings = getModule([ 'messageDisplayCompact' ], false);

const CHANNEL = {
  isPrivate: () => false,
  isSystemDM: () => false,
  getGuildId: () => 'uwu',
  isArchivedThread: () => false
};

const MESSAGE = new Message({
  id: 'pronoundb-fake',
  type: 0,
  author: {
    id: '94762492923748352',
    username: 'Cynthia 🌹',
    toString: () => 'Cynthia 🌹',
    isSystemUser: () => false,
    isVerifiedBot: () => false,
    getAvatarURL: () => 'https://powercord.dev/api/v2/avatar/94762492923748352.png'
  },
  content: `By the way, to share your own pronouns go to ${WEBSITE} and set them there. <a:ablobcatheart:501940715077763072>`
});

function Settings ({ appearance }) {
  return (
    <div className='pronoundb-preview'>
      <ChannelMessage
        compact={discordSettings.messageDisplayCompact}
        channel={CHANNEL}
        message={MESSAGE}
        id={`uwu-${appearance}`}
        groupId='pronoundb-fake'
      />
    </div>
  );
}

module.exports = React.memo(Settings);
