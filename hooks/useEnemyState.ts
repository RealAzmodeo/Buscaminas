// hooks/useEnemyState.ts
import { useState } from 'react';
import { EnemyInstance, EnemyArchetypeId, EnemyRank } from '../types';
import { ENEMY_ARCHETYPE_DEFINITIONS, PROLOGUE_ENEMY_SHADOW_EMBER } from '../constants'; // Constants for initial enemy

// Define a more robust initial enemy, similar to what was in useGameEngine
const getInitialEnemy = (): EnemyInstance => {
  const archetypeId = PROLOGUE_ENEMY_SHADOW_EMBER.id as EnemyArchetypeId; // Or a more generic default
  const baseArchetype = ENEMY_ARCHETYPE_DEFINITIONS[archetypeId];
  if (!baseArchetype) {
    console.error(`Initial enemy archetype ${archetypeId} not found!`);
    // Fallback to a very basic structure if constants are not fully loaded or misconfigured
    return {
        id: 'enemy_fallback_error', archetypeId: EnemyArchetypeId.DEBUG_TARGET_DUMMY, rank: EnemyRank.Minion,
        name: "Error Foe", icon: "❓", currentHp: 1, maxHp: 1, currentFuryCharge: 0, furyActivationThreshold: 100,
        armor: 0, furyAbilities: [], activeFuryCycleIndex: 0, baseArchetype: { id: EnemyArchetypeId.DEBUG_TARGET_DUMMY, name:"Error Foe", icon:"❓", baseHp:1, hpPerLevelMultiplier:0,baseFuryActivationThreshold:100, aiType:"default", furyCycle:[], isSpecial:false, baseArmor:0 }
    };
  }
  return {
    id: 'enemy_initial_dummy',
    archetypeId: archetypeId,
    rank: EnemyRank.Minion, // Default rank
    name: baseArchetype.name, // "Abyssal Foe (Init)" or from archetype
    icon: baseArchetype.icon,
    currentHp: baseArchetype.baseHp, // Or a default like 10
    maxHp: baseArchetype.baseHp,     // Or a default like 10
    currentFuryCharge: 0,
    furyActivationThreshold: baseArchetype.baseFuryActivationThreshold, // Or a default like 10
    armor: baseArchetype.baseArmor || 0,
    furyAbilities: [], // Populated by encounter generator
    activeFuryCycleIndex: 0,
    baseArchetype: baseArchetype,
  };
};

export const useEnemyState = () => {
  const [enemy, setEnemy] = useState<EnemyInstance | null>(getInitialEnemy());

  // Functions to load specific enemies or reset state could be added here.
  // For now, only state and setter are returned as per plan.
  return { enemy, setEnemy, getInitialEnemy }; // Exporting getInitialEnemy for reset/initialization
};
