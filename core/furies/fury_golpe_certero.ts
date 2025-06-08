import { FuryAbility, FuryAbilityEffectType, Rarity } from '../../types';

export const furyGolpeCertero: FuryAbility = {
  id: 'fury_golpe_certero',
  name: "Golpe Certero",
  description: "Jugador pierde <strong>3 HP</strong>.",
  icon: "🎯",
  effectType: FuryAbilityEffectType.PlayerDamage,
  value: 3,
  rarity: Rarity.Rare
};
