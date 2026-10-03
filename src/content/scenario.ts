import type { Scenario } from '@/engine/types'
import { DEMO_BILLS } from './bills'
import { DEMO_EVENTS } from './events'
import { BRIDGES } from './bridges'
import { SCAMS } from './enemies'

/** Fixed demo seed. Must reproduce the Section 3 numbers (no remittance delay). */
export const DEMO_SEED = 20240501
/** Alternate seed in which Sita's remittance arrives 3 days late. */
export const DELAYED_SEED = 20240511

/** Section 3 baseline: bills only, no events. */
export const BASELINE_SCENARIO: Scenario = {
  id: 'baseline',
  days: 30,
  bills: DEMO_BILLS,
  events: [],
  bridges: BRIDGES,
  scams: [],
}

/** The playable demo month with all fixed-trigger events. */
export const DEMO_SCENARIO: Scenario = {
  id: 'demo',
  days: 30,
  bills: DEMO_BILLS,
  events: DEMO_EVENTS,
  bridges: BRIDGES,
  scams: SCAMS,
}

/** Section 3 rows 4–5: only the bike repair surprise. */
export const REPAIR_SCENARIO: Scenario = {
  id: 'repair-only',
  days: 30,
  bills: DEMO_BILLS,
  events: DEMO_EVENTS.filter((e) => e.id === 'bike-repair'),
  bridges: BRIDGES,
  scams: [],
}

/** Bills + scammers, no events: used by the scam tests. */
export const SCAM_SCENARIO: Scenario = {
  id: 'scams-only',
  days: 30,
  bills: DEMO_BILLS,
  events: [],
  bridges: BRIDGES,
  scams: SCAMS,
}
