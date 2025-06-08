import { FuryAbility, FuryAbilityEffectType, Rarity } from '../../types';

export const furyVeloMomentaneoInitial: FuryAbility = {
  id: 'fury_velo_momentaneo_initial',
  name: "Velo Momentáneo",
  description: "<strong>1 Pista</strong> revelada se oculta.",
  icon: "💨❓",
  effectType: FuryAbilityEffectType.BoardHideClues,
  value: 1,
  rarity: Rarity.Common
};
