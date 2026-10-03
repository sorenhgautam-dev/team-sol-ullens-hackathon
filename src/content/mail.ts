/** Real letters that arrive in the mailbox (never scams). UI-only content; no money effect. */
export interface Letter {
  id: string
  day: number
  emoji: string
  fromKey: string
  subjectKey: string
  bodyKey: string
}

export const LETTERS: Letter[] = [
  { id: 'rent-reminder', day: 2, emoji: '🏘️', fromKey: 'mail.landlord', subjectKey: 'mail.rentReminder.subject', bodyKey: 'mail.rentReminder.body' },
  { id: 'school-notice', day: 6, emoji: '🎒', fromKey: 'mail.school', subjectKey: 'mail.schoolNotice.subject', bodyKey: 'mail.schoolNotice.body' },
  { id: 'partner-letter', day: 10, emoji: '✉️', fromKey: 'mail.partner', subjectKey: 'mail.partnerLetter.subject', bodyKey: 'mail.partnerLetter.body' },
  { id: 'electricity-bill', day: 11, emoji: '💡', fromKey: 'mail.utility', subjectKey: 'mail.electricity.subject', bodyKey: 'mail.electricity.body' },
  { id: 'landlord-note', day: 16, emoji: '🏘️', fromKey: 'mail.landlord', subjectKey: 'mail.landlordNote.subject', bodyKey: 'mail.landlordNote.body' },
  { id: 'coop-letter', day: 23, emoji: '🏦', fromKey: 'mail.coop', subjectKey: 'mail.coop.subject', bodyKey: 'mail.coop.body' },
]
