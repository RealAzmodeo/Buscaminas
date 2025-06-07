
import React, { useEffect, useState, useRef } from 'react';
import { EnemyInstance } from '../../types'; // Updated to use EnemyInstance
import FuryBar from './FuryBar';

/**
 * @interface EnemyStatsProps
 * @description Props for the EnemyStats component.
 * @property {EnemyInstance} enemy - The current state of the enemy, using the detailed EnemyInstance type.
 * @property {number} [damageTrigger] - A "trigger" prop that changes (e.g., increments) when damage occurs,
 *                                     used to activate visual feedback animations.
 */
interface EnemyStatsProps {
  enemy: EnemyInstance;
  damageTrigger?: number;
}

/**
 * @component EnemyStats
 * @description Displays the enemy's name, current HP, Max HP, Armor (if any), and Fury bar.
 * Includes a visual flash animation when the enemy takes damage, triggered by the `damageTrigger` prop.
 * Uses `EnemyInstance` for richer enemy data.
 */
const EnemyStats: React.FC<EnemyStatsProps> = ({ enemy, damageTrigger }) => {
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
      }, 400); // Duration should match the CSS animation duration for 'animate-damage-flash-enemy'
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
      id="enemy-stats-container" // Used for targeting by floating text system
      className={`p-2 sm:p-3 bg-slate-800 rounded-lg shadow-md text-center md:text-right w-full md:w-auto ${isAnimatingDamage ? 'animate-damage-flash-enemy' : ''}`}
      role="region" // Defines this div as a landmark region for accessibility
      aria-labelledby="enemy-stats-heading" // Associates the heading with this region
    >
      <h3 id="enemy-stats-heading" className="text-md sm:text-lg font-semibold text-red-400 mb-1">
        {enemy.name} {enemy.baseArchetype.icon}
      </h3>
      <p className="text-lg sm:text-xl" aria-label={`Salud del enemigo: ${enemy.currentHp} de ${enemy.maxHp}`}>
        <span className="text-red-500" aria-hidden="true">❤️</span> HP: {enemy.currentHp} / {enemy.maxHp}
      </p>
      {/* Display armor only if the enemy has armor */}
      {enemy.armor > 0 && (
        <p className="text-base sm:text-lg" aria-label={`Armadura del enemigo: ${enemy.armor}`}>
          <span className="text-slate-400" aria-hidden="true">🛡️</span> Armadura: {enemy.armor}
        </p>
      )}
      {/* Display the FuryBar component */}
      <FuryBar currentFury={enemy.currentFuryCharge} maxFury={enemy.furyActivationThreshold} />
    </div>
  );
};

export default EnemyStats;
