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

// todo: split in other file, more flags, more variants
const LesbianFlagPastel = [ '#a06083', '#d387b1', '#f4abd3', '#ffffff', '#e4accf', '#f4987c', '#c66b6b' ]

module.exports = function (avatar) {
  return new Promise((resolve) => {
    const prideScale = 2.5 / 40;

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = avatar
    img.addEventListener('load', () => {
      const scale = img.width * prideScale
      const strip = img.height / LesbianFlagPastel.length
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height

      const ctx = canvas.getContext('2d')
      if (true) {
        const delta = 1 / LesbianFlagPastel.length
        const start = delta / 2
        const gradient = ctx.createLinearGradient(0, 0, 0, img.height)
        gradient.addColorStop(0, LesbianFlagPastel[0])
        gradient.addColorStop(1, LesbianFlagPastel[LesbianFlagPastel.length - 1])

        for (let i = 0; i < LesbianFlagPastel.length; i++) {
          gradient.addColorStop(start + delta * i, LesbianFlagPastel[i])
        }

        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, img.width, img.height)
      } else {
        for (let i = 0; i < LesbianFlagPastel.length; i++) {
          ctx.fillStyle = LesbianFlagPastel[i]
          ctx.fillRect(0, i * strip, img.width, strip + 5)
        }
      }

      ctx.drawImage(img, scale, scale, img.width - scale * 2, img.height - scale * 2)
      resolve(canvas.toDataURL('image/png'))
    })
  })
}
