
import React, { useState, useEffect, useRef } from 'react';
import { PlayerState, Echo, GameStateCore, GameStatus, EnemyInstance, GamePhase } from '../../types';
import PlayerStats from './PlayerStats';
import EnemyStats from './EnemyStats';
import EchoesDisplay from './EchoesDisplay';
import EnemyFuryAbilitiesDisplay from './EnemyFuryAbilitiesDisplay';
import Button from '../common/Button';
import TurnIndicator from './TurnIndicator'; // Import the new TurnIndicator component

/**
 * @interface HeaderUIProps
 * @description Props for the HeaderUI component.
 * @property {PlayerState} player - The current state of the player.
 * @property {EnemyInstance} enemy - The current state of the enemy.
 * @property {Echo[]} activeEcos - Array of currently active Echos for the player.
 * @property {number} currentLevel - The current game level.
 * @property {GamePhase} currentPhase - The current phase of the game turn (e.g., PLAYER_TURN, ENEMY_THINKING).
 * @property {GameStateCore['conditionalEchoTriggeredId']} conditionalEchoTriggeredId - ID of an Echo whose conditional effect recently triggered, for UI feedback.
 * @property {boolean} [alquimiaImprovisadaChargeAvailable] - Whether Alquimia Improvisada Echo can be activated.
 * @property {boolean} [alquimiaImprovisadaActiveForNextBomb] - Whether Alquimia Improvisada is set to negate the next enemy attack.
 * @property {() => void} [onActivateAlquimiaImprovisada] - Callback to activate Alquimia Improvisada Echo.
 * @property {() => void} [onActivateOjoOmnisciente] - Callback to activate Ojo Omnisciente Echo.
 * @property {() => void} [onOpenConfirmAbandonModal] - Callback to open the confirm abandon run modal.
 * @property {() => void} [onDebugWinLevel] - Debug callback to instantly win the current level.
 * @property {() => void} [onDebugLoseLevel] - Debug callback to instantly lose the current level.
 * @property {GameStatus} gameStatus - The current overall status of the game.
 */
interface HeaderUIProps {
  player: PlayerState;
  enemy: EnemyInstance;
  activeEcos: Echo[];
  currentLevel: number;
  currentPhase: GamePhase;
  conditionalEchoTriggeredId: GameStateCore['conditionalEchoTriggeredId'];
  alquimiaImprovisadaChargeAvailable?: boolean;
  alquimiaImprovisadaActiveForNextBomb?: boolean;
  onActivateAlquimiaImprovisada?: () => void;
  onActivateOjoOmnisciente?: () => void;
  onOpenConfirmAbandonModal?: () => void;
  onDebugWinLevel?: () => void;
  onDebugLoseLevel?: () => void;
  gameStatus: GameStatus;
}

/**
 * @component HeaderUI
 * @description Displays the main game interface header. This includes player stats, enemy stats,
 * current level information, turn indicator, active Echos, and enemy Fury abilities.
 * It also manages damage flash animations for player and enemy stats components.
 */
const HeaderUI: React.FC<HeaderUIProps> = ({
  player,
  enemy,
  activeEcos,
  currentLevel,
  currentPhase,
  conditionalEchoTriggeredId,
  alquimiaImprovisadaChargeAvailable,
  alquimiaImprovisadaActiveForNextBomb,
  onActivateAlquimiaImprovisada,
  onActivateOjoOmnisciente,
  onOpenConfirmAbandonModal,
  onDebugWinLevel,
  onDebugLoseLevel,
  gameStatus
}) => {
  const [playerDamagedTrigger, setPlayerDamagedTrigger] = useState(0);
  const [enemyDamagedTrigger, setEnemyDamagedTrigger] = useState(0);
  const prevPlayerHp = useRef(player.hp);
  const prevEnemyHp = useRef(enemy.currentHp);

  /** Effect to trigger player damage animation when player HP decreases. */
  useEffect(() => {
    if (player.hp < prevPlayerHp.current) {
      setPlayerDamagedTrigger(prev => prev + 1); // Increment to trigger animation
    }
    prevPlayerHp.current = player.hp; // Update previous HP for next comparison
  }, [player.hp]);

  /** Effect to trigger enemy damage animation when enemy HP decreases. */
  useEffect(() => {
    if (enemy.currentHp < prevEnemyHp.current) {
      setEnemyDamagedTrigger(prev => prev + 1); // Increment to trigger animation
    }
    prevEnemyHp.current = enemy.currentHp; // Update previous HP for next comparison
  }, [enemy.currentHp]);

  const showDebugButtons = process.env.NODE_ENV === 'development' || true; // Set to false to hide in production unless explicitly enabled

  return (
    <header
      className="mb-3 p-2 sm:p-3 bg-slate-800/60 rounded-xl shadow-lg w-full"
      role="banner" // Semantic role for the header
      aria-label="Información Principal del Juego" // Accessible label for the header region
    >
      {/* Top section: Player Stats, Level/Turn Info, Enemy Stats */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-2 sm:gap-4 mb-2">
        <PlayerStats player={player} damageTrigger={playerDamagedTrigger} />
        <div className="text-center order-first md:order-none my-1 md:my-0 flex flex-col items-center">
            <h2 className="text-lg sm:text-xl font-bold text-slate-300" aria-live="polite" aria-atomic="true">
              Nivel: {currentLevel}
            </h2>
            <div className="mt-1 mb-1">
              <TurnIndicator currentPhase={currentPhase} />
            </div>
            {/* Abandon run button */}
            {onOpenConfirmAbandonModal && gameStatus === GameStatus.Playing && (
              <Button
                onClick={onOpenConfirmAbandonModal}
                variant="danger"
                size="sm"
                className="mt-1 px-2 py-1 text-xs"
                aria-label="Abandonar partida actual"
              >
                Abandonar Partida
              </Button>
            )}
            {/* Debug buttons (conditionally rendered) */}
            {gameStatus === GameStatus.Playing && showDebugButtons && (
              <div className="mt-1 flex space-x-1">
                {onDebugWinLevel && (
                  <Button onClick={onDebugWinLevel} variant="secondary" size="sm" className="px-1.5 py-0.5 text-xs bg-green-700 hover:bg-green-800">
                    Debug Win
                  </Button>
                )}
                {onDebugLoseLevel && (
                  <Button onClick={onDebugLoseLevel} variant="secondary" size="sm" className="px-1.5 py-0.5 text-xs bg-red-700 hover:bg-red-800">
                    Debug Lose
                  </Button>
                )}
              </div>
            )}
        </div>
        <EnemyStats enemy={enemy} damageTrigger={enemyDamagedTrigger} />
      </div>

      {/* Bottom section: Active Echos and Enemy Fury Abilities (if any) */}
      {(activeEcos.length > 0 || (enemy.furyAbilities && enemy.furyAbilities.length > 0)) && (
        <div className="mt-2 pt-2 border-t border-slate-700/50 flex flex-col sm:flex-row gap-3 justify-between">
          {/* Display active Echos */}
          {activeEcos.length > 0 && (
            <div className="flex-1 p-1.5 bg-slate-700/80 rounded-md min-w-0 sm:min-w-[calc(50%-0.375rem)]">
              <EchoesDisplay
                activeEcos={activeEcos}
                player={player}
                conditionalEchoTriggeredId={conditionalEchoTriggeredId}
                alquimiaImprovisadaChargeAvailable={alquimiaImprovisadaChargeAvailable}
                alquimiaImprovisadaActiveForNextBomb={alquimiaImprovisadaActiveForNextBomb}
                onActivateAlquimiaImprovisada={onActivateAlquimiaImprovisada}
                onActivateOjoOmnisciente={onActivateOjoOmnisciente}
              />
            </div>
          )}
          {/* Display enemy Fury abilities */}
          {enemy.furyAbilities && enemy.furyAbilities.length > 0 && (
            <div className="flex-1 p-1.5 bg-red-900/30 rounded-md min-w-0 sm:min-w-[calc(50%-0.375rem)]">
              <EnemyFuryAbilitiesDisplay abilities={enemy.furyAbilities} activeFuryIndex={enemy.activeFuryCycleIndex} />
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default HeaderUI;
