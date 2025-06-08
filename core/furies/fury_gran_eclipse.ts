import { FuryAbility, FuryAbilityEffectType, Rarity } from '../../types';

export const furyGranEclipse: FuryAbility = {
  id: 'fury_gran_eclipse',
  name: "Gran Eclipse",
  description: "<strong>TODAS las Pistas</strong> reveladas se ocultan.",
  icon: "🌑",
  effectType: FuryAbilityEffectType.BoardHideAllClues,
  value: null,
  rarity: Rarity.Epic
};
