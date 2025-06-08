import { Echo, EchoEffectType, Rarity } from "../../types";
import {
  BASE_ECHO_MAESTRIA_ESTOCADA,
  ECO_UNLOCK_AWAKENING_POINTS,
} from "../../constants";

const eco_maestria_estocada_1: Echo = {
  id: "eco_maestria_estocada_1",
  baseId: BASE_ECHO_MAESTRIA_ESTOCADA,
  name: "Maestría del Impacto",
  level: 1,
  description:
    "Revelar <strong>2 casillas de Ataque</strong> seguidas: la 2ª inflige <strong>+1 daño</strong>.",
  icon: "💨💥",
  cost: 3,
  effectType: EchoEffectType.ComboDamageBonus,
  value: { count: 2, bonus: 1 },
  rarity: Rarity.Rare,
  awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS,
};

export default eco_maestria_estocada_1;
