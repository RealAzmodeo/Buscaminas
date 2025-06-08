import { MirrorUpgradeDefinition, MirrorUpgradeId } from "../../../types";

const mirrorResguardoEfimero: MirrorUpgradeDefinition = {
  id: MirrorUpgradeId.ResguardoEfimero,
  name: "Resguardo Efímero",
  icon: "🛡️💫",
  maxLevel: 3,
  descriptionTemplate: (value) =>
    `Comienzas cada run con ${value} punto(s) de Escudo.`,
  appliesTo: "playerStartShield",
  levels: [
    {
      level: 1,
      cost: 60,
      effectValue: 1,
      description: "Comienzas con 1 Escudo.",
    },
    {
      level: 2,
      cost: 110,
      effectValue: 1,
      description: "Comienzas con 2 Escudos (total).",
    },
    {
      level: 3,
      cost: 170,
      effectValue: 1,
      description: "Comienzas con 3 Escudos (total).",
    },
  ],
};

export default mirrorResguardoEfimero;
