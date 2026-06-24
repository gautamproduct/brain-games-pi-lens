import { useEffect, useRef, useState } from 'react'

function vibe(ms) {
  try {
    if (navigator.vibrate) navigator.vibrate(ms)
  } catch {}
}

// Counts down from durationMs while `running`. Calls onEnd once when it hits 0.
// Adds a short haptic tick on each of the final 3 seconds for felt pressure.
export function useCountdown(durationMs, running, onEnd) {
  const [left, setLeft] = useState(durationMs)
  const endRef = useRef(0)
  const firedRef = useRef(false)
  const onEndRef = useRef(onEnd)
  const lastSecRef = useRef(null)
  onEndRef.current = onEnd

  useEffect(() => {
    if (!running) return
    endRef.current = performance.now() + durationMs
    firedRef.current = false
    lastSecRef.current = null
    const id = setInterval(() => {
      const rem = Math.max(0, endRef.current - performance.now())
      setLeft(rem)
      const sec = Math.ceil(rem / 1000)
      if (rem > 0 && rem <= 3000 && lastSecRef.current !== null && sec < lastSecRef.current) {
        vibe(22) // tick on each of the last 3 seconds
      }
      lastSecRef.current = sec
      if (rem <= 0 && !firedRef.current) {
        firedRef.current = true
        clearInterval(id)
        onEndRef.current && onEndRef.current()
      }
    }, 50)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, durationMs])

  return left
}
