import { MotionConfig } from 'framer-motion'
import { useGame } from '@/state/gameStore'
import { useReducedMotion } from '@/state/hooks'
import { PhoneFrame } from '@/ui/PhoneFrame'
import { ErrorBoundary } from '@/ui/ErrorBoundary'
import { TitleScreen } from '@/screens/TitleScreen'
import { TwinWalletsScreen } from '@/screens/TwinWalletsScreen'
import { ProfileSelectScreen } from '@/screens/ProfileSelectScreen'
import { LifeMode } from '@/screens/life/LifeMode'
import { ResultsScreen } from '@/screens/ResultsScreen'
import { RewindScreen } from '@/screens/RewindScreen'
import { CapabilityScreen } from '@/screens/CapabilityScreen'
import { CodexScreen } from '@/screens/CodexScreen'
import { SettingsScreen } from '@/screens/SettingsScreen'
import { DebugPage } from '@/screens/DebugPage'
import { FixMyDatesScreen } from '@/screens/FixMyDatesScreen'
import { ImpactLabScreen, ImpactPreScreen, ImpactPostScreen } from '@/screens/ImpactLabScreen'
import { TownScreen } from '@/screens/town/TownScreen'

export default function App() {
  const screen = useGame((s) => s.screen)
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
        {screen === 'life' && <LifeMode />}
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
