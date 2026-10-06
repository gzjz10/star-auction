import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getPlayer } from './data';
import { createGame, reduce, squadOf, type Action, type GameConfig, type GameState, type NewTeam } from './engine/auction';
import { deriveSeed, randomSeed } from './engine/rng';
import { scoreSquad } from './engine/scoring';
import { storage, type HistoryEntry, type Settings } from './engine/save';
import { I18nProvider, makeT } from './i18n';
import { setSoundEnabled } from './lib/sound';
import { normalizeCode } from './online/protocol';
import { useOnline } from './online/useOnline';
import { AuctionScreen } from './screens/Auction';
import { HistoryScreen } from './screens/History';
import { HomeScreen } from './screens/Home';
import { MatchScreen } from './screens/Match';
import { OnlineScreen } from './screens/Online';
import { ResultsScreen } from './screens/Results';
import { RulesScreen } from './screens/Rules';
import { SettingsScreen } from './screens/Settings';
import { SetupScreen } from './screens/Setup';

export type Screen = 'home' | 'setup' | 'online' | 'auction' | 'results' | 'match' | 'history' | 'rules' | 'settings';

/** A shared invite link (?room=CODE) opens the join form with the code filled in. */
function roomFromUrl(): string {
  const raw = new URLSearchParams(window.location.search).get('room');
  return raw ? (normalizeCode(raw) ?? '') : '';
}

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
  const [invite] = useState(roomFromUrl);
  const [screen, setScreen] = useState<Screen>(invite ? 'online' : 'home');
  const [setupMode, setSetupMode] = useState<GameConfig['mode']>('ai');
  const [history, setHistory] = useState<HistoryEntry[]>(() => storage.loadHistory());
  const recorded = useRef(new Set<string>());

  const go = useCallback((s: Screen) => {
    setScreen(s);
    window.scrollTo({ top: 0 });
  }, []);

  const { session, hostRoom, joinRoom, leave, send, askAgain } = useOnline({
    game,
    setGame,
    onNewGame: () => go('auction'),
    onAgain: (fresh) => (fresh ? rematch() : replay()),
  });

  // The invite code is consumed once; a reload should not rejoin by surprise.
  useEffect(() => {
    if (invite) window.history.replaceState(null, '', window.location.pathname);
  }, [invite]);

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
  // Online games live on the host's device and the wire, so they never take the resume slot.
  useEffect(() => {
    if (!game) return;
    const local = game.config.mode !== 'online';
    if (game.phase === 'finished') {
      if (local) storage.clearGame();
      if (!recorded.current.has(game.id)) {
        recorded.current.add(game.id);
        setHistory(storage.addHistory(historyEntry(game)));
      }
    } else if (local) {
      storage.saveGame(game);
    }
  }, [game]);

  const guest = session?.role === 'guest';
  const dispatch = useCallback(
    (action: Action) => (guest ? send(action) : setGame((g) => (g ? reduce(g, action) : g))),
    [guest, send],
  );

  const start = useCallback(
    (config: GameConfig, teams: [NewTeam, NewTeam]) => {
      if (config.mode === 'online' && session?.role !== 'host') {
        void hostRoom(config, teams[0]);
        go('online');
        return;
      }
      setGame(createGame(config, teams));
      go('auction');
    },
    [go, hostRoom, session?.role],
  );

  /** Leaving to the menu ends an online bout and brings back this device's own saved auction. */
  const goHome = useCallback(() => {
    if (session) {
      leave();
      setGame((g) => (g?.config.mode === 'online' ? storage.loadGame() : g));
    }
    go('home');
  }, [go, leave, session]);

  const replay = useCallback(() => {
    if (guest) return askAgain(false);
    if (!game) return;
    const teams = game.teams.map(({ name, crest, controller }) => ({ name, crest, controller })) as [NewTeam, NewTeam];
    start({ ...game.config }, teams);
  }, [game, start, guest, askAgain]);

  const rematch = useCallback(() => {
    if (guest) return askAgain(true);
    if (!game) return;
    const teams = game.teams.map(({ name, crest, controller }) => ({ name, crest, controller })) as [NewTeam, NewTeam];
    start({ ...game.config, seed: randomSeed() }, teams);
  }, [game, start, guest, askAgain]);

  const t = makeT(settings.lang);
  const notice =
    session?.status === 'lost' && game
      ? session.role === 'host'
        ? t('oppLost', { team: game.teams[1].name })
        : t('selfLost')
      : null;

  const matchSeed = useMemo(() => (game ? deriveSeed(game.config.seed, 777) : 0), [game]);

  const view = (() => {
    switch (screen) {
      case 'setup':
        return <SetupScreen mode={setupMode} onStart={start} onBack={() => go(setupMode === 'online' ? 'online' : 'home')} />;
      case 'online':
        return (
          <OnlineScreen
            session={session}
            initialCode={invite}
            onHost={() => {
              setSetupMode('online');
              go('setup');
            }}
            onJoin={(code, team) => void joinRoom(code, team)}
            onLeave={leave}
            onBack={goHome}
          />
        );
      case 'auction':
        if (!game) return null;
        // Whoever rings the final bell, both devices land on the bill.
        if (game.phase === 'finished') {
          return <ResultsScreen game={game} onMatch={() => go('match')} onReplay={replay} onRematch={rematch} onMenu={goHome} />;
        }
        return (
          <AuctionScreen
            game={game}
            dispatch={dispatch}
            sound={settings.sound}
            onToggleSound={() => setSettings((s) => ({ ...s, sound: !s.sound }))}
            onQuit={goHome}
            onFinish={() => go('results')}
            seat={session ? session.seat : null}
            notice={notice}
          />
        );
      case 'results':
        return game ? (
          <ResultsScreen game={game} onMatch={() => go('match')} onReplay={replay} onRematch={rematch} onMenu={goHome} />
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
          saved={game && game.phase !== 'finished' && game.config.mode !== 'online' ? game : null}
          lang={settings.lang}
          onLang={(lang) => setSettings((s) => ({ ...s, lang }))}
          onPlay={(mode) => {
            setSetupMode(mode);
            go(mode === 'online' ? 'online' : 'setup');
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
