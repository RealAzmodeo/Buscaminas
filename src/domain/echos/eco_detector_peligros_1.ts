import { Echo, EchoEffectType, Rarity } from '../../types';
import { BASE_ECHO_DETECTOR_PELIGROS, ECO_UNLOCK_AWAKENING_POINTS } from '../../constants';

const eco_detector_peligros_1: Echo = {
  id: 'eco_detector_peligros_1',
  baseId: BASE_ECHO_DETECTOR_PELIGROS,
  name: "Sentido de Amenaza",
  level: 1,
  description: "Pistas discriminan <strong>Ataque</strong> (ej: [Ataque] / [Resto]).",
  icon: "⚠️",
  cost: 2,
  effectType: EchoEffectType.UpdateClueSystem,
  value: 'detector_amenaza_ataque',
  rarity: Rarity.Common,
  awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS
};

export default eco_detector_peligros_1;
