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

const { React } = require('powercord/webpack')
const { findInTree } = require('powercord/util')

// todo: yes
const FlagStrips = [ '#fde06d', '#fdca01', '#fff4b4', '#fff4b4', '#fff4b4', '#fdca01', '#fde06d' ]

function PrideFlag ({ width, height }) {
  const id = React.useMemo(() => Math.random().toString(36).slice(2), [])
  const strip = height / FlagStrips.length
  const len1 = FlagStrips.length - 1

  if (true) {
    const delta = 100 / FlagStrips.length
    const start = delta / 2
    const stops = FlagStrips.map((color, i) => React.createElement('stop', { offset: `${(start + delta * i).toFixed(3)}%`, 'stop-color': color }))
    return [
      React.createElement('linearGradient', { id: id, gradientTransform: 'rotate(90)' }, stops),
      React.createElement('rect', { x: 0, y: 0, width: width, height: height, fill: `url('#${id}')` })
    ]
  }

  return FlagStrips.map(
    (color, i) =>
      React.createElement('rect', {
        fill: color,
        width: width,
        height: (len1 === i ? 0 : 5) + strip,
        y: strip * i
      })
  )
}

// "cache"
const cache = { '94762492923748352': true, '343383572805058560': true }

function PrideRing ({ children: fe, userId: providedUserId }) {
  const ref = React.useRef()
  const [ userId, setUserId ] = React.useState(providedUserId)
  const [ pride, setPride ] = React.useState(userId && cache[userId]) // todo: api struct

  React.useEffect(() => {
    if (!userId) {
      const res = findInTree(ref.current.__reactInternalInstance$, (n) => n.user || n.message || n.participant, { walkable: [ 'memoizedProps', 'return' ]})
      if (res) setUserId(res.user?.id ?? res.message?.author.id ?? res.participant.id)
    }
  }, [ ref.current ])

  React.useEffect(() => {
    if (!userId) return

    if (userId in cache) {
      setPride(cache[userId])
      return
    }

    // todo: api call and all
    if (userId === '94762492923748352') setPride(true)
  }, [ userId ])

  const prideScale = 3 / 40;
  const scale = pride ? prideScale * fe.props.width : 0

  return (
    React.createElement(
      'g',
      { ...fe.props, ref: ref, style: { overflow: 'hidden' } },
      // todo: more pride flags
      pride && React.createElement(PrideFlag, fe.props),
      React.createElement(
        'foreignObject',
        { x: scale, y: scale, width: fe.props.width - scale * 2, height: fe.props.height - scale * 2, style: { borderRadius: '100%' } },
        fe.props.children
      )
    )
  )
}

function PrideAvatar (props) {
  return (
    React.createElement(
      'svg',
      {
        className: props.className,
        viewBox: `0 0 ${props.size} ${props.size}`,
        onClick: props.onClick,
        onContextMenu: props.onContextMenu,
        onKeyDown: props.onKeyDown,
        onMouseDown: props.onMouseDown
      },
      React.createElement(
        PrideRing,
        { userId: props.userId },
        React.createElement(
          'foreignObject',
          { width: props.size, height: props.size },
          React.createElement('img', { src: props.src, alt: '', style: { width: '100%', height: '100%' } })
        )
      )
    )
  )
}

module.exports = React.memo(PrideRing)
module.exports.PrideAvatar = React.memo(PrideAvatar)
