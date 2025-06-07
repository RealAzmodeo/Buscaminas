
import { AIInterface, AIDecision } from '../ai.types';
import { AISafeBoardStateView, CellPosition, EnemyInstance, PlayerState, CellType, MarkType } from '../../../types';

type PatternType = 'leftmost_unrevealed' | 'rightmost_unrevealed' | 'topmost_unrevealed' | 'bottommost_unrevealed' | null;

interface IllusionistPatternState {
  type: PatternType;
  turnsLeft: number;
  lastPos?: CellPosition; 
}

export class IllusionistAI implements AIInterface {
  private patternState: IllusionistPatternState = { type: null, turnsLeft: 0 };
  private turnsInEncounter: number = 0;

  private pickNewPattern(): void {
    this.turnsInEncounter = 0; 
    const patterns: PatternType[] = ['leftmost_unrevealed', 'rightmost_unrevealed', 'topmost_unrevealed', 'bottommost_unrevealed'];
    const newPatternType = patterns[Math.floor(Math.random() * patterns.length)];
    this.patternState = {
      type: newPatternType,
      turnsLeft: Math.floor(Math.random() * 3) + 2, 
      lastPos: undefined,
    };
  }

  private getHiddenCells(safeBoardView: AISafeBoardStateView): CellPosition[] {
    const hidden: CellPosition[] = [];
    safeBoardView.forEach((row, r_idx) =>
      row.forEach((cell, c_idx) => {
        if (!cell.isRevealed) hidden.push({ row: r_idx, col: c_idx });
      })
    );
    return hidden;
  }
  
  private getPatternMove(safeBoardView: AISafeBoardStateView, hiddenCells: CellPosition[]): CellPosition | null {
    if (!this.patternState.type || hiddenCells.length === 0) return null;

    let target: CellPosition | undefined;
    switch (this.patternState.type) {
      case 'leftmost_unrevealed':
        target = hiddenCells.sort((a,b) => a.col - b.col || a.row - b.row)[0];
        break;
      case 'rightmost_unrevealed':
        target = hiddenCells.sort((a,b) => b.col - a.col || a.row - b.row)[0];
        break;
      case 'topmost_unrevealed':
        target = hiddenCells.sort((a,b) => a.row - b.row || a.col - b.col)[0];
        break;
      case 'bottommost_unrevealed':
        target = hiddenCells.sort((a,b) => b.row - a.row || a.col - b.col)[0];
        break;
    }
    return target || null;
  }


  async decideNextMove(
    safeBoardView: AISafeBoardStateView, // Changed from boardState
    enemySelf: EnemyInstance,
    playerState: PlayerState
  ): Promise<AIDecision> {
    this.turnsInEncounter++;
    const hiddenCells = this.getHiddenCells(safeBoardView);

    if (hiddenCells.length === 0) {
      return { cell: { row: 0, col: 0 }, reasoning: "Error: No hidden cells left (Illusionist)." };
    }

    if (this.patternState.turnsLeft > 0 && this.patternState.type) {
      const patternMove = this.getPatternMove(safeBoardView, hiddenCells);
      if (patternMove) {
        this.patternState.turnsLeft--;
        this.patternState.lastPos = patternMove;
        return { cell: patternMove, reasoning: `Jugador Mental: Following pattern '${this.patternState.type}' (${this.patternState.turnsLeft} turns left).` };
      } else {
        this.patternState.type = null;
        this.patternState.turnsLeft = 0;
      }
    } else if (Math.random() < 0.4 || !this.patternState.type) { 
        this.pickNewPattern();
        const patternMove = this.getPatternMove(safeBoardView, hiddenCells);
        if (patternMove && this.patternState.type) {
            this.patternState.turnsLeft--;
            this.patternState.lastPos = patternMove;
            return { cell: patternMove, reasoning: `Jugador Mental: Started new pattern '${this.patternState.type}'.` };
        }
    }

    const playerBombMarks: CellPosition[] = [];
    safeBoardView.forEach((row, r_idx) =>
      row.forEach((cell, c_idx) => {
        // Access markType from AISafeCell
        if (cell.markType === MarkType.Bomb) playerBombMarks.push({ row: r_idx, col: c_idx });
      })
    );

    if (playerBombMarks.length > 0 && Math.random() < 0.5) { 
      const cellsNearPlayerMarks: CellPosition[] = [];
      for (const mark of playerBombMarks) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = mark.row + dr;
            const nc = mark.col + dc;
            if (nr >= 0 && nr < safeBoardView.length && nc >= 0 && nc < safeBoardView[0].length &&
                !safeBoardView[nr][nc].isRevealed &&
                !cellsNearPlayerMarks.some(c => c.row === nr && c.col === nc)) {
              cellsNearPlayerMarks.push({ row: nr, col: nc });
            }
          }
        }
      }
      if (cellsNearPlayerMarks.length > 0) {
        const targetCell = cellsNearPlayerMarks[Math.floor(Math.random() * cellsNearPlayerMarks.length)];
        return { cell: targetCell, reasoning: "Jugador Mental: Reacting to player's bomb marks." };
      }
    }

    if (Math.random() < 0.3) { 
        const randomIndex = Math.floor(Math.random() * hiddenCells.length);
        return { cell: hiddenCells[randomIndex], reasoning: "Jugador Mental: Random move after pattern consideration." };
    }
    
    let bestCell: CellPosition = hiddenCells[0];
    let maxScore = -Infinity;

    for (const hc of hiddenCells) {
        let score = Math.random() * 0.5; 
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = hc.row + dr;
                const nc = hc.col + dc;
                if (nr >= 0 && nr < safeBoardView.length && nc >= 0 && nc < safeBoardView[0].length && 
                    safeBoardView[nr][nc].isRevealed && 
                    safeBoardView[nr][nc].revealedType === CellType.Clue &&
                    safeBoardView[nr][nc].totalAdjacentItems !== undefined) {
                    score += (safeBoardView[nr][nc].totalAdjacentItems || 0) * 0.1; 
                }
            }
        }
        if (score > maxScore) {
            maxScore = score;
            bestCell = hc;
        }
    }
    return { cell: bestCell, reasoning: `Jugador Mental: Fallback opportunistic choice.` };
  }
}
