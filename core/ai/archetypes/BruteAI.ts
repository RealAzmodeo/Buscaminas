
import { AIInterface, AIDecision } from '../ai.types';
import { AISafeBoardStateView, CellPosition, EnemyInstance, PlayerState, CellType } from '../../../types';

export class BruteAI implements AIInterface {
  async decideNextMove(
    safeBoardView: AISafeBoardStateView, // Changed from boardState
    enemySelf: EnemyInstance,
    playerState: PlayerState
  ): Promise<AIDecision> {
    const rows = safeBoardView.length;
    const cols = safeBoardView[0]?.length || 0;
    const hiddenCells: CellPosition[] = [];
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!safeBoardView[r][c].isRevealed) {
          hiddenCells.push({ row: r, col: c });
        }
      }
    }

    if (hiddenCells.length === 0) {
      return { cell: { row: 0, col: 0 }, reasoning: "Error: No hidden cells left (Brute)." };
    }
    
    const certainItemCells: CellPosition[] = [];
    const cellsToAvoidGenerally: CellPosition[] = []; // Cells that are certainly empty/clues (safe for AI to pick if it wants info)

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const safeCell = safeBoardView[r][c];
        // Check revealed clues in the safe view
        if (safeCell.isRevealed && safeCell.revealedType === CellType.Clue && safeCell.totalAdjacentItems !== undefined) {
          let revealedItemsAroundClue = 0; // Count any revealed item (Attack, Gold, Trap)
          const adjacentHiddenToClue: CellPosition[] = [];

          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                const neighbor = safeBoardView[nr][nc];
                if (!neighbor.isRevealed) {
                  adjacentHiddenToClue.push({ row: nr, col: nc });
                } else {
                  // If neighbor is revealed and is an item type, count it
                  if (neighbor.revealedType === CellType.Attack || 
                      neighbor.revealedType === CellType.Gold ||
                      neighbor.revealedType === CellType.Trap) { // Future: add other item types
                    revealedItemsAroundClue++;
                  }
                }
              }
            }
          }

          const clueTotalItems = safeCell.totalAdjacentItems;
          const remainingItemsToFind = clueTotalItems - revealedItemsAroundClue;

          if (adjacentHiddenToClue.length > 0) {
            if (remainingItemsToFind === adjacentHiddenToClue.length && remainingItemsToFind > 0) {
              // All hidden neighbors MUST be items (type unknown to AI beyond "item")
              certainItemCells.push(...adjacentHiddenToClue);
            } else if (remainingItemsToFind <= 0) { // Changed to <= 0 to be safer; means all items are found or clue was wrong
              // All items for this clue are found, so hidden neighbors are safe (empty/clues)
              cellsToAvoidGenerally.push(...adjacentHiddenToClue);
            }
          }
        }
      }
    }
    
    // Brute AI prefers to hit certain items if available (even if it's a trap, it's "action")
    if (certainItemCells.length > 0) {
      const uniqueCertainItems = Array.from(new Set(certainItemCells.map(c => `${c.row}-${c.col}`)))
        .map(s => { const [r_idx, c_idx] = s.split('-').map(Number); return { row: r_idx, col: c_idx }; });
      const randomIndex = Math.floor(Math.random() * uniqueCertainItems.length);
      return { cell: uniqueCertainItems[randomIndex], reasoning: "Cazador Paciente: Chose a 100% certain item cell (type unknown)." };
    }

    // Filter out cells that are certainly empty/clues
    const potentialTargets = hiddenCells.filter(hc =>
      !cellsToAvoidGenerally.some(avoidCell => avoidCell.row === hc.row && avoidCell.col === hc.col)
    );
    
    if (potentialTargets.length === 0) { // If all hidden cells are "safe to avoid", pick one anyway (shouldn't happen often)
      const randomIndex = Math.floor(Math.random() * hiddenCells.length);
      return { cell: hiddenCells[randomIndex], reasoning: "Cazador Paciente: Fallback, no ideal targets (all seem safe to avoid, forced pick)." };
    }
    
    // Prioritize cells not adjacent to any (active/unresolved) numeric clues
    const nonClueAdjacentCells = potentialTargets.filter(pt => {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = pt.row + dr;
          const nc = pt.col + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
            const neighbor = safeBoardView[nr][nc];
            if (neighbor.isRevealed && neighbor.revealedType === CellType.Clue && neighbor.totalAdjacentItems !== undefined && neighbor.totalAdjacentItems > 0) {
               // Check if this clue is resolved (all its items found or all its hidden neighbors are "safe")
                let clueIsResolved = true;
                let revealedItemsAroundThisClue = 0;
                let hiddenNeighborsOfThisClue = 0;
                for (let dr2 = -1; dr2 <= 1; dr2++) {
                    for (let dc2 = -1; dc2 <= 1; dc2++) {
                        if (dr2 === 0 && dc2 === 0) continue;
                        const nnr = nr + dr2;
                        const nnc = nc + dc2;
                        if (nnr >= 0 && nnr < rows && nnc >= 0 && nnc < cols) {
                            const neighborOfClue = safeBoardView[nnr][nnc];
                            if(!neighborOfClue.isRevealed) hiddenNeighborsOfThisClue++;
                            else if (neighborOfClue.revealedType === CellType.Attack || neighborOfClue.revealedType === CellType.Gold || neighborOfClue.revealedType === CellType.Trap) {
                                revealedItemsAroundThisClue++;
                            }
                        }
                    }
                }
                if (hiddenNeighborsOfThisClue > 0 && (neighbor.totalAdjacentItems - revealedItemsAroundThisClue > 0) ) {
                    clueIsResolved = false; // This clue is still "active" or "unresolved"
                }

              if (!clueIsResolved) return false; // It's adjacent to an active/unresolved clue
            }
          }
        }
      }
      return true; // Not adjacent to any active/unresolved clue
    });

    if (nonClueAdjacentCells.length > 0) {
      const randomIndex = Math.floor(Math.random() * nonClueAdjacentCells.length);
      return { cell: nonClueAdjacentCells[randomIndex], reasoning: "Cazador Paciente: Chose cell not adjacent to active/unresolved clues." };
    }

    const randomIndex = Math.floor(Math.random() * potentialTargets.length);
    return { cell: potentialTargets[randomIndex], reasoning: "Cazador Paciente: All potentials near clues, chose one randomly." };
  }
}
