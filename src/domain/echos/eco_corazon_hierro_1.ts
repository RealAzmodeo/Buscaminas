import { Echo, EchoEffectType, Rarity } from "../../types";
import {
  BASE_ECHO_CORAZON_HIERRO,
  ECO_UNLOCK_AWAKENING_POINTS,
} from "../../constants";

const eco_corazon_hierro_1: Echo = {
  id: "eco_corazon_hierro_1",
  baseId: BASE_ECHO_CORAZON_HIERRO,
  name: "Corazón de Hierro",
  level: 1,
  description: "<strong>+2 HP Máximo</strong> y te cura esa cantidad.",
  icon: "❤️‍🩹",
  cost: 3,
  effectType: EchoEffectType.IncreaseMaxHP,
  value: 2,
  rarity: Rarity.Common,
  awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS,
};

export default eco_corazon_hierro_1;
