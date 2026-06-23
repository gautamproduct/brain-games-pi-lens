// Subtle, sweet confetti — a short gentle burst, no dependencies.
const COLORS = ['#7c5cff', '#00d4ff', '#2ee6a6', '#ffd24a', '#ff5d6c']

export function confetti({ count = 38, duration = 2000 } = {}) {
  if (typeof document === 'undefined') return
  const W = window.innerWidth
  const H = window.innerHeight
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  canvas.style.cssText =
    'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999'
  document.body.appendChild(canvas)
  const ctx = canvas.getContext('2d')

  const parts = Array.from({ length: count }, () => ({
    x: W / 2 + (Math.random() - 0.5) * W * 0.5,
    y: H * 0.34,
    vx: (Math.random() - 0.5) * 7,
    vy: Math.random() * -7 - 3,
    g: 0.16 + Math.random() * 0.09,
    size: 5 + Math.random() * 6,
    color: COLORS[(Math.random() * COLORS.length) | 0],
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.3,
  }))

  const start = performance.now()
  function frame(t) {
    const e = t - start
    ctx.clearRect(0, 0, W, H)
    ctx.globalAlpha = Math.max(0, 1 - e / duration)
    for (const p of parts) {
      p.vy += p.g
      p.x += p.vx
      p.y += p.vy
      p.rot += p.vr
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)
      ctx.fillStyle = p.color
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.62)
      ctx.restore()
    }
    if (e < duration) requestAnimationFrame(frame)
    else canvas.remove()
  }
  requestAnimationFrame(frame)
}
