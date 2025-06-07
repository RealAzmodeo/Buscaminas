
import React from 'react';
import { GamePhase } from '../../types';

/**
 * @interface TurnIndicatorProps
 * @description Props for the TurnIndicator component.
 * @property {GamePhase} currentPhase - The current phase of the game turn.
 */
interface TurnIndicatorProps {
  currentPhase: GamePhase;
}

/**
 * @component TurnIndicator
 * @description Displays whose turn it is (Player or Enemy) or the current action phase.
 * Uses ARIA live regions to announce turn changes to assistive technologies.
 */
const TurnIndicator: React.FC<TurnIndicatorProps> = ({ currentPhase }) => {
  const isPlayerTurnActive = currentPhase === GamePhase.PLAYER_TURN;
  const isPlayerActionResolving = currentPhase === GamePhase.PLAYER_ACTION_RESOLVING;
  const isEnemyThinking = currentPhase === GamePhase.ENEMY_THINKING;
  const isEnemyActionPending = currentPhase === GamePhase.ENEMY_ACTION_PENDING_REVEAL;
  const isEnemyActionResolving = currentPhase === GamePhase.ENEMY_ACTION_RESOLVING;

  let text = "Cargando...";
  let bgColor = "bg-slate-700";
  let textColor = "text-slate-300";
  let pulseAnimation = "";

  if (isPlayerTurnActive) {
    text = "Turno del Jugador";
    bgColor = "bg-sky-600";
    textColor = "text-white";
  } else if (isPlayerActionResolving) {
    text = "Resolviendo Acción...";
    bgColor = "bg-sky-700";
    textColor = "text-sky-100";
  } else if (isEnemyThinking) {
    text = "Enemigo Piensa...";
    bgColor = "bg-orange-600";
    textColor = "text-white";
    pulseAnimation = "animate-pulse"; // Add pulse for thinking phase
  } else if (isEnemyActionPending) {
    text = "¡Enemigo Apunta!";
    bgColor = "bg-red-600";
    textColor = "text-white";
    pulseAnimation = "animate-pulse";
  } else if (isEnemyActionResolving) {
    text = "Acción Enemiga...";
    bgColor = "bg-red-700";
    textColor = "text-red-100";
  }

  return (
    <div
      className={`px-3 py-1.5 rounded-md shadow-md text-center text-sm font-semibold transition-all duration-300 ease-in-out ${bgColor} ${textColor} ${pulseAnimation}`}
      // ARIA live region to announce changes to screen readers
      aria-live="polite" // Announce changes without interrupting the user
      aria-atomic="true" // Ensure the entire content is announced on change
      role="status" // Role to indicate this is a status message area
    >
      {text}
    </div>
  );
};

export default TurnIndicator;
