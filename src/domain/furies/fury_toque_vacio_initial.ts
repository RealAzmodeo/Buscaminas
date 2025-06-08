import { FuryAbility, FuryAbilityEffectType, Rarity } from "../../types";

const fury_toque_vacio_initial: FuryAbility = {
  id: "fury_toque_vacio_initial",
  name: "Toque del Vacío",
  description: "Jugador pierde <strong>1 HP</strong>.",
  icon: "💔",
  effectType: FuryAbilityEffectType.PlayerDamage,
  value: 1,
  rarity: Rarity.Common,
};

export default fury_toque_vacio_initial;
