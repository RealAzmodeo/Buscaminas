
import { MetaProgressState, GoalEventType, GoalCellRevealedPayload, CellType } from '../types'; // Removed unused GoalEnemyDefeatedPayload
import { INITIAL_GOALS_CONFIG } from '../constants/metaProgressionConstants';

const updateIndividualGoal = (
  goalId: string,
  increment: number,
  metaProgress: MetaProgressState,
  setAndSaveMetaProgress: (updater: React.SetStateAction<MetaProgressState>) => void,
  payload?: any 
) => {
  const goalDef = INITIAL_GOALS_CONFIG.find(g => g.id === goalId);
  if (!goalDef) {
    console.warn(`Goal definition not found for ${goalId}`);
    return;
  }

  const currentGoalProgress = metaProgress.goalsProgress[goalId];
  if (!currentGoalProgress) {
    console.warn(`Goal progress not found for ${goalId} in metaProgress.goalsProgress. Ensure it's initialized.`);
    return;
  }

  if (currentGoalProgress.completed && !goalDef.targetValue && !goalDef.resetsPerRun) return; 
  if (currentGoalProgress.completed && goalDef.targetValue && currentGoalProgress.currentValue >= goalDef.targetValue && !goalDef.resetsPerRun) return; 


  // For CELL_REVEALED, check cellType and potentially who revealed it
  if (goalDef.eventPropertyToCheck && payload) {
    if (goalDef.eventPropertyToCheck === 'cellType' && payload.cellType !== goalDef.eventPropertyValueToMatch) {
      return; 
    }
    // Example for future: checking if player revealed an Attack tile (like a sword find)
    if (goalDef.eventPropertyToCheck === 'revealedByPlayer' && payload.revealedByPlayer !== goalDef.eventPropertyValueToMatch) {
        // This specific goal might only care if the PLAYER revealed it.
        // This depends on how goal definitions are structured.
        // For example, a "find X swords" goal now means "player reveals X Attack tiles".
        if (payload.cellType === CellType.Attack && payload.revealedByPlayer !== goalDef.eventPropertyValueToMatch) {
            return;
        }
    }
  }
  
  setAndSaveMetaProgress(prevMeta => {
    const internalCurrentProgress = prevMeta.goalsProgress[goalId]; 
    if (!internalCurrentProgress) return prevMeta; 

    let valueToUpdate = internalCurrentProgress.currentValue;
    let alreadyCompletedThisInstanceOfRun = internalCurrentProgress.completed;

    if (goalDef.resetsPerRun && internalCurrentProgress.completed) {
        // Handled at run start for now.
    }

    const newValue = valueToUpdate + increment;
    let isCompletedThisTime = alreadyCompletedThisInstanceOfRun;

    if (goalDef.targetValue) {
      if (newValue >= goalDef.targetValue) isCompletedThisTime = true;
    } else { 
      if (increment > 0) isCompletedThisTime = true;
    }

    return {
      ...prevMeta,
      goalsProgress: {
        ...prevMeta.goalsProgress,
        [goalId]: {
          ...internalCurrentProgress,
          currentValue: goalDef.targetValue ? Math.min(newValue, goalDef.targetValue) : newValue,
          completed: isCompletedThisTime,
        },
      },
    };
  });
};

export const GoalTrackingService = {
  processEvent: (
    eventType: GoalEventType,
    payload: any, 
    metaProgress: MetaProgressState,
    setAndSaveMetaProgress: (updater: React.SetStateAction<MetaProgressState>) => void
  ) => {
    INITIAL_GOALS_CONFIG.forEach(goalDef => {
      if (goalDef.relevantEventType === eventType) {
        // If the goal is about a specific cell type (e.g. Gold), payload.cellType must match.
        if (goalDef.eventPropertyToCheck === 'cellType' && payload && payload.cellType !== goalDef.eventPropertyValueToMatch) {
          return; // Skip if cell type doesn't match for this specific goal
        }
        
        // If the goal cares about WHO revealed an Attack tile (e.g. "Find X Swords" means player reveals Attack)
        if (goalDef.eventPropertyToCheck === 'revealedByPlayer' && payload && 
            payload.cellType === CellType.Attack && // Only for attack tiles
            payload.revealedByPlayer !== goalDef.eventPropertyValueToMatch) {
          return; // Skip if the revealer doesn't match for this specific goal
        }

        updateIndividualGoal(goalDef.id, 1, metaProgress, setAndSaveMetaProgress, payload);
      }
    });
  },
};
