import { useState, useCallback }
from 'react';
import {
  GameStateCore, GamePhase, GameStatus,
  MetaProgressState, RunStats, GuidingTextKey, BiomeId,
} from '../types';
import {
    BOARD_ROWS as DEFAULT_BOARD_ROWS, BOARD_COLS as DEFAULT_BOARD_COLS,
    MAX_ARENA_REDUCTIONS, DEFAULT_LEVELS_PER_STRETCH, PROLOGUE_LEVEL_ID,
    SOUL_FRAGMENTS_END_RUN_MULTIPLIER
} from '../constants';
import { UseMetaProgressReturn } from './useMetaProgress';

// PROLOGUE_MESSAGES has been moved to usePrologue.ts
// advancePrologueStep has been moved to usePrologue.ts

const initialGameState: GameStateCore = {
    status: GameStatus.MainMenu,
    currentPhase: GamePhase.PLAYER_TURN,
    currentLevel: PROLOGUE_LEVEL_ID,
    currentFloor: 0,
    isFuryMinigameActive: false,
    furyMinigamePhase: 'inactive',
    furyMinigameCompletedForThisLevel: false,
    furyCardOptions: [],
    shuffledFuryCardOrder: [0,1,2],
    playerSelectedFuryCardDisplayIndex: null,
    oracleSelectedFuryAbility: null,
    isPrologueActive: false,
    prologueStep: 0, // Managed by usePrologue via setGameState
    prologueEnemyFuryAbility: null,
    conditionalEchoTriggeredId: null,
    isCorazonDelAbismoChoiceActive: false,
    corazonDelAbismoOptions: null,
    eventQueue: [],
    playerTookDamageThisLevel: false,
    currentArenaLevel: 0,
    maxArenaReductions: MAX_ARENA_REDUCTIONS,
    isBattlefieldReductionTransitioning: false,
    guidingTextKey: '', // Managed by usePrologue via setGameState
    defeatReason: 'standard',
    currentBoardDimensions: { rows: DEFAULT_BOARD_ROWS, cols: DEFAULT_BOARD_COLS },
    currentRunMap: null,
    currentBiomeId: BiomeId.Default,
    levelsInCurrentStretch: DEFAULT_LEVELS_PER_STRETCH,
    currentStretchCompletedLevels: 0,
    stretchStartLevel: PROLOGUE_LEVEL_ID,
    mapDecisionPending: false,
    stretchRewardPending: null,
    postLevelActionTaken: false,
    aiThinkingCellCoords: null,
    aiActionTargetCell: null,
};

// Temporary stub for GoalTrackingService
const GoalTrackingService = {
    processEvent: (eventName: string, payload: any, metaProgress: MetaProgressState, setAndSaveMetaProgress: Function) => {
        console.warn(`GoalTrackingService.processEvent called for ${eventName} - STUBBED in useGameState (but should be called from specific hooks like useMetaProgress or useRunStats ideally)`);
    }
};


export interface UseGameStateReturn {
  gameState: GameStateCore;
  setGameState: React.Dispatch<React.SetStateAction<GameStateCore>>;
  setGamePhase: (newPhase: GamePhase) => void;
  setGameStatus: (newStatus: GameStatus, newDefeatReason?: 'standard' | 'attrition') => void;
  // advancePrologueStep is removed
}

interface GameStateProps {
  metaProgressHook: UseMetaProgressReturn;
  getRunStats: () => RunStats; // To get current run stats for setGameStatus logic
}

export const useGameState = ({ metaProgressHook, getRunStats }: GameStateProps): UseGameStateReturn => {
  const [gameState, setGameState] = useState<GameStateCore>(initialGameState);

  const setGamePhase = useCallback((newPhase: GamePhase) => {
    console.log(`Transitioning to phase: ${newPhase}`);
    setGameState(prev => ({ ...prev, currentPhase: newPhase }));
  }, []);

  const setGameStatus = useCallback((newStatus: GameStatus, newDefeatReason: 'standard' | 'attrition' = 'standard') => {
    const currentRunStats = getRunStats(); // Get fresh runStats
    const { metaProgress, setAndSaveMetaProgress } = metaProgressHook;

    if (newStatus === GameStatus.GameOverDefeat || newStatus === GameStatus.GameOverWin) {
        const finalFragmentsForRun = currentRunStats.soulFragmentsEarnedThisRun + (gameState.currentLevel * SOUL_FRAGMENTS_END_RUN_MULTIPLIER);

        // The returned string[] of newly completed goals from setAndSaveMetaProgress
        // should be captured by the orchestrator (useGameEngine) and passed to useRunStats.updateNewlyCompletedGoals
        setAndSaveMetaProgress(prevMeta => ({
            ...prevMeta,
            soulFragments: Math.min(prevMeta.maxSoulFragments, prevMeta.soulFragments + finalFragmentsForRun),
        }), newStatus); // newStatus is passed as currentGameStatus

        console.warn("Run stats updates (soulFragmentsEarnedThisRun, newlyCompletedGoalIdsThisRun) need to be handled by the orchestrating hook that calls useGameState.setGameStatus.");

        if (gameState.currentLevel >= 1 && gameState.status === GameStatus.Playing) {
            // GoalTrackingService calls should ideally be made from where the event logically occurs,
            // e.g., from useMetaProgress or a dedicated goal processing service.
            // For now, it's kept similar to original structure.
             GoalTrackingService.processEvent('PROLOGUE_COMPLETED', null, metaProgress, (updater) => setAndSaveMetaProgress(updater, newStatus));
        }
    }
    if (newStatus === GameStatus.Sanctuary && metaProgress.firstSanctuaryVisit) {
        GoalTrackingService.processEvent('SANCTUARY_FIRST_VISIT', null, metaProgress, (updater) => setAndSaveMetaProgress(updater, newStatus));
        // Ensure firstSanctuaryVisit is set to false in metaProgress
        setAndSaveMetaProgress(prev => ({...prev, firstSanctuaryVisit: false }), newStatus);
    }
    setGameState(prev => ({ ...prev, status: newStatus, defeatReason: newStatus === GameStatus.GameOverDefeat ? newDefeatReason : 'standard' }));
  }, [gameState.currentLevel, gameState.status, metaProgressHook, getRunStats]); // Include gameState.currentLevel, gameState.status for accurate snapshot

  // advancePrologueStep has been removed (now in usePrologue.ts)

  return {
    gameState,
    setGameState,
    setGamePhase,
    setGameStatus,
  };
};
