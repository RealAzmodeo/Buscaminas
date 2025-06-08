import { Echo, EchoEffectType, Rarity } from "../../types";
import {
  BASE_ECHO_VENGANZA_ESPECTRAL,
  ECO_UNLOCK_AWAKENING_POINTS,
} from "../../constants";

const eco_venganza_espectral_1: Echo = {
  id: "eco_venganza_espectral_1",
  baseId: BASE_ECHO_VENGANZA_ESPECTRAL,
  name: "Venganza Espectral",
  level: 1,
  description:
    "Al recibir daño de Ataque, tu próximo Ataque hace <strong>+1 daño</strong> adicional.",
  icon: "👻💥",
  cost: 5,
  effectType: EchoEffectType.TempDamageBuffAfterBomb,
  value: 1,
  rarity: Rarity.Epic,
  awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS,
};

export default eco_venganza_espectral_1;
