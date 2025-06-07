
import React from 'react';
import { AdjacentItems, Echo, PlayerState } from '../../types';
import { BASE_ECHO_VISION_AUREA, BASE_ECHO_CLARIVIDENCIA_TOTAL, INITIAL_STARTING_FURIESS } from '../../constants';

/**
 * @interface ClueBlockProps
 * @description Props for the ClueBlock component, which displays a single part of a clue
 * (e.g., gold count or attack count) when Echos like Clarividencia Total are active.
 * @property {number} count - The number to display in the block.
 * @property {string} colorClass - Tailwind CSS classes for the background and text color.
 * @property {string} label - A descriptive label for ARIA accessibility (e.g., "Oro adyacente", "Ataques adyacentes").
 */
interface ClueBlockProps {
  count: number;
  colorClass: string;
  label: string;
}

/**
 * @component ClueBlock
 * @description Renders a small, colored block displaying a count for a specific item type within a clue.
 * This component is memoized for performance as it might be part of frequently re-rendering clue displays.
 */
const ClueBlock: React.FC<ClueBlockProps> = React.memo(({ count, colorClass, label }) => {
  return (
    <div
      className={`flex items-center justify-center text-xs font-bold rounded-sm px-1.5 py-0.5 ${colorClass} min-w-[24px] h-[20px] shadow-sm`}
      aria-label={`${label}: ${count}`} // Provides specific count for this item type
    >
      {count}
    </div>
  );
});
ClueBlock.displayName = 'ClueBlock';


/**
 * @interface ClueDisplayProps
 * @description Props for the ClueDisplay component.
 * @property {AdjacentItems} adjacentItems - The counts of adjacent items (attacks, gold, total).
 * @property {Echo[]} activeEcos - Array of currently active Echos, used to modify clue display.
 * @property {PlayerState} player - The current state of the player, for effects like Paranoia Galopante or Pistas Falsas.
 */
interface ClueDisplayProps {
  adjacentItems: AdjacentItems;
  activeEcos: Echo[];
  player: PlayerState;
}

/**
 * @component ClueDisplay
 * @description Renders the numerical clue on a cell, adapting its appearance based on active Echos
 * (e.g., Visión Áurea, Clarividencia Total) and player status effects (e.g., Paranoia Galopante, Pistas Falsas).
 * It can display a single total number, a breakdown of gold/attacks, or special indicators like '?'.
 */
const ClueDisplay: React.FC<ClueDisplayProps> = ({ adjacentItems, activeEcos, player }) => {
  // If the total is 0 and no paranoia or misleading effects are active, render an empty span for a cleaner look.
  if (adjacentItems.total === 0 && player.paranoiaGalopanteClicksRemaining === 0 && player.pistasFalsasClicksRemaining === 0) {
    return <span className="text-sm text-slate-500" aria-label="Cero objetos adyacentes."></span>;
  }

  // Paranoia Galopante overrides all other clue displays with a flickering question mark.
  if (player.paranoiaGalopanteClicksRemaining > 0) {
    return <span className="text-2xl font-bold text-purple-400 flicker-paranoia" aria-label="Pista oscurecida por Paranoia Galopante.">?</span>;
  }

  const hasClarividencia = activeEcos.some(echo => echo.baseId === BASE_ECHO_CLARIVIDENCIA_TOTAL);
  const hasVisionAurea = activeEcos.some(echo => echo.baseId === BASE_ECHO_VISION_AUREA);

  let displayTotal = adjacentItems.total;
  let isMisleading = false;

  // Pistas Falsas effect: Clues might show incorrect numbers if a basic clue system is active.
  if (player.pistasFalsasClicksRemaining > 0 && !hasClarividencia && !hasVisionAurea) {
    // Attempt to find the Pistas Falsas Fury ability definition to get its parameters
    const pistasFalsasFuryAbility = INITIAL_STARTING_FURIESS.find(f => f.id === 'fury_pistas_falsas'); // This ID needs to be correctly defined
    if (pistasFalsasFuryAbility && typeof pistasFalsasFuryAbility.value === 'object' && pistasFalsasFuryAbility.value) {
      const { incorrectChance, deviation } = pistasFalsasFuryAbility.value as { incorrectChance: number; deviation: number; /* durationClicks: number */ };
      if (Math.random() < incorrectChance) {
        isMisleading = true;
        const change = Math.random() < 0.5 ? -deviation : deviation;
        displayTotal = Math.max(0, adjacentItems.total + change);
      }
    } else {
      // Fallback if Pistas Falsas definition isn't found or malformed: simple random chance
      if (Math.random() < 0.3) { // Example: 30% chance of being misleading
        isMisleading = true;
        displayTotal = Math.max(0, adjacentItems.total + (Math.random() < 0.5 ? -1 : 1));
      }
    }
  }

  // Determine default color based on the displayed total (which might be misleading)
  let defaultNumberColor = "text-slate-300";
  if (displayTotal >= 6) defaultNumberColor = "text-red-400";
  else if (displayTotal >= 4) defaultNumberColor = "text-orange-400";
  else if (displayTotal > 0) defaultNumberColor = "text-sky-400";

  if (isMisleading) {
    defaultNumberColor = "text-purple-400"; // Distinct color to indicate a potentially misleading clue
  }

  const ariaLabelBase = isMisleading
    ? `Pista posiblemente incorrecta: ${displayTotal}`
    : (adjacentItems.total === 0 ? "Cero objetos" : `Pista: ${displayTotal}`);

  // Clarividencia Total: Shows separate counts for Gold and Attacks.
  if (hasClarividencia) {
    const { gold, attacks } = adjacentItems;
    const itemsToDisplay = [
      { count: gold, color: 'bg-yellow-500 text-black', label: 'Oro adyacente' },
      { count: attacks, color: 'bg-orange-500 text-white', label: 'Ataques adyacentes' },
    ].filter(item => item.count > 0); // Only display blocks for item types that are present

    if (itemsToDisplay.length > 0) {
      const detailedAriaLabel = `Pista detallada: ${itemsToDisplay.map(item => `${item.label} ${item.count}`).join(', ')}.`;
      return (
        <div className="flex flex-col gap-0.5 items-center justify-center" aria-label={detailedAriaLabel}>
          {itemsToDisplay.map(item => (
            <ClueBlock key={item.label} count={item.count} colorClass={item.color} label={item.label} />
          ))}
        </div>
      );
    }
    // If Clarividencia is active but both gold and attacks are 0.
    return <span className={`text-2xl font-bold ${defaultNumberColor}`} aria-label="Pista: 0 objetos (con Clarividencia Total).">0</span>;
  }

  // Visión Áurea: Shows Gold vs. Others (which are primarily Attacks).
  if (hasVisionAurea) {
    const { gold, attacks } = adjacentItems;
    const othersCount = attacks; // "Others" refers to non-Gold items, primarily Attack items in this context.
    const itemsToDisplay = [
      { count: gold, color: 'bg-yellow-500 text-black', label: 'Oro adyacente' },
      { count: othersCount, color: 'bg-slate-500 text-slate-100', label: 'Otros objetos (Ataques) adyacentes' },
    ].filter(item => item.count > 0);

    if (itemsToDisplay.length > 0) {
      const detailedAriaLabel = `Pista detallada: ${itemsToDisplay.map(item => `${item.label} ${item.count}`).join(', ')}.`;
      return (
        <div className="flex flex-col gap-0.5 items-center justify-center" aria-label={detailedAriaLabel}>
          {itemsToDisplay.map(item => (
            <ClueBlock key={item.label} count={item.count} colorClass={item.color} label={item.label} />
          ))}
        </div>
      );
    }
    // If Visión Áurea is active but both gold and others are 0.
    return <span className={`text-2xl font-bold ${defaultNumberColor}`} aria-label="Pista: 0 objetos (con Visión Áurea).">0</span>;
  }

  // Default: Display total count.
  // This handles cases where total is > 0, or where a positive total became 0 due to misleading logic,
  // or if displayTotal is just 0 initially.
  if ((adjacentItems.total > 0 && displayTotal === 0 && isMisleading) || displayTotal === 0) {
     return <span className={`text-2xl font-bold ${defaultNumberColor}`} aria-label={`${ariaLabelBase} objetos adyacentes.`}>{displayTotal}</span>;
  }

  return <span className={`text-2xl font-bold ${defaultNumberColor}`} aria-label={`${ariaLabelBase} objetos adyacentes.`}>{displayTotal}</span>;
};

export default React.memo(ClueDisplay);
