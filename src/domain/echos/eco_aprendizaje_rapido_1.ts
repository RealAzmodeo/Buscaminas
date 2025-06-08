import { Echo, EchoEffectType, Rarity } from '../../types';
import { BASE_ECHO_APRENDIZAJE_RAPIDO, ECO_UNLOCK_AWAKENING_POINTS } from '../../constants';

const eco_aprendizaje_rapido_1: Echo = {
  id: 'eco_aprendizaje_rapido_1',
  baseId: BASE_ECHO_APRENDIZAJE_RAPIDO,
  name: "Aprendizaje Rápido",
  level: 1,
  description: "La opción de <strong>Eco gratuita</strong> post-nivel es ligeramente mejor.",
  icon: "🧠",
  cost: 3,
  effectType: EchoEffectType.ImproveEchoChoice,
  value: null,
  rarity: Rarity.Common,
  awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS
};

export default eco_aprendizaje_rapido_1;
