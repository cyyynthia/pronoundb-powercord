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

const { get } = require('powercord/http')
const { FluxDispatcher } = require('powercord/webpack')
const { shouldFetchPronouns } = require('./store.js')
const { FluxActions, Endpoints } = require('../constants.js')

async function doLoadPronouns (ids) {
  const pronouns = await get(Endpoints.LOOKUP_BULK(ids))
      .set('x-pronoundb-source', 'Powercord (v2.0.0)')
      .then(r => r.body)
      .catch(() => ({}))

  FluxDispatcher.dirtyDispatch({
    type: FluxActions.PRONOUNS_LOADED,
    pronouns: Object.assign(Object.fromEntries(Object.values(ids).map((id) => [ id, null ])), pronouns)
  })
}

let timer = null
let buffer = []

module.exports = {
  loadPronouns: (id) => {
    if (!shouldFetchPronouns(id) || buffer.includes(id)) return

    if (!timer) {
      timer = setTimeout(() => {
        doLoadPronouns(buffer)
        buffer = []
        timer = null
      }, 50)
    }

    buffer.push(id)
  }
}
