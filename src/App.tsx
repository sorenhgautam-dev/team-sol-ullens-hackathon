import { MotionConfig } from 'framer-motion'
import { useGame } from '@/state/gameStore'
import { useReducedMotion } from '@/state/hooks'
import { PhoneFrame } from '@/ui/PhoneFrame'
import { ErrorBoundary } from '@/ui/ErrorBoundary'
import { TitleScreen } from '@/screens/TitleScreen'
import { SettingsScreen } from '@/screens/SettingsScreen'
import { PickScreen } from '@/screens/scamtown/PickScreen'
import { ScamTownScreen } from '@/screens/scamtown/ScamTownScreen'
import { ResultsScreen } from '@/screens/scamtown/ResultsScreen'

export default function App() {
  const screen = useGame((s) => s.screen)
  const go = useGame((s) => s.go)
  const reduced = useReducedMotion()
  return (
    <MotionConfig reducedMotion={reduced ? 'always' : 'user'}>
      <PhoneFrame>
        <ErrorBoundary key={screen} onReset={() => go('title')}>
          {screen === 'title' && <TitleScreen />}
          {screen === 'pick' && <PickScreen />}
          {screen === 'town' && <ScamTownScreen />}
          {screen === 'results' && <ResultsScreen />}
          {screen === 'settings' && <SettingsScreen />}
        </ErrorBoundary>
      </PhoneFrame>
    </MotionConfig>
  )
}
