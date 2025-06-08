import { FuryAbility, FuryAbilityEffectType, Rarity } from '../../types';

const fury_resistencia_impia: FuryAbility = {
  id: 'fury_resistencia_impia',
  name: "Resistencia Impía",
  description: "Enemigo gana <strong>5 Armadura</strong> temporal.",
  icon: "🛡️👿",
  effectType: FuryAbilityEffectType.EnemyGainArmor,
  value: 5,
  rarity: Rarity.Rare
};

export default fury_resistencia_impia;
