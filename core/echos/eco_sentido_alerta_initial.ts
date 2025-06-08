import { Echo, EchoEffectType, Rarity } from '../../types';
// No BASE_ECHO_ constant for baseId, no ECO_UNLOCK_AWAKENING_POINTS

export const ecoSentidoAlertaInitial: Echo = {
  id: 'eco_sentido_alerta_initial',
  baseId: 'base_sentido_alerta_initial',
  name: "Sentido Alerta",
  level: 1,
  description: "Casillas con cualquier objeto (Ataque, Oro) emiten un <strong>aura visual muy sutil</strong> al pasar el cursor cerca (no discrimina tipo).",
  icon: "🔔",
  cost: 0,
  isFree: true,
  effectType: EchoEffectType.GenericPlaceholder, // Note: Original uses GenericPlaceholder
  rarity: Rarity.Common
  // No awakeningPoints, no value explicitly defined in source for this one
};
