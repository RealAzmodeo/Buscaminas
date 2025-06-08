import { FuryAbility, FuryAbilityEffectType, Rarity } from '../../types';

const fury_rescoldo_persistente_initial: FuryAbility = {
  id: 'fury_rescoldo_persistente_initial',
  name: "Rescoldo Persistente",
  description: "La barra de Furia del enemigo se llena un <strong>10%</strong> automáticamente para la próxima activación.",
  icon: "♨️",
  effectType: FuryAbilityEffectType.EnemyFuryBarPartialFill,
  value: 0.10,
  rarity: Rarity.Common
};

export default fury_rescoldo_persistente_initial;
