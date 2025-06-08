import { FuryAbility, FuryAbilityEffectType, Rarity } from '../../types';

export const furyNidoPeligros: FuryAbility = {
  id: 'fury_nido_peligros',
  name: "Nido de Peligros",
  description: "<strong>2-3 nuevas Casillas de Ataque</strong> aparecen.",
  icon: "🥚💥",
  effectType: FuryAbilityEffectType.BoardAddAttacks,
  value: {min: 2, max: 3},
  rarity: Rarity.Rare
};
