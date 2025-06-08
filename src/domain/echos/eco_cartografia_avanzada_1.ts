import { Echo, EchoEffectType, Rarity } from "../../types";
import {
  BASE_ECHO_CARTOGRAFIA_AVANZADA,
  ECO_UNLOCK_AWAKENING_POINTS,
} from "../../constants";

const eco_cartografia_avanzada_1: Echo = {
  id: "eco_cartografia_avanzada_1",
  baseId: BASE_ECHO_CARTOGRAFIA_AVANZADA,
  name: "Cartografía Avanzada",
  level: 1,
  description:
    "(Evolución) Permite <strong>marcadores específicos</strong> (Ataque Peligroso, Ataque Ventajoso, Oro, ?). Marcados incorrectamente <strong>no se pueden clickar</strong> por <strong>3 clics</strong>.",
  icon: "🗺️",
  cost: 5,
  effectType: EchoEffectType.EnableCellMarking,
  value: {
    types: ["bomb", "sword", "gold", "question"],
    lockIncorrectDuration: 3,
  },
  rarity: Rarity.Epic,
  awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS,
};

export default eco_cartografia_avanzada_1;
