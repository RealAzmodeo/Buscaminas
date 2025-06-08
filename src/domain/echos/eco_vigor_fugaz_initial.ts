import { Echo, EchoEffectType, Rarity } from '../../types';
import { ECO_UNLOCK_AWAKENING_POINTS } from '../../constants';

const eco_vigor_fugaz_initial: Echo = {
  id: 'eco_vigor_fugaz_initial',
  baseId: 'base_vigor_fugaz_initial',
  name: "Vigor Fugaz",
  level: 1,
  description: "<strong>+1 HP Máximo</strong> para la run actual.",
  icon: "💓",
  cost: 1,
  effectType: EchoEffectType.IncreaseMaxHP,
  value: 1,
  rarity: Rarity.Common,
  awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS
};

export default eco_vigor_fugaz_initial;
