import { Echo, EchoEffectType, Rarity } from '../../types';
import { BASE_ECHO_VISION_AUREA, ECO_UNLOCK_AWAKENING_POINTS } from '../../constants';

export const ecoVisionAurea1: Echo = {
  id: 'eco_vision_aurea_1',
  baseId: BASE_ECHO_VISION_AUREA,
  name: "Visión Áurea",
  level: 1,
  description: "Pistas discriminan <strong>Oro</strong> (ej: [Oro] / [Resto]).",
  icon: "👁️‍🗨️",
  cost: 2,
  effectType: EchoEffectType.UpdateClueSystem,
  value: 'vision_aurea_oro',
  rarity: Rarity.Common,
  awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS
};
