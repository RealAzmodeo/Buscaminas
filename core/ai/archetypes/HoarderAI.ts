
import { AIInterface, AIDecision } from '../ai.types';
import { AISafeBoardStateView, CellPosition, EnemyInstance, PlayerState, CellType } from '../../../types';

const WEIGHT_GOLD_HOARDER = 4.0; // Significantly higher for Gold
const WEIGHT_ATTACK_HOARDER = 1.0;
const WEIGHT_CLUE_REVEAL_HOARDER = -0.2;
const HIGH_CLUE_BONUS = 1.5; // Bonus for being adjacent to clues with total >= 3

// Heuristic probabilities for item types when only total is known
const HEURISTIC_ATTACK_PROB_HOARDER = 0.5; // Hoarder might be slightly less focused on attacks initially
const HEURISTIC_GOLD_PROB_HOARDER = 0.4;   // And slightly more on gold

export class HoarderAI implements AIInterface {
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
      return { cell: { row: 0, col: 0 }, reasoning: "Error: No hidden cells left (Hoarder)." };
    }

    let bestCell: CellPosition | null = null;
    let maxScore = -Infinity;
    let bestReasoning = "Frenético: No suitable cell found.";

    for (const hc of hiddenCells) {
      let score = 0;
      let attackPotential = 0;
      let goldPotential = 0;
      let likelyClueScorePenalty = 0;
      let isNearHighClue = false;
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
              if (clueTotal >= 3) {
                isNearHighClue = true;
              }

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
                      if (neighborOfClue.revealedType === CellType.Attack ||
                          neighborOfClue.revealedType === CellType.Gold ||
                          neighborOfClue.revealedType === CellType.Trap) {
                        revealedItemsAroundClue++;
                      }
                    }
                  }
                }
              }
              
              if (hiddenNeighborsOfClue > 0) {
                const remainingExpectedItems = Math.max(0, clueTotal - revealedItemsAroundClue);
                const probOfItemInHc = remainingExpectedItems / hiddenNeighborsOfClue;
                
                attackPotential += probOfItemInHc * HEURISTIC_ATTACK_PROB_HOARDER;
                goldPotential += probOfItemInHc * HEURISTIC_GOLD_PROB_HOARDER;
                
                if (remainingExpectedItems === 0) {
                    likelyClueScorePenalty += 1;
                }
              }
            }
          }
        }
      }
      
      score = (attackPotential * WEIGHT_ATTACK_HOARDER) + 
              (goldPotential * WEIGHT_GOLD_HOARDER) +
              (likelyClueScorePenalty > 0 ? WEIGHT_CLUE_REVEAL_HOARDER * likelyClueScorePenalty : 0);
      
      if (isNearHighClue) {
        score += HIGH_CLUE_BONUS;
      }
      
      if (numAdjacentRevealedClues === 0) {
        score = 0.05; // Lower baseline for isolated cells
      }

      if (score > maxScore) {
        maxScore = score;
        bestCell = hc;
        bestReasoning = `Frenético: Chose cell (${hc.row},${hc.col}) with score ${maxScore.toFixed(2)} (AP:${attackPotential.toFixed(2)}, GP:${goldPotential.toFixed(2)}, HighClue:${isNearHighClue ? HIGH_CLUE_BONUS : 0})`;
      }
    }

    if (bestCell) {
      return { cell: bestCell, reasoning: bestReasoning };
    }

    const randomIndex = Math.floor(Math.random() * hiddenCells.length);
    return { cell: hiddenCells[randomIndex], reasoning: "Frenético: Fallback random choice." };
  }
}
