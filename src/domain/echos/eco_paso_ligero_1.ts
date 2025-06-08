import { Echo, EchoEffectType, Rarity } from "../../types";
import {
  BASE_ECHO_PASO_LIGERO,
  ECO_UNLOCK_AWAKENING_POINTS,
} from "../../constants";

const eco_paso_ligero_1: Echo = {
  id: "eco_paso_ligero_1",
  baseId: BASE_ECHO_PASO_LIGERO,
  name: "Paso Ligero",
  level: 1,
  description:
    "La primera <strong>Trampa</strong> revelada en un nivel es ignorada.",
  icon: "👟",
  cost: 4,
  effectType: EchoEffectType.IgnoreFirstTrap,
  value: true,
  rarity: Rarity.Rare,
  awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS,
};

export default eco_paso_ligero_1;
