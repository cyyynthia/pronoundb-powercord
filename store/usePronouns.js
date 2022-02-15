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
const { React, FluxDispatcher } = require('powercord/webpack')
const { getPronouns, shouldFetchPronouns } = require('./store.js')
const { FluxActions, Endpoints } = require('../constants.js')

const SOURCE = `Powercord/2.0.0, Discord/${GLOBAL_ENV.RELEASE_CHANNEL}, Electron/${process.versions.electron}`

async function doLoadPronoun (id) {
  const pronouns = await get(Endpoints.LOOKUP(id))
      .set('x-pronoundb-source', SOURCE)
      .then((r) => r.body.pronouns || null)
      .catch(() => null)

  FluxDispatcher.dirtyDispatch({
    type: FluxActions.PRONOUNS_LOADED,
    pronouns: { [id]: pronouns }
  })

  return pronouns;
}

module.exports = function usePronouns (id) {
  const [ pronouns, setPronouns ] = React.useState(null)
  React.useEffect(() => {
    if (!shouldFetchPronouns(id)) {
      setPronouns(getPronouns(id) ?? 'unspecified')
      return
    }

    doLoadPronoun(id).then((p) => setPronouns(p ?? 'unspecified'))
  }, [ id ])

  return pronouns
}
