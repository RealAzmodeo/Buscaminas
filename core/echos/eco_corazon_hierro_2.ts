import { Echo, EchoEffectType, Rarity } from '../../types';
import { BASE_ECHO_CORAZON_HIERRO, ECO_UNLOCK_AWAKENING_POINTS } from '../../constants';

export const ecoCorazonHierro2: Echo = {
  id: 'eco_corazon_hierro_2',
  baseId: BASE_ECHO_CORAZON_HIERRO,
  name: "Corazón de Hierro",
  level: 2,
  description: "<strong>+3 HP Máximo</strong> y te cura esa cantidad.",
  icon: "❤️‍🩹+",
  cost: 5,
  effectType: EchoEffectType.IncreaseMaxHP,
  value: 3,
  rarity: Rarity.Rare,
  awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS
};
