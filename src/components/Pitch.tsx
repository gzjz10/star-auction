import { getPlayer } from '../data';
import type { GameState, TeamIdx } from '../engine/auction';
import { slotsOf } from '../engine/auction';
import { useI18n } from '../i18n';
import './Pitch.css';

/** A printed line-up chart: the pitch in ink rules, players as stamped discs. */
export function Pitch({ game, team }: { game: GameState; team: TeamIdx }) {
  const { label } = useI18n();
  const slots = slotsOf(game.config);
  const picks = new Map(game.teams[team].picks.map((p) => [p.slot, p]));
  return (
    <div className={`pitch pitch--${team === 0 ? 'red' : 'blue'}`}>
      <svg className="pitch__lines" viewBox="0 0 100 140" preserveAspectRatio="none" aria-hidden>
        <rect x="1.5" y="1.5" width="97" height="137" />
        <line x1="1.5" y1="70" x2="98.5" y2="70" />
        <circle cx="50" cy="70" r="12" />
        <rect x="22" y="1.5" width="56" height="20" />
        <rect x="22" y="118.5" width="56" height="20" />
        <rect x="36" y="1.5" width="28" height="7" />
        <rect x="36" y="131.5" width="28" height="7" />
      </svg>
      <ol className="pitch__players">
        {slots.map((s, i) => {
          const pick = picks.get(i);
          if (!pick) return null;
          const p = getPlayer(pick.playerId);
          return (
            <li key={i} style={{ left: `${s.x}%`, top: `${100 - s.y * 0.9 - 5}%` }}>
              <span className="pitch__ovr slab num">{p.ovr}</span>
              <span className="pitch__name">{label(p.short)}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
