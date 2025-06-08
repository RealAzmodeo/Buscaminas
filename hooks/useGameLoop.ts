import { useEffect, useRef, useCallback } from 'react';
import { GamePhase, GameStatus, GameStateCore, PlayerState, EnemyInstance, FuryAbility } from '../types'; // Added FuryAbility
import { PLAYER_ACTION_RESOLVE_DELAY_MS, ENEMY_ACTION_RESOLVE_DELAY_MS } from '../constants'; // Game loop specific delays

export interface UseGameLoopReturn {
  // This hook primarily manages effects and doesn't return actions directly for other hooks to call,
  // but it orchestrates calls to other hooks' functions.
  // It could return refs if needed for debugging or external control, but typically not.
  phaseTransitionTimeoutRef: React.MutableRefObject<number | null>;
}

interface GameLoopProps {
  // From useGameState
  gameState: GameStateCore;
  setGameState: React.Dispatch<React.SetStateAction<GameStateCore>>;
  setGamePhase: (phase: GamePhase) => void;
  setGameStatus: (status: GameStatus, reason?: 'standard' | 'attrition') => void; // For post-level map transition
  // From usePlayerState
  playerState: PlayerState; // Read-only for checks
  // From useEnemyState
  enemyState: EnemyInstance; // Read-only for checks
  setEnemyState: React.Dispatch<React.SetStateAction<EnemyInstance>>; // For fury cycle index and double fury flag
  // From useEnemyAI
  executeEnemyTurnLogic: (onTurnEnd: () => void) => void;
  // From useFuries
  applyFuryEffect: (ability: FuryAbility) => void;
  // From useEchos (or directly from useGameEngine)
  wasCorazonDelAbismoChoiceActivePreviouslyRef: React.MutableRefObject<boolean>; // To check if Corazon choice was just made
  // From useGameEngine (high-level orchestrators, to be broken down later if possible)
  proceedToNextLevel: () => void;
}

export const useGameLoop = ({
  gameState, setGameState, setGamePhase, setGameStatus,
  playerState,
  enemyState, setEnemyState,
  executeEnemyTurnLogic,
  applyFuryEffect,
  wasCorazonDelAbismoChoiceActivePreviouslyRef,
  proceedToNextLevel,
}: GameLoopProps): UseGameLoopReturn => {
  const phaseTransitionTimeoutRef = useRef<number | null>(null);

  // Main game phase transition logic
  useEffect(() => {
    if (phaseTransitionTimeoutRef.current) clearTimeout(phaseTransitionTimeoutRef.current);

    switch (gameState.currentPhase) {
      case GamePhase.PLAYER_ACTION_RESOLVING:
        phaseTransitionTimeoutRef.current = window.setTimeout(() => {
           if (gameState.status !== GameStatus.Playing) {
             console.log("GameLoop: Game ended during player action resolution. Halting turn progression.");
             return;
           }
           // Check player HP again before switching to enemy, as some effects in PLAYER_ACTION_RESOLVING might alter it.
           if (playerState.hp <= 0 && gameState.status === GameStatus.Playing) {
                // This should ideally be caught by usePlayerState's HP watcher, but as a safeguard:
                console.log("GameLoop: Player HP zero detected after action resolution. Halting.");
                // setGameStatus(GameStatus.GameOverDefeat); // This would be redundant if usePlayerState handles it.
                return;
           }
           if (enemyState.currentHp <=0 && gameState.status === GameStatus.Playing) {
                console.log("GameLoop: Enemy HP zero detected after player action. Should be PostLevel. Halting enemy turn.");
                // This implies enemy was defeated, game status should already be PostLevel by handlePlayerCellSelection
                return;
           }
           setGamePhase(GamePhase.ENEMY_THINKING);
        }, PLAYER_ACTION_RESOLVE_DELAY_MS);
        break;

      case GamePhase.ENEMY_THINKING:
        if (gameState.status !== GameStatus.Playing) return; // Don't start enemy turn if game not playing

        executeEnemyTurnLogic(() => {
          // This callback is executed after the enemy's primary move (reveal) is processed by useEnemyAI.
          // Now, handle ENEMY_ACTION_RESOLVING logic (like Fury) before switching to PLAYER_TURN.

          let playerHpAfterEnemyMove = playerState.hp; // Snapshot after enemy move
          let enemyHpAfterEnemyMove = enemyState.currentHp; // Snapshot

          // Check for game over conditions again after enemy move.
          if (playerHpAfterEnemyMove <= 0 && gameState.status === GameStatus.Playing) {
            console.log("GameLoop: Player HP zero after enemy move processing by AI. Halting.");
            // setGameStatus(GameStatus.GameOverDefeat); // Again, usePlayerState should handle this.
            return;
          }
          if (enemyHpAfterEnemyMove <= 0 && gameState.status === GameStatus.Playing) {
            console.log("GameLoop: Enemy HP zero after enemy move processing by AI (e.g. trap). Status should be PostLevel. Halting further enemy action.");
            // This should have been set by processEnemyMove if enemy defeated itself.
            return;
          }

          // Fury Activation Logic (from old ENEMY_ACTION_RESOLVING)
          if (gameState.status === GameStatus.Playing && enemyHpAfterEnemyMove > 0 && playerHpAfterEnemyMove > 0 &&
              enemyState.currentFuryCharge >= enemyState.furyActivationThreshold) {

            let abilityToApply: FuryAbility | null = null;
            if (gameState.isPrologueActive && gameState.currentLevel === -1 /* PROLOGUE_LEVEL_ID */) { // TODO: Fix PROLOGUE_LEVEL_ID usage
                abilityToApply = gameState.prologueEnemyFuryAbility; // This should be set correctly during prologue setup
            } else if (enemyState.furyAbilities.length > 0) {
                abilityToApply = enemyState.furyAbilities[enemyState.activeFuryCycleIndex];
                setEnemyState(prev => ({ ...prev, activeFuryCycleIndex: (prev.activeFuryCycleIndex + 1) % prev.furyAbilities.length }));
            }

            if (abilityToApply) {
                addGameEventToGameState({ text: `¡FURIA! ${abilityToApply.name}`, type: 'info', targetId: 'enemy-stats-container' });
                applyFuryEffect(abilityToApply); // This might change player/enemy HP further
                setEnemyState(prev => ({ ...prev, currentFuryCharge: 0 }));

                if (enemyState.nextEnemyFuryIsDoubled && abilityToApply) { // Check if this flag exists on EnemyInstance
                    const secondAbilityInstance = {...abilityToApply}; // Create a new instance for the second application
                    applyFuryEffect(secondAbilityInstance);
                    setEnemyState(prev => ({ ...prev, nextEnemyFuryIsDoubled: false }));
                    addGameEventToGameState({ text: `¡FURIA DOBLE!`, type: 'info', targetId: 'enemy-stats-container' });
                }
            }
          }

          // Final delay before PLAYER_TURN
          phaseTransitionTimeoutRef.current = window.setTimeout(() => {
            setGameState(prev => ({ ...prev, aiActionTargetCell: null, aiThinkingCellCoords: null })); // Clear AI thought bubbles
            // Check game status again before handing control to player
            if (gameState.status === GameStatus.Playing && playerState.hp > 0 && enemyState.currentHp > 0) {
               setGamePhase(GamePhase.PLAYER_TURN);
            } else {
                console.log("GameLoop: Game ended or entity HP zero before PLAYER_TURN. Current status:", gameState.status, "Player HP:", playerState.hp, "Enemy HP:", enemyState.currentHp);
            }
          }, ENEMY_ACTION_RESOLVE_DELAY_MS);
        });
        break;

      case GamePhase.PLAYER_TURN:
        // Clear any lingering AI thought indicators when it becomes player's turn
        if (gameState.aiThinkingCellCoords || gameState.aiActionTargetCell) {
            setGameState(prev => ({ ...prev, aiThinkingCellCoords: null, aiActionTargetCell: null }));
        }
        break;
    }
    return () => {
      if (phaseTransitionTimeoutRef.current) clearTimeout(phaseTransitionTimeoutRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.currentPhase, gameState.status]); // Key dependencies that drive the loop


  // Effect for Post-Level progression (Echo choice, Fury Oracle, Map)
  useEffect(() => {
    const playerActionJustCompleted = gameState.postLevelActionTaken &&
                                      !gameState.isFuryMinigameActive &&
                                      !gameState.furyMinigameCompletedForThisLevel;
    const furyGameJustCompleted = !gameState.isFuryMinigameActive &&
                                  gameState.furyMinigameCompletedForThisLevel;

    // Check if Corazon del Abismo choice was just made and is no longer active
    const corazonChoiceJustResolved = wasCorazonDelAbismoChoiceActivePreviouslyRef.current && !gameState.isCorazonDelAbismoChoiceActive;

    if (gameState.status === GameStatus.PostLevel &&
        (playerActionJustCompleted || furyGameJustCompleted || corazonChoiceJustResolved) &&
        !gameState.isBattlefieldReductionTransitioning) {

      if (gameState.mapDecisionPending) {
        setGameStatus(GameStatus.AbyssMapView);
      } else {
        // Ensure all conditions are truly met before proceeding (e.g. Corazon choice is fully done)
        if (!gameState.isCorazonDelAbismoChoiceActive) {
            proceedToNextLevel();
        }
      }
    }
  }, [
    gameState.status, gameState.postLevelActionTaken, gameState.isFuryMinigameActive,
    gameState.furyMinigameCompletedForThisLevel, gameState.isCorazonDelAbismoChoiceActive,
    gameState.isBattlefieldReductionTransitioning, gameState.mapDecisionPending,
    proceedToNextLevel, setGameStatus, wasCorazonDelAbismoChoiceActivePreviouslyRef
  ]);

  // Helper to add game event (since addGameEvent is not directly passed to this hook)
  // This is a bit of a workaround. Ideally, game events are handled more centrally or via a context/service.
  const addGameEventToGameState = useCallback((payload: any, type: string = 'info') => {
    // This assumes eventIdCounter is handled elsewhere (e.g. useGameEvents and then useGameEngine updates gameState)
    // For now, this will just add to the queue if GameStateCore has eventIdCounter
    // This is a temporary solution. The proper way is to use the addGameEvent from useGameEvents.
    // This hook should probably receive `addGameEvent` as a prop.
    console.warn("GameLoop attempting to add game event directly to gameState. This should use useGameEvents.addGameEvent via props.");
    // setGameState(prev => ({
    //   ...prev,
    //   eventQueue: [...prev.eventQueue, { id: `event-loop-${Date.now()}`, type, payload }]
    // }));
  }, [/*setGameState*/]);


  return { phaseTransitionTimeoutRef };
};
