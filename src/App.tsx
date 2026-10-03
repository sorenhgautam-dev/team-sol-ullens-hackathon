import { MotionConfig } from 'framer-motion'
import { BUDGETING_SCREENS, FEATURES } from '@/config/features'
import { useGame } from '@/state/gameStore'
import { useReducedMotion } from '@/state/hooks'
import { PhoneFrame } from '@/ui/PhoneFrame'
import { ErrorBoundary } from '@/ui/ErrorBoundary'
import { TitleScreen } from '@/screens/TitleScreen'
import { TwinWalletsScreen } from '@/screens/TwinWalletsScreen'
import { ProfileSelectScreen } from '@/screens/ProfileSelectScreen'
import { ResultsScreen } from '@/screens/ResultsScreen'
import { RewindScreen } from '@/screens/RewindScreen'
import { CapabilityScreen } from '@/screens/CapabilityScreen'
import { CodexScreen } from '@/screens/CodexScreen'
import { SettingsScreen } from '@/screens/SettingsScreen'
import { DebugPage } from '@/screens/DebugPage'
import { FixMyDatesScreen } from '@/screens/FixMyDatesScreen'
import { ImpactLabScreen, ImpactPreScreen, ImpactPostScreen } from '@/screens/ImpactLabScreen'
import { TownScreen } from '@/screens/town/TownScreen'
import { WalkScreen } from '@/screens/walk/WalkScreen'
import { StyleguideScreen } from '@/screens/StyleguideScreen'
import { CardsScreen } from '@/screens/CardsScreen'

export default function App() {
  const raw = useGame((s) => s.screen)
  // Budgeting screens are hidden behind the feature flag: they fall back to the title.
  const screen = !FEATURES.budgeting && BUDGETING_SCREENS.has(raw) ? 'title' : raw
  const go = useGame((s) => s.go)
  const reduced = useReducedMotion()
  if (screen === 'debug') return <DebugPage />
  return (
    <MotionConfig reducedMotion={reduced ? 'always' : 'user'}>
      <PhoneFrame>
        <ErrorBoundary key={screen} onReset={() => go('title')}>
        {screen === 'title' && <TitleScreen />}
        {screen === 'twin' && <TwinWalletsScreen />}
        {screen === 'profile' && <ProfileSelectScreen />}
        {screen === 'walk' && <WalkScreen />}
        {screen === 'styleguide' && <StyleguideScreen />}
        {screen === 'cards' && <CardsScreen />}
        {screen === 'results' && <ResultsScreen />}
        {screen === 'rewind' && <RewindScreen />}
        {screen === 'capability' && <CapabilityScreen />}
        {screen === 'codex' && <CodexScreen />}
        {screen === 'settings' && <SettingsScreen />}
        {screen === 'fixDates' && <FixMyDatesScreen />}
        {screen === 'impact' && <ImpactLabScreen />}
        {screen === 'impactPre' && <ImpactPreScreen />}
        {screen === 'impactPost' && <ImpactPostScreen />}
        {screen === 'town' && <TownScreen />}
        </ErrorBoundary>
      </PhoneFrame>
    </MotionConfig>
  )
}
