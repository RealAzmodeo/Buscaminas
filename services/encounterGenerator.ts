
import {
  Encounter,
  FloorDefinition,
  FuryAbility,
  BoardParameters,
  EnemyArchetypeId,
  EnemyRank,
  MetaProgressState, // Added
  AIType,            // Added
  BoardParameters,   // Added for ftueBoardParams
} from '../types';
import { FLOOR_DEFINITIONS, ENEMY_ARCHETYPE_DEFINITIONS } from '../constants/difficultyConstants';
import { ALL_FURY_ABILITIES_MAP } from '../constants'; // Added
import { createEnemyInstance } from './enemyFactory';

// Helper to get a random integer in a range (inclusive)
const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// --- Size and Density Buckets for Archetype Preferences ---
const BOARD_SIZE_BUCKETS: Record<'small' | 'medium' | 'large', { min: number; max: number }> = {
  small: { min: 6, max: 7 },
  medium: { min: 8, max: 9 },
  large: { min: 10, max: 12 }, // GDD Max is 12x12
};

const BOARD_DENSITY_BUCKETS: Record<'low' | 'medium' | 'high', { min: number; max: number }> = {
  low: { min: 15, max: 20 },
  medium: { min: 21, max: 28 },
  high: { min: 29, max: 35 }, // GDD High: ~25-35%
};
// --- End Size and Density Buckets ---

const selectWeightedRandom = <T extends { weight: number }>(items: T[]): T | null => {
  if (!items || items.length === 0) return null;
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) return items[Math.floor(Math.random() * items.length)];

  let random = Math.random() * totalWeight;
  for (const item of items) {
    if (random < item.weight) {
      return item;
    }
    random -= item.weight;
  }
  return items[items.length - 1];
};

export const generateEncounterForFloor = (
  floorNumber: number, // Effectively unused during FTUE
  currentRunLevel: number,
  oracleFuryAbility: FuryAbility, // Effectively unused during FTUE
  metaProgress: MetaProgressState // Added
): Encounter => {
  if (metaProgress.hasCompletedFirstRun === false) {
    let ftueArchetypeId: EnemyArchetypeId;
    let ftueRank = EnemyRank.Minion;
    let ftueHp: number;
    let ftueFuryAbility: FuryAbility;
    let ftueAiType: AIType = AIType.Default; // Default "Cazador Paciente" for FTUE
    let ftueFuryActivationThreshold: number = 10;

    // FTUE Board Parameters
    let ftueBoardParams: BoardParameters = {
      rows: currentRunLevel === 0 ? 7 : 8, // FTUE L1 (runLevel 0) is 7x7, L2+ is 8x8
      cols: currentRunLevel === 0 ? 7 : 8,
      densityPercent: 15 + Math.floor(currentRunLevel / 2), // Low, increases slightly
      objectRatioKey: 'ftueAttackClueOnly', // Placeholder for Attack/Clue only content
      traps: 0,
      irregularPatternType: null,
    };

    if (currentRunLevel === 0) { // FTUE Level 1 (corresponds to GDD Level 1)
      ftueArchetypeId = EnemyArchetypeId.ShadowEmber; // "Fragmento Resonante"
      ftueHp = 2;
      const chispaAgonica = ALL_FURY_ABILITIES_MAP.get('fury_shadow_ember_spark_prologue');
      if (!chispaAgonica) throw new Error("FTUE Fury 'fury_shadow_ember_spark_prologue' not found!");
      ftueFuryAbility = chispaAgonica;
      ftueFuryActivationThreshold = 10; // Override ShadowEmber's default, GDD: 10 clicks
      ftueAiType = AIType.Default; // Explicitly "Cazador Paciente"
    } else if (currentRunLevel === 1) { // FTUE Level 2 (corresponds to GDD Level 2)
      ftueArchetypeId = EnemyArchetypeId.CentinelaDelAbismoFTUE;
      ftueHp = 4;
      const toqueDelVacio = ALL_FURY_ABILITIES_MAP.get('fury_toque_vacio_initial');
      if (!toqueDelVacio) throw new Error("FTUE Fury 'fury_toque_vacio_initial' not found!");
      ftueFuryAbility = toqueDelVacio;
      ftueFuryActivationThreshold = 10; // GDD: 10 clicks
      ftueAiType = AIType.Default; // Explicitly "Cazador Paciente"
    } else { // FTUE Level 3+ (currentRunLevel >= 2, corresponds to GDD Level 3+)
      ftueArchetypeId = EnemyArchetypeId.Centinela; // Regular Centinela archetype
      ftueHp = 4 + (currentRunLevel - 1); // Scales: L3(runLvl 2)=5HP, L4(runLvl 3)=6HP, L5(runLvl 4)=7HP

      if (currentRunLevel === 2) { // FTUE Level 3 (GDD L3)
        ftueAiType = AIType.Default; // "Cazador Paciente"
        const miradaPenetrante = ALL_FURY_ABILITIES_MAP.get('fury_ftue_sentinel_level3');
        if (!miradaPenetrante) throw new Error("FTUE Fury 'fury_ftue_sentinel_level3' not found!");
        ftueFuryAbility = miradaPenetrante;
        ftueFuryActivationThreshold = 12; // GDD: 12 clicks
      } else { // FTUE Level 4+ (GDD L4+, currentRunLevel >= 3)
        ftueAiType = AIType.Calculator; // Evolves to "Calculador"
        const acometidaResonante = ALL_FURY_ABILITIES_MAP.get('fury_ftue_sentinel_level4');
        if (!acometidaResonante) throw new Error("FTUE Fury 'fury_ftue_sentinel_level4' not found!");
        ftueFuryAbility = acometidaResonante;
        // GDD L4: 10 clicks, L5: 8 clicks. For now, use 10 for L4+, can be refined.
        ftueFuryActivationThreshold = currentRunLevel === 3 ? 10 : 8;
      }
    }

    const enemyInstance = createEnemyInstance(ftueArchetypeId, ftueRank, currentRunLevel, ftueFuryAbility);

    enemyInstance.currentHp = ftueHp;
    enemyInstance.maxHp = ftueHp;
    enemyInstance.furyActivationThreshold = ftueFuryActivationThreshold;
    enemyInstance.furyAbilities = [ftueFuryAbility];
    enemyInstance.activeFuryCycleIndex = 0;

    // Override AI type if necessary. createEnemyInstance uses the archetype's default AI.
    // The baseArchetype on the instance is a copy, so changing it here is safe for this instance.
    if (enemyInstance.baseArchetype.aiType !== ftueAiType) {
        enemyInstance.baseArchetype.aiType = ftueAiType;
    }
    // If AIPlayer object is directly on enemyInstance and needs re-init:
    // if (enemyInstance.aiPlayer && enemyInstance.aiPlayer.getAIType() !== ftueAiType) {
    //   enemyInstance.aiPlayer = new AIPlayer(ftueAiType); // Or however AI is managed
    // }


    return {
      enemy: enemyInstance,
      boardParams: ftueBoardParams,
    };
  }

  // Check for Level 1 of the "Second Run" FTUE (Gold/Echoes intro)
  // This is after the first run (hasCompletedFirstRun === true)
  // but before the player has seen the gold and echoes intro (hasSeenGoldAndEchoes === false)
  // and it's the very first level of this new run (currentRunLevel === 0)
  if (metaProgress.hasCompletedFirstRun === true &&
      metaProgress.hasSeenGoldAndEchoes === false &&
      currentRunLevel === 0) {

    // Use normal enemy generation for this level (e.g. from Floor 1 definitions)
    // but override board parameters to ensure high gold.
    const originalFloorDef = FLOOR_DEFINITIONS.find(f => f.floorNumber === 1); // Assuming floor 1 for this
    if (!originalFloorDef) throw new Error("Floor definition 1 not found for FTUE second run gold setup.");

    const originalEncounterConfig = selectWeightedRandom(originalFloorDef.possibleEncounters);
    if (!originalEncounterConfig) throw new Error("Could not select an encounter for FTUE second run gold setup.");

    const { archetypeId, rank } = originalEncounterConfig;
    // Pass a dummy/default oracleFury as it's not critical for this specific board setup focus
    // The actual FTUE fury for this level might be simpler or even non-existent if the focus is purely on gold.
    // For consistency, let's use a very basic one.
    const dummyOracleFury = ALL_FURY_ABILITIES_MAP.get('fury_toque_vacio_initial');
    if (!dummyOracleFury) throw new Error("Default Fury 'fury_toque_vacio_initial' not found for FTUE gold setup.");

    const ftueGoldEnemyInstance = createEnemyInstance(archetypeId, rank, currentRunLevel, dummyOracleFury);

    // Override board parameters for high gold yield
    const ftueGoldBoardParams: BoardParameters = {
      rows: 8, // GDD: Second run FTUE levels are 8x8
      cols: 8,
      densityPercent: 25, // Decent density to ensure enough items
      objectRatioKey: 'ftueSecondRunSufficientGold', // Use the new gold-rich ratio
      traps: 0, // No traps for this specific intro level
      irregularPatternType: null,
    };

    return {
      enemy: ftueGoldEnemyInstance,
      boardParams: ftueGoldBoardParams,
    };
  }

  // --- Existing Non-FTUE logic starts here ---
  const floorDef = FLOOR_DEFINITIONS.find(f => f.floorNumber === floorNumber);
  if (!floorDef) {
    throw new Error(`Floor definition not found for floor number: ${floorNumber}`);
  }

  const selectedEncounterConfig = selectWeightedRandom(floorDef.possibleEncounters);
  if (!selectedEncounterConfig) {
    throw new Error(`Could not select an encounter configuration for floor: ${floorNumber}`);
  }
  const { archetypeId, rank } = selectedEncounterConfig;

  const enemyInstance = createEnemyInstance(archetypeId, rank, currentRunLevel, oracleFuryAbility);
  const enemyArchetypeDef = ENEMY_ARCHETYPE_DEFINITIONS[archetypeId];

  // --- Determine Board Size (Rows/Cols) with Archetype Preference ---
  let finalRows: number;
  let finalCols: number;

  if (enemyArchetypeDef.preferredBoardSizes && enemyArchetypeDef.preferredBoardSizes.length > 0) {
    const chosenSizePreference = enemyArchetypeDef.preferredBoardSizes[Math.floor(Math.random() * enemyArchetypeDef.preferredBoardSizes.length)];
    const sizeBucket = BOARD_SIZE_BUCKETS[chosenSizePreference];

    const preferredMin = sizeBucket.min;
    const preferredMax = sizeBucket.max;

    const actualMinRows = Math.max(floorDef.boardSizeRange.minRows, preferredMin);
    const actualMaxRows = Math.min(floorDef.boardSizeRange.maxRows, preferredMax);
    const actualMinCols = Math.max(floorDef.boardSizeRange.minCols, preferredMin);
    const actualMaxCols = Math.min(floorDef.boardSizeRange.maxCols, preferredMax);

    if (actualMinRows <= actualMaxRows) {
      finalRows = randomInt(actualMinRows, actualMaxRows);
    } else { // No overlap, fallback to floor range
      finalRows = randomInt(floorDef.boardSizeRange.minRows, floorDef.boardSizeRange.maxRows);
    }
    if (actualMinCols <= actualMaxCols) {
      finalCols = randomInt(actualMinCols, actualMaxCols);
    } else { // No overlap, fallback to floor range
      finalCols = randomInt(floorDef.boardSizeRange.minCols, floorDef.boardSizeRange.maxCols);
    }
  } else { // No archetype preference, use floor range
    finalRows = randomInt(floorDef.boardSizeRange.minRows, floorDef.boardSizeRange.maxRows);
    finalCols = randomInt(floorDef.boardSizeRange.minCols, floorDef.boardSizeRange.maxCols);
  }

  // --- Determine Density with Archetype Preference ---
  let finalDensityPercent: number;

  if (enemyArchetypeDef.preferredBoardDensities && enemyArchetypeDef.preferredBoardDensities.length > 0) {
    const chosenDensityPreference = enemyArchetypeDef.preferredBoardDensities[Math.floor(Math.random() * enemyArchetypeDef.preferredBoardDensities.length)];
    const densityBucket = BOARD_DENSITY_BUCKETS[chosenDensityPreference];

    const preferredMinDensity = densityBucket.min;
    const preferredMaxDensity = densityBucket.max;

    const actualMinDensity = Math.max(floorDef.boardDensityRange.min, preferredMinDensity);
    const actualMaxDensity = Math.min(floorDef.boardDensityRange.max, preferredMaxDensity);

    if (actualMinDensity <= actualMaxDensity) {
      finalDensityPercent = randomInt(actualMinDensity, actualMaxDensity);
    } else { // No overlap, fallback to floor range
      finalDensityPercent = randomInt(floorDef.boardDensityRange.min, floorDef.boardDensityRange.max);
    }
  } else { // No archetype preference, use floor range
    finalDensityPercent = randomInt(floorDef.boardDensityRange.min, floorDef.boardDensityRange.max);
  }

  // --- Determine Object Ratio Key (already considers archetype preference) ---
  let availableRatios = floorDef.availableObjectRatioKeys;
  if (enemyArchetypeDef.preferredObjectRatioKeys && enemyArchetypeDef.preferredObjectRatioKeys.length > 0) {
    const preferredAndAvailable = enemyArchetypeDef.preferredObjectRatioKeys.filter(key => floorDef.availableObjectRatioKeys.includes(key));
    if (preferredAndAvailable.length > 0) {
      availableRatios = preferredAndAvailable;
    }
  }
  const objectRatioKey = availableRatios[Math.floor(Math.random() * availableRatios.length)];

  // --- Determine Traps ---
  const traps = randomInt(floorDef.minTraps, floorDef.maxTraps);

  // --- Determine Irregular Pattern ---
  let irregularPatternType: 'ilusionista_holes' | null = null;
  if (enemyArchetypeDef.id === EnemyArchetypeId.Ilusionista && enemyArchetypeDef.generatesIrregularPatterns) {
    // Could add probability here if not every Ilusionista board should have it
    irregularPatternType = 'ilusionista_holes';
  }


  const boardParams: BoardParameters = {
    rows: finalRows,
    cols: finalCols,
    densityPercent: finalDensityPercent,
    objectRatioKey,
    traps,
    irregularPatternType, // Added irregular pattern type
  };

  return {
    enemy: enemyInstance,
    boardParams,
  };
};
