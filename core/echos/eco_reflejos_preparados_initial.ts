import { Echo, EchoEffectType, Rarity } from '../../types';
import { ECO_UNLOCK_AWAKENING_POINTS } from '../../constants';

export const ecoReflejosPreparadosInitial: Echo = {
  id: 'eco_reflejos_preparados_initial',
  baseId: 'base_reflejos_preparados_initial',
  name: "Reflejos Preparados",
  level: 1,
  description: "La <strong>primera vez</strong> que la barra de Furia del enemigo se llena en un nivel, tarda un <strong>20% más de clics</strong> en llenarse.",
  icon: "⏳🔥",
  cost: 2,
  effectType: EchoEffectType.GenericPlaceholder, // Note: Original uses GenericPlaceholder
  value: 0.20,
  rarity: Rarity.Common,
  awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS
};
