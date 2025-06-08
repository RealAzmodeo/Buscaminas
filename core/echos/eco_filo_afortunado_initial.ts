import { Echo, EchoEffectType, Rarity } from '../../types';
import { ECO_UNLOCK_AWAKENING_POINTS } from '../../constants';

export const ecoFiloAfortunadoInitial: Echo = {
  id: 'eco_filo_afortunado_initial',
  baseId: 'base_filo_afortunado_initial',
  name: "Impacto Afortunado",
  level: 1,
  description: "La <strong>primera casilla de Ataque</strong> revelada por ti en cada nivel tiene un <strong>50%</strong> de probabilidad de infligir <strong>+1 daño</strong>.",
  icon: "🍀💥",
  cost: 1,
  effectType: EchoEffectType.GenericPlaceholder, // Note: Original uses GenericPlaceholder
  value: { chance: 0.5, bonus: 1 },
  rarity: Rarity.Common,
  awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS
};
