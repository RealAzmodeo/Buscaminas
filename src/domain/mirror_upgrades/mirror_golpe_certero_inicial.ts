import { MirrorUpgradeDefinition, MirrorUpgradeId } from "../../../types";

const mirrorGolpeCerteroInicial: MirrorUpgradeDefinition = {
  id: MirrorUpgradeId.GolpeCerteroInicial,
  name: "Golpe Certero Inicial",
  icon: "🗡️✨",
  maxLevel: 3,
  descriptionTemplate: (value) =>
    `Tu primera Espada revelada en cada nivel hace +${value} de daño.`,
  appliesTo: "playerFirstSwordDamage",
  levels: [
    {
      level: 1,
      cost: 75,
      effectValue: 1,
      description: "Primera Espada +1 daño.",
    },
    {
      level: 2,
      cost: 125,
      effectValue: 1,
      description: "Primera Espada +2 daño (total).",
    },
    {
      level: 3,
      cost: 200,
      effectValue: 1,
      description: "Primera Espada +3 daño (total).",
    },
  ],
};

export default mirrorGolpeCerteroInicial;
