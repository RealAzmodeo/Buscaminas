
import {
  Encounter,
  FloorDefinition,
  FuryAbility,
  BoardParameters,
  EnemyArchetypeId, // Added EnemyArchetypeId
  EnemyRank,
} from '../types';
import { FLOOR_DEFINITIONS, ENEMY_ARCHETYPE_DEFINITIONS } from '../constants/difficultyConstants';
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
  floorNumber: number,
  currentRunLevel: number,
  oracleFuryAbility: FuryAbility,
): Encounter => {
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
