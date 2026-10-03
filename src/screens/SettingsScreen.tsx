import { useGameShallow } from '@/state/gameStore'
import { useInstall } from '@/state/pwa'
import { CURRENCIES, type Currency } from '@/i18n/currency'
import { Button } from '@/ui/Button'
import { t } from '@/i18n'
import { useScam } from '@/state/scamStore'

export function SettingsScreen() {
  const { settings, setSettings, go, resetAll } = useGameShallow((s) => ({ settings: s.settings, setSettings: s.setSettings, go: s.go, resetAll: s.resetAll }))
  const install = useInstall()
  const back = () => go('title')
  return (
    <div className="flex h-full flex-col overflow-y-auto bg-paper px-4 pb-6 pt-[max(16px,env(safe-area-inset-top))] text-ink">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">⚙️ {t('settings.title')}</h1>
        <Button size="sm" variant="ghost" onClick={back}>
          {t('settings.back')}
        </Button>
      </div>
      <ul className="mt-4 divide-y divide-ink/5 rounded-card bg-card pixel-frame-soft">
        <Toggle label={`🔊 ${t('settings.sound')}`} value={settings.sound} onChange={(v) => setSettings({ sound: v })} />
        <Toggle label={`📳 ${t('settings.haptics')}`} value={settings.haptics} onChange={(v) => setSettings({ haptics: v })} />
        <Toggle label={`🐢 ${t('settings.reducedMotion')}`} value={settings.reducedMotion} onChange={(v) => setSettings({ reducedMotion: v })} />
        <Toggle label={`🎬 ${t('settings.demo')}`} value={settings.demoMode} onChange={(v) => setSettings({ demoMode: v })} />
        <li className="flex items-center justify-between px-4 py-3">
          <div>
            <div className="font-bold">💱 {t('settings.currency')}</div>
            <div className="text-xs text-ink/60">{t('settings.currencyNote')}</div>
          </div>
          <select className="input w-24" value={settings.currency} onChange={(e) => setSettings({ currency: e.target.value as Currency })}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </li>
      </ul>
      <div className="mt-4 space-y-2">
        {install.deferred && !install.installed && (
          <Button variant="primary" className="w-full" onClick={() => void install.install()}>
            ⬇️ {t('title.install')}
          </Button>
        )}
        {install.isIos && !install.isStandalone && <p className="text-center text-xs text-ink/60">{t('title.iosHint')}</p>}
        <Button
          variant="danger"
          className="w-full"
          onClick={() => {
            if (window.confirm(t('settings.resetConfirm'))) {
              resetAll()
              useScam.getState().start('sita', 1)
            }
          }}
        >
          🗑️ {t('settings.reset')}
        </Button>
      </div>
      <p className="mt-6 text-center text-xs text-ink/50">{t('settings.version')}</p>
      <p className="mt-1 text-center text-xs text-ink/50">{t('app.disclaimer')}</p>
    </div>
  )
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <li className="flex items-center justify-between px-4 py-3">
      <span className="font-bold">{label}</span>
      <button
        role="switch"
        aria-checked={value}
        className={`relative h-8 w-14 rounded-full transition-colors ${value ? 'bg-shield' : 'bg-ink/20'}`}
        onClick={() => onChange(!value)}
      >
        <span className={`absolute top-1 h-6 w-6 rounded-full bg-card shadow transition-transform ${value ? 'translate-x-7' : 'translate-x-1'}`} />
      </button>
    </li>
  )
}
