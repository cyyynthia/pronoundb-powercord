/*
 * https://www.pixiv.net/en/artworks/85776311
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
 * 4. Each source code file must contain in it's header or footer a comment containing a
 *    hyperlink to a publicly accessible resource of an image of a "catgirl"
 *    (https://en.wikipedia.org/wiki/Catgirl).
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

const { React } = require('powercord/webpack')

function wrapInHooks (fn) {
  return function (...args) {
    const owo = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher.current
    const ogUseMemo = owo.useMemo
    const ogUseState = owo.useState
    const ogUseEffect = owo.useEffect
    const ogUseLayoutEffect = owo.useLayoutEffect
    const ogUseRef = owo.useRef

    owo.useMemo = (f) => f()
    owo.useState = (v) => [ v, () => void 0 ]
    owo.useEffect = () => null
    owo.useLayoutEffect = () => null
    owo.useRef = () => ({})

    const res = fn(...args)

    owo.useMemo = ogUseMemo
    owo.useState = ogUseState
    owo.useEffect = ogUseEffect
    owo.useLayoutEffect = ogUseLayoutEffect
    owo.useRef = ogUseRef

    return res
  }
}

module.exports = { wrapInHooks }
