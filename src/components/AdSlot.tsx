import { useEffect, useRef } from 'react';
import { useI18n } from '../i18n';
import './AdSlot.css';

const CLIENT = import.meta.env.VITE_ADSENSE_CLIENT?.trim();

const SLOTS = {
  home: import.meta.env.VITE_ADSENSE_SLOT_HOME?.trim(),
  results: import.meta.env.VITE_ADSENSE_SLOT_RESULTS?.trim(),
};

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * One responsive AdSense unit. Renders nothing until both the publisher id and the
 * slot id are configured, so the game never shows an empty box. Ads only ever go on
 * calm screens (home, results), never on the auction or the match.
 */
export function AdSlot({ place }: { place: keyof typeof SLOTS }) {
  const { lang } = useI18n();
  const slot = SLOTS[place];
  const ref = useRef<HTMLModElement>(null);

  useEffect(() => {
    const el = ref.current;
    // StrictMode mounts twice in development; a filled <ins> must not be pushed again.
    if (!el || el.dataset.adsbygoogleStatus) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Blocked by an ad blocker or not approved yet: the game carries on.
    }
  }, []);

  if (!CLIENT || !slot) return null;
  return (
    <aside className="ad-slot" aria-label={lang === 'ar' ? 'إعلان' : 'Advertisement'}>
      <span className="ad-slot__label">{lang === 'ar' ? 'إعلان' : 'Advertisement'}</span>
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={CLIENT}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
