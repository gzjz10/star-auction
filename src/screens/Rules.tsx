import { Back } from '../components/Icons';
import { FORMATIONS } from '../engine/formations';
import { RULES } from '../engine/rules';
import { useI18n, type StringKey } from '../i18n';
import './Minor.css';

export function RulesScreen({ onBack }: { onBack: () => void }) {
  const { t } = useI18n();
  // Every number below comes from the engine's own constants.
  const vars = {
    budget: RULES.budget,
    rounds: FORMATIONS['4-3-3'].slots.length,
    share: Math.round(RULES.openingShare * 100),
    min: RULES.openingMin,
    max: RULES.openingMax,
    small: RULES.smallStep,
    big: RULES.bigStep,
    bigLot: RULES.bigLotValue,
    club: RULES.clubPairPoints,
    clubCap: RULES.clubCap,
    nation: RULES.nationPairPoints,
    nationCap: RULES.nationCap,
    league: RULES.leaguePoints,
    group: RULES.leagueGroup,
    leagueCap: RULES.leagueCap,
    cash: RULES.cashPerPoint,
  };
  const keys = Array.from({ length: 10 }, (_, i) => `rule${i + 1}` as StringKey);
  return (
    <div className="page minor">
      <header className="topbar">
        <button className="icon-btn flip-rtl" onClick={onBack} aria-label={t('back')}>
          <Back />
        </button>
        <span />
      </header>
      <h1 className="display worn ink-red offreg-blue">{t('rulesTitle')}</h1>
      <ol className="rules__list">
        {keys.map((k) => (
          <li key={k}>{t(k, vars)}</li>
        ))}
      </ol>
    </div>
  );
}
