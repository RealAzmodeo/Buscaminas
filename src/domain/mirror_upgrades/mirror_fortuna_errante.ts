import { MirrorUpgradeDefinition, MirrorUpgradeId } from "../../../types";

const mirrorFortunaErrante: MirrorUpgradeDefinition = {
  id: MirrorUpgradeId.FortunaErrante,
  name: "Fortuna del Errante",
  icon: "💰🍀",
  maxLevel: 3,
  descriptionTemplate: (value) => `Comienzas cada run con +${value} Oro.`,
  appliesTo: "playerStartGold",
  levels: [
    {
      level: 1,
      cost: 40,
      effectValue: 2,
      description: "Comienzas con +2 Oro.",
    },
    {
      level: 2,
      cost: 80,
      effectValue: 2,
      description: "Comienzas con +4 Oro (total).",
    },
    {
      level: 3,
      cost: 120,
      effectValue: 2,
      description: "Comienzas con +6 Oro (total).",
    },
  ],
};

export default mirrorFortunaErrante;
