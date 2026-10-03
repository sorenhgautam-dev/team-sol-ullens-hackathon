/**
 * Pixel portraits for the character cards (placeholder_portrait_*), 30×30 art pixels.
 * Each shows the character's job at a glance. Code-drawn until the team's art arrives.
 */
import type { CharacterId } from '@/content/characters'
import { px, type Ctx } from './sprites'

const SKIN = '#c98a5a'
const SKIN_DARK = '#a8704a'
const HAIR = '#2b1d10'

function face(ctx: Ctx, x: number, y: number) {
  px(ctx, x, y, 10, 11, SKIN)
  px(ctx, x, y + 9, 10, 2, SKIN_DARK)
  px(ctx, x + 2, y + 4, 2, 2, HAIR) // eyes
  px(ctx, x + 6, y + 4, 2, 2, HAIR)
  px(ctx, x + 3, y + 8, 4, 1, '#7a3a2a') // mouth
}

export function drawPortrait(ctx: Ctx, id: CharacterId) {
  // backdrop
  px(ctx, 0, 0, 30, 30, '#e4d2ac')
  px(ctx, 0, 22, 30, 8, '#d8c296')
  if (id === 'sita') {
    px(ctx, 7, 3, 16, 6, HAIR) // hair top
    px(ctx, 6, 7, 3, 16, HAIR) // long hair sides
    px(ctx, 21, 7, 3, 16, HAIR)
    face(ctx, 10, 7)
    px(ctx, 9, 13, 1, 2, '#e0a93b') // earrings
    px(ctx, 20, 13, 1, 2, '#e0a93b')
    px(ctx, 7, 20, 16, 10, '#d9734e') // kurta
    px(ctx, 12, 20, 6, 2, '#e0a93b') // neckline trim
    px(ctx, 9, 25, 12, 1, '#e0a93b')
    px(ctx, 23, 24, 5, 1, '#9a9aa8') // tape measure
    px(ctx, 26, 25, 1, 5, '#e0a93b')
  } else if (id === 'bikash') {
    px(ctx, 21, 14, 8, 10, '#e0a93b') // delivery box behind
    px(ctx, 22, 15, 6, 1, '#8a5300')
    face(ctx, 10, 8)
    px(ctx, 8, 4, 14, 5, '#18665f') // cap
    px(ctx, 8, 8, 17, 2, '#0f4a45') // brim
    px(ctx, 13, 5, 4, 2, '#2a8a80')
    px(ctx, 7, 20, 16, 10, '#3f7fa6') // jacket
    px(ctx, 14, 20, 2, 10, '#2b4566') // zip
    px(ctx, 9, 24, 3, 1, '#fbf4e2') // reflective stripe
    px(ctx, 18, 24, 3, 1, '#fbf4e2')
  } else {
    px(ctx, 9, 4, 12, 4, HAIR) // short hair, side part
    px(ctx, 9, 7, 2, 3, HAIR)
    px(ctx, 17, 4, 2, 1, '#5a3f28')
    face(ctx, 10, 7)
    px(ctx, 7, 20, 16, 10, '#6e6a80') // jacket
    px(ctx, 12, 20, 6, 10, '#fbf4e2') // shirt
    px(ctx, 14, 21, 2, 8, '#b23a30') // tie
    px(ctx, 13, 20, 4, 1, '#b23a30')
    px(ctx, 19, 25, 3, 2, '#2b4566') // lanyard badge
  }
}
