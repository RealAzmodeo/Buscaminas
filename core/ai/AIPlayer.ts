
import { BoardState, CellPosition, EnemyInstance, PlayerState, AIType, AISafeBoardStateView } from '../../types';
import { AIInterface, AIDecision } from './ai.types';
import { BruteAI } from './archetypes/BruteAI';
import { CalculatorAI } from './archetypes/CalculatorAI';
import { HoarderAI } from './archetypes/HoarderAI';
import { IllusionistAI } from './archetypes/IllusionistAI';
import { createAISafeView } from '../../services/aiDataSanitizer'; // Import the sanitizer

export class AIPlayer {
  private aiImplementations: Map<AIType, AIInterface>;

  constructor() {
    this.aiImplementations = new Map();
    this.aiImplementations.set(AIType.Brute, new BruteAI());
    this.aiImplementations.set(AIType.Calculator, new CalculatorAI());
    this.aiImplementations.set(AIType.Hoarder, new HoarderAI());
    this.aiImplementations.set(AIType.Illusionist, new IllusionistAI());
    // AIType.Default will fallback to BruteAI or a specific simple AI if needed.
  }

  public async decideNextMove(
    realBoardState: BoardState, // Renamed to indicate it's the full, real board state
    enemy: EnemyInstance,
    player: PlayerState
  ): Promise<AIDecision> {
    const aiTypeFromEnemy = enemy.baseArchetype.aiType;
    let aiInstance = this.aiImplementations.get(aiTypeFromEnemy);

    if (!aiInstance) {
      if (aiTypeFromEnemy === AIType.Default) {
        console.warn(`AI type for archetype "${enemy.archetypeId}" is Default. Defaulting to BruteAI.`);
        aiInstance = this.aiImplementations.get(AIType.Brute);
      } else {
        console.warn(`AI type "${aiTypeFromEnemy}" not implemented for archetype "${enemy.archetypeId}". Defaulting to BruteAI.`);
        aiInstance = this.aiImplementations.get(AIType.Brute);
      }
      
      if (!aiInstance) { // Should not happen if BruteAI is always registered
        throw new Error("Default BruteAI not found in AIPlayer.");
      }
    }
    
    // Sanitize the board state before passing it to the AI
    const safeView: AISafeBoardStateView = createAISafeView(realBoardState);

    return aiInstance.decideNextMove(safeView, enemy, player);
  }
}
