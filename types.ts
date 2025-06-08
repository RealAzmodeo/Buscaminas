/**
 * @file Defines the core data structures and enumerated types used throughout Numeria's Edge.
 * This includes game state, player and enemy attributes, board cell configurations,
 * Ecos (passive abilities), Fury abilities (enemy special attacks), and meta-progression elements.
 */

/** Enum representing the different types of cells on the game board. */
export enum CellType {
  /** Unified attack tile. Damages enemy if player reveals, damages player if enemy reveals. */
  Attack = 'attack',
  /** Contains gold for the player. */
  Gold = 'gold',
  /** Provides information about adjacent cells. */
  Clue = 'clue',
  /** Represents an empty, revealed cell (e.g., after a cascade or specific enemy action). */
  Empty = 'empty',
  /** A hazard that typically damages the entity that reveals it. */
  Trap = 'trap',
}

/** Enum representing the types of marks a player can place on cells. */
export enum MarkType {
  /** A generic flag for player's notes. */
  GenericFlag = 'generic_flag',
  /** Contextually marks an 'Attack' tile as dangerous for the player. */
  Bomb = 'bomb_mark',
  /** Contextually marks an 'Attack' tile as beneficial for the player. */
  Sword = 'sword_mark',
  /** Marks a cell suspected to contain gold. */
  Gold = 'gold_mark',
  /** Marks a cell with uncertainty. */
  Question = 'question_mark',
}

/**
 * @interface AdjacentItems
 * @description Information about items (Attack, Gold) adjacent to a clue cell.
 */
export interface AdjacentItems {
  /** Count of unified attack items (player-beneficial or enemy-detrimental) nearby. */
  attacks: number;
  /** Count of gold items nearby. */
  gold: number;
  /** Total count of attack and gold items nearby. */
  total: number;
}

/**
 * @interface CellState
 * @description Represents the state of a single cell on the game board.
 */
export interface CellState {
  /** Unique identifier for the cell (e.g., `cell-row-col-level-arenaLevel-biomeId`). */
  id: string;
  /** Row index of the cell. */
  row: number;
  /** Column index of the cell. */
  col: number;
  /** The actual type of the cell (Attack, Gold, Clue, Trap, Empty). */
  type: CellType;
  /** Whether the cell's content is visible. */
  revealed: boolean;
  /** Player-placed mark on the cell, if any. */
  markType: MarkType | null;
  /** Number of clicks for which this cell is locked due to incorrect marking. */
  lockedIncorrectlyForClicks: number;
  /** Information for clue cells about their neighbors. */
  adjacentItems?: AdjacentItems;
  /** Visual effect applied to the cell (e.g., for specific Ecos or warnings). */
  visualEffect?: 'pulse-red' | 'glow-blue' | null;
}

/** Type alias for the game board, represented as a 2D array of CellState. */
export type BoardState = CellState[][];

/**
 * @interface DeactivatedEchoInfo
 * @description Information about an Echo that has been temporarily deactivated by an enemy Fury ability.
 */
export interface DeactivatedEchoInfo {
  /** The specific ID of the deactivated Echo instance (e.g., 'eco_vision_aurea_1'). */
  echoId: string;
  /** The base ID of the Echo family (e.g., 'base_vision_aurea'). */
  baseId: string;
  /** Icon of the Echo for display purposes. */
  icon: string;
  /** Name of the Echo. */
  name: string;
  /** How many player clicks (cell reveals) until the Echo reactivates. */
  clicksRemaining: number;
}

/**
 * @interface PlayerState
 * @description Represents the player's current state, including stats, resources, and active effects.
 */
export interface PlayerState {
  /** Current health points. */
  hp: number;
  /** Maximum health points. */
  maxHp: number;
  /** Current gold amount. */
  gold: number;
  /** Current shield points (absorbs damage before HP). */
  shield: number;
  /** Charges for the 'Venganza Espectral' Echo. */
  venganzaSpectralCharge: number;
  /** Tracks consecutive Attack tiles revealed by the player (for combo Ecos). */
  consecutiveSwordsRevealed: number;
  /** Tracks if player took damage from an enemy-revealed Attack tile this level (for Piel de Piedra). */
  firstBombDamageTakenThisLevel: boolean;
  /** Temporary damage modifier for player's Attack reveals (from Venganza Espectral). */
  swordDamageModifier: number;
  /** Duration in clicks for the temporary damage modifier. */
  swordDamageModifierClicksRemaining: number;
  /** True if 'Último Aliento' Echo has been used this run. */
  ultimoAlientoUsedThisRun: boolean;
  /** True if the player is currently invulnerable (e.g., from Último Aliento). */
  isInvulnerable: boolean;
  /** Duration in clicks of invulnerability. */
  invulnerabilityClicksRemaining: number;
  /** Duration in clicks for guaranteed critical hits (e.g., from Último Aliento). */
  criticalHitClicksRemaining: number;
  /** True if 'Alquimia Improvisada' can be activated (charge available). */
  alquimiaImprovisadaChargeAvailable: boolean;
  /** True if 'Alquimia Improvisada' will negate the next enemy Attack damage. */
  alquimiaImprovisadaActiveForNextBomb: boolean;
  /** True if 'Vínculo Doloroso' Fury effect (player takes recoil damage) is active. */
  vinculoDolorosoActive: boolean;
  /** Duration in clicks for 'Vínculo Doloroso'. */
  vinculoDolorosoClicksRemaining: number;
  /** True if 'Paso Ligero' has ignored a trap this level. */
  pasoLigeroTrapIgnoredThisLevel: boolean;
  /** True if 'Ojo Omnisciente' has been used this level. */
  ojoOmniscienteUsedThisLevel: boolean;
  /** Duration in clicks for 'Espadas Oxidadas' Fury debuff (reduces player Attack damage). */
  debuffEspadasOxidadasClicksRemaining: number;
  /** List of temporarily deactivated Ecos due to enemy Fury abilities. */
  deactivatedEcos: DeactivatedEchoInfo[];
  /** True if the next Echo purchase will cost double (e.g., from a Fury effect). */
  nextEchoCostsDoubled: boolean;
  /** True if the next Oracle Minigame will only offer Common Furies (e.g., from a Fury effect). */
  nextOracleOnlyCommonFury: boolean;
  /** Duration in clicks for 'Pistas Falsas' Fury effect (misleading clues). */
  pistasFalsasClicksRemaining: number;
  /** Duration in clicks for 'Paranoia Galopante' Fury effect (obscured clues). */
  paranoiaGalopanteClicksRemaining: number;
}

// --- Dynamic Difficulty System Types ---

/**
 * @enum EnemyRank
 * @description Classifies enemy strength and complexity.
 */
export enum EnemyRank {
  /** Standard enemy. */
  Minion = 'Minion',
  /** Stronger enemy with potentially fixed abilities. */
  Elite = 'Elite',
  /** Most powerful enemy, often with unique domain abilities. */
  Boss = 'Boss',
}

/**
 * @enum AIType
 * @description Defines the AI behavior ("brain") an enemy will use.
 */
export enum AIType {
  /** Focuses on direct, less calculated actions. */
  Brute = 'BruteAI',
  /** Analyzes probabilities to make optimal moves. */
  Calculator = 'CalculatorAI',
  /** Prioritizes resource denial or accumulation. */
  Hoarder = 'HoarderAI',
  /** Employs tricky or unpredictable patterns. */
  Illusionist = 'IllusionistAI',
  /** Fallback AI, or for simple archetypes. */
  Default = 'DefaultAI'
}

/**
 * @enum EnemyArchetypeId
 * @description Unique identifiers for enemy archetypes.
 */
export enum EnemyArchetypeId {
  /** Tank archetype. */
  Muro = 'muro',
  /** Rusher/Swarm archetype. */
  Enjambre = 'enjambre',
  /** Trickster archetype. */
  Ilusionista = 'ilusionista',
  /** Glass Cannon archetype. */
  Verdugo = 'verdugo',
  /** Controller/Debuffer archetype. */
  Parasito = 'parasito',
  /** Balanced/Standard archetype. */
  Centinela = 'centinela',
  /** Special prologue enemy. */
  ShadowEmber = 'shadow_ember_prologue',
}

/**
 * @interface DomainAbilityDefinition
 * @description Definition of a Domain Ability, typically for Boss-rank enemies.
 */
export interface DomainAbilityDefinition {
  /** Unique ID for the domain ability. */
  id: string;
  /** Name of the ability. */
  name: string;
  /** Description of its effects. */
  description: string;
}

/**
 * @interface EnemyInstance
 * @description Represents an instance of an enemy in an encounter.
 */
export interface EnemyInstance {
  /** Unique ID for this specific enemy instance. */
  id: string;
  /** Display name of the enemy. */
  name: string;
  /** ID of its archetype. */
  archetypeId: EnemyArchetypeId;
  /** Rank of the enemy (Minion, Elite, Boss). */
  rank: EnemyRank;
  /** Current health points. */
  currentHp: number;
  /** Maximum health points. */
  maxHp: number;
  /** Accumulated charge towards its next Fury ability. */
  currentFuryCharge: number;
  /** Clicks/actions needed to trigger Fury. */
  furyActivationThreshold: number;
  /** Armor points, reducing incoming damage. */
  armor: number;
  /** List of Fury abilities this enemy can use (Oracle-chosen + Fixed). */
  furyAbilities: FuryAbility[];
  /** Index of the next Fury ability in `furyAbilities` to be used. */
  activeFuryCycleIndex: number;
  /** Optional domain ability for Bosses. */
  domainAbility?: DomainAbilityDefinition;
  /** Reference to its base archetype definition. */
  baseArchetype: EnemyArchetypeDefinition;
  /** If true, the next Fury activation will trigger twice. */
  nextEnemyFuryIsDoubled?: boolean;
}

/**
 * @interface EnemyArchetypeDefinition
 * @description Defines the characteristics and behaviors of an enemy archetype.
 */
export interface EnemyArchetypeDefinition {
  /** Unique ID for the archetype. */
  id: EnemyArchetypeId;
  /** Display name of the archetype. */
  name: string;
  /** Emoji/icon for UI representation. */
  icon: string;
  /** Base health points before scaling. */
  baseHp?: number; // Now optional, only used by ShadowEmber for prologue
  /** HP scaling factor per run level (e.g., 0.1 for +10% base HP per level). */
  hpPerLevelMultiplier?: number; // Now optional, only used by ShadowEmber for prologue
  /** Base clicks/actions to trigger Fury. */
  baseFuryActivationThreshold: number;
  /** The AI "brain" this archetype uses. */
  aiType: AIType;
  /** Preferred board sizes for encounters. */
  preferredBoardSizes?: ('small' | 'medium' | 'large')[];
  /** Preferred item densities on the board. */
  preferredBoardDensities?: ('low' | 'medium' | 'high')[];
  /** Keys for preferred item distribution patterns. */
  preferredObjectRatioKeys?: string[];
  /** ID of a FuryAbility this archetype might always have if Elite/Boss. */
  fixedFuryId?: string;
  /** ID of a DomainAbilityDefinition for Boss rank. */
  domainAbilityId?: string;
  /** Flag for special enemies (e.g., prologue). */
  isSpecial?: boolean;
  /** Flag for archetypes like Illusionist that might create board "holes" or other irregular patterns. */
  generatesIrregularPatterns?: boolean;
}

/**
 * @interface RankDefinition
 * @description Defines multipliers and properties for different enemy ranks.
 */
export interface RankDefinition {
  /** Multiplier for base HP. */
  hpMultiplier?: number; // Obsolete for general HP calculation, now optional
  /** Multiplier for Fury activation threshold (e.g., 0.8 for faster Fury). */
  furyActivationThresholdMultiplier: number;
  /** How many additional fixed Fury abilities this rank gets. */
  fixedFurySlots: number;
  /** True if this rank can have a domain ability (typically Boss). */
  hasDomainAbility: boolean;
}

/**
 * @interface BoardParameters
 * @description Parameters defining the structure and content of a game board for an encounter.
 */
export interface BoardParameters {
  /** Number of rows. */
  rows: number;
  /** Number of columns. */
  cols: number;
  /** Percentage of cells that will contain items (Attack, Gold, Trap) (0-100). */
  densityPercent: number;
  /** Key to look up an ObjectRatioDefinition for item distribution. */
  objectRatioKey: string;
  /** Explicit count of traps on the board. */
  traps: number;
  /** Type of irregular pattern, if any (e.g., holes for Illusionist). */
  irregularPatternType?: 'ilusionista_holes' | null;
}

/**
 * @interface ObjectRatioDefinition
 * @description Defines the ratio of different interactable objects on the board.
 * These are relative proportions, not absolute counts.
 */
export interface ObjectRatioDefinition {
  /** Proportion of Attack items. */
  attacks: number;
  /** Proportion of Gold items. */
  gold: number;
}

/**
 * @interface FloorEncounterConfig
 * @description Configuration for a possible enemy encounter on a specific floor.
 */
export interface FloorEncounterConfig {
  /** Archetype of the enemy in this encounter. */
  archetypeId: EnemyArchetypeId;
  /** Rank of the enemy. */
  rank: EnemyRank;
  /** Weight for random selection among possible encounters on this floor. */
  weight: number;
}

/**
 * @interface FloorDefinition
 * @description Defines the characteristics of a specific floor in the game, influencing encounter generation.
 */
export interface FloorDefinition {
  /** The numerical identifier of the floor (e.g., 1, 2, 3). */
  floorNumber: number;
  /** Display name of the floor (e.g., "Piso 1: Las Cámaras Resonantes"). */
  name: string;
  /** List of possible enemy encounters on this floor with their selection weights. */
  possibleEncounters: FloorEncounterConfig[];
  /** Defines ranges for board dimensions for this floor. */
  boardSizeRange: {
    minRows: number; maxRows: number;
    minCols: number; maxCols: number;
  };
  /** Defines range for item density percentage on this floor. */
  boardDensityRange: {
    min: number; max: number;
  };
  /** List of ObjectRatioDefinition keys usable on this floor. */
  availableObjectRatioKeys: string[];
  /** Minimum number of traps on boards for this floor. */
  minTraps: number;
  /** Maximum number of traps on boards for this floor. */
  maxTraps: number;
}

/**
 * @interface Encounter
 * @description Represents a complete encounter setup, including the enemy and board parameters.
 */
export interface Encounter {
  /** The enemy instance for this encounter. */
  enemy: EnemyInstance;
  /** The board parameters for this encounter. */
  boardParams: BoardParameters;
}
// --- End Dynamic Difficulty System Types ---

/**
 * @deprecated Replaced by `EnemyInstance`.
 * @description Represents the state of an enemy.
 */
export interface EnemyState {
  hp: number;
  maxHp: number;
  /** @deprecated Use `currentFuryCharge` in `EnemyInstance`. */
  fury: number;
  /** @deprecated Use `furyActivationThreshold` in `EnemyInstance`. */
  maxFury: number;
  name: string;
  /** @deprecated Use `archetypeId` from `EnemyInstance.baseArchetype`. */
  archetypeId?: string;
  armor: number;
  nextEnemyFuryIsDoubled?: boolean;
}

/**
 * @enum EchoEffectType
 * @description Enum for the various types of effects an Echo can have.
 */
export enum EchoEffectType {
  /** Modifies how clues are displayed or interpreted. */
  UpdateClueSystem = 'update_clue_system',
  /** Heals the player. */
  GainHP = 'gain_hp',
  /** Increases player's maximum HP. */
  IncreaseMaxHP = 'increase_max_hp',
  /** @deprecated Functionality now handled by specific Ecos or general crit systems. */
  SwordCritChance = 'sword_crit_chance',
  /** Reduces damage from the first enemy Attack reveal. */
  FirstBombDamageReduction = 'first_bomb_damage_reduction',
  /** Revealing a '0' clue reveals adjacent cells. */
  CascadeReveal = 'cascade_reveal',
  /** Reveals a nearby hidden item (used by Ojo Omnisciente). */
  RevealNearestItem = 'reveal_nearest_item',
  /** Allows player to mark cells with various icons. */
  EnableCellMarking = 'enable_cell_marking',
  /** Temporary damage buff after taking Attack damage (Venganza Espectral). */
  TempDamageBuffAfterBomb = 'temp_damage_buff_after_bomb',
  /** Grants invulnerability and crits at low HP (Último Aliento). */
  LastStandInvulnerabilityCrit = 'last_stand_invulnerability_crit',
  /** Bonus damage for consecutive player Attack reveals (Maestría Estocada, Torrente Acero). */
  ComboDamageBonus = 'combo_damage_bonus',
  /** (Not directly used as a player stat, gold is uncapped) */
  IncreaseMaxGold = 'increase_max_gold',
  /** Start levels with extra gold (Bolsa Agrandada). */
  StartWithBonusGold = 'start_with_bonus_gold',
  /** Chance for gold cells to yield double (Instinto Buscador). */
  DoubleGoldChance = 'double_gold_chance',
  /** Spend gold to ignore damage from an enemy Attack reveal (Alquimia Improvisada). */
  SpendGoldIgnoreBomb = 'spend_gold_ignore_bomb',
  /** Sacrifice HP for a powerful effect (Corazón del Abismo). */
  SacrificeHpForPower = 'sacrifice_hp_for_power',
  /** Ignore the first trap encountered in a level (Paso Ligero). */
  IgnoreFirstTrap = 'ignore_first_trap',
  /** Reduces the negative impact of enemy Fury abilities (Voluntad Inquebrantable). */
  ReduceFuryEffectPotency = 'reduce_fury_effect_potency',
  /** Affects meta-progression currencies or unlocks (not currently used by player-acquired Ecos). */
  MetaProgressionBonus = 'meta_progression_bonus',
  /** Improves the quality of Echo choices offered (Aprendizaje Rápido). */
  ImproveEchoChoice = 'improve_echo_choice',
  /** Placeholder for Ecos with effects handled directly in game logic or unique interactions. */
  GenericPlaceholder = 'generic_placeholder',
}

/**
 * @enum Rarity
 * @description Enum for the rarity of Ecos and Fury abilities.
 */
export enum Rarity {
  Common = 'Common',
  Rare = 'Rare',
  Epic = 'Epic',
  Legendary = 'Legendary',
}

/**
 * @interface Echo
 * @description Represents an Echo (passive ability or activatable effect).
 */
export interface Echo {
  /** Unique ID for this specific Echo instance (e.g., 'eco_vision_aurea_1'). */
  id: string;
  /** Base ID for the Echo family (e.g., 'base_vision_aurea'). Used for tracking upgrades and tree prerequisites. */
  baseId: string;
  /** Display name of the Echo. */
  name: string;
  /** Level of the Echo (for multi-level Ecos like Visión Áurea, Cascada). */
  level: number;
  /** Description of its effect. Can include HTML for formatting. */
  description: string;
  /** Emoji/icon for UI representation. */
  icon: string;
  /** Gold cost to acquire this Echo. */
  cost: number;
  /** True if this Echo is offered for free (e.g., initial HP recovery choice). */
  isFree?: boolean;
  /** The type of effect this Echo provides. */
  effectType: EchoEffectType;
  /** Value associated with the effect (e.g., damage amount, duration, chance, specific config object). */
  value?: any;
  /** Rarity of the Echo, influencing its power and appearance frequency. */
  rarity: Rarity;
  /** Multiplier for the Echo's effect (e.g., from Corazón del Abismo duplication). */
  effectivenessMultiplier?: number;
  /** Points contributed towards awakening new Fury abilities in meta-progression when unlocked from the tree. */
  awakeningPoints?: number;
}

/** Type alias for the ID of an active Echo. Typically corresponds to `Echo['id']`. */
export type ActiveEchoId = string;

/**
 * @enum GameStatus
 * @description Enum for the various states/screens of the game.
 */
export enum GameStatus {
  /** Main menu screen. */
  MainMenu = 'MainMenu',
  /** Intro screen before prologue. */
  IntroScreen = 'IntroScreen',
  /** Actively playing a level. */
  Playing = 'Playing',
  /** Screen shown after completing a level (Echo choice, map navigation trigger). */
  PostLevel = 'PostLevel',
  /** Player won the entire run. */
  GameOverWin = 'GameOverWin',
  /** Player lost the run. */
  GameOverDefeat = 'GameOverDefeat',
  /** Sandbox testing mode. */
  Sandbox = 'Sandbox',
  /** Game settings menu. */
  SettingsMenu = 'SettingsMenu',
  /** Meta-progression hub screen (Eco Tree, Mirror, Goals). */
  Sanctuary = 'Sanctuary',
  /** Specific sanctuary screen for Mirror upgrades. */
  MirrorOfSelf = 'MirrorOfSelf',
  /** Specific sanctuary screen for Goals/Achievements. */
  FeatsBoard = 'FeatsBoard',
  /** Screen for navigating the Abyss Map between stretches of levels. */
  AbyssMapView = 'AbyssMapView',
}

/**
 * @deprecated Replaced by `BoardParameters` for dynamic encounter generation.
 * @description Basic configuration for a game board, used primarily in early development or prologue.
 */
export interface BoardConfig {
  /** Number of Attack items. */
  attacks: number;
  /** Number of Gold items. */
  gold: number;
  /** Optional number of rows. */
  rows?: number;
  /** Optional number of columns. */
  cols?: number;
  /** Optional number of traps. */
  traps?: number;
}

/**
 * @deprecated Replaced by `FloorDefinition` for dynamic difficulty.
 * @description Configuration for a bracket of levels in older game versions.
 */
export interface LevelBracketConfig {
  levelRange: [number, number];
  boardConfig: BoardConfig;
  /** @deprecated Old enemy archetype ID system. */
  enemyArchetypeIds: string[];
}

/**
 * @enum FuryAbilityEffectType
 * @description Enum for the types of effects an enemy Fury ability can have.
 */
export enum FuryAbilityEffectType {
  /** Damages the player directly. */
  PlayerDamage = 'player_damage',
  /** Causes the player to lose gold. */
  PlayerGoldLoss = 'player_gold_loss',
  /** Heals the enemy. */
  EnemyHeal = 'enemy_heal',
  /** Adds Attack items to the board. */
  BoardAddAttacks = 'board_add_attacks',
  /** Damages player and causes gold loss. */
  PlayerDamageAndGoldLoss = 'player_damage_and_gold_loss',
  /** Damages player based on a percentage of their max HP. */
  PlayerPercentMaxHpDamage = 'player_percent_max_hp_damage',
  /** Adds a mix of items (Attack, Gold, Traps) to an area of the board. */
  BoardAddMixedItems = 'board_add_mixed_items',
  /** Re-hides and re-randomizes a section of the board. */
  BoardRegenerateSection = 'board_regenerate_section',
  /** Hides some revealed clue cells. */
  BoardHideClues = 'board_hide_clues',
  /** Hides all revealed clue cells. */
  BoardHideAllClues = 'board_hide_all_clues',
  /** Enemy gains temporary or permanent armor. */
  EnemyGainArmor = 'enemy_gain_armor',
  /** Enemy heals and gains Fury charge. */
  EnemyHealAndFuryCharge = 'enemy_heal_and_fury_charge',
  /** Buffs enemy and makes their next Fury trigger twice. */
  EnemyBuffAndDoubleFury = 'enemy_buff_and_double_fury',
  /** Temporarily deactivates a random player Echo. */
  DeactivateRandomEcho = 'deactivate_random_echo',
  /** More potent Echo disruption (e.g., deactivates or increases next Echo cost). */
  DeactivateEchoOrIncreaseCost = 'deactivate_echo_or_increase_cost',
  /** Severe Echo and Oracle disruption (e.g., deactivates all Echos and makes next Oracle offer only common Furies). */
  DeactivateAllEchosAndNerfOracle = 'deactivate_all_echos_and_nerf_oracle',
  /** Clues show incorrect numbers for a duration. */
  BoardMisleadingClues = 'board_misleading_clues',
  /** All clues become visually obscured (e.g., '?') for a duration. */
  BoardObscureAllClues = 'board_obscure_all_clues',
  /** Enemy gains a burst of Fury charge. */
  EnemyAccelerateFury = 'enemy_accelerate_fury',
  /** Player's Attack reveals deal less damage for a duration. */
  PlayerDebuffSwordDamage = 'player_debuff_sword_damage',
  /** Player takes recoil damage when their Attack reveals hit the enemy. */
  PlayerRecoilDamageOnSwordHit = 'player_recoil_damage_on_sword_hit',
  /** Swaps current HP values of player and enemy (very rare/powerful). */
  SwapPlayerEnemyHp = 'swap_player_enemy_hp',
  /** Player's Attack reveals have a chance to do no damage. */
  PlayerChanceToFailAttack = 'player_chance_to_fail_attack',
  /** Partially fills the enemy's Fury bar for the next activation. */
  EnemyFuryBarPartialFill = 'enemy_fury_bar_partial_fill',
  /** Chance to deactivate player's most recently acquired Echo for a few clicks. */
  PlayerTemporaryEcoDeactivation = 'player_temporary_eco_deactivation',
  /** Visual effects like flickering clues or screen shake (primarily cosmetic). */
  BoardVisualDisruption = 'board_visual_disruption',
  /** Player loses gold, and the enemy heals. */
  PlayerGoldLossAndEnemyHeal = 'player_gold_loss_and_enemy_heal',
}

/**
 * @interface FuryAbility
 * @description Represents an enemy Fury ability (special attack).
 */
export interface FuryAbility {
  /** Unique ID for the Fury ability. */
  id: string;
  /** Display name of the Fury ability. */
  name: string;
  /** Description of its effect. Can include HTML for formatting. */
  description: string;
  /** Emoji/icon for UI representation. */
  icon: string;
  /** Type of effect this Fury ability has. */
  effectType: FuryAbilityEffectType;
  /** Value associated with the effect (e.g., damage amount, duration, specific config object). */
  value: any;
  /** Rarity of the Fury ability. */
  rarity: Rarity;
}

/**
 * @typedef FuryMinigamePhase
 * @description Type alias for the different phases of the Oracle (Fury selection) Minigame.
 */
export type FuryMinigamePhase =
  | 'inactive'         // Minigame is not active
  | 'starting'         // Initial setup, preparing to show cards
  | 'reveal_cards'     // Cards are appearing and turning face up
  | 'cards_revealed'   // Cards are face up, player memorizes
  | 'flipping_to_back' // Cards are flipping to their backs
  | 'shuffling'        // Cards are being shuffled visually
  | 'ready_to_pick'    // Player can select a card
  | 'card_picked'      // Player has selected a card, selection animation plays
  | 'revealing_choice' // The chosen card is revealed
  | 'showing_results'; // (Potentially unused, 'inactive' might cover this post-reveal state)

/**
 * @typedef FloatingTextType
 * @description Type alias for the different visual styles of floating text feedback.
 */
export type FloatingTextType =
  | 'damage-player'   // Damage dealt to player
  | 'damage-enemy'    // Damage dealt to enemy
  | 'heal-player'     // Player healing
  | 'gold-player'     // Gold gained by player
  | 'info'            // Generic informational text (e.g., status effect applied)
  | 'armor-gain'      // Armor gained (player or enemy)
  | 'armor-break';    // Armor broken (player or enemy)

/**
 * @interface FloatingTextEventPayload
 * @description Payload for a 'FLOATING_TEXT' game event.
 */
export interface FloatingTextEventPayload {
  /** The text to display. */
  text: string;
  /** Visual style of the text. */
  type: FloatingTextType;
  /** Optional ID of an HTML element from which the text should originate (e.g., player stats, enemy stats, specific cell). */
  targetId?: string;
}

/**
 * @interface GameEvent
 * @description Generic game event structure for queuing UI feedback like floating text or sound effects.
 */
export interface GameEvent {
  /** Unique ID for the event instance. */
  id: string;
  /** Type of event (e.g., 'FLOATING_TEXT', 'SOUND_EFFECT'). */
  type: 'FLOATING_TEXT' | 'SOUND_EFFECT';
  /** Payload specific to the event type. */
  payload: FloatingTextEventPayload | any; // `any` for potential sound effect payloads
}

/**
 * @typedef GoalEventType
 * @description Type alias for events relevant to goal tracking and achievement progress.
 */
export type GoalEventType =
  | 'ENEMY_DEFEATED'                // When an enemy is defeated
  | 'CELL_REVEALED'                 // When a cell is revealed (by player or enemy)
  | 'LEVEL_COMPLETED_NO_DAMAGE'     // When a level is completed without taking HP damage
  | 'PROLOGUE_COMPLETED'            // When the prologue is successfully completed
  | 'SANCTUARY_FIRST_VISIT'       // When the player visits the Sanctuary hub for the first time
  | 'LEVEL_COMPLETED_IN_RUN'        // When any level (excluding prologue) is completed in a run
  | 'FIRST_ECO_UNLOCKED'            // When the player unlocks their first Eco from the Sanctuary tree
  | 'UNIQUE_ECO_ACTIVATED'          // When a unique baseId Echo is activated in a run
  | 'UNIQUE_FURY_EXPERIENCED';      // When a unique Fury ID is experienced in a run

/**
 * @interface GoalEnemyDefeatedPayload
 * @description Payload for 'ENEMY_DEFEATED' goal event.
 */
export interface GoalEnemyDefeatedPayload {
  /** Archetype of the defeated enemy. */
  enemyArchetypeId?: EnemyArchetypeId;
}

/**
 * @interface GoalCellRevealedPayload
 * @description Payload for 'CELL_REVEALED' goal event.
 */
export interface GoalCellRevealedPayload {
  /** Type of cell revealed. */
  cellType: CellType;
  /** True if player revealed, false if enemy revealed. */
  revealedByPlayer: boolean;
}

/**
 * @interface GoalLevelCompletedPayload
 * @description Payload for 'LEVEL_COMPLETED_NO_DAMAGE' or 'LEVEL_COMPLETED_IN_RUN' goal events.
 */
export interface GoalLevelCompletedPayload {
  /** The level number (run level) that was completed. */
  levelNumber: number;
}

/**
 * @typedef GuidingTextKey
 * @description Key for FTUE (First Time User Experience) guiding text messages.
 * Can be a numeric step from prologue messages or specific string keys for other events.
 */
export type GuidingTextKey =
  | keyof typeof import('./constants').PROLOGUE_MESSAGES // Keys from prologue messages (numeric as string or number)
  | 'BATTLEFIELD_REDUCTION_START' // Text for when battlefield reduction starts
  | 'BATTLEFIELD_REDUCTION_COMPLETE' // Text for when battlefield reduction completes
  | ''; // Empty string for no guiding text

// --- Abyss Map Types ---

/**
 * @enum BiomeId
 * @description Unique identifiers for biomes in the Abyss Map.
 */
export enum BiomeId {
  Default = 'default_resonant_chambers',
  BrokenBazaar = 'broken_bazaar',
  BloodForge = 'blood_forge',
  CrystalGallery = 'crystal_gallery', // Future biome
  SilentLibrary = 'silent_library',   // Future biome
  InfectedGarden = 'infected_garden'  // Future biome
}

/**
 * @enum MapRewardType
 * @description Types of rewards a map node or path can offer.
 */
export enum MapRewardType {
  None = 'none',                      // No special reward for this path/node
  ExtraGold = 'extra_gold',           // Modifies gold generation in the stretch (Path of the Avaricious)
  SoulFragments = 'soul_fragments',   // Awarded at end of stretch (Senda del Alma)
  WillLumens = 'will_lumens',         // Awarded at end of stretch (Destello de Voluntad)
  FreeEcho = 'free_echo',             // Special node: grants a free Echo choice (Santuario Olvidado)
  HealingFountain = 'healing_fountain',// Special node: heals player (Santuario Olvidado)
  EchoForge = 'echo_forge',           // Special node: allows Echo upgrade (Santuario Olvidado)
}

/**
 * @enum MapEncounterType
 * @description Types of encounters a map node can represent.
 */
export enum MapEncounterType {
  Standard = 'standard',              // Typically Minion rank enemy
  Elite = 'elite',                    // Elite rank enemy
  Boss = 'boss',                      // Boss rank enemy
  ArchetypeSpecific = 'archetype_specific', // Guarantees a specific enemy archetype
}

/**
 * @interface RunMapNode
 * @description Represents a single node in the current run's Abyss Map.
 */
export interface RunMapNode {
  /** Unique ID for the node (e.g., 'mapnode-0', 'mapnode-1'). */
  id: string;
  /** Depth layer of the node in the map (0 for start, increasing with depth). */
  layer: number;
  /** Biome associated with this node. */
  biomeId: BiomeId;
  /** Type of encounter at this node (Standard, Elite, Boss, etc.). */
  encounterType: MapEncounterType;
  /** Specifics if encounter is archetype-specific (e.g., which archetype). */
  encounterDetails?: { archetypeId?: EnemyArchetypeId };
  /** Type of reward this node's path offers upon completion of the stretch. */
  rewardType: MapRewardType;
  /** Value of the reward (e.g., amount of gold, HP healed, number of fragments/lumens). */
  rewardValue?: number;
  /** IDs of connected child nodes (paths leading from this node). */
  childrenNodeIds: string[];
  /** True if this is the player's current location on the map. */
  isCurrent: boolean;
  /** True if this node's path has been completed. */
  isCompleted: boolean;
}

/**
 * @interface RunMapState
 * @description State of the current run's Abyss Map.
 */
export interface RunMapState {
  /** All nodes in the map, keyed by ID. */
  nodes: Record<string, RunMapNode>;
  /** ID of the starting node of the map. */
  startNodeId: string;
  /** ID of the player's current node on the map. */
  currentNodeId: string;
  /** Total depth (number of layers) of the map. */
  mapDepth: number;
}

/**
 * @interface BiomeDefinition
 * @description Definition for a biome, including its properties and potential modifiers.
 */
export interface BiomeDefinition {
  /** Unique ID of the biome. */
  id: BiomeId;
  /** Display name of the biome. */
  name: string;
  /** Emoji/icon for UI representation. */
  icon: string;
  /** Flavor text or description of the biome. */
  description: string;
  /** Tailwind background class for the game screen when this biome is active. */
  backgroundColor: string;
  /** Tailwind border class for map nodes in this biome. */
  nodeColorClass: string;
  /** Optional function to modify board parameters based on the biome and node properties. */
  boardModifiers?: (boardParams: BoardParameters, currentLevel: number, nodeRewardType?: MapRewardType) => BoardParameters;
}
// --- End Abyss Map Types ---

// --- Turn-Based System Types ---

/**
 * @enum GamePhase
 * @description Enum defining the major phases of the game turn.
 */
export enum GamePhase {
  /** Player is actively deciding their move. */
  PLAYER_TURN = 'PLAYER_TURN',
  /** Player's action is being processed (animations, effects). */
  PLAYER_ACTION_RESOLVING = 'PLAYER_ACTION_RESOLVING',
  /** AI is deciding its move, visual thinking process may be active. */
  ENEMY_THINKING = 'ENEMY_THINKING',
  /** AI has chosen a target cell, which is highlighted on the board before reveal. */
  ENEMY_ACTION_PENDING_REVEAL = 'ENEMY_ACTION_PENDING_REVEAL',
  /** AI's action is being processed (animations, effects, Fury application). */
  ENEMY_ACTION_RESOLVING = 'ENEMY_ACTION_RESOLVING',
  /** Player has been defeated, playing out any final effects or animations. */
  PRE_DEFEAT_SEQUENCE = 'PRE_DEFEAT_SEQUENCE',
  /** Player has won, playing out any final effects or animations. */
  PRE_VICTORY_SEQUENCE = 'PRE_VICTORY_SEQUENCE',
}

/**
 * @interface AICellInfo
 * @description Information about a cell being "thought about" or targeted by the AI for UI visualization.
 */
export interface AICellInfo {
  row: number;
  col: number;
}

/**
 * @interface CellPosition
 * @description Represents a specific cell position (row, column) on the board.
 */
export interface CellPosition {
    row: number;
    col: number;
}
// --- End Turn-Based System Types ---

/**
 * @interface GameStateCore
 * @description Core state of the game, managed by `useGameEngine`. This encapsulates the dynamic aspects of a run.
 */
export interface GameStateCore {
  /** Current overall status/screen of the game (MainMenu, Playing, PostLevel, etc.). */
  status: GameStatus;
  // currentPhase is now managed by useGamePhaseManager hook
  /** Overall run level (e.g., 1, 2, 3...). Starts at 0 for Prologue. */
  currentLevel: number;
  /** Current difficulty floor (Piso) affecting encounter generation. */
  currentFloor: number;
  // Fury Minigame state is now managed by useFuryMinigame hook
  // isFuryMinigameActive: boolean;
  // furyMinigamePhase: FuryMinigamePhase;
  // furyMinigameCompletedForThisLevel: boolean; // This might still be needed in GameStateCore or derived
  // furyCardOptions: FuryAbility[];
  // shuffledFuryCardOrder: number[];
  // playerSelectedFuryCardDisplayIndex: number | null;
  // oracleSelectedFuryAbility: FuryAbility | null; // This is also returned by useFuryMinigame and might be stored in GameStateCore
  /** True if the game is currently in the prologue sequence. */
  isPrologueActive: boolean;
  /** Current step in the prologue's FTUE sequence. */
  prologueStep: number;
  /** Specific Fury ability for the prologue enemy (typically a very weak one). */
  prologueEnemyFuryAbility: FuryAbility | null;
  // conditionalEchoTriggeredId is now managed by useAbilityHandler hook
  // Fury Minigame state (isFuryMinigameActive, furyMinigamePhase, etc.) is managed by useFuryMinigame.
  // GameStateCore retains oracleSelectedFuryAbility and furyMinigameCompletedForThisLevel, updated by useGameEngine.
  furyMinigameCompletedForThisLevel: boolean;
  oracleSelectedFuryAbility: FuryAbility | null;
  // isPrologueActive, prologueStep, prologueEnemyFuryAbility are now managed by usePrologueManager hook.
  // guidingTextKey is also closely related to prologue flow.
  isPrologueActive: boolean; // To be removed or updated by usePrologueManager's effects
  prologueStep: number; // To be removed or updated by usePrologueManager's effects
  prologueEnemyFuryAbility: FuryAbility | null; // To be removed or updated by usePrologueManager's effects
  guidingTextKey: GuidingTextKey; // Potentially moved or managed via prologueManager too

  /** True if 'Corazón del Abismo' choice UI is active. */
  isCorazonDelAbismoChoiceActive: boolean;
  /** Options for 'Corazón del Abismo' (random Epic Echo or duplicable active Echos). */
  corazonDelAbismoOptions: {
    randomEpicEcho: Echo | null;
    duplicableActiveEcos: Echo[];
  } | null;
  // eventQueue is now managed by useGameEvents hook
  /** True if player has taken HP damage in the current level (used for some goal tracking). */
  playerTookDamageThisLevel: boolean;
  /** Current level of battlefield reduction (0 for normal, 1+ for reduced arenas). */
  currentArenaLevel: number;
  /** Maximum number of times the battlefield can reduce in the current encounter. */
  maxArenaReductions: number;
  /** True if the battlefield reduction animation/transition is currently playing. */
  isBattlefieldReductionTransitioning: boolean;
  /** Key for the current FTUE/guiding text message to display. */
  guidingTextKey: GuidingTextKey;
  /** Specific reason for defeat (e.g., 'attrition' from battlefield reduction, 'standard' otherwise). */
  defeatReason?: 'attrition' | 'standard';
  /** Current dimensions (rows, cols) of the game board. Can change due to battlefield reduction. */
  currentBoardDimensions: { rows: number; cols: number };
  // Abyss Map state (currentRunMap, currentBiomeId, etc.) is now managed by useRunMapManager hook
  // currentRunMap: RunMapState | null;
  // currentBiomeId: BiomeId;
  // levelsInCurrentStretch: number;
  // currentStretchCompletedLevels: number;
  // stretchStartLevel: number;
  // mapDecisionPending: boolean;
  // stretchRewardPending: { type: MapRewardType, value?: number } | null;
  /** True if player has taken their post-level action (e.g., Echo choice, Corazon choice). */
  postLevelActionTaken: boolean; // This might also move or be re-evaluated with new hooks
  /** Coordinates of the cell the AI is currently "thinking" about (for UI highlight). */
  aiThinkingCellCoords: AICellInfo | null;
  /** Coordinates of the cell the AI has targeted for its action (for UI highlight before reveal). */
  aiActionTargetCell: AICellInfo | null;
}

/**
 * @interface SandboxPlayerConfig
 * @description Configuration for player stats in Sandbox mode.
 */
export interface SandboxPlayerConfig {
  hp: number;
  maxHp: number;
  gold: number;
  shield: number;
}

/**
 * @interface SandboxEnemyConfig
 * @description Configuration for enemy stats in Sandbox mode.
 */
export interface SandboxEnemyConfig {
  hp: number;
  maxHp: number;
  /** Current Fury charge. */
  fury: number;
  /** Fury activation threshold. */
  maxFury: number;
  name: string;
  armor: number;
  /** Allows setting a specific archetype for sandbox testing, influencing AI behavior if mapped. */
  archetypeId?: EnemyArchetypeId;
}

/**
 * @interface ItemLockConfig
 * @description Configuration for item locking behavior in Sandbox board generation.
 * If an item count is locked, it won't be auto-adjusted when other counts or total cells change.
 */
export interface ItemLockConfig {
  /** If true, number of Attack items is fixed. */
  attacksLocked: boolean;
  /** If true, number of Gold items is fixed. */
  goldLocked: boolean;
  /** If true, number of Clue items is fixed. */
  cluesLocked: boolean;
}

/**
 * @interface SandboxBoardConfig
 * @description Configuration for the board in Sandbox mode.
 */
export interface SandboxBoardConfig {
  rows: number;
  cols: number;
  /** Number of Attack items. */
  attacks: number;
  /** Number of Gold items. */
  gold: number;
  /** Number of Clue items. Traps are usually calculated based on remaining cells or a small fixed number. */
  clues: number;
  /** Optional seed for reproducible board generation (not currently implemented). */
  seed?: string;
}

/**
 * @interface SandboxConfig
 * @description Overall configuration for Sandbox mode.
 */
export interface SandboxConfig {
  player: SandboxPlayerConfig;
  enemy: SandboxEnemyConfig;
  board: SandboxBoardConfig;
  /** Item locking configuration for board generation. */
  itemLocks: ItemLockConfig;
  /** If true, attempts to maintain item ratios when one unlocked item count changes. */
  lockItemRatios: boolean;
}

/**
 * @interface SandboxState
 * @description State specific to the Sandbox mode.
 */
export interface SandboxState {
  /** If true, player is invulnerable and other debug features may be active. */
  isGodMode: boolean;
  /** If true, all cells on the board are revealed. */
  isRevealAll: boolean;
  /** Log of actions and events in Sandbox mode for debugging. */
  eventLog: string[];
  /** True if a sandbox simulation is currently active (config applied, board generated). */
  isSimulationRunning: boolean;
}

/**
 * @interface RunStats
 * @description Statistics tracked for a single run, displayed on the end screen.
 */
export interface RunStats {
  /** Total number of enemies defeated in this run. */
  enemiesDefeatedThisRun: number;
  /** Number of Attack tiles revealed by the player (acting as Sword). */
  attacksTriggeredByPlayer: number;
  /** Number of Attack tiles revealed by the enemy (acting as Bomb for player). */
  attacksTriggeredByEnemy: number;
  /** Total number of Gold cells revealed in this run. */
  goldCellsRevealedThisRun: number;
  /** Total number of player clicks on the board in this run. */
  clicksOnBoardThisRun: number;
  /** Number of Ecos acquired that were not free. */
  nonFreeEcosAcquiredThisRun: number;
  /** Number of traps triggered in this run (by player or enemy). */
  trapsTriggeredThisRun: number;
  /** Total Soul Fragments earned in this run (before end-of-run multipliers). */
  soulFragmentsEarnedThisRun: number;
  /** Number of levels completed without taking HP damage in this run. */
  levelsCompletedWithoutDamageThisRun: number;
  /** Total number of levels completed in this run. */
  levelsCompletedThisRun: number;
  /** Base IDs of unique Ecos activated during this run (for goal tracking). */
  runUniqueEcosActivated: string[];
  /** IDs of unique Furies experienced during this run (for goal tracking). */
  runUniqueFuriesExperienced: string[];
  /** IDs of goals completed for the first time ever during this run (for end-screen notification). */
  newlyCompletedGoalIdsThisRun: string[];
  /** @deprecated Renamed to `attacksTriggeredByPlayer` for clarity, but might be used by older MirrorUpgrade keys. */
  swordUsedThisLevel: boolean;
  /** @deprecated Renamed to `attackUsedThisLevelForMirror` for Golpe Certero, check if MirrorUpgrade uses this specific key. */
  swordUsedThisLevelForMirror: boolean;
}

/**
 * @interface MirrorUpgradeLevelDefinition
 * @description Defines a single level of a Mirror Upgrade.
 */
export interface MirrorUpgradeLevelDefinition {
  /** The level number (1-indexed). */
  level: number;
  /** Cost in Will Lumens to reach this level from the previous one. */
  cost: number;
  /** The value of the effect at this specific level (often additive to previous levels if not handled by descriptionTemplate directly). */
  effectValue: number;
  /** Description of the effect specifically at this level (can be used if descriptionTemplate is not sufficient). */
  description: string;
}

/**
 * @enum MirrorUpgradeId
 * @description Unique identifiers for Mirror Upgrades.
 */
export enum MirrorUpgradeId {
  VigorPrimordial = 'vigorPrimordial',
  GolpeCerteroInicial = 'golpeCerteroInicial',
  FortunaErrante = 'fortunaErrante',
  ResguardoEfimero = 'resguardoEfimero',
  AfinidadAlmica = 'afinidadAlmica',
}

/**
 * @interface MirrorUpgradeDefinition
 * @description Defines a Mirror Upgrade available in the Sanctuary.
 */
export interface MirrorUpgradeDefinition {
  /** Unique ID for the Mirror Upgrade. */
  id: MirrorUpgradeId;
  /** Display name of the upgrade. */
  name: string;
  /** Emoji/icon for UI representation. */
  icon: string;
  /** Maximum achievable level for this upgrade. */
  maxLevel: number;
  /** Function to generate the description of the total effect based on the cumulative value. */
  descriptionTemplate: (cumulativeValue: number) => string;
  /** Array of level definitions, outlining cost and effect per level. */
  levels: MirrorUpgradeLevelDefinition[];
  /** What player stat or aspect this upgrade affects. */
  appliesTo: 'playerMaxHp' | 'playerStartGold' | 'playerStartShield' | 'playerFirstSwordDamage' | 'playerMaxSoulFragments';
}

/**
 * @interface GoalDefinition
 * @description Defines a Goal/Achievement in the Feats Board.
 */
export interface GoalDefinition {
  /** Unique ID for the goal. */
  id: string;
  /** Display name of the goal. */
  name: string;
  /** Description of how to achieve it. */
  description: string;
  /** Category for UI grouping (e.g., "Progreso", "Combate"). */
  category: string;
  /** Emoji/icon for UI representation. */
  icon: string;
  /** Will Lumens awarded upon claiming the completed goal. */
  rewardLumens: number;
  /** Target value to reach for quantifiable goals (e.g., defeat 10 enemies). Optional if goal is a one-time event. */
  targetValue?: number;
  /** Game event type that can progress this goal. */
  relevantEventType?: GoalEventType;
  /** Property of the event payload to check for matching conditions (e.g., 'enemyArchetypeId', 'cellType'). */
  eventPropertyToCheck?: 'enemyArchetypeId' | 'cellType' | 'levelNumber' | 'revealedByPlayer';
  /** Value the event property must match to count towards progress. */
  eventPropertyValueToMatch?: string | number | EnemyArchetypeId | boolean;
  /** IDs of other goals that must be completed before this one can be progressed or claimed. */
  prerequisitesGoalIds?: string[];
  /** True if progress for this goal resets at the start of each new run. */
  resetsPerRun?: boolean;
}

/**
 * @interface GoalProgress
 * @description Tracks the player's progress towards a specific Goal.
 */
export interface GoalProgress {
  /** Current progress value towards the `targetValue` (if applicable). */
  currentValue: number;
  /** True if the goal's target has been met. */
  completed: boolean;
  /** True if the reward for this completed goal has been claimed by the player. */
  claimed: boolean;
}

/**
 * @interface MetaProgressState
 * @description State of the player's meta-progression, saved between runs.
 */
export interface MetaProgressState {
  /** Current Soul Fragments currency, used for unlocking Ecos in the tree. */
  soulFragments: number;
  /** Maximum Soul Fragments player can hold, can be upgraded. */
  maxSoulFragments: number;
  /** Current Will Lumens currency, used for Mirror Upgrades. */
  willLumens: number;
  /** Player's current level for each Mirror Upgrade, keyed by upgrade ID. */
  mirrorUpgrades: Record<MirrorUpgradeId, number>;
  /** Player's progress for each Goal, keyed by goal ID. */
  goalsProgress: Record<string, GoalProgress>;
  /** Base IDs of Ecos permanently unlocked in the Eco Tree. */
  unlockedEchoBaseIds: string[];
  /** IDs of Fury abilities permanently awakened and added to the enemy's potential pool. */
  awakenedFuryIds: string[];
  /** Current progress points towards awakening the next Fury ability. */
  furyAwakeningProgress: number;
  /** Index in the `FURY_ABILITIES_TO_AWAKEN_SEQUENTIALLY` array, indicating the next Fury to awaken. */
  nextFuryToAwakenIndex: number;
  /** True if the player has not visited the Sanctuary yet (used for FTUE). */
  firstSanctuaryVisit: boolean;
}

/**
 * @interface EcoTreeNodeData
 * @description Data for a node in the Eco Tree structure, defining its unlock requirements and contribution.
 */
export interface EcoTreeNodeData {
  /** ID of the specific Echo this node represents (e.g., 'eco_vision_aurea_1', 'eco_vision_aurea_2'). */
  echoId: string;
  /** Base ID for the Echo family (e.g., 'base_vision_aurea'). Used for prerequisite checks. */
  baseId: string;
  /** Cost in Soul Fragments to unlock this Echo node. */
  cost: number;
  /** Array of base Echo IDs required to be unlocked before this one can be unlocked. */
  prerequisites: string[];
  /** Tier in the tree (for display grouping and visual progression). */
  tier: number;
  /** Points contributed towards Fury awakening when this Echo node is unlocked. */
  awakeningPoints?: number;
}

// --- AI-Specific Types for Information Sanitization ---

/**
 * @interface AISafeCell
 * @description A sanitized view of a cell, providing only the information the AI is allowed to see.
 */
export interface AISafeCell {
  /** Whether the cell has been revealed. */
  isRevealed: boolean;
  /** The type of the cell (Attack, Gold, Clue, etc.) if it is revealed. Undefined otherwise. */
  revealedType?: CellType;
  /** The player-placed mark on the cell, if any. AI can see marks. */
  markType?: MarkType | null;
  /** For revealed Clue cells, this is the total number of adjacent items (Attack, Gold, Trap etc., undiscriminated).
   *  Undefined for non-clue cells or unrevealed cells.
   */
  totalAdjacentItems?: number;
}

/**
 * @type AISafeBoardStateView
 * @description A 2D array representing the AI's sanitized view of the game board.
 * Each element is an AISafeCell.
 */
export type AISafeBoardStateView = AISafeCell[][];
