import { FuryAbility, FuryAbilityEffectType, Rarity } from '../../types';

export const furyTorpezaFugazInitial: FuryAbility = {
  id: 'fury_torpeza_fugaz_initial',
  name: "Torpeza Fugaz",
  description: "El próximo Ataque revelado por el jugador tiene un <strong>25%</strong> de probabilidad de fallar (no hacer daño).",
  icon: "💢",
  effectType: FuryAbilityEffectType.PlayerChanceToFailAttack,
  value: 0.25,
  rarity: Rarity.Common
};
