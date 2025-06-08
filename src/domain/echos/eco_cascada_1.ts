import { Echo, EchoEffectType, Rarity } from "../../types";
import {
  BASE_ECHO_ECO_CASCADA,
  ECO_UNLOCK_AWAKENING_POINTS,
} from "../../constants";

const eco_cascada_1: Echo = {
  id: "eco_cascada_1",
  baseId: BASE_ECHO_ECO_CASCADA,
  name: "Eco de Cascada",
  level: 1,
  description:
    "Casillas '<strong>0</strong>' revelan adyacentes (<strong>1 anillo</strong>).",
  icon: "🌊",
  cost: 2,
  effectType: EchoEffectType.CascadeReveal,
  value: 1,
  rarity: Rarity.Common,
  awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS,
};

export default eco_cascada_1;
