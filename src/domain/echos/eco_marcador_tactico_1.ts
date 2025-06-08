import { Echo, EchoEffectType, Rarity } from '../../types';
import { BASE_ECHO_MARCADOR_TACTICO, ECO_UNLOCK_AWAKENING_POINTS } from '../../constants';

const eco_marcador_tactico_1: Echo = {
  id: 'eco_marcador_tactico_1',
  baseId: BASE_ECHO_MARCADOR_TACTICO,
  name: "Marcador Táctico",
  level: 1,
  description: "Permite marcar casillas con una <strong>bandera genérica</strong>.",
  icon: "🚩",
  cost: 3,
  effectType: EchoEffectType.EnableCellMarking,
  value: 'generic_flag',
  rarity: Rarity.Rare,
  awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS
};

export default eco_marcador_tactico_1;
