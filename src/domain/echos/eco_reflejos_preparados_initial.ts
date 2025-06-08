import { Echo, EchoEffectType, Rarity } from "../../types";
import { ECO_UNLOCK_AWAKENING_POINTS } from "../../constants";

const eco_reflejos_preparados_initial: Echo = {
  id: "eco_reflejos_preparados_initial",
  baseId: "base_reflejos_preparados_initial",
  name: "Reflejos Preparados",
  level: 1,
  description:
    "La <strong>primera vez</strong> que la barra de Furia del enemigo se llena en un nivel, tarda un <strong>20% más de clics</strong> en llenarse.",
  icon: "⏳🔥",
  cost: 2,
  effectType: EchoEffectType.GenericPlaceholder,
  value: 0.2,
  rarity: Rarity.Common,
  awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS,
};

export default eco_reflejos_preparados_initial;
