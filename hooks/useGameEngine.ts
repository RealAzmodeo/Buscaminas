import React, { useCallback, useEffect, useRef, useMemo } from 'react';
import { GameStatus, GamePhase, BiomeId, MapRewardType, MapEncounterType, PlayerState, EnemyInstance, BoardState, Echo, RunStats, MetaProgressState, GameStateCore, DeactivatedEchoInfo, GuidingTextKey, BoardParameters, GoalEnemyDefeatedPayload, GoalLevelCompletedPayload } from '../types';
import {
    PROLOGUE_LEVEL_ID, /* INITIAL_STARTING_FURIESS, PROLOGUE_SHADOW_EMBER_FURY_ABILITY, */ // Moved
    GOLD_REWARD_PER_LEVEL, BASE_ECHO_BOLSA_AGRANDADA, SOUL_FRAGMENTS_PER_LEVEL_COMPLETE,
    DEFAULT_LEVELS_PER_STRETCH, MAP_DEFAULT_DEPTH, MAP_CHOICES_PER_NODE_MIN, MAP_CHOICES_PER_NODE_MAX,
    MAP_NODE_REWARD_SOUL_FRAGMENTS_VALUE, MAP_NODE_REWARD_WILL_LUMENS_VALUE, MAP_NODE_REWARD_HEALING_FOUNTAIN_VALUE,
    INITIAL_PLAYER_HP, INITIAL_PLAYER_GOLD, INITIAL_PLAYER_SHIELD, INITIAL_MAX_SOUL_FRAGMENTS
} from '../constants';
import { INITIAL_STARTING_FURIESS } from '../core/furies'; // Import from core/furies, no alias
import { BIOME_DEFINITIONS } from '../constants/biomeConstants';
import { MIRROR_UPGRADES_CONFIG, INITIAL_GOALS_CONFIG, MIRROR_UPGRADE_IDS } from '../constants/metaProgressionConstants';
import { generateEncounterForFloor } from '../services/encounterGenerator';
import { GoalTrackingService } from '../services/goalTrackingService';
import { playMidiSoundPlaceholder } from '../utils/soundUtils'; // Assuming this is a valid path

// Import new hooks
import { useMetaProgress } from './useMetaProgress';
import { useGameState } from './useGameState';
import { usePlayerState } from './usePlayerState';
import { useEnemyState } from './useEnemyState';
import { useRunStats, initialRunStats as initialRunStatsObject } from './useRunStats';
import { useBoard } from './useBoard';
import { useGameEvents } from './useGameEvents';
import { useEchos } from './useEchos';
import { useFuries } from './useFuries';
import { usePrologue } from './usePrologue';
import { usePlayerActions } from './usePlayerActions';
import { useEnemyAI } from './useEnemyAI';
import { useGameLoop } from './useGameLoop';

// Import utilities
import { getCurrentFloorNumber } from '../utils/gameLogicUtils';


export const useGameEngine = () => {
  // Instantiate new hooks
  const metaProgressHook = useMetaProgress();
  const runStatsHook = useRunStats();

  // Pass necessary functions for inter-hook dependencies
  // getCurrentGameStatus for usePlayerState
  const getCurrentGameStatus = useCallback(() => gameStateHook.gameState.status, [/* gameStateHook.gameState.status - this will cause stale closure if gameStateHook is not stable */]);

  const playerStateHook = usePlayerState({
    // setGameStatus will be called from gameStateHook, which needs runStats and metaProgress.
    // Player defeat is handled by an effect in usePlayerState, which calls its own setGameStatus prop.
    // This implies setGameStatus needs to be passed to usePlayerState.
    setGameStatus: (newStatus, reason) => gameStateHook.setGameStatus(newStatus, reason), // Temporary, will be properly wired
    getCurrentGameStatus,
  });

  const enemyStateHook = useEnemyState();

  const gameStateHook = useGameState({
    metaProgressHook: metaProgressHook,
    getRunStats: ()  => runStatsHook.runStats, // Pass a getter for current runStats
  });

  const gameEventsHook = useGameEvents({
    setGameStateForEventQueue: gameStateHook.setGameState,
  });

  const boardHook = useBoard({
    gameState: gameStateHook.gameState,
    setGameState: gameStateHook.setGameState,
    setGameStatus: gameStateHook.setGameStatus,
    getActiveEcos: () => echosHook.fullEffectiveEcos, // Assuming fullEffectiveEcos is the correct one
    getPlayerDeactivatedEcos: () => playerStateHook.player.deactivatedEcos,
    advancePrologueStep: (stepOrKey) => prologueHook.advancePrologueStep(stepOrKey), // from prologueHook
    setEnemyState: enemyStateHook.setEnemy,
    addGameEvent: gameEventsHook.addGameEvent, // Added for cycleCellMark if it were still in boardHook
  });

  const echosHook = useEchos({
    playerState: playerStateHook.player,
    setPlayerState: playerStateHook.setPlayer,
    metaProgressState: metaProgressHook.metaProgress,
    setAndSaveMetaProgress: metaProgressHook.setAndSaveMetaProgress,
    gameState: gameStateHook.gameState,
    setGameState: gameStateHook.setGameState,
    advancePrologueStep: (stepOrKey) => prologueHook.advancePrologueStep(stepOrKey),
    runStats: runStatsHook.runStats,
    setRunStats: runStatsHook.setRunStats,
    getBoardForOjo: () => boardHook.board, // Provide a getter for the board state
    setBoardAfterOjo: boardHook.setBoard,
    recalculateCluesAfterOjo: boardHook.recalculateAllClues,
    updateBoardVisualsAfterOjo: boardHook.updateBoardVisualEffects,
    addGameEvent: gameEventsHook.addGameEvent,
  });

  const furiesHook = useFuries({
    gameState: gameStateHook.gameState,
    setGameState: gameStateHook.setGameState,
    playerState: playerStateHook.player,
    setPlayerState: playerStateHook.setPlayer,
    enemyState: enemyStateHook.enemy,
    setEnemyState: enemyStateHook.setEnemy,
    boardState: boardHook.board,
    setBoardState: boardHook.setBoard,
    recalculateAllClues: boardHook.recalculateAllClues,
    updateBoardVisualEffects: boardHook.updateBoardVisualEffects,
    getEffectiveEcos: () => echosHook.fullEffectiveEcos,
    runStats: runStatsHook.runStats,
    setRunStats: runStatsHook.setRunStats,
    metaProgressState: metaProgressHook.metaProgress,
    setAndSaveMetaProgress: metaProgressHook.setAndSaveMetaProgress,
    addGameEvent: gameEventsHook.addGameEvent,
    advancePrologueStep: (stepOrKey) => prologueHook.advancePrologueStep(stepOrKey),
  });

  const prologueHook = usePrologue({
    setGameState: gameStateHook.setGameState,
    resetRunStats: runStatsHook.resetRunStats,
    metaProgressState: metaProgressHook.metaProgress,
    setAndSaveMetaProgress: metaProgressHook.setAndSaveMetaProgress,
    resetPlayerForNewRun: playerStateHook.resetPlayerForNewRun,
    setEnemyState: enemyStateHook.setEnemy,
    generateBoardFromBoardParameters: boardHook.generateBoardFromBoardParameters,
    setBoardState: boardHook.setBoard,
    setActiveEcosState: echosHook.setActiveEcosState,
    setAvailableEchoChoicesState: echosHook.setAvailableEchoChoices,
  });

  const playerActionsHook = usePlayerActions({
    gameState: gameStateHook.gameState,
    setGameState: gameStateHook.setGameState,
    setGamePhase: gameStateHook.setGamePhase,
    setGameStatus: gameStateHook.setGameStatus,
    playerState: playerStateHook.player,
    setPlayerState: playerStateHook.setPlayer,
    enemyState: enemyStateHook.enemy,
    setEnemyState: enemyStateHook.setEnemy,
    boardState: boardHook.board,
    setBoardState: boardHook.setBoard,
    recalculateAllClues: boardHook.recalculateAllClues,
    updateBoardVisualEffects: boardHook.updateBoardVisualEffects,
    checkAllPlayerBeneficialAttacksRevealed: boardHook.checkAllPlayerBeneficialAttacksRevealed,
    triggerBattlefieldReduction: boardHook.triggerBattlefieldReduction,
    getEffectiveEcos: () => echosHook.fullEffectiveEcos,
    triggerConditionalEchoAnimation: echosHook.triggerConditionalEchoAnimation,
    generateEchoChoicesForPostLevelScreen: echosHook.generateEchoChoicesForPostLevelScreen,
    runStats: runStatsHook.runStats,
    setRunStats: runStatsHook.setRunStats,
    metaProgressState: metaProgressHook.metaProgress,
    setAndSaveMetaProgress: metaProgressHook.setAndSaveMetaProgress,
    addGameEvent: gameEventsHook.addGameEvent,
    ftueEventTrackerRef: prologueHook.ftueEventTrackerRef,
    advancePrologueStep: prologueHook.advancePrologueStep,
  });

  const enemyAIHook = useEnemyAI({
    gameState: gameStateHook.gameState,
    setGameState: gameStateHook.setGameState,
    setGamePhase: gameStateHook.setGamePhase, // Not strictly needed by executeEnemyTurnLogic but good for consistency
    setGameStatus: gameStateHook.setGameStatus,
    playerState: playerStateHook.player,
    setPlayerState: playerStateHook.setPlayer,
    enemyState: enemyStateHook.enemy,
    setEnemyState: enemyStateHook.setEnemy,
    boardState: boardHook.board,
    setBoardState: boardHook.setBoard,
    recalculateAllClues: boardHook.recalculateAllClues,
    updateBoardVisualEffects: boardHook.updateBoardVisualEffects,
    getEffectiveEcos: () => echosHook.fullEffectiveEcos,
    generateEchoChoicesForPostLevelScreen: echosHook.generateEchoChoicesForPostLevelScreen,
    runStats: runStatsHook.runStats,
    setRunStats: runStatsHook.setRunStats,
    metaProgressState: metaProgressHook.metaProgress,
    setAndSaveMetaProgress: metaProgressHook.setAndSaveMetaProgress,
    addGameEvent: gameEventsHook.addGameEvent,
    ftueEventTrackerRef: prologueHook.ftueEventTrackerRef,
    advancePrologueStep: prologueHook.advancePrologueStep,
  });

  // Must be defined after all dependent hooks are initialized
  const memoizedProceedToNextLevel = useCallback(() => {
    const { gameState } = gameStateHook;
    const { player } = playerStateHook;
    const { metaProgress, setAndSaveMetaProgress } = metaProgressHook;
    const { activeEcos } = echosHook; // Using actual activeEcos, not fullEffectiveEcos here
    const { awakenedFuryIds } = metaProgress; // from metaProgressHook.metaProgress
    const { nextOracleOnlyCommonFury } = player; // from playerStateHook.player

    const isCurrentlyProloguePostLevel = gameState.isPrologueActive &&
                                        gameState.currentLevel === PROLOGUE_LEVEL_ID &&
                                        gameState.status === GameStatus.PostLevel;
    if (
        (gameState.status === GameStatus.PostLevel || isCurrentlyProloguePostLevel) &&
        !gameState.furyMinigameCompletedForThisLevel &&
        !gameState.isFuryMinigameActive
    ) {
        const nextLevelForFuryOptions = isCurrentlyProloguePostLevel ? 1 : gameState.currentLevel + 1;
        const options = furiesHook.getFuryOptionsForOracle(nextLevelForFuryOptions, awakenedFuryIds, nextOracleOnlyCommonFury);
        gameStateHook.setGameState(prev => ({
            ...prev,
            isFuryMinigameActive: true,
            furyMinigamePhase: 'starting',
            furyCardOptions: options,
            playerSelectedFuryCardDisplayIndex: null,
            postLevelActionTaken: false, 
        }));
        return;
    }

    const levelForNextSetup = gameState.isPrologueActive && gameState.currentLevel === PROLOGUE_LEVEL_ID
                                   ? 1
                                   : gameState.currentLevel + 1;
    const currentFloor = getCurrentFloorNumber(levelForNextSetup);
    const isTransitioningFromPrologue = gameState.isPrologueActive && levelForNextSetup === 1;

    let newPlayerGold = player.gold + GOLD_REWARD_PER_LEVEL;
    const bolsaAgrandadaEcho = activeEcos.find(e => e.baseId === BASE_ECHO_BOLSA_AGRANDADA);
    if (bolsaAgrandadaEcho) { newPlayerGold += (bolsaAgrandadaEcho.value as number) * (bolsaAgrandadaEcho.effectivenessMultiplier || 1); }

    playerStateHook.setPlayer(prevPlayer => ({
      ...prevPlayer, gold: newPlayerGold, firstBombDamageTakenThisLevel: false, // This should be firstAttack...
      swordDamageModifier: 0, swordDamageModifierClicksRemaining: 0, venganzaSpectralCharge: 0,
      alquimiaImprovisadaActiveForNextBomb: false, pasoLigeroTrapIgnoredThisLevel: false,
      ojoOmniscienteUsedThisLevel: false, consecutiveSwordsRevealed: 0,
    }));

    const newlyCompletedGoalsFromMeta = setAndSaveMetaProgress(prevMeta => prevMeta, gameState.status); // Just to get potential goal updates if any
    runStatsHook.updateNewlyCompletedGoals(newlyCompletedGoalsFromMeta);

    runStatsHook.setRunStats(prevStats => ({
      ...prevStats, soulFragmentsEarnedThisRun: prevStats.soulFragmentsEarnedThisRun + SOUL_FRAGMENTS_PER_LEVEL_COMPLETE,
      levelsCompletedThisRun: prevStats.levelsCompletedThisRun + 1, swordUsedThisLevel: false, swordUsedThisLevelForMirror: false,
    }));

    if(!gameState.playerTookDamageThisLevel && gameState.currentLevel !== PROLOGUE_LEVEL_ID) {
        runStatsHook.setRunStats(prevStats => ({ ...prevStats, levelsCompletedWithoutDamageThisRun: prevStats.levelsCompletedWithoutDamageThisRun + 1 }));
        const goalPayload: GoalLevelCompletedPayload = { levelNumber: gameState.currentLevel, noDamage: true };
        GoalTrackingService.processEvent('LEVEL_COMPLETED_NO_DAMAGE', goalPayload, metaProgress, (u)=>setAndSaveMetaProgress(u, gameState.status));
    }
    const goalPayload: GoalLevelCompletedPayload = { levelNumber: gameState.currentLevel, noDamage: false };
    GoalTrackingService.processEvent('LEVEL_COMPLETED_IN_RUN', goalPayload, metaProgress, (u)=>setAndSaveMetaProgress(u,gameState.status));

    const oracleFury = gameState.oracleSelectedFuryAbility;
    if (!oracleFury && !gameState.isPrologueActive && !isTransitioningFromPrologue) { 
      console.error("Oracle fury not selected before proceeding to next level!");
    }
    const effectiveOracleFury = oracleFury || (isTransitioningFromPrologue ? INITIAL_STARTING_FURIESS[0] : PROLOGUE_SHADOW_EMBER_FURY_ABILITY);

    const encounter = generateEncounterForFloor(currentFloor, levelForNextSetup, effectiveOracleFury);
    enemyStateHook.setEnemy(encounter.enemy);

    let finalBoardParams = encounter.boardParams;
    let currentBiomeForBoard = gameState.currentBiomeId;
    let newMapState = gameState.currentRunMap;

    if (isTransitioningFromPrologue && !gameState.currentRunMap) { 
        newMapState = generateRunMap(); // generateRunMap needs to be defined or imported
        currentBiomeForBoard = newMapState.nodes[newMapState.startNodeId].biomeId;
    }
    
    const biome = BIOME_DEFINITIONS[currentBiomeForBoard];
    if (biome && biome.boardModifiers) {
      let currentMapNodeForModifiers = null;
      if(newMapState && newMapState.nodes[newMapState.currentNodeId]){
        currentMapNodeForModifiers = newMapState.nodes[newMapState.currentNodeId];
      }
      finalBoardParams = biome.boardModifiers(encounter.boardParams, levelForNextSetup, currentMapNodeForModifiers?.rewardType);
    }

    const newBoard = boardHook.generateBoardFromBoardParameters(finalBoardParams, activeEcos, levelForNextSetup, 0, currentBiomeForBoard);
    boardHook.setBoard(newBoard);
    
    gameStateHook.setGameState(prev => {
        let updatedMapState = prev.currentRunMap;
        let updatedBiomeId = prev.currentBiomeId;
        let updatedLevelsInStretch = prev.levelsInCurrentStretch;
        let updatedStretchStartLevel = prev.stretchStartLevel;
        let updatedStretchCompleted = prev.currentStretchCompletedLevels + 1;

        if (isTransitioningFromPrologue) {
            updatedMapState = newMapState; // newMapState was generated above if needed
            if (updatedMapState && updatedMapState.nodes[updatedMapState.startNodeId]) {
                const startNode = updatedMapState.nodes[updatedMapState.startNodeId];
                updatedBiomeId = startNode.biomeId;
                updatedLevelsInStretch = DEFAULT_LEVELS_PER_STRETCH;
                updatedStretchStartLevel = levelForNextSetup;
                updatedStretchCompleted = 0;
            } else { /* Error or fallback for map generation */ }
        }
        return {
            ...prev, status: GameStatus.Playing, currentPhase: GamePhase.PLAYER_TURN, currentLevel: levelForNextSetup, currentFloor,
            currentArenaLevel: 0, furyMinigameCompletedForThisLevel: false, postLevelActionTaken: false,
            mapDecisionPending: false, eventQueue: [], playerTookDamageThisLevel: false,
            isPrologueActive: false, guidingTextKey: '',
            currentBoardDimensions: {rows: newBoard.length, cols: newBoard[0]?.length || 0},
            oracleSelectedFuryAbility: null, aiThinkingCellCoords: null, aiActionTargetCell: null,
            currentRunMap: updatedMapState, currentBiomeId: updatedBiomeId,
            levelsInCurrentStretch: updatedLevelsInStretch, currentStretchCompletedLevels: updatedStretchCompleted,
            stretchStartLevel: updatedStretchStartLevel,
        };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [/* list ALL dependencies from all hooks used */
    gameStateHook.gameState, gameStateHook.setGameState, playerStateHook.player, playerStateHook.setPlayer,
    metaProgressHook.metaProgress, metaProgressHook.setAndSaveMetaProgress, echosHook.activeEcos,
    furiesHook.getFuryOptionsForOracle, runStatsHook.setRunStats, runStatsHook.updateNewlyCompletedGoals,
    enemyStateHook.setEnemy, boardHook.generateBoardFromBoardParameters, boardHook.setBoard,
    // generateRunMap needs to be stable or included if it's from this scope
  ]);


  const gameLoopHook = useGameLoop({
    gameState: gameStateHook.gameState,
    setGameState: gameStateHook.setGameState,
    setGamePhase: gameStateHook.setGamePhase,
    setGameStatus: gameStateHook.setGameStatus,
    playerState: playerStateHook.player,
    enemyState: enemyStateHook.enemy,
    setEnemyState: enemyStateHook.setEnemy,
    executeEnemyTurnLogic: enemyAIHook.executeEnemyTurnLogic,
    applyFuryEffect: furiesHook.applyFuryEffect,
    wasCorazonDelAbismoChoiceActivePreviouslyRef: echosHook.wasCorazonDelAbismoChoiceActivePreviouslyRef,
    proceedToNextLevel: memoizedProceedToNextLevel,
  });


  // Refs that were previously in useGameEngine
  // const ftueEventTracker = useRef(...); // Now in usePrologue
  // const conditionalEchoTimeoutRef = useRef(...); // Now in useEchos
  // const wasCorazonDelAbismoChoiceActivePreviously = useRef(...); // Now in useEchos
  // const battlefieldReductionTimeoutRef = useRef(...); // Now in useBoard
  // const aiThinkingIntervalRef = useRef(...); // Now in useEnemyAI
  // const phaseTransitionTimeoutRef = useRef(...); // Now in useGameLoop (or useEnemyAI for its specific delay)
  // const aiPlayerRef = useRef(new AIPlayer()); // Now in useEnemyAI


  // Old functions from useGameEngine that need to be replaced or removed
  // saveMetaProgress, loadMetaProgress, setAndSaveMetaProgress -> from metaProgressHook
  // addGameEvent, popEvent -> from gameEventsHook
  // setGamePhase, setGameStatus -> from gameStateHook
  // advancePrologueStep -> from prologueHook
  // triggerConditionalEchoAnimation -> from echosHook
  // recalculateAllClues, updateBoardVisualEffects, generateBoardFromBoardParameters, checkAllPlayerBeneficialAttacksRevealed, triggerBattlefieldReduction -> from boardHook
  // generateEchoChoicesForPostLevelScreen, selectEchoOption, tryActivateAlquimiaImprovisada, tryActivateOjoOmnisciente, resolveCorazonDelAbismoChoice -> from echosHook
  // applyFuryEffect, getFuryOptionsForOracle, advanceFuryMinigamePhase, handlePlayerFuryCardSelection -> from furiesHook
  // processEnemyMove -> from enemyAIHook
  // handlePlayerCellSelection, cycleCellMark -> from playerActionsHook
  // requestPrologueStart, startPrologueActual -> from prologueHook

  // Orchestrator functions (to be refactored to use new hooks)
  const initializeNewRun = useCallback((isPrologueRun: boolean) => {
    if (isPrologueRun) {
      prologueHook.requestPrologueStart();
      // startPrologueActual will be called by UI or another effect
      return;
    }
    // Reset relevant states using hooks
    runStatsHook.resetRunStats();

    let baseHp = INITIAL_PLAYER_HP, baseGold = INITIAL_PLAYER_GOLD, baseShield = INITIAL_PLAYER_SHIELD;
    let currentMaxSoulFragments = INITIAL_MAX_SOUL_FRAGMENTS;
    for (const upgradeId in metaProgressHook.metaProgress.mirrorUpgrades) {
        const currentMirrorLevel = metaProgressHook.metaProgress.mirrorUpgrades[upgradeId];
        if (currentMirrorLevel > 0) {
            const upgradeDef = MIRROR_UPGRADES_CONFIG.find(u => u.id === upgradeId);
            if (upgradeDef) {
                let totalEffectValue = 0; for(let i=0; i < currentMirrorLevel; i++) { totalEffectValue += upgradeDef.levels[i].effectValue; }
                switch (upgradeDef.appliesTo) {
                    case 'playerMaxHp': baseHp += totalEffectValue; break;
                    case 'playerStartGold': baseGold += totalEffectValue; break;
                    case 'playerStartShield': baseShield += totalEffectValue; break;
                    case 'playerMaxSoulFragments': currentMaxSoulFragments += totalEffectValue; break;
                }
            }
        }
    }
    if (metaProgressHook.metaProgress.maxSoulFragments !== currentMaxSoulFragments) {
        metaProgressHook.setAndSaveMetaProgress(prev => ({...prev, maxSoulFragments: currentMaxSoulFragments}), GameStatus.MainMenu);
    }
    playerStateHook.resetPlayerForNewRun(baseHp, baseGold, baseShield);

    metaProgressHook.setAndSaveMetaProgress(prevMeta => {
        const newGoalsProgress = { ...prevMeta.goalsProgress }; let changed = false;
        INITIAL_GOALS_CONFIG.forEach(goalDef => {
            if (goalDef.resetsPerRun && newGoalsProgress[goalDef.id]) {
                if (newGoalsProgress[goalDef.id].currentValue !== 0 || newGoalsProgress[goalDef.id].completed) {
                    newGoalsProgress[goalDef.id] = { ...newGoalsProgress[goalDef.id], currentValue: 0, completed: false }; changed = true;
                }
            }
        });
        return changed ? { ...prevMeta, goalsProgress: newGoalsProgress } : prevMeta;
    }, GameStatus.MainMenu);

    const initialLevel = 1;
    const initialFloor = getCurrentFloorNumber(initialLevel);
    const newRunMap = generateRunMap(); // This needs to be defined or imported
    const startNode = newRunMap.nodes[newRunMap.startNodeId];

    const encounter = generateEncounterForFloor(initialFloor, initialLevel, INITIAL_STARTING_FURIESS[0]);
    const biome = BIOME_DEFINITIONS[startNode.biomeId];
    let finalBoardParams = encounter.boardParams;
    if (biome && biome.boardModifiers) {
         finalBoardParams = biome.boardModifiers(encounter.boardParams, initialLevel, startNode.rewardType);
    }
    const newBoard = boardHook.generateBoardFromBoardParameters(finalBoardParams, [], initialLevel, 0, startNode.biomeId);
    
    enemyStateHook.setEnemy(encounter.enemy);
    boardHook.setBoard(newBoard);
    echosHook.setActiveEcosState([]);
    echosHook.setAvailableEchoChoices([]);

    gameStateHook.setGameState(prev => ({
      ...prev, status: GameStatus.Playing, currentPhase: GamePhase.PLAYER_TURN, currentLevel: initialLevel, currentFloor: initialFloor,
      isFuryMinigameActive: false, furyMinigamePhase: 'inactive',
      furyMinigameCompletedForThisLevel: false, oracleSelectedFuryAbility: INITIAL_STARTING_FURIESS[0], // Default for first non-prologue level
      isPrologueActive: false, prologueStep: 0, prologueEnemyFuryAbility: null,
      eventQueue: [], playerTookDamageThisLevel: false, currentArenaLevel: 0,
      isBattlefieldReductionTransitioning: false, guidingTextKey: '',
      currentBoardDimensions: { rows: finalBoardParams.rows, cols: finalBoardParams.cols }, postLevelActionTaken: false,
      currentRunMap: newRunMap, currentBiomeId: startNode.biomeId,
      levelsInCurrentStretch: DEFAULT_LEVELS_PER_STRETCH, currentStretchCompletedLevels: 0,
      stretchStartLevel: initialLevel, mapDecisionPending: false,
      stretchRewardPending: startNode.rewardType !== MapRewardType.None && startNode.rewardType !== MapRewardType.ExtraGold ? {type: startNode.rewardType, value: startNode.rewardValue} : null,
      aiThinkingCellCoords: null, aiActionTargetCell: null,
    }));

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prologueHook.requestPrologueStart /* add other hook dependencies */]);


  // generateRunMap was a local function, ensure it's defined or imported
  const generateRunMap = useCallback((): GameStateCore['currentRunMap'] => {
    const nodes: Record<string, any> = {}; // Use specific RunMapNode type
    const mapDepth = MAP_DEFAULT_DEPTH; let nodeIdCounter = 0;
    const createNode = (layer: number, biome: BiomeId, reward: MapRewardType, encounter: MapEncounterType, isCurrent = false) => {
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
                const choiceBiomeOptions = [BiomeId.Default, BiomeId.BrokenBazaar, BiomeId.BloodForge]; // Example biomes
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


  const selectMapPathAndStartStretch = useCallback((chosenNodeId: string) => {
    gameStateHook.setGameState(prev => {
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
            chosenNode.rewardType === MapRewardType.EchoForge) { // Added EchoForge
            nextStretchRewardPending = { type: chosenNode.rewardType, value: chosenNode.rewardValue };
        }
        return {
            ...prev,
            currentRunMap: { ...prev.currentRunMap, nodes: newNodes, currentNodeId: chosenNodeId },
            currentBiomeId: chosenNode.biomeId, levelsInCurrentStretch: DEFAULT_LEVELS_PER_STRETCH,
            currentStretchCompletedLevels: 0, stretchStartLevel: prev.currentLevel,
            mapDecisionPending: false, furyMinigameCompletedForThisLevel: false, // Reset these for the new stretch
            postLevelActionTaken: true, // Action taken to select path
            stretchRewardPending: nextStretchRewardPending,
        };
    });
    gameStateHook.setGameStatus(GameStatus.PostLevel); // Trigger PostLevel to potentially proceed
  }, [gameStateHook.setGameState, gameStateHook.setGameStatus]);


  const confirmAndAbandonRun = useCallback(() => {
    playMidiSoundPlaceholder('abandon_run_confirmed');
    gameStateHook.setGameStatus(GameStatus.GameOverDefeat);
  }, [gameStateHook.setGameStatus]);

  const debugWinLevel = useCallback(() => {
    if (gameStateHook.gameState.status !== GameStatus.Playing) return;
    playMidiSoundPlaceholder('debug_win_level');
    enemyStateHook.setEnemy(prev => ({...prev, currentHp: 0}));

    const enemyDefeatedPayload: GoalEnemyDefeatedPayload = { enemyArchetypeId: enemyStateHook.enemy.archetypeId };
    GoalTrackingService.processEvent('ENEMY_DEFEATED', enemyDefeatedPayload, metaProgressHook.metaProgress, (u)=>metaProgressHook.setAndSaveMetaProgress(u, gameStateHook.gameState.status));

    runStatsHook.setRunStats(prev => ({ ...prev, enemiesDefeatedThisRun: prev.enemiesDefeatedThisRun + 1, soulFragmentsEarnedThisRun: prev.soulFragmentsEarnedThisRun + SOUL_FRAGMENTS_PER_ENEMY_DEFEAT }));

    echosHook.generateEchoChoicesForPostLevelScreen(); // This will set availableEchoChoices in echosHook

    let mapDecisionNowPending = false;
    if (!gameStateHook.gameState.isPrologueActive && gameStateHook.gameState.currentStretchCompletedLevels >= gameStateHook.gameState.levelsInCurrentStretch - 1) {
        mapDecisionNowPending = true;
        if (gameStateHook.gameState.stretchRewardPending) {
            const reward = gameStateHook.gameState.stretchRewardPending;
            let newSoulFragments = runStatsHook.runStats.soulFragmentsEarnedThisRun + SOUL_FRAGMENTS_PER_ENEMY_DEFEAT; // Recalculate based on current
            if (reward.type === MapRewardType.SoulFragments && reward.value) { newSoulFragments += reward.value; gameEventsHook.addGameEvent({text: `+${reward.value} Fragmentos de Alma (Mapa)!`, type: 'gold-player', targetId: 'player-stats-container'}); }
            else if (reward.type === MapRewardType.WillLumens && reward.value) { metaProgressHook.setAndSaveMetaProgress(prevMeta => ({...prevMeta, willLumens: prevMeta.willLumens + (reward.value || 0)}), gameStateHook.gameState.status); gameEventsHook.addGameEvent({text: `+${reward.value} Lúmenes (Mapa)!`, type: 'gold-player', targetId: 'player-stats-container'}); }
            else if (reward.type === MapRewardType.HealingFountain && reward.value) { playerStateHook.setPlayer(p => { const healedHp = Math.min(p.maxHp, p.hp + (reward.value || 0)); gameEventsHook.addGameEvent({text: `+${healedHp - p.hp} HP (Fuente)!`, type: 'heal-player', targetId: 'player-stats-container'}); return {...p, hp: healedHp}; }); }
            runStatsHook.setRunStats(prev => ({ ...prev, soulFragmentsEarnedThisRun: newSoulFragments }));
            gameStateHook.setGameState(prev => ({...prev, stretchRewardPending: null}));
        }
    }
    gameStateHook.setGameState(prev => ({
      ...prev,
      status: GameStatus.PostLevel,
      furyMinigameCompletedForThisLevel: false,
      postLevelActionTaken: false,
      prologueStep: (prev.isPrologueActive && prev.currentLevel === PROLOGUE_LEVEL_ID) ? 7 : prev.prologueStep, // Assuming step 7 is post-enemy defeat
      guidingTextKey: (prev.isPrologueActive && prev.currentLevel === PROLOGUE_LEVEL_ID) ? 7 as GuidingTextKey : prev.guidingTextKey,
      mapDecisionPending: mapDecisionNowPending,
    }));
  }, [/* list ALL dependencies */]);


  // Consolidate return value
  return {
    // States
    gameState: gameStateHook.gameState,
    player: playerStateHook.player,
    enemy: enemyStateHook.enemy,
    board: boardHook.board,
    activeEcos: echosHook.activeEcos,
    fullEffectiveEcos: echosHook.fullEffectiveEcos,
    availableEchoChoices: echosHook.availableEchoChoices,
    runStats: runStatsHook.runStats,
    metaProgress: metaProgressHook.metaProgress,

    // Actions:
    // Meta Progress
    loadMetaProgress: metaProgressHook.loadMetaProgress, // Exposing if needed by UI, though usually auto
    setAndSaveMetaProgress: metaProgressHook.setAndSaveMetaProgress, // For debug or specific UI actions

    // Game Flow / Initialization
    initializeNewRun,
    proceedToNextLevel: memoizedProceedToNextLevel, // Orchestrator
    confirmAndAbandonRun,
    selectMapPathAndStartStretch,

    // Prologue
    requestPrologueStart: prologueHook.requestPrologueStart,
    startPrologueActual: prologueHook.startPrologueActual,
    advancePrologueStep: prologueHook.advancePrologueStep, // Now from prologueHook via gameStateHook

    // Player Actions
    handlePlayerCellSelection: playerActionsHook.handlePlayerCellSelection,
    cycleCellMark: playerActionsHook.cycleCellMark,

    // Echo Actions
    selectEchoOption: echosHook.selectEchoOption,
    tryActivateAlquimiaImprovisada: echosHook.tryActivateAlquimiaImprovisada,
    tryActivateOjoOmnisciente: echosHook.tryActivateOjoOmnisciente,
    resolveCorazonDelAbismoChoice: echosHook.resolveCorazonDelAbismoChoice,

    // Fury Minigame Actions
    advanceFuryMinigamePhase: furiesHook.advanceFuryMinigamePhase,
    handlePlayerFuryCardSelection: furiesHook.handlePlayerFuryCardSelection,

    // Game Events
    popEvent: gameEventsHook.popEvent,

    // Board related (mostly internal to other actions, but if needed by UI)
    // triggerBattlefieldReduction: boardHook.triggerBattlefieldReduction, // Usually called internally

    // Debug
    debugWinLevel,

    // Conditional Animation Trigger (if UI needs to display based on this directly)
    conditionalEchoTriggeredId: echosHook.gameState?.conditionalEchoTriggeredId, // Accessing via echosHook's gameState copy
  };
};
