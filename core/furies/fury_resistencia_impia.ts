import { FuryAbility, FuryAbilityEffectType, Rarity } from '../../types';

export const furyResistenciaImpia: FuryAbility = {
  id: 'fury_resistencia_impia',
  name: "Resistencia Impía",
  description: "Enemigo gana <strong>5 Armadura</strong> temporal.",
  icon: "🛡️👿",
  effectType: FuryAbilityEffectType.EnemyGainArmor,
  value: 5,
  rarity: Rarity.Rare
};
