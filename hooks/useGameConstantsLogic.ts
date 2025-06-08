// hooks/useGameConstantsLogic.ts
import { useCallback } from 'react';
import { Echo, FuryAbility, PlayerState, MetaProgressState, LevelEchoChoiceSource, Rarity, EchoEffectType } from '../types';
import {
    ALL_ECHOS_MAP, ALL_ECHOS_LIST, // ALL_ECHOS_LIST for prologue choices if needed
    INITIAL_STARTING_ECHOS, // Used as a base for choice pool
    NEW_AVAILABLE_ECHOS_FOR_TREE, // Used for upgrades
    FREE_ECHO_OPTIONS,
    ALL_FURY_ABILITIES_MAP,
    INITIAL_STARTING_FURIESS, // For oracle default/fallback
    FURY_ABILITIES_TO_AWAKEN_SEQUENTIALLY, // For oracle progression
    PROLOGUE_PREDEFINED_ECHO_CHOICES_BASE_IDS,
    BASE_ECHO_APRENDIZAJE_RAPIDO
} from '../constants';

export interface UseGameConstantsLogicProps {
  // This hook is designed to be mostly pure logic based on constants and passed-in state.
  // No internal state that needs props for initialization at the moment.
}

export const useGameConstantsLogic = (props?: UseGameConstantsLogicProps) => {

  const generateEchoChoicesForPostLevelScreen = useCallback((
    isPrologue: boolean, // Combined currentLevel and isPrologueActive
    currentLevelForProlog: number, // Specifically PROLOGUE_LEVEL_ID
    currentActiveEcos: Echo[],
    currentPlayer: PlayerState,
    currentMetaProgress: MetaProgressState | null, // Can be null if not loaded
    choiceSource: LevelEchoChoiceSource = LevelEchoChoiceSource.StandardLevelReward, // Not used in original, but good for future
    numChoices: number = 3
  ): Echo[] => {
    if (!currentMetaProgress) return [...FREE_ECHO_OPTIONS].slice(0, numChoices); // Fallback if metaProgress not loaded

    if (isPrologue && currentLevelForProlog === PROLOGUE_PREDEFINED_ECHO_CHOICES_BASE_IDS.length) { // Assuming level 0 is prologue
        const prologueChoices = PROLOGUE_PREDEFINED_ECHO_CHOICES_BASE_IDS
          .map(baseId => ALL_ECHOS_LIST.find(e => e.baseId === baseId && e.level === 1))
          .filter(Boolean) as Echo[];
        const freeHeal = ALL_ECHOS_LIST.find(e => e.id === 'eco_recover_hp_free_1');
        if (freeHeal && prologueChoices.length < numChoices) prologueChoices.push(freeHeal);
        return prologueChoices.slice(0, numChoices);
    }

    const aprendizajeRapidoEcho = currentActiveEcos.find(e => e.baseId === BASE_ECHO_APRENDIZAJE_RAPIDO);
    const baseEchoLevels: Record<string, number> = {};
    currentActiveEcos.forEach(ae => { baseEchoLevels[ae.baseId] = Math.max(baseEchoLevels[ae.baseId] || 0, ae.level); });

    const availableUpgradesAndNewEcos: Echo[] = [];

    currentMetaProgress.unlockedEchoBaseIds.forEach(unlockedBaseId => {
        const echoIsActive = currentActiveEcos.some(ae => ae.baseId === unlockedBaseId);
        if (!echoIsActive) {
            const lvl1Echo = ALL_ECHOS_LIST.find(e => e.baseId === unlockedBaseId && e.level === 1);
            if (lvl1Echo && !availableUpgradesAndNewEcos.some(existing => existing.id === lvl1Echo.id)) {
                availableUpgradesAndNewEcos.push(lvl1Echo);
            }
        }
    });

    currentActiveEcos.forEach(activeEcho => {
        const potentialUpgrade = NEW_AVAILABLE_ECHOS_FOR_TREE.find(treeEcho =>
            treeEcho.baseId === activeEcho.baseId &&
            treeEcho.level === activeEcho.level + 1 &&
            currentMetaProgress.unlockedEchoBaseIds.includes(treeEcho.baseId)
        );
        if (potentialUpgrade && !availableUpgradesAndNewEcos.some(existing => existing.id === potentialUpgrade.id)) {
            availableUpgradesAndNewEcos.push(potentialUpgrade);
        }
    });

    let choicePool: Echo[] = [...INITIAL_STARTING_ECHOS, ...availableUpgradesAndNewEcos];
    choicePool = Array.from(new Map(choicePool.map(item => [item.id, item])).values());
    choicePool = choicePool.filter(echo => {
        const activeVersion = currentActiveEcos.find(ae => ae.baseId === echo.baseId);
        if (activeVersion) return echo.level > activeVersion.level;
        return true;
    });

    const freeEchoInstance = { ...(FREE_ECHO_OPTIONS[Math.floor(Math.random() * FREE_ECHO_OPTIONS.length)] || ALL_ECHOS_MAP.get('eco_recover_hp_free_1')) } as Echo;
    if (freeEchoInstance && aprendizajeRapidoEcho && freeEchoInstance.effectType === EchoEffectType.GainHP && typeof freeEchoInstance.value === 'number') {
        freeEchoInstance.value = Math.max(1, freeEchoInstance.value + 1);
        freeEchoInstance.description = `Restaura <strong>${freeEchoInstance.value} HP</strong>. Un respiro en la oscuridad.`;
    }

    const finalChoices: Echo[] = freeEchoInstance ? [freeEchoInstance] : [];
    const nonFreePool = choicePool.filter(e => !e.isFree);
    nonFreePool.sort(() => 0.5 - Math.random());

    for(let i = 0; finalChoices.length < numChoices && i < nonFreePool.length; i++) {
        if (!finalChoices.some(fc => fc.id === nonFreePool[i].id)) {
            finalChoices.push(nonFreePool[i]);
        }
    }
    // Fill up if not enough unique choices, even with duplicates (should be rare)
    let poolIdx = 0;
    while(finalChoices.length < numChoices && nonFreePool.length > 0) {
        finalChoices.push(nonFreePool[poolIdx++ % nonFreePool.length]);
    }

    return finalChoices.slice(0, numChoices);
  }, []);


  const getFuryOptionsForOracle = useCallback((
    awakenedFuryIds: string[],
    nextOracleOnlyCommon: boolean,
    numOptions: number = 3,
  ): FuryAbility[] => {
    let pool = [...INITIAL_STARTING_FURIESS]; // Start with initial furies

    // Add awakened furies to the pool if they are not already in (by ID)
    awakenedFuryIds.forEach(id => {
        const fury = ALL_FURY_ABILITIES_MAP.get(id);
        if (fury && !pool.some(p => p.id === id)) {
            pool.push(fury);
        }
    });

    if (nextOracleOnlyCommon) {
        pool = pool.filter(f => f.rarity === Rarity.Common);
    }

    // If pool is empty after filtering (e.g. no common furies awakened and nextOracleOnlyCommon is true),
    // fall back to the initial starting furies (ignoring common filter for fallback).
    if (pool.length === 0) {
        pool = [...INITIAL_STARTING_FURIESS];
    }

    // Shuffle the pool
    pool.sort(() => 0.5 - Math.random());

    // Select unique options
    const selectedOptionsMap = new Map<string, FuryAbility>();
    for(const fury of pool) {
        if(selectedOptionsMap.size < numOptions && !selectedOptionsMap.has(fury.id)) {
            selectedOptionsMap.set(fury.id, fury);
        }
        if(selectedOptionsMap.size >= numOptions) break;
    }

    let finalSelectedOptions = Array.from(selectedOptionsMap.values());

    // If not enough unique options, fill up with duplicates (should be rare with enough furies)
    let poolIndexForFill = 0;
    while (finalSelectedOptions.length < numOptions && pool.length > 0) {
        const candidate = pool[poolIndexForFill % pool.length]; // Cycle through pool
        finalSelectedOptions.push(candidate); // Add, even if duplicate, to meet numOptions
        poolIndexForFill++;
        if (poolIndexForFill > pool.length * 2 && finalSelectedOptions.length < numOptions) {
             // Safety break to prevent infinite loop if pool is small and all are already picked
            break;
        }
    }
    return finalSelectedOptions.slice(0, numOptions);
  }, []);

  return {
    generateEchoChoicesForPostLevelScreen,
    getFuryOptionsForOracle,
  };
};
