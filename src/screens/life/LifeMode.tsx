import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGameShallow } from '@/state/gameStore'
import { useForecast, useGap, useLived, useProfile, useScenario } from '@/state/hooks'
import { sproutStage, timeOfDay } from '@/engine/cozy'
import type { LogLine } from '@/engine/types'
import { t } from '@/i18n'
import { Balance } from '@/ui/Balance'
import { StatBars } from '@/ui/StatBars'
import { LifeLog } from '@/ui/LifeLog'
import { BottomBar } from '@/ui/BottomBar'
import { HomeStreet, type Spot } from '@/ui/HomeStreet'
import { Sheet } from '@/ui/Sheet'
import { Toasts } from '@/ui/Toasts'
import { LETTERS } from '@/content/mail'
import { MoneyTab } from './MoneyTab'
import { PeopleTab } from './PeopleTab'
import { MovesTab } from './MovesTab'
import { PhoneTab } from './PhoneTab'
import { EventCard } from './EventCard'
import { ScamEncounter } from './ScamEncounter'
import { GapBridgeSheet } from './GapBridgeSheet'
import { MailboxSheet } from './MailboxSheet'
import { GoodnightSheet } from './GoodnightSheet'
import { MoneyTrailSheet } from './MoneyTrailSheet'
import { CalendarView } from '@/ui/CalendarView'
import { CodexEntry } from '@/screens/CodexScreen'

export function LifeMode() {
  const scenario = useScenario()
  const profile = useProfile()
  const lived = useLived()
  const forecast = useForecast()
  const gap = useGap()
  const { day, tab, sheet, sheetPayload, energy, hubCollapsed, readMail } = useGameShallow((s) => ({
    day: s.day,
    tab: s.tab,
    sheet: s.sheet,
    sheetPayload: s.sheetPayload,
    energy: s.energy,
    hubCollapsed: s.hubCollapsed,
    readMail: s.readMail,
  }))
  const { setTab, openSheet, closeSheet, toggleHub, go } = useGameShallow((s) => ({ setTab: s.setTab, openSheet: s.openSheet, closeSheet: s.closeSheet, toggleHub: s.toggleHub, go: s.go }))
  const [why, setWhy] = useState<LogLine | null>(null)

  const today = lived.days[day - 1]
  const balance = today?.balance ?? profile.startingBalance
  const state: 'safe' | 'warn' | 'danger' = balance < 0 ? 'danger' : gap.shortfallDays > 0 ? 'warn' : 'safe'
  const pendingScams = lived.days.flatMap((d) => d.scams).filter((s) => s.outcome === 'pending').length
  const mailBadge = LETTERS.filter((l) => l.day <= day && !readMail.includes(l.id)).length

  const payday = useMemo(() => {
    const lumps = profile.incomes.filter((i) => i.kind !== 'gig') as Extract<(typeof profile.incomes)[number], { kind: 'salary' | 'remittance' }>[]
    const next = lumps.filter((i) => i.day >= day).sort((a, b) => a.day - b.day)[0]
    if (!next) return t('life.noPayday')
    const name = t(next.nameKey)
    return next.day === day ? t('life.paydayToday', { name }) : t('life.paydayIn', { name, days: next.day - day })
  }, [profile, day])

  const onSpot = (spot: Spot) => {
    switch (spot) {
      case 'home':
        setTab('money')
        break
      case 'landlord':
        setTab('people')
        break
      case 'shop':
        setTab('moves')
        break
      case 'coop':
        openSheet('gapBridge')
        break
      case 'mailbox':
        openSheet('mailbox')
        break
    }
  }

  return (
    <div className="relative flex h-full flex-col bg-paper text-ink">
      <header className="flex items-center gap-3 px-4 pb-1 pt-[max(10px,env(safe-area-inset-top))]">
        <button className="flex h-11 w-11 items-center justify-center rounded-full bg-card text-2xl shadow-sm" onClick={() => go('settings')} aria-label={t('settings.title')}>
          {profile.emoji}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-extrabold">{t(profile.nameKey)}</span>
            <span className="text-sm font-bold text-ink/60">{t('life.dayOf', { day, total: scenario.days })}</span>
          </div>
          <span className="inline-block rounded-full bg-sky/25 px-2 py-0.5 text-[11px] font-bold text-ink/80">{payday}</span>
        </div>
        <Balance amountNpr={balance} state={state} size="md" />
      </header>

      {tab === 'home' && (
        <div className="relative">
          <AnimatePresence initial={false}>
            {!hubCollapsed && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="overflow-hidden">
                <HomeStreet time={timeOfDay(energy)} sprout={sproutStage(today?.stats.bufferDays ?? 0)} mailBadge={mailBadge} onTap={onSpot} />
              </motion.div>
            )}
          </AnimatePresence>
          <button className="absolute right-6 top-1 rounded-full bg-paper/80 px-2 py-0.5 text-[11px] font-bold text-ink/70 shadow-sm backdrop-blur" onClick={toggleHub}>
            {hubCollapsed ? `▾ ${t('hub.expand')}` : `▴ ${t('hub.collapse')}`}
          </button>
        </div>
      )}

      <div className="py-2">{today && <StatBars stats={today.stats} />}</div>

      <main className="min-h-0 flex-1">
        {tab === 'home' && <LifeLog ledger={lived} onWhy={setWhy} />}
        {tab === 'money' && <MoneyTab />}
        {tab === 'people' && <PeopleTab />}
        {tab === 'phone' && <PhoneTab />}
        {tab === 'moves' && <MovesTab />}
      </main>

      <BottomBar phoneBadge={pendingScams} />

      {/* Sheets */}
      <EventCard open={sheet === 'event'} eventId={sheetPayload} />
      <ScamEncounter open={sheet === 'scam'} scamId={sheetPayload} />
      <GapBridgeSheet open={sheet === 'gapBridge'} onClose={closeSheet} />
      <MailboxSheet open={sheet === 'mailbox'} onClose={closeSheet} />
      <GoodnightSheet open={sheet === 'goodnight'} />
      <MoneyTrailSheet open={sheet === 'moneyTrail'} onClose={closeSheet} />
      <Sheet open={sheet === 'calendar'} onClose={closeSheet} title={t('calendar.title')}>
        <CalendarView scenario={scenario} profile={profile} lived={lived} forecast={forecast} day={day} />
      </Sheet>
      <Sheet open={sheet === 'codexEntry'} onClose={closeSheet} title={t('scam.codexTitle')}>
        {sheetPayload && <CodexEntry scamId={sheetPayload} />}
      </Sheet>
      <Sheet open={why !== null} onClose={() => setWhy(null)} title={t('life.why')} height="auto">
        {why && (
          <div className="space-y-3 pb-2">
            <p className="text-base font-bold">
              {why.emoji} {t(why.key, why.params)}
            </p>
            <p className="text-sm text-ink/70">{why.whyKey ? t(why.whyKey) : t('why.shortfall')}</p>
          </div>
        )}
      </Sheet>
      <Toasts />
    </div>
  )
}
