import { MirrorUpgradeDefinition, MirrorUpgradeId } from "../../../types";

const mirrorVigorPrimordial: MirrorUpgradeDefinition = {
  id: MirrorUpgradeId.VigorPrimordial,
  name: "Vigor Primordial",
  icon: "❤️‍🔥",
  maxLevel: 3,
  descriptionTemplate: (value) => `Comienzas con +${value} HP Máx.`,
  appliesTo: "playerMaxHp",
  levels: [
    {
      level: 1,
      cost: 50,
      effectValue: 1,
      description: "Comienzas con +1 HP Máx.",
    },
    {
      level: 2,
      cost: 100,
      effectValue: 1,
      description: "Comienzas con +2 HP Máx. (total)",
    },
    {
      level: 3,
      cost: 150,
      effectValue: 1,
      description: "Comienzas con +3 HP Máx. (total)",
    },
  ],
};

export default mirrorVigorPrimordial;
