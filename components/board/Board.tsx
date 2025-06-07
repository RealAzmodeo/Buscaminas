
import React from 'react';
import { BoardState, Echo, PlayerState, GamePhase, AICellInfo } from '../../types';
import Cell from './Cell';

/**
 * @interface BoardProps
 * @description Props for the Board component.
 * @property {BoardState} board - The 2D array representing the current state of the game board.
 * @property {(row: number, col: number) => void} onCellClick - Callback function for when a cell is left-clicked by the player.
 * @property {(row: number, col: number) => void} onCellContextMenu - Callback function for when a cell is right-clicked (for marking).
 * @property {Echo[]} activeEcos - Array of currently active Echos for the player, passed to individual Cells.
 * @property {PlayerState} player - The current state of the player, passed to individual Cells.
 * @property {boolean} [forceRevealAllCells=false] - If true, all cells are displayed as revealed (for debugging/sandbox mode).
 * @property {GamePhase} currentPhase - The current phase of the game (e.g., PLAYER_TURN, ENEMY_THINKING), affects cell interactivity.
 * @property {AICellInfo | null} aiThinkingCellCoords - Coordinates of the cell the AI is currently "thinking" about, for highlighting.
 * @property {AICellInfo | null} aiActionTargetCell - Coordinates of the cell the AI has targeted for its action, for highlighting.
 */
interface BoardProps {
  board: BoardState;
  onCellClick: (row: number, col: number) => void;
  onCellContextMenu: (row: number, col: number) => void;
  activeEcos: Echo[];
  player: PlayerState;
  forceRevealAllCells?: boolean;
  currentPhase: GamePhase;
  aiThinkingCellCoords: AICellInfo | null;
  aiActionTargetCell: AICellInfo | null;
}

/**
 * @component Board
 * @description Renders the game board as a grid of Cell components.
 * It dynamically adjusts the grid layout based on the board dimensions (`board[0].length`).
 * Passes down necessary state and callbacks to each Cell.
 */
const Board: React.FC<BoardProps> = ({
  board,
  onCellClick,
  onCellContextMenu,
  activeEcos,
  player,
  forceRevealAllCells = false,
  currentPhase,
  aiThinkingCellCoords,
  aiActionTargetCell
}) => {
  // Handle cases where the board might not be initialized yet
  if (!board || board.length === 0 || board[0].length === 0) {
    return <div className="text-center p-4 text-slate-400" aria-live="polite">Cargando tablero...</div>;
  }

  const isPlayerTurn = currentPhase === GamePhase.PLAYER_TURN;

  return (
    <div
        id="board-container" // For targeting by floating text or other global systems
        data-testid="board-container" // For easier testing
        className="grid gap-0.5 bg-slate-700 p-1 rounded-lg shadow-xl mx-auto"
        style={{ gridTemplateColumns: `repeat(${board[0].length}, minmax(0, 1fr))` }} // Dynamically set columns
        role="grid" // ARIA role for a grid structure
        aria-label={`Tablero de juego de ${board.length} filas por ${board[0].length} columnas.`}
    >
      {board.map((rowState, rowIndex) => // Added rowIndex for potential row-specific ARIA if needed
        rowState.map((cellState) => (
          <Cell
            key={cellState.id} // Unique key for each cell, essential for React's rendering
            cell={cellState}
            onCellClick={onCellClick}
            onCellContextMenu={onCellContextMenu}
            activeEcos={activeEcos}
            player={player}
            forceReveal={forceRevealAllCells}
            isPlayerTurn={isPlayerTurn}
            aiThinkingCellCoords={aiThinkingCellCoords}
            aiActionTargetCell={aiActionTargetCell}
          />
        ))
      )}
    </div>
  );
};

// Memoize Board if board state reference changes infrequently relative to its parent's re-renders.
// However, if board content (cell states) changes often, memoization here might not offer significant gains
// if the parent component (e.g., GameScreen) re-renders due to those same state changes.
export default React.memo(Board);
