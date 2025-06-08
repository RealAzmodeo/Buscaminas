import { FuryAbility, FuryAbilityEffectType, Rarity } from "../../types";

const fury_impuesto_sombrio_initial: FuryAbility = {
  id: "fury_impuesto_sombrio_initial",
  name: "Impuesto Sombrío",
  description: "Jugador pierde <strong>1 Oro</strong>.",
  icon: "💸",
  effectType: FuryAbilityEffectType.PlayerGoldLoss,
  value: 1,
  rarity: Rarity.Common,
};

export default fury_impuesto_sombrio_initial;
