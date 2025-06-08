import { FuryAbility, FuryAbilityEffectType, Rarity } from '../../types';

const fury_golpe_certero: FuryAbility = {
  id: 'fury_golpe_certero',
  name: "Golpe Certero",
  description: "Jugador pierde <strong>3 HP</strong>.",
  icon: "🎯",
  effectType: FuryAbilityEffectType.PlayerDamage,
  value: 3,
  rarity: Rarity.Rare
};

export default fury_golpe_certero;
