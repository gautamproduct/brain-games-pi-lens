// One-off asset generator: writes public/og.png + public/apple-touch-icon.png.
// Run with: node scripts/gen-og.mjs   (needs @napi-rs/canvas installed locally)
import { createCanvas } from '@napi-rs/canvas'
import { writeFileSync, mkdirSync } from 'fs'

mkdirSync('public', { recursive: true })

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function drawLogo(ctx, cx, cy, r, lw) {
  const g = ctx.createLinearGradient(cx - r, cy + r, cx + r, cy - r)
  g.addColorStop(0, '#00e6ff')
  g.addColorStop(1, '#7b6cff')
  ctx.save()
  ctx.shadowColor = 'rgba(0,212,255,0.55)'
  ctx.shadowBlur = lw * 0.9
  ctx.strokeStyle = g
  ctx.lineWidth = lw
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
  // dark lens
  ctx.save()
  ctx.translate(cx - r * 0.22, cy + r * 0.16)
  ctx.rotate(-0.34)
  ctx.fillStyle = '#0c1120'
  ctx.beginPath()
  ctx.ellipse(0, 0, r * 0.2, r * 0.28, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

// ---- OG image (1200x630) ----
{
  const W = 1200, H = 630
  const c = createCanvas(W, H)
  const ctx = c.getContext('2d')
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#101a36')
  bg.addColorStop(1, '#0a0712')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  drawLogo(ctx, 300, 300, 132, 52)

  // accent tiles under the logo
  const colors = ['#7c5cff', '#00d4ff', '#2ee6a6', '#ffd24a', '#ff5d6c']
  let x = 235
  for (const col of colors) {
    ctx.fillStyle = col
    roundRect(ctx, x, 478, 54, 54, 12)
    ctx.fill()
    x += 68
  }

  ctx.fillStyle = '#eef2ff'
  ctx.font = 'bold 92px Arial'
  ctx.fillText('Brain Games', 500, 280)
  ctx.fillStyle = '#00d4ff'
  ctx.font = 'bold 46px Arial'
  ctx.fillText('By: Pi Lens App', 502, 342)
  ctx.fillStyle = '#c3ccf2'
  ctx.font = '40px Arial'
  ctx.fillText('8 free brain games · daily challenge', 502, 422)
  ctx.fillStyle = '#8b96b5'
  ctx.font = '34px Arial'
  ctx.fillText('Live leaderboard · train your focus · play free', 502, 472)

  writeFileSync('public/og.png', c.toBuffer('image/png'))
}

// ---- apple touch icon (180x180) ----
{
  const S = 180
  const c = createCanvas(S, S)
  const ctx = c.getContext('2d')
  const bg = ctx.createLinearGradient(0, 0, S, S)
  bg.addColorStop(0, '#36245c')
  bg.addColorStop(0.55, '#1b1232')
  bg.addColorStop(1, '#0a0712')
  roundRect(ctx, 0, 0, S, S, 40)
  ctx.fillStyle = bg
  ctx.fill()
  drawLogo(ctx, S / 2, S / 2, 54, 20)
  writeFileSync('public/apple-touch-icon.png', c.toBuffer('image/png'))
}

console.log('wrote public/og.png and public/apple-touch-icon.png')
