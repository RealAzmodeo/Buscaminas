
import React from 'react';
import { useSandboxGame } from '../../hooks/useSandboxGame';
import HeaderUI from '../ui/HeaderUI';
import Board from '../board/Board';
import { GameStatus, EnemyRank, EnemyArchetypeId, GamePhase } from '../../types'; // Added EnemyRank, EnemyArchetypeId, GamePhase
import { ENEMY_ARCHETYPE_DEFINITIONS } from '../../constants/difficultyConstants';


interface SandboxSimulationViewProps {
  game: ReturnType<typeof useSandboxGame>;
}

const SandboxSimulationView: React.FC<SandboxSimulationViewProps> = ({ game }) => {
  const { player, enemy, board, activeEcos, revealCellSandbox, sandboxState, cycleCellMarkSandbox } = game;
  
  const resolvedArchetypeId = (enemy.archetypeId && ENEMY_ARCHETYPE_DEFINITIONS[enemy.archetypeId as EnemyArchetypeId])
                              ? enemy.archetypeId as EnemyArchetypeId
                              : EnemyArchetypeId.Centinela; // Default if invalid or undefined

  const enemyInstanceForUI = {
    ...enemy, 
    id: 'sandbox-enemy',
    archetypeId: resolvedArchetypeId,
    rank: EnemyRank.Minion, 
    currentHp: enemy.hp,
    currentFuryCharge: enemy.fury,
    furyActivationThreshold: enemy.maxFury,
    furyAbilities: [], 
    activeFuryCycleIndex: 0,
    baseArchetype: ENEMY_ARCHETYPE_DEFINITIONS[resolvedArchetypeId],
  };


  return (
    <div className="flex flex-col items-center w-full">
      <HeaderUI
        player={player}
        enemy={enemyInstanceForUI} 
        activeEcos={activeEcos}
        currentLevel={0}
        currentPhase={GamePhase.PLAYER_TURN} // Sandbox is always player's turn effectively for Header
        conditionalEchoTriggeredId={null}
        gameStatus={GameStatus.Sandbox}
      />
      <main className="w-full flex justify-center mt-2">
        {board && board.length > 0 ? (
          <Board
            board={board}
            onCellClick={revealCellSandbox}
            onCellContextMenu={cycleCellMarkSandbox}
            activeEcos={activeEcos}
            player={player}
            forceRevealAllCells={sandboxState.isRevealAll}
            currentPhase={GamePhase.PLAYER_TURN} // Sandbox board interaction is always player's turn
            aiThinkingCellCoords={null} // No AI thinking visualization in sandbox for now
            aiActionTargetCell={null}   // No AI target visualization
          />
        ) : (
          <div className="text-center p-10 text-slate-400">Generating board...</div>
        )}
      </main>
    </div>
  );
};

export default SandboxSimulationView;
