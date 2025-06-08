import { FuryAbility, FuryAbilityEffectType, Rarity } from '../../types';

export const furySombrasPersistentes: FuryAbility = {
  id: 'fury_sombras_persistentes',
  name: "Sombras Persistentes",
  description: "<strong>3 casillas de Pista</strong> reveladas se ocultan.",
  icon: "🕶️",
  effectType: FuryAbilityEffectType.BoardHideClues,
  value: 3,
  rarity: Rarity.Rare
};
