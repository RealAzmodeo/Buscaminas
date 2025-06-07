
import React from 'react';
import { useGameEngine } from '../hooks/useGameEngine';
import { PROLOGUE_MESSAGES } from '../constants';
import { playMidiSoundPlaceholder } from '../utils/soundUtils'; // Import sound utility
import HeaderUI from '../components/ui/HeaderUI';
import Board from '../components/board/Board';
import GuidingText from '../components/ui/ftue/GuidingText'; // Changed from { GuidingText }
import { GameStateCore, BiomeId, GamePhase } from '../types';
import { BIOME_DEFINITIONS } from '../constants/biomeConstants';

interface GameScreenProps {
  gameEngine: ReturnType<typeof useGameEngine>; 
  onOpenConfirmAbandonModal: () => void; 
  onDebugWinLevel: () => void;
  onDebugLoseLevel: () => void;
}

// ForwardRefRenderFunction allows GameScreen to receive a ref
const GameScreen = React.forwardRef<HTMLDivElement, GameScreenProps>(({
  gameEngine, 
  onOpenConfirmAbandonModal, 
  onDebugWinLevel, 
  onDebugLoseLevel 
}, ref) => { // Added ref here
  const { 
    gameState, 
    player, 
    enemy, 
    board, 
    fullActiveEcos, 
    handlePlayerCellSelection, // Changed from revealCell
    cycleCellMark, 
    tryActivateAlquimiaImprovisada,
    tryActivateOjoOmnisciente 
  } = gameEngine;

  const boardKey = `${gameState.currentLevel}-${gameState.currentArenaLevel}-${gameState.currentBoardDimensions.rows}x${gameState.currentBoardDimensions.cols}-${gameState.currentBiomeId}-${gameState.currentPhase}`; // Added phase to key

  // currentBiomeTheme is not directly used for styling the root div, so it can remain as is.
  // const currentBiomeTheme = BIOME_DEFINITIONS[gameState.currentBiomeId] || BIOME_DEFINITIONS[BiomeId.Default];

  return (
    <div ref={ref} className={`flex flex-col items-center w-full transition-all duration-500 ease-in-out ${gameState.isBattlefieldReductionTransitioning ? 'animate-battlefield-shake' : ''}`}>
      <HeaderUI 
        player={player} 
        enemy={enemy} 
        activeEcos={fullActiveEcos} 
        currentLevel={gameState.currentLevel}
        currentPhase={gameState.currentPhase} // Pass currentPhase
        conditionalEchoTriggeredId={gameState.conditionalEchoTriggeredId}
        alquimiaImprovisadaChargeAvailable={player.alquimiaImprovisadaChargeAvailable}
        alquimiaImprovisadaActiveForNextBomb={player.alquimiaImprovisadaActiveForNextBomb}
        onActivateAlquimiaImprovisada={tryActivateAlquimiaImprovisada}
        onActivateOjoOmnisciente={tryActivateOjoOmnisciente}
        onOpenConfirmAbandonModal={onOpenConfirmAbandonModal} 
        onDebugWinLevel={onDebugWinLevel}
        onDebugLoseLevel={onDebugLoseLevel}
        gameStatus={gameState.status} 
      />
      <main className={`w-full flex justify-center p-1 rounded-lg shadow-xl 
                        ${gameState.currentBiomeId === BiomeId.BloodForge ? 'mini-arena-tension-border' 
                          : (gameState.currentBiomeId === BiomeId.BrokenBazaar ? 'bg-amber-800/30' : 'bg-slate-700') }`}>
      { board && board.length > 0 ? (
          <Board 
            key={boardKey} 
            board={board} 
            onCellClick={handlePlayerCellSelection} // Changed from revealCell
            onCellContextMenu={cycleCellMark}
            activeEcos={fullActiveEcos} 
            player={player}
            currentPhase={gameState.currentPhase} // Pass currentPhase
            aiThinkingCellCoords={gameState.aiThinkingCellCoords} // Pass AI thinking coords
            aiActionTargetCell={gameState.aiActionTargetCell} // Pass AI target coords
          />
        ) : (
          <div className="text-center p-10 text-slate-400">Cargando el destino del nivel...</div>
        )
      }
      </main>
    </div>
  );
};

interface GameScreenWithOverlayProps { 
  gameEngine: ReturnType<typeof useGameEngine>;
  onOpenConfirmAbandonModal: () => void;
  onDebugWinLevel: () => void;
  onDebugLoseLevel: () => void;
}

const GameScreenWithOverlay: React.FC<GameScreenWithOverlayProps> = ({ 
  gameEngine, 
  onOpenConfirmAbandonModal,
  onDebugWinLevel,
  onDebugLoseLevel
}) => {
  const { gameState, advancePrologueStep, triggerBattlefieldReduction, setGameStatus } = gameEngine;
  const gameContainerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = gameContainerRef.current;
    if (!container) return;

    let primaryTimeoutId: number | undefined;
    let secondarySoundTimeoutId: number | undefined;

    if (gameState.currentPhase === GamePhase.PRE_DEFEAT_SEQUENCE) {
      container.classList.add('game-container--pre-defeat');
      container.classList.remove('game-container--pre-victory');

      playMidiSoundPlaceholder('transition_defeat_impact');
      playMidiSoundPlaceholder('audio_ambience_stop');

      secondarySoundTimeoutId = window.setTimeout(() => {
        playMidiSoundPlaceholder('transition_defeat_heartbeat_slow');
      }, 1000); // Approx. 1s delay for heartbeat

      primaryTimeoutId = window.setTimeout(() => {
        setGameStatus(GameStatus.GameOverDefeat);
      }, 4000);
    } else if (gameState.currentPhase === GamePhase.PRE_VICTORY_SEQUENCE) {
      container.classList.add('game-container--pre-victory');
      container.classList.remove('game-container--pre-defeat');

      playMidiSoundPlaceholder('transition_victory_final_hit');
      playMidiSoundPlaceholder('transition_victory_shatter_dissipate');

      secondarySoundTimeoutId = window.setTimeout(() => {
        playMidiSoundPlaceholder('transition_victory_resolution_note');
      }, 1000); // Approx. 1s delay

      primaryTimeoutId = window.setTimeout(() => {
        if (gameState.mapDecisionPending) {
          setGameStatus(GameStatus.AbyssMapView);
        } else {
          setGameStatus(GameStatus.PostLevel);
        }
      }, 3000);
    } else {
      // Optional: Clean up classes if phase is neither (e.g., when a new level starts)
      // This might not be necessary if the classes don't persist visually or are overridden.
      container.classList.remove('game-container--pre-defeat', 'game-container--pre-victory');
    }

    return () => {
      if (primaryTimeoutId) {
        clearTimeout(primaryTimeoutId);
      }
      if (secondarySoundTimeoutId) {
        clearTimeout(secondarySoundTimeoutId);
      }
      // Consider removing classes on cleanup if the phase changes away from these sequences abruptly
      // container.classList.remove('game-container--pre-defeat', 'game-container--pre-victory');
    };
  }, [gameState.currentPhase, gameState.mapDecisionPending, setGameStatus]); // playMidiSoundPlaceholder is stable, not needed in deps
  
  const showContinueButtonForPrologueStep1 = gameState.isPrologueActive && 
                                         gameState.prologueStep === 1 && 
                                         PROLOGUE_MESSAGES[gameState.prologueStep];
  
  const currentMessage = PROLOGUE_MESSAGES[gameState.guidingTextKey] || (PROLOGUE_MESSAGES[gameState.prologueStep] && gameState.isPrologueActive ? PROLOGUE_MESSAGES[gameState.prologueStep] : null);

  return (
    <>
      <GameScreen 
        ref={gameContainerRef} // Pass the ref to GameScreen
        gameEngine={gameEngine} 
        onOpenConfirmAbandonModal={onOpenConfirmAbandonModal}
        onDebugWinLevel={onDebugWinLevel}
        onDebugLoseLevel={onDebugLoseLevel} 
      />
      {currentMessage && (
        <GuidingText 
          message={currentMessage} 
          onContinue={showContinueButtonForPrologueStep1 ? () => advancePrologueStep() : (gameState.guidingTextKey === 'BATTLEFIELD_REDUCTION_START' ? () => triggerBattlefieldReduction() : undefined)}
        />
      )}
    </>
  );
}

export default GameScreenWithOverlay;
