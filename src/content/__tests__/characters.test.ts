import { describe, expect, it } from 'vitest'
import { CHARACTERS, NAME_MAX, cleanName } from '../characters'
import { en } from '@/i18n/en'

describe('character names are the player’s choice', () => {
  it('keeps names short and printable, in any script', () => {
    expect(cleanName('  Y/N  ')).toBe('Y/N')
    expect(cleanName('Ana-María')).toBe('Ana-María')
    expect(cleanName('सीता')).toBe('सीता')
    expect(cleanName('<script>x</script>')).toBe('scriptx/script')
    expect(cleanName('A'.repeat(40))).toHaveLength(NAME_MAX)
    expect(cleanName('   ')).toBe('')
  })

  it('stories use {name} instead of a fixed name or gendered words', () => {
    for (const c of CHARACTERS) {
      const story = en[c.storyKey as keyof typeof en]
      expect(story).toContain('{name}')
      expect(story).not.toMatch(/\b(she|he|her|his|him)\b/i)
      for (const k of [c.roleKey, c.badgeKey, c.freqKey, c.focusKey]) expect(k in en, k).toBe(true)
    }
  })
})
