import { FuryAbility, FuryAbilityEffectType, Rarity } from "../../types";

const fury_eco_distorsionado_menor_initial: FuryAbility = {
  id: "fury_eco_distorsionado_menor_initial",
  name: "Eco Distorsionado Menor",
  description:
    "<strong>25%</strong> prob. de que el Eco más reciente del jugador se desactive por <strong>2 clics</strong>. Si no hay Ecos, no pasa nada.",
  icon: "🎶🚫",
  effectType: FuryAbilityEffectType.PlayerTemporaryEcoDeactivation,
  value: { chance: 0.25, duration: 2 },
  rarity: Rarity.Common,
};

export default fury_eco_distorsionado_menor_initial;
