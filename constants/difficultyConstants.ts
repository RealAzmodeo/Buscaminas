
import {
  EnemyArchetypeId,
  EnemyRank,
  EnemyArchetypeDefinition,
  RankDefinition,
  FuryAbility,
  FuryAbilityEffectType,
  Rarity,
  DomainAbilityDefinition,
  FloorDefinition,
  ObjectRatioDefinition,
  FloorEncounterConfig,
  AIType, 
} from '../types';

// --- NEW HP CALCULATION BONUSES ---
export const BASE_ENEMY_HP = 3;

/**
 * Devuelve el bono de HP basado en la dificultad implícita por el nivel actual de la run.
 * Niveles 1-3 (Fácil): +0 HP
 * Niveles 4-6 (Medio): +1 HP
 * Niveles 7-9 (Difícil): +3 HP
 * Niveles 10+ (Pesadilla): +5 HP
 */
export const getDifficultyHpBonus = (currentRunLevel: number): number => {
  if (currentRunLevel <= 0) return 0; // Prólogo (aunque se maneja especial) o niveles base sin bono extra por dificultad.
  if (currentRunLevel >= 1 && currentRunLevel <= 3) return 0;  // Fácil
  if (currentRunLevel >= 4 && currentRunLevel <= 6) return 1;  // Medio
  if (currentRunLevel >= 7 && currentRunLevel <= 9) return 3;  // Difícil
  return 5; // Pesadilla (Nivel 10+)
};

export const ARCHETYPE_HP_BONUSES: Record<EnemyArchetypeId, number> = {
  [EnemyArchetypeId.Centinela]: 2,
  [EnemyArchetypeId.Muro]: 5,
  [EnemyArchetypeId.Enjambre]: 0,
  [EnemyArchetypeId.Ilusionista]: 2,
  [EnemyArchetypeId.Verdugo]: 1,
  [EnemyArchetypeId.Parasito]: 3,
  [EnemyArchetypeId.ShadowEmber]: 0, // No aplicable directamente por la nueva fórmula, se maneja especial.
};

export const RANK_HP_BONUSES: Record<EnemyRank, number> = {
  [EnemyRank.Minion]: 0,
  [EnemyRank.Elite]: 2,
  [EnemyRank.Boss]: 5,
};
// --- END NEW HP CALCULATION BONUSES ---

// --- Enemy Archetype Definitions ---
// baseHp y hpPerLevelMultiplier ya no se usarán para el cálculo de HP general,
// excepto para el Rescoldo de Sombra del prólogo.
export const ENEMY_ARCHETYPE_DEFINITIONS: Record<EnemyArchetypeId, EnemyArchetypeDefinition> = {
  [EnemyArchetypeId.Centinela]: {
    id: EnemyArchetypeId.Centinela,
    name: "Centinela Implacable",
    icon: "🛡️",
    baseHp: 20, // Obsoleto para HP, usado para Prólogo y referencia
    hpPerLevelMultiplier: 0.1, // Obsoleto para HP
    baseFuryActivationThreshold: 15, 
    aiType: AIType.Calculator, 
    preferredBoardSizes: ['medium'],
    preferredBoardDensities: ['medium'],
    preferredObjectRatioKeys: ['balanced', 'slightlyHostile'],
  },
  [EnemyArchetypeId.Muro]: {
    id: EnemyArchetypeId.Muro,
    name: "Muralla del Abismo",
    icon: "🧱",
    baseHp: 30, // Obsoleto para HP
    hpPerLevelMultiplier: 0.12, // Obsoleto para HP
    baseFuryActivationThreshold: 20,
    aiType: AIType.Brute, 
    preferredBoardSizes: ['large', 'medium'],
    preferredBoardDensities: ['low', 'medium'],
    preferredObjectRatioKeys: ['balanced', 'scarceAttacksPlayerFocus'],
    fixedFuryId: 'fury_muro_fortify', 
    domainAbilityId: 'domain_muro_steadfast', 
  },
  [EnemyArchetypeId.Enjambre]: {
    id: EnemyArchetypeId.Enjambre,
    name: "Enjambre Rápido",
    icon: "💨",
    baseHp: 12, // Obsoleto para HP
    hpPerLevelMultiplier: 0.08, // Obsoleto para HP
    baseFuryActivationThreshold: 10,
    aiType: AIType.Hoarder, 
    preferredBoardSizes: ['small', 'medium'],
    preferredBoardDensities: ['medium', 'high'],
    preferredObjectRatioKeys: ['hostile', 'manyAttacks'],
    fixedFuryId: 'fury_enjambre_overwhelm', 
  },
  [EnemyArchetypeId.Ilusionista]: {
    id: EnemyArchetypeId.Ilusionista,
    name: "Embaucador Espectral",
    icon: "🎭",
    baseHp: 18, // Obsoleto para HP
    hpPerLevelMultiplier: 0.09, // Obsoleto para HP
    baseFuryActivationThreshold: 16,
    aiType: AIType.Illusionist, 
    preferredBoardSizes: ['medium', 'large'], 
    preferredBoardDensities: ['medium'],
    preferredObjectRatioKeys: ['misleadingClues', 'balanced'], 
    fixedFuryId: 'fury_ilusionista_deceive', 
    domainAbilityId: 'domain_ilusionista_mirrorImage', 
    generatesIrregularPatterns: true, 
  },
  [EnemyArchetypeId.Verdugo]: {
    id: EnemyArchetypeId.Verdugo,
    name: "Verdugo Imparable",
    icon: "💀",
    baseHp: 15, // Obsoleto para HP
    hpPerLevelMultiplier: 0.1, // Obsoleto para HP
    baseFuryActivationThreshold: 12, 
    aiType: AIType.Calculator, 
    preferredBoardSizes: ['small', 'medium'],
    preferredBoardDensities: ['high', 'high'], 
    preferredObjectRatioKeys: ['hostile', 'scarceGold'],
    fixedFuryId: 'fury_verdugo_execute', 
    domainAbilityId: 'domain_verdugo_berserk', 
  },
  [EnemyArchetypeId.Parasito]: {
    id: EnemyArchetypeId.Parasito,
    name: "Parásito Drenador",
    icon: "🦠",
    baseHp: 22, // Obsoleto para HP
    hpPerLevelMultiplier: 0.08, // Obsoleto para HP
    baseFuryActivationThreshold: 18,
    aiType: AIType.Hoarder, 
    preferredBoardSizes: ['medium'],
    preferredBoardDensities: ['medium'],
    preferredObjectRatioKeys: ['resourceDrain', 'balanced'], 
    fixedFuryId: 'fury_parasito_leech', 
  },
  [EnemyArchetypeId.ShadowEmber]: { 
    id: EnemyArchetypeId.ShadowEmber,
    name: "Rescoldo de Sombra",
    icon: "🔥",
    baseHp: 2, // Usado para el HP fijo del Prólogo
    hpPerLevelMultiplier: 0, // No escala para el Prólogo
    baseFuryActivationThreshold: 999, 
    aiType: AIType.Default, 
    isSpecial: true, 
  },
  [EnemyArchetypeId.CentinelaDelAbismoFTUE]: {
    id: EnemyArchetypeId.CentinelaDelAbismoFTUE,
    name: "Centinela del Abismo (FTUE)",
    icon: "🛡️💧", // Placeholder icon
    baseHp: 4, // Fixed HP for FTUE Level 2
    hpPerLevelMultiplier: 0, // No scaling for this FTUE instance
    baseFuryActivationThreshold: 10, // Example: FTUE Lvl 2 Fury Threshold (GDD: 10 clicks)
    aiType: AIType.Default, // "Cazador Paciente" (Default AI is a placeholder)
    isSpecial: true,
    // No preferred board/density/ratio keys as FTUE boards are typically predefined
  },
};

// --- Rank Definitions ---
// hpMultiplier ya no se usará para el cálculo de HP general.
export const RANK_DEFINITIONS: Record<EnemyRank, RankDefinition> = {
  [EnemyRank.Minion]: {
    hpMultiplier: 1.0, // Obsoleto para HP
    furyActivationThresholdMultiplier: 1.0,
    fixedFurySlots: 0,
    hasDomainAbility: false,
  },
  [EnemyRank.Elite]: { 
    hpMultiplier: 1.8, // Obsoleto para HP
    furyActivationThresholdMultiplier: 0.9, 
    fixedFurySlots: 1, 
    hasDomainAbility: false,
  },
  [EnemyRank.Boss]: { 
    hpMultiplier: 3.0, // Obsoleto para HP
    furyActivationThresholdMultiplier: 0.8, 
    fixedFurySlots: 1, 
    hasDomainAbility: true, 
  },
};

// --- Pools of Fixed Abilities (Examples) ---
export const FIXED_FURY_ABILITIES_POOL: Record<string, FuryAbility> = {
  'fury_muro_fortify': { id: 'fury_muro_fortify', name: "Fortificar Baluarte", description: "El Muro gana <strong>10 Armadura</strong>.", icon: "🧱🛡️", effectType: FuryAbilityEffectType.EnemyGainArmor, value: 10, rarity: Rarity.Rare },
  'fury_enjambre_overwhelm': { id: 'fury_enjambre_overwhelm', name: "Oleada Incesante", description: "Añade <strong>3 Casillas de Ataque</strong> al tablero.", icon: "💨⚔️", effectType: FuryAbilityEffectType.BoardAddAttacks, value: 3, rarity: Rarity.Rare },
  'fury_ilusionista_deceive': { id: 'fury_ilusionista_deceive', name: "Velo de Engaño", description: "<strong>Todas las pistas</strong> se ocultan temporalmente por <strong>3 clics</strong>.", icon: "❓🎭", effectType: FuryAbilityEffectType.BoardObscureAllClues, value: {durationClicks: 3}, rarity: Rarity.Epic },
  'fury_verdugo_execute': { id: 'fury_verdugo_execute', name: "Golpe de Gracia", description: "Inflige <strong>30% del HP MÁXIMO</strong> del jugador como daño.", icon: "💀🎯", effectType: FuryAbilityEffectType.PlayerPercentMaxHpDamage, value: 0.30, rarity: Rarity.Epic },
  'fury_parasito_leech': { id: 'fury_parasito_leech', name: "Drenaje Vital", description: "El jugador pierde <strong>3 Oro</strong> y el Parásito recupera <strong>5 HP</strong>.", icon: "🦠💸", effectType: FuryAbilityEffectType.PlayerGoldLossAndEnemyHeal, value: { goldLoss: 3, enemyHeal: 5 }, rarity: Rarity.Rare },
};

export const DOMAIN_ABILITIES_POOL: Record<string, DomainAbilityDefinition> = {
  'domain_muro_steadfast': { id: 'domain_muro_steadfast', name: "Baluarte Inamovible", description: "Pasiva: El Muro no puede tener su Furia reducida por efectos de Ecos." },
  'domain_ilusionista_mirrorImage': { id: 'domain_ilusionista_mirrorImage', name: "Reflejos Fugaces", description: "Pasiva: Al recibir daño, 20% de probabilidad de ignorarlo y ocultar 2 pistas aleatorias." },
  'domain_verdugo_berserk': { id: 'domain_verdugo_berserk', name: "Frenesí Sangriento", description: "Pasiva: Cuando su HP está por debajo del 50%, su Furia se carga un 25% más rápido." },
};


// --- Object Ratio Definitions ---
export const OBJECT_RATIO_DEFINITIONS: Record<string, ObjectRatioDefinition> = {
  'balanced': { attacks: 7, gold: 2 },
  'hostile': { attacks: 7, gold: 1 },
  'scarceAttacksPlayerFocus': { attacks: 4, gold: 4 },
  'scarceGold': { attacks: 8, gold: 0.5 },
  'manyAttacks': { attacks: 7, gold: 2 },
  'richInGold': { attacks: 5, gold: 4 },
  'misleadingClues': { attacks: 6, gold: 3 },
  'resourceDrain': { attacks: 7, gold: 1 },
  'prologueFixed': { attacks: 3, gold: 3},
};

// --- Floor Definitions ---
const FLOOR_1_ENCOUNTERS: FloorEncounterConfig[] = [
  { archetypeId: EnemyArchetypeId.Centinela, rank: EnemyRank.Minion, weight: 60 },
  { archetypeId: EnemyArchetypeId.Muro, rank: EnemyRank.Minion, weight: 30 },
  { archetypeId: EnemyArchetypeId.Enjambre, rank: EnemyRank.Minion, weight: 10 },
];
const FLOOR_2_ENCOUNTERS: FloorEncounterConfig[] = [
  { archetypeId: EnemyArchetypeId.Centinela, rank: EnemyRank.Minion, weight: 30 },
  { archetypeId: EnemyArchetypeId.Muro, rank: EnemyRank.Minion, weight: 20 },
  { archetypeId: EnemyArchetypeId.Enjambre, rank: EnemyRank.Minion, weight: 20 },
  { archetypeId: EnemyArchetypeId.Ilusionista, rank: EnemyRank.Minion, weight: 15 },
  { archetypeId: EnemyArchetypeId.Centinela, rank: EnemyRank.Elite, weight: 10 }, 
  { archetypeId: EnemyArchetypeId.Parasito, rank: EnemyRank.Minion, weight: 5 },
];
const FLOOR_3_ENCOUNTERS: FloorEncounterConfig[] = [
  { archetypeId: EnemyArchetypeId.Verdugo, rank: EnemyRank.Minion, weight: 20 },
  { archetypeId: EnemyArchetypeId.Ilusionista, rank: EnemyRank.Minion, weight: 20 },
  { archetypeId: EnemyArchetypeId.Muro, rank: EnemyRank.Elite, weight: 15 },
  { archetypeId: EnemyArchetypeId.Enjambre, rank: EnemyRank.Elite, weight: 15 },
  { archetypeId: EnemyArchetypeId.Parasito, rank: EnemyRank.Elite, weight: 10 },
  { archetypeId: EnemyArchetypeId.Centinela, rank: EnemyRank.Boss, weight: 5 }, 
];


export const FLOOR_DEFINITIONS: FloorDefinition[] = [
  {
    floorNumber: 1,
    name: "Piso 1: Cámaras Resonantes",
    possibleEncounters: FLOOR_1_ENCOUNTERS,
    boardSizeRange: { minRows: 7, maxRows: 9, minCols: 7, maxCols: 9 }, 
    boardDensityRange: { min: 18, max: 25 }, 
    availableObjectRatioKeys: ['balanced', 'scarceAttacksPlayerFocus'],
    minTraps: 0, maxTraps: 1,
  },
  {
    floorNumber: 2,
    name: "Piso 2: Bazar Quebrado",
    possibleEncounters: FLOOR_2_ENCOUNTERS,
    boardSizeRange: { minRows: 6, maxRows: 10, minCols: 6, maxCols: 10 }, 
    boardDensityRange: { min: 20, max: 30 }, 
    availableObjectRatioKeys: ['balanced', 'hostile', 'scarceGold'],
    minTraps: 1, maxTraps: 2,
  },
  {
    floorNumber: 3,
    name: "Piso 3: Galería de los Espejismos",
    possibleEncounters: FLOOR_3_ENCOUNTERS,
    boardSizeRange: { minRows: 6, maxRows: 12, minCols: 6, maxCols: 12 }, 
    boardDensityRange: { min: 22, max: 35 }, 
    availableObjectRatioKeys: ['hostile', 'misleadingClues', 'manyAttacks', 'richInGold'],
    minTraps: 1, maxTraps: 3,
  },
];
