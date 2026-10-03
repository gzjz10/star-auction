import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;

const base = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'square' as const, strokeLinejoin: 'miter' as const, 'aria-hidden': true };

/** The poster's five-point star ornament (filled). */
export function Star(props: P) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="star" {...props}>
      <path fill="currentColor" d="M12 1.5l3.1 7.2 7.8.6-5.9 5.1 1.8 7.6L12 17.9 5.2 22l1.8-7.6-5.9-5.1 7.8-.6z" />
    </svg>
  );
}

export function Back(props: P) {
  return (
    <svg {...base} {...props}>
      <path d="M14 5l-7 7 7 7" style={{ transform: 'var(--flip, none)', transformOrigin: 'center' }} />
      <path d="M7 12h13" />
    </svg>
  );
}

export function SoundOn(props: P) {
  return (
    <svg {...base} {...props}>
      <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" stroke="none" />
      <path d="M16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12" />
    </svg>
  );
}

export function SoundOff(props: P) {
  return (
    <svg {...base} {...props}>
      <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" stroke="none" />
      <path d="M16 9l5 6M21 9l-5 6" />
    </svg>
  );
}

export function Gear(props: P) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" />
    </svg>
  );
}

export function Book(props: P) {
  return (
    <svg {...base} {...props}>
      <path d="M4 4.5h6.5a2 2 0 012 2V20a2 2 0 00-2-2H4zM20 4.5h-6.5a2 2 0 00-1 .5M20 4.5V18h-6.5a2 2 0 00-1 .5" />
    </svg>
  );
}

export function Ledger(props: P) {
  return (
    <svg {...base} {...props}>
      <path d="M5 3.5h14v17H5z" />
      <path d="M8.5 8h7M8.5 12h7M8.5 16h4" />
    </svg>
  );
}

export function Close(props: P) {
  return (
    <svg {...base} {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function Gavel(props: P) {
  return (
    <svg {...base} {...props}>
      <path d="M13.5 3.5l7 7M10 7l7 7M11.75 5.25l-3.5 3.5 7 7 3.5-3.5M9.5 13.5L3 20" />
      <path d="M13 21h8" />
    </svg>
  );
}

/** Manicule: the pointing hand of the old show bills. Points to the inline end by default. */
export function Hand(props: P) {
  return (
    <svg viewBox="0 0 48 24" aria-hidden {...props}>
      <path
        fill="currentColor"
        d="M2 7h7c1.6 0 2.6-.6 3.6-1.6l2.2-2.2c1-1 2.2-1.2 3.4-.6l.4.2c.8.5.9 1.6.2 2.4L17.5 6.5H44a2.5 2.5 0 010 5H27.5a2 2 0 010 4H26a2 2 0 010 4h-1.5a1.8 1.8 0 010 3.5H14c-3 0-5-1.2-6.5-3H2z"
      />
    </svg>
  );
}
