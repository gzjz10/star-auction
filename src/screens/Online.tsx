import { useState, type FormEvent } from 'react';
import { Crest } from '../components/Crest';
import { Back, Star } from '../components/Icons';
import type { Crest as CrestSpec, NewTeam } from '../engine/auction';
import { useI18n } from '../i18n';
import { CODE_LENGTH, GUEST_SEAT, normalizeCode } from '../online/protocol';
import type { OnlineSession } from '../online/useOnline';
import { CrestPicker, loadRemembered } from './Setup';
import './Online.css';

interface Props {
  session: OnlineSession | null;
  /** Prefilled from a shared ?room= link. */
  initialCode: string;
  onHost: () => void;
  onJoin: (code: string, team: Omit<NewTeam, 'controller'>) => void;
  onLeave: () => void;
  onBack: () => void;
}

function roomLink(code: string): string {
  return `${location.origin}${location.pathname}?room=${code}`;
}

function RoomTicket({ code }: { code: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const canShare = typeof navigator.share === 'function';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked: the code is on screen to read out.
    }
  };
  const share = async () => {
    try {
      await navigator.share({ title: t('appName'), text: t('shareText', { code }), url: roomLink(code) });
    } catch {
      // Dismissed.
    }
  };

  return (
    <div className="ticket">
      <span className="label">{t('roomCode')}</span>
      <output className="ticket__code slab num" aria-live="polite" dir="ltr">
        {code}
      </output>
      <p className="muted">{t('roomShare')}</p>
      <div className="ticket__actions">
        {canShare && (
          <button type="button" className="btn btn--solid btn--red" onClick={share}>
            {t('shareLink')}
          </button>
        )}
        <button type="button" className="btn" onClick={copy}>
          {copied ? t('copied') : t('copyCode')}
        </button>
      </div>
      <p className="ticket__link muted" dir="ltr">
        {roomLink(code)}
      </p>
    </div>
  );
}

function JoinForm({ initialCode, onJoin }: { initialCode: string; onJoin: Props['onJoin'] }) {
  const { t } = useI18n();
  const mem = loadRemembered();
  const [code, setCode] = useState(initialCode);
  const [name, setName] = useState(mem.names?.[0] || t('defaultBlue'));
  const [crest, setCrest] = useState<CrestSpec>(mem.crests?.[1] ?? { shape: 'round', mark: 'crown' });
  const [error, setError] = useState<'code' | 'name' | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const c = normalizeCode(code);
    if (!c) {
      setError('code');
      document.getElementById('join-code')?.focus();
      return;
    }
    if (!name.trim()) {
      setError('name');
      document.getElementById('join-name')?.focus();
      return;
    }
    onJoin(c, { name: name.trim(), crest });
  };

  return (
    <form className="online__card online__card--blue" onSubmit={submit} noValidate aria-labelledby="join-title">
      <h2 id="join-title" className="display">
        <Star className="star" /> {t('joinRoom')}
      </h2>
      <p className="muted">{t('joinRoomNote')}</p>

      <label htmlFor="join-code" className="label">
        {t('roomCode')}
      </label>
      <input
        id="join-code"
        className="online__code slab num"
        value={code}
        dir="ltr"
        maxLength={CODE_LENGTH + 2}
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        inputMode="text"
        placeholder="ABC23"
        aria-invalid={error === 'code'}
        aria-describedby={error === 'code' ? 'join-code-err' : undefined}
        onChange={(e) => {
          setCode(e.target.value.toUpperCase());
          if (error === 'code') setError(null);
        }}
      />
      {error === 'code' && (
        <p id="join-code-err" className="setup__error">
          {t('codeInvalid', { n: CODE_LENGTH })}
        </p>
      )}

      <div className="setup__identity">
        <Crest crest={crest} team={GUEST_SEAT} size={72} />
        <div className="setup__name">
          <label htmlFor="join-name" className="label">
            {t('teamName')}
          </label>
          <input
            id="join-name"
            className="setup__input display"
            value={name}
            maxLength={18}
            autoComplete="off"
            aria-invalid={error === 'name'}
            aria-describedby={error === 'name' ? 'join-name-err' : undefined}
            onChange={(e) => {
              setName(e.target.value);
              if (error === 'name') setError(null);
            }}
          />
          {error === 'name' && (
            <p id="join-name-err" className="setup__error">
              {t('nameRequired')}
            </p>
          )}
        </div>
      </div>
      <CrestPicker team={GUEST_SEAT} crest={crest} onChange={setCrest} />

      <button type="submit" className="btn btn--solid btn--blue btn--lg">
        {t('join')}
      </button>
    </form>
  );
}

const PROBLEMS = {
  notFound: 'roomNotFound',
  full: 'roomFull',
  version: 'roomVersion',
  failed: 'roomFailed',
} as const;

export function OnlineScreen({ session, initialCode, onHost, onJoin, onLeave, onBack }: Props) {
  const { t } = useI18n();
  const status = session?.status;
  const problem = status && status in PROBLEMS ? PROBLEMS[status as keyof typeof PROBLEMS] : null;

  let body;
  if (problem) {
    body = (
      <div className="online__state" role="alert">
        <p className="online__problem slab">{t(problem)}</p>
        <button type="button" className="btn btn--solid" onClick={onLeave}>
          {t('tryAgain')}
        </button>
      </div>
    );
  } else if (session?.role === 'host') {
    body = (
      <div className="online__state">
        {session.code ? <RoomTicket code={session.code} /> : null}
        <p className="online__wait" role="status">
          <span className="online__pulse" aria-hidden />
          {session.code ? t('roomWaiting') : t('roomOpening')}
        </p>
        <button type="button" className="btn btn--sm btn--plain" onClick={onLeave}>
          {t('cancel')}
        </button>
      </div>
    );
  } else if (session?.role === 'guest') {
    body = (
      <div className="online__state">
        <p className="online__wait" role="status">
          <span className="online__pulse online__pulse--blue" aria-hidden />
          {t('connecting', { code: session.code ?? '' })}
        </p>
        <button type="button" className="btn btn--sm btn--plain" onClick={onLeave}>
          {t('cancel')}
        </button>
      </div>
    );
  } else {
    body = (
      <div className="online__choices">
        <section className="online__card online__card--red" aria-labelledby="host-title">
          <h2 id="host-title" className="display">
            <Star className="star" /> {t('hostRoom')}
          </h2>
          <p className="muted">{t('hostRoomNote')}</p>
          <button type="button" className="btn btn--solid btn--red btn--lg" onClick={onHost}>
            {t('hostRoom')}
          </button>
        </section>
        <JoinForm initialCode={initialCode} onJoin={onJoin} />
      </div>
    );
  }

  return (
    <div className="page online">
      <header className="topbar">
        <button type="button" className="icon-btn flip-rtl" onClick={onBack} aria-label={t('back')}>
          <Back />
        </button>
        <h1 className="topbar__title">{t('onlineTitle')}</h1>
        <span style={{ width: 44 }} />
      </header>
      {body}
    </div>
  );
}
