import { Echo, EchoEffectType, Rarity } from '../../types';
import { BASE_ECHO_ECO_CASCADA, ECO_UNLOCK_AWAKENING_POINTS } from '../../constants';

const eco_cascada_3: Echo = {
  id: 'eco_cascada_3',
  baseId: BASE_ECHO_ECO_CASCADA,
  name: "Eco de Cascada",
  level: 3,
  description: "(Evolución) Cascada se extiende <strong>3 anillos</strong> y tiene baja prob. de <strong>no activar casilla de Ataque</strong>.",
  icon: "🌊🌊🌊",
  cost: 7,
  effectType: EchoEffectType.CascadeReveal,
  value: { depth: 3, disarmChance: 0.15 },
  rarity: Rarity.Epic,
  awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS
};

export default eco_cascada_3;
