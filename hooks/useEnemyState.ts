import { useState } from 'react';
import { EnemyInstance, EnemyArchetypeId, EnemyRank } from '../types';
import { ENEMY_ARCHETYPE_DEFINITIONS, PROLOGUE_ENEMY_SHADOW_EMBER } from '../constants'; // Assuming PROLOGUE_ENEMY_SHADOW_EMBER is in constants

// Initial dummy enemy definition
const initialDummyEnemyArchetype = ENEMY_ARCHETYPE_DEFINITIONS[PROLOGUE_ENEMY_SHADOW_EMBER.id as EnemyArchetypeId];
const getInitialEnemyState = (): EnemyInstance => ({
  id: 'dummy-init',
  name: "Abyssal Foe (Init)",
  archetypeId: PROLOGUE_ENEMY_SHADOW_EMBER.id as EnemyArchetypeId,
  rank: EnemyRank.Minion,
  currentHp: 10,
  maxHp: 10,
  currentFuryCharge: 0,
  furyActivationThreshold: 10,
  armor: 0,
  furyAbilities: [], // Should be initialized based on archetype later
  activeFuryCycleIndex: 0,
  baseArchetype: initialDummyEnemyArchetype, // Store the base archetype for reference
  // nextEnemyFuryIsDoubled: false, // This property might be added if needed from original useGameEngine
});

export interface UseEnemyStateReturn {
  enemy: EnemyInstance;
  setEnemy: React.Dispatch<React.SetStateAction<EnemyInstance>>;
  // Potentially other enemy-specific actions can be added here
}

export const useEnemyState = (): UseEnemyStateReturn => {
  const [enemy, setEnemy] = useState<EnemyInstance>(getInitialEnemyState());

  // Add any enemy-specific logic or effects here if needed in the future

  return { enemy, setEnemy };
};
