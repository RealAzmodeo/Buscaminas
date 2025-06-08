import { Echo, EchoEffectType, Rarity } from "../../types";
import { BASE_ECHO_RECOVER_HP } from "../../constants";

const eco_recover_hp_free_standard: Echo = {
  id: "eco_recover_hp_free_standard",
  baseId: BASE_ECHO_RECOVER_HP,
  name: "Alivio Fugaz Estándar",
  level: 1,
  description: "Restaura <strong>2 HP</strong>. Un respiro en la oscuridad.",
  icon: "💖",
  cost: 0,
  isFree: true,
  effectType: EchoEffectType.GainHP,
  value: 2,
  rarity: Rarity.Common,
};

export default eco_recover_hp_free_standard;
