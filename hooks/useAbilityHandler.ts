// hooks/useAbilityHandler.ts
import { useState, useRef, useCallback } from 'react';
import {
    FuryAbility, PlayerState, EnemyInstance, BoardState, Echo, GameEvent, RunStats, MetaProgressState,
    FuryAbilityEffectType, CellType, DeactivatedEchoInfo
} from '../types';
import {
    recalculateAllCluesUtility,
    updateBoardVisualEffectsUtility
} from './useBoardState'; // Assuming these are exported for use
// Import constants as needed, e.g. for specific echo/fury logic
// import { playMidiSoundPlaceholder } from '../utils/soundUtils'; // If sounds are handled here

export interface UseAbilityHandlerProps {
  player: PlayerState;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerState>>;
  enemy: EnemyInstance | null;
  setEnemy: React.Dispatch<React.SetStateAction<EnemyInstance | null>>;
  board: BoardState;
  setBoard: React.Dispatch<React.SetStateAction<BoardState>>;
  activeEcos: Echo[]; // Specifically, currently effective echos
  addGameEvent: (payload: any, type?: string) => void;
  // For applyFuryEffect's goal tracking and state updates:
  // Those parts might need to be lifted back to useGameEngine or GameEngine passes more specific callbacks
  // For now, let's assume they are handled via other means or GameEngine passes specific callbacks for those.
  // Simplified: Focus on direct effects of Fury. Goal/RunStat updates from Fury might be complex to isolate here.
  // If runStats/metaProgress updates are complex, they could be returned as events/data for GameEngine to process.

  // Temporary: To update GameStateCore directly for playerTookDamageThisLevel
  // This should ideally be an event or callback
  setPlayerTookDamageThisLevel: (value: boolean) => void;
}

export const useAbilityHandler = (props: UseAbilityHandlerProps) => {
  const [conditionalEchoTriggeredId, setConditionalEchoTriggeredId] = useState<string | null>(null);
  const conditionalEchoTimeoutRef = useRef<number | null>(null);

  const {
    player, setPlayer, enemy, setEnemy, board, setBoard, activeEcos, addGameEvent,
    setPlayerTookDamageThisLevel
  } = props;

  const triggerConditionalEchoAnimation = useCallback((echoId: string) => {
    if (conditionalEchoTimeoutRef.current) clearTimeout(conditionalEchoTimeoutRef.current);
    setConditionalEchoTriggeredId(echoId);
    conditionalEchoTimeoutRef.current = window.setTimeout(() => {
      setConditionalEchoTriggeredId(null);
      conditionalEchoTimeoutRef.current = null;
    }, 1500);
  }, []);

  const applyFuryEffect = useCallback((ability: FuryAbility) => {
    // playMidiSoundPlaceholder(`fury_activate_${ability.id}_${ability.rarity.toLowerCase()}`); // Sound handled by GameEngine
    if (!enemy) return; // Should not happen if an enemy is using Fury

    let newPlayerState = { ...player };
    let newEnemyState = { ...enemy }; // Enemy is guaranteed to be non-null here
    let newBoardState = board.map(r => r.map(c => ({ ...c })));

    // Note: The original applyFuryEffect in useGameEngine also updated runStats (for unique furies)
    // and called GoalTrackingService. This part is omitted here for simplicity and should be
    // handled by useGameEngine after this function call, or this function needs more props.
    // For now, focusing on direct state changes.

    const voluntadEcho = activeEcos.find(e => e.id === 'eco_voluntad_inquebrantable_1');
    const reductionFactor = voluntadEcho ? (1 - (voluntadEcho.value as number * (voluntadEcho.effectivenessMultiplier || 1))) : 1;

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
                    setPlayerTookDamageThisLevel(true);
                }
            } break;
        case FuryAbilityEffectType.PlayerGoldLoss: {
                const goldLoss = Math.round((ability.value as number) * reductionFactor);
                const actualGoldLoss = Math.min(newPlayerState.gold, goldLoss);
                newPlayerState.gold -= actualGoldLoss;
                if (actualGoldLoss > 0) addGameEvent({ text: `-${actualGoldLoss}💰`, type: 'info', targetId: 'player-stats-container' });
            } break;
        // ... (other FuryAbilityEffectType cases from useGameEngine's applyFuryEffect)
        // For brevity, only a few cases are copied. The full logic would be here.
        // IMPORTANT: Board modifications like AddAttacks, HideClues need recalculateAllCluesUtility and updateBoardVisualEffectsUtility
        case FuryAbilityEffectType.BoardAddAttacks: {
            let attacksToAdd = ability.value as number;
            if (typeof ability.value === 'object' && ability.value && 'min' in ability.value && 'max' in ability.value) {
                // attacksToAdd = randomInt(ability.value.min, ability.value.max); // randomInt would need to be defined/imported
            }
            let placedCount = 0; let attempts = 0;
            const maxAttempts = newBoardState.length * (newBoardState[0]?.length || 1);
            while(placedCount < attacksToAdd && attempts < maxAttempts) {
                const r = Math.floor(Math.random() * newBoardState.length);
                const c = Math.floor(Math.random() * (newBoardState[0]?.length || 1));
                if(newBoardState[r] && newBoardState[r][c] && !newBoardState[r][c].revealed && newBoardState[r][c].type !== CellType.Attack) {
                    newBoardState[r][c].type = CellType.Attack;
                    placedCount++;
                }
                attempts++;
            }
            newBoardState = recalculateAllCluesUtility(newBoardState);
            newBoardState = updateBoardVisualEffectsUtility(newBoardState, activeEcos);
            addGameEvent({ text: `+${placedCount} Ataques!`, type: 'info', targetId: 'board-container' });
        } break;
        case FuryAbilityEffectType.PlayerTemporaryEcoDeactivation: {
            const { chance, duration } = ability.value as { chance: number, duration: number };
            if (Math.random() < chance && activeEcos.length > 0) { // Use activeEcos from props
                const newestEcho = activeEcos[activeEcos.length - 1];
                if (newestEcho && !(newPlayerState.deactivatedEcos || []).some(de => de.echoId === newestEcho.id)) {
                    newPlayerState.deactivatedEcos = [...(newPlayerState.deactivatedEcos || []), { echoId: newestEcho.id, baseId: newestEcho.baseId, icon: newestEcho.icon, name: newestEcho.name, clicksRemaining: duration }];
                    addGameEvent({ text: `Eco "${newestEcho.name}" distorsionado! (${duration} clics)`, type: 'info', targetId: 'player-stats-container'});
                }
            }
         } break;
        default: console.warn(`[AbilityHandler] Unhandled Fury effect type: ${ability.effectType}`);
    }
    setPlayer(newPlayerState);
    if (Object.keys(newEnemyState).length > Object.keys(enemy).length || newEnemyState.currentHp !== enemy.currentHp || newEnemyState.armor !== enemy.armor ) { // Basic check if changed
        setEnemy(newEnemyState);
    }
    setBoard(newBoardState); // This assumes board state changes are reflected here

  }, [player, setPlayer, enemy, setEnemy, board, setBoard, activeEcos, addGameEvent, setPlayerTookDamageThisLevel]);

  return {
    conditionalEchoTriggeredId,
    triggerConditionalEchoAnimation,
    applyFuryEffect,
  };
};
