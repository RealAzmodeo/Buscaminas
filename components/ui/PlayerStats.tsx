
import React, { useEffect, useState, useRef } from 'react';
import { PlayerState } from '../../types';
import StatusEffectsDisplay from './StatusEffectsDisplay';

/**
 * @interface PlayerStatsProps
 * @description Props for the PlayerStats component.
 * @property {PlayerState} player - The current state of the player.
 * @property {number} [damageTrigger] - A "trigger" prop that changes (e.g., increments) when damage occurs,
 *                                     used to activate visual feedback animations.
 */
interface PlayerStatsProps {
  player: PlayerState;
  damageTrigger?: number;
}

/**
 * @component PlayerStats
 * @description Displays the player's current HP, Max HP, Gold, and active status effects.
 * Includes a visual flash animation when the player takes damage, triggered by the `damageTrigger` prop.
 */
const PlayerStats: React.FC<PlayerStatsProps> = ({ player, damageTrigger }) => {
  const [isAnimatingDamage, setIsAnimatingDamage] = useState(false);
  const animationTimeoutRef = useRef<number | null>(null);
  const prevDamageTriggerRef = useRef(damageTrigger);

  /**
   * Effect to trigger the damage flash animation.
   * Activates when `damageTrigger` changes and is a positive number, indicating a new damage event.
   */
  useEffect(() => {
    // Trigger animation if damageTrigger has changed and is positive
    if (damageTrigger && damageTrigger > 0 && damageTrigger !== prevDamageTriggerRef.current) {
      setIsAnimatingDamage(true);
      // Clear any existing animation timeout to prevent premature stopping if damage occurs rapidly
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
      // Set a timeout to remove the animation class after it completes
      animationTimeoutRef.current = window.setTimeout(() => {
        setIsAnimatingDamage(false);
      }, 400); // Duration should match the CSS animation duration for 'animate-damage-flash-player'
    }
    prevDamageTriggerRef.current = damageTrigger; // Update the ref for the next comparison
  }, [damageTrigger]);

  /**
   * Effect to clean up the animation timeout on component unmount to prevent memory leaks.
   */
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []); // Empty dependency array ensures this runs only on mount and unmount

  return (
    <div
      id="player-stats-container" // Used for targeting by floating text system
      className={`p-2 sm:p-3 bg-slate-800 rounded-lg shadow-md text-center md:text-left w-full md:w-auto ${isAnimatingDamage ? 'animate-damage-flash-player' : ''}`}
      role="region" // Defines this div as a landmark region for accessibility
      aria-labelledby="player-stats-heading" // Associates the heading with this region
    >
      <h3 id="player-stats-heading" className="text-md sm:text-lg font-semibold text-sky-400 mb-1">
        Jugador
      </h3>
      <p className="text-lg sm:text-xl" aria-label={`Salud: ${player.hp} de ${player.maxHp}`}>
        <span className="text-red-500" aria-hidden="true">❤️</span> HP: {player.hp} / {player.maxHp}
      </p>
      <p className="text-lg sm:text-xl" aria-label={`Oro: ${player.gold}`}>
        <span className="text-yellow-400" aria-hidden="true">💰</span> Oro: {player.gold}
      </p>
      {/* Shield is now handled by StatusEffectsDisplay if it's a temporary status effect.
          If shield becomes a permanent stat like HP/Gold, it could be added here similarly:
          {player.shield > 0 && (
            <p className="text-lg sm:text-xl" aria-label={`Escudo: ${player.shield}`}>
              <span className="text-slate-400" aria-hidden="true">🛡️</span> Escudo: {player.shield}
            </p>
          )}
      */}
      <StatusEffectsDisplay player={player} />
    </div>
  );
};

export default PlayerStats;
