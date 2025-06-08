import { useState, useCallback } from 'react';
import { RunStats } from '../types';

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
  swordUsedThisLevel: false, // Now attackUsedThisLevelByPlayer
  swordUsedThisLevelForMirror: false, // Now attackUsedThisLevelForMirror
};

export interface UseRunStatsReturn {
  runStats: RunStats;
  setRunStats: React.Dispatch<React.SetStateAction<RunStats>>;
  resetRunStats: () => void;
  updateNewlyCompletedGoals: (newlyCompletedIds: string[]) => void;
}

export const useRunStats = (): UseRunStatsReturn => {
  const [runStats, setRunStats] = useState<RunStats>(initialRunStats);

  const resetRunStats = useCallback(() => {
    setRunStats(initialRunStats);
  }, []);

  const updateNewlyCompletedGoals = useCallback((newlyCompletedIds: string[]) => {
    if (newlyCompletedIds.length > 0) {
      setRunStats(prevRunStats => {
        const updatedNewlyCompleted = Array.from(
          new Set([...prevRunStats.newlyCompletedGoalIdsThisRun, ...newlyCompletedIds])
        );
        return { ...prevRunStats, newlyCompletedGoalIdsThisRun: updatedNewlyCompleted };
      });
    }
  }, []);

  return { runStats, setRunStats, resetRunStats, updateNewlyCompletedGoals };
};
