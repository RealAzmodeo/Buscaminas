
/**
 * @file Defines global constants for game balance, initial states, and configurations.
 * This includes board dimensions, player/enemy base stats, item values, Echo/Fury definitions,
 * meta-progression values, and dynamic difficulty parameters.
 */

import { Echo, EchoEffectType, Rarity, EcoTreeNodeData, BoardConfig, BiomeId, EnemyArchetypeId, EnemyArchetypeDefinition, FuryAbility, FuryAbilityEffectType, AIType } from './types';

// --- Board Constants ---
/** Default number of rows for the game board if not specified by level or biome. */
export const BOARD_ROWS = 8;
/** Default number of columns for the game board if not specified by level or biome. */
export const BOARD_COLS = 8;

/** Number of rows for the prologue board. */
export const PROLOGUE_BOARD_ROWS = 6;
/** Number of columns for the prologue board. */
export const PROLOGUE_BOARD_COLS = 6;

// --- Player Initial Stats ---
/** Initial Health Points for the player at the start of a run. */
export const INITIAL_PLAYER_HP = 8;
/** Initial Gold for the player at the start of a run. */
export const INITIAL_PLAYER_GOLD = 0;
/** Initial Shield for the player at the start of a run. */
export const INITIAL_PLAYER_SHIELD = 0;

// --- Rewards and Values ---
/** Gold awarded to the player for completing a standard level. */
export const GOLD_REWARD_PER_LEVEL = 2;
/** Soul Fragments awarded for defeating an enemy. */
export const SOUL_FRAGMENTS_PER_ENEMY_DEFEAT = 1;
/** Soul Fragments awarded for completing a standard level. */
export const SOUL_FRAGMENTS_PER_LEVEL_COMPLETE = 5;
/**
 * Multiplier for Soul Fragments awarded at the end of a run.
 * @deprecated This specific multiplier might be obsolete; direct summation or different reward structures are now used.
 */
export const SOUL_FRAGMENTS_END_RUN_MULTIPLIER = 2;

// --- Meta-Progression Initial Values ---
/** Initial maximum capacity for Soul Fragments the player can hold. Can be upgraded via Mirror. */
export const INITIAL_MAX_SOUL_FRAGMENTS = 200;
/** Initial amount of Will Lumens the player starts with. */
export const INITIAL_WILL_LUMENS = 0;

// --- Combat and Item Values ---
/** Base damage dealt by some enemy Fury abilities if not specified otherwise. */
export const ENEMY_FURY_BASE_DAMAGE = 1;
/** Fury gained by the enemy per player click/cell reveal. */
export const FURY_INCREMENT_PER_CLICK = 1;
/** Fury gained by the enemy when they reveal a Gold cell. */
export const ENEMY_FURY_GAIN_ON_GOLD_REVEAL = 5;
/** Damage dealt to the enemy when the player reveals an Attack cell. */
export const ATTACK_DAMAGE_PLAYER_VS_ENEMY = 1;
/** Damage dealt to the player when an enemy reveals an Attack cell. */
export const ATTACK_DAMAGE_ENEMY_VS_PLAYER = 1;
/** Amount of gold obtained from a Gold cell. */
export const GOLD_VALUE = 1;

// --- Meta-Progression: Fury Awakening ---
/** Points needed in `furyAwakeningProgress` to awaken the next Fury ability from the sequence. */
export const FURY_AWAKENING_THRESHOLD = 100;
/** Default Awakening points granted by unlocking an Echo in the Sanctuary tree, if not specified by the EcoTreeNodeData. */
export const ECO_UNLOCK_AWAKENING_POINTS = 33;

// --- Battlefield Reduction (Mini-Arena) Constants ---
/** Dimensions for progressively smaller arenas during battlefield reduction. Defines up to 2 reduction levels. */
export const MINI_ARENA_SIZES: {rows: number, cols: number}[] = [ {rows: 6, cols: 6}, {rows: 4, cols: 4} ];
/** Maximum number of times the battlefield can be reduced, based on defined `MINI_ARENA_SIZES`. */
export const MAX_ARENA_REDUCTIONS = MINI_ARENA_SIZES.length;
/** Minimum rows for the smallest possible arena after all reductions. */
export const MINIMUM_ARENA_ROWS = MINI_ARENA_SIZES[MINI_ARENA_SIZES.length - 1].rows;
/** Minimum number of Attack cells to attempt to leave on the board during mini-arena generation, if possible. */
export const MINI_ARENA_ATTACK_MARGIN = 2;
/** Density factor for Attack cells in mini-arenas at different reduction levels. */
export const MINI_ARENA_ATTACK_DENSITY_FACTOR_PERCENT = { level1: 35, level2: 45 };
/** Duration of the battlefield reduction transition animation in milliseconds. */
export const BATTLEFIELD_TRANSITION_DURATION_MS = 1500;

// --- Abyss Map Constants ---
/** Default number of levels per stretch in the Abyss Map if not otherwise specified by map generation logic. */
export const DEFAULT_LEVELS_PER_STRETCH = 2;
/** Value of Soul Fragments awarded from a map node reward of type `MapRewardType.SoulFragments`. */
export const MAP_NODE_REWARD_SOUL_FRAGMENTS_VALUE = 10;
/** Default depth (number of layers) for a generated Abyss Map. */
export const MAP_DEFAULT_DEPTH = 4;
/** Minimum number of path choices from a map node. */
export const MAP_CHOICES_PER_NODE_MIN = 2;
/** Maximum number of path choices from a map node. */
export const MAP_CHOICES_PER_NODE_MAX = 2;
/** Value of Will Lumens awarded from a map node reward of type `MapRewardType.WillLumens`. */
export const MAP_NODE_REWARD_WILL_LUMENS_VALUE = 5;
/** HP healed by a Healing Fountain map node reward. */
export const MAP_NODE_REWARD_HEALING_FOUNTAIN_VALUE = 5;
/** Extra gold gained per level if on an "Extra Gold" map path or biome. */
export const MAP_NODE_REWARD_GOLD_MODIFIER_VALUE = 2;


// --- Echo Base IDs (for referencing Echo families and managing upgrades/prerequisites) ---
/** Base ID for Visión Áurea Echos (Gold clue related). */
export const BASE_ECHO_VISION_AUREA = 'base_vision_aurea';
/** Base ID for Sentido de Amenaza Echos (Attack clue related). Formerly Detector de Peligros. */
export const BASE_ECHO_DETECTOR_PELIGROS = 'base_detector_peligros';
/** @deprecated Base ID possibly for an old Attack clue enhancer, functionality merged or evolved. */
export const BASE_ECHO_SENTIDO_ACERO = 'base_sentido_acero';
/** Base ID for Clarividencia Total Echos (Detailed Gold/Attack breakdown clues). */
export const BASE_ECHO_CLARIVIDENCIA_TOTAL = 'base_clarividencia_total';
/** Base ID for Ojo Omnisciente Echos (Reveal specific item near clue). */
export const BASE_ECHO_OJO_OMNISCIENTE = 'base_ojo_omnisciente';
/** Base ID for Eco de Cascada Echos (Cascade reveal on '0' clues). */
export const BASE_ECHO_ECO_CASCADA = 'base_eco_cascada';
/** Base ID for Marcador Táctico Echos (Enables generic cell marking). */
export const BASE_ECHO_MARCADOR_TACTICO = 'base_marcador_tactico';
/** Base ID for Cartografía Avanzada Echos (Enables specific cell marking types). */
export const BASE_ECHO_CARTOGRAFIA_AVANZADA = 'base_cartografia_avanzada';
/** Base ID for Corazón de Hierro Echos (Increases Max HP). */
export const BASE_ECHO_CORAZON_HIERRO = 'base_corazon_hierro';
/** Base ID for Piel de Piedra Echos (Reduces first enemy Attack damage per level). */
export const BASE_ECHO_PIEL_PIEDRA = 'base_piel_piedra';
/** Base ID for Venganza Espectral Echos (Damage buff after taking Attack damage). */
export const BASE_ECHO_VENGANZA_ESPECTRAL = 'base_venganza_espectral';
/** Base ID for Último Aliento Echos (Invulnerability and crits at low HP). */
export const BASE_ECHO_ULTIMO_ALIENTO = 'base_ultimo_aliento';
/** Base ID for Maestría del Impacto Echos (Combo damage for consecutive Attack reveals). Renamed from "Maestría de la Estocada". */
export const BASE_ECHO_MAESTRIA_ESTOCADA = 'base_maestria_estocada';
/** Base ID for Torrente de Impactos Echos (Enhanced combo damage and Fury reduction). Renamed from "Torrente de Acero". */
export const BASE_ECHO_TORRENTE_ACERO = 'base_torrente_acero';
/** Base ID for Bolsa Agrandada Echos (Start levels with bonus gold). */
export const BASE_ECHO_BOLSA_AGRANDADA = 'base_bolsa_agrandada';
/** Base ID for Instinto del Buscador Echos (Chance for double gold from Gold cells). */
export const BASE_ECHO_INSTINTO_BUSCADOR = 'base_instinto_buscador';
/** Base ID for Alquimia Improvisada Echos (Spend gold to ignore next enemy Attack damage). */
export const BASE_ECHO_ALQUIMIA_IMPROVISADA = 'base_alquimia_improvisada';
/** Base ID for Corazón del Abismo Echos (Sacrifice HP for powerful random Echo or duplication). */
export const BASE_ECHO_CORAZON_ABISMO = 'base_corazon_abismo';
/** Base ID for Paso Ligero Echos (Ignore first trap per level). */
export const BASE_ECHO_PASO_LIGERO = 'base_paso_ligero';
/** Base ID for Voluntad Inquebrantable Echos (Reduce potency of enemy Fury effects). */
export const BASE_ECHO_VOLUNTAD_INQUEBRANTABLE = 'base_voluntad_inquebrantable';
/** Base ID for Aprendizaje Rápido Echos (Improves quality of free Echo choice). */
export const BASE_ECHO_APRENDIZAJE_RAPIDO = 'base_aprendizaje_rapido';
/** Generic base ID for HP recovery Echos. */
export const BASE_ECHO_RECOVER_HP = 'base_recover_hp';

// --- Echo Definitions ---
// These are now defined in core/echos/index.ts and imported from there.
// export const INITIAL_STARTING_ECHOS: Echo[] = [ ... ];
// export const NEW_AVAILABLE_ECHOS_FOR_TREE: Echo[] = [ ... ];
// export const FREE_ECHO_OPTIONS: Echo[] = [ ... ];
// export const ALL_ECHOS_LIST: Echo[] = [ ... ];
// export const ALL_ECHOS_MAP: Map<string, Echo> = new Map( ... );


/** Defines the structure and unlock progression of Echos in the Sanctuary's Eco Tree. */
export const ECO_TREE_STRUCTURE_DATA: EcoTreeNodeData[] = [
  // Tier 0 (Base unlocks, generally more accessible)
  { echoId: 'eco_detector_peligros_1', baseId: BASE_ECHO_DETECTOR_PELIGROS, cost: 25, prerequisites: [], tier: 0, awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS },
  { echoId: 'eco_corazon_hierro_1', baseId: BASE_ECHO_CORAZON_HIERRO, cost: 30, prerequisites: [], tier: 0, awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS },
  { echoId: 'eco_cascada_1', baseId: BASE_ECHO_ECO_CASCADA, cost: 20, prerequisites: [], tier: 0, awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS },
  { echoId: 'eco_bolsa_agrandada_1', baseId: BASE_ECHO_BOLSA_AGRANDADA, cost: 15, prerequisites: [], tier: 0, awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS },
  { echoId: 'eco_aprendizaje_rapido_1', baseId: BASE_ECHO_APRENDIZAJE_RAPIDO, cost: 30, prerequisites: [], tier: 0, awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS },

  // Tier 1 (Build upon Tier 0 or existing initial Echos)
  { echoId: 'eco_vision_aurea_2', baseId: BASE_ECHO_VISION_AUREA, cost: 60, prerequisites: [BASE_ECHO_VISION_AUREA], tier: 1, awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS }, // Requires eco_vision_aurea_1 (from initial pool)
  { echoId: 'eco_marcador_tactico_1', baseId: BASE_ECHO_MARCADOR_TACTICO, cost: 40, prerequisites: [], tier: 1, awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS },
  { echoId: 'eco_piel_piedra_1', baseId: BASE_ECHO_PIEL_PIEDRA, cost: 55, prerequisites: [BASE_ECHO_CORAZON_HIERRO], tier: 1, awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS },
  { echoId: 'eco_maestria_estocada_1', baseId: BASE_ECHO_MAESTRIA_ESTOCADA, cost: 45, prerequisites: [], tier: 1, awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS },
  { echoId: 'eco_cascada_2', baseId: BASE_ECHO_ECO_CASCADA, cost: 50, prerequisites: [BASE_ECHO_ECO_CASCADA], tier: 1, awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS },
  { echoId: 'eco_corazon_hierro_2', baseId: BASE_ECHO_CORAZON_HIERRO, cost: 60, prerequisites: [BASE_ECHO_CORAZON_HIERRO], tier: 1, awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS },
  { echoId: 'eco_instinto_buscador_1', baseId: BASE_ECHO_INSTINTO_BUSCADOR, cost: 50, prerequisites: [BASE_ECHO_BOLSA_AGRANDADA], tier: 1, awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS },
  { echoId: 'eco_paso_ligero_1', baseId: BASE_ECHO_PASO_LIGERO, cost: 40, prerequisites: [], tier: 1, awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS },

  // Tier 2 (More powerful Echos, often requiring multiple prerequisites)
  { echoId: 'eco_clarividencia_total_1', baseId: BASE_ECHO_CLARIVIDENCIA_TOTAL, cost: 100, prerequisites: [BASE_ECHO_VISION_AUREA, BASE_ECHO_DETECTOR_PELIGROS], tier: 2, awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS },
  { echoId: 'eco_cartografia_avanzada_1', baseId: BASE_ECHO_CARTOGRAFIA_AVANZADA, cost: 80, prerequisites: [BASE_ECHO_MARCADOR_TACTICO], tier: 2, awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS },
  { echoId: 'eco_venganza_espectral_1', baseId: BASE_ECHO_VENGANZA_ESPECTRAL, cost: 90, prerequisites: [BASE_ECHO_PIEL_PIEDRA], tier: 2, awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS },
  { echoId: 'eco_torrente_acero_1', baseId: BASE_ECHO_TORRENTE_ACERO, cost: 95, prerequisites: [BASE_ECHO_MAESTRIA_ESTOCADA], tier: 2, awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS },
  { echoId: 'eco_alquimia_improvisada_1', baseId: BASE_ECHO_ALQUIMIA_IMPROVISADA, cost: 75, prerequisites: [BASE_ECHO_INSTINTO_BUSCADOR], tier: 2, awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS },
  { echoId: 'eco_cascada_3', baseId: BASE_ECHO_ECO_CASCADA, cost: 80, prerequisites: [BASE_ECHO_ECO_CASCADA], tier: 2, awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS },
  { echoId: 'eco_voluntad_inquebrantable_1', baseId: BASE_ECHO_VOLUNTAD_INQUEBRANTABLE, cost: 100, prerequisites: [], tier: 2, awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS },

  // Tier 3 (Legendary/Capstone Echos, high cost and significant impact)
  { echoId: 'eco_ojo_omnisciente_1', baseId: BASE_ECHO_OJO_OMNISCIENTE, cost: 150, prerequisites: [BASE_ECHO_CLARIVIDENCIA_TOTAL], tier: 3, awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS },
  { echoId: 'eco_ultimo_aliento_1', baseId: BASE_ECHO_ULTIMO_ALIENTO, cost: 160, prerequisites: [BASE_ECHO_VENGANZA_ESPECTRAL], tier: 3, awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS },
  { echoId: 'eco_corazon_abismo_1', baseId: BASE_ECHO_CORAZON_ABISMO, cost: 200, prerequisites: [], tier: 3, awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS },
];

// --- Prologue Specific Data ---
/** Level identifier used for the prologue. */
export const PROLOGUE_LEVEL_ID = 0;
/** Definition for the Shadow Ember enemy encountered in the prologue. */
export const PROLOGUE_ENEMY_SHADOW_EMBER: EnemyArchetypeDefinition = {
  id: EnemyArchetypeId.ShadowEmber,
  name: "Rescoldo de Sombra",
  icon: "🔥",
  baseHp: 2,
  hpPerLevelMultiplier: 0, // No HP scaling for prologue enemy
  baseFuryActivationThreshold: 999, // Effectively won't trigger Fury in prologue normally
  aiType: AIType.Default, // Simple AI for prologue
  isSpecial: true,
};
// PROLOGUE_SHADOW_EMBER_FURY_ABILITY is now defined in core/furies/fury_shadow_ember_spark_prologue.ts and exported from core/furies/index.ts
// /** Specific Fury ability for the prologue's Shadow Ember enemy (usually very weak or scripted). */
// export const PROLOGUE_SHADOW_EMBER_FURY_ABILITY: FuryAbility = {
//   id: 'fury_shadow_ember_spark_prologue', name: "Chispa Agónica", description: "Un breve espasmo de energía te roza. Pierdes <strong>1 HP</strong>.", icon: '💥', effectType: FuryAbilityEffectType.PlayerDamage, value: 1, rarity: Rarity.Common,
// };
/** Board configuration for the prologue. Uses unified 'attacks'. */
export const PROLOGUE_BOARD_CONFIG: BoardConfig = { rows: PROLOGUE_BOARD_ROWS, cols: PROLOGUE_BOARD_COLS, attacks: 3, gold: 3, traps: 0 };
// PROLOGUE_PREDEFINED_ECHO_CHOICES_BASE_IDS is now in core/echos/index.ts


// --- Fury Ability Definitions ---
// These are now defined in core/furies/index.ts and imported from there if needed.
// export const INITIAL_STARTING_FURIESS: FuryAbility[] = [ ... ];
// const ALL_GAME_FURY_ABILITIES_BASE: FuryAbility[] = [ ... ];
// export const ALL_GAME_FURY_ABILITIES: FuryAbility[] = [ ... ];
// export const ALL_FURY_ABILITIES_MAP: Map<string, FuryAbility> = new Map( ... );
// export const FURY_ABILITIES_TO_AWAKEN_SEQUENTIALLY: string[] = [ ... ]; // Now moved to core/furies/index.ts


/** Ordered list of Fury ability IDs to be awakened sequentially through meta-progression (Eco Tree). */
// This specific constant is still used by name in useGameEngine, so we keep its definition here for now,
// but it should ideally also be sourced from core/furies if it's considered part of the Fury definitions.
// For this refactor, the goal was to move the actual FuryAbility objects and their collections.
// Keeping this array of strings here is acceptable for now.
// export const FURY_ABILITIES_TO_AWAKEN_SEQUENTIALLY: string[] = [ // Commenting out as it's moved
//     'fury_golpe_certero', // Rare
//     'fury_nido_peligros', // Rare
//     'fury_sombras_persistentes', // Rare
//     'fury_resistencia_impia', // Rare
//     'fury_tormenta_esquirlas', // Epic
//     'fury_campo_minado_subito', // Epic
//     'fury_gran_eclipse', // Epic
//     'fury_festin_oscuro', // Epic
//     'fury_aliento_aniquilador', // Legendary
//     'fury_remodelacion_caotica', // Legendary
//     // Future: Add more Epic/Legendary Furies here as they are defined and balanced.
// ];
