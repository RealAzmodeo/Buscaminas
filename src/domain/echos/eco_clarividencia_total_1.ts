import { Echo, EchoEffectType, Rarity } from '../../types';
import { BASE_ECHO_CLARIVIDENCIA_TOTAL, ECO_UNLOCK_AWAKENING_POINTS } from '../../constants';

const eco_clarividencia_total_1: Echo = {
  id: 'eco_clarividencia_total_1',
  baseId: BASE_ECHO_CLARIVIDENCIA_TOTAL,
  name: "Clarividencia Total",
  level: 1,
  description: "(Req: Visión Áurea & Sentido Amenaza) Pistas muestran desglose: <strong>[Oro] / [Ataque]</strong>.",
  icon: "🔮",
  cost: 6,
  effectType: EchoEffectType.UpdateClueSystem,
  value: 'clarividencia_total_ataque_oro',
  rarity: Rarity.Epic,
  awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS
};

export default eco_clarividencia_total_1;
