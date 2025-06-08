import { FuryAbility, FuryAbilityEffectType, Rarity } from '../../types';

const fury_nido_peligros: FuryAbility = {
  id: 'fury_nido_peligros',
  name: "Nido de Peligros",
  description: "<strong>2-3 nuevas Casillas de Ataque</strong> aparecen.",
  icon: "🥚💥",
  effectType: FuryAbilityEffectType.BoardAddAttacks,
  value: {min: 2, max: 3},
  rarity: Rarity.Rare
};

export default fury_nido_peligros;
