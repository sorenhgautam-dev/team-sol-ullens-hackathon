/**
 * Milestone 1 debug page: drive the pure engine with a few toggles and inspect the ledger.
 * Every number here comes from the engine; this screen does no money math.
 */
import { useMemo, useState } from 'react'
import { simulate, forecast, describeGap, stabilityScore } from '@/engine'
import type { DecisionLog, Ledger, Scenario, Profile } from '@/engine'
import { BASELINE_SCENARIO, REPAIR_SCENARIO, DEMO_SCENARIO, DEMO_SEED } from '@/content/scenario'
import { PROFILES, SITA, AARAV } from '@/content/profiles'
import { BRIDGES } from '@/content/bridges'
import { t } from '@/i18n'
import { formatMoney } from '@/i18n/currency'

const SCENARIOS: Record<string, Scenario> = {
  baseline: BASELINE_SCENARIO,
  'repair-only': REPAIR_SCENARIO,
  demo: DEMO_SCENARIO,
}

type RepairChoice = 'none' | 'repair' | 'replace' | 'bus'

interface Section3Row {
  label: string
  scenario: Scenario
  profile: Profile
  decisions: DecisionLog
  expect: { shortfallDays: number; lowestBalance: number; endBalance: number }
}

const MOVE_RENT: DecisionLog = [{ id: 'mr', type: 'moveBill', day: 1, billId: 'rent', fromDay: 5, toDay: 21 }]
const MOVE_SCHOOL: DecisionLog = [{ id: 'ms', type: 'moveBill', day: 1, billId: 'school', fromDay: 10, toDay: 21 }]
const REPAIR: DecisionLog = [{ id: 'br', type: 'eventChoice', day: 9, eventId: 'bike-repair', choiceId: 'repair' }]

const SECTION3: Section3Row[] = [
  { label: 'Aarav, no events', scenario: BASELINE_SCENARIO, profile: AARAV, decisions: [], expect: { shortfallDays: 0, lowestBalance: 9_300, endBalance: 9_300 } },
  { label: 'Sita, no events', scenario: BASELINE_SCENARIO, profile: SITA, decisions: [], expect: { shortfallDays: 15, lowestBalance: -11_700, endBalance: 9_300 } },
  { label: 'Sita, rent moved to day 21', scenario: BASELINE_SCENARIO, profile: SITA, decisions: MOVE_RENT, expect: { shortfallDays: 0, lowestBalance: 300, endBalance: 9_300 } },
  { label: 'Sita + bike repair, rent moved', scenario: REPAIR_SCENARIO, profile: SITA, decisions: [...MOVE_RENT, ...REPAIR], expect: { shortfallDays: 5, lowestBalance: -3_200, endBalance: 5_800 } },
  { label: 'Sita + repair, rent and school moved', scenario: REPAIR_SCENARIO, profile: SITA, decisions: [...MOVE_RENT, ...MOVE_SCHOOL, ...REPAIR], expect: { shortfallDays: 0, lowestBalance: 800, endBalance: 5_800 } },
]

export function DebugPage() {
  const [profileId, setProfileId] = useState('sita')
  const [scenarioId, setScenarioId] = useState('baseline')
  const [seed, setSeed] = useState(DEMO_SEED)
  const [moveRent, setMoveRent] = useState(false)
  const [moveSchool, setMoveSchool] = useState(false)
  const [repair, setRepair] = useState<RepairChoice>('none')
  const [bridgeId, setBridgeId] = useState('none')
  const [bridgeDay, setBridgeDay] = useState(4)

  const profile = PROFILES[profileId] ?? SITA
  const scenario = SCENARIOS[scenarioId] ?? BASELINE_SCENARIO

  const baseDecisions = useMemo<DecisionLog>(() => {
    const d: DecisionLog = []
    if (moveRent) d.push(...MOVE_RENT)
    if (moveSchool) d.push(...MOVE_SCHOOL)
    if (repair !== 'none') d.push({ id: 'br', type: 'eventChoice', day: 9, eventId: 'bike-repair', choiceId: repair })
    return d
  }, [moveRent, moveSchool, repair])

  const baseForecast = useMemo(() => forecast(scenario, profile, baseDecisions, seed), [scenario, profile, baseDecisions, seed])
  const gap = describeGap(baseForecast)

  const decisions = useMemo<DecisionLog>(() => {
    if (bridgeId === 'none') return baseDecisions
    const option = BRIDGES.find((b) => b.id === bridgeId)
    const amount = option?.mechanism === 'deferBill' ? 1 : Math.max(1, gap.amountNeeded)
    return [...baseDecisions, { id: 'bridge', type: 'bridge', day: bridgeDay, optionId: bridgeId, amount }]
  }, [baseDecisions, bridgeId, bridgeDay, gap.amountNeeded])

  const ledger = useMemo(() => simulate(scenario, profile, decisions, seed), [scenario, profile, decisions, seed])
  const fc = useMemo(() => forecast(scenario, profile, decisions, seed), [scenario, profile, decisions, seed])
  const score = stabilityScore(ledger.summary)

  return (
    <main className="min-h-screen bg-paper p-4 text-ink font-ui">
      <div className="mx-auto max-w-5xl space-y-4">
        <header className="flex items-baseline justify-between">
          <h1 className="text-2xl font-extrabold">{t('app.name')} · {t('debug.title')}</h1>
          <span className="text-sm opacity-70">{t('app.tagline')}</span>
        </header>

        <section className="grid grid-cols-2 gap-3 rounded-card bg-white p-4 shadow-sm md:grid-cols-4">
          <Field label={t('debug.profile')}>
            <select className="input" value={profileId} onChange={(e) => setProfileId(e.target.value)}>
              {Object.values(PROFILES).map((p) => (
                <option key={p.id} value={p.id}>{p.emoji} {t(p.nameKey)}</option>
              ))}
            </select>
          </Field>
          <Field label={t('debug.scenario')}>
            <select className="input" value={scenarioId} onChange={(e) => setScenarioId(e.target.value)}>
              {Object.keys(SCENARIOS).map((id) => <option key={id} value={id}>{id}</option>)}
            </select>
          </Field>
          <Field label={t('debug.seed')}>
            <input className="input" type="number" value={seed} onChange={(e) => setSeed(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Bike repair (day 9)">
            <select className="input" value={repair} onChange={(e) => setRepair(e.target.value as RepairChoice)}>
              <option value="none">no decision (default)</option>
              <option value="repair">repair 3,500</option>
              <option value="replace">replace 9,000</option>
              <option value="bus">bus 600</option>
            </select>
          </Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={moveRent} onChange={(e) => setMoveRent(e.target.checked)} /> Move rent → day 21</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={moveSchool} onChange={(e) => setMoveSchool(e.target.checked)} /> Move school fee → day 21</label>
          <Field label="Gap Bridge">
            <select className="input" value={bridgeId} onChange={(e) => setBridgeId(e.target.value)}>
              <option value="none">none</option>
              {BRIDGES.map((b) => <option key={b.id} value={b.id}>{b.emoji} {t(b.nameKey)}</option>)}
            </select>
          </Field>
          <Field label="Bridge on day">
            <input className="input" type="number" min={1} max={30} value={bridgeDay} onChange={(e) => setBridgeDay(Number(e.target.value) || 1)} />
          </Field>
        </section>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <Stat label={t('debug.shortfallDays')} value={String(ledger.summary.shortfallDays)} tone={ledger.summary.shortfallDays ? 'bad' : 'good'} />
          <Stat label={t('debug.lowest')} value={formatMoney(ledger.summary.lowestBalance)} tone={ledger.summary.lowestBalance < 0 ? 'bad' : 'good'} />
          <Stat label={t('debug.end')} value={formatMoney(ledger.summary.endBalance)} />
          <Stat label={t('debug.gapCost')} value={formatMoney(ledger.summary.gapCost)} tone={ledger.summary.gapCost ? 'warn' : 'good'} />
          <Stat label={t('debug.score')} value={`${score.total}`} sub={`${score.shortfall} + ${score.balance} + ${score.gap}`} />
        </section>

        <section className="rounded-card bg-white p-4 shadow-sm">
          <div className="mb-2 flex flex-wrap items-center gap-4 text-xs">
            <Legend color="#1E2A44" label="Actual balance" />
            <Legend color="#FF4D6D" label="Pre-bridge balance" dashed />
            <Legend color="#6EC6FF" label="Forecast (surprises hidden)" dashed />
            <span className="ml-auto opacity-70">
              Forecast gap: {gap.shortfallDays} days, deepest {formatMoney(gap.deepest)}{gap.firstDay ? ` (days ${gap.firstDay}–${gap.lastDay})` : ''}
            </span>
          </div>
          <BalanceChart ledger={ledger} forecastLedger={fc} />
        </section>

        <section className="rounded-card bg-white p-4 shadow-sm">
          <h2 className="mb-2 font-bold">Section 3 check</h2>
          <table className="w-full text-sm">
            <thead><tr className="text-left opacity-60"><th>Situation</th><th>Shortfall days</th><th>Lowest</th><th>End</th><th></th></tr></thead>
            <tbody>
              {SECTION3.map((row) => {
                const s = simulate(row.scenario, row.profile, row.decisions, DEMO_SEED).summary
                const ok = s.shortfallDays === row.expect.shortfallDays && s.lowestBalance === row.expect.lowestBalance && s.endBalance === row.expect.endBalance
                return (
                  <tr key={row.label} className="border-t border-black/5">
                    <td className="py-1">{row.label}</td>
                    <td>{s.shortfallDays} <Expected v={row.expect.shortfallDays} /></td>
                    <td>{formatMoney(s.lowestBalance)} <Expected v={row.expect.lowestBalance} money /></td>
                    <td>{formatMoney(s.endBalance)} <Expected v={row.expect.endBalance} money /></td>
                    <td className={ok ? 'text-green-600' : 'text-danger'}>{ok ? '✓' : '✗'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>

        {ledger.actionOutcomes.length > 0 && (
          <section className="rounded-card bg-white p-4 shadow-sm text-sm">
            <h2 className="mb-2 font-bold">Action outcomes</h2>
            <ul className="space-y-1">
              {ledger.actionOutcomes.map((o) => (
                <li key={o.actionId}>
                  <code className="rounded bg-black/5 px-1">{o.actionId}</code>{' '}
                  <span className={o.status === 'applied' ? 'text-green-600' : 'text-danger'}>{o.status}</span>
                  {o.reasonKey ? ` · ${t(o.reasonKey)}` : ''}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="rounded-card bg-white p-4 shadow-sm">
          <h2 className="mb-2 font-bold">Ledger</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left opacity-60">
                <th className="w-10">{t('debug.day')}</th><th>Entries · Life Log</th><th className="text-right">{t('debug.balance')}</th><th className="text-right">{t('debug.preBridge')}</th><th className="text-right">Buffer</th><th>Hearts</th>
              </tr>
            </thead>
            <tbody>
              {ledger.days.map((d) => (
                <tr key={d.day} className={`border-t border-black/5 align-top ${d.shortfall ? 'bg-danger/5' : ''}`}>
                  <td className="py-1 font-bold">{d.day}</td>
                  <td className="py-1">
                    <div className="flex flex-wrap gap-1">
                      {d.entries.map((e, i) => (
                        <span key={i} className={`rounded-full px-2 py-0.5 text-xs ${e.amount >= 0 ? 'bg-green-100' : 'bg-black/5'}`}>
                          {e.emoji} {t(e.labelKey)} {e.amount >= 0 ? '+' : ''}{formatMoney(e.amount)}
                        </span>
                      ))}
                    </div>
                    <ul className="mt-1 space-y-0.5">
                      {d.log.map((l, i) => (
                        <li key={i} className={`text-xs ${toneClass(l.tone)}`}>{l.emoji} {t(l.key, l.params)}</li>
                      ))}
                    </ul>
                  </td>
                  <td className={`py-1 text-right tabular-nums ${d.balance < 0 ? 'text-danger font-bold' : ''}`}>{formatMoney(d.balance)}</td>
                  <td className={`py-1 text-right tabular-nums ${d.shortfall ? 'text-danger' : 'opacity-60'}`}>{formatMoney(d.preBridgeBalance)}</td>
                  <td className="py-1 text-right tabular-nums">{d.stats.bufferDays}</td>
                  <td className="py-1 text-xs whitespace-nowrap">🏘️{d.stats.trust.landlord} 👪{d.stats.trust.family} 🧑‍🤝‍🧑{d.stats.trust.friends}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <p className="text-center text-xs opacity-60">{t('bridge.illustrative')} Milestone 1: engine + tests. UI comes next.</p>
      </div>
    </main>
  )
}

function toneClass(tone: string): string {
  switch (tone) {
    case 'bad': return 'text-danger'
    case 'good': return 'text-green-700'
    case 'warn': return 'text-amber-700'
    case 'lesson': return 'italic opacity-70'
    default: return ''
  }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-semibold opacity-80">
      {label}
      {children}
    </label>
  )
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'good' | 'bad' | 'warn' }) {
  const color = tone === 'bad' ? 'text-danger' : tone === 'warn' ? 'text-amber-600' : tone === 'good' ? 'text-green-600' : ''
  return (
    <div className="rounded-card bg-white p-3 shadow-sm">
      <div className="text-xs opacity-60">{label}</div>
      <div className={`text-xl font-extrabold tabular-nums ${color}`}>{value}</div>
      {sub && <div className="text-xs opacity-60">{sub}</div>}
    </div>
  )
}

function Expected({ v, money }: { v: number; money?: boolean }) {
  return <span className="text-xs opacity-50">(expect {money ? formatMoney(v) : v})</span>
}

function Legend({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="flex items-center gap-1">
      <svg width="24" height="8"><line x1="0" y1="4" x2="24" y2="4" stroke={color} strokeWidth="2" strokeDasharray={dashed ? '4 3' : undefined} /></svg>
      {label}
    </span>
  )
}

function BalanceChart({ ledger, forecastLedger }: { ledger: Ledger; forecastLedger: Ledger }) {
  const W = 720, H = 200, PAD = 28
  const series = {
    actual: ledger.days.map((d) => d.balance),
    pre: ledger.days.map((d) => d.preBridgeBalance),
    fc: forecastLedger.days.map((d) => d.balance),
  }
  const all = [...series.actual, ...series.pre, ...series.fc, 0]
  const min = Math.min(...all), max = Math.max(...all)
  const n = Math.max(1, ledger.days.length - 1)
  const x = (i: number) => PAD + (i / n) * (W - PAD * 2)
  const y = (v: number) => (max === min ? H / 2 : PAD + ((max - v) / (max - min)) * (H - PAD * 2))
  const path = (vals: number[]) => vals.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-52 w-full" role="img" aria-label="Balance over the month">
      <line x1={PAD} x2={W - PAD} y1={y(0)} y2={y(0)} stroke="#1E2A44" strokeOpacity="0.25" />
      {ledger.days.map((d, i) => d.shortfall ? <rect key={d.day} x={x(i) - (W - PAD * 2) / n / 2} y={PAD} width={(W - PAD * 2) / n} height={H - PAD * 2} fill="#FF4D6D" fillOpacity="0.08" /> : null)}
      <path d={path(series.fc)} fill="none" stroke="#6EC6FF" strokeWidth="2" strokeDasharray="5 4" />
      <path d={path(series.pre)} fill="none" stroke="#FF4D6D" strokeWidth="2" strokeDasharray="3 3" />
      <path d={path(series.actual)} fill="none" stroke="#1E2A44" strokeWidth="2.5" strokeLinejoin="round" />
      {ledger.days.filter((d) => d.day % 5 === 0 || d.day === 1).map((d) => (
        <text key={d.day} x={x(d.day - 1)} y={H - 8} fontSize="10" textAnchor="middle" fill="#1E2A44" fillOpacity="0.6">{d.day}</text>
      ))}
      <text x={PAD} y={12} fontSize="10" fill="#1E2A44" fillOpacity="0.6">{formatMoney(max)}</text>
      <text x={PAD} y={H - PAD + 12} fontSize="10" fill="#1E2A44" fillOpacity="0.6">{formatMoney(min)}</text>
    </svg>
  )
}
