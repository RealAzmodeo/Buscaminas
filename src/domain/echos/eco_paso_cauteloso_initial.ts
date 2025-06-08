import { Echo, EchoEffectType, Rarity } from '../../types';
import { ECO_UNLOCK_AWAKENING_POINTS } from '../../constants';

const eco_paso_cauteloso_initial: Echo = {
  id: 'eco_paso_cauteloso_initial',
  baseId: 'base_paso_cauteloso_initial',
  name: "Resguardo Cauteloso",
  level: 1,
  description: "La <strong>primera casilla de Ataque</strong> que te dañe en toda la run inflige <strong>1 de daño menos</strong>.",
  icon: "👣🛡️",
  cost: 1,
  effectType: EchoEffectType.GenericPlaceholder,
  value: 1,
  rarity: Rarity.Common,
  awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS
};

export default eco_paso_cauteloso_initial;
