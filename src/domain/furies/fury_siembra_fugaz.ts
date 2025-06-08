import { FuryAbility, FuryAbilityEffectType, Rarity } from "../../types";

const fury_siembra_fugaz: FuryAbility = {
  id: "fury_siembra_fugaz",
  name: "Siembra Fugaz",
  description:
    "<strong>1 nueva Casilla de Ataque</strong> aparece en el tablero.",
  icon: "🌱💥",
  effectType: FuryAbilityEffectType.BoardAddAttacks,
  value: 1,
  rarity: Rarity.Common,
};

export default fury_siembra_fugaz;
