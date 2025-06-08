// hooks/usePrologueManager.ts
import { useState, useCallback, useRef } from 'react';
import {
    PlayerState, EnemyInstance, BoardState, RunStats, MetaProgressState, FuryAbility,
    GuidingTextKey, GameStatus, GamePhase, BoardParameters, EnemyArchetypeId, EnemyRank, MirrorUpgradeId
} from '../types';
import {
    PROLOGUE_MESSAGES, PROLOGUE_LEVEL_ID, PROLOGUE_ENEMY_SHADOW_EMBER,
    PROLOGUE_SHADOW_EMBER_FURY_ABILITY, PROLOGUE_BOARD_CONFIG, PROLOGUE_BOARD_ROWS, PROLOGUE_BOARD_COLS,
    INITIAL_PLAYER_HP, INITIAL_PLAYER_GOLD, INITIAL_PLAYER_SHIELD, INITIAL_MAX_SOUL_FRAGMENTS, INITIAL_WILL_LUMENS
} from '../constants';
import { OBJECT_RATIO_DEFINITIONS, ENEMY_ARCHETYPE_DEFINITIONS } from '../constants/difficultyConstants';
import { MIRROR_UPGRADES_CONFIG, INITIAL_GOALS_CONFIG } from '../constants/metaProgressionConstants';
import { createEnemyInstance } from '../services/enemyFactory'; // Assuming path

export interface FtueEventTracker {
  firstClueRevealed?: boolean;
  firstAttackRevealedByPlayer?: boolean;
  firstGoldRevealed?: boolean;
  firstAttackRevealedByEnemy?: boolean;
}

export interface UsePrologueManagerProps {
  // State setters from other hooks / main engine
  setExternalGameState: React.Dispatch<React.SetStateAction<any>>; // To update parts of GameStateCore not owned by this hook
  setPlayer: React.Dispatch<React.SetStateAction<PlayerState>>;
  setEnemy: React.Dispatch<React.SetStateAction<EnemyInstance | null>>;
  generateAndSetBoard: (params: BoardParameters, activeEcos: Echo[]) => { rows: number, cols: number }; // From useBoardState
  setRunStats: React.Dispatch<React.SetStateAction<RunStats>>;
  setActiveEcosState: React.Dispatch<React.SetStateAction<Echo[]>>;
  setAvailableEchoChoices: React.Dispatch<React.SetStateAction<Echo[]>>;
  resetFuryMinigameHook: () => void; // From useFuryMinigame (renamed for clarity)
  setGamePhaseHook: (phase: GamePhase) => void; // From useGamePhaseManager (renamed)

  // State values from other hooks / main engine
  metaProgress: MetaProgressState;
  setAndSaveMetaProgress: (updater: React.SetStateAction<MetaProgressState>) => void;
  initialPlayerRunState: PlayerState; // from usePlayerState
  initialRunStatsObject: RunStats; // from useGameProgress
}

export const usePrologueManager = (props: UsePrologueManagerProps) => {
  const [isPrologueActive, setIsPrologueActive] = useState<boolean>(false);
  const [prologueStep, setPrologueStep] = useState<number>(0);
  // prologueEnemyFuryAbility is part of GameStateCore, set by engine based on this hook's state
  // guidingTextKey is also part of GameStateCore, set by engine based on this hook's state

  const ftueEventTracker = useRef<FtueEventTracker>({});

  const advancePrologueStep = useCallback((specificStepOrKey?: number | GuidingTextKey) => {
    // This function will now call props.setExternalGameState to update guidingTextKey
    // and will use setPrologueStep for its internal state.
    props.setExternalGameState((prevGameState: any) => {
      let newGuidingTextKey: GuidingTextKey = '';
      let newInternalPrologueStep = specificStepOrKey !== undefined && typeof specificStepOrKey === 'number'
                                      ? specificStepOrKey
                                      : prevGameState.prologueStep; // Use internal if no specific step

      if (typeof specificStepOrKey === 'number') {
        if (isPrologueActive && PROLOGUE_MESSAGES[specificStepOrKey as keyof typeof PROLOGUE_MESSAGES]) {
          newGuidingTextKey = specificStepOrKey as keyof typeof PROLOGUE_MESSAGES;
        }
      } else if (typeof specificStepOrKey === 'string') { // GuidingTextKey string
        newGuidingTextKey = specificStepOrKey;
        const numericKey = parseInt(specificStepOrKey, 10);
        if (!isNaN(numericKey) && isPrologueActive && PROLOGUE_MESSAGES[numericKey as keyof typeof PROLOGUE_MESSAGES]) {
          newInternalPrologueStep = numericKey;
        }
      } else { // Undefined, just clear guiding text based on current internal step
         if (isPrologueActive && PROLOGUE_MESSAGES[prologueStep as keyof typeof PROLOGUE_MESSAGES]) { newGuidingTextKey = ''; }
      }

      if (newGuidingTextKey && !PROLOGUE_MESSAGES[newGuidingTextKey as keyof typeof PROLOGUE_MESSAGES]) {
          newGuidingTextKey = ''; // Ensure key is valid
      }

      setPrologueStep(newInternalPrologueStep); // Update internal step
      return { ...prevGameState, guidingTextKey: newGuidingTextKey };
    });
  }, [isPrologueActive, prologueStep, props.setExternalGameState]);


  const requestPrologueStart = useCallback(() => {
    props.setExternalGameState((prev:any) => ({ ...prev, status: GameStatus.IntroScreen }));
  }, [props.setExternalGameState]);

  const startPrologueActual = useCallback(() => {
    console.log("Attempting to start prologue actual (from PrologueManager)...");
    try {
      ftueEventTracker.current = {}; // Reset FTUE tracker
      setIsPrologueActive(true);
      setPrologueStep(1);

      props.setRunStats({ ...props.initialRunStatsObject, swordUsedThisLevel: false, swordUsedThisLevelForMirror: false, runUniqueEcosActivated: [], runUniqueFuriesExperienced: [], newlyCompletedGoalIdsThisRun: [] });

      let baseHp = INITIAL_PLAYER_HP, baseGold = INITIAL_PLAYER_GOLD, baseShield = INITIAL_PLAYER_SHIELD;
      let currentMaxSoulFragments = props.metaProgress?.maxSoulFragments || INITIAL_MAX_SOUL_FRAGMENTS;

      if (props.metaProgress) {
        for (const upgradeIdString in props.metaProgress.mirrorUpgrades) {
          const upgradeId = upgradeIdString as MirrorUpgradeId;
          const currentMirrorLevel = props.metaProgress.mirrorUpgrades[upgradeId];
          if (currentMirrorLevel > 0) {
            const upgradeDef = MIRROR_UPGRADES_CONFIG.find(u => u.id === upgradeId);
            if (upgradeDef) {
              let totalEffectValue = 0;
              for(let i=0; i < currentMirrorLevel; i++) { totalEffectValue += upgradeDef.levels[i].effectValue; }
              switch (upgradeDef.appliesTo) {
                case 'playerMaxHp': baseHp += totalEffectValue; break;
                case 'playerStartGold': baseGold += totalEffectValue; break;
                case 'playerStartShield': baseShield += totalEffectValue; break;
                case 'playerMaxSoulFragments': currentMaxSoulFragments += totalEffectValue; break;
              }
            }
          }
        }
        if (props.metaProgress.maxSoulFragments !== currentMaxSoulFragments) {
          props.setAndSaveMetaProgress(prev => ({...prev, maxSoulFragments: currentMaxSoulFragments}));
        }
      }

      props.setPlayer({
        ...props.initialPlayerRunState,
        hp: baseHp, maxHp: baseHp, gold: baseGold, shield: baseShield,
      });

      props.setAndSaveMetaProgress(prevMeta => {
          const currentMetaInternal = prevMeta;
          const newGoalsProgress = { ...currentMetaInternal.goalsProgress }; let changed = false;
          INITIAL_GOALS_CONFIG.forEach(goalDef => {
              if (goalDef.resetsPerRun && newGoalsProgress[goalDef.id]) {
                  if (newGoalsProgress[goalDef.id].currentValue !== 0 || newGoalsProgress[goalDef.id].completed) {
                      newGoalsProgress[goalDef.id] = { ...newGoalsProgress[goalDef.id], currentValue: 0, completed: false }; changed = true;
                  }
              }
          });
          return changed ? { ...currentMetaInternal, goalsProgress: newGoalsProgress } : currentMetaInternal;
      });

      const newEnemyInstance = createEnemyInstance(PROLOGUE_ENEMY_SHADOW_EMBER.id as EnemyArchetypeId, EnemyRank.Minion, PROLOGUE_LEVEL_ID, PROLOGUE_SHADOW_EMBER_FURY_ABILITY);

      const { attacks, gold, traps } = PROLOGUE_BOARD_CONFIG;
      const prologueRatioKey = "prologueFixed";
      const currentRatioDefs = {...OBJECT_RATIO_DEFINITIONS};
      currentRatioDefs[prologueRatioKey] = { attacks, gold };

      const prologueBoardParams: BoardParameters = {
        rows: PROLOGUE_BOARD_CONFIG.rows || PROLOGUE_BOARD_ROWS,
        cols: PROLOGUE_BOARD_CONFIG.cols || PROLOGUE_BOARD_COLS,
        densityPercent: 25,
        objectRatioKey: prologueRatioKey,
        traps: traps || 0,
      };
      // generateAndSetBoard is from useBoardState, passed via props
      const newPrologueBoardDimensions = props.generateAndSetBoard(prologueBoardParams, []);

      props.setEnemy(newEnemyInstance);
      props.setActiveEcosState([]);
      props.setAvailableEchoChoices([]);
      props.resetFuryMinigameHook();

      props.setExternalGameState((prev:any) => ({
        ...prev,
        status: GameStatus.Playing,
        currentLevel: PROLOGUE_LEVEL_ID,
        currentFloor: 0,
        furyMinigameCompletedForThisLevel: true,
        oracleSelectedFuryAbility: null,
        prologueEnemyFuryAbility: null, // Will be set by engine if needed, or by specific prologue events
        isCorazonDelAbismoChoiceActive: false,
        corazonDelAbismoOptions: null,
        playerTookDamageThisLevel: false,
        currentArenaLevel: 0,
        maxArenaReductions: MINI_ARENA_SIZES.length, // Use constant
        isBattlefieldReductionTransitioning: false,
        guidingTextKey: 1 as GuidingTextKey,
        defeatReason: 'standard',
        currentBoardDimensions: newPrologueBoardDimensions,
        postLevelActionTaken: false,
        currentRunMap: null,
        aiThinkingCellCoords: null,
        aiActionTargetCell: null,
        // Specific prologue state now managed by this hook:
        isPrologueActive: true, // Set by this hook
        prologueStep: 1,        // Set by this hook
      }));
      props.setGamePhaseHook(GamePhase.PLAYER_TURN);
      console.log("Prologue setup complete (from PrologueManager). Game status set to Playing.");
    } catch (error) {
      console.error("Error during startPrologueActual (from PrologueManager):", error);
      props.setExternalGameState((prev:any) => ({ ...prev, status: GameStatus.MainMenu, guidingTextKey: '' }));
    }
  }, [
    props.setRunStats, props.initialRunStatsObject, props.metaProgress, props.setAndSaveMetaProgress,
    props.setPlayer, props.initialPlayerRunState, props.generateAndSetBoard, props.setEnemy,
    props.setActiveEcosState, props.setAvailableEchoChoices, props.resetFuryMinigameHook,
    props.setExternalGameState, props.setGamePhaseHook, setIsPrologueActive, setPrologueStep
  ]);

  return {
    isPrologueActive,
    prologueStep,
    // prologueEnemyFuryAbility, // This will be read from main gameState, set by engine if needed
    ftueEventTracker, // Expose the ref's current value if needed by engine, or specific flags
    advancePrologueStep,
    requestPrologueStart,
    startPrologueActual,
  };
};
