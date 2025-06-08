import { Echo, EchoEffectType, Rarity } from '../../types';
import { BASE_ECHO_RECOVER_HP } from '../../constants';

const eco_recover_hp_free_1: Echo = {
  id: 'eco_recover_hp_free_1',
  baseId: BASE_ECHO_RECOVER_HP,
  name: "Alivio Fugaz",
  level: 1,
  description: "Restaura <strong>1 HP</strong>. Un respiro en la oscuridad.",
  icon: "💖",
  cost: 0,
  isFree: true,
  effectType: EchoEffectType.GainHP,
  value: 1,
  rarity: Rarity.Common
};

export default eco_recover_hp_free_1;
