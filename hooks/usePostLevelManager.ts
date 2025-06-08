import { useState, useCallback, useEffect } from 'react';
import {
  PlayerState,
  Echo,
  MetaProgressState,
  GameStatus,
  RunStats,
  GameEvent,
  FuryAbility,
  GameStateCore,
  BiomeId,
  RunMapNode,
  RunMapState,
  MapRewardType,
  MapEncounterType,
  Rarity, // Needed for Corazon del Abismo
  EchoEffectType, // Needed for selectEchoOption logic
} from '../types';
import {
  ALL_ECHOS_MAP,
  BASE_ECHO_ALQUIMIA_IMPROVISADA, // For selectEchoOption
  BASE_ECHO_CORAZON_ABISMO,      // For selectEchoOption
  ALL_ECHOS_LIST,                // For Corazon del Abismo random epic echo
  PROLOGUE_LEVEL_ID,             // For selectEchoOption prologue check
} from '../constants';
import { GoalTrackingService } from '../services/goalTrackingService'; // For selectEchoOption
import { playMidiSoundPlaceholder } from '../utils/soundUtils'; // For selectEchoOption

export interface UsePostLevelManagerProps {
  playerState: PlayerState;
  activeEcos: Echo[];
  metaProgress: MetaProgressState;
  currentLevel: number;
  isPrologueActive: boolean;
  prologueStep: number; // Added: needed for selectEchoOption's advancePrologueStep call
  mapDecisionPending: boolean;
  currentRunMap: RunMapState | null;

  generateEchoChoicesForPostLevelScreen: (
    isPrologue: boolean,
    level: number,
    currentEcos: Echo[],
    player: PlayerState,
    meta: MetaProgressState
  ) => Echo[];
  startFuryMinigame: (options: FuryAbility[]) => void;
  getFuryOptionsForOracle: (awakenedFuryIds: string[], nextOracleOnlyCommon: boolean) => FuryAbility[];

  setPlayer: React.Dispatch<React.SetStateAction<PlayerState>>;
  setActiveEcosState: React.Dispatch<React.SetStateAction<Echo[]>>;
  setAvailableEchoChoicesInGameEngine: React.Dispatch<React.SetStateAction<Echo[]>>;
  setRunStats: React.Dispatch<React.SetStateAction<RunStats>>;
  setAndSaveMetaProgress: (updater: React.SetStateAction<MetaProgressState>) => void;
  addGameEvent: (event: GameEvent) => void;
  triggerConditionalEchoAnimation: (echoId: string) => void;
  setGameStatusInEngine: (status: GameStatus) => void;
  executeProceedToNextLevelInEngine: () => void;
  advancePrologueStepInEngine: (nextStep?: number | '') => void; // Added: for selectEchoOption

  getOracleSelectedFuryAbility: () => FuryAbility | null;
  getIsFuryMinigameActive: () => boolean;
  getFuryMinigameCompletedForThisLevel: () => boolean;

  // To set postLevelActionTaken in the main gameState if still needed by other systems
  // Alternatively, useGameEngine can observe isPostLevelSequenceActive from this hook.
  setPostLevelActionTakenInGameEngine: (value: boolean) => void;
}

type PostLevelPhase = 'inactive' | 'echoChoice' | 'furyMinigame' | 'corazonChoice' | 'readyToProceed';

export interface CorazonDelAbismoOptionsForHook { // Renamed to avoid conflict with GameStateCore type
  randomEpicEcho: Echo | null;
  duplicableActiveEcos: Echo[];
}

export const usePostLevelManager = (props: UsePostLevelManagerProps) => {
  const {
    playerState,
    activeEcos,
    metaProgress,
    currentLevel,
    isPrologueActive,
    prologueStep,
    mapDecisionPending,
    // currentRunMap, // Not directly used in transferred logic yet, but available
    generateEchoChoicesForPostLevelScreen,
    startFuryMinigame,
    getFuryOptionsForOracle,
    setPlayer,
    setActiveEcosState,
    setAvailableEchoChoicesInGameEngine,
    setRunStats,
    setAndSaveMetaProgress,
    addGameEvent,
    triggerConditionalEchoAnimation,
    setGameStatusInEngine,
    executeProceedToNextLevelInEngine,
    advancePrologueStepInEngine,
    getOracleSelectedFuryAbility,
    getIsFuryMinigameActive,
    getFuryMinigameCompletedForThisLevel,
    setPostLevelActionTakenInGameEngine,
  } = props;

  const [postLevelPhase, setPostLevelPhase] = useState<PostLevelPhase>('inactive');
  const [localAvailableEchoChoices, setLocalAvailableEchoChoices] = useState<Echo[]>([]);
  const [corazonDelAbismoOptionsForHook, setCorazonDelAbismoOptionsForHook] = useState<CorazonDelAbismoOptionsForHook | null>(null);

  const isPostLevelSequenceActive = postLevelPhase !== 'inactive';

  const startPostLevelSequence = useCallback(() => {
    const choices = generateEchoChoicesForPostLevelScreen(
      isPrologueActive,
      currentLevel,
      activeEcos,
      playerState,
      metaProgress
    );
    setLocalAvailableEchoChoices(choices);
    setAvailableEchoChoicesInGameEngine(choices);
    setCorazonDelAbismoOptionsForHook(null); // Reset any previous Corazon options
    setPostLevelPhase('echoChoice');
    setPostLevelActionTakenInGameEngine(false); // Reset for the new sequence
  }, [
    currentLevel,
    generateEchoChoicesForPostLevelScreen,
    isPrologueActive,
    activeEcos,
    playerState,
    metaProgress,
    setAvailableEchoChoicesInGameEngine,
    setPostLevelActionTakenInGameEngine,
  ]);

  const advanceToFuryMinigameOrProceed = useCallback(() => {
    const isMinigameActive = getIsFuryMinigameActive();
    const minigameCompletedThisLevel = getFuryMinigameCompletedForThisLevel();

    if (!isPrologueActive && !mapDecisionPending && !minigameCompletedThisLevel && !isMinigameActive) {
      const options = getFuryOptionsForOracle(metaProgress.awakenedFuryIds, playerState.nextOracleOnlyCommonFury);
      startFuryMinigame(options);
      setPostLevelPhase('furyMinigame');
    } else {
      setPostLevelPhase('readyToProceed');
    }
  }, [
    isPrologueActive,
    mapDecisionPending,
    getIsFuryMinigameActive,
    getFuryMinigameCompletedForThisLevel,
    getFuryOptionsForOracle,
    metaProgress.awakenedFuryIds,
    playerState.nextOracleOnlyCommonFury,
    startFuryMinigame,
  ]);

  const handleEchoSelected = useCallback((echoId: string): { isCorazonChoiceTriggered: boolean } => {
    const selectedFullEcho = ALL_ECHOS_MAP.get(echoId);
    if (!selectedFullEcho) return { isCorazonChoiceTriggered: false };

    const costMultiplier = playerState.nextEchoCostsDoubled && !selectedFullEcho.isFree ? 2 : 1;
    const actualCost = selectedFullEcho.cost * costMultiplier;

    if (!selectedFullEcho.isFree && playerState.gold < actualCost) {
      addGameEvent({ text: "Oro insuficiente.", type: 'info' });
      return { isCorazonChoiceTriggered: false };
    }

    playMidiSoundPlaceholder(`echo_select_${selectedFullEcho.id}`);

    setActiveEcosState(prevActiveEcos => {
      let newActiveEcos = [...prevActiveEcos];
      const existingEchoIndex = newActiveEcos.findIndex(e => e.baseId === selectedFullEcho.baseId);
      if (existingEchoIndex !== -1) {
        newActiveEcos[existingEchoIndex] = selectedFullEcho;
      } else {
        newActiveEcos.push(selectedFullEcho);
      }
      return newActiveEcos;
    });

    setRunStats(prev => {
      const newRunUniqueEcosActivated = prev.runUniqueEcosActivated.includes(selectedFullEcho.baseId)
        ? prev.runUniqueEcosActivated
        : [...prev.runUniqueEcosActivated, selectedFullEcho.baseId];
      if (!prev.runUniqueEcosActivated.includes(selectedFullEcho.baseId)) {
        GoalTrackingService.processEvent('UNIQUE_ECO_ACTIVATED', null, metaProgress, setAndSaveMetaProgress);
      }
      return {
        ...prev,
        runUniqueEcosActivated: newRunUniqueEcosActivated,
        nonFreeEcosAcquiredThisRun: selectedFullEcho.isFree ? prev.nonFreeEcosAcquiredThisRun : prev.nonFreeEcosAcquiredThisRun + 1,
      };
    });

    setPlayer(prevPlayer => {
      let newPlayerHp = prevPlayer.hp;
      let newPlayerMaxHp = prevPlayer.maxHp;
      const newPlayerGold = selectedFullEcho.isFree ? prevPlayer.gold : prevPlayer.gold - actualCost;
      const newPlayerNextEchoCostsDoubled = playerState.nextEchoCostsDoubled && !selectedFullEcho.isFree ? false : playerState.nextEchoCostsDoubled;

      if (selectedFullEcho.effectType === EchoEffectType.GainHP) {
        const healAmount = (selectedFullEcho.value as number) * (selectedFullEcho.effectivenessMultiplier || 1);
        newPlayerHp = Math.min(prevPlayer.maxHp, prevPlayer.hp + healAmount);
        addGameEvent({ text: `+${healAmount} HP`, type: 'heal-player', targetId: 'player-stats-container' });
      } else if (selectedFullEcho.effectType === EchoEffectType.IncreaseMaxHP) {
        const increaseAmount = (selectedFullEcho.value as number) * (selectedFullEcho.effectivenessMultiplier || 1);
        newPlayerMaxHp = prevPlayer.maxHp + increaseAmount;
        newPlayerHp = prevPlayer.hp + increaseAmount;
        addGameEvent({ text: `Max HP +${increaseAmount}`, type: 'info', targetId: 'player-stats-container' });
      }

      return {
        ...prevPlayer,
        hp: newPlayerHp,
        maxHp: newPlayerMaxHp,
        gold: newPlayerGold,
        nextEchoCostsDoubled: newPlayerNextEchoCostsDoubled,
        alquimiaImprovisadaChargeAvailable: selectedFullEcho.baseId === BASE_ECHO_ALQUIMIA_IMPROVISADA ? true : prevPlayer.alquimiaImprovisadaChargeAvailable,
      };
    });

    if (isPrologueActive && currentLevel === PROLOGUE_LEVEL_ID && prologueStep === 7) {
      advancePrologueStepInEngine(8);
    }

    if (selectedFullEcho.baseId === BASE_ECHO_CORAZON_ABISMO) {
      const sacrificeAmount = Math.floor(playerState.hp / 2);
      const hpAfterSacrifice = playerState.hp - sacrificeAmount;

      if (hpAfterSacrifice < 1) {
        addGameEvent({ text: "¡Sacrificio demasiado grande!", type: 'info' });
        // Revert activeEcos state if Corazon cannot be afforded (optional, or handle disabling choice)
        setActiveEcosState(prevActiveEcos => prevActiveEcos.filter(e => e.baseId !== BASE_ECHO_CORAZON_ABISMO));
        return { isCorazonChoiceTriggered: false };
      }

      setPlayer(prev => ({ ...prev, hp: hpAfterSacrifice }));
      addGameEvent({ text: `-${sacrificeAmount} HP (Corazón del Abismo)`, type: 'damage-player', targetId: 'player-stats-container' });

      const epicEchos = ALL_ECHOS_LIST.filter(e => e.rarity === Rarity.Epic && !activeEcos.some(ae => ae.baseId === e.baseId) && e.baseId !== BASE_ECHO_CORAZON_ABISMO);
      const randomEpicEcho = epicEchos.length > 0 ? epicEchos[Math.floor(Math.random() * epicEchos.length)] : null;
      const duplicableActiveEcos = activeEcos.filter(e => (e.rarity === Rarity.Common || e.rarity === Rarity.Rare) && e.baseId !== BASE_ECHO_CORAZON_ABISMO);

      setCorazonDelAbismoOptionsForHook({ randomEpicEcho, duplicableActiveEcos: duplicableActiveEcos as Echo[] });
      setPostLevelPhase('corazonChoice');
      triggerConditionalEchoAnimation(selectedFullEcho.id);
      setPostLevelActionTakenInGameEngine(true); // Corazon choice itself is an action.
      return { isCorazonChoiceTriggered: true };
    } else {
      setPostLevelActionTakenInGameEngine(true);
      advanceToFuryMinigameOrProceed();
      return { isCorazonChoiceTriggered: false };
    }
  }, [
    playerState, activeEcos, metaProgress, currentLevel, isPrologueActive, prologueStep,
    addGameEvent, setActiveEcosState, setRunStats, setPlayer, setAndSaveMetaProgress,
    triggerConditionalEchoAnimation, advancePrologueStepInEngine,
    advanceToFuryMinigameOrProceed, setPostLevelActionTakenInGameEngine,
  ]);

  const resolveCorazonDelAbismoChoiceInManager = useCallback((type: 'epic' | 'duplicate', chosenEchoId?: string) => {
    if (!corazonDelAbismoOptionsForHook) return;

    let echoToAddOrUpdate: Echo | null = null;
    let effectApplied = false;

    if (type === 'epic' && corazonDelAbismoOptionsForHook.randomEpicEcho) {
      echoToAddOrUpdate = corazonDelAbismoOptionsForHook.randomEpicEcho;
      playMidiSoundPlaceholder(`corazon_resolve_epic_${echoToAddOrUpdate.id}`);
      addGameEvent({ text: `¡Nuevo Eco Épico: ${echoToAddOrUpdate.name}!`, type: 'info' });
      effectApplied = true;
    } else if (type === 'duplicate' && chosenEchoId) {
      const echoToDuplicate = activeEcos.find(e => e.id === chosenEchoId);
      if (echoToDuplicate) {
        echoToAddOrUpdate = { ...echoToDuplicate, effectivenessMultiplier: (echoToDuplicate.effectivenessMultiplier || 1) + 1 };
        playMidiSoundPlaceholder(`corazon_resolve_duplicate_${echoToDuplicate.id}`);
        addGameEvent({ text: `¡Eco ${echoToDuplicate.name} potenciado! (x${echoToAddOrUpdate.effectivenessMultiplier})`, type: 'info' });
        effectApplied = true;
      }
    }

    if (effectApplied && echoToAddOrUpdate) {
      const finalEchoToAdd = echoToAddOrUpdate; // For closure in setActiveEcosState
      setActiveEcosState(prevActiveEcos => {
        let newActiveEcos = [...prevActiveEcos];
        const existingIndex = newActiveEcos.findIndex(e => e.baseId === finalEchoToAdd.baseId);
        if (existingIndex !== -1) {
          newActiveEcos[existingIndex] = finalEchoToAdd;
        } else {
          newActiveEcos.push(finalEchoToAdd);
        }
        return newActiveEcos;
      });

      setRunStats(prev => {
        const newRunUniqueEcosActivated = prev.runUniqueEcosActivated.includes(finalEchoToAdd.baseId)
          ? prev.runUniqueEcosActivated
          : [...prev.runUniqueEcosActivated, finalEchoToAdd.baseId];
        if (!prev.runUniqueEcosActivated.includes(finalEchoToAdd.baseId)) {
          GoalTrackingService.processEvent('UNIQUE_ECO_ACTIVATED', null, metaProgress, setAndSaveMetaProgress);
        }
        return { ...prev, runUniqueEcosActivated: newRunUniqueEcosActivated };
      });
    }

    setCorazonDelAbismoOptionsForHook(null);
    setPostLevelActionTakenInGameEngine(true); // Corazon resolution is an action.
    advanceToFuryMinigameOrProceed();
  }, [
    corazonDelAbismoOptionsForHook, activeEcos, addGameEvent, metaProgress,
    setActiveEcosState, setRunStats, setAndSaveMetaProgress,
    advanceToFuryMinigameOrProceed, setPostLevelActionTakenInGameEngine
  ]);

  useEffect(() => {
    const isMinigameActive = getIsFuryMinigameActive();
    const minigameCompletedThisLevel = getFuryMinigameCompletedForThisLevel();

    if (postLevelPhase === 'echoChoice' && localAvailableEchoChoices.length === 0 && !isPrologueActive) {
        // No echo choices, skip to fury or proceed
        console.log('[usePostLevelManager] No echo choices available, advancing from echoChoice phase.');
        advanceToFuryMinigameOrProceed();
    }

    if (postLevelPhase === 'furyMinigame' && !isMinigameActive && minigameCompletedThisLevel) {
      console.log('[usePostLevelManager] Fury minigame completed, advancing to ReadyToProceed.');
      setPostLevelPhase('readyToProceed');
    }

    if (postLevelPhase === 'readyToProceed') {
      if (mapDecisionPending) {
        console.log('[usePostLevelManager] Map decision pending, setting status to AbyssMapView.');
        setGameStatusInEngine(GameStatus.AbyssMapView);
      } else {
        console.log('[usePostLevelManager] Proceeding to next level.');
        executeProceedToNextLevelInEngine();
      }
      setPostLevelPhase('inactive'); // Reset phase
    }
  }, [
    postLevelPhase,
    mapDecisionPending,
    localAvailableEchoChoices.length, // Added for auto-advance
    isPrologueActive, // Added for auto-advance condition
    getIsFuryMinigameActive,
    getFuryMinigameCompletedForThisLevel,
    setGameStatusInEngine,
    executeProceedToNextLevelInEngine,
    advanceToFuryMinigameOrProceed, // Added for auto-advance
  ]);

  return {
    startPostLevelSequence,
    handleEchoSelected,
    resolveCorazonDelAbismoChoiceInManager,
    localAvailableEchoChoices,
    corazonDelAbismoOptionsForHook,
    isPostLevelSequenceActive,
    postLevelPhase,
  };
};
