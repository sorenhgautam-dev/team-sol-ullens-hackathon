/**
 * All sound effects are generated in code with ZzFX. Parameters are original.
 * Playback is gated by the Sound setting; haptics by the Haptics setting.
 */
import { zzfx, ZZFX } from 'zzfx'

export type SfxName =
  | 'coin'
  | 'thud'
  | 'buzz'
  | 'tick'
  | 'shield'
  | 'chime'
  | 'pop'
  | 'whoosh'
  | 'goodnight'
  | 'mailbox'
  | 'tap'
  | 'bad'
  | 'wardSaved'

// prettier-ignore
const PATCHES: Record<SfxName, (number | undefined)[]> = {
  coin:      [, , 1046, .01, .05, .14, 1, 1.6, , , 520, .05, , , , , , .6, .03],
  thud:      [1.2, , 90, .01, .08, .22, 4, 2.2, -4, , , , , 1.1, , .2, , .7, .05],
  buzz:      [.8, , 160, .02, .18, .18, 2, .4, , , , , , .6, , .1, , .5, .05, .2],
  tick:      [.4, , 1800, , .01, .03, 1, 1.2, , , , , , , , , , .5],
  shield:    [, , 660, .02, .12, .3, 1, 1.4, , , 330, .08, .04, , , , , .7, .05],
  chime:     [, , 880, .01, .14, .35, 1, 1.5, , , 220, .06, .06, , , , , .6, .08],
  pop:       [.7, , 520, .01, .03, .12, 1, 1.9, , , 180, .04, , , , , , .6, .02],
  whoosh:    [.6, , 200, .05, .2, .3, 4, .6, 12, , , , .1, , , , , .4, .1],
  goodnight: [.5, , 392, .05, .3, .6, 1, 1.1, , , 98, .2, .1, , , , , .5, .2],
  mailbox:   [.6, , 1318, .01, .08, .25, 1, 1.3, , , 659, .07, .03, , , , , .5, .05],
  tap:       [.3, , 700, , .02, .04, 1, 1.5, , , , , , , , , , .4],
  bad:       [1, , 140, .03, .2, .4, 3, 1.5, -2, , , , , .8, , .3, , .6, .1],
  wardSaved: [, , 523, .02, .2, .5, 1, 1.3, , , 262, .12, .08, , , , , .7, .1],
}

let enabled = true
let hapticsEnabled = true

export function setSoundEnabled(on: boolean) {
  enabled = on
}
export function setHapticsEnabled(on: boolean) {
  hapticsEnabled = on
}

/** Browsers need a user gesture before audio can start; call this from the first tap. */
export function unlockAudio() {
  try {
    if (ZZFX.x && ZZFX.x.state === 'suspended') void ZZFX.x.resume()
  } catch {
    /* no audio context available */
  }
}

export function play(name: SfxName) {
  if (!enabled) return
  try {
    ZZFX.volume = 0.25
    zzfx(...PATCHES[name])
  } catch {
    /* audio not available (SSR, tests, blocked autoplay) */
  }
}

export function haptic(pattern: number | number[] = 20) {
  if (!hapticsEnabled) return
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(pattern)
  } catch {
    /* ignore */
  }
}
