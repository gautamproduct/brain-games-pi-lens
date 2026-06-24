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

// ---- OG image (1200x630) — premium minimalist ----
{
  const W = 1200, H = 630
  const c = createCanvas(W, H)
  const ctx = c.getContext('2d')

  // deep near-black background, faint cool tint
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#0b1124')
  bg.addColorStop(1, '#070610')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // soft glow behind the mark for depth
  const glow = ctx.createRadialGradient(330, 300, 20, 330, 300, 380)
  glow.addColorStop(0, 'rgba(70,130,255,0.18)')
  glow.addColorStop(1, 'rgba(70,130,255,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)

  // refined inset hairline frame
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'
  ctx.lineWidth = 1.5
  roundRect(ctx, 36, 36, W - 72, H - 72, 28)
  ctx.stroke()

  // the mark
  drawLogo(ctx, 322, 300, 116, 40)

  // text block — generous negative space, clean hierarchy
  const tx = 524
  ctx.fillStyle = '#f3f5ff'
  ctx.font = 'bold 96px Arial'
  ctx.fillText('Brain Games', tx, 300)

  ctx.fillStyle = '#3fc6ff'
  ctx.font = 'bold 34px Arial'
  ctx.fillText('by Pi Lens', tx + 4, 350)

  ctx.fillStyle = '#9aa6c8'
  ctx.font = '34px Arial'
  ctx.fillText('Daily brain challenges · live leaderboard', tx + 2, 432)

  ctx.fillStyle = 'rgba(255,255,255,0.30)'
  ctx.font = 'bold 25px Arial'
  ctx.fillText('brain-games-pi-lens.netlify.app', tx + 2, 540)

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
