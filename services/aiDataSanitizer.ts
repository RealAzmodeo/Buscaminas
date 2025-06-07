/**
 * @file aiDataSanitizer.ts
 * @description Provides functions to sanitize game board data for AI consumption,
 * ensuring information asymmetry by hiding details revealed by player-specific Ecos.
 */

import { BoardState, CellType, AISafeBoardStateView, AISafeCell } from '../types';

/**
 * Creates a sanitized view of the game board specifically for AI decision-making.
 * This view limits the information available to the AI, particularly regarding
 * detailed clue breakdowns that might be available to the player via Ecos.
 *
 * - Revealed cells show their type (Attack, Gold, Clue, Trap, Empty).
 * - Player-placed marks are visible to the AI.
 * - Revealed Clue cells only show the *total* number of adjacent items,
 *   without discriminating between item types (e.g., attacks vs. gold).
 *
 * @param {BoardState} boardState - The full, current state of the game board.
 * @returns {AISafeBoardStateView} A sanitized version of the board state for AI use.
 */
export function createAISafeView(boardState: BoardState): AISafeBoardStateView {
  return boardState.map(row =>
    row.map(cell => {
      const safeCell: AISafeCell = {
        isRevealed: cell.revealed,
        markType: cell.markType, // Player marks are public information
      };

      if (cell.revealed) {
        safeCell.revealedType = cell.type; // AI can see the type of revealed cells

        // For revealed Clue cells, only provide the total undiscriminated item count
        if (cell.type === CellType.Clue && cell.adjacentItems) {
          safeCell.totalAdjacentItems = cell.adjacentItems.total;
        }
      }
      // Unrevealed cells or non-clue cells (or clues without adjacentItems)
      // will not have `totalAdjacentItems` in the safe view.
      // `revealedType` is also only present if `isRevealed` is true.

      return safeCell;
    })
  );
}
