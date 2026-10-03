import { useState, type FormEvent } from 'react';
import { CREST_MARKS, CREST_SHAPES, Crest } from '../components/Crest';
import { Back, Star } from '../components/Icons';
import type { Crest as CrestSpec, Difficulty, GameConfig, NewTeam, TeamIdx } from '../engine/auction';
import { FORMATION_IDS, FORMATIONS, type FormationId } from '../engine/formations';
import { randomSeed } from '../engine/rng';
import { RULES } from '../engine/rules';
import { useI18n } from '../i18n';
import './Setup.css';

const SETUP_KEY = 'star-auction:setup:v1';

interface Remembered {
  formation: FormationId;
  difficulty: Difficulty;
  timer: number;
  chemistry: boolean;
  cash: boolean;
  names: [string, string];
  crests: [CrestSpec, CrestSpec];
}

function loadRemembered(): Partial<Remembered> {
  try {
    return JSON.parse(localStorage.getItem(SETUP_KEY) ?? '{}') as Partial<Remembered>;
  } catch {
    return {};
  }
}

const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard', 'legend'];

function CrestPicker({ team, crest, onChange }: { team: TeamIdx; crest: CrestSpec; onChange: (c: CrestSpec) => void }) {
  const { t } = useI18n();
  return (
    <div className="crest-picker">
      <fieldset>
        <legend className="label">{t('shape')}</legend>
        <div className="crest-picker__row">
          {CREST_SHAPES.map((shape) => (
            <button
              type="button"
              key={shape}
              className="crest-picker__opt"
              aria-pressed={crest.shape === shape}
              aria-label={shape}
              onClick={() => onChange({ ...crest, shape })}
            >
              <Crest crest={{ ...crest, shape }} team={team} size={40} />
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="label">{t('mark')}</legend>
        <div className="crest-picker__row">
          {CREST_MARKS.map((mark) => (
            <button
              type="button"
              key={mark}
              className="crest-picker__opt"
              aria-pressed={crest.mark === mark}
              aria-label={mark}
              onClick={() => onChange({ ...crest, mark })}
            >
              <Crest crest={{ ...crest, mark }} team={team} size={40} />
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

export function SetupScreen({
  mode,
  onStart,
  onBack,
}: {
  mode: GameConfig['mode'];
  onStart: (config: GameConfig, teams: [NewTeam, NewTeam]) => void;
  onBack: () => void;
}) {
  const { t, pos } = useI18n();
  const mem = loadRemembered();
  const [formation, setFormation] = useState<FormationId>(mem.formation ?? '4-3-3');
  const [difficulty, setDifficulty] = useState<Difficulty>(mem.difficulty ?? 'normal');
  const [timer, setTimer] = useState<number>(mem.timer ?? RULES.defaultTimer);
  const [chemistry, setChemistry] = useState(mem.chemistry ?? true);
  const [cash, setCash] = useState(mem.cash ?? true);
  const [names, setNames] = useState<[string, string]>(() => [
    mem.names?.[0] || t('defaultRed'),
    mode === 'ai' ? t('defaultAi') : mem.names?.[1] || t('defaultBlue'),
  ]);
  const [crests, setCrests] = useState<[CrestSpec, CrestSpec]>(
    mem.crests ?? [
      { shape: 'shield', mark: 'falcon' },
      { shape: 'round', mark: 'crown' },
    ],
  );
  const [error, setError] = useState<TeamIdx | null>(null);

  const corners: TeamIdx[] = mode === 'ai' ? [0] : [0, 1];

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = names.map((n) => n.trim()) as [string, string];
    const missing = corners.find((c) => !trimmed[c]);
    if (missing !== undefined) {
      setError(missing);
      document.getElementById(`name-${missing}`)?.focus();
      return;
    }
    const remembered: Remembered = { formation, difficulty, timer, chemistry, cash, names: trimmed, crests };
    try {
      localStorage.setItem(SETUP_KEY, JSON.stringify({ ...remembered, names: mode === 'ai' ? [trimmed[0], mem.names?.[1] ?? ''] : trimmed }));
    } catch {
      // not fatal
    }
    onStart({ mode, formation, difficulty, timer, chemistry, cash, seed: randomSeed() }, [
      { name: trimmed[0], crest: crests[0], controller: 'human' },
      { name: mode === 'ai' ? t('defaultAi') : trimmed[1], crest: crests[1], controller: mode === 'ai' ? 'ai' : 'human' },
    ]);
  };

  return (
    <form className="page setup" onSubmit={submit} noValidate>
      <header className="topbar">
        <button type="button" className="icon-btn flip-rtl" onClick={onBack} aria-label={t('back')}>
          <Back />
        </button>
        <h1 className="topbar__title">{t('setupTitle')}</h1>
        <span style={{ width: 44 }} />
      </header>

      <div className="setup__corners">
        {corners.map((c) => (
          <section key={c} className={`setup__corner setup__corner--${c === 0 ? 'red' : 'blue'}`} aria-labelledby={`corner-${c}`}>
            <h2 id={`corner-${c}`} className="setup__corner-title display">
              <Star className="star" /> {c === 0 ? t('redCorner') : t('blueCorner')}
            </h2>
            <div className="setup__identity">
              <Crest crest={crests[c]} team={c} size={88} />
              <div className="setup__name">
                <label htmlFor={`name-${c}`} className="label">
                  {t('teamName')}
                </label>
                <input
                  id={`name-${c}`}
                  className="setup__input display"
                  value={names[c]}
                  maxLength={18}
                  autoComplete="off"
                  aria-invalid={error === c}
                  aria-describedby={error === c ? `name-err-${c}` : undefined}
                  onChange={(e) => {
                    const v = e.target.value;
                    setNames((n) => (c === 0 ? [v, n[1]] : [n[0], v]));
                    if (error === c) setError(null);
                  }}
                />
                {error === c && (
                  <p id={`name-err-${c}`} className="setup__error">
                    {t('nameRequired')}
                  </p>
                )}
              </div>
            </div>
            <CrestPicker team={c} crest={crests[c]} onChange={(cr) => setCrests((cs) => (c === 0 ? [cr, cs[1]] : [cs[0], cr]))} />
          </section>
        ))}

        {mode === 'ai' && (
          <section className="setup__corner setup__corner--blue" aria-labelledby="difficulty-title">
            <h2 id="difficulty-title" className="setup__corner-title display">
              <Star className="star" /> {t('blueCorner')} · {t('difficulty')}
            </h2>
            <div className="setup__difficulty" role="radiogroup" aria-labelledby="difficulty-title">
              {DIFFICULTIES.map((d) => (
                <button
                  type="button"
                  key={d}
                  role="radio"
                  aria-checked={difficulty === d}
                  className="choice"
                  onClick={() => setDifficulty(d)}
                >
                  {t(d)}
                  <small>{t(`${d}Note` as const)}</small>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      <section className="setup__rules" aria-labelledby="formation-title">
        <h2 id="formation-title" className="label">
          {t('formation')}
        </h2>
        <div className="setup__formations" role="radiogroup" aria-labelledby="formation-title">
          {FORMATION_IDS.map((f) => (
            <button
              type="button"
              key={f}
              role="radio"
              aria-checked={formation === f}
              className="setup__formation"
              onClick={() => setFormation(f)}
            >
              <svg viewBox="0 0 100 70" aria-hidden className="setup__mini-pitch">
                <rect x="1" y="1" width="98" height="68" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <line x1="50" y1="1" x2="50" y2="69" stroke="currentColor" strokeWidth="1" />
                {FORMATIONS[f].slots.map((s, i) => (
                  <circle key={i} cx={4 + (s.y / 100) * 92} cy={4 + (s.x / 100) * 62} r="3.6" fill="currentColor" />
                ))}
              </svg>
              <span className="num display">{f}</span>
            </button>
          ))}
        </div>
        <p className="setup__slots muted">
          {FORMATIONS[formation].slots.map((s) => pos(s.kind).short).join(' · ')}
        </p>

        <div className="setup__grid">
          <fieldset>
            <legend className="label">{t('timer')}</legend>
            <div className="choices" role="radiogroup">
              {RULES.timerOptions.map((s) => (
                <button type="button" key={s} role="radio" aria-checked={timer === s} className="choice" onClick={() => setTimer(s)}>
                  {s === 0 ? t('timerOff') : t('seconds', { n: s })}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="label">{t('scoring')}</legend>
            <div className="choices">
              <button type="button" className="choice" aria-pressed={chemistry} onClick={() => setChemistry((v) => !v)}>
                {t('chemistry')}
                <small>{t('chemistryNote')}</small>
              </button>
              <button type="button" className="choice" aria-pressed={cash} onClick={() => setCash((v) => !v)}>
                {t('cashPoints')}
                <small>{t('cashNote', { n: RULES.cashPerPoint })}</small>
              </button>
            </div>
          </fieldset>
        </div>
      </section>

      <div className="setup__go">
        <button type="submit" className="btn btn--solid btn--red btn--lg">
          {t('start')}
        </button>
      </div>
    </form>
  );
}
