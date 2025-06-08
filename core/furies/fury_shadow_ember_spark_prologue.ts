import { FuryAbility, FuryAbilityEffectType, Rarity } from '../../types';

export const furyShadowEmberSparkPrologue: FuryAbility = {
  id: 'fury_shadow_ember_spark_prologue',
  name: "Chispa Agónica",
  description: "Un breve espasmo de energía te roza. Pierdes <strong>1 HP</strong>.",
  icon: '💥',
  effectType: FuryAbilityEffectType.PlayerDamage,
  value: 1,
  rarity: Rarity.Common,
};
