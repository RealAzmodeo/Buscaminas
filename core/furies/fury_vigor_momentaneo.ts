import { FuryAbility, FuryAbilityEffectType, Rarity } from '../../types';

export const furyVigorMomentaneo: FuryAbility = {
  id: 'fury_vigor_momentaneo',
  name: "Vigor Momentáneo",
  description: "Enemigo recupera <strong>3 HP</strong>.",
  icon: "💪❤️",
  effectType: FuryAbilityEffectType.EnemyHeal,
  value: 3,
  rarity: Rarity.Common
};
