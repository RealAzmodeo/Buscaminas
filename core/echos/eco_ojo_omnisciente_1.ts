import { Echo, EchoEffectType, Rarity } from '../../types';
import { BASE_ECHO_OJO_OMNISCIENTE, ECO_UNLOCK_AWAKENING_POINTS } from '../../constants';

export const ecoOjoOmnisciente1: Echo = {
  id: 'eco_ojo_omnisciente_1',
  baseId: BASE_ECHO_OJO_OMNISCIENTE,
  name: "Ojo Omnisciente",
  level: 1,
  description: "(Evol. Clarividencia Total) Además, 1/nivel, enfoca pista para <strong>revelar un objeto contribuyente</strong> cercano.",
  icon: "🌟",
  cost: 10,
  effectType: EchoEffectType.RevealNearestItem,
  value: { uses: 1 },
  rarity: Rarity.Legendary,
  awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS
};
