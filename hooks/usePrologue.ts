import { useCallback, useRef } from 'react';
import {
  GameStatus, GameStateCore, MetaProgressState, PlayerState, RunStats,
  EnemyInstance, BoardState, Echo, BoardParameters, GuidingTextKey, EnemyArchetypeId, EnemyRank
} from '../types';
import {
  PROLOGUE_MESSAGES as MOVED_PROLOGUE_MESSAGES, // Renaming to avoid conflict if imported elsewhere temporarily
  PROLOGUE_BOARD_ROWS, PROLOGUE_BOARD_COLS, PROLOGUE_LEVEL_ID,
  PROLOGUE_ENEMY_SHADOW_EMBER, /* PROLOGUE_SHADOW_EMBER_FURY_ABILITY removed */
  PROLOGUE_BOARD_CONFIG, INITIAL_PLAYER_HP, INITIAL_PLAYER_GOLD, INITIAL_PLAYER_SHIELD,
  INITIAL_MAX_SOUL_FRAGMENTS, OBJECT_RATIO_DEFINITIONS
} from '../constants';
import { PROLOGUE_SHADOW_EMBER_FURY_ABILITY } from '../core/furies'; // Import from core/furies, no alias
import { MIRROR_UPGRADES_CONFIG, INITIAL_GOALS_CONFIG, MIRROR_UPGRADE_IDS } from '../constants/metaProgressionConstants'; // For startPrologueActual
import { createEnemyInstance } from '../services/enemyFactory'; // For startPrologueActual

export const PROLOGUE_MESSAGES = MOVED_PROLOGUE_MESSAGES;

export interface UsePrologueReturn {
  ftueEventTrackerRef: React.MutableRefObject<{[key: string]: boolean | undefined}>;
  requestPrologueStart: () => void;
  startPrologueActual: () => void;
  advancePrologueStep: (specificStepOrKey?: number | GuidingTextKey) => void;
  // PROLOGUE_MESSAGES is exported directly from the module
}

interface PrologueProps {
  // From useGameState
  setGameState: React.Dispatch<React.SetStateAction<GameStateCore>>;
  // From useRunStats
  resetRunStats: () => void; // Replaces setRunStats for initialization
  // From useMetaProgress
  metaProgressState: MetaProgressState;
  setAndSaveMetaProgress: (updater: React.SetStateAction<MetaProgressState>, gameStatus?: GameStatus) => string[];
  // From usePlayerState
  resetPlayerForNewRun: (baseHp?: number, baseGold?: number, baseShield?: number) => void; // Replaces setPlayer for initialization
  // From useEnemyState
  setEnemyState: React.Dispatch<React.SetStateAction<EnemyInstance>>;
  // From useBoard
  generateBoardFromBoardParameters: (params: BoardParameters, activeEcos: Echo[], level: number, arenaLevel: number, biomeId: string) => BoardState;
  setBoardState: React.Dispatch<React.SetStateAction<BoardState>>;
  // From useEchos
  setActiveEcosState: React.Dispatch<React.SetStateAction<Echo[]>>;
  setAvailableEchoChoicesState: React.Dispatch<React.SetStateAction<Echo[]>>;
}

export const usePrologue = ({
  setGameState,
  resetRunStats,
  metaProgressState,
  setAndSaveMetaProgress,
  resetPlayerForNewRun,
  setEnemyState,
  generateBoardFromBoardParameters,
  setBoardState,
  setActiveEcosState,
  setAvailableEchoChoicesState,
}: PrologueProps): UsePrologueReturn => {
  const ftueEventTrackerRef = useRef<{
    firstClueRevealed?: boolean;
    firstAttackRevealedByPlayer?: boolean;
    firstGoldRevealed?: boolean;
    firstAttackRevealedByEnemy?: boolean;
  }>({});

  const advancePrologueStep = useCallback((specificStepOrKey?: number | GuidingTextKey) => {
    setGameState(prev => {
        // Logic copied from useGameState's advancePrologueStep
        let newGuidingTextKey: GuidingTextKey = '';
        let newPrologueStep = prev.prologueStep;
        if (typeof specificStepOrKey === 'number') {
            newPrologueStep = specificStepOrKey;
            if (prev.isPrologueActive && PROLOGUE_MESSAGES[newPrologueStep]) {
                newGuidingTextKey = newPrologueStep as keyof typeof PROLOGUE_MESSAGES;
            }
        } else if (typeof specificStepOrKey === 'string') {
            newGuidingTextKey = specificStepOrKey;
            const numericKey = parseInt(specificStepOrKey, 10);
            if (!isNaN(numericKey) && prev.isPrologueActive && PROLOGUE_MESSAGES[numericKey]) {
                 newPrologueStep = numericKey;
            }
        }
        if (newGuidingTextKey && !PROLOGUE_MESSAGES[newGuidingTextKey]) newGuidingTextKey = '';

        // Only update if there's an actual change to prevent infinite loops if called from useEffect
        if (prev.prologueStep !== newPrologueStep || prev.guidingTextKey !== newGuidingTextKey) {
            return { ...prev, prologueStep: newPrologueStep, guidingTextKey: newGuidingTextKey };
        }
        return prev;
    });
  }, [setGameState]);


  const requestPrologueStart = useCallback(() => {
    setGameState(prev => ({ ...prev, status: GameStatus.IntroScreen }));
  }, [setGameState]);

  const startPrologueActual = useCallback(() => {
    console.log("Attempting to start prologue actual (from usePrologue)...");
    try {
      ftueEventTrackerRef.current = {}; // Reset FTUE tracker

      resetRunStats(); // Resets runStats to initial values

      // Calculate initial player stats based on meta progress
      let baseHp = INITIAL_PLAYER_HP, baseGold = INITIAL_PLAYER_GOLD, baseShield = INITIAL_PLAYER_SHIELD;
      let currentMaxSoulFragments = INITIAL_MAX_SOUL_FRAGMENTS; // This is for meta, not directly player run stat

      for (const upgradeId in metaProgressState.mirrorUpgrades) {
          const currentMirrorLevel = metaProgressState.mirrorUpgrades[upgradeId];
          if (currentMirrorLevel > 0) {
              const upgradeDef = MIRROR_UPGRADES_CONFIG.find(u => u.id === upgradeId);
              if (upgradeDef) {
                  let totalEffectValue = 0;
                  for(let i=0; i < currentMirrorLevel; i++) {
                      totalEffectValue += upgradeDef.levels[i].effectValue;
                  }
                  switch (upgradeDef.appliesTo) {
                      case 'playerMaxHp': baseHp += totalEffectValue; break;
                      case 'playerStartGold': baseGold += totalEffectValue; break;
                      case 'playerStartShield': baseShield += totalEffectValue; break;
                      case 'playerMaxSoulFragments': currentMaxSoulFragments += totalEffectValue; break;
                  }
              }
          }
      }
      // Update metaProgress for maxSoulFragments if it changed
      if (metaProgressState.maxSoulFragments !== currentMaxSoulFragments) {
          setAndSaveMetaProgress(prev => ({...prev, maxSoulFragments: currentMaxSoulFragments}), GameStatus.IntroScreen);
      }

      resetPlayerForNewRun(baseHp, baseGold, baseShield);

      // Reset per-run goals in metaProgress
      setAndSaveMetaProgress(prevMeta => {
          const newGoalsProgress = { ...prevMeta.goalsProgress }; let changed = false;
          INITIAL_GOALS_CONFIG.forEach(goalDef => {
              if (goalDef.resetsPerRun && newGoalsProgress[goalDef.id]) {
                  if (newGoalsProgress[goalDef.id].currentValue !== 0 || newGoalsProgress[goalDef.id].completed) {
                      newGoalsProgress[goalDef.id] = { ...newGoalsProgress[goalDef.id], currentValue: 0, completed: false };
                      changed = true;
                  }
              }
          });
          return changed ? { ...prevMeta, goalsProgress: newGoalsProgress } : prevMeta;
      }, GameStatus.IntroScreen);

      const newEnemyInstance = createEnemyInstance(
        PROLOGUE_ENEMY_SHADOW_EMBER.id as EnemyArchetypeId, EnemyRank.Minion, PROLOGUE_LEVEL_ID, PROLOGUE_SHADOW_EMBER_FURY_ABILITY
      );
      setEnemyState(newEnemyInstance);

      const { attacks, gold, traps } = PROLOGUE_BOARD_CONFIG;
      const prologueRatioKey = "prologueFixed";
      // Create a temporary mutable copy of OBJECT_RATIO_DEFINITIONS for this scope if needed, or ensure it's extensible
      const currentRatioDefsCopy = {...OBJECT_RATIO_DEFINITIONS};
      currentRatioDefsCopy[prologueRatioKey] = { attacks, gold };

      const prologueBoardParams: BoardParameters = {
        rows: PROLOGUE_BOARD_CONFIG.rows || PROLOGUE_BOARD_ROWS,
        cols: PROLOGUE_BOARD_CONFIG.cols || PROLOGUE_BOARD_COLS,
        densityPercent: 25, // Example, ensure this is defined or passed
        objectRatioKey: prologueRatioKey,
        traps: traps || 0,
      };
      // Assuming generateBoardFromBoardParameters is prepared for currentLevel, currentArenaLevel, currentBiomeId
      const newBoard = generateBoardFromBoardParameters(prologueBoardParams, [], PROLOGUE_LEVEL_ID, 0, "prologue_biome");
      setBoardState(newBoard);

      setActiveEcosState([]);
      setAvailableEchoChoicesState([]);

      setGameState(prev => ({
        ...prev, status: GameStatus.Playing, currentPhase: GamePhase.PLAYER_TURN,
        currentLevel: PROLOGUE_LEVEL_ID, currentFloor: 0,
        isFuryMinigameActive: false, furyMinigamePhase: 'inactive', furyMinigameCompletedForThisLevel: true,
        oracleSelectedFuryAbility: null, // Prologue might not use Oracle initially
        isPrologueActive: true, prologueStep: 1, prologueEnemyFuryAbility: null, // PROLOGUE_SHADOW_EMBER_FURY_ABILITY could be set here
        eventQueue: [], playerTookDamageThisLevel: false, currentArenaLevel: 0,
        isBattlefieldReductionTransitioning: false, guidingTextKey: 1, // Start with first prologue message
        currentBoardDimensions: { rows: newBoard.length, cols: newBoard[0]?.length || 0 },
        postLevelActionTaken: false,
        currentRunMap: null,
        aiThinkingCellCoords: null, aiActionTargetCell: null,
      }));
      console.log("Prologue setup complete (from usePrologue). Game status set to Playing.");
    } catch (error) {
      console.error("Error during startPrologueActual (from usePrologue):", error);
      setGameState(prev => ({ ...prev, status: GameStatus.MainMenu, guidingTextKey: '' })); // Revert to main menu on error
    }
  }, [
    resetRunStats, metaProgressState, setAndSaveMetaProgress, resetPlayerForNewRun, setEnemyState,
    generateBoardFromBoardParameters, setBoardState, setActiveEcosState, setAvailableEchoChoicesState,
    setGameState // ftueEventTrackerRef is internal
  ]);

  return {
    ftueEventTrackerRef,
    requestPrologueStart,
    startPrologueActual,
    advancePrologueStep,
  };
};
