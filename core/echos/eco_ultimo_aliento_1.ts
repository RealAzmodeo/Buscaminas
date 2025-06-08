import { Echo, EchoEffectType, Rarity } from '../../types';
import { BASE_ECHO_ULTIMO_ALIENTO, ECO_UNLOCK_AWAKENING_POINTS } from '../../constants';

export const ecoUltimoAliento1: Echo = {
  id: 'eco_ultimo_aliento_1',
  baseId: BASE_ECHO_ULTIMO_ALIENTO,
  name: "Último Aliento",
  level: 1,
  description: "Al llegar a <strong>1 HP</strong> (1 vez/run), ganas <strong>invulnerabilidad por 3 clics</strong> y tus Ataques hacen <strong>daño crítico</strong>.",
  icon: "⏳",
  cost: 8,
  effectType: EchoEffectType.LastStandInvulnerabilityCrit,
  value: { clicks: 3 },
  rarity: Rarity.Legendary,
  awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS
};
