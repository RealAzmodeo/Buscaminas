import { FuryAbility, FuryAbilityEffectType, Rarity } from '../../types';

export const furyImpuestoSombrioInitial: FuryAbility = {
  id: 'fury_impuesto_sombrio_initial',
  name: "Impuesto Sombrío",
  description: "Jugador pierde <strong>1 Oro</strong>.",
  icon: "💸",
  effectType: FuryAbilityEffectType.PlayerGoldLoss,
  value: 1,
  rarity: Rarity.Common
};
