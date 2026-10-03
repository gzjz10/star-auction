import { Back } from '../components/Icons';
import type { Settings } from '../engine/save';
import { useI18n } from '../i18n';
import './Minor.css';

export function SettingsScreen({ settings, onChange, onBack }: { settings: Settings; onChange: (s: Settings) => void; onBack: () => void }) {
  const { t } = useI18n();
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => onChange({ ...settings, [k]: v });
  return (
    <div className="page minor">
      <header className="topbar">
        <button className="icon-btn flip-rtl" onClick={onBack} aria-label={t('back')}>
          <Back />
        </button>
        <span />
      </header>
      <h1 className="display worn">{t('settings')}</h1>

      <div className="settings__group" role="radiogroup" aria-labelledby="set-lang">
        <h2 id="set-lang" className="label">
          {t('language')}
        </h2>
        <div className="choices">
          <button className="choice" role="radio" aria-checked={settings.lang === 'ar'} onClick={() => set('lang', 'ar')} lang="ar">
            العربية
          </button>
          <button className="choice" role="radio" aria-checked={settings.lang === 'en'} onClick={() => set('lang', 'en')} lang="en">
            English
          </button>
        </div>
      </div>

      <div className="settings__group" role="radiogroup" aria-labelledby="set-theme">
        <h2 id="set-theme" className="label">
          {t('theme')}
        </h2>
        <div className="choices">
          {(['system', 'day', 'night'] as const).map((th) => (
            <button key={th} className="choice" role="radio" aria-checked={settings.theme === th} onClick={() => set('theme', th)}>
              {t(th === 'system' ? 'themeSystem' : th === 'day' ? 'themeDay' : 'themeNight')}
            </button>
          ))}
        </div>
      </div>

      <div className="settings__group" role="radiogroup" aria-labelledby="set-sound">
        <h2 id="set-sound" className="label">
          {t('sound')}
        </h2>
        <div className="choices">
          <button className="choice" role="radio" aria-checked={settings.sound} onClick={() => set('sound', true)}>
            {t('on')}
          </button>
          <button className="choice" role="radio" aria-checked={!settings.sound} onClick={() => set('sound', false)}>
            {t('off')}
          </button>
        </div>
      </div>
    </div>
  );
}
