import { FuryAbility, FuryAbilityEffectType, Rarity } from '../../types';

export const furyFestinOscuro: FuryAbility = {
  id: 'fury_festin_oscuro',
  name: "Festín Oscuro",
  description: "Enemigo recupera <strong>5 HP</strong> y su Furia se carga un <strong>25%</strong>.",
  icon: "🍽️👿",
  effectType: FuryAbilityEffectType.EnemyHealAndFuryCharge,
  value: { heal: 5, furyChargePercent: 0.25 },
  rarity: Rarity.Epic
};
