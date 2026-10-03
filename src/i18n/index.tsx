import { createContext, useContext, type ReactNode } from 'react';
import type { Label } from '../data/types';
import { POSITION_NAMES, STAT_NAMES, STRINGS, type Lang, type StringKey } from './strings';

export type { Lang, StringKey } from './strings';

type Vars = Record<string, string | number>;

/** Western digits everywhere: this game is often played on Arabic-locale devices. */
const num = new Intl.NumberFormat('en-US');

export function fmtNumber(n: number): string {
  return num.format(n);
}

/** Money in € millions, e.g. "€120M", isolated so it never reorders inside Arabic text. */
export function fmtMoney(n: number): string {
  return `⁦€${num.format(n)}M⁩`;
}

export function makeT(lang: Lang) {
  const dict = STRINGS[lang];
  return (key: StringKey, vars?: Vars): string => {
    let s = dict[key] ?? STRINGS.en[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        s = s.split(`{${k}}`).join(typeof v === 'number' ? fmtNumber(v) : v);
      }
    }
    return s;
  };
}

export interface I18n {
  lang: Lang;
  dir: 'rtl' | 'ltr';
  t: ReturnType<typeof makeT>;
  label: (l: Label) => string;
  pos: (kind: string) => { short: string; long: string };
  stat: (key: string) => string;
}

export function makeI18n(lang: Lang): I18n {
  return {
    lang,
    dir: lang === 'ar' ? 'rtl' : 'ltr',
    t: makeT(lang),
    label: (l) => l[lang],
    pos: (kind) => POSITION_NAMES[lang][kind],
    stat: (key) => STAT_NAMES[lang][key],
  };
}

const I18nContext = createContext<I18n>(makeI18n('ar'));

export function I18nProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  return <I18nContext.Provider value={makeI18n(lang)}>{children}</I18nContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useI18n(): I18n {
  return useContext(I18nContext);
}
