// hooks/useGameProgress.ts
import { useState, useCallback, useEffect } from 'react';
import { RunStats, MetaProgressState, GameStatus, GoalProgress } from '../types';
import { INITIAL_MAX_SOUL_FRAGMENTS, INITIAL_WILL_LUMENS, SOUL_FRAGMENTS_END_RUN_MULTIPLIER } from '../constants';
import { INITIAL_GOALS_CONFIG, MIRROR_UPGRADES_CONFIG } from '../constants/metaProgressionConstants';

// Actual initialRunStats from useGameEngine
export const initialRunStats: RunStats = {
  enemiesDefeatedThisRun: 0,
  attacksTriggeredByPlayer: 0,
  attacksTriggeredByEnemy: 0,
  goldCellsRevealedThisRun: 0,
  clicksOnBoardThisRun: 0,
  nonFreeEcosAcquiredThisRun: 0,
  trapsTriggeredThisRun: 0,
  soulFragmentsEarnedThisRun: 0,
  levelsCompletedWithoutDamageThisRun: 0,
  levelsCompletedThisRun: 0,
  runUniqueEcosActivated: [],
  runUniqueFuriesExperienced: [],
  newlyCompletedGoalIdsThisRun: [],
  swordUsedThisLevel: false,
  swordUsedThisLevelForMirror: false,
};

// Actual getInitialMetaProgress from useGameEngine
const getInitialMetaProgressInternal = (): MetaProgressState => {
    const initialGoalsProgress: Record<string, GoalProgress> = {};
    INITIAL_GOALS_CONFIG.forEach(goalDef => {
        initialGoalsProgress[goalDef.id] = {
            currentValue: 0,
            completed: false,
            claimed: false,
        };
    });
    const initialMirrorUpgrades: Record<string, number> = {};
    MIRROR_UPGRADES_CONFIG.forEach(upgradeDef => {
        initialMirrorUpgrades[upgradeDef.id] = 0;
    });

    return {
        soulFragments: 0,
        maxSoulFragments: INITIAL_MAX_SOUL_FRAGMENTS,
        willLumens: INITIAL_WILL_LUMENS,
        mirrorUpgrades: initialMirrorUpgrades,
        goalsProgress: initialGoalsProgress,
        unlockedEchoBaseIds: [],
        awakenedFuryIds: [],
        furyAwakeningProgress: 0,
        nextFuryToAwakenIndex: 0,
        firstSanctuaryVisit: true,
    };
};

export interface UseGameProgressProps {
  // To handle side effects like updating runStats when goals are completed via metaProgress changes
  // Or to pass gameState.status for conditional logic in setAndSaveMetaProgress
  getGameStateStatus?: () => GameStatus;
  getCurrentLevel?: () => number;
}

export const useGameProgress = (props?: UseGameProgressProps) => {
  const [runStats, setRunStatsState] = useState<RunStats>(initialRunStats);
  const [metaProgress, setMetaProgressState] = useState<MetaProgressState>(getInitialMetaProgressInternal());

  const saveMetaProgress = useCallback((currentMeta: MetaProgressState) => {
    try {
      localStorage.setItem('numeriasEdgeMetaProgress', JSON.stringify(currentMeta));
    } catch (error) {
      console.error("Error saving meta progress to localStorage:", error);
    }
  }, []);

  const loadMetaProgress = useCallback(() => {
    try {
      const saved = localStorage.getItem('numeriasEdgeMetaProgress');
      if (saved) {
        const loadedMeta = JSON.parse(saved) as MetaProgressState;
        const defaultMeta = getInitialMetaProgressInternal();
        // Deep merge for nested objects like mirrorUpgrades and goalsProgress
        const mergedMeta = {
            ...defaultMeta,
            ...loadedMeta,
            mirrorUpgrades: { ...defaultMeta.mirrorUpgrades, ...(loadedMeta.mirrorUpgrades || {}) },
            goalsProgress: { ...defaultMeta.goalsProgress, ...(loadedMeta.goalsProgress || {}) },
        };
        // Ensure all defined goals have an entry in progress
        INITIAL_GOALS_CONFIG.forEach(goalDef => {
            if (!mergedMeta.goalsProgress[goalDef.id]) {
                mergedMeta.goalsProgress[goalDef.id] = { currentValue: 0, completed: false, claimed: false };
            }
        });
        setMetaProgressState(mergedMeta);
      } else {
        setMetaProgressState(getInitialMetaProgressInternal());
      }
    } catch (error) {
      console.error("Error loading meta progress from localStorage:", error);
      setMetaProgressState(getInitialMetaProgressInternal());
    }
  }, []);

  // useEffect to load metaProgress on mount
  useEffect(() => {
    loadMetaProgress();
  }, [loadMetaProgress]);

  const setAndSaveMetaProgress = useCallback((updater: React.SetStateAction<MetaProgressState>) => {
    setMetaProgressState(prevMeta => {
      const newState = typeof updater === 'function' ? updater(prevMeta) : updater;
      const newlyCompletedThisUpdate: string[] = [];

      // This logic was originally in useGameEngine, checking gameState.status
      // If props.getGameStateStatus is provided, we can replicate it.
      const currentStatus = props?.getGameStateStatus ? props.getGameStateStatus() : undefined;
      if (currentStatus === GameStatus.Playing || currentStatus === GameStatus.PostLevel) {
          INITIAL_GOALS_CONFIG.forEach(goalDef => {
              const oldGoalProg = prevMeta.goalsProgress[goalDef.id];
              const newGoalProg = newState.goalsProgress[goalDef.id];
              if (newGoalProg && newGoalProg.completed && !newGoalProg.claimed) {
                  if (!oldGoalProg || !oldGoalProg.completed) {
                      newlyCompletedThisUpdate.push(goalDef.id);
                  }
              }
          });
      }

      if (newlyCompletedThisUpdate.length > 0) {
          setRunStatsState(prevRunStats => {
              const updatedNewlyCompleted = Array.from(new Set([...prevRunStats.newlyCompletedGoalIdsThisRun, ...newlyCompletedThisUpdate]));
              return { ...prevRunStats, newlyCompletedGoalIdsThisRun: updatedNewlyCompleted };
          });
      }
      saveMetaProgress(newState);
      return newState;
    });
  }, [saveMetaProgress, props]);

  // Wrapper for setRunStats to match the signature if needed, or just expose setRunStatsState
  const setRunStats = useCallback((stats: RunStats | ((prevState: RunStats) => RunStats)) => {
    setRunStatsState(stats);
  }, []);

  // Function to handle end of run calculations for meta progress
  const finalizeRunProgress = useCallback((runSucceeded: boolean) => {
    const currentLevel = props?.getCurrentLevel ? props.getCurrentLevel() : 0; // Requires currentLevel
    const finalFragmentsForRun = runStats.soulFragmentsEarnedThisRun + (currentLevel * SOUL_FRAGMENTS_END_RUN_MULTIPLIER);

    setAndSaveMetaProgress(prevMeta => ({
        ...prevMeta,
        soulFragments: Math.min(prevMeta.maxSoulFragments, prevMeta.soulFragments + finalFragmentsForRun),
    }));
    setRunStatsState(prevRunStats => ({...prevRunStats, soulFragmentsEarnedThisRun: finalFragmentsForRun, runCompleted: true, runSucceeded }));

    // Potentially add logic for Goal: PROLOGUE_COMPLETED here if it's tied to finalizeRunProgress
    // Or if it should be tied to a specific setGameStatus call in useGameEngine.
    // For now, assuming useGameEngine handles specific goal triggers like PROLOGUE_COMPLETED.

  }, [runStats.soulFragmentsEarnedThisRun, setAndSaveMetaProgress, props]);

  return {
    runStats,
    setRunStats, // Expose the wrapped or direct setter
    metaProgress,
    setMetaProgressState: setAndSaveMetaProgress, // setAndSaveMetaProgress is the main setter now
    loadMetaProgress, // For initial load, though useEffect handles it
    getInitialMetaProgress: getInitialMetaProgressInternal, // For use elsewhere if needed
    finalizeRunProgress, // New function to encapsulate end-of-run logic
    initialRunStatsObject: initialRunStats, // Exporting for resets
  };
};
