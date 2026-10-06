import { useState } from 'react';
import { Back } from '../components/Icons';
import { hasPlayer, getPlayer } from '../data';
import type { HistoryEntry } from '../engine/save';
import { fmtMoney, useI18n } from '../i18n';
import './Minor.css';

export function HistoryScreen({ history, onClear, onBack }: { history: HistoryEntry[]; onClear: () => void; onBack: () => void }) {
  const { t, label, lang } = useI18n();
  const [confirming, setConfirming] = useState(false);

  // The red corner is always the human in games against the machine.
  const vsAi = history.filter((h) => h.mode === 'ai');
  const wins = vsAi.filter((h) => h.scores[0].total > h.scores[1].total).length;
  const losses = vsAi.filter((h) => h.scores[0].total < h.scores[1].total).length;
  const draws = vsAi.length - wins - losses;
  const date = new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="page minor">
      <header className="topbar">
        <button className="icon-btn flip-rtl" onClick={onBack} aria-label={t('back')}>
          <Back />
        </button>
        {history.length > 0 &&
          (confirming ? (
            <span className="choices">
              <span className="muted" style={{ alignSelf: 'center' }}>
                {t('clearConfirm')}
              </span>
              <button className="btn btn--sm btn--red btn--solid" onClick={() => { onClear(); setConfirming(false); }}>
                {t('clearHistory')}
              </button>
              <button className="btn btn--sm btn--plain" onClick={() => setConfirming(false)}>
                {t('back')}
              </button>
            </span>
          ) : (
            <button className="btn btn--sm btn--plain" onClick={() => setConfirming(true)}>
              {t('clearHistory')}
            </button>
          ))}
      </header>
      <h1 className="display worn ink-blue offreg-red">{t('history')}</h1>

      {history.length === 0 ? (
        <p className="ledger__empty">{t('historyEmpty')}</p>
      ) : (
        <>
          <div className="ledger__tally">
            <div>
              <span className="display num">{history.length}</span>
              <span className="label">{t('played')}</span>
            </div>
            <div>
              <span className="display num ink-red">{wins}</span>
              <span className="label">{t('wins')}</span>
            </div>
            <div>
              <span className="display num">{draws}</span>
              <span className="label">{t('draws')}</span>
            </div>
            <div>
              <span className="display num ink-blue">{losses}</span>
              <span className="label">{t('losses')}</span>
            </div>
          </div>
          <ol className="ledger__list">
            {history.map((h) => {
              const [a, b] = [h.scores[0].total, h.scores[1].total];
              return (
                <li key={h.id} className="ledger__row">
                  <span className="ledger__team ledger__team--red">
                    <span className={`display ${a > b ? 'ledger__win' : ''}`}>{h.names[0]}</span>
                    {h.stars[0] && hasPlayer(h.stars[0].id) && (
                      <span className="muted">
                        {label(getPlayer(h.stars[0].id).short)} {h.stars[0].price > 0 && <span className="num">{fmtMoney(h.stars[0].price)}</span>}
                      </span>
                    )}
                  </span>
                  <span className="ledger__score">
                    <span className="num">
                      {a} – {b}
                    </span>
                    {h.match && (
                      <small className="num">
                        {h.match[0]}–{h.match[1]}
                      </small>
                    )}
                  </span>
                  <span className="ledger__team ledger__team--blue">
                    <span className={`display ${b > a ? 'ledger__win' : ''}`}>{h.names[1]}</span>
                    {h.stars[1] && hasPlayer(h.stars[1].id) && (
                      <span className="muted">
                        {label(getPlayer(h.stars[1].id).short)} {h.stars[1].price > 0 && <span className="num">{fmtMoney(h.stars[1].price)}</span>}
                      </span>
                    )}
                  </span>
                  <span className="ledger__meta">
                    {date.format(h.finishedAt)} · <span className="num">{h.formation}</span> ·{' '}
                    {h.mode === 'ai' ? `${t('vsMachine')} (${t(h.difficulty as 'easy')})` : h.mode === 'online' ? t('onlineMode') : t('twoPlayer')}
                  </span>
                </li>
              );
            })}
          </ol>
        </>
      )}
    </div>
  );
}
