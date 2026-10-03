import { useEffect, useMemo, useRef, useState } from 'react';
import { Crest } from '../components/Crest';
import { Back } from '../components/Icons';
import { getPlayer } from '../data';
import { squadOf, type GameState, type TeamIdx } from '../engine/auction';
import { simulateMatch, type MatchEvent } from '../engine/match';
import { scoreSquad } from '../engine/scoring';
import { useI18n } from '../i18n';
import { play } from '../lib/sound';
import './Match.css';

interface Props {
  game: GameState;
  seed: number;
  onDone: (score: [number, number]) => void;
  onBack: () => void;
}

/** Real seconds per match minute at 1x. */
const SECONDS_PER_MINUTE = 0.42;

function timeline(events: MatchEvent[]) {
  const firstStop = events.find((e) => e.type === 'half')?.plus ?? 0;
  let secondHalf = false;
  return events.map((e) => {
    if (e.type === 'half') {
      secondHalf = true;
      return 45 + firstStop;
    }
    const base = e.minute + (e.plus ?? 0);
    return secondHalf ? base + firstStop : base;
  });
}

function clockLabel(tick: number, firstStop: number): string {
  const t = Math.floor(tick);
  if (t <= 45) return `${t}'`;
  if (t <= 45 + firstStop) return `45+${t - 45}'`;
  const m = t - firstStop;
  if (m <= 90) return `${m}'`;
  return `90+${m - 90}'`;
}

export function MatchScreen({ game, seed, onDone, onBack }: Props) {
  const { t, label } = useI18n();
  const result = useMemo(() => {
    const opts = { chemistry: game.config.chemistry, cash: false };
    const chem = ([0, 1] as const).map((ti) => {
      const s = scoreSquad(squadOf(game, ti), 0, opts);
      return s.club + s.nation + s.league;
    }) as [number, number];
    return simulateMatch([squadOf(game, 0), squadOf(game, 1)], seed, chem);
  }, [game, seed]);

  const ticks = useMemo(() => timeline(result.events), [result]);
  const firstStop = result.events.find((e) => e.type === 'half')?.plus ?? 0;
  const end = ticks[ticks.length - 1];

  const [speed, setSpeed] = useState(1);
  const [tick, setTick] = useState(0);
  const done = tick >= end;
  const reported = useRef(false);
  const lastSeen = useRef(-1);

  useEffect(() => {
    if (done) return;
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setTick((x) => Math.min(end, x + (dt / SECONDS_PER_MINUTE) * speed));
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [speed, done, end]);

  const shown = result.events.filter((_, i) => ticks[i] <= tick);

  // Cues for newly revealed events.
  useEffect(() => {
    const idx = shown.length - 1;
    if (idx <= lastSeen.current) return;
    const fresh = shown.slice(lastSeen.current + 1);
    lastSeen.current = idx;
    if (fresh.length > 4) return; // skipped ahead: stay quiet
    for (const e of fresh) {
      if (e.type === 'goal') play('goal');
      else if (e.type === 'kickoff' || e.type === 'half' || e.type === 'full') play('whistle');
    }
  }, [shown]);

  useEffect(() => {
    if (done && !reported.current) {
      reported.current = true;
      onDone(result.score);
    }
  }, [done, onDone, result.score]);

  const score = shown.reduce<[number, number]>((s, e) => (e.type === 'goal' ? e.score : s), [0, 0]);
  const name = (id: string) => label(getPlayer(id).short);
  const team = (ti: TeamIdx) => game.teams[ti].name;

  const describe = (e: MatchEvent): string => {
    switch (e.type) {
      case 'kickoff':
        return t('kickoff');
      case 'half':
        return t('halfTime');
      case 'full':
        return t('fullTime');
      case 'goal':
        return `${t('goal', { player: name(e.scorer) })}${e.assist ? ` · ${t('assistBy', { player: name(e.assist) })}` : ''}`;
      case 'save':
        return t('save', { keeper: name(e.keeper), player: name(e.shooter) });
      case 'miss':
        return t('miss', { player: name(e.shooter) });
      case 'yellow':
        return t('yellow', { player: name(e.player) });
    }
  };

  const lastAttack = [...shown].reverse().find((e) => 'team' in e) as { team: TeamIdx; type: string } | undefined;
  // Ball marker: drifts towards the goal of the side that last attacked.
  const ball = lastAttack ? (lastAttack.team === 0 ? (lastAttack.type === 'goal' ? 97 : 80) : lastAttack.type === 'goal' ? 3 : 20) : 50;

  const winner: TeamIdx | null = result.score[0] > result.score[1] ? 0 : result.score[1] > result.score[0] ? 1 : null;

  return (
    <div className="page match">
      <header className="topbar">
        <button className="icon-btn flip-rtl" onClick={onBack} aria-label={t('backToBill')}>
          <Back />
        </button>
        <span />
      </header>

      <section className="board" aria-live="off">
        <div className="board__side board__side--red">
          <Crest crest={game.teams[0].crest} team={0} size={48} />
          <span className="display">{team(0)}</span>
        </div>
        <div className="board__score">
          <span className="board__goals display num" aria-label={`${score[0]} - ${score[1]}`}>
            <span className="ink-red">{score[0]}</span>
            <span className="board__dash">–</span>
            <span className="ink-blue">{score[1]}</span>
          </span>
          <span className="board__clock display num">{done ? t('fullTime') : clockLabel(tick, firstStop)}</span>
        </div>
        <div className="board__side board__side--blue">
          <Crest crest={game.teams[1].crest} team={1} size={48} />
          <span className="display">{team(1)}</span>
        </div>
      </section>

      <p className="match__lede slab">{t('matchTitle')}</p>

      <div className="field" aria-hidden>
        <div className="field__half" />
        <span className="field__ball" style={{ left: `${ball}%` }} />
      </div>

      {!done ? (
        <div className="match__controls">
          <div className="choices" role="radiogroup" aria-label={t('speed')}>
            {[1, 2, 4].map((s) => (
              <button key={s} role="radio" aria-checked={speed === s} className="choice num" onClick={() => setSpeed(s)}>
                ×{s}
              </button>
            ))}
          </div>
          <button className="btn btn--sm" onClick={() => setTick(end)}>
            {t('skip')}
          </button>
        </div>
      ) : (
        <section className="match__final">
          <h2 className={`display ${winner === 0 ? 'ink-red' : winner === 1 ? 'ink-blue' : ''}`}>
            {winner === null ? t('matchDraw') : t('matchWinner', { team: team(winner) })}
          </h2>
          <table className="match__stats">
            <thead>
              <tr>
                <th className="ink-red">{team(0)}</th>
                <th />
                <th className="ink-blue">{team(1)}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="num">{result.possession[0]}%</td>
                <th scope="row">{t('possession')}</th>
                <td className="num">{result.possession[1]}%</td>
              </tr>
              <tr>
                <td className="num">{result.shots[0]}</td>
                <th scope="row">{t('shots')}</th>
                <td className="num">{result.shots[1]}</td>
              </tr>
              <tr>
                <td className="num">{result.onTarget[0]}</td>
                <th scope="row">{t('onTarget')}</th>
                <td className="num">{result.onTarget[1]}</td>
              </tr>
            </tbody>
          </table>
          <button className="btn btn--solid btn--lg" onClick={onBack}>
            {t('backToBill')}
          </button>
        </section>
      )}

      <ol className="feed" aria-live="polite" aria-relevant="additions">
        {shown
          .map((e, i) => ({ e, i }))
          .reverse()
          .map(({ e, i }) => (
            <li
              key={i}
              className={`feed__row feed__row--${e.type} ${'team' in e ? (e.team === 0 ? 'is-red' : 'is-blue') : ''}`}
            >
              <span className="feed__min num">
                {e.type === 'kickoff' ? "0'" : `${e.minute}${e.plus ? `+${e.plus}` : ''}'`}
              </span>
              <span className="feed__text">{describe(e)}</span>
              {e.type === 'goal' && <span className="feed__score display num">{`${e.score[0]}–${e.score[1]}`}</span>}
            </li>
          ))}
      </ol>
    </div>
  );
}
