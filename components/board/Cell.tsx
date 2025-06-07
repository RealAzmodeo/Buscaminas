
import React, { useCallback, useMemo } from 'react';
import { CellState, CellType, Echo, MarkType, PlayerState, AICellInfo } from '../../types';
import ClueDisplay from './ClueDisplay';

/**
 * @interface CellContentProps
 * @description Props for the CellContent component, which renders the inner content of a cell.
 * @property {CellState} cell - The state of the cell.
 * @property {Echo[]} activeEcos - Currently active Echos for the player, potentially affecting clue display.
 * @property {PlayerState} player - The current state of the player, for effects like Paranoia Galopante.
 * @property {boolean} isRevealed - Whether the cell is effectively revealed (either naturally or forced by sandbox/debug).
 */
interface CellContentProps {
  cell: CellState;
  activeEcos: Echo[];
  player: PlayerState;
  isRevealed: boolean;
}

/**
 * @component CellContent
 * @description Renders the visual content of a cell based on its state (icon, clue number, mark).
 * This component is memoized using `React.memo` to optimize performance by preventing unnecessary
 * re-renders if its props have not changed.
 */
const CellContent: React.FC<CellContentProps> = React.memo(({ cell, activeEcos, player, isRevealed }) => {
  // If the cell is not revealed, display its mark or a default '?'
  if (!isRevealed) {
    if (cell.markType) {
      switch (cell.markType) {
        case MarkType.GenericFlag: return <span className="text-lg text-yellow-400" aria-label="Marcado con bandera">🚩</span>;
        case MarkType.Bomb: return <span className="text-lg text-red-400" aria-label="Marcado como Ataque peligroso (Bomba)">💣</span>;
        case MarkType.Sword: return <span className="text-lg text-sky-400" aria-label="Marcado como Ataque ventajoso (Espada)">⚔️</span>;
        case MarkType.Gold: return <span className="text-lg text-yellow-400" aria-label="Marcado como Oro">💰</span>;
        case MarkType.Question: return <span className="text-lg text-purple-400" aria-label="Marcado con interrogación">❓</span>;
        default: return <span className="text-lg font-bold text-slate-400" aria-label="Marcado desconocido">?</span>;
      }
    }
    return <span className="text-lg font-bold text-slate-400" aria-label="Celda oculta">?</span>;
  }

  // If the cell is revealed, display its type-specific content
  switch (cell.type) {
    case CellType.Attack:
      return <span className="text-2xl" aria-label="Ataque">💥</span>;
    case CellType.Gold:
      return <span className="text-2xl" aria-label="Oro">💰</span>;
    case CellType.Clue:
      if (cell.adjacentItems) {
        // ClueDisplay handles its own ARIA label based on content and active Echos
        return <ClueDisplay adjacentItems={cell.adjacentItems} activeEcos={activeEcos} player={player} />;
      }
      // Fallback if adjacentItems is missing for a clue cell, though this shouldn't happen in normal gameplay
      return <span className="text-lg font-bold text-slate-400" aria-label="Pista (datos no disponibles)">?</span>;
    case CellType.Trap:
      return <span className="text-2xl" aria-label="Trampa">🚫</span>;
    case CellType.Empty: // Explicitly handle Empty revealed cells for clarity
      return <span className="text-sm text-slate-500" aria-label="Celda vacía"></span>; // Render nothing visible but maintain ARIA label
    default:
      return null; // Should not be reached if cell types are handled exhaustively
  }
});
CellContent.displayName = 'CellContent'; // For better debugging in React DevTools


/**
 * @interface CellProps
 * @description Props for the Cell component, representing a single cell on the game board.
 * @property {CellState} cell - The state object for this cell.
 * @property {(row: number, col: number) => void} onCellClick - Callback for when the cell is left-clicked by the player.
 * @property {(row: number, col: number) => void} onCellContextMenu - Callback for when the cell is right-clicked (context menu for marking).
 * @property {Echo[]} activeEcos - Array of currently active Echos, passed to CellContent for display logic.
 * @property {PlayerState} player - The current state of the player, passed to CellContent for display logic.
 * @property {boolean} [forceReveal=false] - If true, forces the cell to display as revealed (e.g., in sandbox mode 'Reveal All').
 * @property {boolean} isPlayerTurn - True if it's currently the player's turn, enabling interaction.
 * @property {AICellInfo | null} aiThinkingCellCoords - Coordinates of the cell the AI is "thinking" about, for highlighting.
 * @property {AICellInfo | null} aiActionTargetCell - Coordinates of the cell the AI will act upon, for highlighting.
 */
interface CellProps {
  cell: CellState;
  onCellClick: (row: number, col: number) => void;
  onCellContextMenu: (row: number, col: number) => void;
  activeEcos: Echo[];
  player: PlayerState;
  forceReveal?: boolean;
  isPlayerTurn: boolean;
  aiThinkingCellCoords: AICellInfo | null;
  aiActionTargetCell: AICellInfo | null;
}

/**
 * @component Cell
 * @description Renders a single cell on the game board. It handles its appearance based on its state
 * (revealed, type, mark, visual effects), interactivity (click, context menu), and ARIA attributes
 * for accessibility.
 */
const Cell: React.FC<CellProps> = ({
  cell,
  onCellClick,
  onCellContextMenu,
  activeEcos,
  player,
  forceReveal = false,
  isPlayerTurn,
  aiThinkingCellCoords,
  aiActionTargetCell
}) => {
  const isEffectivelyRevealed = cell.revealed || forceReveal;

  // Memoized click handler
  const handleClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault(); // Prevent default context menu on right-click if it bubbles up
    if (!isPlayerTurn || cell.lockedIncorrectlyForClicks > 0 || cell.revealed) return;
    onCellClick(cell.row, cell.col);
  }, [isPlayerTurn, cell.lockedIncorrectlyForClicks, cell.revealed, onCellClick, cell.row, cell.col]);

  // Memoized context menu handler (for marking cells)
  const handleContextMenu = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!isPlayerTurn || cell.revealed || cell.lockedIncorrectlyForClicks > 0) return;
    onCellContextMenu(cell.row, cell.col);
  }, [isPlayerTurn, cell.revealed, cell.lockedIncorrectlyForClicks, onCellContextMenu, cell.row, cell.col]);

  // Memoized key down handler for keyboard accessibility (Enter/Space to click)
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isPlayerTurn || cell.lockedIncorrectlyForClicks > 0 || cell.revealed) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onCellClick(cell.row, cell.col);
    }
  }, [isPlayerTurn, cell.lockedIncorrectlyForClicks, cell.revealed, onCellClick, cell.row, cell.col]);

  // Memoized calculation of cell classes for styling
  const cellClasses = useMemo(() => {
    const classes: string[] = ["w-12 h-12 md:w-14 md:h-14 flex items-center justify-center border border-slate-700 transition-all duration-200 ease-in-out transform"];

    const isAIThinkingHighlight = aiThinkingCellCoords?.row === cell.row && aiThinkingCellCoords?.col === cell.col;
    const isAITarget = aiActionTargetCell?.row === cell.row && aiActionTargetCell?.col === cell.col;

    if (cell.lockedIncorrectlyForClicks > 0) {
      classes.push("bg-slate-900 opacity-70 cursor-not-allowed ring-2 ring-red-600 ring-inset");
    } else if (isEffectivelyRevealed) {
      classes.push("bg-slate-600"); // Base for revealed cells
      if (forceReveal && !cell.revealed) { // Special styling if forced reveal (e.g., sandbox)
          classes.push("opacity-80");
      }
      // Add specific styling based on revealed cell type
      switch (cell.type) {
          case CellType.Attack: classes.push("border-orange-500 shadow-lg shadow-orange-500/30"); break;
          case CellType.Gold: classes.push("border-yellow-500 shadow-lg shadow-yellow-500/30"); break;
          case CellType.Trap: classes.push("border-indigo-500 shadow-lg shadow-indigo-500/40"); break;
          case CellType.Clue: classes.push(cell.adjacentItems && cell.adjacentItems.total > 0 ? "border-slate-500" : "border-slate-700"); break;
          default: classes.push("border-slate-700"); // For Empty or unstyled types
      }
    } else { // Hidden cells
      classes.push("bg-slate-800");
      if (isPlayerTurn) {
          classes.push("hover:bg-slate-700 cursor-pointer hover:scale-105");
      } else {
          classes.push("cursor-default"); // Not player's turn
      }

      // Highlighting for AI actions
      if (isAITarget) {
          classes.push("ring-4 ring-red-500 ring-inset animate-pulse");
      } else if (isAIThinkingHighlight) {
          classes.push("ring-2 ring-sky-400 ring-inset opacity-80 scale-105");
      }

      // Visual effects from Echos or game mechanics
      if (cell.visualEffect === 'pulse-red') {
          classes.push("animate-pulse-red");
      } else if (cell.visualEffect === 'glow-blue') {
          classes.push("animate-glow-blue");
      }
    }
    return classes.join(' ');
  }, [cell, forceReveal, isPlayerTurn, aiThinkingCellCoords, aiActionTargetCell, isEffectivelyRevealed]);

  // Memoized ARIA label for accessibility
  const ariaLabel = useMemo(() => {
    let label = `Celda ${cell.row + 1}, ${cell.col + 1}. `;
    if (!isPlayerTurn) label += "Turno del enemigo. ";
    if (cell.lockedIncorrectlyForClicks > 0) {
      label += `Bloqueada por ${cell.lockedIncorrectlyForClicks} clics debido a marca incorrecta. `;
    }

    if (isEffectivelyRevealed) {
      label += `Revelada. Tipo: ${cell.type}.`;
      if (cell.type === CellType.Clue && cell.adjacentItems) {
        label += ` Pista de ${cell.adjacentItems.total} objetos adyacentes.`; // ClueDisplay will provide more specific breakdown
      } else if (cell.type === CellType.Empty) {
        label += ` Casilla vacía.`;
      }
    } else if (cell.markType) {
      label += `Marcada como ${cell.markType.replace(/_/g, ' ')}. `; // Make mark type more readable
    } else {
      label += "Oculta. ";
    }

    // AI interaction status
    if (aiActionTargetCell?.row === cell.row && aiActionTargetCell?.col === cell.col) {
      label += "Objetivo actual del enemigo. ";
    } else if (aiThinkingCellCoords?.row === cell.row && aiThinkingCellCoords?.col === cell.col) {
      label += "Enemigo considerando esta casilla. ";
    }

    // Visual effect descriptions
    if (cell.visualEffect === 'pulse-red') label += "Peligro potencial detectado. ";
    if (cell.visualEffect === 'glow-blue') label += "Objeto metálico detectado. "; // Example, adjust if effect means something else
    return label.trim();
  }, [cell, isEffectivelyRevealed, isPlayerTurn, aiThinkingCellCoords, aiActionTargetCell]);


  return (
    <div
      className={cellClasses}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onKeyDown={handleKeyDown}
      role="button" // Makes it keyboard accessible and understandable as interactive
      aria-pressed={isEffectivelyRevealed} // Indicates if the cell is "pressed" (revealed)
      aria-disabled={!isPlayerTurn || cell.lockedIncorrectlyForClicks > 0 || cell.revealed} // True if not interactive
      tabIndex={(!isPlayerTurn || cell.lockedIncorrectlyForClicks > 0 || cell.revealed) ? -1 : 0} // Only focusable if interactive
      aria-label={ariaLabel} // Dynamic label for screen readers
      data-testid={`cell-${cell.row}-${cell.col}`} // For testing purposes
    >
      <CellContent cell={cell} activeEcos={activeEcos} player={player} isRevealed={isEffectivelyRevealed} />
    </div>
  );
};

// Memoize the Cell component itself if board re-renders are frequent and Cell props don't always change
export default React.memo(Cell);
