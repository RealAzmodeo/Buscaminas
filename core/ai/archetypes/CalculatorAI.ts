
import { AIInterface, AIDecision } from '../ai.types';
import { AISafeBoardStateView, CellPosition, EnemyInstance, PlayerState, CellType } from '../../../types';

const WEIGHT_ATTACK = 3.0;
const WEIGHT_GOLD = 1.5;
const WEIGHT_CLUE_REVEAL = -0.5; // Negative weight for revealing a cell that's likely just a clue

// Heuristic probabilities for item types when only total is known
const HEURISTIC_ATTACK_PROB = 0.6;
const HEURISTIC_GOLD_PROB = 0.3;
// Remaining 0.1 could be traps or other items

export class CalculatorAI implements AIInterface {
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
      return { cell: { row: 0, col: 0 }, reasoning: "Error: No hidden cells left (Calculator)." };
    }

    let bestCell: CellPosition | null = null;
    let maxScore = -Infinity;
    let bestReasoning = "Calculator: No suitable cell found.";

    for (const hc of hiddenCells) {
      let score = 0;
      let attackPotential = 0;
      let goldPotential = 0;
      let likelyClueScorePenalty = 0; 
      let numAdjacentRevealedClues = 0;

      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = hc.row + dr;
          const nc = hc.col + dc;

          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && safeBoardView[nr][nc].isRevealed) {
            const adjSafeCell = safeBoardView[nr][nc];
            if (adjSafeCell.revealedType === CellType.Clue && adjSafeCell.totalAdjacentItems !== undefined) {
              numAdjacentRevealedClues++;
              const clueTotal = adjSafeCell.totalAdjacentItems;
              let revealedItemsAroundClue = 0;
              let hiddenNeighborsOfClue = 0;

              for (let dr2 = -1; dr2 <= 1; dr2++) {
                for (let dc2 = -1; dc2 <= 1; dc2++) {
                  if (dr2 === 0 && dc2 === 0) continue;
                  const nnr = nr + dr2;
                  const nnc = nc + dc2;
                  if (nnr >= 0 && nnr < rows && nnc >= 0 && nnc < cols) {
                    const neighborOfClue = safeBoardView[nnr][nnc];
                    if (!neighborOfClue.isRevealed) {
                      hiddenNeighborsOfClue++;
                    } else {
                      // Count any revealed item type
                      if (neighborOfClue.revealedType === CellType.Attack ||
                          neighborOfClue.revealedType === CellType.Gold ||
                          neighborOfClue.revealedType === CellType.Trap) { // Future: add other items
                        revealedItemsAroundClue++;
                      }
                    }
                  }
                }
              }
              
              if (hiddenNeighborsOfClue > 0) {
                const remainingExpectedItems = Math.max(0, clueTotal - revealedItemsAroundClue);
                const probOfItemInHc = remainingExpectedItems / hiddenNeighborsOfClue;

                attackPotential += probOfItemInHc * HEURISTIC_ATTACK_PROB;
                goldPotential += probOfItemInHc * HEURISTIC_GOLD_PROB;
                // If all items for this clue are found, this cell (hc) is likely a clue/empty
                if (remainingExpectedItems === 0) {
                    likelyClueScorePenalty += 1; 
                }
              }
            }
          }
        }
      }
      
      score = (attackPotential * WEIGHT_ATTACK) + 
              (goldPotential * WEIGHT_GOLD) +
              (likelyClueScorePenalty > 0 ? WEIGHT_CLUE_REVEAL * likelyClueScorePenalty : 0);

      if (numAdjacentRevealedClues === 0) { // Cell is isolated
        score = 0.1; // Small baseline score to encourage exploration
      }

      if (score > maxScore) {
        maxScore = score;
        bestCell = hc;
        bestReasoning = `Calculator: Chose cell (${hc.row},${hc.col}) with score ${maxScore.toFixed(2)} (AP:${attackPotential.toFixed(2)}, GP:${goldPotential.toFixed(2)}, LCP:${likelyClueScorePenalty.toFixed(2)})`;
      }
    }

    if (bestCell) {
      return { cell: bestCell, reasoning: bestReasoning };
    }

    const randomIndex = Math.floor(Math.random() * hiddenCells.length);
    return { cell: hiddenCells[randomIndex], reasoning: "Calculator: Fallback random choice." };
  }
}
