import React, { useCallback, useEffect, useMemo } from 'react';
import {
    GameStatus, GamePhase, BiomeId, MapRewardType, MapEncounterType,
    PlayerState, EnemyInstance, BoardState, Echo, RunStats, MetaProgressState, GameStateCore,
    GuidingTextKey, BoardParameters, GoalEnemyDefeatedPayload, GoalLevelCompletedPayload, FuryAbility
} from '../types';
import {
    PROLOGUE_LEVEL_ID,
    GOLD_REWARD_PER_LEVEL, BASE_ECHO_BOLSA_AGRANDADA, SOUL_FRAGMENTS_PER_LEVEL_COMPLETE,
    DEFAULT_LEVELS_PER_STRETCH, MAP_DEFAULT_DEPTH, MAP_CHOICES_PER_NODE_MIN, MAP_CHOICES_PER_NODE_MAX,
    MAP_NODE_REWARD_SOUL_FRAGMENTS_VALUE, MAP_NODE_REWARD_WILL_LUMENS_VALUE, MAP_NODE_REWARD_HEALING_FOUNTAIN_VALUE,
    INITIAL_PLAYER_HP, INITIAL_PLAYER_GOLD, INITIAL_PLAYER_SHIELD, INITIAL_MAX_SOUL_FRAGMENTS
} from '../constants';
// Import Furies from their new location
import { INITIAL_STARTING_FURIESS, PROLOGUE_SHADOW_EMBER_FURY_ABILITY } from '../core/furies';
import { BIOME_DEFINITIONS } from '../constants/biomeConstants';
import { MIRROR_UPGRADES_CONFIG, INITIAL_GOALS_CONFIG, MIRROR_UPGRADE_IDS } from '../constants/metaProgressionConstants';
import { generateEncounterForFloor } from '../services/encounterGenerator';
import { GoalTrackingService } from '../services/goalTrackingService';
import { playMidiSoundPlaceholder } from '../utils/soundUtils';

// Import new hooks
import { useMetaProgress } from './useMetaProgress';
import { useGameState } from './useGameState';
import { usePlayerState } from './usePlayerState';
import { useEnemyState } from './useEnemyState';
import { useRunStats } from './useRunStats';
import { useBoard } from './useBoard';
import { useGameEvents } from './useGameEvents';
import { useEchos } from './useEchos';
import { useFuries } from './useFuries';
import { usePrologue } from './usePrologue';
import { usePlayerActions } from './usePlayerActions';
import { useEnemyAI } from './useEnemyAI';
import { useGameLoop } from './useGameLoop';

// Import utilities
import { getCurrentFloorNumber, getCurrentlyEffectiveEcos as getCurrentlyEffectiveEcosUtil } from '../utils/gameLogicUtils';


export const useGameEngine = () => {
  const metaProgressHook = useMetaProgress();
  const runStatsHook = useRunStats();

  const [internalGameStateForCallback, setInternalGameStateForCallback] = React.useState<GameStateCore | null>(null);

  const gameStateHook = useGameState({
    metaProgressHook: metaProgressHook,
    getRunStats: ()  => runStatsHook.runStats,
  });

  const playerStateHook = usePlayerState({
    setGameStatus: gameStateHook.setGameStatus,
    getCurrentGameStatus: () => internalGameStateForCallback?.status || GameStatus.MainMenu,
  });

  useEffect(() => {
    setInternalGameStateForCallback(gameStateHook.gameState);
  }, [gameStateHook.gameState]);

  const enemyStateHook = useEnemyState();
  const gameEventsHook = useGameEvents({ setGameStateForEventQueue: gameStateHook.setGameState });

  // Temporary `any` casts for hooks with circular dependencies during init
  const prologueHookRaw = usePrologue({} as any);
  const echosHookRaw = useEchos({} as any);

  const boardHook = useBoard({
    gameState: gameStateHook.gameState,
    setGameState: gameStateHook.setGameState,
    setGameStatus: gameStateHook.setGameStatus,
    getActiveEcos: () => echosHookRaw.fullEffectiveEcos,
    getPlayerDeactivatedEcos: () => playerStateHook.player.deactivatedEcos,
    advancePrologueStep: prologueHookRaw.advancePrologueStep,
    setEnemyState: enemyStateHook.setEnemy,
  });

  // Complete initialization of prologueHook and echosHook with boardHook values
  prologueHookRaw.setGameState = gameStateHook.setGameState;
  prologueHookRaw.resetRunStats = runStatsHook.resetRunStats;
  prologueHookRaw.metaProgressState = metaProgressHook.metaProgress;
  prologueHookRaw.setAndSaveMetaProgress = metaProgressHook.setAndSaveMetaProgress;
  prologueHookRaw.resetPlayerForNewRun = playerStateHook.resetPlayerForNewRun;
  prologueHookRaw.setEnemyState = enemyStateHook.setEnemy;
  prologueHookRaw.generateBoardFromBoardParameters = boardHook.generateBoardFromBoardParameters;
  prologueHookRaw.setBoardState = boardHook.setBoard;
  prologueHookRaw.setActiveEcosState = echosHookRaw.setActiveEcosState; // Will be defined below
  prologueHookRaw.setAvailableEchoChoicesState = echosHookRaw.setAvailableEchoChoices; // Will be defined below

  echosHookRaw.playerState = playerStateHook.player;
  echosHookRaw.setPlayerState = playerStateHook.setPlayer;
  echosHookRaw.metaProgressState = metaProgressHook.metaProgress;
  echosHookRaw.setAndSaveMetaProgress = metaProgressHook.setAndSaveMetaProgress;
  echosHookRaw.gameState = gameStateHook.gameState;
  echosHookRaw.setGameState = gameStateHook.setGameState;
  echosHookRaw.advancePrologueStep = prologueHookRaw.advancePrologueStep;
  echosHookRaw.runStats = runStatsHook.runStats;
  echosHookRaw.setRunStats = runStatsHook.setRunStats;
  echosHookRaw.addGameEvent = gameEventsHook.addGameEvent;
  echosHookRaw.getBoardForOjo = () => boardHook.board;
  echosHookRaw.setBoardAfterOjo = boardHook.setBoard;
  echosHookRaw.recalculateCluesAfterOjo = boardHook.recalculateAllClues;
  echosHookRaw.updateBoardVisualsAfterOjo = boardHook.updateBoardVisualEffects;
  // Assign setters for prologueHook that depend on echosHookValues
  prologueHookRaw.setActiveEcosState = echosHookRaw.setActiveEcosState;
  prologueHookRaw.setAvailableEchoChoicesState = echosHookRaw.setAvailableEchoChoices;


  const furiesHook = useFuries({
    gameState: gameStateHook.gameState, setGameState: gameStateHook.setGameState,
    playerState: playerStateHook.player, setPlayerState: playerStateHook.setPlayer,
    enemyState: enemyStateHook.enemy, setEnemyState: enemyStateHook.setEnemy,
    boardState: boardHook.board, setBoardState: boardHook.setBoard,
    recalculateAllClues: boardHook.recalculateAllClues, updateBoardVisualEffects: boardHook.updateBoardVisualEffects,
    getEffectiveEcos: () => echosHookRaw.fullEffectiveEcos,
    runStats: runStatsHook.runStats, setRunStats: runStatsHook.setRunStats,
    metaProgressState: metaProgressHook.metaProgress, setAndSaveMetaProgress: metaProgressHook.setAndSaveMetaProgress,
    addGameEvent: gameEventsHook.addGameEvent,
    advancePrologueStep: prologueHookRaw.advancePrologueStep,
  });

  const playerActionsHook = usePlayerActions({
    gameState: gameStateHook.gameState, setGameState: gameStateHook.setGameState,
    setGamePhase: gameStateHook.setGamePhase, setGameStatus: gameStateHook.setGameStatus,
    playerState: playerStateHook.player, setPlayerState: playerStateHook.setPlayer,
    enemyState: enemyStateHook.enemy, setEnemyState: enemyStateHook.setEnemy,
    boardState: boardHook.board, setBoardState: boardHook.setBoard,
    recalculateAllClues: boardHook.recalculateAllClues, updateBoardVisualEffects: boardHook.updateBoardVisualEffects,
    checkAllPlayerBeneficialAttacksRevealed: boardHook.checkAllPlayerBeneficialAttacksRevealed,
    triggerBattlefieldReduction: boardHook.triggerBattlefieldReduction,
    getEffectiveEcos: () => echosHookRaw.fullEffectiveEcos,
    triggerConditionalEchoAnimation: echosHookRaw.triggerConditionalEchoAnimation,
    generateEchoChoicesForPostLevelScreen: echosHookRaw.generateEchoChoicesForPostLevelScreen,
    runStats: runStatsHook.runStats, setRunStats: runStatsHook.setRunStats,
    metaProgressState: metaProgressHook.metaProgress, setAndSaveMetaProgress: metaProgressHook.setAndSaveMetaProgress,
    addGameEvent: gameEventsHook.addGameEvent,
    ftueEventTrackerRef: prologueHookRaw.ftueEventTrackerRef,
    advancePrologueStep: prologueHookRaw.advancePrologueStep,
  });

  const enemyAIHook = useEnemyAI({
    gameState: gameStateHook.gameState, setGameState: gameStateHook.setGameState,
    setGamePhase: gameStateHook.setGamePhase, setGameStatus: gameStateHook.setGameStatus,
    playerState: playerStateHook.player, setPlayerState: playerStateHook.setPlayer,
    enemyState: enemyStateHook.enemy, setEnemyState: enemyStateHook.setEnemy,
    boardState: boardHook.board, setBoardState: boardHook.setBoard,
    recalculateAllClues: boardHook.recalculateAllClues, updateBoardVisualEffects: boardHook.updateBoardVisualEffects,
    getEffectiveEcos: () => echosHookRaw.fullEffectiveEcos,
    generateEchoChoicesForPostLevelScreen: echosHookRaw.generateEchoChoicesForPostLevelScreen,
    runStats: runStatsHook.runStats, setRunStats: runStatsHook.setRunStats,
    metaProgressState: metaProgressHook.metaProgress, setAndSaveMetaProgress: metaProgressHook.setAndSaveMetaProgress,
    addGameEvent: gameEventsHook.addGameEvent,
    ftueEventTrackerRef: prologueHookRaw.ftueEventTrackerRef,
    advancePrologueStep: prologueHookRaw.advancePrologueStep,
  });

  const generateRunMap = useCallback((): GameStateCore['currentRunMap'] => {
    const nodes: Record<string, any> = {};
    const mapDepth = MAP_DEFAULT_DEPTH; let nodeIdCounter = 0;
    const createNode = (layer: number, biome: BiomeId, reward: MapRewardType, encounter: MapEncounterType, isCurrent = false) => {
        const id = `mapnode-${nodeIdCounter++}`;
        let rewardVal: number | undefined;
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
                nodes[parentId].childrenNodeIds.push(choiceNode.id); currentLayerNodes.push(choiceNode.id);
            }
        });
        previousLayerNodes = currentLayerNodes;
    }
    return { nodes, startNodeId: startNode.id, currentNodeId: startNode.id, mapDepth };
  }, []);

  const memoizedProceedToNextLevel = useCallback(() => {
    const { gameState, setGameState: setGameStateFromHook } = gameStateHook;
    const { player } = playerStateHook;
    const { metaProgress, setAndSaveMetaProgress } = metaProgressHook;
    const { activeEcos } = echosHookRaw;
    const { awakenedFuryIds } = metaProgress;
    const { nextOracleOnlyCommonFury } = player;

    const isCurrentlyProloguePostLevel = gameState.isPrologueActive && gameState.currentLevel === PROLOGUE_LEVEL_ID && gameState.status === GameStatus.PostLevel;
    if ((gameState.status === GameStatus.PostLevel || isCurrentlyProloguePostLevel) && !gameState.furyMinigameCompletedForThisLevel && !gameState.isFuryMinigameActive) {
        const nextLevelForFuryOptions = isCurrentlyProloguePostLevel ? 1 : gameState.currentLevel + 1;
        const options = furiesHook.getFuryOptionsForOracle(nextLevelForFuryOptions, awakenedFuryIds, nextOracleOnlyCommonFury);
        setGameStateFromHook(prev => ({ ...prev, isFuryMinigameActive: true, furyMinigamePhase: 'starting', furyCardOptions: options, playerSelectedFuryCardDisplayIndex: null, postLevelActionTaken: false }));
        return;
    }

    const levelForNextSetup = gameState.isPrologueActive && gameState.currentLevel === PROLOGUE_LEVEL_ID ? 1 : gameState.currentLevel + 1;
    const currentFloor = getCurrentFloorNumber(levelForNextSetup);
    const isTransitioningFromPrologue = gameState.isPrologueActive && levelForNextSetup === 1;

    let newPlayerGold = player.gold + GOLD_REWARD_PER_LEVEL;
    const bolsaAgrandadaEcho = activeEcos.find(e => e.baseId === BASE_ECHO_BOLSA_AGRANDADA);
    if (bolsaAgrandadaEcho) { newPlayerGold += (bolsaAgrandadaEcho.value as number) * (bolsaAgrandadaEcho.effectivenessMultiplier || 1); }

    playerStateHook.setPlayer(prevPlayer => ({ ...prevPlayer, gold: newPlayerGold, firstBombDamageTakenThisLevel: false, swordDamageModifier: 0, swordDamageModifierClicksRemaining: 0, venganzaSpectralCharge: 0, alquimiaImprovisadaActiveForNextBomb: false, pasoLigeroTrapIgnoredThisLevel: false, ojoOmniscienteUsedThisLevel: false, consecutiveSwordsRevealed: 0 }));

    const newlyCompletedGoalsLvlComplete = setAndSaveMetaProgress(prevMeta => prevMeta, gameState.status);
    runStatsHook.updateNewlyCompletedGoals(newlyCompletedGoalsLvlComplete);
    runStatsHook.setRunStats(prevStats => ({ ...prevStats, soulFragmentsEarnedThisRun: prevStats.soulFragmentsEarnedThisRun + SOUL_FRAGMENTS_PER_LEVEL_COMPLETE, levelsCompletedThisRun: prevStats.levelsCompletedThisRun + 1, swordUsedThisLevel: false, swordUsedThisLevelForMirror: false }));

    if(!gameState.playerTookDamageThisLevel && gameState.currentLevel !== PROLOGUE_LEVEL_ID) {
        runStatsHook.setRunStats(prevStats => ({ ...prevStats, levelsCompletedWithoutDamageThisRun: prevStats.levelsCompletedWithoutDamageThisRun + 1 }));
        const goalPayloadNoDmg: GoalLevelCompletedPayload = { levelNumber: gameState.currentLevel, noDamage: true };
        const newlyCompletedNoDmg = setAndSaveMetaProgress(prevMeta => GoalTrackingService.processEvent('LEVEL_COMPLETED_NO_DAMAGE', goalPayloadNoDmg, prevMeta, setAndSaveMetaProgress) || prevMeta, gameState.status);
        runStatsHook.updateNewlyCompletedGoals(newlyCompletedNoDmg);
    }
    const goalPayloadLvlInRun: GoalLevelCompletedPayload = { levelNumber: gameState.currentLevel, noDamage: false };
    const newlyCompletedLvlInRun = setAndSaveMetaProgress(prevMeta => GoalTrackingService.processEvent('LEVEL_COMPLETED_IN_RUN', goalPayloadLvlInRun, prevMeta, setAndSaveMetaProgress) || prevMeta, gameState.status);
    runStatsHook.updateNewlyCompletedGoals(newlyCompletedLvlInRun);

    const oracleFury = gameState.oracleSelectedFuryAbility;
    const effectiveOracleFury = oracleFury || (isTransitioningFromPrologue ? INITIAL_STARTING_FURIESS[0] : PROLOGUE_SHADOW_EMBER_FURY_ABILITY);

    const encounter = generateEncounterForFloor(currentFloor, levelForNextSetup, effectiveOracleFury);
    enemyStateHook.setEnemy(encounter.enemy);

    let finalBoardParams = encounter.boardParams;
    let currentBiomeForBoard = gameState.currentBiomeId;
    let newMapState = gameState.currentRunMap;

    if (isTransitioningFromPrologue && !gameState.currentRunMap) { 
        newMapState = generateRunMap(); currentBiomeForBoard = newMapState.nodes[newMapState.startNodeId].biomeId;
    }
    const biome = BIOME_DEFINITIONS[currentBiomeForBoard];
    if (biome?.boardModifiers) {
      let currentMapNodeForModifiers = null;
      if(newMapState?.nodes[newMapState.currentNodeId]){ currentMapNodeForModifiers = newMapState.nodes[newMapState.currentNodeId]; }
      finalBoardParams = biome.boardModifiers(encounter.boardParams, levelForNextSetup, currentMapNodeForModifiers?.rewardType);
    }
    const newBoard = boardHook.generateBoardFromBoardParameters(finalBoardParams, activeEcos, levelForNextSetup, 0, currentBiomeForBoard);
    boardHook.setBoard(newBoard);
    
    setGameStateFromHook(prev => ({
        ...prev, status: GameStatus.Playing, currentPhase: GamePhase.PLAYER_TURN, currentLevel: levelForNextSetup, currentFloor,
        currentArenaLevel: 0, furyMinigameCompletedForThisLevel: false, postLevelActionTaken: false, mapDecisionPending: false, eventQueue: [],
        playerTookDamageThisLevel: false, isPrologueActive: false, guidingTextKey: '',
        currentBoardDimensions: {rows: newBoard.length, cols: newBoard[0]?.length || 0}, oracleSelectedFuryAbility: null,
        aiThinkingCellCoords: null, aiActionTargetCell: null, currentRunMap: isTransitioningFromPrologue ? newMapState : prev.currentRunMap,
        currentBiomeId: isTransitioningFromPrologue && newMapState ? newMapState.nodes[newMapState.startNodeId].biomeId : prev.currentBiomeId,
        levelsInCurrentStretch: isTransitioningFromPrologue ? DEFAULT_LEVELS_PER_STRETCH : prev.levelsInCurrentStretch,
        currentStretchCompletedLevels: isTransitioningFromPrologue ? 0 : prev.currentStretchCompletedLevels + 1,
        stretchStartLevel: isTransitioningFromPrologue ? levelForNextSetup : prev.stretchStartLevel,
    }));
  }, [ gameStateHook, playerStateHook, metaProgressHook, echosHookRaw, furiesHook, runStatsHook, enemyStateHook, boardHook, generateRunMap ]);

  useGameLoop({
    gameState: gameStateHook.gameState, setGameState: gameStateHook.setGameState, setGamePhase: gameStateHook.setGamePhase, setGameStatus: gameStateHook.setGameStatus,
    playerState: playerStateHook.player, enemyState: enemyStateHook.enemy, setEnemyState: enemyStateHook.setEnemy,
    executeEnemyTurnLogic: enemyAIHook.executeEnemyTurnLogic, applyFuryEffect: furiesHook.applyFuryEffect,
    wasCorazonDelAbismoChoiceActivePreviouslyRef: echosHookRaw.wasCorazonDelAbismoChoiceActivePreviouslyRef,
    proceedToNextLevel: memoizedProceedToNextLevel, addGameEvent: gameEventsHook.addGameEvent,
  });

  const initializeNewRun = useCallback((isPrologueRun: boolean) => {
    if (isPrologueRun) { prologueHookRaw.requestPrologueStart(); return; }
    runStatsHook.resetRunStats();
    let baseHp = INITIAL_PLAYER_HP, baseGold = INITIAL_PLAYER_GOLD, baseShield = INITIAL_PLAYER_SHIELD, currentMaxSoulFragments = INITIAL_MAX_SOUL_FRAGMENTS;
    for (const upgradeId in metaProgressHook.metaProgress.mirrorUpgrades) {
        const lvl = metaProgressHook.metaProgress.mirrorUpgrades[upgradeId];
        if (lvl > 0) {
            const def = MIRROR_UPGRADES_CONFIG.find(u => u.id === upgradeId);
            if (def) { let val = 0; for(let i=0; i < lvl; i++) { val += def.levels[i].effectValue; }
                switch (def.appliesTo) {
                    case 'playerMaxHp': baseHp += val; break; case 'playerStartGold': baseGold += val; break;
                    case 'playerStartShield': baseShield += val; break; case 'playerMaxSoulFragments': currentMaxSoulFragments += val; break;
                }
            }
        }
    }
    if (metaProgressHook.metaProgress.maxSoulFragments !== currentMaxSoulFragments) {
        const newlyC = metaProgressHook.setAndSaveMetaProgress(prev => ({...prev, maxSoulFragments: currentMaxSoulFragments}), GameStatus.MainMenu);
        runStatsHook.updateNewlyCompletedGoals(newlyC);
    }
    playerStateHook.resetPlayerForNewRun(baseHp, baseGold, baseShield);
    const newlyCGoals = metaProgressHook.setAndSaveMetaProgress(prevMeta => {
        const newGoals = { ...prevMeta.goalsProgress }; let changed = false;
        INITIAL_GOALS_CONFIG.forEach(gDef => {
            if (gDef.resetsPerRun && newGoals[gDef.id] && (newGoals[gDef.id].currentValue !== 0 || newGoals[gDef.id].completed)) {
                newGoals[gDef.id] = { ...newGoals[gDef.id], currentValue: 0, completed: false }; changed = true;
            }
        }); return changed ? { ...prevMeta, goalsProgress: newGoals } : prevMeta;
    }, GameStatus.MainMenu);
    runStatsHook.updateNewlyCompletedGoals(newlyCGoals);

    const initialLevel = 1; const initialFloor = getCurrentFloorNumber(initialLevel);
    const newRunMap = generateRunMap(); const startNode = newRunMap.nodes[newRunMap.startNodeId];
    const encounter = generateEncounterForFloor(initialFloor, initialLevel, INITIAL_STARTING_FURIESS[0]);
    const biome = BIOME_DEFINITIONS[startNode.biomeId];
    let finalBoardParams = encounter.boardParams;
    if (biome?.boardModifiers) finalBoardParams = biome.boardModifiers(encounter.boardParams, initialLevel, startNode.rewardType);
    const newBoard = boardHook.generateBoardFromBoardParameters(finalBoardParams, [], initialLevel, 0, startNode.biomeId);
    
    enemyStateHook.setEnemy(encounter.enemy); boardHook.setBoard(newBoard);
    echosHookRaw.setActiveEcosState([]); echosHookRaw.setAvailableEchoChoices([]);
    gameStateHook.setGameState(prev => ({
      ...prev, status: GameStatus.Playing, currentPhase: GamePhase.PLAYER_TURN, currentLevel: initialLevel, currentFloor: initialFloor,
      isFuryMinigameActive: false, furyMinigamePhase: 'inactive', furyMinigameCompletedForThisLevel: false, oracleSelectedFuryAbility: INITIAL_STARTING_FURIESS[0],
      isPrologueActive: false, prologueStep: 0, prologueEnemyFuryAbility: null, eventQueue: [], playerTookDamageThisLevel: false, currentArenaLevel: 0,
      isBattlefieldReductionTransitioning: false, guidingTextKey: '', currentBoardDimensions: { rows: finalBoardParams.rows, cols: finalBoardParams.cols },
      postLevelActionTaken: false, currentRunMap: newRunMap, currentBiomeId: startNode.biomeId, levelsInCurrentStretch: DEFAULT_LEVELS_PER_STRETCH,
      currentStretchCompletedLevels: 0, stretchStartLevel: initialLevel, mapDecisionPending: false,
      stretchRewardPending: (startNode.rewardType !== MapRewardType.None && startNode.rewardType !== MapRewardType.ExtraGold) ? {type: startNode.rewardType, value: startNode.rewardValue} : null,
      aiThinkingCellCoords: null, aiActionTargetCell: null,
    }));
  }, [prologueHookRaw, runStatsHook, metaProgressHook, playerStateHook, enemyStateHook, boardHook, echosHookRaw, gameStateHook, generateRunMap]);

  const selectMapPathAndStartStretch = useCallback((chosenNodeId: string) => {
    const { setGameState: setGameStateFromHook, setGameStatus: setGameStatusFromHook } = gameStateHook;
    setGameStateFromHook(prev => {
        if (!prev.currentRunMap) return prev;
        const newNodes = { ...prev.currentRunMap.nodes };
        if (newNodes[prev.currentRunMap.currentNodeId]) { newNodes[prev.currentRunMap.currentNodeId].isCurrent = false; newNodes[prev.currentRunMap.currentNodeId].isCompleted = true; }
        if (newNodes[chosenNodeId]) { newNodes[chosenNodeId].isCurrent = true; }
        else { console.error("Chosen node ID not found in map:", chosenNodeId); return prev; }
        const chosenNode = newNodes[chosenNodeId];
        let nextStretchRewardPending: GameStateCore['stretchRewardPending'] = null;
        if ([MapRewardType.SoulFragments,MapRewardType.WillLumens,MapRewardType.HealingFountain,MapRewardType.FreeEcho,MapRewardType.EchoForge].includes(chosenNode.rewardType)) {
            nextStretchRewardPending = { type: chosenNode.rewardType, value: chosenNode.rewardValue };
        }
        return {
            ...prev, currentRunMap: { ...prev.currentRunMap, nodes: newNodes, currentNodeId: chosenNodeId },
            currentBiomeId: chosenNode.biomeId, levelsInCurrentStretch: DEFAULT_LEVELS_PER_STRETCH,
            currentStretchCompletedLevels: 0, stretchStartLevel: prev.currentLevel, mapDecisionPending: false,
            furyMinigameCompletedForThisLevel: false, postLevelActionTaken: true, stretchRewardPending: nextStretchRewardPending,
        };
    });
    setGameStatusFromHook(GameStatus.PostLevel);
  }, [gameStateHook]);

  const confirmAndAbandonRun = useCallback(() => {
    playMidiSoundPlaceholder('abandon_run_confirmed');
    gameStateHook.setGameStatus(GameStatus.GameOverDefeat);
  }, [gameStateHook]);

  const debugWinLevel = useCallback(() => {
    const { gameState, setGameState: setGameStateFromHook } = gameStateHook;
    const { player } = playerStateHook;
    const { enemy, setEnemy: setEnemyFromHook } = enemyStateHook;
    const { metaProgress, setAndSaveMetaProgress } = metaProgressHook;
    const { generateEchoChoicesForPostLevelScreen: generateEchos } = echosHookRaw;
    const { runStats, setRunStats: setRunStatsFromHook, updateNewlyCompletedGoals } = runStatsHook;
    const { addGameEvent: addGameEventFromHook } = gameEventsHook;

    if (gameState.status !== GameStatus.Playing) return;
    playMidiSoundPlaceholder('debug_win_level');
    setEnemyFromHook(prev => ({...prev, currentHp: 0}));

    const enemyDefeatedPayload: GoalEnemyDefeatedPayload = { enemyArchetypeId: enemy.archetypeId };
    const newlyDefeat = setAndSaveMetaProgress(prevMeta => GoalTrackingService.processEvent('ENEMY_DEFEATED', enemyDefeatedPayload, prevMeta, setAndSaveMetaProgress) || prevMeta, gameState.status);
    updateNewlyCompletedGoals(newlyDefeat);
    setRunStatsFromHook(prev => ({ ...prev, enemiesDefeatedThisRun: prev.enemiesDefeatedThisRun + 1, soulFragmentsEarnedThisRun: prev.soulFragmentsEarnedThisRun + SOUL_FRAGMENTS_PER_ENEMY_DEFEAT }));
    generateEchos();

    let mapDecisionNowPending = false;
    if (!gameState.isPrologueActive && gameState.currentStretchCompletedLevels >= gameState.levelsInCurrentStretch - 1) {
        mapDecisionNowPending = true;
        if (gameState.stretchRewardPending) {
            const reward = gameState.stretchRewardPending;
            let newSoulFragments = runStats.soulFragmentsEarnedThisRun + SOUL_FRAGMENTS_PER_ENEMY_DEFEAT;
            if (reward.type === MapRewardType.SoulFragments && reward.value) { newSoulFragments += reward.value; addGameEventFromHook({text: `+${reward.value} Fragmentos de Alma (Mapa)!`, type: 'gold-player', targetId: 'player-stats-container'}); }
            else if (reward.type === MapRewardType.WillLumens && reward.value) {
                const newlyLumens = setAndSaveMetaProgress(prevMeta => ({...prevMeta, willLumens: prevMeta.willLumens + (reward.value || 0)}), gameState.status);
                updateNewlyCompletedGoals(newlyLumens);
                addGameEventFromHook({text: `+${reward.value} Lúmenes (Mapa)!`, type: 'gold-player', targetId: 'player-stats-container'});
            }
            else if (reward.type === MapRewardType.HealingFountain && reward.value) {
                playerStateHook.setPlayer(p => {
                    const healedHp = Math.min(p.maxHp, p.hp + (reward.value || 0));
                    addGameEventFromHook({text: `+${healedHp - p.hp} HP (Fuente)!`, type: 'heal-player', targetId: 'player-stats-container'});
                    return {...p, hp: healedHp};
                });
            }
            setRunStatsFromHook(prev => ({ ...prev, soulFragmentsEarnedThisRun: newSoulFragments }));
            setGameStateFromHook(prev => ({...prev, stretchRewardPending: null}));
        }
    }
    setGameStateFromHook(prev => ({
      ...prev, status: GameStatus.PostLevel, furyMinigameCompletedForThisLevel: false, postLevelActionTaken: false,
      prologueStep: (prev.isPrologueActive && prev.currentLevel === PROLOGUE_LEVEL_ID) ? 7 : prev.prologueStep,
      guidingTextKey: (prev.isPrologueActive && prev.currentLevel === PROLOGUE_LEVEL_ID) ? 7 as GuidingTextKey : prev.guidingTextKey,
      mapDecisionPending: mapDecisionNowPending,
    }));
  }, [ gameStateHook, playerStateHook, enemyStateHook, metaProgressHook, echosHookRaw, runStatsHook, gameEventsHook ]);

  return {
    gameState: gameStateHook.gameState, player: playerStateHook.player, enemy: enemyStateHook.enemy, board: boardHook.board,
    activeEcos: echosHookRaw.activeEcos, fullEffectiveEcos: echosHookRaw.fullEffectiveEcos,
    availableEchoChoices: echosHookRaw.availableEchoChoices, runStats: runStatsHook.runStats, metaProgress: metaProgressHook.metaProgress,
    loadMetaProgress: metaProgressHook.loadMetaProgress, setAndSaveMetaProgress: metaProgressHook.setAndSaveMetaProgress,
    initializeNewRun, proceedToNextLevel: memoizedProceedToNextLevel, confirmAndAbandonRun, selectMapPathAndStartStretch,
    requestPrologueStart: prologueHookRaw.requestPrologueStart, startPrologueActual: prologueHookRaw.startPrologueActual,
    advancePrologueStep: prologueHookRaw.advancePrologueStep,
    handlePlayerCellSelection: playerActionsHook.handlePlayerCellSelection, cycleCellMark: playerActionsHook.cycleCellMark,
    selectEchoOption: echosHookRaw.selectEchoOption, tryActivateAlquimiaImprovisada: echosHookRaw.tryActivateAlquimiaImprovisada,
    tryActivateOjoOmnisciente: echosHookRaw.tryActivateOjoOmnisciente, resolveCorazonDelAbismoChoice: echosHookRaw.resolveCorazonDelAbismoChoice,
    advanceFuryMinigamePhase: furiesHook.advanceFuryMinigamePhase, handlePlayerFuryCardSelection: furiesHook.handlePlayerFuryCardSelection,
    popEvent: gameEventsHook.popEvent, addGameEvent: gameEventsHook.addGameEvent,
    debugWinLevel, conditionalEchoTriggeredId: gameStateHook.gameState.conditionalEchoTriggeredId,
  };
};
