import { getClub, getNation } from '../data';
import { useI18n } from '../i18n';
import { flagUrl } from '../lib/flags';

/** Club monogram in kit colours. No logos: clubs are printed as a stamped roundel. */
export function ClubBadge({ code, size = 28 }: { code: string; size?: number }) {
  const club = getClub(code);
  const { label } = useI18n();
  const [primary, secondary] = club.colors;
  const text = code.length > 3 ? code.slice(0, 3) : code;
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} role="img" aria-label={label(club.name)} style={{ flex: 'none' }}>
      <circle cx="20" cy="20" r="19" fill={primary} stroke="var(--ink)" strokeWidth="1.5" />
      <circle cx="20" cy="20" r="14.5" fill="none" stroke={secondary} strokeWidth="2" />
      <text
        x="20"
        y="20.5"
        textAnchor="middle"
        dominantBaseline="central"
        fill={secondary}
        style={{ font: '900 12px "Big Shoulders Display", sans-serif', letterSpacing: '0.02em' }}
      >
        {text}
      </text>
    </svg>
  );
}

export function Flag({ code, className = '' }: { code: string; className?: string }) {
  const nation = getNation(code);
  const { label } = useI18n();
  return <img className={`flag ${className}`} src={flagUrl(code)} alt={label(nation.name)} width={22} height={16} loading="lazy" />;
}
