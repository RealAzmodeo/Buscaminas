import { FuryAbility, FuryAbilityEffectType, Rarity } from '../../types';

export const furyToqueVacioInitial: FuryAbility = {
  id: 'fury_toque_vacio_initial',
  name: "Toque del Vacío",
  description: "Jugador pierde <strong>1 HP</strong>.",
  icon: "💔",
  effectType: FuryAbilityEffectType.PlayerDamage,
  value: 1,
  rarity: Rarity.Common
};
