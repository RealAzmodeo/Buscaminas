
import React from 'react';
import { PlayerState, DeactivatedEchoInfo } from '../../types';
import Tooltip from '../common/Tooltip';

/**
 * @interface StatusEffect
 * @description Represents a single status effect to be displayed.
 * @property {string} id - Unique identifier for the effect.
 * @property {string} icon - Emoji/icon representing the effect.
 * @property {string} shortText - Short name or text for the effect icon.
 * @property {string} details - Detailed description of the effect for the tooltip.
 * @property {'buff' | 'debuff'} type - Type of effect, influencing its visual style.
 * @property {number} [duration] - Optional duration in clicks remaining for the effect.
 */
interface StatusEffect {
  id: string;
  icon: string;
  shortText: string;
  details: string;
  type: 'buff' | 'debuff';
  duration?: number;
}

/**
 * @interface StatusEffectsDisplayProps
 * @description Props for the StatusEffectsDisplay component.
 * @property {PlayerState} player - The current state of the player, used to determine active effects.
 */
interface StatusEffectsDisplayProps {
  player: PlayerState;
}

/**
 * @component StatusEffectsDisplay
 * @description Renders a list of active status effects (buffs and debuffs) on the player.
 * Each effect is displayed as an icon with a tooltip providing more details.
 * Uses ARIA roles for list structure and detailed labels for accessibility.
 */
const StatusEffectsDisplay: React.FC<StatusEffectsDisplayProps> = ({ player }) => {
  const effects: StatusEffect[] = [];

  // Populate effects based on player state
  if (player.shield > 0) {
    effects.push({
      id: 'shield',
      icon: '🛡️',
      shortText: `Escudo (${player.shield})`,
      details: `Absorbe los próximos ${player.shield} puntos de daño.`,
      type: 'buff', // Shield is generally a buff
    });
  }
  if (player.venganzaSpectralCharge > 0) {
    effects.push({
      id: 'venganza',
      icon: '👻⚔️',
      shortText: 'Venganza',
      details: `Próximo Ataque que reveles infligirá +${player.venganzaSpectralCharge} de daño adicional.`,
      type: 'buff'
    });
  }
  if (player.isInvulnerable && player.invulnerabilityClicksRemaining > 0) {
    effects.push({
      id: 'invuln',
      icon: '🛡️⏳',
      shortText: 'Invulnerable',
      duration: player.invulnerabilityClicksRemaining,
      details: `Inmune al daño por los próximos ${player.invulnerabilityClicksRemaining} clics.`,
      type: 'buff'
    });
  }
  if (player.criticalHitClicksRemaining > 0) {
    effects.push({
      id: 'crit',
      icon: '💥⏳',
      shortText: 'Crítico Asegurado',
      duration: player.criticalHitClicksRemaining,
      details: `Tus revelaciones de Ataque infligen daño crítico (doble) por ${player.criticalHitClicksRemaining} clics.`,
      type: 'buff'
    });
  }
  if (player.debuffEspadasOxidadasClicksRemaining > 0) {
    effects.push({
      id: 'oxidadas',
      icon: '⚔️🥀',
      shortText: 'Ataque Oxidado',
      duration: player.debuffEspadasOxidadasClicksRemaining,
      details: `Tus revelaciones de Ataque infligen -1 de daño (mínimo 1) por ${player.debuffEspadasOxidadasClicksRemaining} clics.`,
      type: 'debuff'
    });
  }
  if (player.vinculoDolorosoActive && player.vinculoDolorosoClicksRemaining > 0) {
    effects.push({
      id: 'vinculo',
      icon: '❤️‍🔥⛓️',
      shortText: 'Vínculo Doloroso',
      duration: player.vinculoDolorosoClicksRemaining,
      details: `Al infligir daño con una revelación de Ataque, recibes 1 de daño de rebote por ${player.vinculoDolorosoClicksRemaining} clics.`,
      type: 'debuff'
    });
  }

  player.deactivatedEcos.forEach((deactivatedEcho: DeactivatedEchoInfo) => {
    effects.push({
      id: `deactivated_${deactivatedEcho.echoId}`,
      icon: deactivatedEcho.icon + '🚫',
      shortText: `${deactivatedEcho.name}`,
      duration: deactivatedEcho.clicksRemaining,
      details: `Eco "${deactivatedEcho.name}" desactivado temporalmente por ${deactivatedEcho.clicksRemaining} clics.`,
      type: 'debuff'
    });
  });

  if (player.nextEchoCostsDoubled) {
    effects.push({
      id: 'echo_cost_doubled',
      icon: '💸‼️',
      shortText: 'Eco Coste x2',
      details: 'El próximo Eco que adquieras (si no es gratuito) costará el doble de oro.',
      type: 'debuff'
    });
  }

  if (player.nextOracleOnlyCommonFury) {
    effects.push({
      id: 'oracle_nerfed',
      icon: '🔮🚫',
      shortText: 'Oráculo Común',
      details: 'La próxima selección de Furia del Oráculo solo ofrecerá habilidades de rareza Común.',
      type: 'debuff'
    });
  }

  if (player.pistasFalsasClicksRemaining > 0) {
    effects.push({
      id: 'pistas_falsas',
      icon: '❓🔢',
      shortText: 'Pistas Falsas',
      duration: player.pistasFalsasClicksRemaining,
      details: `Algunas pistas numéricas podrían mostrar un valor incorrecto (+/-1) durante ${player.pistasFalsasClicksRemaining} clics.`,
      type: 'debuff'
    });
  }

  if (player.paranoiaGalopanteClicksRemaining > 0) {
    effects.push({
      id: 'paranoia',
      icon: '😵‍💫',
      shortText: 'Paranoia',
      duration: player.paranoiaGalopanteClicksRemaining,
      details: `Todas las pistas numéricas parpadean o muestran '?' durante ${player.paranoiaGalopanteClicksRemaining} clics.`,
      type: 'debuff'
    });
  }

  if (effects.length === 0) {
    return null; // Don't render the container if there are no effects
  }

  return (
    <div className="status-effects-container mt-2" role="list" aria-label="Efectos de estado activos del jugador">
      {effects.map(effect => {
        const tooltipContent = (
          <div>
            <div className="tooltip-title">{effect.shortText}{effect.duration !== undefined ? ` (${effect.duration})` : ''}</div>
            {effect.details && <div className="tooltip-description" dangerouslySetInnerHTML={{ __html: effect.details }}></div>}
          </div>
        );

        // Construct a comprehensive ARIA label for screen readers
        const fullAriaLabel = `${effect.shortText}. ${effect.details}${effect.duration ? ` Duración: ${effect.duration} clics.` : ''}`;

        return (
          <div key={effect.id} className="status-effect-icon-wrapper" role="listitem">
            <Tooltip content={tooltipContent} position="top">
              <div
                className={`status-effect-icon ${effect.type}`}
                tabIndex={0} // Make focusable for tooltip accessibility via keyboard
                aria-label={fullAriaLabel} // Provide full details for screen readers
              >
                <span className="icon" aria-hidden="true">{effect.icon}</span>
                <span className="truncate max-w-[80px] sm:max-w-[120px]" aria-hidden="true">{effect.shortText}</span>
                {effect.duration !== undefined && (
                  <span className="duration" aria-hidden="true">({effect.duration})</span>
                )}
              </div>
            </Tooltip>
          </div>
        );
      })}
    </div>
  );
};

export default StatusEffectsDisplay;
