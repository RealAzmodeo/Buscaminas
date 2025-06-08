import { FuryAbility, FuryAbilityEffectType, Rarity } from '../../types';

export const furyAlientoAniquilador: FuryAbility = {
  id: 'fury_aliento_aniquilador',
  name: "Aliento Aniquilador",
  description: "Jugador pierde <strong>33%</strong> de su <strong>HP MÁXIMO</strong> actual.",
  icon: "💀",
  effectType: FuryAbilityEffectType.PlayerPercentMaxHpDamage,
  value: 0.33,
  rarity: Rarity.Legendary
};
