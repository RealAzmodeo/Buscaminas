import { Echo, EchoEffectType, Rarity } from "../../types";

const eco_sentido_alerta_initial: Echo = {
  id: "eco_sentido_alerta_initial",
  baseId: "base_sentido_alerta_initial",
  name: "Sentido Alerta",
  level: 1,
  description:
    "Casillas con cualquier objeto (Ataque, Oro) emiten un <strong>aura visual muy sutil</strong> al pasar el cursor cerca (no discrimina tipo).",
  icon: "🔔",
  cost: 0,
  isFree: true,
  effectType: EchoEffectType.GenericPlaceholder,
  rarity: Rarity.Common,
};

export default eco_sentido_alerta_initial;
