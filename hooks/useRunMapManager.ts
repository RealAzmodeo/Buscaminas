// hooks/useRunMapManager.ts
import { useState, useCallback } from 'react';
import {
    RunMapState, BiomeId, MapRewardType, MapEncounterType, RunMapNode, GameStatus
} from '../types';
import {
    MAP_DEFAULT_DEPTH,
    MAP_CHOICES_PER_NODE_MIN,
    MAP_CHOICES_PER_NODE_MAX,
    MAP_NODE_REWARD_SOUL_FRAGMENTS_VALUE,
    MAP_NODE_REWARD_WILL_LUMENS_VALUE,
    MAP_NODE_REWARD_HEALING_FOUNTAIN_VALUE,
    DEFAULT_LEVELS_PER_STRETCH
} from '../constants';

export interface UseRunMapManagerProps {
  // Callback to update the main game status (e.g., to GameStatus.AbyssMapView)
  setGameStatus: (status: GameStatus) => void;
  // Callback to update general gameState fields if necessary, or pass specific setters
  // For now, this hook manages its own related state.
  // If it needs to modify parts of gameState not directly related to map, pass callbacks.
  // e.g. if selectMapPathAndStartStretch needs to set gameState.currentLevel directly.
  // For now, assuming it returns data for useGameEngine to handle such updates.
  getCurrentLevel: () => number; // Needed for stretchStartLevel in selectMapPath
  setGameStateForNewStretch: (newState: {
    currentBiomeId: BiomeId,
    levelsInCurrentStretch: number,
    currentStretchCompletedLevels: number,
    stretchStartLevel: number,
    mapDecisionPending: boolean,
    stretchRewardPending: { type: MapRewardType, value?: number } | null,
    postLevelActionTaken: boolean, // To ensure game proceeds after map decision
  }) => void;
}

export const useRunMapManager = (props: UseRunMapManagerProps) => {
  const [currentRunMap, setCurrentRunMap] = useState<RunMapState | null>(null);
  const [currentBiomeId, setCurrentBiomeId] = useState<BiomeId>(BiomeId.Default);
  const [levelsInCurrentStretch, setLevelsInCurrentStretch] = useState<number>(DEFAULT_LEVELS_PER_STRETCH);
  const [currentStretchCompletedLevels, setCurrentStretchCompletedLevels] = useState<number>(0);
  const [stretchStartLevel, setStretchStartLevel] = useState<number>(0); // Initialize appropriately
  const [mapDecisionPending, setMapDecisionPending] = useState<boolean>(false);
  const [stretchRewardPending, setStretchRewardPending] = useState<{ type: MapRewardType, value?: number } | null>(null);

  const generateRunMap = useCallback((): RunMapState => {
    const nodes: Record<string, RunMapNode> = {};
    const mapDepth = MAP_DEFAULT_DEPTH;
    let nodeIdCounter = 0;

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
        const currentLayerNodesTarget: string[] = []; // Renamed to avoid conflict
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
                currentLayerNodesTarget.push(choiceNode.id);
            }
        });
        previousLayerNodes = currentLayerNodesTarget;
    }
    const newMap = { nodes, startNodeId: startNode.id, currentNodeId: startNode.id, mapDepth };
    setCurrentRunMap(newMap);
    setCurrentBiomeId(startNode.biomeId); // Initialize biome based on start node
    setLevelsInCurrentStretch(DEFAULT_LEVELS_PER_STRETCH); // Default for the first stretch
    setCurrentStretchCompletedLevels(0);
    setStretchStartLevel(props.getCurrentLevel()); // Or 1 if it's a new run
    setMapDecisionPending(false); // No decision pending at the very start of a map
    setStretchRewardPending(startNode.rewardType !== MapRewardType.None && startNode.rewardType !== MapRewardType.ExtraGold ? {type: startNode.rewardType, value: startNode.rewardValue} : null);

    return newMap;
  }, [props.getCurrentLevel]); // Added props.getCurrentLevel

  const selectMapPathAndStartStretch = useCallback((chosenNodeId: string) => {
    if (!currentRunMap) return;

    const newNodes = { ...currentRunMap.nodes };
    if (newNodes[currentRunMap.currentNodeId]) {
      newNodes[currentRunMap.currentNodeId].isCurrent = false;
      newNodes[currentRunMap.currentNodeId].isCompleted = true;
    }
    if (newNodes[chosenNodeId]) {
      newNodes[chosenNodeId].isCurrent = true;
    } else {
      console.error("Chosen node ID not found in map:", chosenNodeId);
      return;
    }

    const chosenNode = newNodes[chosenNodeId];
    let nextStretchRewardPending: { type: MapRewardType, value?: number } | null = null;
    if (chosenNode.rewardType === MapRewardType.SoulFragments || chosenNode.rewardType === MapRewardType.WillLumens ||
        chosenNode.rewardType === MapRewardType.HealingFountain || chosenNode.rewardType === MapRewardType.FreeEcho ||
        chosenNode.rewardType === MapRewardType.EchoForge) {
        nextStretchRewardPending = { type: chosenNode.rewardType, value: chosenNode.rewardValue };
    }

    setCurrentRunMap(prevMap => prevMap ? ({ ...prevMap, nodes: newNodes, currentNodeId: chosenNodeId }) : null);
    setCurrentBiomeId(chosenNode.biomeId);
    setLevelsInCurrentStretch(DEFAULT_LEVELS_PER_STRETCH);
    setCurrentStretchCompletedLevels(0);
    setStretchStartLevel(props.getCurrentLevel()); // currentLevel from GameEngine
    setMapDecisionPending(false);
    setStretchRewardPending(nextStretchRewardPending);

    // Notify useGameEngine to update its part of gameState and status
    props.setGameStateForNewStretch({
        currentBiomeId: chosenNode.biomeId,
        levelsInCurrentStretch: DEFAULT_LEVELS_PER_STRETCH,
        currentStretchCompletedLevels: 0,
        stretchStartLevel: props.getCurrentLevel(),
        mapDecisionPending: false,
        stretchRewardPending: nextStretchRewardPending,
        postLevelActionTaken: true, // Indicate map decision was the post-level action
    });
    props.setGameStatus(GameStatus.PostLevel); // Transition back to PostLevel to proceed

  }, [currentRunMap, props.setGameStatus, props.getCurrentLevel, props.setGameStateForNewStretch]);

  // Function to be called by useGameEngine to update map state for a new run
  const initializeMapForNewRun = useCallback(() => {
    const newMap = generateRunMap();
    // Other map states are set within generateRunMap
    return newMap; // Return the map if useGameEngine needs it immediately
  }, [generateRunMap]);

  const completeStretch = useCallback(() => {
      setMapDecisionPending(true);
      // GameEngine will set GameStatus to AbyssMapView if mapDecisionPending is true
  }, []);


  return {
    currentRunMap,
    setCurrentRunMap, // Expose if GameEngine needs to manually set it (e.g. on load)
    currentBiomeId,
    levelsInCurrentStretch,
    currentStretchCompletedLevels,
    setCurrentStretchCompletedLevels, // For GameEngine to update as levels in stretch are done
    stretchStartLevel,
    mapDecisionPending,
    setMapDecisionPending, // For GameEngine to set when a stretch ends
    stretchRewardPending,
    setStretchRewardPending, // For GameEngine to clear/use
    generateRunMap, // For initial map generation
    selectMapPathAndStartStretch,
    initializeMapForNewRun,
    completeStretch, // New function to signal end of stretch
  };
};
