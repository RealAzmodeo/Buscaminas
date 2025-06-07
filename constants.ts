
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

/** Initial Echos available to the player at the start of the game or as common choices. */
export const INITIAL_STARTING_ECHOS: Echo[] = [
  { id: 'eco_vision_aurea_1', baseId: BASE_ECHO_VISION_AUREA, name: "Visión Áurea", level: 1, description: "Pistas discriminan <strong>Oro</strong> (ej: [Oro] / [Resto]).", icon: "👁️‍🗨️", cost: 2, effectType: EchoEffectType.UpdateClueSystem, value: 'vision_aurea_oro', rarity: Rarity.Common, awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS },
  { id: 'eco_vigor_fugaz_initial', baseId: 'base_vigor_fugaz_initial', name: "Vigor Fugaz", level: 1, description: "<strong>+1 HP Máximo</strong> para la run actual.", icon: "💓", cost: 1, effectType: EchoEffectType.IncreaseMaxHP, value: 1, rarity: Rarity.Common, awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS },
  { id: 'eco_filo_afortunado_initial', baseId: 'base_filo_afortunado_initial', name: "Impacto Afortunado", level: 1, description: "La <strong>primera casilla de Ataque</strong> revelada por ti en cada nivel tiene un <strong>50%</strong> de probabilidad de infligir <strong>+1 daño</strong>.", icon: "🍀💥", cost: 1, effectType: EchoEffectType.GenericPlaceholder, value: { chance: 0.5, bonus: 1 }, rarity: Rarity.Common, awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS },
  { id: 'eco_monedero_iniciado_initial', baseId: 'base_monedero_iniciado_initial', name: "Monedero de Iniciado", level: 1, description: "Ganas <strong>+3 Oro</strong> al completar el nivel actual.", icon: "💰✨", cost: 1, effectType: EchoEffectType.GenericPlaceholder, value: 3, rarity: Rarity.Common, awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS },
  { id: 'eco_recover_hp_free_1', baseId: BASE_ECHO_RECOVER_HP, name: "Alivio Fugaz", level: 1, description: "Restaura <strong>1 HP</strong>. Un respiro en la oscuridad.", icon: "💖", cost: 0, isFree: true, effectType: EchoEffectType.GainHP, value: 1, rarity: Rarity.Common },
  { id: 'eco_sentido_alerta_initial', baseId: 'base_sentido_alerta_initial', name: "Sentido Alerta", level: 1, description: "Casillas con cualquier objeto (Ataque, Oro) emiten un <strong>aura visual muy sutil</strong> al pasar el cursor cerca (no discrimina tipo).", icon: "🔔", cost: 0, isFree: true, effectType: EchoEffectType.GenericPlaceholder, rarity: Rarity.Common },
  { id: 'eco_paso_cauteloso_initial', baseId: 'base_paso_cauteloso_initial', name: "Resguardo Cauteloso", level: 1, description: "La <strong>primera casilla de Ataque</strong> que te dañe en toda la run inflige <strong>1 de daño menos</strong>.", icon: "👣🛡️", cost: 1, effectType: EchoEffectType.GenericPlaceholder, value: 1, rarity: Rarity.Common, awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS },
  { id: 'eco_chispa_ingenio_initial', baseId: 'base_chispa_ingenio_initial', name: "Chispa de Ingenio", level: 1, description: "El coste en Oro del <strong>próximo Eco que compres se reduce en 1</strong> (coste mínimo 1). Se consume al usarlo.", icon: "💡💰", cost: 2, effectType: EchoEffectType.GenericPlaceholder, value: 1, rarity: Rarity.Common, awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS },
  { id: 'eco_reflejos_preparados_initial', baseId: 'base_reflejos_preparados_initial', name: "Reflejos Preparados", level: 1, description: "La <strong>primera vez</strong> que la barra de Furia del enemigo se llena en un nivel, tarda un <strong>20% más de clics</strong> en llenarse.", icon: "⏳🔥", cost: 2, effectType: EchoEffectType.GenericPlaceholder, value: 0.20, rarity: Rarity.Common, awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS },
];

/** Echos that become available for unlocking in the Sanctuary Eco Tree. */
export const NEW_AVAILABLE_ECHOS_FOR_TREE: Echo[] = [
  { id: 'eco_vision_aurea_2', baseId: BASE_ECHO_VISION_AUREA, name: "Visión Áurea", level: 2, description: "(Evolución) Pistas discriminan <strong>Oro</strong> y revelan la <strong>cantidad de Oro</strong> en casillas adyacentes ocultas.", icon: "👁️‍🗨️✨", cost: 4, effectType: EchoEffectType.UpdateClueSystem, value: 'vision_aurea_oro_cantidad', rarity: Rarity.Rare, awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS },
  { id: 'eco_detector_peligros_1', baseId: BASE_ECHO_DETECTOR_PELIGROS, name: "Sentido de Amenaza", level: 1, description: "Pistas discriminan <strong>Ataque</strong> (ej: [Ataque] / [Resto]).", icon: "⚠️", cost: 2, effectType: EchoEffectType.UpdateClueSystem, value: 'detector_amenaza_ataque', rarity: Rarity.Common, awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS },
  { id: 'eco_clarividencia_total_1', baseId: BASE_ECHO_CLARIVIDENCIA_TOTAL, name: "Clarividencia Total", level: 1, description: "(Req: Visión Áurea & Sentido Amenaza) Pistas muestran desglose: <strong>[Oro] / [Ataque]</strong>.", icon: "🔮", cost: 6, effectType: EchoEffectType.UpdateClueSystem, value: 'clarividencia_total_ataque_oro', rarity: Rarity.Epic, awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS },
  { id: 'eco_ojo_omnisciente_1', baseId: BASE_ECHO_OJO_OMNISCIENTE, name: "Ojo Omnisciente", level: 1, description: "(Evol. Clarividencia Total) Además, 1/nivel, enfoca pista para <strong>revelar un objeto contribuyente</strong> cercano.", icon: "🌟", cost: 10, effectType: EchoEffectType.RevealNearestItem, value: { uses: 1 }, rarity: Rarity.Legendary, awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS },
  { id: 'eco_cascada_1', baseId: BASE_ECHO_ECO_CASCADA, name: "Eco de Cascada", level: 1, description: "Casillas '<strong>0</strong>' revelan adyacentes (<strong>1 anillo</strong>).", icon: "🌊", cost: 2, effectType: EchoEffectType.CascadeReveal, value: 1, rarity: Rarity.Common, awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS },
  { id: 'eco_cascada_2', baseId: BASE_ECHO_ECO_CASCADA, name: "Eco de Cascada", level: 2, description: "(Evolución) Cascada se extiende <strong>2 anillos</strong>.", icon: "🌊🌊", cost: 4, effectType: EchoEffectType.CascadeReveal, value: 2, rarity: Rarity.Rare, awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS },
  { id: 'eco_cascada_3', baseId: BASE_ECHO_ECO_CASCADA, name: "Eco de Cascada", level: 3, description: "(Evolución) Cascada se extiende <strong>3 anillos</strong> y tiene baja prob. de <strong>no activar casilla de Ataque</strong>.", icon: "🌊🌊🌊", cost: 7, effectType: EchoEffectType.CascadeReveal, value: { depth: 3, disarmChance: 0.15 }, rarity: Rarity.Epic, awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS },
  { id: 'eco_marcador_tactico_1', baseId: BASE_ECHO_MARCADOR_TACTICO, name: "Marcador Táctico", level: 1, description: "Permite marcar casillas con una <strong>bandera genérica</strong>.", icon: "🚩", cost: 3, effectType: EchoEffectType.EnableCellMarking, value: 'generic_flag', rarity: Rarity.Rare, awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS },
  { id: 'eco_cartografia_avanzada_1', baseId: BASE_ECHO_CARTOGRAFIA_AVANZADA, name: "Cartografía Avanzada", level: 1, description: "(Evolución) Permite <strong>marcadores específicos</strong> (Ataque Peligroso, Ataque Ventajoso, Oro, ?). Marcados incorrectamente <strong>no se pueden clickar</strong> por <strong>3 clics</strong>.", icon: "🗺️", cost: 5, effectType: EchoEffectType.EnableCellMarking, value: { types: ['bomb', 'sword', 'gold', 'question'], lockIncorrectDuration: 3 }, rarity: Rarity.Epic, awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS },
  { id: 'eco_corazon_hierro_1', baseId: BASE_ECHO_CORAZON_HIERRO, name: "Corazón de Hierro", level: 1, description: "<strong>+2 HP Máximo</strong> y te cura esa cantidad.", icon: "❤️‍🩹", cost: 3, effectType: EchoEffectType.IncreaseMaxHP, value: 2, rarity: Rarity.Common, awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS },
  { id: 'eco_corazon_hierro_2', baseId: BASE_ECHO_CORAZON_HIERRO, name: "Corazón de Hierro", level: 2, description: "<strong>+3 HP Máximo</strong> y te cura esa cantidad.", icon: "❤️‍🩹+", cost: 5, effectType: EchoEffectType.IncreaseMaxHP, value: 3, rarity: Rarity.Rare, awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS },
  { id: 'eco_piel_piedra_1', baseId: BASE_ECHO_PIEL_PIEDRA, name: "Piel de Piedra", level: 1, description: "Reduce el daño de la <strong>primera casilla de Ataque (daño enemigo)</strong> sufrida en cada nivel en <strong>1</strong>.", icon: "🛡️", cost: 4, effectType: EchoEffectType.FirstBombDamageReduction, value: 1, rarity: Rarity.Rare, awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS },
  { id: 'eco_venganza_espectral_1', baseId: BASE_ECHO_VENGANZA_ESPECTRAL, name: "Venganza Espectral", level: 1, description: "Al recibir daño de Ataque, tu próximo Ataque hace <strong>+1 daño</strong> adicional.", icon: "👻💥", cost: 5, effectType: EchoEffectType.TempDamageBuffAfterBomb, value: 1, rarity: Rarity.Epic, awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS },
  { id: 'eco_ultimo_aliento_1', baseId: BASE_ECHO_ULTIMO_ALIENTO, name: "Último Aliento", level: 1, description: "Al llegar a <strong>1 HP</strong> (1 vez/run), ganas <strong>invulnerabilidad por 3 clics</strong> y tus Ataques hacen <strong>daño crítico</strong>.", icon: "⏳", cost: 8, effectType: EchoEffectType.LastStandInvulnerabilityCrit, value: { clicks: 3 }, rarity: Rarity.Legendary, awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS },
  { id: 'eco_maestria_estocada_1', baseId: BASE_ECHO_MAESTRIA_ESTOCADA, name: "Maestría del Impacto", level: 1, description: "Revelar <strong>2 casillas de Ataque</strong> seguidas: la 2ª inflige <strong>+1 daño</strong>.", icon: "💨💥", cost: 3, effectType: EchoEffectType.ComboDamageBonus, value: { count: 2, bonus: 1 }, rarity: Rarity.Rare, awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS },
  { id: 'eco_torrente_acero_1', baseId: BASE_ECHO_TORRENTE_ACERO, name: "Torrente de Impactos", level: 1, description: "(Evol. Maestría Impacto) Combo de Ataques a <strong>3</strong>, daño incremental. 3 Ataques seguidos <strong>reducen Furia enemiga</strong>.", icon: "💨💥+", cost: 6, effectType: EchoEffectType.ComboDamageBonus, value: { count: 3, bonusIncremental: true, reduceFury: true }, rarity: Rarity.Epic, awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS },
  { id: 'eco_bolsa_agrandada_1', baseId: BASE_ECHO_BOLSA_AGRANDADA, name: "Bolsa Agrandada", level: 1, description: "Comienzas cada nivel con <strong>+3 Oro</strong>.", icon: "🎒", cost: 2, effectType: EchoEffectType.StartWithBonusGold, value: 3, rarity: Rarity.Common, awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS },
  { id: 'eco_instinto_buscador_1', baseId: BASE_ECHO_INSTINTO_BUSCADOR, name: "Instinto del Buscador", level: 1, description: "Pequeña prob. (<strong>10%</strong>) que una casilla de Oro contenga <strong>doble valor</strong>.", icon: "💎", cost: 4, effectType: EchoEffectType.DoubleGoldChance, value: 0.10, rarity: Rarity.Rare, awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS },
  { id: 'eco_alquimia_improvisada_1', baseId: BASE_ECHO_ALQUIMIA_IMPROVISADA, name: "Alquimia Improvisada", level: 1, description: "Gasta <strong>5 Oro</strong> para <strong>ignorar el daño</strong> de la próxima casilla de Ataque revelada por enemigo (1/nivel, manual).", icon: "🧪", cost: 5, effectType: EchoEffectType.SpendGoldIgnoreBomb, value: 5, rarity: Rarity.Epic, awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS },
  { id: 'eco_corazon_abismo_1', baseId: BASE_ECHO_CORAZON_ABISMO, name: "Corazón del Abismo", level: 1, description: "1/run: sacrifica <strong>50% HP actual</strong> por <strong>Eco Épico aleatorio</strong> o <strong>duplicar efecto de Eco C/R</strong>.", icon: "🌀", cost: 10, effectType: EchoEffectType.SacrificeHpForPower, value: null, rarity: Rarity.Legendary, awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS },
  { id: 'eco_paso_ligero_1', baseId: BASE_ECHO_PASO_LIGERO, name: "Paso Ligero", level: 1, description: "La primera <strong>Trampa</strong> revelada en un nivel es ignorada.", icon: "👟", cost: 4, effectType: EchoEffectType.IgnoreFirstTrap, value: true, rarity: Rarity.Rare, awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS },
  { id: 'eco_voluntad_inquebrantable_1', baseId: BASE_ECHO_VOLUNTAD_INQUEBRANTABLE, name: "Voluntad Inquebrantable", level: 1, description: "Efectos de Furia del enemigo (daño, pérdida oro) se reducen un <strong>25%</strong>.", icon: "💪", cost: 6, effectType: EchoEffectType.ReduceFuryEffectPotency, value: 0.25, rarity: Rarity.Epic, awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS },
  { id: 'eco_aprendizaje_rapido_1', baseId: BASE_ECHO_APRENDIZAJE_RAPIDO, name: "Aprendizaje Rápido", level: 1, description: "La opción de <strong>Eco gratuita</strong> post-nivel es ligeramente mejor.", icon: "🧠", cost: 3, effectType: EchoEffectType.ImproveEchoChoice, value: null, rarity: Rarity.Common, awakeningPoints: ECO_UNLOCK_AWAKENING_POINTS },
].filter(echo => !INITIAL_STARTING_ECHOS.some(initial => initial.id === echo.id)); // Ensure no duplicates if an echo was moved from initial to tree

/** Pool of Echos initially available to the player for post-level choices (might include some from INITIAL_STARTING_ECHOS). */
export const AVAILABLE_ECHOS: Echo[] = [ ...INITIAL_STARTING_ECHOS ];
/** Options for free Echos offered post-level (e.g., HP recovery). */
export const FREE_ECHO_OPTIONS: Echo[] = [ { id: 'eco_recover_hp_free_standard', baseId: BASE_ECHO_RECOVER_HP, name: "Alivio Fugaz Estándar", level: 1, description: "Restaura <strong>2 HP</strong>. Un respiro en la oscuridad.", icon: "💖", cost: 0, isFree: true, effectType: EchoEffectType.GainHP, value: 2, rarity: Rarity.Common } ];
/** Comprehensive list of all defined Echos in the game, used for lookups. */
export const ALL_ECHOS_LIST: Echo[] = [ ...INITIAL_STARTING_ECHOS, ...NEW_AVAILABLE_ECHOS_FOR_TREE, ...FREE_ECHO_OPTIONS ].filter((echo, index, self) => index === self.findIndex(e => e.id === echo.id));
/** Map of all Echos, keyed by their specific ID, for quick lookup. */
export const ALL_ECHOS_MAP: Map<string, Echo> = new Map( ALL_ECHOS_LIST.map(echo => [echo.id, echo]) );

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
/** Specific Fury ability for the prologue's Shadow Ember enemy (usually very weak or scripted). */
export const PROLOGUE_SHADOW_EMBER_FURY_ABILITY: FuryAbility = {
  id: 'fury_shadow_ember_spark_prologue', name: "Chispa Agónica", description: "Un breve espasmo de energía te roza. Pierdes <strong>1 HP</strong>.", icon: '💥', effectType: FuryAbilityEffectType.PlayerDamage, value: 1, rarity: Rarity.Common,
};
/** Board configuration for the prologue. Uses unified 'attacks'. */
export const PROLOGUE_BOARD_CONFIG: BoardConfig = { rows: PROLOGUE_BOARD_ROWS, cols: PROLOGUE_BOARD_COLS, attacks: 3, gold: 3, traps: 0 };
/** Base IDs of Echos predefined as choices after completing the prologue. */
export const PROLOGUE_PREDEFINED_ECHO_CHOICES_BASE_IDS: string[] = [ BASE_ECHO_VISION_AUREA, 'base_vigor_fugaz_initial' ];

// --- FTUE / Guiding Text Constants ---
export const PROLOGUE_MESSAGES: Record<number | string, string> = {
  1: "Bienvenido a Numeria's Edge. Revela casillas para encontrar tu camino.",
  2: "Los números son <strong>Pistas</strong>. Indican cuántos objetos (<strong>Ataque</strong> u Oro) hay en las casillas adyacentes.",
  3: "¡Una casilla de <strong>Ataque</strong>! Si la revelas tú, dañas al enemigo. Si la revela el enemigo, te daña a ti.",
  4: "¡<strong>Oro</strong>! Acumúlalo para adquirir Ecos poderosos entre niveles.",
  5: "¡Cuidado, una casilla de <strong>Ataque</strong> revelada por el enemigo te daña!",
  6: "La barra de <strong>Furia</strong> del enemigo aumenta con cada casilla. Este enemigo es débil; su Furia no se desatará.",
  7: "Has derrotado a tu primer enemigo. El Abismo responde con un Eco... Elige sabiamente.",
  8: "Has elegido un <strong>Eco</strong>. Estos artefactos otorgan poderes pasivos.",
  9: "Antes de adentrarte más... el Abismo exige un augurio. El <strong>Oráculo de la Agonía</strong> revelará la forma de la Furia que te espera en el próximo nivel.",
  10: "Contempla los rostros del tormento que aguarda. Memoriza sus efectos.",
  11: "El caos arremolina el futuro... Las cartas se mezclan.",
  12: "Sella el pacto. ¿Qué sombra invocarás para el Nivel 1?",
  13: "Así está escrito. Esta Furia te esperará en el Nivel 1. Prepárate.",
  'BATTLEFIELD_REDUCTION_START': "¡No quedan más casillas de Ataque seguras! ¡El Abismo exige una conclusión!",
  'BATTLEFIELD_REDUCTION_COMPLETE': "El campo de batalla se encoge... ¡prepárate!",
};

// --- Fury Ability Definitions ---

/** Initial pool of Fury abilities available for the Oracle Minigame at the start of a run or for new players. */
export const INITIAL_STARTING_FURIESS: FuryAbility[] = [
  { id: 'fury_toque_vacio_initial', name: "Toque del Vacío", description: "Jugador pierde <strong>1 HP</strong>.", icon: "💔", effectType: FuryAbilityEffectType.PlayerDamage, value: 1, rarity: Rarity.Common },
  { id: 'fury_semilla_inoportuna_initial', name: "Semilla Inoportuna", description: "<strong>1 nueva Casilla de Ataque</strong> aparece en el tablero.", icon: "🌱💥", effectType: FuryAbilityEffectType.BoardAddAttacks, value: 1, rarity: Rarity.Common },
  { id: 'fury_velo_momentaneo_initial', name: "Velo Momentáneo", description: "<strong>1 Pista</strong> revelada se oculta.", icon: "💨❓", effectType: FuryAbilityEffectType.BoardHideClues, value: 1, rarity: Rarity.Common },
  { id: 'fury_aliento_efimero_initial', name: "Aliento Efímero", description: "Enemigo recupera <strong>1 HP</strong>.", icon: "😮‍💨❤️", effectType: FuryAbilityEffectType.EnemyHeal, value: 1, rarity: Rarity.Common },
  { id: 'fury_impuesto_sombrio_initial', name: "Impuesto Sombrío", description: "Jugador pierde <strong>1 Oro</strong>.", icon: "💸", effectType: FuryAbilityEffectType.PlayerGoldLoss, value: 1, rarity: Rarity.Common },
  { id: 'fury_torpeza_fugaz_initial', name: "Torpeza Fugaz", description: "El próximo Ataque revelado por el jugador tiene un <strong>25%</strong> de probabilidad de fallar (no hacer daño).", icon: "💢", effectType: FuryAbilityEffectType.PlayerChanceToFailAttack, value: 0.25, rarity: Rarity.Common },
  { id: 'fury_rescoldo_persistente_initial', name: "Rescoldo Persistente", description: "La barra de Furia del enemigo se llena un <strong>10%</strong> automáticamente para la próxima activación.", icon: "♨️", effectType: FuryAbilityEffectType.EnemyFuryBarPartialFill, value: 0.10, rarity: Rarity.Common },
  { id: 'fury_eco_distorsionado_menor_initial', name: "Eco Distorsionado Menor", description: "<strong>25%</strong> prob. de que el Eco más reciente del jugador se desactive por <strong>2 clics</strong>. Si no hay Ecos, no pasa nada.", icon: "🎶🚫", effectType: FuryAbilityEffectType.PlayerTemporaryEcoDeactivation, value: { chance: 0.25, duration: 2 }, rarity: Rarity.Common },
  { id: 'fury_mirada_inquietante_initial', name: "Mirada Inquietante", description: "Pistas reveladas parpadean o se vuelven borrosas por <strong>2-3 clics</strong> (efecto visual).", icon: "👁️‍🗨️💢", effectType: FuryAbilityEffectType.BoardVisualDisruption, value: { duration: 3 }, rarity: Rarity.Common },
];

/** Base list of more advanced Fury abilities that can be awakened or appear later in the game. */
const ALL_GAME_FURY_ABILITIES_BASE: FuryAbility[] = [
  { id: 'fury_impacto_menor', name: "Impacto Menor", description: "Jugador pierde <strong>1 HP</strong>.", icon: "💥", effectType: FuryAbilityEffectType.PlayerDamage, value: 1, rarity: Rarity.Common },
  { id: 'fury_golpe_certero', name: "Golpe Certero", description: "Jugador pierde <strong>3 HP</strong>.", icon: "🎯", effectType: FuryAbilityEffectType.PlayerDamage, value: 3, rarity: Rarity.Rare },
  { id: 'fury_tormenta_esquirlas', name: "Tormenta de Esquirlas", description: "Jugador pierde <strong>2 HP</strong> y <strong>5 Oro</strong>.", icon: "🌪️", effectType: FuryAbilityEffectType.PlayerDamageAndGoldLoss, value: { hp: 2, gold: 5 }, rarity: Rarity.Epic },
  { id: 'fury_aliento_aniquilador', name: "Aliento Aniquilador", description: "Jugador pierde <strong>33%</strong> de su <strong>HP MÁXIMO</strong> actual.", icon: "💀", effectType: FuryAbilityEffectType.PlayerPercentMaxHpDamage, value: 0.33, rarity: Rarity.Legendary },
  { id: 'fury_siembra_fugaz', name: "Siembra Fugaz", description: "<strong>1 nueva Casilla de Ataque</strong> aparece en el tablero.", icon: "🌱💥", effectType: FuryAbilityEffectType.BoardAddAttacks, value: 1, rarity: Rarity.Common },
  { id: 'fury_nido_peligros', name: "Nido de Peligros", description: "<strong>2-3 nuevas Casillas de Ataque</strong> aparecen.", icon: "🥚💥", effectType: FuryAbilityEffectType.BoardAddAttacks, value: {min: 2, max: 3}, rarity: Rarity.Rare },
  { id: 'fury_campo_minado_subito', name: "Campo de Ataque Súbito", description: "Área de <strong>2x2</strong> es sembrada con <strong>Casillas de Ataque y Oro</strong>.", icon: "💥💰", effectType: FuryAbilityEffectType.BoardAddMixedItems, value: { area: '2x2', items: ['attack', 'gold'] }, rarity: Rarity.Epic },
  { id: 'fury_remodelacion_caotica', name: "Remodelación Caótica", description: "Una <strong>cuarta parte</strong> del tablero se re-oculta y su contenido se <strong>regenera aleatoriamente</strong>.", icon: "🔄", effectType: FuryAbilityEffectType.BoardRegenerateSection, value: { fraction: 0.25 }, rarity: Rarity.Legendary },
  { id: 'fury_sombras_persistentes', name: "Sombras Persistentes", description: "<strong>3 casillas de Pista</strong> reveladas se ocultan.", icon: "🕶️", effectType: FuryAbilityEffectType.BoardHideClues, value: 3, rarity: Rarity.Rare },
  { id: 'fury_gran_eclipse', name: "Gran Eclipse", description: "<strong>TODAS las Pistas</strong> reveladas se ocultan.", icon: "🌑", effectType: FuryAbilityEffectType.BoardHideAllClues, value: null, rarity: Rarity.Epic },
  { id: 'fury_vigor_momentaneo', name: "Vigor Momentáneo", description: "Enemigo recupera <strong>3 HP</strong>.", icon: "💪❤️", effectType: FuryAbilityEffectType.EnemyHeal, value: 3, rarity: Rarity.Common },
  { id: 'fury_resistencia_impia', name: "Resistencia Impía", description: "Enemigo gana <strong>5 Armadura</strong> temporal.", icon: "🛡️👿", effectType: FuryAbilityEffectType.EnemyGainArmor, value: 5, rarity: Rarity.Rare },
  { id: 'fury_festin_oscuro', name: "Festín Oscuro", description: "Enemigo recupera <strong>5 HP</strong> y su Furia se carga un <strong>25%</strong>.", icon: "🍽️👿", effectType: FuryAbilityEffectType.EnemyHealAndFuryCharge, value: { heal: 5, furyChargePercent: 0.25 }, rarity: Rarity.Epic },
];

/** Comprehensive list of all Fury abilities in the game, ensuring no duplicates by ID. */
export const ALL_GAME_FURY_ABILITIES: FuryAbility[] = [
    ...INITIAL_STARTING_FURIESS,
    ...ALL_GAME_FURY_ABILITIES_BASE
].filter((fury, index, self) => index === self.findIndex((f) => f.id === fury.id));

/** Map of all Fury abilities, keyed by their ID, for quick lookup. */
export const ALL_FURY_ABILITIES_MAP: Map<string, FuryAbility> = new Map(
  ALL_GAME_FURY_ABILITIES.map(fury => [fury.id, fury])
);

/** Ordered list of Fury ability IDs to be awakened sequentially through meta-progression (Eco Tree). */
export const FURY_ABILITIES_TO_AWAKEN_SEQUENTIALLY: string[] = [
    'fury_golpe_certero', // Rare
    'fury_nido_peligros', // Rare
    'fury_sombras_persistentes', // Rare
    'fury_resistencia_impia', // Rare
    'fury_tormenta_esquirlas', // Epic
    'fury_campo_minado_subito', // Epic
    'fury_gran_eclipse', // Epic
    'fury_festin_oscuro', // Epic
    'fury_aliento_aniquilador', // Legendary
    'fury_remodelacion_caotica', // Legendary
    // Future: Add more Epic/Legendary Furies here as they are defined and balanced.
];
