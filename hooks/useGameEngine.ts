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
    isCorazonDelAbismoChoiceActive: false,
    corazonDelAbismoOptions: null,
    playerTookDamageThisLevel: false,
    currentArenaLevel: 0,
    maxArenaReductions: MAX_ARENA_REDUCTIONS,
    isBattlefieldReductionTransitioning: false,
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
  const [availableEchoChoices, setAvailableEchoChoices] = useState<Echo[]>([]);

  const fullActiveEcos = useMemo(() => getCurrentlyEffectiveEcos(activeEcos, player.deactivatedEcos), [activeEcos, player.deactivatedEcos]);

  const boardHook = useBoardState({
    activeEcos: fullActiveEcos,
    addGameEvent,
    currentLevel: gameState.currentLevel,
    currentArenaLevel: gameState.currentArenaLevel,
    currentBiomeId: gameState.currentBiomeId,
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
    setAvailableEchoChoices,
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

  const wasCorazonDelAbismoChoiceActivePreviously = useRef(gameState.isCorazonDelAbismoChoiceActive);
  const battlefieldReductionTimeoutRef = useRef<number | null>(null);

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

  const generateRunMap = useCallback((): RunMapState => {
    const nodes: Record<string, RunMapNode> = {};
    const mapDepth = MAP_DEFAULT_DEPTH; let nodeIdCounter = 0;
    const createNode = (layer: number, biome: BiomeId, reward: MapRewardType, encounter: MapEncounterType, isCurrent = false): RunMapNode => {
        const id = `mapnode-${nodeIdCounter++}`;
        let rewardVal: number | undefined = undefined;
        if (reward === MapRewardType.SoulFragments) rewardVal = MAP_NODE_REWARD_SOUL_FRAGMENTS_VALUE;
        if (reward === MapRewardType.WillLumens) rewardVal = MAP_NODE_REWARD_WILL_LUMENS_VALUE;
        if (reward === MapRewardType.HealingFountain) rewardVal = MAP_NODE_REWARD_HEALING_FOUNTAIN_VALUE;
        nodes[id] = { id, layer, biomeId: biome, encounterType: encounter, rewardType: reward, childrenNodeIds: [], isCurrent, isCompleted: false, rewardValue: rewardVal };
        return nodes[id];
    };
    const startNode = createNode(0, BiomeId.Default, MapRewardType.None, MapEncounterType.Standard, true);
    let previousLayerNodes = [startNode.id];
    for (let layer = 1; layer < mapDepth; layer++) {
        const currentLayerNodes: string[] = [];
        previousLayerNodes.forEach(parentId => {
            const numChoices = Math.floor(Math.random() * (MAP_CHOICES_PER_NODE_MAX - MAP_CHOICES_PER_NODE_MIN + 1)) + MAP_CHOICES_PER_NODE_MIN;
            for (let i = 0; i < numChoices; i++) {
                const choiceBiomeOptions = [BiomeId.Default, BiomeId.BrokenBazaar, BiomeId.BloodForge];
                const choiceBiome = choiceBiomeOptions[Math.floor(Math.random() * choiceBiomeOptions.length)];
                const choiceRewardOptions = [MapRewardType.None, MapRewardType.ExtraGold, MapRewardType.SoulFragments, MapRewardType.WillLumens, MapRewardType.HealingFountain, MapRewardType.FreeEcho];
                const choiceReward = choiceRewardOptions[Math.floor(Math.random() * choiceRewardOptions.length)];
                const choiceEncounter = layer >= mapDepth -1 ? MapEncounterType.Boss : (Math.random() < 0.2 ? MapEncounterType.Elite : MapEncounterType.Standard);
                const choiceNode = createNode(layer, choiceBiome, choiceReward, choiceEncounter);
                nodes[parentId].childrenNodeIds.push(choiceNode.id);
                currentLayerNodes.push(choiceNode.id);
            }
        });
        previousLayerNodes = currentLayerNodes;
    }
    return { nodes, startNodeId: startNode.id, currentNodeId: startNode.id, mapDepth };
  }, []);

  const proceedToNextLevel = useCallback(() => {
    const isCurrentlyPrologue = isPrologueActive; // from usePrologueManager
    const currentLevelForPrologCheck = gameState.currentLevel; // from gameState

    if (
        (gameState.status === GameStatus.PostLevel || (isCurrentlyPrologue && currentLevelForPrologCheck === PROLOGUE_LEVEL_ID)) &&
        !gameState.furyMinigameCompletedForThisLevel &&
        !isFuryMinigameActive
    ) {
        const nextLevelForFuryOptions = isCurrentlyPrologue ? 1 : gameState.currentLevel + 1;
        const options = getFuryOptionsForOracle(metaProgress.awakenedFuryIds, player.nextOracleOnlyCommonFury);
        startFuryMinigame(options);
        setGameState(prev => ({ ...prev, postLevelActionTaken: false }));
        return;
    }

    const levelForNextSetup = isPrologueActive && gameState.currentLevel === PROLOGUE_LEVEL_ID
                                   ? 1
                                   : gameState.currentLevel + 1;
    const currentFloor = getCurrentFloorNumber(levelForNextSetup);
    const isTransitioningFromPrologue = isPrologueActive && levelForNextSetup === 1;

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

    const encounter = generateEncounterForFloor(currentFloor, levelForNextSetup, effectiveOracleFury);
    setEnemy(encounter.enemy);

    let finalBoardParams = encounter.boardParams;
    let currentBiomeForBoard = gameState.currentBiomeId;

    if (isTransitioningFromPrologue && !gameState.currentRunMap) { 
        const tempMap = generateRunMap(); 
        currentBiomeForBoard = tempMap.nodes[tempMap.startNodeId].biomeId;
        console.log("[Prologue Transition Pre-Set] Generated temporary map, start node biome:", currentBiomeForBoard);
    }
    
    const biome = BIOME_DEFINITIONS[currentBiomeForBoard];
    if (biome && biome.boardModifiers) {
      let currentMapNodeForModifiers = null;
      if(gameState.currentRunMap && gameState.currentRunMap.nodes[gameState.currentRunMap.currentNodeId]){
        currentMapNodeForModifiers = gameState.currentRunMap.nodes[gameState.currentRunMap.currentNodeId];
      }
      finalBoardParams = biome.boardModifiers(encounter.boardParams, levelForNextSetup, currentMapNodeForModifiers?.rewardType);
    }

    const newBoardDimensions = generateAndSetBoard(finalBoardParams, activeEcos);
    
    setGameState(prev => {
        let newMapState = prev.currentRunMap;
        let newBiomeIdForState = prev.currentBiomeId;
        let newLevelsInStretchForState = prev.levelsInCurrentStretch;
        let newStretchStartLevelForState = prev.stretchStartLevel;
        let newStretchCompletedForState = prev.currentStretchCompletedLevels + 1;

        if (isTransitioningFromPrologue) {
            console.log("[Prologue Transition] Entering isTransitioningFromPrologue block for map generation.");
            newMapState = generateRunMap();
            if (newMapState && newMapState.nodes && newMapState.startNodeId && newMapState.nodes[newMapState.startNodeId]) {
                const startNode = newMapState.nodes[newMapState.startNodeId];
                newBiomeIdForState = startNode.biomeId;
                newLevelsInStretchForState = DEFAULT_LEVELS_PER_STRETCH;
                newStretchStartLevelForState = levelForNextSetup; 
                newStretchCompletedForState = 0; 
                console.log("[Prologue Transition] Map generated successfully. New Map State exists, Start Node Biome:", newBiomeIdForState);
            } else {
                 console.error("[Prologue Transition] Map generation FAILED or startNode invalid. newMapState:", newMapState);
                const fallbackNodeId = 'mapnode-fallback-0';
                newMapState = {
                    nodes: { [fallbackNodeId]: { id: fallbackNodeId, layer: 0, biomeId: BiomeId.Default, encounterType: MapEncounterType.Standard, rewardType: MapRewardType.None, childrenNodeIds: [], isCurrent: true, isCompleted: false } },
                    startNodeId: fallbackNodeId,
                    currentNodeId: fallbackNodeId,
                    mapDepth: 1
                };
                newBiomeIdForState = BiomeId.Default;
                newLevelsInStretchForState = DEFAULT_LEVELS_PER_STRETCH;
                newStretchStartLevelForState = levelForNextSetup;
                newStretchCompletedForState = 0;
                console.warn("[Prologue Transition] CRITICAL FALLBACK: Using minimal default map.");
            }
        }
        console.log("[ProceedToNextLevel] Final map state being set:", newMapState ? "Valid Map" : "NULL MAP");
        return {
            ...prev, 
            status: GameStatus.Playing, 
            currentLevel: levelForNextSetup, 
            currentFloor,
            currentArenaLevel: 0, 
            furyMinigameCompletedForThisLevel: false, 
            oracleSelectedFuryAbility: null,
            postLevelActionTaken: false,
            mapDecisionPending: false, 
            playerTookDamageThisLevel: false,
            isPrologueActive: false, // Exiting prologue
            prologueStep: 0,         // Reset prologue step
            guidingTextKey: '',
            currentBoardDimensions: {rows: newBoardDimensions.rows, cols: newBoardDimensions.cols},
            aiThinkingCellCoords: null, 
            aiActionTargetCell: null,
            currentRunMap: newMapState,
            currentBiomeId: newBiomeIdForState,
            levelsInCurrentStretch: newLevelsInStretchForState,
            currentStretchCompletedLevels: newStretchCompletedForState,
            stretchStartLevel: newStretchStartLevelForState,
        };
    });
    setGamePhase(GamePhase.PLAYER_TURN);
  }, [
        gameState, player.gold, player.nextOracleOnlyCommonFury, activeEcos, metaProgress,
        generateAndSetBoard, setAndSaveMetaProgress, generateRunMap, getFuryOptionsForOracle,
        setPlayer, setRunStats, setEnemy, startFuryMinigame, setGamePhase, oracleSelectedFuryFromHook,
        isPrologueActive, isFuryMinigameActive
    ]);

  const selectMapPathAndStartStretch = useCallback((chosenNodeId: string) => {
    setGameState(prev => {
        if (!prev.currentRunMap) return prev;
        const newNodes = { ...prev.currentRunMap.nodes };
        if (newNodes[prev.currentRunMap.currentNodeId]) {
          newNodes[prev.currentRunMap.currentNodeId].isCurrent = false;
          newNodes[prev.currentRunMap.currentNodeId].isCompleted = true;
        }
        if (newNodes[chosenNodeId]) { newNodes[chosenNodeId].isCurrent = true; }
        else { console.error("Chosen node ID not found in map:", chosenNodeId); return prev; }
        const chosenNode = newNodes[chosenNodeId];
        let nextStretchRewardPending: GameStateCore['stretchRewardPending'] = null;
        if (chosenNode.rewardType === MapRewardType.SoulFragments || chosenNode.rewardType === MapRewardType.WillLumens ||
            chosenNode.rewardType === MapRewardType.HealingFountain || chosenNode.rewardType === MapRewardType.FreeEcho ||
            chosenNode.rewardType === MapRewardType.EchoForge) {
            nextStretchRewardPending = { type: chosenNode.rewardType, value: chosenNode.rewardValue };
        }
        return {
            ...prev,
            currentRunMap: { ...prev.currentRunMap, nodes: newNodes, currentNodeId: chosenNodeId },
            currentBiomeId: chosenNode.biomeId, levelsInCurrentStretch: DEFAULT_LEVELS_PER_STRETCH,
            currentStretchCompletedLevels: 0, stretchStartLevel: prev.currentLevel,
            mapDecisionPending: false, furyMinigameCompletedForThisLevel: false,
            postLevelActionTaken: true, stretchRewardPending: nextStretchRewardPending,
        };
    });
    setGameStatus(GameStatus.PostLevel);
  }, [setGameStatus]);

  // processEnemyMove definition needs to be before its ref is used by useGamePhaseManager
  // However, processEnemyMove itself uses many things from useGameEngine.
  // This creates a potential dependency cycle if not handled carefully (e.g. with refs or by moving more logic).
  const doProcessEnemyMove = useCallback((row: number, col: number) => {
    let currentBoardLocal = boardHook.board.map(r => r.map(c => ({ ...c })));
    const cell = currentBoardLocal[row][col];
    if (cell.revealed) return;

    playMidiSoundPlaceholder('cell_click_enemy');
    let newPlayerState = { ...player };
    let newEnemyState = { ...enemy! };
    let message = `Enemigo revela (${row},${col}): `;
    let newRunStats = {...runStats};

    currentBoardLocal[row][col].revealed = true;
    GoalTrackingService.processEvent('CELL_REVEALED', { cellType: cell.type, revealedByPlayer: false } as GoalCellRevealedPayload, metaProgress, setAndSaveMetaProgress);

    switch (cell.type) {
      case CellType.Attack:
        playMidiSoundPlaceholder('reveal_attack_enemy_hits_player');
        message += "¡Ataque! Jugador recibe daño.";
        newRunStats.attacksTriggeredByEnemy++;
        if (!newPlayerState.isInvulnerable) {
          let damage = ATTACK_DAMAGE_ENEMY_VS_PLAYER;
          if (newPlayerState.alquimiaImprovisadaActiveForNextBomb) {
            damage = 0; newPlayerState.alquimiaImprovisadaActiveForNextBomb = false;
            const alquimiaEcho = fullActiveEcos.find(e => e.baseId === BASE_ECHO_ALQUIMIA_IMPROVISADA);
            if(alquimiaEcho) triggerConditionalEchoAnimation(alquimiaEcho.id);
            addGameEvent({ text: '¡Alquimia anula daño!', type: 'info', targetId: 'player-stats-container' });
          } else if (newPlayerState.shield > 0) {
            const shieldDamage = Math.min(newPlayerState.shield, damage);
            newPlayerState.shield -= shieldDamage; damage -= shieldDamage;
            addGameEvent({ text: `-${shieldDamage}🛡️`, type: 'armor-break', targetId: 'player-stats-container' });
          }
          if (damage > 0) {
            if (newPlayerState.firstBombDamageTakenThisLevel === false) {
                const pielPiedraEcho = fullActiveEcos.find(e => e.baseId === BASE_ECHO_PIEL_PIEDRA);
                if (pielPiedraEcho) {
                    damage = Math.max(0, damage - (pielPiedraEcho.value as number * (pielPiedraEcho.effectivenessMultiplier || 1)));
                    triggerConditionalEchoAnimation(pielPiedraEcho.id);
                }
                newPlayerState.firstBombDamageTakenThisLevel = true;
            }
            if (damage > 0) {
                newPlayerState.hp = Math.max(0, newPlayerState.hp - damage);
                addGameEvent({ text: `-${damage}`, type: 'damage-player', targetId: 'player-stats-container' });
                setGameState(prev => ({...prev, playerTookDamageThisLevel: true }));
                const venganzaEcho = fullActiveEcos.find(e => e.baseId === BASE_ECHO_VENGANZA_ESPECTRAL);
                if (venganzaEcho) { newPlayerState.venganzaSpectralCharge = (venganzaEcho.value as number * (venganzaEcho.effectivenessMultiplier || 1)); triggerConditionalEchoAnimation(venganzaEcho.id); }
            } else { addGameEvent({ text: '¡Bloqueado!', type: 'info', targetId: 'player-stats-container'});}
          }
        } else {
            addGameEvent({ text: '¡Invulnerable!', type: 'info', targetId: 'player-stats-container' });
        }
        if (isPrologueActive && prologueStep === 5 && !ftueEventTracker.current.firstAttackRevealedByEnemy) { ftueEventTracker.current.firstAttackRevealedByEnemy = true; advancePrologueStep(6); }
        break;
      case CellType.Gold:
        playMidiSoundPlaceholder('reveal_gold_enemy_fury');
        message += "¡Oro! Furia del enemigo aumenta.";
        newRunStats.goldCellsRevealedThisRun++;
        newEnemyState.currentFuryCharge = Math.min(newEnemyState.furyActivationThreshold, newEnemyState.currentFuryCharge + ENEMY_FURY_GAIN_ON_GOLD_REVEAL);
        addGameEvent({ text: `+${ENEMY_FURY_GAIN_ON_GOLD_REVEAL} Furia!`, type: 'info', targetId: 'enemy-stats-container' });
        break;
      case CellType.Clue:
        message += "Pista revelada.";
        break;
      case CellType.Trap:
        playMidiSoundPlaceholder('reveal_trap_enemy_effect');
        message += "¡Trampa activada por el enemigo!";
        newRunStats.trapsTriggeredThisRun++;
        let trapDamageToEnemy = 1;
        if (newEnemyState.armor > 0) {
            const armorDamage = Math.min(newEnemyState.armor, trapDamageToEnemy);
            newEnemyState.armor -= armorDamage; trapDamageToEnemy -= armorDamage;
            addGameEvent({ text: `-${armorDamage}🛡️ (Trampa Enem.)`, type: 'armor-break', targetId: 'enemy-stats-container' });
        }
        if (trapDamageToEnemy > 0) {
            newEnemyState.currentHp = Math.max(0, newEnemyState.currentHp - trapDamageToEnemy);
            addGameEvent({ text: `-${trapDamageToEnemy} (Trampa Enem.)`, type: 'damage-enemy', targetId: 'enemy-stats-container' });
        }
        break;
      default:
        message += `Tipo de casilla desconocido: ${cell.type}`;
    }
    console.log(message);
    setPlayer(newPlayerState);
    setEnemy(newEnemyState);
    setRunStats(newRunStats);

    const finalBoardAfterEnemyMove = updateBoardVisualEffectsUtility(recalculateAllCluesUtility(currentBoardLocal), fullActiveEcos);
    setBoard(finalBoardAfterEnemyMove);

    if (newPlayerState.hp <= 0) {
    } else if (newEnemyState.currentHp <= 0) {
      playMidiSoundPlaceholder('enemy_defeat');
      GoalTrackingService.processEvent('ENEMY_DEFEATED', { enemyArchetypeId: newEnemyState.archetypeId } as GoalEnemyDefeatedPayload, metaProgress, setAndSaveMetaProgress);
      setRunStats(prev => ({ ...prev, enemiesDefeatedThisRun: prev.enemiesDefeatedThisRun + 1, soulFragmentsEarnedThisRun: prev.soulFragmentsEarnedThisRun + SOUL_FRAGMENTS_PER_ENEMY_DEFEAT }));
      setAvailableEchoChoices(generateEchoChoicesForPostLevelScreen(isPrologueActive, gameState.currentLevel, activeEcos, newPlayerState, metaProgress));
      let mapDecisionNowPending = false;
      if (!isPrologueActive && gameState.currentStretchCompletedLevels >= gameState.levelsInCurrentStretch -1 ) mapDecisionNowPending = true;
    setGamePhase(GamePhase.PRE_VICTORY_SEQUENCE);
    setGameState(prev => ({
        ...prev,
        mapDecisionNowPending: mapDecisionNowPending,
      furyMinigameCompletedForThisLevel: false,
        postLevelActionTaken: false,
      }));
    }
  }, [
    boardHook.board, player, enemy, activeEcos, addGameEvent, setGameState, runStats, metaProgress,
    setAndSaveMetaProgress, generateEchoChoicesForPostLevelScreen, gameState.currentLevel,
    isPrologueActive, prologueStep, // From usePrologueManager
    gameState.currentStretchCompletedLevels, gameState.levelsInCurrentStretch,
    advancePrologueStep, // from usePrologueManager
    setBoard, setPlayer, setEnemy, setRunStats, fullActiveEcos, setGamePhase,
    triggerConditionalEchoAnimation // from useAbilityHandler
  ]);

  useEffect(() => {
    processEnemyMoveRef.current = doProcessEnemyMove;
  }, [doProcessEnemyMove]);


  const handlePlayerCellSelection = useCallback((row: number, col: number) => {
    if (currentPhase !== GamePhase.PLAYER_TURN) return;

    let currentBoardLocal = boardHook.board.map(r => r.map(c => ({ ...c }))); const cell = currentBoardLocal[row][col];
    if (cell.revealed || cell.lockedIncorrectlyForClicks > 0) return;
    playMidiSoundPlaceholder('cell_click');
    let newPlayerState = { ...player }; let newEnemyState = { ...enemy! }; let newRunStats = { ...runStats };
    newRunStats.clicksOnBoardThisRun++;
    const cellsToProcessQueue: { r: number, c: number, depth: number }[] = [{ r: row, c: col, depth: 0 }];
    const processedCellsInTurn = new Set<string>();
    let attacksByPlayerThisTurn = 0, goldCollectedThisTurn = 0, trapsTriggeredThisTurn = 0, cellsRevealedThisTurnForFury = 0;
    const effectiveEcos = fullActiveEcos;
    const highestCascadeEcho = effectiveEcos.filter(e => e.baseId === BASE_ECHO_ECO_CASCADA).sort((a,b) => (b.level || 0) - (a.level || 0))[0] || null;
    let cascadeDepthValue = 0, cascadeDisarmChance = 0;
    if (highestCascadeEcho) {
        if (typeof highestCascadeEcho.value === 'number') cascadeDepthValue = highestCascadeEcho.value * (highestCascadeEcho.effectivenessMultiplier || 1);
        else if (typeof highestCascadeEcho.value === 'object' && highestCascadeEcho.value && 'depth' in highestCascadeEcho.value) {
            cascadeDepthValue = highestCascadeEcho.value.depth * (highestCascadeEcho.effectivenessMultiplier || 1);
            if ('disarmChance' in highestCascadeEcho.value) cascadeDisarmChance = highestCascadeEcho.value.disarmChance * (highestCascadeEcho.effectivenessMultiplier || 1);
        }
    }
    if (newPlayerState.deactivatedEcos.length > 0) {
        const stillDeactivated: DeactivatedEchoInfo[] = [];
        newPlayerState.deactivatedEcos.forEach(de => {
            de.clicksRemaining -=1;
            if (de.clicksRemaining > 0) stillDeactivated.push(de);
            else addGameEvent({ text: `Eco "${de.name}" reactivado!`, type: 'info', targetId: 'player-stats-container'});
        });
        newPlayerState.deactivatedEcos = stillDeactivated;
    }
    if (newPlayerState.debuffEspadasOxidadasClicksRemaining > 0) newPlayerState.debuffEspadasOxidadasClicksRemaining--;
    if (newPlayerState.vinculoDolorosoClicksRemaining > 0) newPlayerState.vinculoDolorosoClicksRemaining--; else if (newPlayerState.vinculoDolorosoActive) newPlayerState.vinculoDolorosoActive = false;
    if (newPlayerState.pistasFalsasClicksRemaining > 0) newPlayerState.pistasFalsasClicksRemaining--;
    if (newPlayerState.paranoiaGalopanteClicksRemaining > 0) newPlayerState.paranoiaGalopanteClicksRemaining--;
    if (newPlayerState.invulnerabilityClicksRemaining > 0) newPlayerState.invulnerabilityClicksRemaining--;
    if (newPlayerState.criticalHitClicksRemaining > 0) newPlayerState.criticalHitClicksRemaining--;
    if (newPlayerState.swordDamageModifierClicksRemaining > 0) newPlayerState.swordDamageModifierClicksRemaining--; else if (newPlayerState.swordDamageModifier > 0) newPlayerState.swordDamageModifier = 0;

    while(cellsToProcessQueue.length > 0) {
        const current = cellsToProcessQueue.shift()!; const r_curr = current.r; const c_curr = current.c; const depth = current.depth; const cellId = `${r_curr}-${c_curr}`;
        if (r_curr < 0 || r_curr >= gameState.currentBoardDimensions.rows || c_curr < 0 || c_curr >= gameState.currentBoardDimensions.cols || processedCellsInTurn.has(cellId) || currentBoardLocal[r_curr][c_curr].revealed) continue;
        currentBoardLocal[r_curr][c_curr].revealed = true; processedCellsInTurn.add(cellId); cellsRevealedThisTurnForFury++;
        const cellData = currentBoardLocal[r_curr][c_curr];
        GoalTrackingService.processEvent('CELL_REVEALED', { cellType: cellData.type, revealedByPlayer: true } as GoalCellRevealedPayload, metaProgress, setAndSaveMetaProgress);

        switch (cellData.type) {
          case CellType.Attack:
            playMidiSoundPlaceholder('reveal_attack_player_hits_enemy'); attacksByPlayerThisTurn++; newRunStats.swordUsedThisLevel = true;
            let baseDamageForAttack = ATTACK_DAMAGE_PLAYER_VS_ENEMY; let attackDamageReductionFromDebuff = 0;
            if (newPlayerState.debuffEspadasOxidadasClicksRemaining > 0) { const debuffData = ALL_FURY_ABILITIES_MAP.get('fury_espadas_oxidadas')?.value as {reduction:number} | undefined; if(debuffData) attackDamageReductionFromDebuff = debuffData.reduction;}
            let actualAttackDamage = Math.max(1, baseDamageForAttack - attackDamageReductionFromDebuff);
            if (newPlayerState.swordDamageModifier > 0 && newPlayerState.swordDamageModifierClicksRemaining > 0) { actualAttackDamage += newPlayerState.swordDamageModifier; newPlayerState.venganzaSpectralCharge = 0; }
            newPlayerState.consecutiveSwordsRevealed++;
            const maestriaEcho = effectiveEcos.find(e => e.baseId === BASE_ECHO_MAESTRIA_ESTOCADA); const torrenteEcho = effectiveEcos.find(e => e.baseId === BASE_ECHO_TORRENTE_ACERO);
            if (torrenteEcho) {
                const torrenteConfig = torrenteEcho.value as { count: number, bonusIncremental: boolean, reduceFury: boolean };
                if (newPlayerState.consecutiveSwordsRevealed >= torrenteConfig.count) {
                    const bonus = torrenteConfig.bonusIncremental ? (newPlayerState.consecutiveSwordsRevealed - torrenteConfig.count + 1) : 1; actualAttackDamage += bonus; triggerConditionalEchoAnimation(torrenteEcho.id);
                    if(torrenteConfig.reduceFury) newEnemyState.currentFuryCharge = Math.max(0, newEnemyState.currentFuryCharge - Math.floor(newEnemyState.furyActivationThreshold * 0.1));
                }
            } else if (maestriaEcho) {
                const maestriaConfig = maestriaEcho.value as { count: number, bonus: number };
                if (newPlayerState.consecutiveSwordsRevealed >= maestriaConfig.count) { actualAttackDamage += (maestriaConfig.bonus * (maestriaEcho.effectivenessMultiplier || 1)); triggerConditionalEchoAnimation(maestriaEcho.id); }
            }
            if (newPlayerState.criticalHitClicksRemaining > 0) { actualAttackDamage *= 2; addGameEvent({ text: '¡Crítico!', type: 'info', targetId: 'enemy-stats-container' }); }
            const golpeCerteroUpgrade = MIRROR_UPGRADES_CONFIG.find(u => u.id === MirrorUpgradeId.GolpeCerteroInicial);
            if (golpeCerteroUpgrade && metaProgress.mirrorUpgrades[MirrorUpgradeId.GolpeCerteroInicial] > 0 && !newRunStats.swordUsedThisLevelForMirror) {
                let totalBonus = 0;
                const currentGolpeCerteroLevel = metaProgress.mirrorUpgrades[MirrorUpgradeId.GolpeCerteroInicial];
                for(let i=0; i < currentGolpeCerteroLevel; i++) { totalBonus += golpeCerteroUpgrade.levels[i].effectValue; }
                actualAttackDamage += totalBonus; newRunStats.swordUsedThisLevelForMirror = true; addGameEvent({ text: `¡Golpe Certero Inicial! (+${totalBonus})`, type: 'info', targetId: 'enemy-stats-container' });
            }
            let damageToArmor = 0, damageToHp = actualAttackDamage;
            if (newEnemyState.armor > 0) {
                damageToArmor = Math.min(newEnemyState.armor, actualAttackDamage); newEnemyState.armor -= damageToArmor; damageToHp -= damageToArmor;
                addGameEvent({ text: `-${damageToArmor}🛡️`, type: 'armor-break', targetId: 'enemy-stats-container' }); if (damageToArmor > 0) playMidiSoundPlaceholder('enemy_armor_break');
            }
            if (damageToHp > 0) { newEnemyState.currentHp = Math.max(0, newEnemyState.currentHp - damageToHp); addGameEvent({ text: `-${damageToHp}`, type: 'damage-enemy', targetId: 'enemy-stats-container' }); }
            if (newPlayerState.vinculoDolorosoActive && newPlayerState.vinculoDolorosoClicksRemaining > 0) {
                 const vinculoAbilityValue = ALL_FURY_ABILITIES_MAP.get('fury_vinculo_doloroso')?.value as {damage:number} | undefined;
                 if (vinculoAbilityValue) { const recoilDamage = vinculoAbilityValue.damage;
                     if (!newPlayerState.isInvulnerable) { let actualRecoilDamage = recoilDamage;
                         if (newPlayerState.shield > 0) { const shieldDamage = Math.min(newPlayerState.shield, actualRecoilDamage); newPlayerState.shield -= shieldDamage; actualRecoilDamage -= shieldDamage; }
                         if(actualRecoilDamage > 0) newPlayerState.hp = Math.max(0, newPlayerState.hp - actualRecoilDamage); addGameEvent({ text: `-${actualRecoilDamage}🩸 (Vínculo)`, type: 'damage-player', targetId: 'player-stats-container' });
                         setGameState(prev => ({...prev, playerTookDamageThisLevel: true }));
                     }
                 }
            }
            if (isPrologueActive && prologueStep === 3 && !ftueEventTracker.current.firstAttackRevealedByPlayer) { ftueEventTracker.current.firstAttackRevealedByPlayer = true; advancePrologueStep(4); }
            break;
          case CellType.Gold:
            playMidiSoundPlaceholder('reveal_gold'); goldCollectedThisTurn++; let goldCollectedValue = GOLD_VALUE;
            const instintoBuscadorEcho = effectiveEcos.find(e => e.baseId === BASE_ECHO_INSTINTO_BUSCADOR);
            if (instintoBuscadorEcho) { const chance = (instintoBuscadorEcho.value as number) * (instintoBuscadorEcho.effectivenessMultiplier || 1); if (Math.random() < chance) { goldCollectedValue *= 2; triggerConditionalEchoAnimation(instintoBuscadorEcho.id); }}
            if (goldCollectedValue > 0) { newPlayerState.gold += goldCollectedValue; addGameEvent({ text: `+${goldCollectedValue}`, type: 'gold-player', targetId: 'player-stats-container' }); }
            if (isPrologueActive && prologueStep === 4 && !ftueEventTracker.current.firstGoldRevealed) { ftueEventTracker.current.firstGoldRevealed = true; advancePrologueStep(5); }
            newPlayerState.consecutiveSwordsRevealed = 0;
            break;
          case CellType.Clue:
            if (isPrologueActive && !ftueEventTracker.current.firstClueRevealed && prologueStep === 2) { ftueEventTracker.current.firstClueRevealed = true; advancePrologueStep(3); }
            if (cascadeDepthValue > 0 && cellData.adjacentItems?.total === 0 && depth < cascadeDepthValue) {
                for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { if (dr === 0 && dc === 0) continue;
                    const nextR = r_curr + dr; const nextC = c_curr + dc;
                    if (nextR >= 0 && nextR < gameState.currentBoardDimensions.rows && nextC >= 0 && nextC < gameState.currentBoardDimensions.cols && !currentBoardLocal[nextR][nextC].revealed) {
                        if (currentBoardLocal[nextR][nextC].type === CellType.Attack && Math.random() < cascadeDisarmChance) {
                            playMidiSoundPlaceholder('cascade_disarm_attack');
                            addGameEvent({ text: '¡Ataque Neutralizado por Cascada!', type: 'info', targetId: `cell-${nextR}-${nextC}`});
                        } else {
                             cellsToProcessQueue.push({ r: nextR, c: nextC, depth: depth + 1});
                        }
                    }
                }
                if (highestCascadeEcho) triggerConditionalEchoAnimation(highestCascadeEcho.id);
            }
            newPlayerState.consecutiveSwordsRevealed = 0;
            break;
          case CellType.Trap:
            playMidiSoundPlaceholder('reveal_trap'); trapsTriggeredThisTurn++; const pasoLigeroActive = effectiveEcos.some(e => e.baseId === BASE_ECHO_PASO_LIGERO);
            if (pasoLigeroActive && !newPlayerState.pasoLigeroTrapIgnoredThisLevel) {
                newPlayerState.pasoLigeroTrapIgnoredThisLevel = true; const pasoLigeroEcho = effectiveEcos.find(e => e.baseId === BASE_ECHO_PASO_LIGERO); if(pasoLigeroEcho) triggerConditionalEchoAnimation(pasoLigeroEcho.id);
                addGameEvent({ text: '¡Paso Ligero anula trampa!', type: 'info', targetId: 'player-stats-container' });
            } else if (!newPlayerState.isInvulnerable) {
                let trapDamage = 1;
                if (newPlayerState.shield > 0) { const shieldDamage = Math.min(newPlayerState.shield, trapDamage); newPlayerState.shield -= shieldDamage; trapDamage -= shieldDamage; addGameEvent({ text: `-${shieldDamage}🛡️ (Trampa)`, type: 'armor-break', targetId: 'player-stats-container' }); }
                if (trapDamage > 0) { newPlayerState.hp = Math.max(0, newPlayerState.hp - trapDamage); addGameEvent({ text: `-${trapDamage} (Trampa)`, type: 'damage-player', targetId: 'player-stats-container' }); setGameState(prev => ({...prev, playerTookDamageThisLevel: true })); }
            }
            newPlayerState.consecutiveSwordsRevealed = 0;
            break;
        }
    }
    newRunStats.attacksTriggeredByPlayer += attacksByPlayerThisTurn;
    newRunStats.goldCellsRevealedThisRun += goldCollectedThisTurn;
    newRunStats.trapsTriggeredThisRun += trapsTriggeredThisTurn;

    setPlayer(newPlayerState);
    setEnemy(newEnemyState);

    const finalBoardAfterPlayerMove = updateBoardVisualEffectsUtility(recalculateAllCluesUtility(currentBoardLocal), effectiveEcos);
    setBoard(finalBoardAfterPlayerMove);
    setRunStats(newRunStats);

    if (newPlayerState.hp <= 0) {
      setGamePhase(GamePhase.PLAYER_ACTION_RESOLVING);
      return;
    } else if (newEnemyState.currentHp <= 0) {
      playMidiSoundPlaceholder('enemy_defeat');
      GoalTrackingService.processEvent('ENEMY_DEFEATED', { enemyArchetypeId: newEnemyState.archetypeId } as GoalEnemyDefeatedPayload, metaProgress, setAndSaveMetaProgress);
      setRunStats(prev => ({ ...prev, enemiesDefeatedThisRun: prev.enemiesDefeatedThisRun + 1, soulFragmentsEarnedThisRun: prev.soulFragmentsEarnedThisRun + SOUL_FRAGMENTS_PER_ENEMY_DEFEAT }));
      setAvailableEchoChoices(generateEchoChoicesForPostLevelScreen(isPrologueActive, gameState.currentLevel, activeEcos, newPlayerState, metaProgress));
      let mapDecisionNowPending = false;
      if (!isPrologueActive && gameState.currentStretchCompletedLevels >= gameState.levelsInCurrentStretch -1 ) mapDecisionNowPending = true;

    setGamePhase(GamePhase.PRE_VICTORY_SEQUENCE);
      setGameState(prev => ({
        ...prev,
        mapDecisionNowPending: mapDecisionNowPending,
        furyMinigameCompletedForThisLevel: false,
        postLevelActionTaken: false,
      }));
      return;
    } else if (gameState.status === GameStatus.Playing && checkAllPlayerBeneficialAttacksRevealed()) {
      triggerBattlefieldReduction();
    }

    let finalEnemyStateForFuryUpdate = { ...newEnemyState };
    if (finalEnemyStateForFuryUpdate.currentHp > 0 && !isPrologueActive) {
        finalEnemyStateForFuryUpdate.currentFuryCharge = Math.min(finalEnemyStateForFuryUpdate.furyActivationThreshold, finalEnemyStateForFuryUpdate.currentFuryCharge + (cellsRevealedThisTurnForFury * FURY_INCREMENT_PER_CLICK));
    }
    setEnemy(finalEnemyStateForFuryUpdate);

    if (newPlayerState.hp === 1 && !newPlayerState.ultimoAlientoUsedThisRun) {
        const ultimoAlientoEcho = effectiveEcos.find(e => e.baseId === BASE_ECHO_ULTIMO_ALIENTO);
        if (ultimoAlientoEcho) {
            const updatedPlayerForAliento = {...newPlayerState, ultimoAlientoUsedThisRun: true, isInvulnerable: true, invulnerabilityClicksRemaining: (ultimoAlientoEcho.value as { clicks: number }).clicks, criticalHitClicksRemaining: (ultimoAlientoEcho.value as { clicks: number }).clicks};
            setPlayer(updatedPlayerForAliento);
            triggerConditionalEchoAnimation(ultimoAlientoEcho.id); addGameEvent({ text: '¡Último Aliento!', type: 'info', targetId: 'player-stats-container' });
        }
    }

    if (isPrologueActive && prologueStep === 6 && newEnemyState.currentHp > 0) {
      advancePrologueStep(6);
    }

    setGamePhase(GamePhase.PLAYER_ACTION_RESOLVING);

  }, [
    boardHook.board, player, enemy, activeEcos, runStats, gameState, addGameEvent, setGameStatus, advancePrologueStep,
    triggerConditionalEchoAnimation, metaProgress, setAndSaveMetaProgress, checkAllPlayerBeneficialAttacksRevealed,
    triggerBattlefieldReduction, applyFuryEffect, generateEchoChoicesForPostLevelScreen,
    generateAndSetBoard, setGamePhase, setBoard, fullActiveEcos, currentPhase, isPrologueActive, prologueStep, // Added isPrologueActive, prologueStep
  ]);

  useEffect(() => {
    processEnemyMoveRef.current = doProcessEnemyMove;
  }, [doProcessEnemyMove]);

  const cycleCellMark = useCallback((row: number, col: number) => {
    if (currentPhase !== GamePhase.PLAYER_TURN) return;
    cycleCellMarkHook(row, col);
  }, [currentPhase, cycleCellMarkHook]);

  const selectEchoOption = useCallback((echoId: string): boolean => {
    const selectedFullEcho = ALL_ECHOS_MAP.get(echoId); if (!selectedFullEcho) return false;
    const costMultiplier = player.nextEchoCostsDoubled && !selectedFullEcho.isFree ? 2 : 1;
    const actualCost = selectedFullEcho.cost * costMultiplier;
    if (!selectedFullEcho.isFree && player.gold < actualCost) { addGameEvent({ text: "Oro insuficiente.", type: 'info' }); return false; }
    playMidiSoundPlaceholder(`echo_select_${selectedFullEcho.id}`);
    let newActiveEcos = [...activeEcos]; const existingEchoIndex = newActiveEcos.findIndex(e => e.baseId === selectedFullEcho.baseId);
    if (existingEchoIndex !== -1) newActiveEcos[existingEchoIndex] = selectedFullEcho; else newActiveEcos.push(selectedFullEcho);
    if (!runStats.runUniqueEcosActivated.includes(selectedFullEcho.baseId)) { setRunStats(prev => ({...prev, runUniqueEcosActivated: [...prev.runUniqueEcosActivated, selectedFullEcho.baseId]})); GoalTrackingService.processEvent('UNIQUE_ECO_ACTIVATED', null, metaProgress, setAndSaveMetaProgress); }
    let newPlayerHp = player.hp, newPlayerMaxHp = player.maxHp, newPlayerGold = selectedFullEcho.isFree ? player.gold : player.gold - actualCost, newPlayerNextEchoCostsDoubled = false;
    if (player.nextEchoCostsDoubled && !selectedFullEcho.isFree) newPlayerNextEchoCostsDoubled = false; else newPlayerNextEchoCostsDoubled = player.nextEchoCostsDoubled;
    if (selectedFullEcho.effectType === EchoEffectType.GainHP) { const healAmount = (selectedFullEcho.value as number) * (selectedFullEcho.effectivenessMultiplier || 1); newPlayerHp = Math.min(player.maxHp, player.hp + healAmount); addGameEvent({ text: `+${healAmount} HP`, type: 'heal-player', targetId: 'player-stats-container' }); }
    else if (selectedFullEcho.effectType === EchoEffectType.IncreaseMaxHP) { const increaseAmount = (selectedFullEcho.value as number) * (selectedFullEcho.effectivenessMultiplier || 1); newPlayerMaxHp = player.maxHp + increaseAmount; newPlayerHp = player.hp + increaseAmount; addGameEvent({ text: `Max HP +${increaseAmount}`, type: 'info', targetId: 'player-stats-container' }); }
    else if (selectedFullEcho.baseId === BASE_ECHO_ALQUIMIA_IMPROVISADA) setPlayer(prev => ({...prev, alquimiaImprovisadaChargeAvailable: true}));
    setPlayer(prev => ({ ...prev, hp: newPlayerHp, maxHp: newPlayerMaxHp, gold: newPlayerGold, nextEchoCostsDoubled: newPlayerNextEchoCostsDoubled }));
    setActiveEcosState(newActiveEcos); if(!selectedFullEcho.isFree) setRunStats(prev => ({...prev, nonFreeEcosAcquiredThisRun: prev.nonFreeEcosAcquiredThisRun + 1}));
    if (isPrologueActive && gameState.currentLevel === PROLOGUE_LEVEL_ID && prologueStep === 7) advancePrologueStep(8); // Use hook state
    if (selectedFullEcho.baseId === BASE_ECHO_CORAZON_ABISMO) {
        const sacrificeAmount = Math.floor(player.hp / 2); const hpAfterSacrifice = player.hp - sacrificeAmount;
        if (hpAfterSacrifice < 1) { addGameEvent({ text: "¡Sacrificio demasiado grande!", type: 'info' }); setActiveEcosState(activeEcos.filter(e => e.baseId !== BASE_ECHO_CORAZON_ABISMO)); return false; }
        setPlayer(prev => ({ ...prev, hp: hpAfterSacrifice })); addGameEvent({ text: `-${sacrificeAmount} HP (Corazón del Abismo)`, type: 'damage-player', targetId: 'player-stats-container' });
        const epicEchos = ALL_ECHOS_LIST.filter(e => e.rarity === Rarity.Epic && !activeEcos.some(ae => ae.baseId === e.baseId) && e.baseId !== BASE_ECHO_CORAZON_ABISMO);
        const randomEpicEcho = epicEchos.length > 0 ? epicEchos[Math.floor(Math.random() * epicEchos.length)] : null;
        const duplicableActiveEcos = activeEcos.filter(e => (e.rarity === Rarity.Common || e.rarity === Rarity.Rare) && e.baseId !== BASE_ECHO_CORAZON_ABISMO);
        setGameState(prev => ({ ...prev, isCorazonDelAbismoChoiceActive: true, corazonDelAbismoOptions: { randomEpicEcho, duplicableActiveEcos: duplicableActiveEcos as Echo[] }}));
        triggerConditionalEchoAnimation(selectedFullEcho.id); return true;
    } else setGameState(prev => ({ ...prev, postLevelActionTaken: true }));
    return false;
  }, [player, activeEcos, addGameEvent, runStats, metaProgress, setAndSaveMetaProgress, triggerConditionalEchoAnimation, setGameState, advancePrologueStep, gameState.currentLevel, isPrologueActive, prologueStep, setActiveEcosState, setRunStats]); // Added setActiveEcosState, setRunStats, isPrologueActive, prologueStep

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
    if (!gameState.isCorazonDelAbismoChoiceActive) return; const { corazonDelAbismoOptions } = gameState; if (!corazonDelAbismoOptions) return;
    let echoToAddOrUpdate: Echo | null = null; let effectApplied = false;
    if (type === 'epic' && corazonDelAbismoOptions.randomEpicEcho) { echoToAddOrUpdate = corazonDelAbismoOptions.randomEpicEcho; playMidiSoundPlaceholder(`corazon_resolve_epic_${echoToAddOrUpdate.id}`); addGameEvent({ text: `¡Nuevo Eco Épico: ${echoToAddOrUpdate.name}!`, type: 'info' }); effectApplied = true; }
    else if (type === 'duplicate' && chosenEchoId) {
        const echoToDuplicate = activeEcos.find(e => e.id === chosenEchoId);
        if (echoToDuplicate) { echoToAddOrUpdate = { ...echoToDuplicate, effectivenessMultiplier: (echoToDuplicate.effectivenessMultiplier || 1) + 1 }; playMidiSoundPlaceholder(`corazon_resolve_duplicate_${echoToDuplicate.id}`); addGameEvent({ text: `¡Eco ${echoToDuplicate.name} potenciado! (x${echoToAddOrUpdate.effectivenessMultiplier})`, type: 'info' }); effectApplied = true; }
    }
    if (effectApplied && echoToAddOrUpdate) {
        let newActiveEcos = [...activeEcos]; const existingIndex = newActiveEcos.findIndex(e => e.baseId === echoToAddOrUpdate!.baseId);
        if (existingIndex !== -1) newActiveEcos[existingIndex] = echoToAddOrUpdate; else newActiveEcos.push(echoToAddOrUpdate);
        setActiveEcosState(newActiveEcos);
        if (!runStats.runUniqueEcosActivated.includes(echoToAddOrUpdate.baseId)) { setRunStats(prev => ({...prev, runUniqueEcosActivated: [...prev.runUniqueEcosActivated, echoToAddOrUpdate!.baseId]})); GoalTrackingService.processEvent('UNIQUE_ECO_ACTIVATED', null, metaProgress, setAndSaveMetaProgress); }
    }
    setGameState(prev => ({ ...prev, isCorazonDelAbismoChoiceActive: false, corazonDelAbismoOptions: null, postLevelActionTaken: true }));
  }, [gameState.isCorazonDelAbismoChoiceActive, gameState.corazonDelAbismoOptions, activeEcos, addGameEvent, runStats.runUniqueEcosActivated, metaProgress, setAndSaveMetaProgress, gameState]);

 useEffect(() => {
    const playerActionJustCompleted = gameState.postLevelActionTaken && !isFuryMinigameActive && !gameState.furyMinigameCompletedForThisLevel;
    const furyGameJustCompleted = !isFuryMinigameActive && gameState.furyMinigameCompletedForThisLevel;

    if (gameState.status === GameStatus.PostLevel &&
        (playerActionJustCompleted || furyGameJustCompleted) &&
        !gameState.isCorazonDelAbismoChoiceActive &&
        !gameState.isBattlefieldReductionTransitioning) {
        if (gameState.mapDecisionPending) setGameStatus(GameStatus.AbyssMapView);
        else proceedToNextLevel();
    }
    wasCorazonDelAbismoChoiceActivePreviously.current = gameState.isCorazonDelAbismoChoiceActive;
  }, [gameState.status, gameState.postLevelActionTaken, isFuryMinigameActive, gameState.furyMinigameCompletedForThisLevel, gameState.isCorazonDelAbismoChoiceActive, gameState.isBattlefieldReductionTransitioning, gameState.mapDecisionPending, proceedToNextLevel, setGameStatus]);

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
    setAvailableEchoChoices(generateEchoChoicesForPostLevelScreen(isPrologueActive, gameState.currentLevel, activeEcos, player, metaProgress)); // Use hook state
    let mapDecisionNowPending = false;
    if (!isPrologueActive && gameState.currentStretchCompletedLevels >= gameState.levelsInCurrentStretch - 1) { // Use hook state
        mapDecisionNowPending = true;
        if (gameState.stretchRewardPending) {
            const reward = gameState.stretchRewardPending; let newSoulFragments = runStats.soulFragmentsEarnedThisRun + SOUL_FRAGMENTS_PER_ENEMY_DEFEAT;
            if (reward.type === MapRewardType.SoulFragments && reward.value) { newSoulFragments += reward.value; addGameEvent({text: `+${reward.value} Fragmentos de Alma (Mapa)!`, type: 'gold-player', targetId: 'player-stats-container'}); }
            else if (reward.type === MapRewardType.WillLumens && reward.value) { setAndSaveMetaProgress(prevMeta => ({...prevMeta, willLumens: prevMeta.willLumens + (reward.value || 0)})); addGameEvent({text: `+${reward.value} Lúmenes (Mapa)!`, type: 'gold-player', targetId: 'player-stats-container'}); }
            else if (reward.type === MapRewardType.HealingFountain && reward.value) { setPlayer(p => { const healedHp = Math.min(p.maxHp, p.hp + (reward.value || 0)); addGameEvent({text: `+${healedHp - p.hp} HP (Fuente)!`, type: 'heal-player', targetId: 'player-stats-container'}); return {...p, hp: healedHp}; }); }
            setRunStats(prev => ({ ...prev, soulFragmentsEarnedThisRun: newSoulFragments })); setGameState(prev => ({...prev, stretchRewardPending: null}));
        }
    }
    setGameState(prev => ({
      ...prev,
      status: GameStatus.PostLevel,
      furyMinigameCompletedForThisLevel: false,
      postLevelActionTaken: false,
      prologueStep: (isPrologueActive && prev.currentLevel === PROLOGUE_LEVEL_ID) ? 7 : prologueStep, // Use hook state
      guidingTextKey: (isPrologueActive && prev.currentLevel === PROLOGUE_LEVEL_ID) ? 7 as keyof typeof PROLOGUE_MESSAGES : '', // Use hook state
      mapDecisionPending: mapDecisionNowPending,
    }));
  }, [gameState, enemy, activeEcos, player, metaProgress, setAndSaveMetaProgress, generateEchoChoicesForPostLevelScreen, addGameEvent, runStats.soulFragmentsEarnedThisRun, setEnemy, setRunStats, setPlayer, isPrologueActive, prologueStep]); // Added isPrologueActive, prologueStep


  return {
    gameState: { // Reconstruct gameState for export, excluding hook-managed parts
        ...gameState,
        // Fields managed by hooks are not part of the core gameState returned directly,
        // but their values are returned separately below if needed by UI.
    },
    player, enemy, board, activeEcos, availableEchoChoices, fullActiveEcos, runStats, metaProgress,
    setAndSaveMetaProgress, initializeNewRun, requestPrologueStart, startPrologueActual, 
    handlePlayerCellSelection, cycleCellMark: cycleCellMarkHook, selectEchoOption, proceedToNextLevel,
    setGameStatus,
    advanceFuryMinigamePhase: advanceFuryMinigamePhaseHook,
    handlePlayerFuryCardSelection: handlePlayerFuryCardSelectionHook,
    advancePrologueStep, // from usePrologueManager
    conditionalEchoTriggeredId, // from useAbilityHandler
    popEvent, tryActivateAlquimiaImprovisada, tryActivateOjoOmnisciente, resolveCorazonDelAbismoChoice,
    confirmAndAbandonRun, triggerBattlefieldReduction, selectMapPathAndStartStretch, debugWinLevel,
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
  };
};
