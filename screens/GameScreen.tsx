
import React from 'react';
import { useGameEngine, PROLOGUE_MESSAGES } from '../hooks/useGameEngine'; 
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

const GameScreen: React.FC<GameScreenProps> = ({ 
  gameEngine, 
  onOpenConfirmAbandonModal, 
  onDebugWinLevel, 
  onDebugLoseLevel 
}) => {
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

  const currentBiomeTheme = BIOME_DEFINITIONS[gameState.currentBiomeId] || BIOME_DEFINITIONS[BiomeId.Default];


  return (
    <div className={`flex flex-col items-center w-full transition-all duration-500 ease-in-out ${gameState.isBattlefieldReductionTransitioning ? 'animate-battlefield-shake' : ''}`}>
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
  const { gameState, advancePrologueStep, triggerBattlefieldReduction } = gameEngine; 
  
  const showContinueButtonForPrologueStep1 = gameState.isPrologueActive && 
                                         gameState.prologueStep === 1 && 
                                         PROLOGUE_MESSAGES[gameState.prologueStep];
  
  const currentMessage = PROLOGUE_MESSAGES[gameState.guidingTextKey] || (PROLOGUE_MESSAGES[gameState.prologueStep] && gameState.isPrologueActive ? PROLOGUE_MESSAGES[gameState.prologueStep] : null);


  return (
    <>
      <GameScreen 
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
