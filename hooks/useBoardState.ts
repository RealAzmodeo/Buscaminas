// hooks/useBoardState.ts
import { useState, useCallback } from 'react';
import { BoardState, CellState, CellType, Echo, BiomeId, MarkType, AdjacentItems, BoardParameters, GameEvent } from '../types';
import { OBJECT_RATIO_DEFINITIONS } from '../constants/difficultyConstants';
import { BASE_ECHO_MARCADOR_TACTICO, BASE_ECHO_CARTOGRAFIA_AVANZADA } from '../constants';

const createInitialBoard = (rows: number, cols: number): BoardState => {
  const cells: CellState[][] = Array(rows).fill(null).map((_, r) =>
    Array(cols).fill(null).map((__, c) => ({
      id: `${r}-${c}`,
      row: r,
      col: c,
      type: CellType.Empty,
      revealed: false,
      markType: null,
      lockedIncorrectlyForClicks: 0,
      visualEffect: null,
    }))
  );
  return cells;
};

export const recalculateAllCluesUtility = (currentBoard: BoardState): BoardState => {
  const newBoard: BoardState = currentBoard.map(r => r.map(c => ({ ...c })));
  const BOARD_ROWS_FOR_LEVEL = newBoard.length;
  const BOARD_COLS_FOR_LEVEL = newBoard[0]?.length || 0;

  for (let r_idx = 0; r_idx < BOARD_ROWS_FOR_LEVEL; r_idx++) {
    for (let c_idx = 0; c_idx < BOARD_COLS_FOR_LEVEL; c_idx++) {
      let cellShouldBeClue = false;
      if (newBoard[r_idx][c_idx].type === CellType.Clue) {
        cellShouldBeClue = true;
      } else if (newBoard[r_idx][c_idx].type === CellType.Empty) {
        cellShouldBeClue = true;
        if (!newBoard[r_idx][c_idx].revealed) {
             newBoard[r_idx][c_idx].type = CellType.Clue;
        }
      }

      if (cellShouldBeClue) {
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
          const newAdjacentItems: AdjacentItems = { attacks: attacksAdj, gold: goldAdj, total: attacksAdj + goldAdj };
          newBoard[r_idx][c_idx].adjacentItems = newAdjacentItems;
      }
    }
  }
  return newBoard;
};

export const updateBoardVisualEffectsUtility = (currentBoard: BoardState, ecosForEffects: Echo[]): BoardState => {
  let newBoard: BoardState = currentBoard.map(row => row.map(cell => ({ ...cell, visualEffect: null })));
  // Actual logic for visual effects based on ecosForEffects would go here
  return newBoard;
};

const generateBoardFromBoardParametersInternal = (
    params: BoardParameters,
    currentActiveEcosArg: Echo[],
    gameStateDeps: {currentLevel: number, currentArenaLevel: number, currentBiomeId: BiomeId }
  ): BoardState => {
    const { rows, cols, densityPercent, objectRatioKey, traps, irregularPatternType } = params;
    const totalCells = rows * cols;

    let newGeneratedBoard: BoardState = Array(rows).fill(null).map((_, r_idx) =>
        Array(cols).fill(null).map((_, c_idx): CellState => ({
            id: `cell-${r_idx}-${c_idx}-${gameStateDeps.currentLevel}-${gameStateDeps.currentArenaLevel}-${gameStateDeps.currentBiomeId}`,
            row: r_idx, col: c_idx, type: CellType.Empty,
            revealed: false, markType: null, lockedIncorrectlyForClicks: 0, visualEffect: null,
        }))
    );

    let effectiveTotalCells = totalCells;

    if (irregularPatternType === 'ilusionista_holes') {
        const numHoles = Math.max(1, Math.min(Math.floor(totalCells * 0.08), 5));
        let holesPlaced = 0;
        for (let i = 0; i < totalCells * 3 && holesPlaced < numHoles; i++) {
            const r = Math.floor(Math.random() * rows);
            const c = Math.floor(Math.random() * cols);
            if (newGeneratedBoard[r][c].type === CellType.Empty && !newGeneratedBoard[r][c].revealed) {
                newGeneratedBoard[r][c].type = CellType.Empty;
                newGeneratedBoard[r][c].revealed = true;
                holesPlaced++;
            }
        }
        effectiveTotalCells -= holesPlaced;
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
            const r = Math.floor(Math.random() * rows);
            const c = Math.floor(Math.random() * cols);
            if (boardToPlaceOn[r][c].type === CellType.Empty && !boardToPlaceOn[r][c].revealed) {
                boardToPlaceOn[r][c].type = itemType;
                placedCount++;
            }
            attempts++;
        }
        if (placedCount < count) console.warn(`Could not place all ${itemType} items. Requested: ${count}, Placed: ${placedCount}`);
    };

    placeItemsOnBoard(traps, CellType.Trap, newGeneratedBoard);
    placeItemsOnBoard(numAttacks, CellType.Attack, newGeneratedBoard);
    placeItemsOnBoard(numGold, CellType.Gold, newGeneratedBoard);

    newGeneratedBoard = recalculateAllCluesUtility(newGeneratedBoard); // Use utility
    newGeneratedBoard = updateBoardVisualEffectsUtility(newGeneratedBoard, currentActiveEcosArg); // Use utility

    return newGeneratedBoard;
};

export interface UseBoardStateProps {
  activeEcos: Echo[];
  addGameEvent: (payload: any, type?: string) => void;
  currentLevel: number;
  currentArenaLevel: number;
  currentBiomeId: BiomeId;
}

export const useBoardState = (props: UseBoardStateProps) => {
  const [board, setBoard] = useState<BoardState>(createInitialBoard(8,8));

  const generateAndSetBoard = useCallback((params: BoardParameters, currentActiveEcosArg: Echo[]) => {
    const newBoard = generateBoardFromBoardParametersInternal(params, currentActiveEcosArg, {
      currentLevel: props.currentLevel,
      currentArenaLevel: props.currentArenaLevel,
      currentBiomeId: props.currentBiomeId,
    });
    setBoard(newBoard);
    return { rows: params.rows, cols: params.cols };
  }, [props.currentLevel, props.currentArenaLevel, props.currentBiomeId]);

  const recalculateCluesOnCurrentBoard = useCallback(() => {
    setBoard(prevBoard => recalculateAllCluesUtility(prevBoard));
  }, []);

  const updateVisualEffectsOnCurrentBoard = useCallback((ecosToConsider: Echo[]) => {
    setBoard(prevBoard => updateBoardVisualEffectsUtility(prevBoard, ecosToConsider));
  }, []);

  const cycleCellMark = useCallback((row: number, col: number) => {
    let canMark = false;
    const marcadorTactico = props.activeEcos.find(e => e.baseId === BASE_ECHO_MARCADOR_TACTICO);
    const cartografiaAvanzada = props.activeEcos.find(e => e.baseId === BASE_ECHO_CARTOGRAFIA_AVANZADA);
    if (marcadorTactico || cartografiaAvanzada) canMark = true;

    if (!canMark) {
      props.addGameEvent({ text: "Eco de Marcado no activo.", type: 'info' });
      return;
    }

    setBoard(prevBoard => {
      const newBoard = prevBoard.map(r_ => r_.map(cell_ => ({ ...cell_ })));
      const cell = newBoard[row][col];
      if (cell.revealed || cell.lockedIncorrectlyForClicks > 0) return prevBoard;

      const markOrder: (MarkType | null)[] = [null, MarkType.GenericFlag];
      if (cartografiaAvanzada) {
        markOrder.push(MarkType.Bomb, MarkType.Sword, MarkType.Gold, MarkType.Question);
      }

      const currentMarkIndex = markOrder.indexOf(cell.markType);
      cell.markType = markOrder[(currentMarkIndex + 1) % markOrder.length];
      return newBoard;
    });
  }, [props.activeEcos, props.addGameEvent]);

  return {
    board,
    setBoard,
    generateAndSetBoard,
    recalculateCluesOnCurrentBoard,
    updateVisualEffectsOnCurrentBoard,
    cycleCellMark,
    // Exporting utilities for use in useGameEngine's complex event handlers
    recalculateAllCluesUtility,
    updateBoardVisualEffectsUtility,
  };
};
