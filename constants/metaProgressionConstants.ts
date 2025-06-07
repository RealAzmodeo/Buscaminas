
import { MirrorUpgradeDefinition, GoalDefinition, CellType } from '../types';
import { INITIAL_MAX_SOUL_FRAGMENTS as IMSF } from '../constants'; // Import with an alias or directly

export const INITIAL_MAX_SOUL_FRAGMENTS = IMSF; // Re-export

export const MIRROR_UPGRADE_IDS = {
  VIGOR_PRIMORDIAL: 'vigorPrimordial',
  GOLPE_CERTERO_INICIAL: 'golpeCerteroInicial',
  FORTUNA_ERRANTE: 'fortunaErrante',
  RESGUARDO_EFIMERO: 'resguardoEfimero',
  AFINIDAD_ALMICA: 'afinidadAlmica',
};

export const CONFIRMATION_THRESHOLD_LUMENS = 75; // Lumens cost above which a confirmation modal will appear for Mirror upgrades

export const MIRROR_UPGRADES_CONFIG: MirrorUpgradeDefinition[] = [
  {
    id: MIRROR_UPGRADE_IDS.VIGOR_PRIMORDIAL,
    name: "Vigor Primordial",
    icon: "❤️‍🔥",
    maxLevel: 3,
    descriptionTemplate: (value) => `Comienzas con +${value} HP Máx.`,
    appliesTo: 'playerMaxHp',
    levels: [
      { level: 1, cost: 50, effectValue: 1, description: "Comienzas con +1 HP Máx." },
      { level: 2, cost: 100, effectValue: 1, description: "Comienzas con +2 HP Máx. (total)" },
      { level: 3, cost: 150, effectValue: 1, description: "Comienzas con +3 HP Máx. (total)" },
    ],
  },
  {
    id: MIRROR_UPGRADE_IDS.GOLPE_CERTERO_INICIAL,
    name: "Golpe Certero Inicial",
    icon: "🗡️✨",
    maxLevel: 3,
    descriptionTemplate: (value) => `Tu primera Espada revelada en cada nivel hace +${value} de daño.`,
    appliesTo: 'playerFirstSwordDamage',
    levels: [
      { level: 1, cost: 75, effectValue: 1, description: "Primera Espada +1 daño." },
      { level: 2, cost: 125, effectValue: 1, description: "Primera Espada +2 daño (total)." },
      { level: 3, cost: 200, effectValue: 1, description: "Primera Espada +3 daño (total)." },
    ],
  },
  {
    id: MIRROR_UPGRADE_IDS.FORTUNA_ERRANTE,
    name: "Fortuna del Errante",
    icon: "💰🍀",
    maxLevel: 3,
    descriptionTemplate: (value) => `Comienzas cada run con +${value} Oro.`,
    appliesTo: 'playerStartGold',
    levels: [
      { level: 1, cost: 40, effectValue: 2, description: "Comienzas con +2 Oro." },
      { level: 2, cost: 80, effectValue: 2, description: "Comienzas con +4 Oro (total)." },
      { level: 3, cost: 120, effectValue: 2, description: "Comienzas con +6 Oro (total)." },
    ],
  },
  {
    id: MIRROR_UPGRADE_IDS.RESGUARDO_EFIMERO,
    name: "Resguardo Efímero",
    icon: "🛡️💫",
    maxLevel: 3,
    descriptionTemplate: (value) => `Comienzas cada run con ${value} punto(s) de Escudo.`,
    appliesTo: 'playerStartShield',
    levels: [
      { level: 1, cost: 60, effectValue: 1, description: "Comienzas con 1 Escudo." },
      { level: 2, cost: 110, effectValue: 1, description: "Comienzas con 2 Escudos (total)." },
      { level: 3, cost: 170, effectValue: 1, description: "Comienzas con 3 Escudos (total)." },
    ],
  },
  {
    id: MIRROR_UPGRADE_IDS.AFINIDAD_ALMICA,
    name: "Afinidad Álmica",
    icon: "🔮✨",
    maxLevel: 3,
    descriptionTemplate: (value) => `Tu cap. máx. de Fragmentos de Alma aumenta en +${value}. Base: ${INITIAL_MAX_SOUL_FRAGMENTS}.`,
    appliesTo: 'playerMaxSoulFragments',
    levels: [
      { level: 1, cost: 100, effectValue: 20, description: `Aumenta cap. Fragmentos en +20 (Total: ${INITIAL_MAX_SOUL_FRAGMENTS + 20})` },
      { level: 2, cost: 150, effectValue: 50, description: `Aumenta cap. Fragmentos en +50 adicional (Total: ${INITIAL_MAX_SOUL_FRAGMENTS + 20 + 50})` },
      { level: 3, cost: 250, effectValue: 100, description: `Aumenta cap. Fragmentos en +100 adicional (Total: ${INITIAL_MAX_SOUL_FRAGMENTS + 20 + 50 + 100})` },
    ],
  },
];

export const GOAL_IDS = {
  PROLOGUE_COMPLETE: 'prologueComplete',
  FIRST_SANCTUARY_VISIT: 'firstSanctuaryVisit',
  DEFEAT_X_ENEMIES_TIER_1: 'defeatXEnemiesTier1',
  DEFEAT_X_ENEMIES_TIER_2: 'defeatXEnemiesTier2',
  DEFEAT_X_ENEMIES_TIER_3: 'defeatXEnemiesTier3',
  REVEAL_X_CELLS_TIER_1: 'revealXCellsTier1',
  REVEAL_X_CELLS_TIER_2: 'revealXCellsTier2',
  REVEAL_X_GOLD_CELLS_TIER_1: 'revealXGoldCellsTier1',
  REVEAL_X_GOLD_CELLS_TIER_2: 'revealXGoldCellsTier2', // New
  COMPLETE_LEVEL_NO_DAMAGE_TIER_1: 'completeLevelNoDamageTier1',
  COMPLETE_LEVEL_NO_DAMAGE_TIER_2: 'completeLevelNoDamageTier2', // New
  COMPLETE_X_LEVELS_TIER_1: 'completeXLevelsTier1',
  FIRST_ECO_UNLOCKED: 'firstEcoUnlocked', // New
  ACTIVATE_X_UNIQUE_ECOS_TIER_1: 'activateXUniqueEcosTier1', // New
  EXPERIENCE_X_UNIQUE_FURIAS_TIER_1: 'experienceXUniqueFuriasTier1', // New
};

export const GOAL_CATEGORIES = {
  PROGRESS: "Progreso General",
  COMBAT: "Maestría en Combate",
  BOARD: "Dominio del Tablero",
  ECHOS_FURIAS: "Sabiduría de Ecos y Furias", // New
  // Add more categories as needed from GDD: "Desafíos del Abismo"
};


export const INITIAL_GOALS_CONFIG: GoalDefinition[] = [
  {
    id: GOAL_IDS.PROLOGUE_COMPLETE,
    name: "Primeros Pasos",
    description: "Completa el Prólogo.",
    category: GOAL_CATEGORIES.PROGRESS,
    icon: "🏞️",
    rewardLumens: 20,
    targetValue: 1, 
    relevantEventType: 'PROLOGUE_COMPLETED',
  },
  {
    id: GOAL_IDS.FIRST_SANCTUARY_VISIT,
    name: "Refugio Encontrado",
    description: "Visita el Santuario por primera vez.",
    category: GOAL_CATEGORIES.PROGRESS,
    icon: "🌳",
    rewardLumens: 10,
    targetValue: 1,
    relevantEventType: 'SANCTUARY_FIRST_VISIT',
  },
  {
    id: GOAL_IDS.FIRST_ECO_UNLOCKED,
    name: "Eco Primigenio",
    description: "Desbloquea tu primer Eco en el Árbol del Conocimiento.",
    category: GOAL_CATEGORIES.ECHOS_FURIAS,
    icon: "💡🌳",
    rewardLumens: 30,
    targetValue: 1,
    relevantEventType: 'FIRST_ECO_UNLOCKED',
  },
  {
    id: GOAL_IDS.DEFEAT_X_ENEMIES_TIER_1,
    name: "Azote de Sombras (I)",
    description: "Derrota 10 esbirros en total.",
    category: GOAL_CATEGORIES.COMBAT,
    icon: "💀",
    rewardLumens: 25,
    targetValue: 10,
    relevantEventType: 'ENEMY_DEFEATED',
  },
  {
    id: GOAL_IDS.DEFEAT_X_ENEMIES_TIER_2,
    name: "Azote de Sombras (II)",
    description: "Derrota 50 esbirros en total.",
    category: GOAL_CATEGORIES.COMBAT,
    icon: "💀💀",
    rewardLumens: 50,
    targetValue: 50,
    relevantEventType: 'ENEMY_DEFEATED',
    prerequisitesGoalIds: [GOAL_IDS.DEFEAT_X_ENEMIES_TIER_1],
  },
  {
    id: GOAL_IDS.DEFEAT_X_ENEMIES_TIER_3,
    name: "Azote de Sombras (III)",
    description: "Derrota 100 esbirros en total.",
    category: GOAL_CATEGORIES.COMBAT,
    icon: "💀💀💀",
    rewardLumens: 100,
    targetValue: 100,
    relevantEventType: 'ENEMY_DEFEATED',
    prerequisitesGoalIds: [GOAL_IDS.DEFEAT_X_ENEMIES_TIER_2],
  },
  {
    id: GOAL_IDS.REVEAL_X_CELLS_TIER_1,
    name: "Explorador Diligente (I)",
    description: "Revela un total de 100 casillas.",
    category: GOAL_CATEGORIES.BOARD,
    icon: "🗺️",
    rewardLumens: 15,
    targetValue: 100,
    relevantEventType: 'CELL_REVEALED',
  },
  {
    id: GOAL_IDS.REVEAL_X_CELLS_TIER_2,
    name: "Explorador Diligente (II)",
    description: "Revela un total de 500 casillas.",
    category: GOAL_CATEGORIES.BOARD,
    icon: "🗺️🗺️",
    rewardLumens: 40,
    targetValue: 500,
    relevantEventType: 'CELL_REVEALED',
    prerequisitesGoalIds: [GOAL_IDS.REVEAL_X_CELLS_TIER_1],
  },
  {
    id: GOAL_IDS.REVEAL_X_GOLD_CELLS_TIER_1,
    name: "Buscador de Tesoros (I)",
    description: "Revela 25 casillas de Oro.",
    category: GOAL_CATEGORIES.BOARD,
    icon: "💰✨",
    rewardLumens: 30,
    targetValue: 25,
    relevantEventType: 'CELL_REVEALED',
    eventPropertyToCheck: 'cellType',
    eventPropertyValueToMatch: CellType.Gold,
  },
  {
    id: GOAL_IDS.REVEAL_X_GOLD_CELLS_TIER_2,
    name: "Buscador de Tesoros (II)",
    description: "Revela 100 casillas de Oro.",
    category: GOAL_CATEGORIES.BOARD,
    icon: "💰💰✨",
    rewardLumens: 60,
    targetValue: 100,
    relevantEventType: 'CELL_REVEALED',
    eventPropertyToCheck: 'cellType',
    eventPropertyValueToMatch: CellType.Gold,
    prerequisitesGoalIds: [GOAL_IDS.REVEAL_X_GOLD_CELLS_TIER_1],
  },
  {
    id: GOAL_IDS.COMPLETE_LEVEL_NO_DAMAGE_TIER_1,
    name: "Danza Impecable (I)",
    description: "Completa 1 nivel sin recibir daño.",
    category: GOAL_CATEGORIES.COMBAT,
    icon: "💃",
    rewardLumens: 50,
    targetValue: 1,
    relevantEventType: 'LEVEL_COMPLETED_NO_DAMAGE',
    resetsPerRun: false, 
  },
  {
    id: GOAL_IDS.COMPLETE_LEVEL_NO_DAMAGE_TIER_2,
    name: "Danza Impecable (II)",
    description: "Completa 5 niveles sin recibir daño (en total, no necesariamente en una run).",
    category: GOAL_CATEGORIES.COMBAT,
    icon: "💃💃",
    rewardLumens: 100,
    targetValue: 5,
    relevantEventType: 'LEVEL_COMPLETED_NO_DAMAGE',
    resetsPerRun: false,
    prerequisitesGoalIds: [GOAL_IDS.COMPLETE_LEVEL_NO_DAMAGE_TIER_1],
  },
  {
    id: GOAL_IDS.COMPLETE_X_LEVELS_TIER_1,
    name: "Superviviente del Abismo (I)",
    description: "Completa 3 niveles en una misma partida.",
    category: GOAL_CATEGORIES.PROGRESS,
    icon: "🧭",
    rewardLumens: 75,
    targetValue: 3,
    relevantEventType: 'LEVEL_COMPLETED_IN_RUN',
    resetsPerRun: true,
  },
  {
    id: GOAL_IDS.ACTIVATE_X_UNIQUE_ECOS_TIER_1,
    name: "Paleta de Poderes (I)",
    description: "Activa 5 Ecos diferentes (tipos únicos) en una misma partida.",
    category: GOAL_CATEGORIES.ECHOS_FURIAS,
    icon: "🎨🌀",
    rewardLumens: 60,
    targetValue: 5,
    relevantEventType: 'UNIQUE_ECO_ACTIVATED',
    resetsPerRun: true,
  },
  {
    id: GOAL_IDS.EXPERIENCE_X_UNIQUE_FURIAS_TIER_1,
    name: "Confrontador de Calamidades (I)",
    description: "Experimenta 5 Furias diferentes (tipos únicos) en una misma partida.",
    category: GOAL_CATEGORIES.ECHOS_FURIAS,
    icon: "🔥👹",
    rewardLumens: 65,
    targetValue: 5,
    relevantEventType: 'UNIQUE_FURY_EXPERIENCED',
    resetsPerRun: true,
  },
];
