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

const { get: porkordGet } = require('powercord/http')
const { Pronouns, Endpoints } = require('./constants')

function get (url) {
  return porkordGet(url)
    .set('x-pronoundb-source', 'Powercord (v0.0.0-unknown)')
    .then(r => r.body)
    .catch(() => ({}))
}

function createDeferred () {
  let deferred = {}
  deferred.promise = new Promise(resolve => Object.assign(deferred, { resolve }))
  return deferred
}

const cache = {}
function fetchPronouns (id) {
  if (!cache[id]) {
    cache[id] = get(Endpoints.LOOKUP(id))
      .then(data => data.pronouns ? Pronouns[data.pronouns] : null)
  }
  return cache[id]
}

async function fetchPronounsBulk (ids) {
  const toFetch = []
  const res = {}
  const def = {}
  for (const id of ids) {
    if (cache[id]) {
      res[id] = await cache[id]
    } else {
      def[id] = createDeferred()
      cache[id] = def[id].promise
      toFetch.push(id)
    }
  }

  if (toFetch.length > 0) {
    const data = await get(Endpoints.LOOKUP_BULK(toFetch))
    for (const id of toFetch) {
      const pronouns = data[id] ? Pronouns[data[id]] : null
      def[id].resolve(pronouns)
      res[id] = pronouns
    }
  }

  return res
}

module.exports = { fetchPronouns, fetchPronounsBulk }
