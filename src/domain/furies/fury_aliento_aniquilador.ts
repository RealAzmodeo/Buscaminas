import { FuryAbility, FuryAbilityEffectType, Rarity } from '../../types';

const fury_aliento_aniquilador: FuryAbility = {
  id: 'fury_aliento_aniquilador',
  name: "Aliento Aniquilador",
  description: "Jugador pierde <strong>33%</strong> de su <strong>HP MÁXIMO</strong> actual.",
  icon: "💀",
  effectType: FuryAbilityEffectType.PlayerPercentMaxHpDamage,
  value: 0.33,
  rarity: Rarity.Legendary
};

export default fury_aliento_aniquilador;
