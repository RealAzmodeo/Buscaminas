import { FuryAbility, FuryAbilityEffectType, Rarity } from "../../types";

const fury_impacto_menor: FuryAbility = {
  id: "fury_impacto_menor",
  name: "Impacto Menor",
  description: "Jugador pierde <strong>1 HP</strong>.",
  icon: "💥",
  effectType: FuryAbilityEffectType.PlayerDamage,
  value: 1,
  rarity: Rarity.Common,
};

export default fury_impacto_menor;
