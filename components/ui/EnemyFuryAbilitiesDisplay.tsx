
import React from 'react';
import { FuryAbility } from '../../types';
import Tooltip from '../common/Tooltip'; // Assuming Tooltip component is in common folder

/**
 * @interface EnemyFuryAbilitiesDisplayProps
 * @description Props for the EnemyFuryAbilitiesDisplay component.
 * @property {FuryAbility[]} abilities - Array of Fury abilities the enemy possesses.
 * @property {number} [activeFuryIndex] - Index of the Fury ability that will trigger next in the cycle.
 *                                        If undefined, no ability is specifically highlighted as next.
 * @property {string} [className] - Optional additional CSS classes for the container.
 */
interface EnemyFuryAbilitiesDisplayProps {
  abilities: FuryAbility[];
  activeFuryIndex?: number;
  className?: string;
}

/**
 * @component EnemyFuryAbilitiesDisplay
 * @description Renders a display of the enemy's current Fury abilities.
 * Each ability is shown with its icon and a tooltip providing its name and description.
 * If `activeFuryIndex` is provided, the corresponding ability is highlighted as the next to activate.
 */
const EnemyFuryAbilitiesDisplay: React.FC<EnemyFuryAbilitiesDisplayProps> = ({ abilities, activeFuryIndex, className }) => {
  if (!abilities || abilities.length === 0) {
    return null; // Don't render anything if the enemy has no Fury abilities
  }

  return (
    <div className={`text-left ${className || ''}`} role="region" aria-label="Habilidades de Furia del Enemigo">
      <h4 className="text-sm font-semibold text-red-300 mb-1.5">Habilidades de Furia del Enemigo:</h4>
      <div className="flex flex-wrap gap-2 items-center" role="list"> {/* ARIA role for list of items */}
        {abilities.map((ability, index) => {
          const isActiveFury = index === activeFuryIndex;
          const tooltipContent = (
            <div>
              <div className="tooltip-title">{ability.name}</div>
              <div className="tooltip-description" dangerouslySetInnerHTML={{ __html: ability.description }}></div>
              {isActiveFury && <div className="text-xs text-amber-300 mt-1">(Próxima en Activar)</div>}
            </div>
          );

          let iconContainerClasses = "flex items-center justify-center p-1.5 bg-slate-800 border border-red-700/50 rounded text-xl shadow w-9 h-9 sm:w-10 sm:h-10 hud-icon-fury";
          if (isActiveFury) {
            iconContainerClasses += " ring-2 ring-amber-400 scale-110 shadow-amber-500/50"; // Highlight for active Fury
          }

          // Construct a comprehensive ARIA label for screen readers
          const fullAriaLabel = `${ability.name}${isActiveFury ? ' (Próxima en Activar)' : ''}. ${ability.description.replace(/<strong>|<\/strong>/g, '')}`;

          return (
            <div role="listitem" key={ability.id + '-' + index}> {/* Ensure unique key if abilities can repeat in the cycle */}
              <Tooltip content={tooltipContent} position="top">
                <div
                  className={iconContainerClasses}
                  tabIndex={0} // Make focusable for tooltip accessibility via keyboard
                  role="img" // Semantic role, as it primarily displays an icon
                  aria-label={fullAriaLabel}
                >
                  <span aria-hidden="true">{ability.icon}</span> {/* Icon is decorative, label provides info */}
                </div>
              </Tooltip>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EnemyFuryAbilitiesDisplay;
