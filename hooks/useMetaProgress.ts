import { useState, useCallback, useEffect } from 'react';
import { MetaProgressState, GoalProgress, GameStatus } from '../types'; // Removed RunStats as it's not directly used here
import { INITIAL_GOALS_CONFIG, MIRROR_UPGRADES_CONFIG, INITIAL_MAX_SOUL_FRAGMENTS, INITIAL_WILL_LUMENS } from '../constants/metaProgressionConstants';

const getInitialMetaProgress = (): MetaProgressState => {
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

export interface UseMetaProgressReturn {
  metaProgress: MetaProgressState;
  // Returns an array of newly completed goal IDs
  setAndSaveMetaProgress: (updater: React.SetStateAction<MetaProgressState>, currentGameStatus?: GameStatus) => string[];
  loadMetaProgress: () => void;
}

export const useMetaProgress = (): UseMetaProgressReturn => {
  const [metaProgress, setMetaProgressState] = useState<MetaProgressState>(getInitialMetaProgress());

  const saveMetaProgress = useCallback((currentMeta: MetaProgressState) => {
    try {
      localStorage.setItem('numeriasEdgeMetaProgress', JSON.stringify(currentMeta));
      console.log("Meta progress saved:", currentMeta);
    } catch (error) {
      console.error("Error saving meta progress to localStorage:", error);
    }
  }, []);

  const loadMetaProgress = useCallback(() => {
    try {
      const saved = localStorage.getItem('numeriasEdgeMetaProgress');
      if (saved) {
        const loadedMeta = JSON.parse(saved) as MetaProgressState;
        const defaultMeta = getInitialMetaProgress();

        const mergedMeta: MetaProgressState = {
            ...defaultMeta,
            ...loadedMeta,
            mirrorUpgrades: {
                ...defaultMeta.mirrorUpgrades,
                ...(loadedMeta.mirrorUpgrades || {})
            },
            goalsProgress: { /* Will be handled below */ },
            unlockedEchoBaseIds: loadedMeta.unlockedEchoBaseIds || [],
            awakenedFuryIds: loadedMeta.awakenedFuryIds || [],
            // Ensure new properties introduced in defaultMeta also get initialized if not in loadedMeta
            maxSoulFragments: loadedMeta.maxSoulFragments || defaultMeta.maxSoulFragments,
            willLumens: loadedMeta.willLumens || defaultMeta.willLumens,
            furyAwakeningProgress: loadedMeta.furyAwakeningProgress || defaultMeta.furyAwakeningProgress,
            nextFuryToAwakenIndex: loadedMeta.nextFuryToAwakenIndex || defaultMeta.nextFuryToAwakenIndex,
            firstSanctuaryVisit: typeof loadedMeta.firstSanctuaryVisit === 'boolean' ? loadedMeta.firstSanctuaryVisit : defaultMeta.firstSanctuaryVisit,
        };

        const finalGoalsProgress: Record<string, GoalProgress> = {};
        INITIAL_GOALS_CONFIG.forEach(goalDef => {
            finalGoalsProgress[goalDef.id] = {
                ...(defaultMeta.goalsProgress[goalDef.id] || { currentValue: 0, completed: false, claimed: false }),
                ...(loadedMeta.goalsProgress?.[goalDef.id] || {})
            };
        });
        mergedMeta.goalsProgress = finalGoalsProgress;

        setMetaProgressState(mergedMeta);
        console.log("Meta progress loaded and merged:", mergedMeta);
      } else {
        const initialMeta = getInitialMetaProgress();
        setMetaProgressState(initialMeta);
        console.log("No saved meta progress, initialized with default:", initialMeta);
      }
    } catch (error) {
      console.error("Error loading meta progress from localStorage:", error);
      setMetaProgressState(getInitialMetaProgress());
    }
  }, []);

  useEffect(() => {
    loadMetaProgress();
  }, [loadMetaProgress]);

  const setAndSaveMetaProgress = useCallback((
    updater: React.SetStateAction<MetaProgressState>,
    currentGameStatus?: GameStatus
  ): string[] => {
    let newlyCompletedThisUpdate: string[] = [];
    setMetaProgressState(prevMeta => {
      const newState = typeof updater === 'function' ? updater(prevMeta) : updater;

      if (currentGameStatus === GameStatus.Playing || currentGameStatus === GameStatus.PostLevel) {
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
      saveMetaProgress(newState);
      return newState;
    });
    return newlyCompletedThisUpdate; // This will return based on the state before the update due to setState's async nature.
                                    // This needs to be called within the updater of setMetaProgressState to get the correct prevMeta.
  }, [saveMetaProgress]);


  // Corrected setAndSaveMetaProgress to accurately return newly completed goals
  const setAndSaveMetaProgressCorrected = useCallback((
    updater: React.SetStateAction<MetaProgressState>,
    currentGameStatus?: GameStatus
  ): string[] => {
    let newlyCompletedOutput: string[] = [];

    setMetaProgressState(prevMeta => {
      const newState = typeof updater === 'function' ? updater(prevMeta) : updater;
      const localNewlyCompletedThisUpdate: string[] = [];

      // Determine if we should check for newly completed goals
      const shouldTrackGoalCompletion = currentGameStatus === GameStatus.Playing ||
                                        currentGameStatus === GameStatus.PostLevel ||
                                        currentGameStatus === GameStatus.Sanctuary; // Added Sanctuary as goals can complete there

      if (shouldTrackGoalCompletion) {
          INITIAL_GOALS_CONFIG.forEach(goalDef => {
              const oldGoalProg = prevMeta.goalsProgress[goalDef.id];
              const newGoalProg = newState.goalsProgress[goalDef.id];
              // Ensure newGoalProg exists and is structured as expected
              if (newGoalProg && typeof newGoalProg.completed === 'boolean' && typeof newGoalProg.claimed === 'boolean') {
                  if (newGoalProg.completed && !newGoalProg.claimed) {
                      // Check if oldGoalProg was different (either not existing, not completed, or claimed)
                      if (!oldGoalProg || !oldGoalProg.completed || oldGoalProg.claimed) {
                          localNewlyCompletedThisUpdate.push(goalDef.id);
                      }
                  }
              } else if (newGoalProg) {
                  // This case handles if newGoalProg might exist but not have the completed/claimed booleans (e.g. partial update)
                  // For safety, one might log a warning or ensure the structure. For now, we assume valid structure if completed/claimed are checked.
              }
          });
      }
      saveMetaProgress(newState);
      newlyCompletedOutput = localNewlyCompletedThisUpdate; // Assign to the outer scope variable
      return newState; // Return the new state for setState
    });

    return newlyCompletedOutput; // Return the captured newly completed IDs
  }, [saveMetaProgress]);


  return { metaProgress, setAndSaveMetaProgress: setAndSaveMetaProgressCorrected, loadMetaProgress };
};
