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

function PrideRing ({ children: fe }) {
  const ref = React.useRef()
  const [ userId, setUserId ] = React.useState(null)
  const [ pride, setPride ] = React.useState(false) // todo: api struct

  React.useEffect(() => {
    const res = findInTree(ref.current.__reactInternalInstance$, (n) => n.user || n.message, { walkable: [ 'memoizedProps', 'return' ]})
    if (res) setUserId(res.user?.id ?? res.message.author.id)
  }, [ ref.current ])

  React.useEffect(() => {
    if (!userId) return

    // todo: api call and all
    if (userId === '94762492923748352') setPride(true)
  }, [ userId ])

  const prideScale = 3 / 40;
  const scale = pride ? prideScale * fe.props.width : 0

  return (
    React.createElement(
      'g',
      { ...fe.props, ref: ref },
      // todo: more pride flags
      pride && React.createElement(React.Fragment, null,
        React.createElement('rect', { fill: '#a06083', width: fe.props.width, height: '15%', y: '0%' }),
        React.createElement('rect', { fill: '#d387b1', width: fe.props.width, height: '15%', y: '14.3%' }),
        React.createElement('rect', { fill: '#f4abd3', width: fe.props.width, height: '15%', y: '28.6%' }),
        React.createElement('rect', { fill: '#ffffff', width: fe.props.width, height: '15%', y: '42.9%' }),
        React.createElement('rect', { fill: '#e4accf', width: fe.props.width, height: '15%', y: '57.2%' }),
        React.createElement('rect', { fill: '#f4987c', width: fe.props.width, height: '15%', y: '71.5%' }),
        React.createElement('rect', { fill: '#c66b6b', width: fe.props.width, height: '14.2%', y: '85.8%' })
      ),
      React.createElement(
        'foreignObject',
        { x: scale, y: scale, width: fe.props.width - scale * 2, height: fe.props.height - scale * 2, style: { borderRadius: '100%' } },
        fe.props.children
      )
    )
  )
}

module.exports = React.memo(PrideRing)
