/** Ask Builder templates (English). Placeholders: {bill}, {amount}, {fromDay}, {toDay}, {payday}, {name}. */
export type AskRecipient = 'landlord' | 'school' | 'employer' | 'provider'

export const ASK_RECIPIENTS: { id: AskRecipient; emoji: string; labelKey: string }[] = [
  { id: 'landlord', emoji: '🏘️', labelKey: 'ask.landlord' },
  { id: 'school', emoji: '🎒', labelKey: 'ask.school' },
  { id: 'employer', emoji: '💼', labelKey: 'ask.employer' },
  { id: 'provider', emoji: '📶', labelKey: 'ask.provider' },
]

export const ASK_TEMPLATES: Record<AskRecipient, string> = {
  landlord:
    'Namaste. I am writing about the {bill} of {amount}, currently due on the {fromDay}. My income arrives on the {payday}, so the money is always there a few days later than the due date. Could we move the due date to the {toDay} starting next month? I will pay the full amount on that date every month and let you know early if anything changes. Thank you for considering it.',
  school:
    'Dear office, I am writing about the {bill} of {amount} due on the {fromDay}. Our household income arrives on the {payday}. Could the fee be paid on the {toDay} instead? The full amount will be paid on that date, and I am happy to confirm this in writing. Thank you.',
  employer:
    'Dear sir/madam, I would like to ask whether my pay could be split into two dates, or moved so that it arrives before the {fromDay}, when my largest bill ({bill}, {amount}) is due. Even a change of a few days would remove a gap I face every month. Thank you for considering this.',
  provider:
    'Hello, I would like to change the billing date for my {bill} of {amount} from the {fromDay} to the {toDay}, which is after my income arrives on the {payday}. Please let me know if this can be set up, or if there is a form I should fill in. Thank you.',
}
