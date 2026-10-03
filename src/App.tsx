import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getPlayer } from './data';
import { createGame, reduce, squadOf, type Action, type GameConfig, type GameState, type NewTeam } from './engine/auction';
import { deriveSeed, randomSeed } from './engine/rng';
import { scoreSquad } from './engine/scoring';
import { storage, type HistoryEntry, type Settings } from './engine/save';
import { I18nProvider } from './i18n';
import { setSoundEnabled } from './lib/sound';
import { AuctionScreen } from './screens/Auction';
import { HistoryScreen } from './screens/History';
import { HomeScreen } from './screens/Home';
import { MatchScreen } from './screens/Match';
import { ResultsScreen } from './screens/Results';
import { RulesScreen } from './screens/Rules';
import { SettingsScreen } from './screens/Settings';
import { SetupScreen } from './screens/Setup';

export type Screen = 'home' | 'setup' | 'auction' | 'results' | 'match' | 'history' | 'rules' | 'settings';

function historyEntry(game: GameState): HistoryEntry {
  const opts = { chemistry: game.config.chemistry, cash: game.config.cash };
  const scores = ([0, 1] as const).map((t) => scoreSquad(squadOf(game, t), game.teams[t].budget, opts)) as HistoryEntry['scores'];
  const stars = game.teams.map((team) => {
    const best = [...team.picks].sort((a, b) => getPlayer(b.playerId).ovr - getPlayer(a.playerId).ovr)[0];
    return best ? { id: best.playerId, price: best.price } : null;
  }) as HistoryEntry['stars'];
  return {
    id: game.id,
    finishedAt: Date.now(),
    mode: game.config.mode,
    formation: game.config.formation,
    difficulty: game.config.difficulty,
    names: [game.teams[0].name, game.teams[1].name],
    scores,
    match: null,
    stars,
  };
}

export default function App() {
  const [settings, setSettings] = useState<Settings>(() => storage.loadSettings());
  const [game, setGame] = useState<GameState | null>(() => storage.loadGame());
  const [screen, setScreen] = useState<Screen>('home');
  const [setupMode, setSetupMode] = useState<GameConfig['mode']>('ai');
  const [history, setHistory] = useState<HistoryEntry[]>(() => storage.loadHistory());
  const recorded = useRef(new Set<string>());

  // Document language, direction and paper.
  useEffect(() => {
    const root = document.documentElement;
    root.lang = settings.lang;
    root.dir = settings.lang === 'ar' ? 'rtl' : 'ltr';
    if (settings.theme === 'system') delete root.dataset.theme;
    else root.dataset.theme = settings.theme;
    document.title = settings.lang === 'ar' ? 'مزاد النجوم' : 'Star Auction';
    setSoundEnabled(settings.sound);
    storage.saveSettings(settings);
  }, [settings]);

  // Auto-save every accepted action; a finished auction moves to the record book.
  useEffect(() => {
    if (!game) return;
    if (game.phase === 'finished') {
      storage.clearGame();
      if (!recorded.current.has(game.id)) {
        recorded.current.add(game.id);
        setHistory(storage.addHistory(historyEntry(game)));
      }
    } else {
      storage.saveGame(game);
    }
  }, [game]);

  const dispatch = useCallback((action: Action) => setGame((g) => (g ? reduce(g, action) : g)), []);

  const go = useCallback((s: Screen) => {
    setScreen(s);
    window.scrollTo({ top: 0 });
  }, []);

  const start = useCallback(
    (config: GameConfig, teams: [NewTeam, NewTeam]) => {
      setGame(createGame(config, teams));
      go('auction');
    },
    [go],
  );

  const replay = useCallback(() => {
    if (!game) return;
    const teams = game.teams.map(({ name, crest, controller }) => ({ name, crest, controller })) as [NewTeam, NewTeam];
    start({ ...game.config }, teams);
  }, [game, start]);

  const rematch = useCallback(() => {
    if (!game) return;
    const teams = game.teams.map(({ name, crest, controller }) => ({ name, crest, controller })) as [NewTeam, NewTeam];
    start({ ...game.config, seed: randomSeed() }, teams);
  }, [game, start]);

  const matchSeed = useMemo(() => (game ? deriveSeed(game.config.seed, 777) : 0), [game]);

  const view = (() => {
    switch (screen) {
      case 'setup':
        return <SetupScreen mode={setupMode} onStart={start} onBack={() => go('home')} />;
      case 'auction':
        return game && game.phase !== 'finished' ? (
          <AuctionScreen
            game={game}
            dispatch={dispatch}
            sound={settings.sound}
            onToggleSound={() => setSettings((s) => ({ ...s, sound: !s.sound }))}
            onQuit={() => go('home')}
            onFinish={() => go('results')}
          />
        ) : null;
      case 'results':
        return game ? (
          <ResultsScreen game={game} onMatch={() => go('match')} onReplay={replay} onRematch={rematch} onMenu={() => go('home')} />
        ) : null;
      case 'match':
        return game ? (
          <MatchScreen
            game={game}
            seed={matchSeed}
            onDone={(score) => setHistory(storage.updateHistoryMatch(game.id, score))}
            onBack={() => go('results')}
          />
        ) : null;
      case 'history':
        return (
          <HistoryScreen
            history={history}
            onClear={() => {
              storage.clearHistory();
              setHistory([]);
            }}
            onBack={() => go('home')}
          />
        );
      case 'rules':
        return <RulesScreen onBack={() => go('home')} />;
      case 'settings':
        return <SettingsScreen settings={settings} onChange={setSettings} onBack={() => go('home')} />;
      default:
        return null;
    }
  })();

  return (
    <I18nProvider lang={settings.lang}>
      {view ?? (
        <HomeScreen
          saved={game && game.phase !== 'finished' ? game : null}
          lang={settings.lang}
          onLang={(lang) => setSettings((s) => ({ ...s, lang }))}
          onPlay={(mode) => {
            setSetupMode(mode);
            go('setup');
          }}
          onResume={() => go('auction')}
          onDiscard={() => {
            storage.clearGame();
            setGame(null);
          }}
          onNavigate={go}
        />
      )}
    </I18nProvider>
  );
}
