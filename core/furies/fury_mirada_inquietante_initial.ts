import { FuryAbility, FuryAbilityEffectType, Rarity } from '../../types';

export const furyMiradaInquietanteInitial: FuryAbility = {
  id: 'fury_mirada_inquietante_initial',
  name: "Mirada Inquietante",
  description: "Pistas reveladas parpadean o se vuelven borrosas por <strong>2-3 clics</strong> (efecto visual).",
  icon: "👁️‍🗨️💢",
  effectType: FuryAbilityEffectType.BoardVisualDisruption,
  value: { duration: 3 },
  rarity: Rarity.Common
};
