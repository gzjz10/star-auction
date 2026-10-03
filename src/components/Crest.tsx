import type { Crest as CrestSpec, CrestMark, CrestShape, TeamIdx } from '../engine/auction';

export const CREST_SHAPES: CrestShape[] = ['shield', 'round', 'pennant', 'diamond'];
export const CREST_MARKS: CrestMark[] = ['star', 'crescent', 'falcon', 'ball', 'crown', 'palm'];

const SHAPES: Record<CrestShape, string> = {
  shield: 'M50 4 92 15v35c0 24-18 41-42 47C26 91 8 74 8 50V15z',
  round: 'M50 4a46 46 0 110 92 46 46 0 010-92z',
  pennant: 'M8 6h84v54L50 96 8 60z',
  diamond: 'M50 3l47 47-47 47L3 50z',
};

const INNER: Record<CrestShape, string> = {
  shield: 'M50 11 85 20v30c0 20-15 34-35 40-20-6-35-20-35-40V20z',
  round: 'M50 11a39 39 0 110 78 39 39 0 010-78z',
  pennant: 'M15 13h70v44L50 87 15 57z',
  diamond: 'M50 12l38 38-38 38-38-38z',
};

function Mark({ mark }: { mark: CrestMark }) {
  switch (mark) {
    case 'star':
      return <path d="M50 26l6.5 15 16.2 1.3-12.3 10.6 3.8 15.8L50 60.3l-14.2 8.4 3.8-15.8-12.3-10.6 16.2-1.3z" />;
    case 'crescent':
      return <path d="M58 26a24 24 0 100 48 20 20 0 110-48z" />;
    case 'falcon':
      return (
        <path d="M26 44c9-6 19-8 28-6l8-8c3-3 8-3 11 0l-6 3 2 4 9 1-8 5c-2 6-7 11-14 13l4 11-8-3-4 6-3-9c-9-2-15-8-19-17z" />
      );
    case 'ball':
      return (
        <>
          <circle cx="50" cy="50" r="22" />
          <path
            d="M50 38l9 6.5-3.4 10.6H44.4L41 44.5z M50 30v8 M59 44.5l8-2.5 M55.6 55.1l5 6.9 M44.4 55.1l-5 6.9 M41 44.5l-8-2.5"
            fill="none"
            stroke="var(--crest-ink)"
            strokeWidth="2.6"
          />
          <path d="M50 38l9 6.5-3.4 10.6H44.4L41 44.5z" fill="var(--crest-ink)" />
        </>
      );
    case 'crown':
      return <path d="M27 66V37l12 11 11-19 11 19 12-11v29zM27 70h46v6H27z" />;
    case 'palm':
      return (
        <path d="M48 76l3-30h4l-2 30zM52 44c-6-10-17-12-26-8 9 0 16 4 20 10-8-3-17-1-22 6 8-3 16-3 22 0zm2 0c6-10 17-12 26-8-9 0-16 4-20 10 8-3 17-1 22 6-8-3-16-3-22 0zM52 42c-2-8 1-15 8-19-4 6-5 12-5 19z" />
      );
  }
}

/** A team crest printed in its corner's ink. Colour is never the only signal: the corner is also named in text. */
export function Crest({ crest, team, size = 56, title }: { crest: CrestSpec; team: TeamIdx; size?: number; title?: string }) {
  const ink = team === 0 ? 'var(--red)' : 'var(--blue)';
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      style={{ ['--crest-ink' as string]: ink, flex: 'none' }}
    >
      <path d={SHAPES[crest.shape]} fill={ink} />
      <path d={INNER[crest.shape]} fill="none" stroke="var(--stock)" strokeWidth="2.5" />
      <g fill="var(--stock)">
        <Mark mark={crest.mark} />
      </g>
    </svg>
  );
}
