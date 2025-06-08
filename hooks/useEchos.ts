import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Echo, PlayerState, MetaProgressState, GameStateCore, RunStats, BoardState, GameStatus, EchoEffectType, Rarity
} from '../types';
import {
  BASE_ECHO_APRENDIZAJE_RAPIDO, BASE_ECHO_ALQUIMIA_IMPROVISADA, BASE_ECHO_OJO_OMNISCIENTE,
  BASE_ECHO_CORAZON_ABISMO, PROLOGUE_LEVEL_ID
  // Echo list constants (ALL_ECHOS_MAP, etc.) will be imported from core/echos
} from '../constants'; // Assuming constants are correctly pathed
import {
  ALL_ECHOS_MAP, ALL_ECHOS_LIST, PROLOGUE_PREDEFINED_ECHO_CHOICES_BASE_IDS,
  INITIAL_STARTING_ECHOS,
  FREE_ECHO_OPTIONS,
  NEW_AVAILABLE_ECHOS_FOR_TREE
} from '../core/echos';


// Forward declarations / Stubs for services and other hook functionalities
// These would be passed as props or imported if they were separate modules/services.
const GoalTrackingService = {
  processEvent: (event: string, payload: any, meta: MetaProgressState, saveMeta: Function) => {
    console.log(`GoalTrackingService.processEvent(${event}) STUBBED in useEchos`);
  }
};
const playMidiSoundPlaceholder = (soundId: string) => console.log(`Playing sound (placeholder): ${soundId}`);


export const getCurrentlyEffectiveEcos = (allActiveEcos: Echo[], deactivatedEcosInfo: PlayerState['deactivatedEcos']): Echo[] => {
  if (!deactivatedEcosInfo || deactivatedEcosInfo.length === 0) {
    return allActiveEcos;
  }
  const deactivatedIds = new Set(deactivatedEcosInfo.map(info => info.echoId));
  return allActiveEcos.filter(echo => !deactivatedIds.has(echo.id));
};


export interface UseEchosReturn {
  activeEcos: Echo[];
  setActiveEcosState: React.Dispatch<React.SetStateAction<Echo[]>>;
  availableEchoChoices: Echo[];
  setAvailableEchoChoices: React.Dispatch<React.SetStateAction<Echo[]>>;
  generateEchoChoicesForPostLevelScreen: () => void; // Dependencies will be injected via props
  selectEchoOption: (echoId: string) => boolean; // Returns true if Corazon choice is now active
  tryActivateAlquimiaImprovisada: () => void;
  tryActivateOjoOmnisciente: () => void;
  resolveCorazonDelAbismoChoice: (type: 'epic' | 'duplicate', chosenEchoId?: string) => void;
  triggerConditionalEchoAnimation: (echoId: string) => void; // Now part of this hook
  conditionalEchoTimeoutRef: React.MutableRefObject<number | null>;
  wasCorazonDelAbismoChoiceActivePreviouslyRef: React.MutableRefObject<boolean>;
  fullEffectiveEcos: Echo[]; // Derived state
}

interface EchosProps {
  // From usePlayerState
  playerState: PlayerState;
  setPlayerState: React.Dispatch<React.SetStateAction<PlayerState>>;
  // From useMetaProgress
  metaProgressState: MetaProgressState;
  setAndSaveMetaProgress: (updater: React.SetStateAction<MetaProgressState>, gameStatus?: GameStatus) => string[];
  // From useGameState
  gameState: GameStateCore;
  setGameState: React.Dispatch<React.SetStateAction<GameStateCore>>;
  advancePrologueStep: (step?: number | string) => void; // Simplified from original for now
  // From useRunStats
  runStats: RunStats;
  setRunStats: React.Dispatch<React.SetStateAction<RunStats>>; // Or specific updaters
  // From useBoard (simplified for now, may need more specific functions)
  getBoardForOjo: () => BoardState; // Function to get current board
  setBoardAfterOjo: (newBoard: BoardState) => void; // Function to set board
  recalculateCluesAfterOjo: (board: BoardState) => BoardState;
  updateBoardVisualsAfterOjo: (board: BoardState, ecos: Echo[], deactivated: PlayerState['deactivatedEcos']) => BoardState;
  // From useGameEvents
  addGameEvent: (payload: any, type?: string) => void;
}

export const useEchos = ({
  playerState, setPlayerState,
  metaProgressState, setAndSaveMetaProgress,
  gameState, setGameState, advancePrologueStep,
  runStats, setRunStats,
  getBoardForOjo, setBoardAfterOjo, recalculateCluesAfterOjo, updateBoardVisualsAfterOjo,
  addGameEvent,
}: EchosProps): UseEchosReturn => {
  const [activeEcos, setActiveEcosState] = useState<Echo[]>([]);
  const [availableEchoChoices, setAvailableEchoChoices] = useState<Echo[]>([]);

  const conditionalEchoTimeoutRef = useRef<number | null>(null);
  const wasCorazonDelAbismoChoiceActivePreviouslyRef = useRef(gameState.isCorazonDelAbismoChoiceActive);

  useEffect(() => {
    wasCorazonDelAbismoChoiceActivePreviouslyRef.current = gameState.isCorazonDelAbismoChoiceActive;
  }, [gameState.isCorazonDelAbismoChoiceActive]);


  const triggerConditionalEchoAnimation = useCallback((echoId: string) => {
    if (conditionalEchoTimeoutRef.current) clearTimeout(conditionalEchoTimeoutRef.current);
    setGameState(prev => ({ ...prev, conditionalEchoTriggeredId: echoId }));
    conditionalEchoTimeoutRef.current = window.setTimeout(() => {
      setGameState(prev => ({ ...prev, conditionalEchoTriggeredId: null }));
      conditionalEchoTimeoutRef.current = null;
    }, 1500);
  }, [setGameState]);

  const generateEchoChoicesForPostLevelScreen = useCallback(() => {
    const levelCompleted = gameState.currentLevel;
    const currentActiveEcos = activeEcos; // from this hook's state
    // playerState and metaProgressState are from props

    console.log("[GenerateChoices] Unlocked Base IDs in MetaProgress:", metaProgressState.unlockedEchoBaseIds);
    if (levelCompleted === PROLOGUE_LEVEL_ID && gameState.isPrologueActive) {
        const prologueChoices = PROLOGUE_PREDEFINED_ECHO_CHOICES_BASE_IDS
          .map(baseId => ALL_ECHOS_LIST.find(e => e.baseId === baseId && e.level === 1))
          .filter(Boolean) as Echo[];
        const freeHeal = ALL_ECHOS_LIST.find(e => e.id === 'eco_recover_hp_free_1');
        if (freeHeal && prologueChoices.length < 3) prologueChoices.push(freeHeal);
        setAvailableEchoChoices(prologueChoices.slice(0, 3));
        return;
    }

    const aprendizajeRapidoEcho = currentActiveEcos.find(e => e.baseId === BASE_ECHO_APRENDIZAJE_RAPIDO);
    const numChoices = 3;

    const availableUpgradesAndNewEcos: Echo[] = [];
    metaProgressState.unlockedEchoBaseIds.forEach(unlockedBaseId => {
        if (!currentActiveEcos.some(ae => ae.baseId === unlockedBaseId)) {
            const lvl1Echo = ALL_ECHOS_LIST.find(e => e.baseId === unlockedBaseId && e.level === 1);
            if (lvl1Echo && !availableUpgradesAndNewEcos.some(existing => existing.id === lvl1Echo.id)) {
                availableUpgradesAndNewEcos.push(lvl1Echo);
            }
        }
    });
    currentActiveEcos.forEach(activeEcho => {
        const potentialUpgrade = NEW_AVAILABLE_ECHOS_FOR_TREE.find(treeEcho =>
            treeEcho.baseId === activeEcho.baseId &&
            treeEcho.level === activeEcho.level + 1 &&
            metaProgressState.unlockedEchoBaseIds.includes(treeEcho.baseId)
        );
        if (potentialUpgrade && !availableUpgradesAndNewEcos.some(existing => existing.id === potentialUpgrade.id)) {
            availableUpgradesAndNewEcos.push(potentialUpgrade);
        }
    });

    let choicePool: Echo[] = [...INITIAL_STARTING_ECHOS, ...availableUpgradesAndNewEcos];
    choicePool = Array.from(new Map(choicePool.map(item => [item.id, item])).values());
    choicePool = choicePool.filter(echo => {
        const activeVersion = currentActiveEcos.find(ae => ae.baseId === echo.baseId);
        return activeVersion ? echo.level > activeVersion.level : true;
    });

    const freeEchoInstance = { ...FREE_ECHO_OPTIONS[Math.floor(Math.random() * FREE_ECHO_OPTIONS.length)] };
    if (aprendizajeRapidoEcho && freeEchoInstance.effectType === EchoEffectType.GainHP && typeof freeEchoInstance.value === 'number') {
        freeEchoInstance.value = Math.max(1, freeEchoInstance.value + 1);
        freeEchoInstance.description = `Restaura <strong>${freeEchoInstance.value} HP</strong>. Un respiro en la oscuridad.`;
    }

    const finalChoices: Echo[] = [freeEchoInstance];
    const nonFreePool = choicePool.filter(e => !e.isFree);
    nonFreePool.sort(() => 0.5 - Math.random());
    for(let i = 0; i < Math.min(numChoices - 1, nonFreePool.length); i++) { finalChoices.push(nonFreePool[i]); }

    const uniqueByIdChoices = Array.from(new Map(finalChoices.map(item => [item.id, item])).values());
    const finalUniqueChoices: Echo[] = [];
    const baseIdsInFinal = new Set<string>();

    for (const choice of uniqueByIdChoices) {
        if (!baseIdsInFinal.has(choice.baseId) || choice.isFree) {
            finalUniqueChoices.push(choice);
            if (!choice.isFree) baseIdsInFinal.add(choice.baseId);
        }
    }
    if (finalUniqueChoices.length < numChoices) {
        for (const potentialChoice of nonFreePool) {
            if (finalUniqueChoices.length >= numChoices) break;
            if (!finalUniqueChoices.some(fc => fc.id === potentialChoice.id) &&
                (!baseIdsInFinal.has(potentialChoice.baseId) || potentialChoice.isFree)) {
                finalUniqueChoices.push(potentialChoice);
                 if (!potentialChoice.isFree) baseIdsInFinal.add(potentialChoice.baseId);
            }
        }
    }
    setAvailableEchoChoices(finalUniqueChoices.slice(0, numChoices));
  }, [gameState.currentLevel, gameState.isPrologueActive, activeEcos, metaProgressState.unlockedEchoBaseIds, setAvailableEchoChoices]);

  const selectEchoOption = useCallback((echoId: string): boolean => {
    const selectedFullEcho = ALL_ECHOS_MAP.get(echoId); if (!selectedFullEcho) return false;

    const costMultiplier = playerState.nextEchoCostsDoubled && !selectedFullEcho.isFree ? 2 : 1;
    const actualCost = (selectedFullEcho.cost || 0) * costMultiplier;

    if (!selectedFullEcho.isFree && playerState.gold < actualCost) {
        addGameEvent({ text: "Oro insuficiente.", type: 'info' }); return false;
    }
    playMidiSoundPlaceholder(`echo_select_${selectedFullEcho.id}`);

    let newActiveEcos = [...activeEcos];
    const existingEchoIndex = newActiveEcos.findIndex(e => e.baseId === selectedFullEcho.baseId);
    if (existingEchoIndex !== -1) newActiveEcos[existingEchoIndex] = selectedFullEcho;
    else newActiveEcos.push(selectedFullEcho);

    setActiveEcosState(newActiveEcos); // Update this hook's state

    if (!runStats.runUniqueEcosActivated.includes(selectedFullEcho.baseId)) {
        setRunStats(prev => ({...prev, runUniqueEcosActivated: [...prev.runUniqueEcosActivated, selectedFullEcho.baseId]}));
        GoalTrackingService.processEvent('UNIQUE_ECO_ACTIVATED', null, metaProgressState, setAndSaveMetaProgress);
    }

    let newPlayerHp = playerState.hp, newPlayerMaxHp = playerState.maxHp;
    let newPlayerGold = selectedFullEcho.isFree ? playerState.gold : playerState.gold - actualCost;
    let newPlayerNextEchoCostsDoubled = playerState.nextEchoCostsDoubled;
    if (playerState.nextEchoCostsDoubled && !selectedFullEcho.isFree) newPlayerNextEchoCostsDoubled = false;

    if (selectedFullEcho.effectType === EchoEffectType.GainHP) {
        const healAmount = (selectedFullEcho.value as number) * (selectedFullEcho.effectivenessMultiplier || 1);
        newPlayerHp = Math.min(playerState.maxHp, playerState.hp + healAmount);
        addGameEvent({ text: `+${healAmount} HP`, type: 'heal-player', targetId: 'player-stats-container' });
    } else if (selectedFullEcho.effectType === EchoEffectType.IncreaseMaxHP) {
        const increaseAmount = (selectedFullEcho.value as number) * (selectedFullEcho.effectivenessMultiplier || 1);
        newPlayerMaxHp = playerState.maxHp + increaseAmount; newPlayerHp = playerState.hp + increaseAmount;
        addGameEvent({ text: `Max HP +${increaseAmount}`, type: 'info', targetId: 'player-stats-container' });
    }

    let alquimiaChargeAvailable = playerState.alquimiaImprovisadaChargeAvailable;
    if (selectedFullEcho.baseId === BASE_ECHO_ALQUIMIA_IMPROVISADA) alquimiaChargeAvailable = true;

    setPlayerState(prev => ({
        ...prev, hp: newPlayerHp, maxHp: newPlayerMaxHp, gold: newPlayerGold,
        nextEchoCostsDoubled: newPlayerNextEchoCostsDoubled,
        alquimiaImprovisadaChargeAvailable: alquimiaChargeAvailable
    }));

    if(!selectedFullEcho.isFree) {
        setRunStats(prev => ({...prev, nonFreeEcosAcquiredThisRun: prev.nonFreeEcosAcquiredThisRun + 1}));
    }

    if (gameState.isPrologueActive && gameState.currentLevel === PROLOGUE_LEVEL_ID && gameState.prologueStep === 7) {
      advancePrologueStep(8);
    }

    if (selectedFullEcho.baseId === BASE_ECHO_CORAZON_ABISMO) {
        const sacrificeAmount = Math.floor(playerState.hp / 2);
        const hpAfterSacrifice = playerState.hp - sacrificeAmount;
        if (hpAfterSacrifice < 1) {
            addGameEvent({ text: "¡Sacrificio demasiado grande!", type: 'info' });
            setActiveEcosState(activeEcos.filter(e => e.baseId !== BASE_ECHO_CORAZON_ABISMO)); // Revert Corazon
            return false; // Indicate Corazon choice is NOT active
        }
        setPlayerState(prev => ({ ...prev, hp: hpAfterSacrifice }));
        addGameEvent({ text: `-${sacrificeAmount} HP (Corazón del Abismo)`, type: 'damage-player', targetId: 'player-stats-container' });

        const epicEchos = ALL_ECHOS_LIST.filter(e => e.rarity === Rarity.Epic && !newActiveEcos.some(ae => ae.baseId === e.baseId) && e.baseId !== BASE_ECHO_CORAZON_ABISMO);
        const randomEpicEcho = epicEchos.length > 0 ? epicEchos[Math.floor(Math.random() * epicEchos.length)] : null;
        const duplicableActiveEcos = newActiveEcos.filter(e => (e.rarity === Rarity.Common || e.rarity === Rarity.Rare) && e.baseId !== BASE_ECHO_CORAZON_ABISMO);

        setGameState(prev => ({ ...prev, isCorazonDelAbismoChoiceActive: true, corazonDelAbismoOptions: { randomEpicEcho, duplicableActiveEcos: duplicableActiveEcos as Echo[] }}));
        triggerConditionalEchoAnimation(selectedFullEcho.id);
        return true; // Corazon choice is now active
    } else {
        setGameState(prev => ({ ...prev, postLevelActionTaken: true }));
        return false; // Corazon choice not active
    }
  }, [
    playerState, setPlayerState, activeEcos, setActiveEcosState, runStats, setRunStats, metaProgressState, setAndSaveMetaProgress,
    gameState, setGameState, advancePrologueStep, addGameEvent, triggerConditionalEchoAnimation // Internal trigger
  ]);

  const tryActivateAlquimiaImprovisada = useCallback(() => {
    const alquimiaEcho = activeEcos.find(e => e.baseId === BASE_ECHO_ALQUIMIA_IMPROVISADA);
    if (!alquimiaEcho || !playerState.alquimiaImprovisadaChargeAvailable) return;

    const cost = (alquimiaEcho.value as number)  * (alquimiaEcho.effectivenessMultiplier || 1);
    if (playerState.gold < cost) {
        addGameEvent({ text: `Oro insuficiente para Alquimia (${cost})`, type: 'info' });
        playMidiSoundPlaceholder('alquimia_activate_fail_gold'); return;
    }
    playMidiSoundPlaceholder('alquimia_activate_success');
    setPlayerState(prev => ({ ...prev, gold: prev.gold - cost, alquimiaImprovisadaChargeAvailable: false, alquimiaImprovisadaActiveForNextBomb: true }));
    triggerConditionalEchoAnimation(alquimiaEcho.id);
    addGameEvent({ text: 'Alquimia Improvisada ¡Activada!', type: 'info', targetId: 'player-stats-container' });
  }, [playerState, setPlayerState, activeEcos, addGameEvent, triggerConditionalEchoAnimation]);

  const tryActivateOjoOmnisciente = useCallback(() => {
    const ojoEcho = activeEcos.find(e => e.baseId === BASE_ECHO_OJO_OMNISCIENTE);
    if (!ojoEcho || playerState.ojoOmniscienteUsedThisLevel) return;

    const currentBoard = getBoardForOjo();
    let targetFound = false, revealedCellR = -1, revealedCellC = -1;
    const BOARD_ROWS_FOR_LEVEL = currentBoard.length;
    const BOARD_COLS_FOR_LEVEL = currentBoard[0]?.length || 0;

    for (let r = 0; r < BOARD_ROWS_FOR_LEVEL && !targetFound; r++) {
      for (let c = 0; c < BOARD_COLS_FOR_LEVEL && !targetFound; c++) {
        if (currentBoard[r][c].revealed && currentBoard[r][c].type === CellType.Clue) {
          for (let dr = -1; dr <= 1 && !targetFound; dr++) {
            for (let dc = -1; dc <= 1 && !targetFound; dc++) {
              if (dr === 0 && dc === 0) continue;
              const nr = r + dr; const nc = c + dc;
              if (nr >= 0 && nr < BOARD_ROWS_FOR_LEVEL && nc >= 0 && nc < BOARD_COLS_FOR_LEVEL &&
                  !currentBoard[nr][nc].revealed && (currentBoard[nr][nc].type === CellType.Attack || currentBoard[nr][nc].type === CellType.Gold)) {
                targetFound = true; revealedCellR = nr; revealedCellC = nc;
              }
            }
          }
        }
      }
    }

    if (targetFound && revealedCellR !== -1) {
        playMidiSoundPlaceholder('ojo_omnisciente_activate');
        let newBoard = currentBoard.map(bRow => bRow.map(bCell => ({...bCell})));
        newBoard[revealedCellR][revealedCellC].revealed = true;

        newBoard = recalculateCluesAfterOjo(newBoard);
        const currentEffectiveEcos = getCurrentlyEffectiveEcos(activeEcos, playerState.deactivatedEcos);
        newBoard = updateBoardVisualsAfterOjo(newBoard, currentEffectiveEcos, playerState.deactivatedEcos);
        setBoardAfterOjo(newBoard);

        setPlayerState(prev => ({ ...prev, ojoOmniscienteUsedThisLevel: true }));
        triggerConditionalEchoAnimation(ojoEcho.id);
        addGameEvent({ text: '¡Ojo Omnisciente revela un objeto!', type: 'info', targetId: `cell-${revealedCellR}-${revealedCellC}` });
    } else {
        playMidiSoundPlaceholder('ojo_omnisciente_fail_no_targets');
        addGameEvent({ text: 'Ojo Omnisciente: No hay objetos válidos que revelar.', type: 'info' });
    }
  }, [
      playerState, setPlayerState, activeEcos, addGameEvent, triggerConditionalEchoAnimation,
      getBoardForOjo, setBoardAfterOjo, recalculateCluesAfterOjo, updateBoardVisualsAfterOjo
  ]);

  const resolveCorazonDelAbismoChoice = useCallback((type: 'epic' | 'duplicate', chosenEchoId?: string) => {
    if (!gameState.isCorazonDelAbismoChoiceActive || !gameState.corazonDelAbismoOptions) return;

    const { corazonDelAbismoOptions } = gameState;
    let echoToAddOrUpdate: Echo | null = null; let effectApplied = false;

    if (type === 'epic' && corazonDelAbismoOptions.randomEpicEcho) {
        echoToAddOrUpdate = corazonDelAbismoOptions.randomEpicEcho;
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
        let newActiveEcos = [...activeEcos];
        const existingIndex = newActiveEcos.findIndex(e => e.baseId === echoToAddOrUpdate!.baseId);
        if (existingIndex !== -1) newActiveEcos[existingIndex] = echoToAddOrUpdate;
        else newActiveEcos.push(echoToAddOrUpdate);
        setActiveEcosState(newActiveEcos);

        if (!runStats.runUniqueEcosActivated.includes(echoToAddOrUpdate.baseId)) {
            setRunStats(prev => ({...prev, runUniqueEcosActivated: [...prev.runUniqueEcosActivated, echoToAddOrUpdate!.baseId]}));
            GoalTrackingService.processEvent('UNIQUE_ECO_ACTIVATED', null, metaProgressState, setAndSaveMetaProgress);
        }
    }
    setGameState(prev => ({ ...prev, isCorazonDelAbismoChoiceActive: false, corazonDelAbismoOptions: null, postLevelActionTaken: true }));
  }, [
    gameState, setGameState, activeEcos, setActiveEcosState, runStats, setRunStats, metaProgressState, setAndSaveMetaProgress, addGameEvent
  ]);

  const fullEffectiveEcos = getCurrentlyEffectiveEcos(activeEcos, playerState.deactivatedEcos);

  return {
    activeEcos, setActiveEcosState,
    availableEchoChoices, setAvailableEchoChoices,
    generateEchoChoicesForPostLevelScreen,
    selectEchoOption,
    tryActivateAlquimiaImprovisada,
    tryActivateOjoOmnisciente,
    resolveCorazonDelAbismoChoice,
    triggerConditionalEchoAnimation,
    conditionalEchoTimeoutRef,
    wasCorazonDelAbismoChoiceActivePreviouslyRef,
    fullEffectiveEcos,
  };
};
