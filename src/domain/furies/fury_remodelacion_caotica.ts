import { FuryAbility, FuryAbilityEffectType, Rarity } from '../../types';

const fury_remodelacion_caotica: FuryAbility = {
  id: 'fury_remodelacion_caotica',
  name: "Remodelación Caótica",
  description: "Una <strong>cuarta parte</strong> del tablero se re-oculta y su contenido se <strong>regenera aleatoriamente</strong>.",
  icon: "🔄",
  effectType: FuryAbilityEffectType.BoardRegenerateSection,
  value: { fraction: 0.25 },
  rarity: Rarity.Legendary
};

export default fury_remodelacion_caotica;
