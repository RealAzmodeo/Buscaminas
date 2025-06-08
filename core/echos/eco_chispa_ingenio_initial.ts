import { Echo, EchoEffectType, Rarity } from '../../types';
import { ECO_UNLOCK_AWAKENING_POINTS } from '../../constants';

export const ecoChispaIngenioInitial: Echo = {
  id: 'eco_chispa_ingenio_initial',
  baseId: 'base_chispa_ingenio_initial',
  name: "Chispa de Ingenio",
  level: 1,
  description: "El coste en Oro del <strong>próximo Eco que compres se reduce en 1</strong> (coste mínimo 1). Se consume al usarlo.",
  icon: "💡💰",
  cost: 2,
  effectType: EchoEffectType.GenericPlaceholder, // Note: Original uses GenericPlaceholder
  value: 1,
  rarity: Rarity.Common,
  awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS
};
