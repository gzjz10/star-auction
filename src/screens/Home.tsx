import { useMemo } from 'react';
import { DATA_AS_OF, PLAYERS } from '../data';
import { totalRounds, type GameState } from '../engine/auction';
import { Book, Gear, Hand, Ledger, Star } from '../components/Icons';
import { AdSlot } from '../components/AdSlot';
import { Crest } from '../components/Crest';
import { useI18n, type Lang } from '../i18n';
import type { Screen } from '../App';
import './Home.css';

interface Props {
  saved: GameState | null;
  lang: Lang;
  onLang: (l: Lang) => void;
  onPlay: (mode: 'ai' | 'pvp' | 'online') => void;
  onResume: () => void;
  onDiscard: () => void;
  onNavigate: (s: Screen) => void;
}

function asOfLabel(lang: Lang): string {
  const [y, m] = DATA_AS_OF.split('-').map(Number);
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB', { month: 'long', year: 'numeric' }).format(
    new Date(y, (m || 1) - 1, 1),
  );
}

export function HomeScreen({ saved, lang, onLang, onPlay, onResume, onDiscard, onNavigate }: Props) {
  const { t, label } = useI18n();
  const headliners = useMemo(() => [...PLAYERS].sort((a, b) => b.value - a.value).slice(0, 3), []);
  const other: Lang = lang === 'ar' ? 'en' : 'ar';

  return (
    <div className="page home">
      <header className="home__bar">
        <div className="home__lang" role="group" aria-label="Language / اللغة">
          <button className="choice" aria-pressed={lang === 'ar'} onClick={() => onLang('ar')} lang="ar">
            عربي
          </button>
          <button className="choice" aria-pressed={lang === 'en'} onClick={() => onLang('en')} lang="en">
            English
          </button>
        </div>
        <button className="icon-btn" onClick={() => onNavigate('settings')} aria-label={t('settings')}>
          <Gear />
        </button>
      </header>

      <section className="home__bill" aria-labelledby="title">
        <hr className="rule rule--double" />
        <h1 id="title" className="home__title display worn offreg-blue ink-red">
          {t('appName')}
        </h1>
        <p className="home__subtitle display worn" lang={other}>
          {other === 'en' ? 'Star Auction' : 'مزاد النجوم'}
        </p>
        <div className="home__strap band">
          <Star className="star ink-red" />
          <p className="slab">{t('tagline')}</p>
          <Star className="star ink-red" />
        </div>

        <div className="home__bout" aria-hidden="true">
          <div className="home__corner">
            <Crest crest={{ shape: 'shield', mark: 'falcon' }} team={0} size={64} />
            <span className="display ink-red">{t('redCorner')}</span>
          </div>
          <span className="home__vs slab">
            <Hand className="home__hand home__hand--in" />
            {t('vs')}
            <Hand className="home__hand home__hand--out" />
          </span>
          <div className="home__corner">
            <Crest crest={{ shape: 'round', mark: 'crown' }} team={1} size={64} />
            <span className="display ink-blue">{t('blueCorner')}</span>
          </div>
        </div>
      </section>

      {saved && (
        <section className="home__resume" aria-labelledby="resume-title">
          <div>
            <h2 id="resume-title" className="display">
              {t('resumeTitle')}
            </h2>
            <p className="muted">
              {t('resumeLine', {
                a: saved.teams[0].name,
                b: saved.teams[1].name,
                r: saved.lot.slot + 1,
                n: totalRounds(saved.config),
              })}
            </p>
          </div>
          <div className="home__resume-actions">
            <button className="btn btn--solid btn--red" onClick={onResume}>
              {t('resume')}
            </button>
            <button className="btn btn--sm btn--plain" onClick={onDiscard}>
              {t('discard')}
            </button>
          </div>
        </section>
      )}

      <nav className="home__menu" aria-label={t('appName')}>
        <button className="home__act home__act--red" onClick={() => onPlay('ai')}>
          <span className="display">{t('playAi')}</span>
          <span className="home__note">{t('playAiNote')}</span>
        </button>
        <button className="home__act home__act--blue" onClick={() => onPlay('pvp')}>
          <span className="display">{t('playPvp')}</span>
          <span className="home__note">{t('playPvpNote')}</span>
        </button>
        <button className="home__act home__act--ink" onClick={() => onPlay('online')}>
          <span className="display">{t('playOnline')}</span>
          <span className="home__note">{t('playOnlineNote')}</span>
        </button>
        <div className="home__minor">
          <button className="btn btn--sm" onClick={() => onNavigate('rules')}>
            <Book width={20} height={20} />
            {t('howToPlay')}
          </button>
          <button className="btn btn--sm" onClick={() => onNavigate('history')}>
            <Ledger width={20} height={20} />
            {t('history')}
          </button>
        </div>
      </nav>

      <section className="home__headliners" aria-label={lang === 'ar' ? 'نجوم المزاد' : 'Top of the bill'}>
        <hr className="rule rule--thin" />
        <ol>
          {headliners.map((p, i) => (
            <li key={p.id} className={`display worn ${i === 1 ? 'ink-blue' : i === 0 ? 'ink-red' : ''}`}>
              {label(p.short)}
            </li>
          ))}
        </ol>
        <p className="home__asof muted">{t('dataAsOf', { date: asOfLabel(lang) })}</p>
      </section>

      <AdSlot place="home" />

      <footer className="home__foot">
        <nav className="home__links" aria-label={t('footerAbout')}>
          <a href={`/guide.html${lang === 'en' ? '#en' : ''}`}>{t('footerGuide')}</a>
          <a href={`/about.html${lang === 'en' ? '#en' : ''}`}>{t('footerAbout')}</a>
          <a href={`/privacy.html${lang === 'en' ? '#en' : ''}`}>{t('footerPrivacy')}</a>
        </nav>
        <p className="home__disclaimer muted">{t('disclaimer')}</p>
      </footer>
    </div>
  );
}
