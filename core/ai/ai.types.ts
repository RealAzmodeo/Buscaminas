
import { BoardState, CellPosition, EnemyInstance, PlayerState, AISafeBoardStateView } from '../../types';

// Using CellPosition from types.ts as it's a general type

export interface AIDecision {
  cell: CellPosition;
  reasoning: string; // For debugging or potential future UI hints
}

// Interface that all AI "brains" will implement
export interface AIInterface {
  decideNextMove: (
    safeBoardView: AISafeBoardStateView, // AI now receives a sanitized view
    enemySelf: EnemyInstance, 
    playerState: PlayerState, 
  ) => Promise<AIDecision>;
}
