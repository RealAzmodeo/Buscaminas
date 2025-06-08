import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  PlayerState, BoardState, CellState, CellType, Echo, GameStatus, EchoEffectType,
  FuryAbility, FuryMinigamePhase, FuryAbilityEffectType, GameStateCore, GamePhase,
  MarkType, Rarity, RunStats, GameEvent, FloatingTextEventPayload, DeactivatedEchoInfo, MetaProgressState,
  EcoTreeNodeData, GoalProgress, GoalDefinition, GoalCellRevealedPayload, GoalEnemyDefeatedPayload, GoalLevelCompletedPayload,
  BoardConfig, GuidingTextKey, RunMapState, RunMapNode, BiomeId, MapRewardType, MapEncounterType,
  EnemyInstance, BoardParameters, EnemyRank, EnemyArchetypeId, AICellInfo, CellPosition, MirrorUpgradeId
} from '../types';
import {
  BOARD_ROWS as DEFAULT_BOARD_ROWS, BOARD_COLS as DEFAULT_BOARD_COLS,
  PROLOGUE_BOARD_ROWS, PROLOGUE_BOARD_COLS, // Used by usePrologueManager
  INITIAL_PLAYER_HP, INITIAL_PLAYER_GOLD, INITIAL_PLAYER_SHIELD, GOLD_REWARD_PER_LEVEL, ATTACK_DAMAGE_PLAYER_VS_ENEMY, ATTACK_DAMAGE_ENEMY_VS_PLAYER,
  GOLD_VALUE, ALL_ECHOS_MAP, BASE_ECHO_ECO_CASCADA, BASE_ECHO_VENGANZA_ESPECTRAL, BASE_ECHO_MAESTRIA_ESTOCADA,
  BASE_ECHO_TORRENTE_ACERO, BASE_ECHO_BOLSA_AGRANDADA, BASE_ECHO_PIEL_PIEDRA, BASE_ECHO_ULTIMO_ALIENTO,
  BASE_ECHO_INSTINTO_BUSCADOR, BASE_ECHO_ALQUIMIA_IMPROVISADA, BASE_ECHO_OJO_OMNISCIENTE, BASE_ECHO_PASO_LIGERO,
  BASE_ECHO_MARCADOR_TACTICO, BASE_ECHO_CARTOGRAFIA_AVANZADA, BASE_ECHO_APRENDIZAJE_RAPIDO, BASE_ECHO_DETECTOR_PELIGROS,
  BASE_ECHO_SENTIDO_ACERO, BASE_ECHO_VISION_AUREA, BASE_ECHO_CLARIVIDENCIA_TOTAL, BASE_ECHO_CORAZON_ABISMO,
  INITIAL_STARTING_ECHOS, FREE_ECHO_OPTIONS, INITIAL_STARTING_FURIESS,
  SOUL_FRAGMENTS_PER_ENEMY_DEFEAT, SOUL_FRAGMENTS_PER_LEVEL_COMPLETE, SOUL_FRAGMENTS_END_RUN_MULTIPLIER,
  NEW_AVAILABLE_ECHOS_FOR_TREE, ALL_ECHOS_LIST, INITIAL_MAX_SOUL_FRAGMENTS, INITIAL_WILL_LUMENS,
  MINI_ARENA_SIZES, MAX_ARENA_REDUCTIONS, MINI_ARENA_ATTACK_MARGIN, MINI_ARENA_ATTACK_DENSITY_FACTOR_PERCENT,
  BATTLEFIELD_TRANSITION_DURATION_MS,
  DEFAULT_LEVELS_PER_STRETCH, MAP_NODE_REWARD_SOUL_FRAGMENTS_VALUE, MAP_DEFAULT_DEPTH, MAP_CHOICES_PER_NODE_MIN, MAP_CHOICES_PER_NODE_MAX, MAP_NODE_REWARD_WILL_LUMENS_VALUE, MAP_NODE_REWARD_HEALING_FOUNTAIN_VALUE,
  PROLOGUE_LEVEL_ID,
  PROLOGUE_ENEMY_SHADOW_EMBER, // Used by usePrologueManager
  PROLOGUE_SHADOW_EMBER_FURY_ABILITY, // Used by usePrologueManager
  PROLOGUE_BOARD_CONFIG, // Used by usePrologueManager
  PROLOGUE_PREDEFINED_ECHO_CHOICES_BASE_IDS, // Used by usePrologueManager
  PROLOGUE_MESSAGES,
  FURY_INCREMENT_PER_CLICK,
  ALL_FURY_ABILITIES_MAP
} from '../constants';
import { usePlayerState, initialPlayerRunState } from './usePlayerState'; // Removed baseInitialPlayerRunState alias
import { useEnemyState } from './useEnemyState';
import { useGameEvents } from './useGameEvents';
import { useGameProgress, initialRunStatsObject } from './useGameProgress';
import {
    useBoardState,
    recalculateAllCluesUtility,
    updateBoardVisualEffectsUtility
} from './useBoardState';
import { useGameConstantsLogic } from './useGameConstantsLogic';
import { useGamePhaseManager } from './useGamePhaseManager';
import { useAbilityHandler } from './useAbilityHandler';
import { useFuryMinigame } from './useFuryMinigame';
import { usePrologueManager } from './usePrologueManager'; // +++ Import usePrologueManager
import { useRunMapManager } from './useRunMapManager'; // +++ Import useRunMapManager
import { usePostLevelManager } from './usePostLevelManager'; // +++ Import usePostLevelManager
import { useCellRevealHandler } from './useCellRevealHandler'; // +++ Import useCellRevealHandler
import { BIOME_DEFINITIONS } from '../constants/biomeConstants';
import { MIRROR_UPGRADES_CONFIG, INITIAL_GOALS_CONFIG, GOAL_IDS } from '../constants/metaProgressionConstants';
import { OBJECT_RATIO_DEFINITIONS, ENEMY_ARCHETYPE_DEFINITIONS, FLOOR_DEFINITIONS } from '../constants/difficultyConstants';
import { generateEncounterForFloor } from '../services/encounterGenerator';
import { createEnemyInstance } from '../services/enemyFactory';
import { playMidiSoundPlaceholder } from '../utils/soundUtils';
import { GoalTrackingService } from '../services/goalTrackingService';
import { AIPlayer } from '../core/ai/AIPlayer';

const PLAYER_ACTION_RESOLVE_DELAY_MS = 300;
const ENEMY_THINKING_MIN_DURATION_MS = 1500;
const ENEMY_THINKING_MAX_DURATION_MS = 3000;
const ENEMY_THINKING_HIGHLIGHT_INTERVAL_MS = 150;
const ENEMY_ACTION_PENDING_REVEAL_DELAY_MS = 500;
const ENEMY_ACTION_RESOLVE_DELAY_MS = 300;
const ENEMY_FURY_GAIN_ON_GOLD_REVEAL = 5;

const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getCurrentFloorNumber = (level: number): number => {
  if (level <= 0) return 0;
  const floorConfig = FLOOR_DEFINITIONS.find(f => level <= (f.floorNumber * 2 + (f.floorNumber-1)));
  return floorConfig ? floorConfig.floorNumber : FLOOR_DEFINITIONS[FLOOR_DEFINITIONS.length -1].floorNumber;
};

const getCurrentlyEffectiveEcos = (allActiveEcos: Echo[], deactivatedEcosInfo: DeactivatedEchoInfo[]): Echo[] => {
  if (!deactivatedEcosInfo || deactivatedEcosInfo.length === 0) {
    return allActiveEcos;
  }
  const deactivatedIds = new Set(deactivatedEcosInfo.map(info => info.echoId));
  return allActiveEcos.filter(echo => !deactivatedIds.has(echo.id));
};

export const useGameEngine = () => {
  const [gameState, setGameState] = useState<GameStateCore>({
    status: GameStatus.MainMenu,
    currentLevel: PROLOGUE_LEVEL_ID, // Initial level, prologue might override this via its own state setter
    currentFloor: 0,
    // Fury Minigame state managed by useFuryMinigame hook
    furyMinigameCompletedForThisLevel: false,
    oracleSelectedFuryAbility: null,
    // Prologue state managed by usePrologueManager hook
    isPrologueActive: false, // Will be controlled by usePrologueManager
    prologueStep: 0,         // Will be controlled by usePrologueManager
    prologueEnemyFuryAbility: null, // Will be controlled by usePrologueManager
    guidingTextKey: '',             // Will be controlled by usePrologueManager (primarily)
    // isCorazonDelAbismoChoiceActive: false, // Removed, managed by usePostLevelManager
    // corazonDelAbismoOptions: null, // Removed, managed by usePostLevelManager
    playerTookDamageThisLevel: false,
    currentArenaLevel: 0,
    maxArenaReductions: MAX_ARENA_REDUCTIONS,
    isBattlefieldReductionTransitioning: false,
    defeatReason: 'standard',
    currentBoardDimensions: { rows: DEFAULT_BOARD_ROWS, cols: DEFAULT_BOARD_COLS },
    // currentRunMap: null, // Removed, to be managed by useRunMapManager
    // currentBiomeId: BiomeId.Default, // Removed, to be managed by useRunMapManager
    // levelsInCurrentStretch: DEFAULT_LEVELS_PER_STRETCH, // Removed, to be managed by useRunMapManager
    // currentStretchCompletedLevels: 0, // Removed, to be managed by useRunMapManager
    // stretchStartLevel: PROLOGUE_LEVEL_ID, // Removed, to be managed by useRunMapManager
    // mapDecisionPending: false, // Removed, to be managed by useRunMapManager
    // stretchRewardPending: null, // Removed, to be managed by useRunMapManager
    postLevelActionTaken: false, // This might be related, but let's evaluate its use first. Keeping for now.
    aiThinkingCellCoords: null,
    aiActionTargetCell: null,
  });
  const { player, setPlayer, initialPlayerRunState } = usePlayerState();
  const { enemy, setEnemy, getInitialEnemy } = useEnemyState();
  const { eventQueue, addGameEvent, popEvent } = useGameEvents();

  const gameProgressHook = useGameProgress({ // Renamed to avoid conflict
    getGameStateStatus: () => gameState.status,
    getCurrentLevel: () => gameState.currentLevel,
  });
  const {
    runStats,
    setRunStats,
    metaProgress,
    setMetaProgressState: setAndSaveMetaProgress,
    loadMetaProgress,
    finalizeRunProgress,
  } = gameProgressHook; // Use initialRunStatsObject from gameProgressHook if needed

  const [activeEcos, setActiveEcosState] = useState<Echo[]>([]);
  // const [availableEchoChoices, setAvailableEchoChoices] = useState<Echo[]>([]); // Removed, managed by usePostLevelManager / new state for UI
  const [availableEchoChoicesForUI, setAvailableEchoChoicesForUI] = useState<Echo[]>([]);


  const fullActiveEcos = useMemo(() => getCurrentlyEffectiveEcos(activeEcos, player.deactivatedEcos), [activeEcos, player.deactivatedEcos]);

  const boardHook = useBoardState({
    activeEcos: fullActiveEcos,
    addGameEvent,
    currentLevel: gameState.currentLevel, // This will be updated by runMapManager via callback
    currentArenaLevel: gameState.currentArenaLevel,
    currentBiomeId: currentBiomeId, // Use currentBiomeId from runMapManager
  });
  const {
    board,
    setBoard,
    generateAndSetBoard,
    recalculateCluesOnCurrentBoard,
    updateVisualEffectsOnCurrentBoard,
    cycleCellMark: cycleCellMarkHook
  } = boardHook;

  const processEnemyMoveRef = useRef<((row: number, col: number) => void) | null>(null);

  const abilityHandlerHook = useAbilityHandler({
    player, setPlayer, enemy, setEnemy, board, setBoard,
    activeEcos: fullActiveEcos,
    addGameEvent,
    setPlayerTookDamageThisLevel: (value) => setGameState(prev => ({ ...prev, playerTookDamageThisLevel: value })),
  });
  const {
    conditionalEchoTriggeredId,
    triggerConditionalEchoAnimation,
    applyFuryEffect
  } = abilityHandlerHook;

  const prologueManagerHook = usePrologueManager({ // +++ Instantiate usePrologueManager
    setExternalGameState: setGameState, // Allow prologue manager to update parts of GameStateCore
    setPlayer,
    setEnemy,
    generateAndSetBoard, // from useBoardState
    setRunStats,
    setActiveEcosState,
    setAvailableEchoChoices: setAvailableEchoChoicesForUI, // Pass setter for UI state if PostLevelManager needs to update it directly
    resetFuryMinigameHook: () => {}, // Placeholder, will be from useFuryMinigame
    setGamePhaseHook: () => {}, // Placeholder, will be from useGamePhaseManager
    metaProgress,
    setAndSaveMetaProgress,
    initialPlayerRunState,
    initialRunStatsObject: gameProgressHook.initialRunStatsObject, // Pass from gameProgressHook
  });
  const {
    isPrologueActive, // Get from hook
    prologueStep,     // Get from hook
    // prologueEnemyFuryAbility is managed by gameState for now, set by startPrologueActual if needed
    ftueEventTracker, // Get from hook
    advancePrologueStep, // Get from hook
    requestPrologueStart, // Get from hook
    startPrologueActual  // Get from hook
  } = prologueManagerHook;

  const furyMinigameHook = useFuryMinigame({
    isPrologueActiveCurrently: isPrologueActive, // Use from prologueManagerHook
    currentLevelCurrently: gameState.currentLevel,
    prologueStepCurrently: prologueStep, // Use from prologueManagerHook
    advancePrologueStepCallback: advancePrologueStep, // Use from prologueManagerHook
  });
  const {
    isFuryMinigameActive,
    furyMinigamePhase,
    furyCardOptions,
    shuffledFuryCardOrder,
    playerSelectedFuryCardDisplayIndex,
    oracleSelectedFuryAbility: oracleSelectedFuryFromHook,
    startFuryMinigame,
    advanceFuryMinigamePhase: advanceFuryMinigamePhaseHook,
    handlePlayerFuryCardSelection: handlePlayerFuryCardSelectionHook,
    resetFuryMinigame
  } = furyMinigameHook;

  // Update gameState based on furyMinigameHook's state
  useEffect(() => {
    if (oracleSelectedFuryFromHook !== gameState.oracleSelectedFuryAbility) {
      setGameState(prev => ({ ...prev, oracleSelectedFuryAbility: oracleSelectedFuryFromHook }));
    }
  }, [oracleSelectedFuryFromHook, gameState.oracleSelectedFuryAbility]);

  useEffect(() => {
    const minigameCompleted = !isFuryMinigameActive && furyMinigamePhase === 'inactive' && !!oracleSelectedFuryFromHook;
    if (minigameCompleted !== gameState.furyMinigameCompletedForThisLevel) {
        setGameState(prev => ({ ...prev, furyMinigameCompletedForThisLevel: minigameCompleted }));
    }
  }, [isFuryMinigameActive, furyMinigamePhase, oracleSelectedFuryFromHook, gameState.furyMinigameCompletedForThisLevel]);

  // Update prologueManagerHook with actual resetFuryMinigame and setGamePhase
  useEffect(() => {
    prologueManagerHook.resetFuryMinigameHook = resetFuryMinigame;
    prologueManagerHook.setGamePhaseHook = setGamePhase; // from gamePhaseManagerHook
  }, [resetFuryMinigame, setGamePhase, prologueManagerHook]);


  const gamePhaseManagerHook = useGamePhaseManager({
    currentStatus: gameState.status,
    isPrologueActive: isPrologueActive, // Use from prologueManagerHook
    prologueEnemyFuryAbility: gameState.prologueEnemyFuryAbility, // Still from gameState
    aiActionTargetCellFromEngine: gameState.aiActionTargetCell,
    setAiActionTargetCellInEngine: (cell) => setGameState(prev => ({ ...prev, aiActionTargetCell: cell })),
    setAiThinkingCellCoordsInEngine: (cell) => setGameState(prev => ({ ...prev, aiThinkingCellCoords: cell })),
    playerHp: player.hp,
    enemyState: enemy,
    setEnemyState: setEnemy,
    currentBoard: board,
    processEnemyMove: (...args) => processEnemyMoveRef.current?.(...args),
    applyFuryEffect: applyFuryEffect,
  });
  const { currentPhase, setGamePhase } = gamePhaseManagerHook; // This was re-declared, ensure it's the final one.

  // +++ useRunMapManager integration
  const setGameStateForNewStretchInEngine = useCallback((newStateFromMapManager: {
    currentBiomeId: BiomeId,
    levelsInCurrentStretch: number,
    currentStretchCompletedLevels: number,
    stretchStartLevel: number,
    mapDecisionPending: boolean,
    stretchRewardPending: GameStateCore['stretchRewardPending'] | null,
    postLevelActionTaken: boolean,
    currentRunMap: RunMapState, // Added to keep track of the map state
    currentLevel: number, // Added to keep track of the current level
  }) => {
    setGameState(prev => ({
      ...prev,
      // currentBiomeId: newStateFromMapManager.currentBiomeId, // Managed by runMapManager now
      // levelsInCurrentStretch: newStateFromMapManager.levelsInCurrentStretch, // Managed by runMapManager now
      // currentStretchCompletedLevels: newStateFromMapManager.currentStretchCompletedLevels, // Managed by runMapManager now
      // stretchStartLevel: newStateFromMapManager.stretchStartLevel, // Managed by runMapManager now
      // mapDecisionPending: newStateFromMapManager.mapDecisionPending, // Managed by runMapManager now
      // stretchRewardPending: newStateFromMapManager.stretchRewardPending, // Managed by runMapManager now
      postLevelActionTaken: newStateFromMapManager.postLevelActionTaken, // This might still be relevant for game flow
      currentLevel: newStateFromMapManager.currentLevel, // Update currentLevel based on map manager
    }));
    // If a new stretch begins, GameStatus.PostLevel might be appropriate.
    // However, selectMapPathAndStartStretch in runMapManager will call setGameStatus directly if needed.
  }, [setGameState]);

  const runMapManager = useRunMapManager({
    setGameStatus,
    getCurrentLevel: () => gameState.currentLevel,
    setGameStateForNewStretch: setGameStateForNewStretchInEngine,
    initialPlayerEcos: initialPlayerRunState.activeEcos, // Assuming this is the right place/way to get initial ecos
    metaProgress, // Pass metaProgress for potential map generation logic
  });

  const {
    currentRunMap,
    currentBiomeId,
    levelsInCurrentStretch,
    currentStretchCompletedLevels,
    stretchStartLevel,
    mapDecisionPending,
    stretchRewardPending,
    initializeMapForNewRun,
    selectMapPathAndStartStretch, // This is the new one from the hook
    completeStretch,
    updateCurrentMapNodeAsCompleted, // Added for explicitness if needed elsewhere
  } = runMapManager;
  // +++ End of useRunMapManager integration

  const wasCorazonDelAbismoChoiceActivePreviously = useRef(isPostLevelSequenceActive && postLevelManager?.postLevelPhase === 'corazonChoice'); // Updated to use postLevelManager state
  const battlefieldReductionTimeoutRef = useRef<number | null>(null);

  const executeProceedToNextLevelInEngine = useCallback(() => {
    // This was the original proceedToNextLevel, renamed.
    // PostLevelManager will call this when it's time to actually advance.
    const isCurrentlyPrologue = isPrologueActive; // from usePrologueManager
    const currentLevelForPrologCheck = gameState.currentLevel; // from gameState

    // Fury minigame check - this part might be redundant if PostLevelManager handles the trigger
    if (
        (gameState.status === GameStatus.PostLevel || (isCurrentlyPrologue && currentLevelForPrologCheck === PROLOGUE_LEVEL_ID)) &&
        !furyMinigameHook.isFuryMinigameActive && // Use hook's direct state
        !gameState.furyMinigameCompletedForThisLevel // Check game state flag
    ) {
        // This block might be entered if PostLevelManager decides not to run fury, but game state thinks it should.
        // Consider if PostLevelManager should be the sole decider for starting fury minigame.
        // For now, keeping original logic but using hook's state where possible.
        console.log("[executeProceedToNextLevelInEngine] Fury check triggered.");
        const nextLevelForFuryOptions = isPrologueActive ? 1 : gameState.currentLevel + 1;
        const options = getFuryOptionsForOracle(metaProgress.awakenedFuryIds, player.nextOracleOnlyCommonFury);
        furyMinigameHook.startFuryMinigame(options);
        setGameState(prev => ({ ...prev, postLevelActionTaken: false })); // Reset this flag
        return;
    }

    const currentLevelForHook = isPrologueActive && gameState.currentLevel === PROLOGUE_LEVEL_ID ? 1 : gameState.currentLevel + 1;
    const currentFloor = getCurrentFloorNumber(currentLevelForHook);
    const isTransitioningFromPrologue = isPrologueActive && currentLevelForHook === 1;

    let newPlayerGold = player.gold + GOLD_REWARD_PER_LEVEL;
    const bolsaAgrandadaEcho = activeEcos.find(e => e.baseId === BASE_ECHO_BOLSA_AGRANDADA);
    if (bolsaAgrandadaEcho) { newPlayerGold += (bolsaAgrandadaEcho.value as number) * (bolsaAgrandadaEcho.effectivenessMultiplier || 1); }

    setPlayer(prevPlayer => ({
      ...prevPlayer, gold: newPlayerGold, firstBombDamageTakenThisLevel: false,
      swordDamageModifier: 0, swordDamageModifierClicksRemaining: 0, venganzaSpectralCharge: 0,
      alquimiaImprovisadaActiveForNextBomb: false, pasoLigeroTrapIgnoredThisLevel: false,
      ojoOmniscienteUsedThisLevel: false, consecutiveSwordsRevealed: 0,
    }));
    setRunStats(prevStats => ({
      ...prevStats, soulFragmentsEarnedThisRun: prevStats.soulFragmentsEarnedThisRun + SOUL_FRAGMENTS_PER_LEVEL_COMPLETE,
      levelsCompletedThisRun: prevStats.levelsCompletedThisRun + 1, swordUsedThisLevel: false, swordUsedThisLevelForMirror: false,
    }));
    if(!gameState.playerTookDamageThisLevel && gameState.currentLevel !== PROLOGUE_LEVEL_ID) {
        setRunStats(prevStats => ({ ...prevStats, levelsCompletedWithoutDamageThisRun: prevStats.levelsCompletedWithoutDamageThisRun + 1 }));
        GoalTrackingService.processEvent('LEVEL_COMPLETED_NO_DAMAGE', { levelNumber: gameState.currentLevel } as GoalLevelCompletedPayload, metaProgress, setAndSaveMetaProgress);
    }
    GoalTrackingService.processEvent('LEVEL_COMPLETED_IN_RUN', { levelNumber: gameState.currentLevel } as GoalLevelCompletedPayload, metaProgress, setAndSaveMetaProgress);

    const currentOracleSelection = oracleSelectedFuryFromHook || gameState.oracleSelectedFuryAbility;
    if (!currentOracleSelection && !isPrologueActive && !isTransitioningFromPrologue) {
      console.error("Oracle fury not selected before proceeding to next level!");
    }
    const effectiveOracleFury = currentOracleSelection || (isTransitioningFromPrologue ? INITIAL_STARTING_FURIESS[0] : PROLOGUE_SHADOW_EMBER_FURY_ABILITY);

    const encounter = generateEncounterForFloor(currentFloor, currentLevelForHook, effectiveOracleFury);
    setEnemy(encounter.enemy);

    let finalBoardParams = encounter.boardParams;
    
    if (isTransitioningFromPrologue) {
        if (!currentRunMap) {
            console.warn("[executeProceedToNextLevelInEngine] Prologue transition: currentRunMap is null. Initializing map now.");
            initializeMapForNewRun();
        }
    }

    const biomeDefinition = BIOME_DEFINITIONS[currentBiomeId];
    if (biomeDefinition && biomeDefinition.boardModifiers) {
      let currentMapNodeForModifiers = null;
      if(currentRunMap && currentRunMap.nodes[currentRunMap.currentNodeId]){
        currentMapNodeForModifiers = currentRunMap.nodes[currentRunMap.currentNodeId];
      }
      finalBoardParams = biomeDefinition.boardModifiers(encounter.boardParams, currentLevelForHook, currentMapNodeForModifiers?.rewardType);
    }

    const newBoardDimensions = generateAndSetBoard(finalBoardParams, activeEcos);
    
    setGameState(prev => ({
      ...prev,
      status: GameStatus.Playing,
      currentLevel: currentLevelForHook,
      currentFloor,
      currentArenaLevel: 0,
      furyMinigameCompletedForThisLevel: false,
      oracleSelectedFuryAbility: null, // Reset oracle selection for next level
      postLevelActionTaken: false, // Reset flag for next post-level sequence
      playerTookDamageThisLevel: false,
      isPrologueActive: false,
      prologueStep: 0,
      guidingTextKey: '',
      currentBoardDimensions: {rows: newBoardDimensions.rows, cols: newBoardDimensions.cols},
      aiThinkingCellCoords: null,
      aiActionTargetCell: null,
    }));
    setGamePhase(GamePhase.PLAYER_TURN);
  }, [
        gameState.status, gameState.currentLevel, gameState.furyMinigameCompletedForThisLevel, gameState.playerTookDamageThisLevel, // gameState direct reads
        oracleSelectedFuryFromHook, gameState.oracleSelectedFuryAbility, // gameState direct reads for oracle
        player, activeEcos, metaProgress, // player state and progression
        isPrologueActive, // from prologueManager
        furyMinigameHook.isFuryMinigameActive, furyMinigameHook.startFuryMinigame, // from furyMinigameHook
        getFuryOptionsForOracle, // from gameConstantsLogic
        setPlayer, setRunStats, setEnemy, setAndSaveMetaProgress, // core setters
        generateAndSetBoard, // from boardHook
        initializeMapForNewRun, currentRunMap, currentBiomeId, // from runMapManager
        setGamePhase // from gamePhaseManager
        // Removed: gameState (full object), mapDecisionPending (now from runMapManager)
        // Added specific gameState fields and hook states for more granular dependency tracking.
    ]);


  const initializeNewRun = useCallback((startFromPrologue: boolean) => {
    if (startFromPrologue) {
      requestPrologueStart(); // This will set GameStatus.Prologue and then startPrologueActual will be called
      // initializeMapForNewRun() will be called by proceedToNextLevel when transitioning from prologue.
    } else {
      // Directly initialize map for a non-prologue run (e.g., skipping prologue)
      const newInitialPlayerState = initialPlayerRunState(metaProgress);
      setActiveEcosState(newInitialPlayerState.activeEcos);
      setPlayer(newInitialPlayerState);
      setRunStats(gameProgressHook.initialRunStatsObject); // Reset run stats
      setEnemy(null); // No enemy at the start of a run before the first level

      initializeMapForNewRun(); // This will set currentLevel, currentBiomeId etc. via callback

      // The actual first level setup will be triggered by proceedToNextLevel,
      // which should be called after initializeNewRun sets the stage.
      // For a direct start (not from prologue), we might need to manually call proceedToNextLevel
      // or ensure the UI flow leads to it.
      // For now, initializeMapForNewRun sets mapDecisionPending to true, leading to AbyssMapView.
      setGameStatus(GameStatus.AbyssMapView); // Start at map view to select first path
      setGamePhase(GamePhase.PLAYER_TURN); // Or an appropriate phase for map view
    }
  }, [
    requestPrologueStart,
    initialPlayerRunState,
    metaProgress,
    setActiveEcosState,
    setPlayer,
    setRunStats,
    gameProgressHook.initialRunStatsObject,
    setEnemy,
    initializeMapForNewRun,
    setGameStatus,
    setGamePhase
  ]);

  const setGameStatus = useCallback((newStatus: GameStatus, newDefeatReason: 'standard' | 'attrition' = 'standard') => {
    if (newStatus === GameStatus.GameOverDefeat || newStatus === GameStatus.GameOverWin) {
        finalizeRunProgress(newStatus === GameStatus.GameOverWin);
        if (gameState.currentLevel >= 1 && gameState.status === GameStatus.Playing) {
             GoalTrackingService.processEvent('PROLOGUE_COMPLETED', null, metaProgress, setAndSaveMetaProgress);
        }
    }
    if (newStatus === GameStatus.Sanctuary && metaProgress.firstSanctuaryVisit) {
        GoalTrackingService.processEvent('SANCTUARY_FIRST_VISIT', null, metaProgress, setAndSaveMetaProgress);
        setAndSaveMetaProgress(prev => ({...prev, firstSanctuaryVisit: false }));
    }
    setGameState(prev => ({ ...prev, status: newStatus, defeatReason: newStatus === GameStatus.GameOverDefeat ? newDefeatReason : 'standard' }));
  }, [finalizeRunProgress, gameState.currentLevel, gameState.status, metaProgress, setAndSaveMetaProgress]);

  useEffect(() => {
    if (player.hp <= 0 &&
        gameState.status === GameStatus.Playing &&
        currentPhase !== GamePhase.PRE_DEFEAT_SEQUENCE &&
        currentPhase !== GamePhase.PRE_VICTORY_SEQUENCE
        ) {
      playMidiSoundPlaceholder('player_defeat');
      setGamePhase(GamePhase.PRE_DEFEAT_SEQUENCE);
    }
  }, [player.hp, gameState.status, currentPhase, setGamePhase]);

  const confirmAndAbandonRun = useCallback(() => {
    playMidiSoundPlaceholder('abandon_run_confirmed');
    setGameStatus(GameStatus.GameOverDefeat);
  }, [setGameStatus]);

  const {
    generateEchoChoicesForPostLevelScreen,
    getFuryOptionsForOracle
  } = useGameConstantsLogic();

  // Removed generateRunMap function
  // proceedToNextLevel is now executeProceedToNextLevelInEngine

  // Removed selectMapPathAndStartStretch function (from useGameEngine itself)

  // +++ useCellRevealHandler integration
  const recalculateCluesAndUpdateBoardCallback = useCallback((currentBoard: BoardState): BoardState => {
    const boardAfterClues = boardHook.recalculateAllCluesUtility(currentBoard);
    const boardAfterEffects = boardHook.updateBoardVisualEffectsUtility(boardAfterClues, fullActiveEcos);
    setBoard(boardAfterEffects);
    return boardAfterEffects;
  }, [boardHook.recalculateAllCluesUtility, boardHook.updateBoardVisualEffectsUtility, fullActiveEcos, setBoard]);

  const cellRevealHandler = useCellRevealHandler({
    fullActiveEcos,
    metaProgress,
    isPrologueActive,
    prologueStep,
    ftueEventTrackerRef: ftueEventTracker, // Pass the ref from prologueManagerHook
    addGameEvent,
    triggerConditionalEchoAnimation,
    advancePrologueStep,
    setPlayerTookDamageThisLevelInEngine: (value) => setGameState(prev => ({ ...prev, playerTookDamageThisLevel: value })),
    getBoardDimensions: () => gameState.currentBoardDimensions,
    recalculateCluesAndUpdateBoard: recalculateCluesAndUpdateBoardCallback,
    setAndSaveMetaProgress,
  });
  // +++ End of useCellRevealHandler integration

  const doProcessEnemyMove = useCallback((row: number, col: number) => {
    if (!enemy) return;

    const {
        newPlayer,
        newEnemy,
        newRunStats,
        updatedBoard
    } = cellRevealHandler.resolveEnemyCellReveal({
        row, col, currentBoard: board, player, enemy, runStats
    });

    setPlayer(newPlayer);
    setEnemy(newEnemy);
    setRunStats(newRunStats);
    // setBoard(updatedBoard); // recalculateCluesAndUpdateBoardCallback already calls setBoard

    if (newPlayer.hp <= 0) {
      // Player defeat sequence is handled by PRE_DEFEAT_SEQUENCE phase in gamePhaseManager
      // Ensure gamePhaseManager's useEffect for player HP will catch this
    } else if (newEnemy && newEnemy.currentHp <= 0) {
      playMidiSoundPlaceholder('enemy_defeat');
      GoalTrackingService.processEvent('ENEMY_DEFEATED', { enemyArchetypeId: newEnemy.archetypeId } as GoalEnemyDefeatedPayload, metaProgress, setAndSaveMetaProgress);
      // setRunStats already updated by resolver

      setGamePhase(GamePhase.PRE_VICTORY_SEQUENCE);
      setGameState(prev => ({ ...prev, status: GameStatus.PostLevel }));
      postLevelManager.startPostLevelSequence();
    }
    // Game phase transition to ENEMY_ACTION_RESOLVED or similar will be handled by gamePhaseManager
  }, [
    board, player, enemy, runStats, // Core states needed by resolver
    cellRevealHandler, // Added cellRevealHandler (which contains resolveEnemyCellReveal)
    setPlayer, setEnemy, setRunStats, // State setters
    metaProgress, setAndSaveMetaProgress, // For GoalTracking
    setGamePhase, setGameState, postLevelManager, // Game flow
    // Dependencies of resolveEnemyCellReveal are managed within useCellRevealHandler
  ]);

  useEffect(() => {
    processEnemyMoveRef.current = doProcessEnemyMove;
  }, [doProcessEnemyMove]);


  const handlePlayerCellSelection = useCallback((row: number, col: number) => {
    if (currentPhase !== GamePhase.PLAYER_TURN) return;
    if (board[row][col].revealed || board[row][col].lockedIncorrectlyForClicks > 0) return;

    playMidiSoundPlaceholder('cell_click');

    // Decrement clicks for buffs/debuffs
    let tempPlayer = { ...player };
    tempPlayer.clicksOnBoardThisRun = (tempPlayer.clicksOnBoardThisRun || 0) + 1; // Ensure initialization
    if (tempPlayer.deactivatedEcos.length > 0) {
        const stillDeactivated: DeactivatedEchoInfo[] = [];
        tempPlayer.deactivatedEcos.forEach(de => {
            de.clicksRemaining -=1;
            if (de.clicksRemaining > 0) stillDeactivated.push(de);
            else addGameEvent({ text: `Eco "${de.name}" reactivado!`, type: 'info', targetId: 'player-stats-container'});
        });
        tempPlayer.deactivatedEcos = stillDeactivated;
    }
    if (tempPlayer.debuffEspadasOxidadasClicksRemaining > 0) tempPlayer.debuffEspadasOxidadasClicksRemaining--;
    if (tempPlayer.vinculoDolorosoClicksRemaining > 0) tempPlayer.vinculoDolorosoClicksRemaining--;
    else if (tempPlayer.vinculoDolorosoActive) tempPlayer.vinculoDolorosoActive = false;
    if (tempPlayer.pistasFalsasClicksRemaining > 0) tempPlayer.pistasFalsasClicksRemaining--;
    if (tempPlayer.paranoiaGalopanteClicksRemaining > 0) tempPlayer.paranoiaGalopanteClicksRemaining--;
    if (tempPlayer.invulnerabilityClicksRemaining > 0) tempPlayer.invulnerabilityClicksRemaining--;
    if (tempPlayer.criticalHitClicksRemaining > 0) tempPlayer.criticalHitClicksRemaining--;
    if (tempPlayer.swordDamageModifierClicksRemaining > 0) tempPlayer.swordDamageModifierClicksRemaining--;
    else if (tempPlayer.swordDamageModifier > 0) tempPlayer.swordDamageModifier = 0;

    // Call resolver
    const {
        newPlayer,
        newEnemy,
        newRunStats,
        // updatedBoard, // setBoard is called within the callback passed to resolver
        cellsRevealedThisTurnForFury
    } = cellRevealHandler.resolvePlayerCellReveal({
        row, col, currentBoard: board, player: tempPlayer, enemy, runStats
    });

    setPlayer(newPlayer);
    setEnemy(newEnemy);
    setRunStats(newRunStats);
    // setBoard(updatedBoard); // Board is updated via callback

    if (newPlayer.hp <= 0) {
      setGamePhase(GamePhase.PLAYER_ACTION_RESOLVING);
      return;
    } else if (newEnemy && newEnemy.currentHp <= 0) {
      playMidiSoundPlaceholder('enemy_defeat');
      // GoalTracking & RunStats for enemy defeat are handled by resolver or its effects.
      // Here, just trigger the game flow change.
      setGamePhase(GamePhase.PRE_VICTORY_SEQUENCE);
      setGameState(prev => ({ ...prev, status: GameStatus.PostLevel }));
      postLevelManager.startPostLevelSequence();
      return;
    } else if (gameState.status === GameStatus.Playing && checkAllPlayerBeneficialAttacksRevealed()) {
      triggerBattlefieldReduction();
    }

    let finalEnemyStateForFuryUpdate = { ...newEnemyState };
    if (finalEnemyStateForFuryUpdate.currentHp > 0 && !isPrologueActive) {
        finalEnemyStateForFuryUpdate.currentFuryCharge = Math.min(finalEnemyStateForFuryUpdate.furyActivationThreshold, finalEnemyStateForFuryUpdate.currentFuryCharge + (cellsRevealedThisTurnForFury * FURY_INCREMENT_PER_CLICK));
    }
    setEnemy(finalEnemyStateForFuryUpdate);

    if (newPlayer.hp === 1 && !newPlayer.ultimoAlientoUsedThisRun) { // Use newPlayer from resolver
        const ultimoAlientoEcho = fullActiveEcos.find(e => e.baseId === BASE_ECHO_ULTIMO_ALIENTO); // Use fullActiveEcos
        if (ultimoAlientoEcho) {
            const updatedPlayerForAliento = {...newPlayer, ultimoAlientoUsedThisRun: true, isInvulnerable: true, invulnerabilityClicksRemaining: (ultimoAlientoEcho.value as { clicks: number }).clicks, criticalHitClicksRemaining: (ultimoAlientoEcho.value as { clicks: number }).clicks};
            setPlayer(updatedPlayerForAliento); // Update player state with Aliento effects
            triggerConditionalEchoAnimation(ultimoAlientoEcho.id);
            addGameEvent({ text: '¡Último Aliento!', type: 'info', targetId: 'player-stats-container' });
        }
    }

    if (isPrologueActive && prologueStep === 6 && newEnemy && newEnemy.currentHp > 0) { // Check newEnemy
      advancePrologueStep(6); // This was ftueEventTrackerRef.current.enemySurvivedInitialHit in original logic, ensure correct step
    }

    setGamePhase(GamePhase.PLAYER_ACTION_RESOLVING);

  }, [
    board, player, enemy, runStats, gameState.status, gameState.currentBoardDimensions, // Core states
    cellRevealHandler, // Added cellRevealHandler (which contains resolvePlayerCellReveal)
    setPlayer, setEnemy, setRunStats, setBoard, // State setters
    addGameEvent, triggerConditionalEchoAnimation, // Eventing & Animation
    isPrologueActive, prologueStep, advancePrologueStep, // Prologue
    fullActiveEcos, // For Ultimo Aliento
    checkAllPlayerBeneficialAttacksRevealed, triggerBattlefieldReduction, // Other utils/actions
    metaProgress, setAndSaveMetaProgress, // Progression
    setGamePhase, setGameState, postLevelManager, // Game flow
    currentPhase, // For turn check
    // Dependencies of resolvePlayerCellReveal are managed within useCellRevealHandler
  ]);

  useEffect(() => {
    processEnemyMoveRef.current = doProcessEnemyMove;
  }, [doProcessEnemyMove]);

  const cycleCellMark = useCallback((row: number, col: number) => {
    if (currentPhase !== GamePhase.PLAYER_TURN) return;
    cycleCellMarkHook(row, col);
  }, [currentPhase, cycleCellMarkHook]);

  // selectEchoOption is removed, logic moved to usePostLevelManager.handleEchoSelected
  // resolveCorazonDelAbismoChoice is removed, logic moved to usePostLevelManager.resolveCorazonDelAbismoChoiceInManager

  // advanceFuryMinigamePhase and handlePlayerFuryCardSelection are now from useFuryMinigame hook
  // Calls will be made to advanceFuryMinigamePhaseHook and handlePlayerFuryCardSelectionHook

  const tryActivateAlquimiaImprovisada = useCallback(() => {
    const alquimiaEcho = activeEcos.find(e => e.baseId === BASE_ECHO_ALQUIMIA_IMPROVISADA);
    if (!alquimiaEcho || !player.alquimiaImprovisadaChargeAvailable) return;
    const cost = (alquimiaEcho.value as number)  * (alquimiaEcho.effectivenessMultiplier || 1);
    if (player.gold < cost) { addGameEvent({ text: `Oro insuficiente para Alquimia (${cost})`, type: 'info' }); playMidiSoundPlaceholder('alquimia_activate_fail_gold'); return; }
    playMidiSoundPlaceholder('alquimia_activate_success');
    setPlayer(prev => ({ ...prev, gold: prev.gold - cost, alquimiaImprovisadaChargeAvailable: false, alquimiaImprovisadaActiveForNextBomb: true }));
    triggerConditionalEchoAnimation(alquimiaEcho.id); addGameEvent({ text: 'Alquimia Improvisada ¡Activada!', type: 'info', targetId: 'player-stats-container' });
  }, [player, activeEcos, addGameEvent, triggerConditionalEchoAnimation]);

  const tryActivateOjoOmnisciente = useCallback(() => {
    const ojoEcho = activeEcos.find(e => e.baseId === BASE_ECHO_OJO_OMNISCIENTE); if (!ojoEcho || player.ojoOmniscienteUsedThisLevel) return;
    let targetFound = false, revealedCellR = -1, revealedCellC = -1;
    const currentBoardLocal = board;
    const BOARD_ROWS_FOR_LEVEL = currentBoardLocal.length; const BOARD_COLS_FOR_LEVEL = currentBoardLocal[0]?.length || 0;
    for (let r = 0; r < BOARD_ROWS_FOR_LEVEL && !targetFound; r++) for (let c = 0; c < BOARD_COLS_FOR_LEVEL && !targetFound; c++) {
        if (currentBoardLocal[r][c].revealed && currentBoardLocal[r][c].type === CellType.Clue) {
            for (let dr = -1; dr <= 1 && !targetFound; dr++) for (let dc = -1; dc <= 1 && !targetFound; dc++) { if (dr === 0 && dc === 0) continue;
                const nr = r + dr; const nc = c + dc;
                if (nr >= 0 && nr < BOARD_ROWS_FOR_LEVEL && nc >= 0 && nc < BOARD_COLS_FOR_LEVEL && !currentBoardLocal[nr][nc].revealed && (currentBoardLocal[nr][nc].type === CellType.Attack || currentBoardLocal[nr][nc].type === CellType.Gold)) { targetFound = true; revealedCellR = nr; revealedCellC = nc; }
            }
        }
    }
    if (targetFound && revealedCellR !== -1) {
        playMidiSoundPlaceholder('ojo_omnisciente_activate');
        const newBoard = currentBoardLocal.map(bRow => bRow.map(bCell => ({...bCell})));
        newBoard[revealedCellR][revealedCellC].revealed = true;
        setBoard(updateBoardVisualEffectsUtility(recalculateAllCluesUtility(newBoard), activeEcos));
        setPlayer(prev => ({ ...prev, ojoOmniscienteUsedThisLevel: true })); triggerConditionalEchoAnimation(ojoEcho.id);
        addGameEvent({ text: '¡Ojo Omnisciente revela un objeto!', type: 'info', targetId: `cell-${revealedCellR}-${revealedCellC}` });
    } else { playMidiSoundPlaceholder('ojo_omnisciente_fail_no_targets'); addGameEvent({ text: 'Ojo Omnisciente: No hay objetos válidos que revelar.', type: 'info' }); }
  }, [player, board, activeEcos, addGameEvent, triggerConditionalEchoAnimation, setBoard]);

  const resolveCorazonDelAbismoChoice = useCallback((type: 'epic' | 'duplicate', chosenEchoId?: string) => {
    // No direct Corazon choice active check on gameState needed here, PostLevelManager handles its own phase
    // Logic is now within postLevelManager.resolveCorazonDelAbismoChoiceInManager
    // This function in useGameEngine might be removed or adapted if UI calls it directly.
    // For now, assuming UI will call postLevelManager's version via props.
    postLevelManager.resolveCorazonDelAbismoChoiceInManager(type, chosenEchoId);
  }, [postLevelManager]); // Dependency on postLevelManager

  // useEffect for PostLevel status is now largely handled by PostLevelManager's internal useEffect.
  // This one can be removed or simplified if it has other responsibilities.
  // For now, removing the complex PostLevel transition logic.
  // Keeping the battlefield reduction timeout for now as it's unrelated.
  useEffect(() => {
    // Original PostLevel logic is moved to usePostLevelManager.
    // If other effects depend on gameState.status changing to PostLevel, they can remain.
    if (wasCorazonDelAbismoChoiceActivePreviously.current && !(postLevelManager.isPostLevelSequenceActive && postLevelManager.postLevelPhase === 'corazonChoice')) {
       // Logic that might need to run when Corazon choice is *no longer* active, if any.
       // This was previously handled by wasCorazonDelAbismoChoiceActivePreviously.current = gameState.isCorazonDelAbismoChoiceActive
       // in the old PostLevel useEffect.
    }
    wasCorazonDelAbismoChoiceActivePreviously.current = postLevelManager.isPostLevelSequenceActive && postLevelManager.postLevelPhase === 'corazonChoice';

  }, [postLevelManager.isPostLevelSequenceActive, postLevelManager.postLevelPhase]);

  useEffect(() => {
    if (gameState.guidingTextKey === 'BATTLEFIELD_REDUCTION_COMPLETE' && !gameState.isBattlefieldReductionTransitioning) {
      const timer = setTimeout(() => { if (gameState.guidingTextKey === 'BATTLEFIELD_REDUCTION_COMPLETE') advancePrologueStep(''); }, 4000); // Use advancePrologueStep from hook
      return () => clearTimeout(timer);
    }
  }, [gameState.guidingTextKey, gameState.isBattlefieldReductionTransitioning, advancePrologueStep]);

  const debugWinLevel = useCallback(() => {
    if (gameState.status !== GameStatus.Playing) return; playMidiSoundPlaceholder('debug_win_level');
    setEnemy(prev => prev ? ({...prev, currentHp: 0}) : null);
    if (enemy) {
      GoalTrackingService.processEvent('ENEMY_DEFEATED', { enemyArchetypeId: enemy.archetypeId } as GoalEnemyDefeatedPayload, metaProgress, setAndSaveMetaProgress);
    }
    setRunStats(prev => ({ ...prev, enemiesDefeatedThisRun: prev.enemiesDefeatedThisRun + 1, soulFragmentsEarnedThisRun: prev.soulFragmentsEarnedThisRun + SOUL_FRAGMENTS_PER_ENEMY_DEFEAT }));
    // setAvailableEchoChoices(generateEchoChoicesForPostLevelScreen(isPrologueActive, gameState.currentLevel, activeEcos, player, metaProgress)); // Now done in PostLevelManager

    setGameState(prev => ({ ...prev, status: GameStatus.PostLevel }));
    postLevelManager.startPostLevelSequence();

  }, [
    gameState.status, // To check if already playing
    enemy, metaProgress, setAndSaveMetaProgress, // For enemy defeat processing
    setRunStats, // For updating stats
    // Removed: generateEchoChoicesForPostLevelScreen, activeEcos, player (passed to PostLevelManager)
    // Removed: isPrologueActive, currentStretchCompletedLevels, levelsInCurrentStretch, completeStretch (handled by PostLevelManager)
    // Removed: prologueStep, gameState.guidingTextKey (prologue specific logic should be in PostLevelManager or its effects)
    setGameState, // To set PostLevel status
    postLevelManager // Added postLevelManager
  ]);

  // +++ Instantiate usePostLevelManager
  const postLevelManager = usePostLevelManager({
    playerState: player,
    activeEcos,
    metaProgress,
    currentLevel: gameState.currentLevel,
    isPrologueActive,
    prologueStep,
    mapDecisionPending, // from runMapManager
    currentRunMap, // from runMapManager
    generateEchoChoicesForPostLevelScreen, // from gameConstantsLogic
    startFuryMinigame: furyMinigameHook.startFuryMinigame,
    getFuryOptionsForOracle, // from gameConstantsLogic
    setPlayer,
    setActiveEcosState,
    setAvailableEchoChoicesInGameEngine: setAvailableEchoChoicesForUI,
    setRunStats,
    setAndSaveMetaProgress,
    addGameEvent,
    triggerConditionalEchoAnimation,
    setGameStatusInEngine: setGameStatus,
    executeProceedToNextLevelInEngine, // The renamed function
    advancePrologueStepInEngine: advancePrologueStep, // from prologueManager
    getOracleSelectedFuryAbility: () => oracleSelectedFuryFromHook || gameState.oracleSelectedFuryAbility,
    getIsFuryMinigameActive: () => furyMinigameHook.isFuryMinigameActive,
    getFuryMinigameCompletedForThisLevel: () => gameState.furyMinigameCompletedForThisLevel,
    setPostLevelActionTakenInGameEngine: (value) => setGameState(prev => ({ ...prev, postLevelActionTaken: value })),
  });


  return {
    gameState: {
        ...gameState,
        // Removed: isCorazonDelAbismoChoiceActive, corazonDelAbismoOptions
    },
    player, enemy, board, activeEcos,
    availableEchoChoices: postLevelManager.localAvailableEchoChoices, // Or availableEchoChoicesForUI if preferred
    fullActiveEcos, runStats, metaProgress,
    setAndSaveMetaProgress, initializeNewRun, requestPrologueStart, startPrologueActual, 
    handlePlayerCellSelection, cycleCellMark: cycleCellMarkHook,
    // selectEchoOption, // Removed
    proceedToNextLevel: executeProceedToNextLevelInEngine, // Export renamed version
    setGameStatus,
    advanceFuryMinigamePhase: advanceFuryMinigamePhaseHook,
    handlePlayerFuryCardSelection: handlePlayerFuryCardSelectionHook,
    advancePrologueStep,
    conditionalEchoTriggeredId,
    popEvent, tryActivateAlquimiaImprovisada, tryActivateOjoOmnisciente,
    // resolveCorazonDelAbismoChoice, // Removed
    confirmAndAbandonRun, triggerBattlefieldReduction, debugWinLevel,
    selectMapPathAndStartStretch,
    currentPhase,
    // For UI to consume Fury Minigame state:
    isFuryMinigameActive,
    furyMinigamePhase,
    furyCardOptions,
    shuffledFuryCardOrder,
    playerSelectedFuryCardDisplayIndex,
    // For UI to consume Prologue state:
    isPrologueActivePrologue: isPrologueActive, // Aliased to avoid conflict if gameState still had it
    prologueStepPrologue: prologueStep,       // Aliased
    guidingTextKey: gameState.guidingTextKey, // Still pass from gameState as it's updated by advancePrologueStep
    // Expose map related states for UI consumption:
    currentRunMap,
    currentBiomeId,
    levelsInCurrentStretch,
    currentStretchCompletedLevels,
    stretchStartLevel,
    mapDecisionPending,
    stretchRewardPending,
  };
};
