
import {
  EnemyArchetypeId,
  EnemyRank,
  EnemyInstance,
  FuryAbility,
  EnemyArchetypeDefinition,
  RankDefinition,
  DomainAbilityDefinition,
} from '../types';
import {
  ENEMY_ARCHETYPE_DEFINITIONS,
  RANK_DEFINITIONS, // Imported RANK_DEFINITIONS
  FIXED_FURY_ABILITIES_POOL,
  DOMAIN_ABILITIES_POOL,
  BASE_ENEMY_HP, // New base HP
  getDifficultyHpBonus, // New difficulty bonus function
  ARCHETYPE_HP_BONUSES, // New archetype HP bonuses
  RANK_HP_BONUSES, // New rank HP bonuses
} from '../constants/difficultyConstants';
import { ALL_FURY_ABILITIES_MAP } from '../constants';
import { PROLOGUE_LEVEL_ID } from '../constants'; // Import PROLOGUE_LEVEL_ID

let enemyInstanceCounter = 0;

export const createEnemyInstance = (
  archetypeId: EnemyArchetypeId,
  rank: EnemyRank,
  currentRunLevel: number,
  oracleFuryAbility: FuryAbility,
): EnemyInstance => {
  const archetypeDef = ENEMY_ARCHETYPE_DEFINITIONS[archetypeId];
  // const rankDef = RANK_DEFINITIONS[rank]; // hpMultiplier from here is deprecated for HP.

  if (!archetypeDef) {
    throw new Error(`Invalid archetypeId (${archetypeId}) for enemy creation.`);
  }
  
  let maxHp: number;

  if (archetypeId === EnemyArchetypeId.ShadowEmber && currentRunLevel === PROLOGUE_LEVEL_ID) {
    // Special case for Prologue Enemy as per user request ("salvo el primero")
    // We know ShadowEmber always has baseHp defined in its ENEMY_ARCHETYPE_DEFINITIONS entry.
    maxHp = archetypeDef.baseHp!;
  } else {
    // New HP Calculation
    let calculatedHp = BASE_ENEMY_HP;
    calculatedHp += getDifficultyHpBonus(currentRunLevel);
    calculatedHp += currentRunLevel; // Bonus por Posición del Nivel
    calculatedHp += ARCHETYPE_HP_BONUSES[archetypeId] || 0;
    calculatedHp += RANK_HP_BONUSES[rank] || 0;
    maxHp = Math.max(1, calculatedHp); // Ensure HP is at least 1
  }

  // Fury threshold still uses the old rankDef system, assuming this part is unchanged by user.
  // If this also needs overhaul, user should specify. For now, assume it's fine.
  const rankDefForFury = RANK_DEFINITIONS[rank]; 
  const furyActivationThreshold = Math.floor(archetypeDef.baseFuryActivationThreshold * rankDefForFury.furyActivationThresholdMultiplier);


  const furyAbilities: FuryAbility[] = [oracleFuryAbility];

  if (rankDefForFury.fixedFurySlots > 0) {
    if (archetypeDef.fixedFuryId) {
      const fixedFuryFromPool = FIXED_FURY_ABILITIES_POOL[archetypeDef.fixedFuryId];
      const fixedFuryFromMap = ALL_FURY_ABILITIES_MAP.get(archetypeDef.fixedFuryId);
      const fixedFury = fixedFuryFromPool || fixedFuryFromMap;
      
      if (fixedFury) {
        if (typeof fixedFury === 'object' && fixedFury !== null && 'id' in fixedFury && 'name' in fixedFury && 'effectType' in fixedFury) {
           furyAbilities.push(fixedFury as FuryAbility);
        } else {
           console.warn(`Fixed fury ID ${archetypeDef.fixedFuryId} found but is not a valid FuryAbility object. Archetype: ${archetypeId}`);
        }
      } else {
        console.warn(`Fixed fury ID ${archetypeDef.fixedFuryId} not found for archetype ${archetypeId}`);
        const fallbackFuryArray = Array.from(ALL_FURY_ABILITIES_MAP.values());
        if (fallbackFuryArray.length > 0) {
             const randomFallbackFury = fallbackFuryArray[Math.floor(Math.random() * fallbackFuryArray.length)];
             if (randomFallbackFury) {
                furyAbilities.push(randomFallbackFury);
             }
        }
      }
    }
  }

  let domainAbility: DomainAbilityDefinition | undefined = undefined;
  if (rankDefForFury.hasDomainAbility && archetypeDef.domainAbilityId) {
    domainAbility = DOMAIN_ABILITIES_POOL[archetypeDef.domainAbilityId];
    if (!domainAbility) {
        console.warn(`Domain ability ID ${archetypeDef.domainAbilityId} not found for archetype ${archetypeId}`);
    }
  }

  return {
    id: `enemyInstance-${enemyInstanceCounter++}`,
    name: `${archetypeDef.name} (${rank})`,
    archetypeId,
    rank,
    currentHp: maxHp,
    maxHp,
    currentFuryCharge: 0,
    furyActivationThreshold,
    armor: 0, 
    furyAbilities,
    activeFuryCycleIndex: 0,
    domainAbility,
    baseArchetype: archetypeDef,
  };
};