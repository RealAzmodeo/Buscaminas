import { Echo, EchoEffectType, Rarity } from "../../types";
import {
  BASE_ECHO_TORRENTE_ACERO,
  ECO_UNLOCK_AWAKENING_POINTS,
} from "../../constants";

const eco_torrente_acero_1: Echo = {
  id: "eco_torrente_acero_1",
  baseId: BASE_ECHO_TORRENTE_ACERO,
  name: "Torrente de Impactos",
  level: 1,
  description:
    "(Evol. Maestría Impacto) Combo de Ataques a <strong>3</strong>, daño incremental. 3 Ataques seguidos <strong>reducen Furia enemiga</strong>.",
  icon: "💨💥+",
  cost: 6,
  effectType: EchoEffectType.ComboDamageBonus,
  value: { count: 3, bonusIncremental: true, reduceFury: true },
  rarity: Rarity.Epic,
  awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS,
};

export default eco_torrente_acero_1;
