import { Echo, EchoEffectType, Rarity } from '../../types';
import { BASE_ECHO_CORAZON_ABISMO, ECO_UNLOCK_AWAKENING_POINTS } from '../../constants';

export const ecoCorazonAbismo1: Echo = {
  id: 'eco_corazon_abismo_1',
  baseId: BASE_ECHO_CORAZON_ABISMO,
  name: "Corazón del Abismo",
  level: 1,
  description: "1/run: sacrifica <strong>50% HP actual</strong> por <strong>Eco Épico aleatorio</strong> o <strong>duplicar efecto de Eco C/R</strong>.",
  icon: "🌀",
  cost: 10,
  effectType: EchoEffectType.SacrificeHpForPower,
  value: null,
  rarity: Rarity.Legendary,
  awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS
};
