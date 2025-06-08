import { Echo, EchoEffectType, Rarity } from '../../types';
import { BASE_ECHO_ALQUIMIA_IMPROVISADA, ECO_UNLOCK_AWAKENING_POINTS } from '../../constants';

export const ecoAlquimiaImprovisada1: Echo = {
  id: 'eco_alquimia_improvisada_1',
  baseId: BASE_ECHO_ALQUIMIA_IMPROVISADA,
  name: "Alquimia Improvisada",
  level: 1,
  description: "Gasta <strong>5 Oro</strong> para <strong>ignorar el daño</strong> de la próxima casilla de Ataque revelada por enemigo (1/nivel, manual).",
  icon: "🧪",
  cost: 5,
  effectType: EchoEffectType.SpendGoldIgnoreBomb, // Keeping as per source
  value: 5,
  rarity: Rarity.Epic,
  awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS
};
