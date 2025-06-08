import { Echo, EchoEffectType, Rarity } from '../../types';
import { BASE_ECHO_INSTINTO_BUSCADOR, ECO_UNLOCK_AWAKENING_POINTS } from '../../constants';

export const ecoInstintoBuscador1: Echo = {
  id: 'eco_instinto_buscador_1',
  baseId: BASE_ECHO_INSTINTO_BUSCADOR,
  name: "Instinto del Buscador",
  level: 1,
  description: "Pequeña prob. (<strong>10%</strong>) que una casilla de Oro contenga <strong>doble valor</strong>.",
  icon: "💎",
  cost: 4,
  effectType: EchoEffectType.DoubleGoldChance,
  value: 0.10,
  rarity: Rarity.Rare,
  awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS
};
