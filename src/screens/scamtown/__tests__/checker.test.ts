import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { CHECK_QUESTIONS, flagsResult } from '@/content/checker'
import { en } from '@/i18n/en'

describe('scam checker', () => {
  it('is a checklist: more yes answers mean more red flags, never a verdict of "safe"', () => {
    expect(flagsResult({})).toBe('none')
    expect(flagsResult({ rush: 'yes' })).toBe('some')
    expect(flagsResult({ code: 'yes', rush: 'yes', fee: 'yes' })).toBe('many')
    expect(flagsResult({ code: 'unsure', rush: 'no' })).toBe('none')
  })

  it('asks the five questions and always says to verify, and that it can miss new scams', () => {
    expect(CHECK_QUESTIONS).toEqual(['code', 'rush', 'first', 'fee', 'guaranteed'])
    for (const q of CHECK_QUESTIONS) expect(`checker.q.${q}` in en).toBe(true)
    expect(en['checker.verify']).toMatch(/official number or website/)
    expect(en['checker.miss']).toMatch(/miss new scams/)
  })

  it('never stores pasted text (no storage API in the checker)', () => {
    const src = readFileSync(new URL('../CheckerSheet.tsx', import.meta.url), 'utf8')
    expect(src).not.toMatch(/localStorage|sessionStorage|indexedDB|persist\(|fetch\(/)
  })
})
