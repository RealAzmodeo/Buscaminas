import { Echo, PlayerState } from '../types'; // Added PlayerState for DeactivatedEchoInfo
import { FLOOR_DEFINITIONS } from '../constants/difficultyConstants'; // For getCurrentFloorNumber

/**
 * Generates a random integer between min (inclusive) and max (inclusive).
 */
export const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Determines the current floor number based on the game level.
 * Prologue (level <= 0) is considered floor 0.
 */
export const getCurrentFloorNumber = (level: number): number => {
  if (level <= 0) return 0; // Prologue or invalid level
  // Example: stretch of 3 levels per floor. Level 1,2,3 = Floor 1. Level 4,5,6 = Floor 2.
  // The logic from useGameEngine was:
  // const floorConfig = FLOOR_DEFINITIONS.find(f => level <= (f.floorNumber * 2 + (f.floorNumber-1)));
  // This seems complex. A simpler approach might be needed if FLOOR_DEFINITIONS is not structured for this.
  // Assuming FLOOR_DEFINITIONS implies stretches of levels per floor.
  // For now, using the existing logic structure:
  const floorConfig = FLOOR_DEFINITIONS.find(f => {
    // This logic seems to be: floor 1 = levels 1-3, floor 2 = levels 4-6, floor 3 = levels 7-9
    // Max levels for floor X = X*levels_per_floor_main_stretch + (X-1)*levels_per_floor_transition_stretch (if transitions are 1 level)
    // Or, if each floor definition simply has a 'maxLevelInFloor' or similar.
    // The original formula: level <= (f.floorNumber * 2 + (f.floorNumber-1))
    // f.floorNumber = 1 -> level <= (2 + 0) = 2. This means level 1,2 are floor 1.
    // f.floorNumber = 2 -> level <= (4 + 1) = 5. This means level 3,4,5 are floor 2.
    // f.floorNumber = 3 -> level <= (6 + 2) = 8. This means level 6,7,8 are floor 3.
    // This implies variable levels per floor.

    // Let's assume FLOOR_DEFINITIONS has a structure like:
    // { floorNumber: 1, levelsInFloor: 3 } (meaning levels 1,2,3 are floor 1)
    // Or { floorNumber: 1, maxLevelThisFloor: 3 }
    // The provided FLOOR_DEFINITIONS constant needs to be checked for its structure.
    // For now, sticking to the original complex calculation if FLOOR_DEFINITIONS is as assumed by it.
    // If FLOOR_DEFINITIONS is an array of objects, each with 'floorNumber' and some properties defining its span.
    // Example: [{ floorNumber: 1, ... }, { floorNumber: 2, ... }]
    // The original formula seems to imply a specific level progression scheme tied to floorNumber directly.
    // Let's use a placeholder if FLOOR_DEFINITIONS structure isn't available for robust implementation.
    // Placeholder logic: Assume 3 levels per floor for simplicity if original is too complex without context.
    // return level <= f.floorNumber * 3; // Simplified placeholder

    // Using the original formula for now, assuming FLOOR_DEFINITIONS supports it.
     const maxLevelForThisFloorConfig = (f.floorNumber * 2 + (f.floorNumber -1)); // This is the 'up to' level for this floor config.
     // To correctly use this, we also need to consider the previous floor's max level.
     // Example: Floor 1 (levels 1-2), Floor 2 (levels 3-5), Floor 3 (levels 6-8)
     // If level = 3, it should be floor 2.
     // (f.floorNumber=1).maxLevel = 2.
     // (f.floorNumber=2).maxLevel = 5.
     // (f.floorNumber=3).maxLevel = 8.
     // The find should get the first config where level <= maxLevelForThisFloorConfig.
     return level <= maxLevelForThisFloorConfig;
  });

  // If a floor config is found by the condition, return its floor number.
  // Otherwise, fallback to the highest defined floor number, or 0 if none defined.
  return floorConfig ? floorConfig.floorNumber : (FLOOR_DEFINITIONS.length > 0 ? FLOOR_DEFINITIONS[FLOOR_DEFINITIONS.length - 1].floorNumber : 0);
};


/**
 * Filters a list of all active Echos to get only those that are currently effective,
 * considering any temporarily deactivated Echos.
 * @param allActiveEcos - Array of all Echos currently possessed by the player.
 * @param deactivatedEcosInfo - Array of info about Echos that are temporarily deactivated.
 * @returns Array of Echos that are currently active and effective.
 */
export const getCurrentlyEffectiveEcos = (
    allActiveEcos: Echo[],
    deactivatedEcosInfo: PlayerState['deactivatedEcos'] | undefined | null
): Echo[] => {
  if (!deactivatedEcosInfo || deactivatedEcosInfo.length === 0) {
    return allActiveEcos;
  }
  const deactivatedIds = new Set(deactivatedEcosInfo.map(info => info.echoId));
  return allActiveEcos.filter(echo => !deactivatedIds.has(echo.id));
};
