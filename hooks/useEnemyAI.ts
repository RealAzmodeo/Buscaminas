import { useCallback, useRef } from 'react';
import {
  GameStateCore, PlayerState, EnemyInstance, BoardState, Echo, RunStats, MetaProgressState,
  GamePhase, GameStatus, CellType, CellPosition, AICellInfo, GoalCellRevealedPayload, GoalEnemyDefeatedPayload,
  GuidingTextKey
} from '../types';
import {
  ATTACK_DAMAGE_ENEMY_VS_PLAYER, ENEMY_FURY_GAIN_ON_GOLD_REVEAL,
  SOUL_FRAGMENTS_PER_ENEMY_DEFEAT,
  ENEMY_THINKING_MIN_DURATION_MS, ENEMY_THINKING_MAX_DURATION_MS,
  ENEMY_THINKING_HIGHLIGHT_INTERVAL_MS, ENEMY_ACTION_PENDING_REVEAL_DELAY_MS
} from '../constants';
import { AIPlayer } from '../core/ai/AIPlayer'; // Assuming AIPlayer is correctly pathed

// Stubs / Forward declarations
const playMidiSoundPlaceholder = (soundId: string) => console.log(`Playing sound (placeholder): ${soundId}`);
const GoalTrackingService = {
  processEvent: (event: string, payload: any, meta: MetaProgressState, saveMeta: Function) => console.log(`GoalTrackingService.processEvent(${event}) STUBBED in useEnemyAI`)
};
const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;


export interface UseEnemyAIReturn {
  processEnemyMove: (row: number, col: number) => { playerHpZero: boolean; enemyHpZero: boolean }; // Returns outcome
  executeEnemyTurnLogic: (onTurnEnd: () => void) => void; // Callback for when enemy move is resolved (not including Fury)
  aiPlayerRef: React.MutableRefObject<AIPlayer>;
  aiThinkingIntervalRef: React.MutableRefObject<number | null>;
  phaseTransitionTimeoutRef: React.MutableRefObject<number | null>; // For ENEMY_ACTION_PENDING_REVEAL delay
}

interface EnemyAIProps {
  // From useGameState
  gameState: GameStateCore;
  setGameState: React.Dispatch<React.SetStateAction<GameStateCore>>;
  setGamePhase: (phase: GamePhase) => void;
  setGameStatus: (status: GameStatus, reason?: 'standard' | 'attrition') => void;
  // From usePlayerState
  playerState: PlayerState;
  setPlayerState: React.Dispatch<React.SetStateAction<PlayerState>>;
  // From useEnemyState
  enemyState: EnemyInstance;
  setEnemyState: React.Dispatch<React.SetStateAction<EnemyInstance>>;
  // From useBoard
  boardState: BoardState;
  setBoardState: React.Dispatch<React.SetStateAction<BoardState>>;
  recalculateAllClues: (board: BoardState) => BoardState;
  updateBoardVisualEffects: (board: BoardState, ecos: Echo[], deactivated: PlayerState['deactivatedEcos']) => BoardState;
  // From useEchos
  getEffectiveEcos: () => Echo[];
  generateEchoChoicesForPostLevelScreen: () => void; // Called on enemy defeat
  // From useRunStats
  runStats: RunStats;
  setRunStats: React.Dispatch<React.SetStateAction<RunStats>>;
  // From useMetaProgress
  metaProgressState: MetaProgressState;
  setAndSaveMetaProgress: (updater: React.SetStateAction<MetaProgressState>, gameStatus?: GameStatus) => string[];
  // From useGameEvents
  addGameEvent: (payload: any, type?: string) => void;
  // From usePrologue
  ftueEventTrackerRef: React.MutableRefObject<{[key: string]: boolean | undefined}>;
  advancePrologueStep: (stepOrKey?: number | GuidingTextKey) => void;
}

export const useEnemyAI = ({
  gameState, setGameState, setGamePhase, setGameStatus,
  playerState, setPlayerState,
  enemyState, setEnemyState,
  boardState, setBoardState, recalculateAllClues, updateBoardVisualEffects,
  getEffectiveEcos, generateEchoChoicesForPostLevelScreen,
  runStats, setRunStats,
  metaProgressState, setAndSaveMetaProgress,
  addGameEvent,
  ftueEventTrackerRef, advancePrologueStep,
}: EnemyAIProps): UseEnemyAIReturn => {
  const aiPlayerRef = useRef<AIPlayer>(new AIPlayer());
  const aiThinkingIntervalRef = useRef<number | null>(null);
  const phaseTransitionTimeoutRef = useRef<number | null>(null); // For ENEMY_ACTION_PENDING_REVEAL

  const processEnemyMove = useCallback((row: number, col: number): { playerHpZero: boolean; enemyHpZero: boolean } => {
    let currentBoard = boardState.map(r => r.map(c => ({ ...c })));
    const cell = currentBoard[row][col];

    if (cell.revealed) return { playerHpZero: playerState.hp <= 0, enemyHpZero: enemyState.currentHp <= 0 }; // Should not happen if AI is correct

    playMidiSoundPlaceholder('cell_click_enemy');
    let newPlayerState = { ...playerState };
    let newEnemyState = { ...enemyState };
    let newRunStats = {...runStats};

    currentBoard[row][col].revealed = true;
    GoalTrackingService.processEvent('CELL_REVEALED', { cellType: cell.type, revealedByPlayer: false } as GoalCellRevealedPayload, metaProgressState, (u)=>setAndSaveMetaProgress(u,gameState.status));

    switch (cell.type) {
      case CellType.Attack:
        playMidiSoundPlaceholder('reveal_attack_enemy_hits_player');
        newRunStats.attacksTriggeredByEnemy++;
        if (!newPlayerState.isInvulnerable) {
          let damage = ATTACK_DAMAGE_ENEMY_VS_PLAYER;
          if (newPlayerState.shield > 0) {
            const shieldDamage = Math.min(newPlayerState.shield, damage);
            newPlayerState.shield -= shieldDamage; damage -= shieldDamage;
            addGameEvent({ text: `-${shieldDamage}🛡️`, type: 'armor-break', targetId: 'player-stats-container' });
          }
          if (damage > 0) {
            newPlayerState.hp = Math.max(0, newPlayerState.hp - damage);
            addGameEvent({ text: `-${damage}`, type: 'damage-player', targetId: 'player-stats-container' });
            setGameState(prev => ({ ...prev, playerTookDamageThisLevel: true }));
          }
        } else { addGameEvent({ text: '¡Invulnerable!', type: 'info', targetId: 'player-stats-container' }); }
        if (gameState.isPrologueActive && gameState.prologueStep === 5 && !ftueEventTrackerRef.current.firstAttackRevealedByEnemy) { ftueEventTrackerRef.current.firstAttackRevealedByEnemy = true; advancePrologueStep(6); }
        break;
      case CellType.Gold:
        playMidiSoundPlaceholder('reveal_gold_enemy_fury');
        newRunStats.goldCellsRevealedThisRun++; // This was missing in original useGameEngine.processEnemyMove
        newEnemyState.currentFuryCharge = Math.min(newEnemyState.furyActivationThreshold, newEnemyState.currentFuryCharge + ENEMY_FURY_GAIN_ON_GOLD_REVEAL);
        addGameEvent({ text: `+${ENEMY_FURY_GAIN_ON_GOLD_REVEAL} Furia!`, type: 'info', targetId: 'enemy-stats-container' });
        break;
      case CellType.Clue: /* No specific effect */ break;
      case CellType.Trap:
        playMidiSoundPlaceholder('reveal_trap_enemy_effect');
        newRunStats.trapsTriggeredThisRun++;
        let trapDamageToEnemy = 1; // Trap damage for enemy
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
    }

    setPlayerState(newPlayerState);
    setEnemyState(newEnemyState);
    setRunStats(newRunStats);

    const effectiveEcos = getEffectiveEcos();
    const newBoardWithVisuals = updateBoardVisualEffects(recalculateAllClues(currentBoard), effectiveEcos, newPlayerState.deactivatedEcos);
    setBoardState(newBoardWithVisuals);

    let playerDefeated = newPlayerState.hp <= 0;
    let enemyDefeated = newEnemyState.currentHp <= 0;

    if (playerDefeated) {
      // Game over is handled by useEffect in usePlayerState watching player.hp
      // but we need to ensure the game doesn't try to proceed further.
      // setGameStatus(GameStatus.GameOverDefeat); // This might be called by usePlayerState
    } else if (enemyDefeated) {
      playMidiSoundPlaceholder('enemy_defeat');
      GoalTrackingService.processEvent('ENEMY_DEFEATED', { enemyArchetypeId: newEnemyState.archetypeId } as GoalEnemyDefeatedPayload, metaProgressState, (u)=>setAndSaveMetaProgress(u, gameState.status));
      setRunStats(prev => ({ ...prev, enemiesDefeatedThisRun: prev.enemiesDefeatedThisRun + 1, soulFragmentsEarnedThisRun: prev.soulFragmentsEarnedThisRun + SOUL_FRAGMENTS_PER_ENEMY_DEFEAT }));
      generateEchoChoicesForPostLevelScreen(); // Calls setAvailableEchoChoices in useEchos

      let mapDecisionNowPending = false;
      if (!gameState.isPrologueActive && gameState.currentStretchCompletedLevels >= gameState.levelsInCurrentStretch -1 ) mapDecisionNowPending = true;

      setGameState(prev => ({
        ...prev,
        status: GameStatus.PostLevel, // This will be picked up by game loop or other effects
        mapDecisionPending: mapDecisionNowPending,
        furyMinigameCompletedForThisLevel: false,
        postLevelActionTaken: false,
      }));
    }
    return { playerHpZero: playerDefeated, enemyHpZero: enemyDefeated };
  }, [
    boardState, playerState, enemyState, runStats, gameState, metaProgressState, // states
    setBoardState, setPlayerState, setEnemyState, setRunStats, setGameState, setAndSaveMetaProgress, // setters
    recalculateAllClues, updateBoardVisualEffects, getEffectiveEcos, addGameEvent,
    generateEchoChoicesForPostLevelScreen, advancePrologueStep, ftueEventTrackerRef, // functions from other hooks
    // setGameStatus is not called directly here now for player defeat, handled by usePlayerState effect.
  ]);


  const executeEnemyTurnLogic = useCallback((onTurnEnd: () => void) => {
    if (phaseTransitionTimeoutRef.current) clearTimeout(phaseTransitionTimeoutRef.current);
    if (aiThinkingIntervalRef.current) clearInterval(aiThinkingIntervalRef.current);

    // ENEMY_THINKING
    setGameState(prev => ({ ...prev, aiThinkingCellCoords: null, aiActionTargetCell: null }));
    const thinkDuration = randomInt(ENEMY_THINKING_MIN_DURATION_MS, ENEMY_THINKING_MAX_DURATION_MS);
    let elapsedThinkTime = 0;
    let aiHasMadeDecision = false;

    aiPlayerRef.current.decideNextMove(boardState, enemyState, playerState)
        .then(decision => {
            if (gameState.currentPhase === GamePhase.ENEMY_THINKING) { // Check if still in thinking phase
                aiHasMadeDecision = true;
                if (aiThinkingIntervalRef.current) clearInterval(aiThinkingIntervalRef.current);
                setGameState(prev => ({ ...prev, aiActionTargetCell: decision.cell, aiThinkingCellCoords: null }));
                console.log("AI Decision:", decision.reasoning);

                // Transition to ENEMY_ACTION_PENDING_REVEAL
                phaseTransitionTimeoutRef.current = window.setTimeout(() => {
                  if (gameState.aiActionTargetCell) { // gameState here might be stale, consider passing decision.cell
                    const outcome = processEnemyMove(decision.cell.row, decision.cell.col);
                    onTurnEnd(); // Signal that the move is done, fury can be processed by game loop
                  } else {
                    console.warn("AI action target cell was null before processing move.");
                    onTurnEnd(); // Still signal end to prevent game stall
                  }
                }, ENEMY_ACTION_PENDING_REVEAL_DELAY_MS);
            }
        })
        .catch(error => {
            console.error("AI decision error:", error);
             if (gameState.currentPhase === GamePhase.ENEMY_THINKING) {
                const hiddenCells: CellPosition[] = [];
                boardState.forEach((row, r_idx) => row.forEach((cell, c_idx) => { if (!cell.revealed) hiddenCells.push({ row: r_idx, col: c_idx }); }));
                let randomFallbackCell: CellPosition | null = null;
                if (hiddenCells.length > 0) randomFallbackCell = hiddenCells[Math.floor(Math.random() * hiddenCells.length)];

                setGameState(prev => ({ ...prev, aiActionTargetCell: randomFallbackCell, aiThinkingCellCoords: null }));

                phaseTransitionTimeoutRef.current = window.setTimeout(() => {
                  if (randomFallbackCell) {
                     processEnemyMove(randomFallbackCell.row, randomFallbackCell.col);
                  } else {
                    console.warn("AI fallback: No hidden cells to pick.");
                  }
                  onTurnEnd();
                }, ENEMY_ACTION_PENDING_REVEAL_DELAY_MS);
            }
        });

    aiThinkingIntervalRef.current = window.setInterval(() => {
      if (aiHasMadeDecision) {
        if (aiThinkingIntervalRef.current) clearInterval(aiThinkingIntervalRef.current);
        return;
      }
      const hiddenCells: AICellInfo[] = []; // For thinking highlight
      boardState.forEach((row, r_idx) => row.forEach((cell, c_idx) => { if (!cell.revealed) hiddenCells.push({ row: r_idx, col: c_idx }); }));
      if (hiddenCells.length > 0) {
        const randomThinkingCell = hiddenCells[Math.floor(Math.random() * hiddenCells.length)];
        setGameState(prev => ({ ...prev, aiThinkingCellCoords: randomThinkingCell }));
      }
      elapsedThinkTime += ENEMY_THINKING_HIGHLIGHT_INTERVAL_MS;
      if (elapsedThinkTime >= thinkDuration && !aiHasMadeDecision) { // Fallback if AI promise is stuck
        if (aiThinkingIntervalRef.current) clearInterval(aiThinkingIntervalRef.current);
        console.warn("AI thinking timed out. Forcing fallback with random cell.");
        const hidden: CellPosition[] = [];
        boardState.forEach((r, r_idx) => r.forEach((c, c_idx) => { if (!c.revealed) hidden.push({ row: r_idx, col: c_idx }); }));
        let fallbackCell: CellPosition | null = null;
        if (hidden.length > 0) fallbackCell = hidden[Math.floor(Math.random() * hidden.length)];
        setGameState(prev => ({ ...prev, aiActionTargetCell: fallbackCell, aiThinkingCellCoords: null }));

        phaseTransitionTimeoutRef.current = window.setTimeout(() => {
          if (fallbackCell) {
            processEnemyMove(fallbackCell.row, fallbackCell.col);
          } else {
            console.warn("AI thinking timeout fallback: No hidden cells to pick.");
          }
          onTurnEnd();
        }, ENEMY_ACTION_PENDING_REVEAL_DELAY_MS);
      }
    }, ENEMY_THINKING_HIGHLIGHT_INTERVAL_MS);

  }, [
    boardState, enemyState, playerState, gameState, // Read states
    setGameState, processEnemyMove, // Functions
    // No need for setGamePhase here, game loop will handle it.
  ]);

  return {
    processEnemyMove,
    executeEnemyTurnLogic,
    aiPlayerRef,
    aiThinkingIntervalRef,
    phaseTransitionTimeoutRef,
  };
};
