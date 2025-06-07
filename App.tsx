
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGameEngine } from './hooks/useGameEngine';
import { GameStatus, FloatingTextType, GameEvent, BiomeId, FloatingTextEventPayload } from './types';
import MainMenuScreen from './screens/MainMenuScreen';
import IntroScreen from './screens/IntroScreen'; // Import IntroScreen
import GameScreenWithOverlay from './screens/GameScreen';
import PostLevelScreen from './screens/PostLevelScreen';
import EndScreen from './components/ui/EndScreen';
import SandboxScreen from './screens/SandboxScreen';
import SettingsScreen from './screens/SettingsScreen';
import SanctuaryHub from './screens/SanctuaryHub';
import MirrorScreen from './components/meta/mirror/MirrorScreen';
import GoalsScreen from './components/meta/goals/GoalsScreen';
import AbyssMapScreen from './screens/AbyssMapScreen';
import FloatingTextDisplay from './components/ui/FloatingTextDisplay';
import OracleGameUI from './components/ui/oraclegame/OracleGameUI';
import ConfirmAbandonModal from './components/modals/ConfirmAbandonModal';
import { BIOME_DEFINITIONS } from './constants/biomeConstants';

/**
 * @interface FloatingTextData
 * @description Data structure for managing individual floating text instances.
 * @property {number} id - Unique identifier for the floating text.
 * @property {string} text - The content of the text.
 * @property {FloatingTextType} type - The visual type/style of the text.
 * @property {number} [initialX] - Optional initial X coordinate for positioning (center of target element).
 * @property {number} [initialY] - Optional initial Y coordinate for positioning (top of target element).
 */
interface FloatingTextData {
  id: number;
  text: string;
  type: FloatingTextType;
  initialX?: number;
  initialY?: number;
}

/**
 * @component App
 * @description The main application component that orchestrates game state, screen rendering, and global UI elements like floating text and modals.
 * It initializes the game engine (`useGameEngine`) and handles transitions between different game screens based on `gameState.status`.
 * Also manages global overlays like the Oracle Minigame and confirmation modals.
 */
const App: React.FC = () => {
  const gameEngine = useGameEngine();
  const { gameState, player, runStats, popEvent, metaProgress, setAndSaveMetaProgress } = gameEngine;

  const [floatingTextsData, setFloatingTextsData] = useState<FloatingTextData[]>([]);
  const nextFloatingTextId = useRef(0);
  const [isConfirmAbandonModalOpen, setIsConfirmAbandonModalOpen] = useState(false);

  /**
   * Effect to process game events from the `gameState.eventQueue`.
   * Currently, it only handles 'FLOATING_TEXT' events to display animated text feedback.
   * It calculates the initial position of the floating text if a `targetId` is provided in the event payload.
   */
  useEffect(() => {
    // Check if there are events to process
    if (gameState.eventQueue.length > 0) {
      let event: GameEvent | undefined;
      // Process all events currently in the queue
      // eslint-disable-next-line no-cond-assign
      while ((event = popEvent())) { // popEvent removes the event from the queue
        if (event.type === 'FLOATING_TEXT') {
          const payload = event.payload as FloatingTextEventPayload;
          let initialX: number | undefined;
          let initialY: number | undefined;

          // If a targetId is specified, try to position the text relative to that element
          if (payload.targetId) {
            const targetElement = document.getElementById(payload.targetId);
            if (targetElement) {
              const rect = targetElement.getBoundingClientRect();
              // Position text at the center-top of the target element
              initialX = rect.left + rect.width / 2;
              initialY = rect.top;
            }
          }

          // Add new floating text data to the state for rendering
          setFloatingTextsData(prevTexts => [
            ...prevTexts,
            {
              id: nextFloatingTextId.current++, // Increment unique ID for each text
              text: payload.text,
              type: payload.type,
              initialX,
              initialY
            }
          ]);
        }
        // Future: Handle other event types like 'SOUND_EFFECT' if needed here
      }
    }
  }, [gameState.eventQueue, popEvent]); // Rerun when eventQueue or popEvent function changes

  /**
   * Callback to remove a floating text instance from the display after its animation completes.
   * Passed to `FloatingTextDisplay` which then passes it to individual `FloatingTextItem`s.
   * @param {number} id - The ID of the floating text to remove.
   */
  const removeFloatingText = useCallback((id: number) => {
    setFloatingTextsData(prevTexts => prevTexts.filter(text => text.id !== id));
  }, []); // Empty dependency array as this function's logic doesn't depend on external state changing over time

  /** Opens the "Confirm Abandon Run" modal. */
  const openConfirmAbandonModal = useCallback(() => setIsConfirmAbandonModalOpen(true), []);
  /** Closes the "Confirm Abandon Run" modal. */
  const closeConfirmAbandonModal = useCallback(() => setIsConfirmAbandonModalOpen(false), []);

  /**
   * Handles the confirmation of abandoning the current run.
   * Calls the game engine's abandon logic and closes the modal.
   */
  const handleConfirmAbandon = useCallback(() => {
    gameEngine.confirmAndAbandonRun();
    closeConfirmAbandonModal();
  }, [gameEngine, closeConfirmAbandonModal]);

  /** Debug function to instantly win the current level. Only works if `gameState.status` is `Playing`. */
  const handleDebugWinLevel = useCallback(() => {
    if (gameState.status === GameStatus.Playing) {
      gameEngine.debugWinLevel();
    }
  }, [gameState.status, gameEngine]);

  /** Debug function to instantly lose the current level. Only works if `gameState.status` is `Playing`. */
  const handleDebugLoseLevel = useCallback(() => {
    if (gameState.status === GameStatus.Playing) {
      gameEngine.setGameStatus(GameStatus.GameOverDefeat);
    }
  }, [gameState.status, gameEngine]);

  /**
   * Renders the appropriate screen component based on the current `gameState.status`.
   * This function is memoized with `useCallback` to prevent unnecessary re-renders if its dependencies haven't changed.
   * @returns {React.ReactNode} The React component for the current screen.
   */
  const renderScreen = useCallback(() => {
    switch (gameState.status) {
      case GameStatus.MainMenu:
        return <MainMenuScreen
                  onStartNewRun={() => gameEngine.requestPrologueStart()}
                  onContinueRun={() => gameEngine.initializeNewRun(false)} // False for non-prologue start
                  onNavigateToSanctuary={() => gameEngine.setGameStatus(GameStatus.Sanctuary)}
                  onNavigateToSandbox={() => gameEngine.setGameStatus(GameStatus.Sandbox)}
                  onNavigateToSettings={() => gameEngine.setGameStatus(GameStatus.SettingsMenu)}
                />;
      case GameStatus.IntroScreen:
        return <IntroScreen onStartPrologue={gameEngine.startPrologueActual} />;
      case GameStatus.Playing:
        return <GameScreenWithOverlay
                  gameEngine={gameEngine}
                  onOpenConfirmAbandonModal={openConfirmAbandonModal}
                  onDebugWinLevel={handleDebugWinLevel}
                  onDebugLoseLevel={handleDebugLoseLevel}
                />;
      case GameStatus.PostLevel:
        return <PostLevelScreen gameEngine={gameEngine} />;
      case GameStatus.AbyssMapView:
        return <AbyssMapScreen gameEngine={gameEngine} />;
      case GameStatus.GameOverDefeat:
      case GameStatus.GameOverWin:
        return (
          <EndScreen
            message={gameState.status === GameStatus.GameOverWin ? "Victoria Absoluta" : "Has Sido Derrotado"}
            level={gameState.currentLevel}
            gold={player.gold}
            runStats={runStats}
            metaProgress={metaProgress}
            defeatReason={gameState.defeatReason}
            onNavigateToMainMenu={() => gameEngine.setGameStatus(GameStatus.MainMenu)}
          />
        );
      case GameStatus.Sandbox:
        return <SandboxScreen onExitSandbox={() => gameEngine.setGameStatus(GameStatus.MainMenu)} />;
      case GameStatus.SettingsMenu:
        return <SettingsScreen onExitSettings={() => gameEngine.setGameStatus(GameStatus.MainMenu)} />;
      case GameStatus.Sanctuary:
        return <SanctuaryHub
                  metaProgress={metaProgress}
                  setMetaProgress={setAndSaveMetaProgress}
                  onExitSanctuary={() => gameEngine.setGameStatus(GameStatus.MainMenu)}
                  onNavigateToMirror={() => gameEngine.setGameStatus(GameStatus.MirrorOfSelf)}
                  onNavigateToGoals={() => gameEngine.setGameStatus(GameStatus.FeatsBoard)}
                  onNavigateToTree={() => {
                     console.log("Navigate to Tree - Tree is currently part of Sanctuary Hub");
                  }}
                />;
      case GameStatus.MirrorOfSelf:
        return <MirrorScreen
                  metaProgress={metaProgress}
                  setMetaProgress={setAndSaveMetaProgress}
                  onExit={() => gameEngine.setGameStatus(GameStatus.Sanctuary)}
                />;
      case GameStatus.FeatsBoard:
        return <GoalsScreen
                  metaProgress={metaProgress}
                  setMetaProgress={setAndSaveMetaProgress}
                  onExit={() => gameEngine.setGameStatus(GameStatus.Sanctuary)}
                />;
      default:
        console.warn("Unhandled game status in App.tsx renderScreen:", gameState.status);
        // Fallback to MainMenuScreen if an unknown status is encountered
        return <MainMenuScreen
                onStartNewRun={() => gameEngine.requestPrologueStart()}
                onContinueRun={() => gameEngine.initializeNewRun(false)}
                onNavigateToSanctuary={() => gameEngine.setGameStatus(GameStatus.Sanctuary)}
                onNavigateToSandbox={() => gameEngine.setGameStatus(GameStatus.Sandbox)}
                onNavigateToSettings={() => gameEngine.setGameStatus(GameStatus.SettingsMenu)}
               />;
    }
  }, [gameState.status, gameState.currentLevel, gameState.defeatReason, player.gold, runStats, metaProgress, gameEngine, openConfirmAbandonModal, handleDebugWinLevel, handleDebugLoseLevel, setAndSaveMetaProgress]);

  // Determine if any overlay (Oracle Minigame, Corazon choice, Confirm Abandon modal) is active.
  const isOverlayActive = gameState.isFuryMinigameActive || gameState.isCorazonDelAbismoChoiceActive || isConfirmAbandonModalOpen;

  // Determine if the main screen content should be blurred due to an active overlay.
  const screenShouldBeBlurred = isOverlayActive &&
                                ![
                                  GameStatus.IntroScreen, // Intro screen should not be blurred
                                  GameStatus.Sanctuary,
                                  GameStatus.MirrorOfSelf,
                                  GameStatus.FeatsBoard,
                                  GameStatus.MainMenu,
                                  GameStatus.AbyssMapView, 
                                  GameStatus.SettingsMenu,
                                  GameStatus.Sandbox, 
                                ].includes(gameState.status);

  // Determine the app's background color based on the current biome or game status.
  const appBackgroundColor = (gameState.status === GameStatus.Playing || gameState.status === GameStatus.AbyssMapView) && gameState.currentBiomeId
    ? BIOME_DEFINITIONS[gameState.currentBiomeId]?.backgroundColor || 'bg-slate-900'
    : (gameState.status === GameStatus.IntroScreen ? 'bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900' : 'bg-slate-900');


  return (
    <div
      className={`flex flex-col items-center justify-start text-slate-100 font-sans p-0 ${appBackgroundColor}`}
      style={{
        minHeight: '100vh',
        fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif', // Fallback font stack
        overflowX: 'hidden', // Prevent horizontal scroll if content slightly overflows
        position: 'relative', // Establishes a stacking context for overlays if needed
        transition: 'background-color 0.5s ease-in-out', // Smooth background color transitions
    }}>
      <FloatingTextDisplay texts={floatingTextsData} onRemove={removeFloatingText} />
      <div
        className={`container mx-auto px-2 sm:px-4 py-4 w-full max-w-5xl flex-grow flex flex-col items-center justify-start transition-all duration-300 ease-in-out
                   ${screenShouldBeBlurred ? 'filter blur-sm brightness-50 pointer-events-none' : ''}`}
      >
        {renderScreen()}
      </div>
      {gameState.isFuryMinigameActive && <OracleGameUI gameEngine={gameEngine} />}
      {isConfirmAbandonModalOpen && (
        <ConfirmAbandonModal
          isOpen={isConfirmAbandonModalOpen}
          onConfirm={handleConfirmAbandon}
          onCancel={closeConfirmAbandonModal}
        />
      )}
       <footer className="w-full text-center py-4 text-xs text-slate-500">
        Numeria's Edge - El Mapa del Abismo v0.8.2
      </footer>
    </div>
  );
};

export default App;