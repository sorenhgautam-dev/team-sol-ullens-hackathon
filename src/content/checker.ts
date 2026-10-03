/** The Scam Checker's five questions and how many "yes" answers mean what. Not a keyword score. */
export const CHECK_QUESTIONS = ['code', 'rush', 'first', 'fee', 'guaranteed'] as const
export type CheckQuestion = (typeof CHECK_QUESTIONS)[number]
export type CheckAnswer = 'yes' | 'no' | 'unsure'

export function flagsResult(answers: Partial<Record<CheckQuestion, CheckAnswer>>): 'none' | 'some' | 'many' {
  const yes = Object.values(answers).filter((a) => a === 'yes').length
  return yes >= 3 ? 'many' : yes >= 1 ? 'some' : 'none'
}
