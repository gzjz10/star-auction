import { useMemo } from 'react';
import { Crest } from '../components/Crest';
import { FitText } from '../components/FitText';
import { Star } from '../components/Icons';
import { Pitch } from '../components/Pitch';
import { getPlayer } from '../data';
import { squadOf, type GameState, type TeamIdx } from '../engine/auction';
import { scoreSquad, type ScoreBreakdown } from '../engine/scoring';
import { fmtMoney, useI18n, type StringKey } from '../i18n';
import './Results.css';

interface Props {
  game: GameState;
  onMatch: () => void;
  onReplay: () => void;
  onRematch: () => void;
  onMenu: () => void;
}

const ROWS: { key: keyof ScoreBreakdown; label: StringKey; sign?: -1 }[] = [
  { key: 'ratings', label: 'ratings' },
  { key: 'club', label: 'clubChem' },
  { key: 'nation', label: 'nationChem' },
  { key: 'league', label: 'leagueChem' },
  { key: 'cash', label: 'cash' },
];

export function ResultsScreen({ game, onMatch, onReplay, onRematch, onMenu }: Props) {
  const { t, label } = useI18n();
  const opts = { chemistry: game.config.chemistry, cash: game.config.cash };
  const scores = useMemo(
    () => ([0, 1] as const).map((ti) => scoreSquad(squadOf(game, ti), game.teams[ti].budget, opts)) as [ScoreBreakdown, ScoreBreakdown],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [game],
  );
  const winner: TeamIdx | null = scores[0].total > scores[1].total ? 0 : scores[1].total > scores[0].total ? 1 : null;

  const highlights = useMemo(() => {
    const all = ([0, 1] as const).flatMap((ti) => game.teams[ti].picks.map((p) => ({ ...p, team: ti, player: getPlayer(p.playerId) })));
    const priciest = [...all].sort((a, b) => b.price - a.price)[0];
    // Steal: the best rating picked up for free or nearly free.
    const steal = [...all].sort((a, b) => b.player.ovr - a.player.ovr - (b.price - a.price) / 20).find((x) => x.price <= 15);
    return { priciest, steal };
  }, [game]);

  const visibleRows = ROWS.filter((r) => (r.key === 'cash' ? game.config.cash : r.key === 'ratings' ? true : game.config.chemistry));

  return (
    <div className="page results">
      <section className="results__crown" aria-live="polite">
        <hr className="rule rule--double" />
        {winner !== null ? (
          <>
            <Crest crest={game.teams[winner].crest} team={winner} size={96} />
            <h1 className="results__winner">
              <FitText className={`display ${winner === 0 ? 'ink-red' : 'ink-blue'}`} min={44} max={240}>
                {game.teams[winner].name}
              </FitText>
            </h1>
            <p className="results__deck slab">
              <Star /> {t('champion')} <Star />
            </p>
          </>
        ) : (
          <h1 className="results__winner display">{t('draw')}</h1>
        )}
      </section>

      <div className="results__card">
        {([0, 1] as const).map((ti) => {
          const s = scores[ti];
          return (
            <section key={ti} className={`results__side results__side--${ti === 0 ? 'red' : 'blue'}`} aria-labelledby={`side-${ti}`}>
              <header className="results__head">
                <Crest crest={game.teams[ti].crest} team={ti} size={40} />
                <h2 id={`side-${ti}`} className="display">
                  <span className="visually-hidden">{ti === 0 ? t('redCorner') : t('blueCorner')}: </span>
                  {game.teams[ti].name}
                </h2>
                <span className="results__total display num">{s.total}</span>
              </header>
              <table className="results__table">
                <tbody>
                  {visibleRows.map((r) => (
                    <tr key={r.key}>
                      <th scope="row">
                        {t(r.label)}
                        {r.key === 'ratings' && s.fitPenalty > 0 && (
                          <span className="muted"> ({t('fit')} −{s.fitPenalty})</span>
                        )}
                      </th>
                      <td className="num">{(r.key === 'ratings' ? '' : '+') + s[r.key]}</td>
                    </tr>
                  ))}
                  <tr className="results__sum">
                    <th scope="row">{t('total')}</th>
                    <td className="num">{s.total}</td>
                  </tr>
                </tbody>
              </table>
              <Pitch game={game} team={ti} />
            </section>
          );
        })}
      </div>

      <section className="results__notes">
        {highlights.priciest && highlights.priciest.price > 0 && (
          <p>
            <span className="label">{t('bestBuy')}</span>
            <span className="display">{label(highlights.priciest.player.short)}</span>
            <span className="num">{fmtMoney(highlights.priciest.price)}</span>
            <span className="muted">{game.teams[highlights.priciest.team].name}</span>
          </p>
        )}
        {highlights.steal && (
          <p>
            <span className="label">{t('bargain')}</span>
            <span className="display">{label(highlights.steal.player.short)}</span>
            <span className="num">
              {highlights.steal.price > 0 ? fmtMoney(highlights.steal.price) : t('free')} · {highlights.steal.player.ovr}
            </span>
            <span className="muted">{game.teams[highlights.steal.team].name}</span>
          </p>
        )}
      </section>

      <nav className="results__actions">
        <button className="btn btn--solid btn--red btn--lg" onClick={onMatch}>
          {t('playMatch')}
        </button>
        <div className="results__minor">
          <button className="btn btn--blue" onClick={onReplay}>
            {t('replay')}
          </button>
          <button className="btn" onClick={onRematch}>
            {t('rematch')}
          </button>
          <button className="btn btn--plain" onClick={onMenu}>
            {t('menu')}
          </button>
        </div>
      </nav>
    </div>
  );
}
