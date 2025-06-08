import { FuryAbility, FuryAbilityEffectType, Rarity } from '../../types';

const fury_festin_oscuro: FuryAbility = {
  id: 'fury_festin_oscuro',
  name: "Festín Oscuro",
  description: "Enemigo recupera <strong>5 HP</strong> y su Furia se carga un <strong>25%</strong>.",
  icon: "🍽️👿",
  effectType: FuryAbilityEffectType.EnemyHealAndFuryCharge,
  value: { heal: 5, furyChargePercent: 0.25 },
  rarity: Rarity.Epic
};

export default fury_festin_oscuro;
