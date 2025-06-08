import { useState, useCallback, useRef } from 'react';
import {
  BoardState, CellState, CellType, Echo, GameStatus, BoardParameters,
  PlayerState, EnemyInstance, GameStateCore, GuidingTextKey
} from '../types'; // MarkType removed as cycleCellMark is gone
import {
    MINI_ARENA_SIZES, MAX_ARENA_REDUCTIONS,
    BATTLEFIELD_TRANSITION_DURATION_MS, MINI_ARENA_ATTACK_DENSITY_FACTOR_PERCENT,
    OBJECT_RATIO_DEFINITIONS
} from '../constants';

const playMidiSoundPlaceholder = (soundId: string) => console.log(`Playing sound (placeholder): ${soundId}`);

export interface UseBoardReturn {
  board: BoardState;
  setBoard: React.Dispatch<React.SetStateAction<BoardState>>;
  recalculateAllClues: (currentBoard: BoardState) => BoardState;
  updateBoardVisualEffects: (currentBoard: BoardState, effectiveEcos: Echo[], deactivatedEcosInfo: PlayerState['deactivatedEcos']) => BoardState;
  generateBoardFromBoardParameters: (params: BoardParameters, currentActiveEcosArg: Echo[], currentLevel: number, currentArenaLevel: number, currentBiomeId: string) => BoardState;
  checkAllPlayerBeneficialAttacksRevealed: (currentBoard: BoardState) => boolean;
  triggerBattlefieldReduction: () => void;
  battlefieldReductionTimeoutRef: React.MutableRefObject<number | null>;
  // cycleCellMark removed
}

interface BoardProps {
  gameState: GameStateCore;
  setGameState: React.Dispatch<React.SetStateAction<GameStateCore>>;
  setGameStatus: (newStatus: GameStatus, newDefeatReason?: 'standard' | 'attrition') => void;
  getActiveEcos: () => Echo[];
  getPlayerDeactivatedEcos: () => PlayerState['deactivatedEcos'];
  advancePrologueStep: (specificStepOrKey?: number | GuidingTextKey) => void;
  setEnemyState: React.Dispatch<React.SetStateAction<EnemyInstance>>;
  // addGameEvent is no longer needed here as cycleCellMark is removed
}

export const useBoard = ({
  gameState,
  setGameState,
  setGameStatus,
  getActiveEcos,
  getPlayerDeactivatedEcos,
  advancePrologueStep,
  setEnemyState,
}: BoardProps): UseBoardReturn => {
  const [board, setBoard] = useState<BoardState>([]);
  const battlefieldReductionTimeoutRef = useRef<number | null>(null);

  const recalculateAllClues = useCallback((currentBoard: BoardState): BoardState => {
    const newBoard: BoardState = currentBoard.map(r => r.map(c => ({ ...c })));
    const BOARD_ROWS_FOR_LEVEL = newBoard.length;
    const BOARD_COLS_FOR_LEVEL = newBoard[0]?.length || 0;

    for (let r_idx = 0; r_idx < BOARD_ROWS_FOR_LEVEL; r_idx++) {
      for (let c_idx = 0; c_idx < BOARD_COLS_FOR_LEVEL; c_idx++) {
        if (newBoard[r_idx][c_idx].type === CellType.Clue || newBoard[r_idx][c_idx].type === CellType.Empty) {
            if (!newBoard[r_idx][c_idx].revealed || newBoard[r_idx][c_idx].type === CellType.Empty) {
                 newBoard[r_idx][c_idx].type = CellType.Clue;
            }
            let attacksAdj = 0, goldAdj = 0;
            for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = r_idx + dr;
                const nc = c_idx + dc;
                if (nr >= 0 && nr < BOARD_ROWS_FOR_LEVEL && nc >= 0 && nc < BOARD_COLS_FOR_LEVEL) {
                  const neighbor = newBoard[nr][nc];
                  if (neighbor.revealed && neighbor.type === CellType.Empty) continue;
                  if (neighbor.type === CellType.Attack) attacksAdj++;
                  else if (neighbor.type === CellType.Gold) goldAdj++;
                }
            }
            newBoard[r_idx][c_idx].adjacentItems = { attacks: attacksAdj, gold: goldAdj, total: attacksAdj + goldAdj };
        }
      }
    }
    return newBoard;
  }, []);

  const updateBoardVisualEffects = useCallback((currentBoard: BoardState, effectiveEcos: Echo[], deactivatedEcosInfo: PlayerState['deactivatedEcos']): BoardState => {
    let newBoard: BoardState = currentBoard.map(row => row.map(cell => ({ ...cell, visualEffect: null })));
    return newBoard;
  }, []);

  const generateBoardFromBoardParameters = useCallback((
    params: BoardParameters,
    currentActiveEcosArg: Echo[],
    currentLevel: number,
    currentArenaLevel: number,
    currentBiomeId: string
  ): BoardState => {
    const { rows, cols, densityPercent, objectRatioKey, traps, irregularPatternType } = params;
    const totalCells = rows * cols;
    let newBoard: BoardState = Array(rows).fill(null).map((_, r_idx) =>
        Array(cols).fill(null).map((_, c_idx): CellState => ({
            id: `cell-${r_idx}-${c_idx}-${currentLevel}-${currentArenaLevel}-${currentBiomeId}`,
            row: r_idx, col: c_idx, type: CellType.Empty,
            revealed: false, markType: null, lockedIncorrectlyForClicks: 0, visualEffect: null,
        }))
    );
    let effectiveTotalCells = totalCells;
    if (irregularPatternType === 'ilusionista_holes') {
        const numHoles = Math.max(1, Math.min(Math.floor(totalCells * 0.08), 5));
        let holesPlaced = 0;
        for (let i = 0; i < totalCells * 3 && holesPlaced < numHoles; i++) {
            const r = Math.floor(Math.random() * rows); const c = Math.floor(Math.random() * cols);
            if (newBoard[r][c].type === CellType.Empty && !newBoard[r][c].revealed) {
                newBoard[r][c].type = CellType.Empty; newBoard[r][c].revealed = true; holesPlaced++;
            }
        } effectiveTotalCells -= holesPlaced;
    }
    const numTotalItemsToPlaceBasedOnDensity = Math.floor(effectiveTotalCells * (densityPercent / 100));
    const ratioDef = OBJECT_RATIO_DEFINITIONS[objectRatioKey];
    if (!ratioDef) throw new Error(`Object ratio definition not found for key: ${objectRatioKey}`);
    const ratioPartsSum = ratioDef.attacks + ratioDef.gold;
    let numAttacks = 0, numGold = 0;
    if (ratioPartsSum > 0) {
        numAttacks = Math.floor(numTotalItemsToPlaceBasedOnDensity * (ratioDef.attacks / ratioPartsSum));
        numGold = Math.floor(numTotalItemsToPlaceBasedOnDensity * (ratioDef.gold / ratioPartsSum));
    }
    const cellsAvailableForMainItems = effectiveTotalCells - traps;
    let currentMainItemSum = numAttacks + numGold;
    if (currentMainItemSum > cellsAvailableForMainItems) {
        const overflow = currentMainItemSum - cellsAvailableForMainItems;
        numAttacks = Math.max(0, numAttacks - Math.ceil(overflow / 2));
        numGold = Math.max(0, numGold - Math.floor(overflow / 2));
    }
    const placeItemsOnBoard = (count: number, itemType: CellType, boardToPlaceOn: BoardState) => {
        let placedCount = 0; let attempts = 0;
        while (placedCount < count && attempts < totalCells * 5) {
            const r = Math.floor(Math.random() * rows); const c = Math.floor(Math.random() * cols);
            if (boardToPlaceOn[r][c].type === CellType.Empty && !boardToPlaceOn[r][c].revealed) {
                boardToPlaceOn[r][c].type = itemType; placedCount++;
            } attempts++;
        }
        if (placedCount < count) console.warn(`Could not place all ${itemType} items. Requested: ${count}, Placed: ${placedCount}`);
    };
    placeItemsOnBoard(traps, CellType.Trap, newBoard);
    placeItemsOnBoard(numAttacks, CellType.Attack, newBoard);
    placeItemsOnBoard(numGold, CellType.Gold, newBoard);
    newBoard = recalculateAllClues(newBoard);
    const deactivatedEcos = getPlayerDeactivatedEcos();
    newBoard = updateBoardVisualEffects(newBoard, currentActiveEcosArg, deactivatedEcos);
    return newBoard;
  }, [recalculateAllClues, updateBoardVisualEffects, getPlayerDeactivatedEcos]);

  const checkAllPlayerBeneficialAttacksRevealed = useCallback((currentBoard: BoardState): boolean => {
    for (const row of currentBoard) for (const cell of row) if (cell.type === CellType.Attack && !cell.revealed) return false;
    return true;
  }, []);

  const triggerBattlefieldReduction = useCallback(() => {
    if (battlefieldReductionTimeoutRef.current) clearTimeout(battlefieldReductionTimeoutRef.current);
    playMidiSoundPlaceholder('battlefield_reduce_start');
    setGameState(prev => ({ ...prev, isBattlefieldReductionTransitioning: true, guidingTextKey: 'BATTLEFIELD_REDUCTION_START' }));
    battlefieldReductionTimeoutRef.current = window.setTimeout(() => {
        const currentActiveEcos = getActiveEcos();
        const nextArenaLevel = gameState.currentArenaLevel + 1;
        if (nextArenaLevel > gameState.maxArenaReductions) {
            playMidiSoundPlaceholder('player_defeat_attrition');
            setGameStatus(GameStatus.GameOverDefeat, 'attrition');
            setGameState(prev => ({ ...prev, isBattlefieldReductionTransitioning: false })); return;
        }
        playMidiSoundPlaceholder('battlefield_board_collapse');
        const newDimensions = MINI_ARENA_SIZES[nextArenaLevel - 1];
        const attackDensityKey = `level${nextArenaLevel}` as keyof typeof MINI_ARENA_ATTACK_DENSITY_FACTOR_PERCENT;
        const attackDensityPercent = MINI_ARENA_ATTACK_DENSITY_FACTOR_PERCENT[attackDensityKey] || MINI_ARENA_ATTACK_DENSITY_FACTOR_PERCENT.level2;
        const miniArenaParams: BoardParameters = {
            rows: newDimensions.rows, cols: newDimensions.cols,
            densityPercent: attackDensityPercent, objectRatioKey: 'hostile', traps: 0,
        };
        const newMiniBoard = generateBoardFromBoardParameters(
            miniArenaParams, currentActiveEcos, gameState.currentLevel, nextArenaLevel, gameState.currentBiomeId
        );
        setBoard(newMiniBoard);
        playMidiSoundPlaceholder('mini_arena_form');
        setEnemyState(prevEnemy => ({ ...prevEnemy, currentFuryCharge: Math.floor(prevEnemy.currentFuryCharge / 2) }));
        setGameState(prev => ({
            ...prev, currentArenaLevel: nextArenaLevel, isBattlefieldReductionTransitioning: false,
            guidingTextKey: 'BATTLEFIELD_REDUCTION_COMPLETE',
            currentBoardDimensions: { rows: newDimensions.rows, cols: newDimensions.cols }
        }));
        setTimeout(() => {
            // Check current guidingTextKey before clearing, to avoid clearing unrelated messages
            setGameState(gts => gts.guidingTextKey === 'BATTLEFIELD_REDUCTION_COMPLETE' ? {...gts, guidingTextKey: ''} : gts);
        } , 5000); // advancePrologueStep('') was used, now directly update guidingTextKey in gameState
    }, BATTLEFIELD_TRANSITION_DURATION_MS);
  }, [
      gameState, setGameState, setGameStatus, getActiveEcos, generateBoardFromBoardParameters,
      setEnemyState, advancePrologueStep, /* setBoard is internal */
    ]);

  // cycleCellMark removed

  return {
    board, setBoard, recalculateAllClues, updateBoardVisualEffects, generateBoardFromBoardParameters,
    checkAllPlayerBeneficialAttacksRevealed, triggerBattlefieldReduction, battlefieldReductionTimeoutRef,
  };
};
