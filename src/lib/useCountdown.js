import { useEffect, useRef, useState } from 'react'

// Counts down from durationMs while `running`. Calls onEnd once when it hits 0.
export function useCountdown(durationMs, running, onEnd) {
  const [left, setLeft] = useState(durationMs)
  const endRef = useRef(0)
  const firedRef = useRef(false)
  const onEndRef = useRef(onEnd)
  onEndRef.current = onEnd

  useEffect(() => {
    if (!running) return
    endRef.current = performance.now() + durationMs
    firedRef.current = false
    const id = setInterval(() => {
      const rem = Math.max(0, endRef.current - performance.now())
      setLeft(rem)
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
