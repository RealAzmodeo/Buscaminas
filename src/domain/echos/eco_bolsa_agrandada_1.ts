import { Echo, EchoEffectType, Rarity } from "../../types";
import {
  BASE_ECHO_BOLSA_AGRANDADA,
  ECO_UNLOCK_AWAKENING_POINTS,
} from "../../constants";

const eco_bolsa_agrandada_1: Echo = {
  id: "eco_bolsa_agrandada_1",
  baseId: BASE_ECHO_BOLSA_AGRANDADA,
  name: "Bolsa Agrandada",
  level: 1,
  description: "Comienzas cada nivel con <strong>+3 Oro</strong>.",
  icon: "🎒",
  cost: 2,
  effectType: EchoEffectType.StartWithBonusGold,
  value: 3,
  rarity: Rarity.Common,
  awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS,
};

export default eco_bolsa_agrandada_1;
