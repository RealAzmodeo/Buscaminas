import { FuryAbility, FuryAbilityEffectType, Rarity } from '../../types';

export const furyTormentaEsquirlas: FuryAbility = {
  id: 'fury_tormenta_esquirlas',
  name: "Tormenta de Esquirlas",
  description: "Jugador pierde <strong>2 HP</strong> y <strong>5 Oro</strong>.",
  icon: "🌪️",
  effectType: FuryAbilityEffectType.PlayerDamageAndGoldLoss,
  value: { hp: 2, gold: 5 },
  rarity: Rarity.Epic
};
