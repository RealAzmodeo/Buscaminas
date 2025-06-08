import { Echo, EchoEffectType, Rarity } from '../../types';
import { BASE_ECHO_VISION_AUREA, ECO_UNLOCK_AWAKENING_POINTS } from '../../constants';

export const ecoVisionAurea2: Echo = {
  id: 'eco_vision_aurea_2',
  baseId: BASE_ECHO_VISION_AUREA,
  name: "Visión Áurea",
  level: 2,
  description: "(Evolución) Pistas discriminan <strong>Oro</strong> y revelan la <strong>cantidad de Oro</strong> en casillas adyacentes ocultas.",
  icon: "👁️‍🗨️✨",
  cost: 4,
  effectType: EchoEffectType.UpdateClueSystem,
  value: 'vision_aurea_oro_cantidad',
  rarity: Rarity.Rare,
  awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS
};
