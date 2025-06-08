import { Echo, EchoEffectType, Rarity } from '../../types';
import { BASE_ECHO_VOLUNTAD_INQUEBRANTABLE, ECO_UNLOCK_AWAKENING_POINTS } from '../../constants';

const eco_voluntad_inquebrantable_1: Echo = {
  id: 'eco_voluntad_inquebrantable_1',
  baseId: BASE_ECHO_VOLUNTAD_INQUEBRANTABLE,
  name: "Voluntad Inquebrantable",
  level: 1,
  description: "Efectos de Furia del enemigo (daño, pérdida oro) se reducen un <strong>25%</strong>.",
  icon: "💪",
  cost: 6,
  effectType: EchoEffectType.ReduceFuryEffectPotency,
  value: 0.25,
  rarity: Rarity.Epic,
  awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS
};

export default eco_voluntad_inquebrantable_1;
