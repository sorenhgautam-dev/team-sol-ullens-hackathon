import { describe, expect, it } from 'vitest'
import { personFrame, personRows } from '../people'
import { HEADS } from '../peopleArt'

describe('people sprites', () => {
  it('every hairstyle, top, facing and walk step puts together a clean 16x24 frame', () => {
    for (const style of Object.keys(HEADS))
      for (const top of ['shirt', 'kurta'])
        for (const face of ['down', 'up', 'right'])
          for (let step = 0; step < 4; step++) {
            const rows = personRows(`${style}_${top}_${face}${step}`)
            expect(rows, `${style} ${top} ${face} ${step}`).not.toBeNull()
            expect(rows).toHaveLength(24)
            for (const row of rows!) {
              expect(row).toHaveLength(16)
              expect(row).toMatch(/^[.ohHdsSemcCktpPfF]+$/)
            }
          }
  })

  it('looks pick the right frame: the old braid flag still means long hair and a kurta', () => {
    expect(personFrame({ shirt: '#fff', trim: '#000', braid: true }, 'left', 5)).toBe('long_kurta_right1')
    expect(personFrame({ shirt: '#fff', trim: '#000', style: 'cap' }, 'down', 0)).toBe('cap_shirt_down0')
  })
})
