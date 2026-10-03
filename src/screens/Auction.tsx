import { useEffect, useMemo, useRef, useState } from 'react';
import { ClubBadge, Flag } from '../components/Badges';
import { Crest } from '../components/Crest';
import { FitText } from '../components/FitText';
import { Back, SoundOff, SoundOn, Star } from '../components/Icons';
import { getClub, getNation, getPlayer } from '../data';
import type { GoalkeeperStats, OutfieldStats, Player } from '../data/types';
import { aiDecide, aiThinkMs } from '../engine/ai';
import {
  minBid,
  raiseOptions,
  slotsOf,
  totalRounds,
  type Action,
  type GameState,
  type TeamIdx,
} from '../engine/auction';
import { fmtMoney, useI18n } from '../i18n';
import { play } from '../lib/sound';
import './Auction.css';

interface Props {
  game: GameState;
  dispatch: (a: Action) => void;
  sound: boolean;
  onToggleSound: () => void;
  onQuit: () => void;
  onFinish: () => void;
}

const corner = (t: TeamIdx) => (t === 0 ? 'red' : 'blue');

/* ---------- Turn clock ---------- */

function useTurnClock(game: GameState, dispatch: (a: Action) => void): number | null {
  const active = game.phase === 'bidding' && game.config.timer > 0 && game.teams[game.turn].controller === 'human';
  const [left, setLeft] = useState<number | null>(active ? game.config.timer : null);
  useEffect(() => {
    if (!active) {
      setLeft(null);
      return;
    }
    const total = game.config.timer;
    const deadline = Date.now() + total * 1000;
    let lastWhole = total;
    setLeft(total);
    const id = window.setInterval(() => {
      const l = Math.max(0, (deadline - Date.now()) / 1000);
      setLeft(l);
      const whole = Math.ceil(l);
      if (whole !== lastWhole) {
        lastWhole = whole;
        if (whole > 0 && whole <= 5) play('tick');
      }
      if (l <= 0) {
        window.clearInterval(id);
        dispatch({ type: 'timeout', seq: game.seq });
      }
    }, 100);
    return () => window.clearInterval(id);
    // The clock restarts only when the turn changes (seq), never on re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.seq, active]);
  return left;
}

/* ---------- AI corner ---------- */

function useAiTurn(game: GameState, dispatch: (a: Action) => void) {
  useEffect(() => {
    if (game.phase !== 'bidding') return;
    const team = game.turn;
    if (game.teams[team].controller !== 'ai') return;
    const id = window.setTimeout(() => {
      const move = aiDecide(game, team);
      dispatch(
        move.type === 'bid'
          ? { type: 'bid', team, amount: move.amount, seq: game.seq }
          : { type: 'pass', team, seq: game.seq },
      );
    }, aiThinkMs(game, team));
    // One scheduled move per accepted action; a stale move is refused by seq anyway.
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.seq]);
}

/* ---------- Sound cues follow the state, not the clicks ---------- */

function useCues(game: GameState) {
  const prev = useRef(game);
  useEffect(() => {
    const p = prev.current;
    prev.current = game;
    if (p === game || p.seq === game.seq) return;
    if (game.phase === 'sold' && p.phase === 'bidding') play('sold');
    else if (game.bid.history.length > p.bid.history.length) play('stamp');
    else if (game.phase === 'bidding' && game.passes > p.passes) play('pass');
  }, [game]);
}

/* ---------- Pieces ---------- */

function BoutBand({ game }: { game: GameState }) {
  const { t } = useI18n();
  return (
    <section className="bout" aria-label={`${game.teams[0].name} ${t('vs')} ${game.teams[1].name}`}>
      {([0, 1] as const).map((ti) => {
        const team = game.teams[ti];
        const last = team.picks.at(-1);
        const isTurn = game.phase === 'bidding' && game.turn === ti;
        return (
          <div key={ti} className={`bout__side bout__side--${corner(ti)}`} data-turn={isTurn || undefined}>
            <Crest crest={team.crest} team={ti} size={44} />
            <div className="bout__who">
              <span className="visually-hidden">{ti === 0 ? t('redCorner') : t('blueCorner')}: </span>
              <span className="bout__name display">{team.name}</span>
            </div>
            <div className="bout__money">
              <span className="visually-hidden">{t('budget')}</span>
              <span className="bout__budget display num">{fmtMoney(team.budget)}</span>
              {last && last.price > 0 && <span className="bout__delta num">−{fmtMoney(last.price)}</span>}
            </div>
          </div>
        );
      })}
      <span className="bout__vs slab" aria-hidden>
        {t('vs')}
      </span>
    </section>
  );
}

function isGk(s: OutfieldStats | GoalkeeperStats): s is GoalkeeperStats {
  return 'div' in s;
}

function StatLine({ player }: { player: Player }) {
  const { stat } = useI18n();
  const entries = Object.entries(player.stats) as [string, number][];
  return (
    <dl className="stats" data-gk={isGk(player.stats) || undefined}>
      {entries.map(([k, v]) => (
        <div key={k} className="stats__cell">
          <dt className="label">{stat(k)}</dt>
          <dd className="display num">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function LotPoster({ game }: { game: GameState }) {
  const { t, label, pos } = useI18n();
  const p = getPlayer(game.lot.openId);
  const name = label(p.name);
  const s = game.settlement;
  return (
    <article className="lot" aria-labelledby="lot-name" aria-describedby="lot-meta">
      <h2 id="lot-name" className="lot__name">
        <FitText className="display worn offreg-blue" min={34} max={96}>
          {name}
        </FitText>
      </h2>
      <p id="lot-meta" className="lot__meta">
        <span className="lot__pos">{pos(game.lot.kind).long}</span>
        <span className="lot__dot" aria-hidden>
          <Star />
        </span>
        <ClubBadge code={p.club} size={30} />
        <span>{label(getClub(p.club).name)}</span>
        <span className="lot__dot" aria-hidden>
          <Star />
        </span>
        <Flag code={p.nation} />
        <span>{label(getNation(p.nation).name)}</span>
        <span className="lot__dot" aria-hidden>
          <Star />
        </span>
        <span className="num">{p.age}</span>
      </p>
      <StatLine player={p} />
      <div className="lot__value">
        <span className="lot__rating ink-block" aria-label={`OVR ${p.ovr}`}>
          <span className="slab num">{p.ovr}</span>
        </span>
        <span className="label">{t('marketValue')}</span>
        <span className="display num">{fmtMoney(p.value)}</span>
        <span className="label">{t('opening')}</span>
        <span className="display num">{fmtMoney(game.lot.opening)}</span>
      </div>

      {s && (
        <div className={`stamp stamp--${corner(s.openTo)}`} role="status">
          <span className="stamp__word display">{s.reason === 'won' ? t('sold') : t('free')}</span>
          <span className="stamp__to">
            {s.reason === 'won'
              ? t('soldTo', { team: game.teams[s.openTo].name, price: fmtMoney(s.price) })
              : game.teams[s.openTo].name}
          </span>
        </div>
      )}
    </article>
  );
}

function Mystery({ game }: { game: GameState }) {
  const { t, label } = useI18n();
  const s = game.settlement;
  if (!s) {
    return (
      <aside className="mystery ink-block" aria-label={`${t('mystery')}: ${t('mysteryNote')}`} title={t('mysteryNote')}>
        <Star />
        <span className="mystery__title display" aria-hidden>
          {t('mystery')}
        </span>
        <Star />
        <span className="mystery__q slab" aria-hidden>
          ?
        </span>
        <Star />
      </aside>
    );
  }
  const h = getPlayer(game.lot.hiddenId);
  const open = getPlayer(game.lot.openId);
  const gem = h.ovr >= open.ovr;
  return (
    <aside className={`mystery mystery--open mystery--${corner(s.hiddenTo)}`} aria-live="polite">
      <div className="mystery__text">
        <span className="label">{t('hiddenTo', { team: game.teams[s.hiddenTo].name })}</span>
        <span className="mystery__name display">{label(h.short)}</span>
        <span className="mystery__line">
          <ClubBadge code={h.club} size={22} />
          <Flag code={h.nation} />
          <span className="slab num">{h.ovr}</span>
          <span className="num muted">{fmtMoney(h.value)}</span>
          {gem && <span className="mystery__gem display">{t('gem')}</span>}
        </span>
      </div>
    </aside>
  );
}

function BidBand({ game, clock }: { game: GameState; clock: number | null }) {
  const { t } = useI18n();
  const { bid } = game;
  const holder = bid.holder;
  const prev = bid.history.length > 1 ? bid.history[bid.history.length - 2] : null;
  const total = game.config.timer;
  const turnTeam = game.teams[game.turn];
  const announce = clock !== null && (Math.ceil(clock) === 10 || Math.ceil(clock) === 5) ? Math.ceil(clock) : null;

  return (
    <section className={`bid ${holder !== null ? `bid--${corner(holder)}` : ''}`} aria-label={t('topBid')}>
      <div className="bid__label label">{holder !== null ? t('topBid') : t('noBidYet')}</div>
      <div className="bid__figure">
        {prev && (
          <span className="bid__ghost display num" aria-hidden>
            {fmtMoney(prev.amount)}
          </span>
        )}
        <span key={game.seq} className="bid__amount display num worn" aria-live="polite">
          {holder !== null ? fmtMoney(bid.amount) : fmtMoney(game.lot.opening)}
        </span>
      </div>
      <div className="bid__holder">
        {holder !== null ? t('leads', { team: game.teams[holder].name }) : t('opening')}
      </div>
      {game.phase === 'bidding' && (
        <div className={`fuse fuse--${corner(game.turn)}`}>
          <span className="fuse__who label">
            {turnTeam.controller === 'ai' ? t('thinking', { team: turnTeam.name }) : t('turnOf', { team: turnTeam.name })}
          </span>
          {clock !== null && total > 0 && (
            <>
              <span
                className="fuse__line"
                data-low={clock <= 5 || undefined}
                style={{ transform: `scaleX(${clock / total})` }}
                aria-hidden
              />
              <span className="fuse__secs num" aria-hidden>
                {Math.ceil(clock)}
              </span>
              {announce && <span className="visually-hidden" role="status">{t('timeLeft', { n: announce })}</span>}
            </>
          )}
        </div>
      )}
    </section>
  );
}

function Controls({ game, dispatch, onFinish }: { game: GameState; dispatch: (a: Action) => void; onFinish: () => void }) {
  const { t } = useI18n();
  const nextRef = useRef<HTMLButtonElement>(null);
  const team = game.turn;
  const human = game.teams[team].controller === 'human';
  const options = raiseOptions(game);
  const budget = game.teams[team].budget;
  const affordable = minBid(game) <= budget;
  const last = game.lot.slot + 1 >= totalRounds(game.config);

  const bid = (amount: number) => dispatch({ type: 'bid', team, amount, seq: game.seq });
  const pass = () => dispatch({ type: 'pass', team, seq: game.seq });
  const next = () => {
    dispatch({ type: 'next' });
    if (last) onFinish();
  };

  // Keyboard play: 1-3 raise, Space pass, Enter next.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey || e.altKey) return;
      if (game.phase === 'sold' && e.key === 'Enter' && document.activeElement !== nextRef.current) {
        e.preventDefault();
        next();
        return;
      }
      if (game.phase !== 'bidding' || !human) return;
      const i = ['1', '2', '3'].indexOf(e.key);
      if (i >= 0 && options[i] !== undefined) {
        e.preventDefault();
        bid(options[i]);
      } else if (e.key === ' ' && !(document.activeElement instanceof HTMLButtonElement)) {
        e.preventDefault();
        pass();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  useEffect(() => {
    if (game.phase === 'sold') nextRef.current?.focus({ preventScroll: true });
  }, [game.phase]);

  if (game.phase === 'sold') {
    const s = game.settlement!;
    return (
      <div className="controls controls--sold">
        {s.reason === 'unbid' && <p className="controls__note">{t('unbid', { team: game.teams[s.openTo].name })}</p>}
        <button ref={nextRef} className="btn btn--solid btn--lg controls__next" onClick={next}>
          {last ? t('finalBell') : t('nextRound')}
        </button>
      </div>
    );
  }

  const ink = corner(team);
  return (
    <div className={`controls controls--${ink}`} aria-busy={!human || undefined}>
      <div className="controls__raises">
        {options.slice(0, 3).map((amount, i) => (
          <button
            key={amount}
            className={`btn btn--${ink} ${i === 0 ? 'btn--solid' : ''}`}
            disabled={!human}
            onClick={() => bid(amount)}
            aria-keyshortcuts={String(i + 1)}
          >
            <span className="num">{fmtMoney(amount)}</span>
          </button>
        ))}
        {options.length === 0 && affordable === false && <p className="controls__note">{t('cannotAfford')}</p>}
      </div>
      <div className="controls__row">
        {human && affordable && budget > (options[2] ?? options.at(-1) ?? 0) && (
          <button className={`btn btn--sm btn--${ink}`} onClick={() => bid(budget)}>
            <span className="btn__stack">
              <span>{t('allIn')}</span>
              <span className="num">{fmtMoney(budget)}</span>
            </span>
          </button>
        )}
        <button className="btn controls__pass" disabled={!human} onClick={pass} aria-keyshortcuts="Space">
          {t('pass')}
        </button>
      </div>
      <p className="controls__hint muted">{game.bid.holder !== null ? t('passHint') : t('passHintOpen')}</p>
    </div>
  );
}

function SquadSheet({ game, team }: { game: GameState; team: TeamIdx }) {
  const { t, label, pos } = useI18n();
  const slots = slotsOf(game.config);
  const picks = new Map(game.teams[team].picks.map((p) => [p.slot, p]));
  const order = slots.map((s, i) => ({ ...s, i })).sort((a, b) => a.y - b.y || a.x - b.x);
  const spent = game.teams[team].picks.reduce((s, p) => s + p.price, 0);
  return (
    <section className={`sheet sheet--${corner(team)}`} aria-label={`${t('squad')} · ${game.teams[team].name}`}>
      <header className="sheet__head">
        <Crest crest={game.teams[team].crest} team={team} size={30} />
        <span className="display">{game.teams[team].name}</span>
        <span className="sheet__spent num muted">
          {t('spent')} {fmtMoney(spent)}
        </span>
      </header>
      <ol className="sheet__list">
        {order.map((s) => {
          const pick = picks.get(s.i);
          const current = s.i === game.lot.slot && game.phase === 'bidding';
          const p = pick ? getPlayer(pick.playerId) : null;
          return (
            <li key={s.i} className="sheet__row" data-current={current || undefined} data-filled={!!p || undefined}>
              <span className="sheet__pos label">{pos(s.kind).short}</span>
              {p ? (
                <>
                  <span className="sheet__name">{label(p.short)}</span>
                  <span className="sheet__ovr num">{p.ovr}</span>
                  <span className="sheet__price num">
                    {pick!.price > 0 ? (
                      fmtMoney(pick!.price)
                    ) : pick!.via === 'hidden' ? (
                      <span title={t('mystery')}>
                        <Star />
                        <span className="visually-hidden">{t('mystery')}</span>
                      </span>
                    ) : (
                      t('free')
                    )}
                  </span>
                </>
              ) : (
                <span className="sheet__name sheet__name--empty">{current ? <Star /> : t('emptySlot')}</span>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/* ---------- Screen ---------- */

export function AuctionScreen({ game, dispatch, sound, onToggleSound, onQuit, onFinish }: Props) {
  const { t } = useI18n();
  const clock = useTurnClock(game, dispatch);
  useAiTurn(game, dispatch);
  useCues(game);
  const [tab, setTab] = useState<TeamIdx>(0);
  const rounds = totalRounds(game.config);
  const round = game.lot.slot + 1;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'm' || e.key === 'M') && !(e.target instanceof HTMLInputElement)) onToggleSound();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onToggleSound]);

  const stars = useMemo(() => Array.from({ length: rounds }, (_, i) => i), [rounds]);

  return (
    <div className="page auction">
      <header className="auction__top">
        <button className="icon-btn flip-rtl" onClick={onQuit} aria-label={t('quit')} title={t('quitConfirm')}>
          <Back />
        </button>
        <div className="auction__round">
          <span className="display">{t('round', { r: round, n: rounds })}</span>
          <span className="auction__stars" aria-hidden>
            {stars.map((i) => (
              <Star key={i} className={`star ${i < game.lot.slot || (i === game.lot.slot && game.phase === 'sold') ? 'is-done' : i === game.lot.slot ? 'is-now' : ''}`} />
            ))}
          </span>
        </div>
        <button className="icon-btn" onClick={onToggleSound} aria-label={t('sound')} aria-pressed={sound}>
          {sound ? <SoundOn /> : <SoundOff />}
        </button>
      </header>

      <BoutBand game={game} />

      <div className="auction__stage">
        <div className="auction__side auction__side--red">
          <SquadSheet game={game} team={0} />
        </div>

        <main className="auction__centre">
          <div className="auction__lots">
            <LotPoster game={game} />
            <Mystery game={game} />
          </div>
          <div className="auction__dock">
            <BidBand game={game} clock={clock} />
            <Controls game={game} dispatch={dispatch} onFinish={onFinish} />
          </div>
        </main>

        <div className="auction__side auction__side--blue">
          <SquadSheet game={game} team={1} />
        </div>

        <div className="auction__tabs">
          <div className="auction__tablist" role="tablist" aria-label={t('squad')}>
            {([0, 1] as const).map((ti) => (
              <button
                key={ti}
                role="tab"
                id={`tab-${ti}`}
                aria-selected={tab === ti}
                aria-controls={`panel-${ti}`}
                className={`auction__tab auction__tab--${corner(ti)}`}
                onClick={() => setTab(ti)}
              >
                {game.teams[ti].name}
              </button>
            ))}
          </div>
          <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
            <SquadSheet game={game} team={tab} />
          </div>
        </div>
      </div>
      <p className="auction__keys muted">{t('keys')}</p>
    </div>
  );
}
