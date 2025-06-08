import { Echo, EchoEffectType, Rarity } from '../../types';
import { BASE_ECHO_PIEL_PIEDRA, ECO_UNLOCK_AWAKENING_POINTS } from '../../constants';

const eco_piel_piedra_1: Echo = {
  id: 'eco_piel_piedra_1',
  baseId: BASE_ECHO_PIEL_PIEDRA,
  name: "Piel de Piedra",
  level: 1,
  description: "Reduce el daño de la <strong>primera casilla de Ataque (daño enemigo)</strong> sufrida en cada nivel en <strong>1</strong>.",
  icon: "🛡️",
  cost: 4,
  effectType: EchoEffectType.FirstBombDamageReduction,
  value: 1,
  rarity: Rarity.Rare,
  awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS
};

export default eco_piel_piedra_1;
