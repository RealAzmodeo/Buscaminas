import {
  MirrorUpgradeDefinition,
  GoalDefinition,
  CellType,
  MirrorUpgradeId,
} from "../types";
import { INITIAL_MAX_SOUL_FRAGMENTS as IMSF } from "../constants"; // Import with an alias or directly

// export const INITIAL_MAX_SOUL_FRAGMENTS = IMSF; // Re-export removed

// MIRROR_UPGRADE_IDS object removed, replaced by MirrorUpgradeId enum
// export const MIRROR_UPGRADE_IDS = {
//   VIGOR_PRIMORDIAL: 'vigorPrimordial',
//   GOLPE_CERTERO_INICIAL: 'golpeCerteroInicial',
//   FORTUNA_ERRANTE: 'fortunaErrante',
//   RESGUARDO_EFIMERO: 'resguardoEfimero',
//   AFINIDAD_ALMICA: 'afinidadAlmica',
// };

export const CONFIRMATION_THRESHOLD_LUMENS = 75; // Lumens cost above which a confirmation modal will appear for Mirror upgrades

// Dynamically load all Mirror Upgrades from individual files
// Path relative to constants/metaProgressionConstants.ts to src/domain/mirror_upgrades/
const mirrorUpgradeModules = import.meta.glob(
  "../src/domain/mirror_upgrades/*.ts",
  { eager: true },
);
export const MIRROR_UPGRADES_CONFIG: MirrorUpgradeDefinition[] = Object.values(
  mirrorUpgradeModules,
)
  .map((module: any) => module.default as MirrorUpgradeDefinition)
  .sort((a, b) => {
    // Optional: sort for consistency if needed, e.g., by original order or ID
    const order = Object.values(MirrorUpgradeId); // Assuming MirrorUpgradeId is an enum with string values
    return (
      order.indexOf(a.id as MirrorUpgradeId) -
      order.indexOf(b.id as MirrorUpgradeId)
    );
  });

export const GOAL_IDS = {
  PROLOGUE_COMPLETE: "prologueComplete",
  FIRST_SANCTUARY_VISIT: "firstSanctuaryVisit",
  DEFEAT_X_ENEMIES_TIER_1: "defeatXEnemiesTier1",
  DEFEAT_X_ENEMIES_TIER_2: "defeatXEnemiesTier2",
  DEFEAT_X_ENEMIES_TIER_3: "defeatXEnemiesTier3",
  REVEAL_X_CELLS_TIER_1: "revealXCellsTier1",
  REVEAL_X_CELLS_TIER_2: "revealXCellsTier2",
  REVEAL_X_GOLD_CELLS_TIER_1: "revealXGoldCellsTier1",
  REVEAL_X_GOLD_CELLS_TIER_2: "revealXGoldCellsTier2", // New
  COMPLETE_LEVEL_NO_DAMAGE_TIER_1: "completeLevelNoDamageTier1",
  COMPLETE_LEVEL_NO_DAMAGE_TIER_2: "completeLevelNoDamageTier2", // New
  COMPLETE_X_LEVELS_TIER_1: "completeXLevelsTier1",
  FIRST_ECO_UNLOCKED: "firstEcoUnlocked", // New
  ACTIVATE_X_UNIQUE_ECOS_TIER_1: "activateXUniqueEcosTier1", // New
  EXPERIENCE_X_UNIQUE_FURIAS_TIER_1: "experienceXUniqueFuriasTier1", // New
};

export const GOAL_CATEGORIES = {
  PROGRESS: "Progreso General",
  COMBAT: "Maestría en Combate",
  BOARD: "Dominio del Tablero",
  ECHOS_FURIAS: "Sabiduría de Ecos y Furias", // New
  // Add more categories as needed from GDD: "Desafíos del Abismo"
};

// Dynamically load all Goals from individual files
// Path is relative from `constants/metaProgressionConstants.ts` to `src/domain/goals/`
const goalModules = import.meta.glob("../src/domain/goals/*.ts", {
  eager: true,
});

export const INITIAL_GOALS_CONFIG: GoalDefinition[] = Object.values(goalModules)
  .map((module: any) => module.default as GoalDefinition)
  .sort((a, b) => {
    // Optional: sort for consistency if needed
    const order = Object.values(GOAL_IDS);
    return order.indexOf(a.id) - order.indexOf(b.id);
  });
