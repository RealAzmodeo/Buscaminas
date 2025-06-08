import { FuryAbility, FuryAbilityEffectType, Rarity } from "../../types";

const fury_aliento_efimero_initial: FuryAbility = {
  id: "fury_aliento_efimero_initial",
  name: "Aliento Efímero",
  description: "Enemigo recupera <strong>1 HP</strong>.",
  icon: "😮‍💨❤️",
  effectType: FuryAbilityEffectType.EnemyHeal,
  value: 1,
  rarity: Rarity.Common,
};

export default fury_aliento_efimero_initial;
