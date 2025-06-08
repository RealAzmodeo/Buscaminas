import { useCallback } from 'react';
import {
  FuryAbility, GameStateCore, PlayerState, EnemyInstance, BoardState, Echo, RunStats, MetaProgressState,
  Rarity, FuryAbilityEffectType, CellType, GameStatus, GamePhase, GuidingTextKey
} from '../types';
import { PROLOGUE_LEVEL_ID } from '../constants'; // Only PROLOGUE_LEVEL_ID remains from main constants
import {
  INITIAL_STARTING_FURIESS, // No longer aliased
  ALL_FURY_ABILITIES_MAP
} from '../core/furies';
import { PROLOGUE_MESSAGES } from './usePrologue'; // For FTUE steps during minigame

// Stubs or forward declarations
const playMidiSoundPlaceholder = (soundId: string) => console.log(`Playing sound (placeholder): ${soundId}`);
const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
const GoalTrackingService = {
  processEvent: (event: string, payload: any, meta: MetaProgressState, saveMeta: Function) => console.log(`GoalTrackingService.processEvent(${event}) STUBBED in useFuries`)
};


export interface UseFuriesReturn {
  getFuryOptionsForOracle: (level: number, nextOracleOnlyCommon: boolean) => FuryAbility[];
  applyFuryEffect: (ability: FuryAbility) => void;
  advanceFuryMinigamePhase: (shuffledOrder?: number[] | null) => void;
  handlePlayerFuryCardSelection: (displayIndex: number) => void;
}

interface FuriesProps {
  // From useGameState
  gameState: GameStateCore; // To read currentLevel, prologueStep, isPrologueActive, furyMinigamePhase, etc.
  setGameState: React.Dispatch<React.SetStateAction<GameStateCore>>;
  // From usePlayerState
  playerState: PlayerState;
  setPlayerState: React.Dispatch<React.SetStateAction<PlayerState>>;
  // From useEnemyState
  enemyState: EnemyInstance;
  setEnemyState: React.Dispatch<React.SetStateAction<EnemyInstance>>;
  // From useBoard
  boardState: BoardState; // Read-only for some effects, updatable for others
  setBoardState: React.Dispatch<React.SetStateAction<BoardState>>;
  recalculateAllClues: (board: BoardState) => BoardState; // from useBoard
  updateBoardVisualEffects: (board: BoardState, ecos: Echo[], deactivated: PlayerState['deactivatedEcos']) => BoardState; // from useBoard
  // From useEchos
  getEffectiveEcos: () => Echo[]; // Function to get current effective echos
  // From useRunStats
  runStats: RunStats;
  setRunStats: React.Dispatch<React.SetStateAction<RunStats>>;
  // From useMetaProgress
  metaProgressState: MetaProgressState;
  setAndSaveMetaProgress: (updater: React.SetStateAction<MetaProgressState>, gameStatus?: GameStatus) => string[];
  // From useGameEvents
  addGameEvent: (payload: any, type?: string) => void;
  // From usePrologue (or passed directly from useGameEngine)
  advancePrologueStep: (specificStepOrKey?: number | GuidingTextKey) => void;
}

export const useFuries = ({
  gameState, setGameState,
  playerState, setPlayerState,
  enemyState, setEnemyState,
  boardState, setBoardState, recalculateAllClues, updateBoardVisualEffects,
  getEffectiveEcos,
  runStats, setRunStats,
  metaProgressState, setAndSaveMetaProgress,
  addGameEvent,
  advancePrologueStep,
}: FuriesProps): UseFuriesReturn => {

  const getFuryOptionsForOracle = useCallback((level: number, nextOracleOnlyCommon: boolean): FuryAbility[] => {
    let pool = [...INITIAL_STARTING_FURIESS];
    metaProgressState.awakenedFuryIds.forEach(id => {
        const fury = ALL_FURY_ABILITIES_MAP.get(id);
        if (fury && !pool.some(p => p.id === id)) pool.push(fury);
    });

    if (nextOracleOnlyCommon) {
        pool = pool.filter(f => f.rarity === Rarity.Common);
    }
    if (pool.length === 0) pool = [...INITIAL_STARTING_FURIESS]; // Fallback

    pool.sort(() => 0.5 - Math.random());
    const selectedOptionsMap = new Map<string, FuryAbility>();
    for(const fury of pool) {
        if(selectedOptionsMap.size < 3 && !selectedOptionsMap.has(fury.id)) {
            selectedOptionsMap.set(fury.id, fury);
        }
        if(selectedOptionsMap.size >= 3) break;
    }
    let finalSelectedOptions = Array.from(selectedOptionsMap.values());
    let poolIndex = 0;
    while (finalSelectedOptions.length < 3 && pool.length > 0 && poolIndex < pool.length * 2) { // Added safeguard for poolIndex
        const candidate = pool[poolIndex % pool.length];
        if(!finalSelectedOptions.some(f => f.id === candidate.id)) finalSelectedOptions.push(candidate);
        poolIndex++;
    }
    return finalSelectedOptions.slice(0, 3);
  }, [metaProgressState.awakenedFuryIds]);

  const applyFuryEffect = useCallback((ability: FuryAbility) => {
    playMidiSoundPlaceholder(`fury_activate_${ability.id}_${ability.rarity.toLowerCase()}`);
    let newPlayerState = { ...playerState };
    let newEnemyState = { ...enemyState };
    let newBoardState = boardState.map(r => r.map(c => ({ ...c }))); // Deep copy
    const effectiveEcos = getEffectiveEcos();

    console.log(`Applying Fury: ${ability.name}`);
    const voluntadEcho = effectiveEcos.find(e => e.id === 'eco_voluntad_inquebrantable_1'); // Example Echo ID
    const reductionFactor = voluntadEcho ? (1 - ((voluntadEcho.value as number) * (voluntadEcho.effectivenessMultiplier || 1))) : 1;

    if (!runStats.runUniqueFuriesExperienced.includes(ability.id)) {
        setRunStats(prev => ({...prev, runUniqueFuriesExperienced: [...prev.runUniqueFuriesExperienced, ability.id] }));
        GoalTrackingService.processEvent('UNIQUE_FURY_EXPERIENCED', null, metaProgressState, (u) => setAndSaveMetaProgress(u, gameState.status));
    }

    switch (ability.effectType) {
        case FuryAbilityEffectType.PlayerDamage:
            if (!newPlayerState.isInvulnerable) {
                let damage = Math.round((ability.value as number) * reductionFactor);
                if (newPlayerState.shield > 0) {
                    const shieldDamage = Math.min(newPlayerState.shield, damage);
                    newPlayerState.shield -= shieldDamage; damage -= shieldDamage;
                    addGameEvent({ text: `-${shieldDamage}🛡️`, type: 'armor-break', targetId: 'player-stats-container' });
                }
                if (damage > 0) {
                    newPlayerState.hp = Math.max(0, newPlayerState.hp - damage);
                    addGameEvent({ text: `-${damage}`, type: 'damage-player', targetId: 'player-stats-container' });
                    setGameState(prev => ({...prev, playerTookDamageThisLevel: true }));
                }
            } break;
        case FuryAbilityEffectType.PlayerGoldLoss: {
                const goldLoss = Math.round((ability.value as number) * reductionFactor);
                const actualGoldLoss = Math.min(newPlayerState.gold, goldLoss);
                newPlayerState.gold -= actualGoldLoss;
                if (actualGoldLoss > 0) addGameEvent({ text: `-${actualGoldLoss}💰`, type: 'info', targetId: 'player-stats-container' });
            } break;
        case FuryAbilityEffectType.PlayerGoldLossAndEnemyHeal: {
                const {goldLoss, enemyHeal} = ability.value as {goldLoss: number, enemyHeal: number};
                const actualGoldLoss = Math.min(newPlayerState.gold, Math.round(goldLoss * reductionFactor));
                newPlayerState.gold -= actualGoldLoss;
                 if (actualGoldLoss > 0) addGameEvent({ text: `-${actualGoldLoss}💰`, type: 'info', targetId: 'player-stats-container' });
                newEnemyState.currentHp = Math.min(newEnemyState.maxHp, newEnemyState.currentHp + enemyHeal);
                addGameEvent({ text: `+${enemyHeal}HP (Enemigo)`, type: 'heal-player', targetId: 'enemy-stats-container' });
            } break;
        case FuryAbilityEffectType.EnemyGainArmor:
            newEnemyState.armor += (ability.value as number);
            addGameEvent({ text: `+${ability.value}🛡️ (Enemigo)`, type: 'armor-gain', targetId: 'enemy-stats-container'});
            break;
        case FuryAbilityEffectType.EnemyHeal:
            newEnemyState.currentHp = Math.min(newEnemyState.maxHp, newEnemyState.currentHp + (ability.value as number));
            addGameEvent({ text: `+${ability.value}HP (Enemigo)`, type: 'heal-player', targetId: 'enemy-stats-container' });
            break;
        case FuryAbilityEffectType.BoardAddAttacks: {
            let attacksToAdd = ability.value as number;
            if (typeof ability.value === 'object' && ability.value && 'min' in ability.value && 'max' in ability.value) {
                attacksToAdd = randomInt(ability.value.min, ability.value.max);
            }
            let placedCount = 0; let attempts = 0;
            const maxAttempts = newBoardState.length * newBoardState[0].length;
            while(placedCount < attacksToAdd && attempts < maxAttempts) {
                const r = randomInt(0, newBoardState.length -1); const c = randomInt(0, newBoardState[0].length -1);
                if(!newBoardState[r][c].revealed && newBoardState[r][c].type !== CellType.Attack) {
                    newBoardState[r][c].type = CellType.Attack; placedCount++;
                } attempts++;
            }
            newBoardState = recalculateAllClues(newBoardState);
            newBoardState = updateBoardVisualEffects(newBoardState, effectiveEcos, playerState.deactivatedEcos);
            addGameEvent({ text: `+${placedCount} Ataques!`, type: 'info', targetId: 'board-container' });
        } break;
         case FuryAbilityEffectType.BoardHideClues: {
            const cluesToHide = ability.value as number; let hiddenCount = 0;
            const revealedClueCells: {r:number, c:number}[] = [];
            newBoardState.forEach((row, r_idx) => row.forEach((cell, c_idx) => {
                if (cell.revealed && cell.type === CellType.Clue) revealedClueCells.push({r:r_idx, c:c_idx});
            }));
            revealedClueCells.sort(() => 0.5 - Math.random());
            for(let i=0; i < Math.min(cluesToHide, revealedClueCells.length); i++){
                newBoardState[revealedClueCells[i].r][revealedClueCells[i].c].revealed = false; hiddenCount++;
            }
            if(hiddenCount > 0) addGameEvent({ text: `${hiddenCount} Pistas Ocultas!`, type: 'info', targetId: 'board-container' });
        } break;
        case FuryAbilityEffectType.PlayerChanceToFailAttack: addGameEvent({ text: `¡Torpeza Fugaz!`, type: 'info', targetId: 'player-stats-container'}); break;
        case FuryAbilityEffectType.EnemyFuryBarPartialFill:
            addGameEvent({ text: `¡Rescoldo Persistente!`, type: 'info', targetId: 'enemy-stats-container'});
            newEnemyState.currentFuryCharge = Math.min(newEnemyState.furyActivationThreshold, newEnemyState.currentFuryCharge + Math.floor(newEnemyState.furyActivationThreshold * (ability.value as number)));
            break;
        case FuryAbilityEffectType.PlayerTemporaryEcoDeactivation: {
                const { chance, duration } = ability.value as { chance: number, duration: number };
                if (Math.random() < chance && effectiveEcos.length > 0) { // Use effectiveEcos to pick from
                    const newestEcho = effectiveEcos[effectiveEcos.length - 1]; // Example: newest, could be random
                    if (newestEcho && !(newPlayerState.deactivatedEcos || []).some(de => de.echoId === newestEcho.id)) {
                        newPlayerState.deactivatedEcos = [...(newPlayerState.deactivatedEcos || []), { echoId: newestEcho.id, baseId: newestEcho.baseId, icon: newestEcho.icon, name: newestEcho.name, clicksRemaining: duration }];
                        addGameEvent({ text: `Eco "${newestEcho.name}" distorsionado! (${duration} clics)`, type: 'info', targetId: 'player-stats-container'});
                    }
                }
             } break;
        case FuryAbilityEffectType.BoardVisualDisruption: addGameEvent({ text: `¡Mirada Inquietante!`, type: 'info', targetId: 'player-stats-container'}); break;
        case FuryAbilityEffectType.BoardAddMixedItems: {
             const { area, items } = ability.value as { area: string, items: ('attack' | 'gold' | 'trap')[] };
             addGameEvent({ text: `¡Objetos Mezclados! (${area})`, type: 'info', targetId: 'board-container'});
        } break;
        default: console.warn(`Unhandled Fury effect type: ${ability.effectType}`);
    }
    setPlayerState(newPlayerState);
    setEnemyState(newEnemyState); // No need for functional update if newEnemyState is derived from enemyState prop
    setBoardState(newBoardState); // Same as above
  }, [
    playerState, setPlayerState, enemyState, setEnemyState, boardState, setBoardState, getEffectiveEcos, addGameEvent, setGameState,
    runStats.runUniqueFuriesExperienced, setRunStats, metaProgressState, setAndSaveMetaProgress,
    recalculateAllClues, updateBoardVisualEffects, gameState.status
  ]);

  const advanceFuryMinigamePhase = useCallback((shuffledOrder?: number[] | null) => {
    setGameState(prev => {
        let nextPhase: GameStateCore['furyMinigamePhase'] = prev.furyMinigamePhase;
        let newPlayerSelectedFuryCardDisplayIndex = prev.playerSelectedFuryCardDisplayIndex;
        let newShuffledOrder = prev.shuffledFuryCardOrder;
        let newOracleSelectedFuryAbility = prev.oracleSelectedFuryAbility;
        let isMinigameNowActive = prev.isFuryMinigameActive;
        let minigameCompletedThisLevel = prev.furyMinigameCompletedForThisLevel;

        // FTUE handling for prologue oracle
        const isPrologueOracle = prev.isPrologueActive && prev.currentLevel === PROLOGUE_LEVEL_ID;

        switch (prev.furyMinigamePhase) {
            case 'starting':
                nextPhase = 'reveal_cards';
                if (isPrologueOracle && prev.prologueStep === 9) advancePrologueStep(10);
                break;
            case 'reveal_cards': nextPhase = 'cards_revealed'; break;
            case 'cards_revealed':
                nextPhase = 'flipping_to_back';
                if (isPrologueOracle && prev.prologueStep === 10) advancePrologueStep(11);
                break;
            case 'flipping_to_back': nextPhase = 'shuffling'; break;
            case 'shuffling':
                nextPhase = 'ready_to_pick';
                if (shuffledOrder) newShuffledOrder = shuffledOrder;
                if (isPrologueOracle && prev.prologueStep === 11) advancePrologueStep(12);
                break;
            case 'card_picked': nextPhase = 'revealing_choice'; break;
            case 'revealing_choice':
                nextPhase = 'inactive';
                isMinigameNowActive = false;
                minigameCompletedThisLevel = true;
                if (prev.playerSelectedFuryCardDisplayIndex !== null && prev.furyCardOptions.length > 0) {
                    const actualOriginalIndex = prev.shuffledFuryCardOrder[prev.playerSelectedFuryCardDisplayIndex];
                    const chosenAbility = prev.furyCardOptions[actualOriginalIndex];
                    if (chosenAbility) newOracleSelectedFuryAbility = chosenAbility;
                }
                if (isPrologueOracle && prev.prologueStep === 12) advancePrologueStep(13);
                break;
            case 'inactive': nextPhase = 'inactive'; break; // Should not happen if logic is correct
        }
        return {
            ...prev,
            furyMinigamePhase: nextPhase,
            oracleSelectedFuryAbility: newOracleSelectedFuryAbility,
            playerSelectedFuryCardDisplayIndex: newPlayerSelectedFuryCardDisplayIndex,
            shuffledFuryCardOrder: newShuffledOrder,
            furyMinigameCompletedForThisLevel: minigameCompletedThisLevel,
            isFuryMinigameActive: isMinigameNowActive,
            // prologueStep and guidingTextKey are handled by advancePrologueStep
        };
    });
  }, [setGameState, advancePrologueStep]); // gameState is implicitly part of setGameState

  const handlePlayerFuryCardSelection = useCallback((displayIndex: number) => {
    if (gameState.furyMinigamePhase !== 'ready_to_pick') return;
    playMidiSoundPlaceholder('fury_card_select');
    setGameState(prev => ({ ...prev, playerSelectedFuryCardDisplayIndex: displayIndex, furyMinigamePhase: 'card_picked' }));
  }, [gameState.furyMinigamePhase, setGameState]);

  return {
    getFuryOptionsForOracle,
    applyFuryEffect,
    advanceFuryMinigamePhase,
    handlePlayerFuryCardSelection,
  };
};
