import { FuryAbility, FuryAbilityEffectType, Rarity } from '../../types';

export const furySemillaInoportunaInitial: FuryAbility = {
  id: 'fury_semilla_inoportuna_initial',
  name: "Semilla Inoportuna",
  description: "<strong>1 nueva Casilla de Ataque</strong> aparece en el tablero.",
  icon: "🌱💥",
  effectType: FuryAbilityEffectType.BoardAddAttacks,
  value: 1,
  rarity: Rarity.Common
};
