import { MirrorUpgradeDefinition, MirrorUpgradeId } from "../../../types";
import { INITIAL_MAX_SOUL_FRAGMENTS as IMSF } from "../../../constants";

const mirrorAfinidadAlmica: MirrorUpgradeDefinition = {
  id: MirrorUpgradeId.AfinidadAlmica,
  name: "Afinidad Álmica",
  icon: "🔮✨",
  maxLevel: 3,
  descriptionTemplate: (value) =>
    `Tu cap. máx. de Fragmentos de Alma aumenta en +${value}. Base: ${IMSF}.`,
  appliesTo: "playerMaxSoulFragments",
  levels: [
    {
      level: 1,
      cost: 100,
      effectValue: 20,
      description: `Aumenta cap. Fragmentos en +20 (Total: ${IMSF + 20})`,
    },
    {
      level: 2,
      cost: 150,
      effectValue: 50,
      description: `Aumenta cap. Fragmentos en +50 adicional (Total: ${IMSF + 20 + 50})`,
    },
    {
      level: 3,
      cost: 250,
      effectValue: 100,
      description: `Aumenta cap. Fragmentos en +100 adicional (Total: ${IMSF + 20 + 50 + 100})`,
    },
  ],
};

export default mirrorAfinidadAlmica;
