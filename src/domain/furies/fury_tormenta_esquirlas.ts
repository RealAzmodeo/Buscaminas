import { FuryAbility, FuryAbilityEffectType, Rarity } from '../../types';

const fury_tormenta_esquirlas: FuryAbility = {
  id: 'fury_tormenta_esquirlas',
  name: "Tormenta de Esquirlas",
  description: "Jugador pierde <strong>2 HP</strong> y <strong>5 Oro</strong>.",
  icon: "🌪️",
  effectType: FuryAbilityEffectType.PlayerDamageAndGoldLoss,
  value: { hp: 2, gold: 5 },
  rarity: Rarity.Epic
};

export default fury_tormenta_esquirlas;
