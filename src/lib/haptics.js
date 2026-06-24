// Tiny haptic feedback helpers (mobile only; no-op where unsupported).
function buzz(p) {
  try {
    if (navigator.vibrate) navigator.vibrate(p)
  } catch {}
}
export const tapBuzz = () => buzz(7)
export const goodBuzz = () => buzz(13)
export const badBuzz = () => buzz([0, 28, 36, 28])
export const winBuzz = () => buzz([0, 16, 38, 16, 38, 28])
