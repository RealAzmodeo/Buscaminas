import { FuryAbility, FuryAbilityEffectType, Rarity } from '../../types';

export const furyCampoMinadoSubito: FuryAbility = {
  id: 'fury_campo_minado_subito',
  name: "Campo de Ataque Súbito",
  description: "Área de <strong>2x2</strong> es sembrada con <strong>Casillas de Ataque y Oro</strong>.",
  icon: "💥💰",
  effectType: FuryAbilityEffectType.BoardAddMixedItems,
  value: { area: '2x2', items: ['attack', 'gold'] },
  rarity: Rarity.Epic
};
