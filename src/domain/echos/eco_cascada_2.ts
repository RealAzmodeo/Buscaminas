import { Echo, EchoEffectType, Rarity } from '../../types';
import { BASE_ECHO_ECO_CASCADA, ECO_UNLOCK_AWAKENING_POINTS } from '../../constants';

const eco_cascada_2: Echo = {
  id: 'eco_cascada_2',
  baseId: BASE_ECHO_ECO_CASCADA,
  name: "Eco de Cascada",
  level: 2,
  description: "(Evolución) Cascada se extiende <strong>2 anillos</strong>.",
  icon: "🌊🌊",
  cost: 4,
  effectType: EchoEffectType.CascadeReveal,
  value: 2,
  rarity: Rarity.Rare,
  awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS
};

export default eco_cascada_2;
