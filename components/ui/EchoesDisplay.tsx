
import React from 'react';
import { Echo, GameStateCore, PlayerState } from '../../types';
import {
  BASE_ECHO_ALQUIMIA_IMPROVISADA,
  BASE_ECHO_OJO_OMNISCIENTE,
  BASE_ECHO_ULTIMO_ALIENTO,
  BASE_ECHO_PASO_LIGERO
} from '../../constants';
import Tooltip from '../common/Tooltip'; // Assuming Tooltip component is in common folder

/**
 * @interface EchoesDisplayProps
 * @description Props for the EchoesDisplay component.
 * @property {Echo[]} activeEcos - Array of currently active Echos for the player.
 * @property {PlayerState} player - The current state of the player, used for Echo status (e.g., used, deactivated).
 * @property {string} [className] - Optional additional CSS classes for the container.
 * @property {GameStateCore['conditionalEchoTriggeredId']} conditionalEchoTriggeredId - ID of an Echo whose conditional effect recently triggered, for visual feedback.
 * @property {boolean} [alquimiaImprovisadaChargeAvailable] - Whether Alquimia Improvisada Echo can be activated.
 * @property {boolean} [alquimiaImprovisadaActiveForNextBomb] - Whether Alquimia Improvisada is set to negate the next enemy attack.
 * @property {() => void} [onActivateAlquimiaImprovisada] - Callback to activate Alquimia Improvisada Echo.
 * @property {() => void} [onActivateOjoOmnisciente] - Callback to activate Ojo Omnisciente Echo.
 */
interface EchoesDisplayProps {
  activeEcos: Echo[];
  player: PlayerState;
  className?: string;
  conditionalEchoTriggeredId: GameStateCore['conditionalEchoTriggeredId'];
  alquimiaImprovisadaChargeAvailable?: boolean;
  alquimiaImprovisadaActiveForNextBomb?: boolean;
  onActivateAlquimiaImprovisada?: () => void;
  onActivateOjoOmnisciente?: () => void;
}

/**
 * @component EchoesDisplay
 * @description Renders a display of the player's currently active Echos.
 * Each Echo is shown with its icon and a tooltip providing its name, level, description, and status
 * (e.g., used this level, temporarily deactivated, multiplier).
 * Interactive Echos like Alquimia Improvisada and Ojo Omnisciente will show activation buttons when usable.
 */
const EchoesDisplay: React.FC<EchoesDisplayProps> = ({
  activeEcos,
  player,
  className,
  conditionalEchoTriggeredId,
  alquimiaImprovisadaChargeAvailable,
  alquimiaImprovisadaActiveForNextBomb,
  onActivateAlquimiaImprovisada,
  onActivateOjoOmnisciente
}) => {
  if (activeEcos.length === 0) {
    return null; // Don't render anything if no active Echos
  }

  // Sort Echos alphabetically by name for a consistent display order
  const echosToDisplay = [...activeEcos].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className={`text-left ${className || ''}`} role="region" aria-label="Ecos Activos del Jugador">
      <h4 className="text-sm font-semibold text-slate-400 mb-1.5">Ecos Activos:</h4>
      <div className="flex flex-wrap gap-2 items-center" role="list"> {/* ARIA role for list of items */}
        {echosToDisplay.map(echo => {
          const levelText = echo.level > 0 ? ` (Nv. ${echo.level})` : '';
          const multiplierText = (echo.effectivenessMultiplier || 1) > 1 ? ` x${echo.effectivenessMultiplier}` : '';

          let usageIndicator = ''; // Icon/text to show if Echo is used or special state
          let isUsedOrDepleted = false;
          const isOjoOmnisciente = echo.baseId === BASE_ECHO_OJO_OMNISCIENTE;

          // Check if the Echo is temporarily deactivated by an enemy effect
          const deactivatedInfo = player.deactivatedEcos.find(de => de.echoId === echo.id);
          const isTemporarilyDeactivated = !!deactivatedInfo;

          // Determine usage/depletion status for specific Echos
          if (isTemporarilyDeactivated) {
            usageIndicator = '🚫'; // Standard "deactivated" icon
          } else if (isOjoOmnisciente && player.ojoOmniscienteUsedThisLevel) {
            usageIndicator = '🌟🚫'; // Ojo Omnisciente used this level
            isUsedOrDepleted = true;
          } else if (echo.baseId === BASE_ECHO_ULTIMO_ALIENTO && player.ultimoAlientoUsedThisRun) {
            usageIndicator = '⏳🚫'; // Último Aliento used this run
            isUsedOrDepleted = true;
          } else if (echo.baseId === BASE_ECHO_PASO_LIGERO && player.pasoLigeroTrapIgnoredThisLevel) {
            usageIndicator = '👟🚫'; // Paso Ligero used this level
            isUsedOrDepleted = true;
          }

          const tooltipContent = (
            <div>
              <div className="tooltip-title">{echo.name}{levelText}{multiplierText}</div>
              <div className="tooltip-description" dangerouslySetInnerHTML={{ __html: echo.description }}></div>
              {isTemporarilyDeactivated && deactivatedInfo && (
                <div className="tooltip-details text-orange-400">(Desactivado: {deactivatedInfo.clicksRemaining} clic(s))</div>
              )}
              {isUsedOrDepleted && !isTemporarilyDeactivated && (
                <div className="tooltip-details text-slate-500">(Usado esta {echo.baseId === BASE_ECHO_ULTIMO_ALIENTO ? 'partida' : 'vez/nivel'})</div>
              )}
            </div>
          );

          // Apply glow animation if this Echo's conditional effect just triggered
          const isActivatedGlow = echo.id === conditionalEchoTriggeredId && !isTemporarilyDeactivated;

          let iconContainerClasses = "relative flex items-center justify-center p-1.5 bg-slate-800 rounded text-xl shadow w-9 h-9 sm:w-10 sm:h-10 hud-icon-interactive";
          if (isActivatedGlow) {
            iconContainerClasses += " echo-activated-feedback";
          }
          // Apply grayscale if used/depleted (unless it's Ojo, which has a specific used icon) OR if temporarily deactivated.
          if ((isUsedOrDepleted && !isOjoOmnisciente) || isTemporarilyDeactivated) {
            iconContainerClasses += " opacity-50 grayscale";
          }

          // Determine if Alquimia Improvisada can be activated
          const isAlquimia = echo.baseId === BASE_ECHO_ALQUIMIA_IMPROVISADA;
          const alquimiaBaseCost = typeof echo.value === 'number' ? echo.value : 5; // Default cost if not specified
          const alquimiaEffectiveCost = isAlquimia ? Math.max(1, Math.round(alquimiaBaseCost / (echo.effectivenessMultiplier || 1))) : alquimiaBaseCost;

          const canActivateAlquimia = isAlquimia &&
                                      !isTemporarilyDeactivated &&
                                      alquimiaImprovisadaChargeAvailable && // Engine determines charge based on 1/level
                                      player.gold >= alquimiaEffectiveCost &&
                                      !alquimiaImprovisadaActiveForNextBomb && // Not already active
                                      onActivateAlquimiaImprovisada; // Callback provided

          // Determine if Ojo Omnisciente can be activated
          const canActivateOjo = isOjoOmnisciente &&
                                 !isTemporarilyDeactivated &&
                                 !player.ojoOmniscienteUsedThisLevel && // Not already used this level
                                 onActivateOjoOmnisciente; // Callback provided

          const isAlquimiaActiveWaiting = isAlquimia && alquimiaImprovisadaActiveForNextBomb && !isTemporarilyDeactivated;
          const fullAriaLabel = `${echo.name}${levelText}${multiplierText}${isTemporarilyDeactivated ? ` (Desactivado por ${deactivatedInfo?.clicksRemaining} clics)` : (isUsedOrDepleted ? ' (Usado)' : '')}. ${echo.description.replace(/<strong>|<\/strong>/g, '')}`;

          return (
            <div role="listitem" key={echo.id + (echo.effectivenessMultiplier || 1)} className="relative"> {/* Ensure unique key if multipliers change Echo instance */}
              <Tooltip content={tooltipContent} position="top">
                <div
                  className={iconContainerClasses}
                  tabIndex={0} // Make focusable for tooltip accessibility via keyboard
                  role="img" // Semantic role, could be "button" if always interactive
                  aria-label={fullAriaLabel}
                >
                  <span aria-hidden="true">{usageIndicator || echo.icon}</span>
                  {multiplierText && !usageIndicator && (
                    <span className="absolute text-[10px] -top-1 -left-1 bg-purple-500 text-white px-1 rounded-full shadow-sm" aria-hidden="true">
                      {multiplierText}
                    </span>
                  )}
                  {isAlquimiaActiveWaiting && (
                    <span
                      className="absolute -top-1.5 -right-1.5 text-xs bg-green-500 text-white rounded-full w-4 h-4 flex items-center justify-center animate-pulse"
                      aria-label="Alquimia Improvisada activa: La próxima casilla de Ataque del enemigo será ignorada."
                      title="Alquimia Improvisada Activa" // Tooltip for the checkmark itself
                    >✓</span>
                  )}
                  {/* Activation button for Alquimia Improvisada */}
                  {canActivateAlquimia && onActivateAlquimiaImprovisada && (
                    <div
                      className="absolute -bottom-1.5 -right-1.5 flex items-center"
                      aria-label={`Activar Alquimia Improvisada (Costo: ${alquimiaEffectiveCost} Oro)`}
                    >
                      <span className="text-[10px] text-amber-300 mr-0.5 bg-slate-900/70 px-0.5 rounded-sm" aria-hidden="true">
                        💰{alquimiaEffectiveCost}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); onActivateAlquimiaImprovisada(); }}
                        className="w-5 h-5 bg-amber-500 hover:bg-amber-600 text-white text-[10px] rounded-full flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-amber-400"
                        aria-label={`Activar Alquimia Improvisada, costo ${alquimiaEffectiveCost} oro`}
                        title="Activar Alquimia Improvisada"
                      >
                        🔥
                      </button>
                    </div>
                  )}
                  {/* Activation button for Ojo Omnisciente */}
                  {canActivateOjo && onActivateOjoOmnisciente && (
                     <button
                        onClick={(e) => { e.stopPropagation(); onActivateOjoOmnisciente(); }}
                        className="absolute -bottom-1.5 -right-1.5 w-5 h-5 bg-sky-500 hover:bg-sky-600 text-white text-[10px] rounded-full flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-sky-400"
                        aria-label="Activar Ojo Omnisciente (1 uso por nivel)"
                        title="Activar Ojo Omnisciente"
                      >
                        👁️
                      </button>
                  )}
                </div>
              </Tooltip>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EchoesDisplay;
