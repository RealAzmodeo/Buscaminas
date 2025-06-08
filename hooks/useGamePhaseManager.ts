// hooks/useGamePhaseManager.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import {
    GamePhase, GameStatus, PlayerState, EnemyInstance, BoardState, FuryAbility, CellPosition, AICellInfo
} from '../types';
import { AIPlayer } from '../core/ai/AIPlayer'; // Assuming path is correct
import {
    PLAYER_ACTION_RESOLVE_DELAY_MS,
    ENEMY_THINKING_MIN_DURATION_MS,
    ENEMY_THINKING_MAX_DURATION_MS,
    ENEMY_THINKING_HIGHLIGHT_INTERVAL_MS,
    ENEMY_ACTION_PENDING_REVEAL_DELAY_MS,
    ENEMY_ACTION_RESOLVE_DELAY_MS
} from '../constants'; // Assuming these are directly importable

// Helper to generate random int, if not available from a shared util
const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export interface UseGamePhaseManagerProps {
  // From main gameState
  currentStatus: GameStatus;
  isPrologueActive: boolean;
  prologueEnemyFuryAbility: FuryAbility | null;
  aiActionTargetCellFromEngine: AICellInfo | null; // Renamed to avoid confusion

  // Setters for main gameState
  setAiActionTargetCellInEngine: (cell: AICellInfo | null) => void;
  setAiThinkingCellCoordsInEngine: (cell: AICellInfo | null) => void;

  // Other states
  playerHp: number;
  enemyState: EnemyInstance | null; // Enemy can be null initially
  setEnemyState: React.Dispatch<React.SetStateAction<EnemyInstance | null>>; // Allow null for initial
  currentBoard: BoardState;

  // Callbacks to useGameEngine logic (or other hooks eventually)
  processEnemyMove: (row: number, col: number) => void;
  applyFuryEffect: (ability: FuryAbility) => void;
  // Add any other callbacks if needed (e.g., triggerBattlefieldReduction)
}

export const useGamePhaseManager = (props: UseGamePhaseManagerProps) => {
  const [currentPhase, setCurrentPhase] = useState<GamePhase>(GamePhase.PLAYER_TURN);
  const phaseTransitionTimeoutRef = useRef<number | null>(null);
  const aiThinkingIntervalRef = useRef<number | null>(null);
  const aiPlayerRef = useRef<AIPlayer>(new AIPlayer());

  const setGamePhase = useCallback((newPhase: GamePhase) => {
    console.log(`[PhaseManager] Transitioning to phase: ${newPhase}`);
    setCurrentPhase(newPhase);
  }, []);

  // The large useEffect for phase management will go here.
  // It will be adapted to use props for external state and callbacks.
  useEffect(() => {
    if (phaseTransitionTimeoutRef.current) clearTimeout(phaseTransitionTimeoutRef.current);
    if (aiThinkingIntervalRef.current) clearInterval(aiThinkingIntervalRef.current);

    // Destructure props for easier use within the effect
    const {
      currentStatus,
      isPrologueActive,
      prologueEnemyFuryAbility,
      aiActionTargetCellFromEngine,
      setAiActionTargetCellInEngine,
      setAiThinkingCellCoordsInEngine,
      playerHp,
      enemyState,
      setEnemyState,
      currentBoard,
      processEnemyMove,
      applyFuryEffect
    } = props;

    switch (currentPhase) {
      case GamePhase.PLAYER_ACTION_RESOLVING:
        phaseTransitionTimeoutRef.current = window.setTimeout(() => {
           if (currentStatus !== GameStatus.Playing) {
             console.log("[PhaseManager] Game ended during player action resolution. Halting turn progression.");
             return;
           }
           setGamePhase(GamePhase.ENEMY_THINKING);
        }, PLAYER_ACTION_RESOLVE_DELAY_MS);
        break;

      case GamePhase.ENEMY_THINKING:
        setAiThinkingCellCoordsInEngine(null); // Reset thinking highlight
        setAiActionTargetCellInEngine(null);   // Reset target cell
        if (!enemyState) break; // Should not happen if game is playing

        const thinkDuration = randomInt(ENEMY_THINKING_MIN_DURATION_MS, ENEMY_THINKING_MAX_DURATION_MS);
        let elapsedThinkTime = 0;
        let aiHasMadeDecision = false;

        aiPlayerRef.current.decideNextMove(currentBoard, enemyState, {hp: playerHp} as PlayerState /* Partial PlayerState for AI */)
            .then(decision => {
                if (currentPhase === GamePhase.ENEMY_THINKING) { // Check if phase is still the same
                    aiHasMadeDecision = true;
                    if (aiThinkingIntervalRef.current) clearInterval(aiThinkingIntervalRef.current);
                    setAiActionTargetCellInEngine(decision.cell);
                    setAiThinkingCellCoordsInEngine(null);
                    console.log("[PhaseManager] AI Decision:", decision.reasoning);
                    setGamePhase(GamePhase.ENEMY_ACTION_PENDING_REVEAL);
                }
            })
            .catch(error => {
                console.error("[PhaseManager] AI decision error:", error);
                 if (currentPhase === GamePhase.ENEMY_THINKING) {
                    const hiddenCells: CellPosition[] = [];
                    currentBoard.forEach((row, r_idx) => row.forEach((cell, c_idx) => { if (!cell.revealed) hiddenCells.push({ row: r_idx, col: c_idx }); }));
                    if (hiddenCells.length > 0) {
                        const randomCell = hiddenCells[Math.floor(Math.random() * hiddenCells.length)];
                        setAiActionTargetCellInEngine(randomCell);
                    }
                    setAiThinkingCellCoordsInEngine(null);
                    setGamePhase(GamePhase.ENEMY_ACTION_PENDING_REVEAL);
                }
            });

        aiThinkingIntervalRef.current = window.setInterval(() => {
          if (aiHasMadeDecision) {
            if (aiThinkingIntervalRef.current) clearInterval(aiThinkingIntervalRef.current);
            return;
          }
          const hiddenCells: AICellInfo[] = [];
          currentBoard.forEach((row, r_idx) => row.forEach((cell, c_idx) => { if (!cell.revealed) hiddenCells.push({ row: r_idx, col: c_idx }); }));
          if (hiddenCells.length > 0) {
            const randomThinkingCell = hiddenCells[Math.floor(Math.random() * hiddenCells.length)];
            setAiThinkingCellCoordsInEngine(randomThinkingCell);
          }
          elapsedThinkTime += ENEMY_THINKING_HIGHLIGHT_INTERVAL_MS;
          if (elapsedThinkTime >= thinkDuration && !aiHasMadeDecision) {
            if (aiThinkingIntervalRef.current) clearInterval(aiThinkingIntervalRef.current);
            console.warn("[PhaseManager] AI thinking timed out, AI promise might be stuck. Forcing fallback.");
             const hidden: CellPosition[] = [];
             currentBoard.forEach((r, r_idx) => r.forEach((c, c_idx) => { if (!c.revealed) hidden.push({ row: r_idx, col: c_idx }); }));
             if (hidden.length > 0) {
                 const randomCell = hidden[Math.floor(Math.random() * hidden.length)];
                 setAiActionTargetCellInEngine(randomCell);
             }
             setAiThinkingCellCoordsInEngine(null);
             setGamePhase(GamePhase.ENEMY_ACTION_PENDING_REVEAL);
          }
        }, ENEMY_THINKING_HIGHLIGHT_INTERVAL_MS);
        break;

      case GamePhase.ENEMY_ACTION_PENDING_REVEAL:
        phaseTransitionTimeoutRef.current = window.setTimeout(() => {
          if (aiActionTargetCellFromEngine) { // Use the one from engine's state
            processEnemyMove(aiActionTargetCellFromEngine.row, aiActionTargetCellFromEngine.col);
          }
          setGamePhase(GamePhase.ENEMY_ACTION_RESOLVING);
        }, ENEMY_ACTION_PENDING_REVEAL_DELAY_MS);
        break;

      case GamePhase.ENEMY_ACTION_RESOLVING:
        if (enemyState && currentStatus === GameStatus.Playing &&
            enemyState.currentHp > 0 &&
            playerHp > 0 && // Check playerHp directly from props
            enemyState.currentFuryCharge >= enemyState.furyActivationThreshold) {

            let abilityToApply: FuryAbility | null = null;
            if (isPrologueActive) { // Assuming currentLevel check for prologue is implicit
                abilityToApply = prologueEnemyFuryAbility; // This should be from gameState
            } else if (enemyState.furyAbilities.length > 0) {
                abilityToApply = enemyState.furyAbilities[enemyState.activeFuryCycleIndex];
                // Update enemy state via setEnemyState prop
                const newEnemy = {...enemyState, activeFuryCycleIndex: (enemyState.activeFuryCycleIndex + 1) % enemyState.furyAbilities.length, currentFuryCharge: 0};
                setEnemyState(newEnemy);
            }

            if (abilityToApply) {
                // addGameEvent is not directly available, needs to be passed or handled by processEnemyMove/applyFuryEffect
                // For now, assume applyFuryEffect handles events
                applyFuryEffect(abilityToApply);

                if (enemyState.nextEnemyFuryIsDoubled) { // Check current enemyState for this flag
                    const secondAbilityInstance = {...abilityToApply};
                    applyFuryEffect(secondAbilityInstance);
                    setEnemyState(prev => prev ? ({ ...prev, nextEnemyFuryIsDoubled: false }) : null);
                }
            }
        }

        phaseTransitionTimeoutRef.current = window.setTimeout(() => {
          setAiActionTargetCellInEngine(null);
          if (currentStatus === GameStatus.Playing && playerHp > 0 && (enemyState?.currentHp || 0) > 0) {
             setGamePhase(GamePhase.PLAYER_TURN);
          }
        }, ENEMY_ACTION_RESOLVE_DELAY_MS);
        break;

      case GamePhase.PLAYER_TURN:
        if (aiActionTargetCellFromEngine || props.aiThinkingCellCoords) { // Check props.aiThinkingCellCoords if it were a prop
            setAiThinkingCellCoordsInEngine(null);
            setAiActionTargetCellInEngine(null);
        }
        break;

      // PRE_DEFEAT_SEQUENCE and PRE_VICTORY_SEQUENCE are handled in useGameEngine based on hp checks
    }
    return () => {
        if (phaseTransitionTimeoutRef.current) clearTimeout(phaseTransitionTimeoutRef.current);
        if (aiThinkingIntervalRef.current) clearInterval(aiThinkingIntervalRef.current);
    };
  }, [currentPhase, props]); // Dependencies will be refined based on actual usage in the effect

  return { currentPhase, setGamePhase };
};
