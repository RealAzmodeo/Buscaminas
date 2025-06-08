import { Echo, EchoEffectType, Rarity } from '../../types';
import { ECO_UNLOCK_AWAKENING_POINTS } from '../../constants';

const eco_monedero_iniciado_initial: Echo = {
  id: 'eco_monedero_iniciado_initial',
  baseId: 'base_monedero_iniciado_initial',
  name: "Monedero de Iniciado",
  level: 1,
  description: "Ganas <strong>+3 Oro</strong> al completar el nivel actual.",
  icon: "💰✨",
  cost: 1,
  effectType: EchoEffectType.GenericPlaceholder,
  value: 3,
  rarity: Rarity.Common,
  awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS
};

export default eco_monedero_iniciado_initial;
