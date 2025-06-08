import { FuryAbility, FuryAbilityEffectType, Rarity } from '../../types';

export const furyImpactoMenor: FuryAbility = {
  id: 'fury_impacto_menor',
  name: "Impacto Menor",
  description: "Jugador pierde <strong>1 HP</strong>.",
  icon: "💥",
  effectType: FuryAbilityEffectType.PlayerDamage,
  value: 1,
  rarity: Rarity.Common
};
