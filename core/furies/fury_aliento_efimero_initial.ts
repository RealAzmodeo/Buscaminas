import { FuryAbility, FuryAbilityEffectType, Rarity } from '../../types';

export const furyAlientoEfimeroInitial: FuryAbility = {
  id: 'fury_aliento_efimero_initial',
  name: "Aliento Efímero",
  description: "Enemigo recupera <strong>1 HP</strong>.",
  icon: "😮‍💨❤️",
  effectType: FuryAbilityEffectType.EnemyHeal,
  value: 1,
  rarity: Rarity.Common
};
