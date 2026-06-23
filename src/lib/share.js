// Build a square result card on a canvas and share it via the native share
// sheet (WhatsApp, etc.). Falls back to a WhatsApp text link.

const SITE = 'https://gautamproduct.github.io/brain-games-pi-lens/'

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function makeCard(game, result) {
  return new Promise((resolve) => {
    const S = 1080
    const c = document.createElement('canvas')
    c.width = S
    c.height = S
    const ctx = c.getContext('2d')

    // background
    const bg = ctx.createLinearGradient(0, 0, S, S)
    bg.addColorStop(0, '#0f1730')
    bg.addColorStop(1, '#0a0712')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, S, S)

    // accent panel
    const g = ctx.createLinearGradient(120, 240, 960, 840)
    g.addColorStop(0, game.g1)
    g.addColorStop(1, game.g2)
    ctx.fillStyle = g
    roundRect(ctx, 120, 240, 840, 600, 48)
    ctx.fill()

    ctx.textAlign = 'center'
    ctx.fillStyle = 'rgba(8,16,30,0.85)'

    // emoji
    ctx.font = '150px serif'
    ctx.fillText(game.emoji, S / 2, 470)

    // score
    ctx.fillStyle = '#08101e'
    ctx.font = '900 230px Inter, system-ui, sans-serif'
    ctx.fillText(String(result.score), S / 2, 700)

    // game name + summary
    ctx.font = '800 46px Inter, system-ui, sans-serif'
    ctx.fillText(game.name, S / 2, 770)
    ctx.font = '600 34px Inter, system-ui, sans-serif'
    ctx.fillText(result.summary || '', S / 2, 820)

    // header + footer
    ctx.fillStyle = '#eef2ff'
    ctx.font = '900 64px Inter, system-ui, sans-serif'
    ctx.fillText('Brain Games', S / 2, 150)
    ctx.fillStyle = '#00d4ff'
    ctx.font = '700 36px Inter, system-ui, sans-serif'
    ctx.fillText('By: Pi Lens App', S / 2, 200)
    ctx.fillStyle = '#8b96b5'
    ctx.font = '600 34px Inter, system-ui, sans-serif'
    ctx.fillText('Beat my score 👉 play free', S / 2, 940)
    ctx.fillStyle = '#eef2ff'
    ctx.font = '700 32px Inter, system-ui, sans-serif'
    ctx.fillText(SITE.replace('https://', ''), S / 2, 990)

    c.toBlob((b) => resolve(b), 'image/png')
  })
}

export async function shareResult(game, result) {
  const text = `I scored ${result.score} on ${game.name} 🧠 in Brain Games by Pi Lens!\nBeat me 👉 ${SITE}`
  try {
    const blob = await makeCard(game, result)
    if (blob) {
      const file = new File([blob], 'brain-games.png', { type: 'image/png' })
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text })
        return
      }
    }
    if (navigator.share) {
      await navigator.share({ text })
      return
    }
  } catch {
    // user cancelled or share unsupported — fall through to WhatsApp
  }
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
}
