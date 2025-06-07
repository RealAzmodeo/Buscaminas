
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  PlayerState, BoardState, CellState, CellType, Echo, GameStatus, EchoEffectType,
  FuryAbility, FuryMinigamePhase, FuryAbilityEffectType, GameStateCore, GamePhase,
  MarkType, Rarity, RunStats, GameEvent, FloatingTextEventPayload, DeactivatedEchoInfo, MetaProgressState,
  EcoTreeNodeData, GoalProgress, GoalDefinition, GoalCellRevealedPayload, GoalEnemyDefeatedPayload, GoalLevelCompletedPayload,
  BoardConfig, GuidingTextKey, RunMapState, RunMapNode, BiomeId, MapRewardType, MapEncounterType,
  EnemyInstance, BoardParameters, EnemyRank, EnemyArchetypeId, AICellInfo, CellPosition
} from '../types';
import {
  BOARD_ROWS as DEFAULT_BOARD_ROWS, BOARD_COLS as DEFAULT_BOARD_COLS,
  PROLOGUE_BOARD_ROWS, PROLOGUE_BOARD_COLS,
  INITIAL_PLAYER_HP, INITIAL_PLAYER_GOLD, INITIAL_PLAYER_SHIELD, GOLD_REWARD_PER_LEVEL, ATTACK_DAMAGE_PLAYER_VS_ENEMY, ATTACK_DAMAGE_ENEMY_VS_PLAYER,
  GOLD_VALUE, ALL_ECHOS_MAP, BASE_ECHO_ECO_CASCADA, BASE_ECHO_VENGANZA_ESPECTRAL, BASE_ECHO_MAESTRIA_ESTOCADA,
  BASE_ECHO_TORRENTE_ACERO, BASE_ECHO_BOLSA_AGRANDADA, BASE_ECHO_PIEL_PIEDRA, BASE_ECHO_ULTIMO_ALIENTO,
  BASE_ECHO_INSTINTO_BUSCADOR, BASE_ECHO_ALQUIMIA_IMPROVISADA, BASE_ECHO_OJO_OMNISCIENTE, BASE_ECHO_PASO_LIGERO,
  BASE_ECHO_MARCADOR_TACTICO, BASE_ECHO_CARTOGRAFIA_AVANZADA, BASE_ECHO_APRENDIZAJE_RAPIDO, BASE_ECHO_DETECTOR_PELIGROS,
  BASE_ECHO_SENTIDO_ACERO, BASE_ECHO_VISION_AUREA, BASE_ECHO_CLARIVIDENCIA_TOTAL, BASE_ECHO_CORAZON_ABISMO,
  INITIAL_STARTING_ECHOS, FREE_ECHO_OPTIONS, INITIAL_STARTING_FURIESS,
  SOUL_FRAGMENTS_PER_ENEMY_DEFEAT, SOUL_FRAGMENTS_PER_LEVEL_COMPLETE, SOUL_FRAGMENTS_END_RUN_MULTIPLIER,
  NEW_AVAILABLE_ECHOS_FOR_TREE, ALL_ECHOS_LIST, INITIAL_MAX_SOUL_FRAGMENTS, INITIAL_WILL_LUMENS,
  MINI_ARENA_SIZES, MAX_ARENA_REDUCTIONS, MINI_ARENA_ATTACK_MARGIN, MINI_ARENA_ATTACK_DENSITY_FACTOR_PERCENT,
  BATTLEFIELD_TRANSITION_DURATION_MS,
  DEFAULT_LEVELS_PER_STRETCH, MAP_NODE_REWARD_SOUL_FRAGMENTS_VALUE, MAP_DEFAULT_DEPTH, MAP_CHOICES_PER_NODE_MIN, MAP_CHOICES_PER_NODE_MAX, MAP_NODE_REWARD_WILL_LUMENS_VALUE, MAP_NODE_REWARD_HEALING_FOUNTAIN_VALUE,
  PROLOGUE_LEVEL_ID,
  PROLOGUE_ENEMY_SHADOW_EMBER,
  PROLOGUE_SHADOW_EMBER_FURY_ABILITY,
  PROLOGUE_BOARD_CONFIG,
  PROLOGUE_PREDEFINED_ECHO_CHOICES_BASE_IDS,
  FURY_INCREMENT_PER_CLICK,
  ALL_FURY_ABILITIES_MAP
} from '../constants';
import { BIOME_DEFINITIONS } from '../constants/biomeConstants';
import { MIRROR_UPGRADES_CONFIG, INITIAL_GOALS_CONFIG, GOAL_IDS, MIRROR_UPGRADE_IDS } from '../constants/metaProgressionConstants';
import { OBJECT_RATIO_DEFINITIONS, ENEMY_ARCHETYPE_DEFINITIONS, FLOOR_DEFINITIONS } from '../constants/difficultyConstants';
import { generateEncounterForFloor } from '../services/encounterGenerator';
import { createEnemyInstance } from '../services/enemyFactory';
import { playMidiSoundPlaceholder } from '../utils/soundUtils';
import { GoalTrackingService } from '../services/goalTrackingService';
import { AIPlayer } from '../core/ai/AIPlayer';

export const PROLOGUE_MESSAGES: Record<number | string, string> = {
  1: "Bienvenido a Numeria's Edge. Revela casillas para encontrar tu camino.",
  2: "Los números son <strong>Pistas</strong>. Indican cuántos objetos (<strong>Ataque</strong> u Oro) hay en las casillas adyacentes.",
  3: "¡Una casilla de <strong>Ataque</strong>! Si la revelas tú, dañas al enemigo. Si la revela el enemigo, te daña a ti.",
  4: "¡<strong>Oro</strong>! Acumúlalo para adquirir Ecos poderosos entre niveles.",
  5: "¡Cuidado, una casilla de <strong>Ataque</strong> revelada por el enemigo te daña!",
  6: "La barra de <strong>Furia</strong> del enemigo aumenta con cada casilla. Este enemigo es débil; su Furia no se desatará.",
  7: "Has derrotado a tu primer enemigo. El Abismo responde con un Eco... Elige sabiamente.",
  8: "Has elegido un <strong>Eco</strong>. Estos artefactos otorgan poderes pasivos.",
  9: "Antes de adentrarte más... el Abismo exige un augurio. El <strong>Oráculo de la Agonía</strong> revelará la forma de la Furia que te espera en el próximo nivel.",
  10: "Contempla los rostros del tormento que aguarda. Memoriza sus efectos.",
  11: "El caos arremolina el futuro... Las cartas se mezclan.",
  12: "Sella el pacto. ¿Qué sombra invocarás para el Nivel 1?",
  13: "Así está escrito. Esta Furia te esperará en el Nivel 1. Prepárate.",
  'BATTLEFIELD_REDUCTION_START': "¡No quedan más casillas de Ataque seguras! ¡El Abismo exige una conclusión!",
  'BATTLEFIELD_REDUCTION_COMPLETE': "El campo de batalla se encoge... ¡prepárate!",
};

const PLAYER_ACTION_RESOLVE_DELAY_MS = 300;
const ENEMY_THINKING_MIN_DURATION_MS = 1500;
const ENEMY_THINKING_MAX_DURATION_MS = 3000;
const ENEMY_THINKING_HIGHLIGHT_INTERVAL_MS = 150;
const ENEMY_ACTION_PENDING_REVEAL_DELAY_MS = 500;
const ENEMY_ACTION_RESOLVE_DELAY_MS = 300;
const ENEMY_FURY_GAIN_ON_GOLD_REVEAL = 5;

const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getCurrentFloorNumber = (level: number): number => {
  if (level <= 0) return 0;
  const floorConfig = FLOOR_DEFINITIONS.find(f => level <= (f.floorNumber * 2 + (f.floorNumber-1)));
  return floorConfig ? floorConfig.floorNumber : FLOOR_DEFINITIONS[FLOOR_DEFINITIONS.length -1].floorNumber;
};

const initialRunStats: RunStats = {
  enemiesDefeatedThisRun: 0,
  attacksTriggeredByPlayer: 0,
  attacksTriggeredByEnemy: 0,
  goldCellsRevealedThisRun: 0,
  clicksOnBoardThisRun: 0,
  nonFreeEcosAcquiredThisRun: 0,
  trapsTriggeredThisRun: 0,
  soulFragmentsEarnedThisRun: 0,
  levelsCompletedWithoutDamageThisRun: 0,
  levelsCompletedThisRun: 0,
  runUniqueEcosActivated: [],
  runUniqueFuriesExperienced: [],
  newlyCompletedGoalIdsThisRun: [],
  swordUsedThisLevel: false, // Now attackUsedThisLevelByPlayer
  swordUsedThisLevelForMirror: false, // Now attackUsedThisLevelForMirror
};

const getInitialMetaProgress = (): MetaProgressState => {
    const initialGoalsProgress: Record<string, GoalProgress> = {};
    INITIAL_GOALS_CONFIG.forEach(goalDef => {
        initialGoalsProgress[goalDef.id] = {
            currentValue: 0,
            completed: false,
            claimed: false,
        };
    });
    const initialMirrorUpgrades: Record<string, number> = {};
    MIRROR_UPGRADES_CONFIG.forEach(upgradeDef => {
        initialMirrorUpgrades[upgradeDef.id] = 0;
    });

    return {
        soulFragments: 0,
        maxSoulFragments: INITIAL_MAX_SOUL_FRAGMENTS,
        willLumens: INITIAL_WILL_LUMENS,
        mirrorUpgrades: initialMirrorUpgrades,
        goalsProgress: initialGoalsProgress,
        unlockedEchoBaseIds: [],
        awakenedFuryIds: [],
        furyAwakeningProgress: 0,
        nextFuryToAwakenIndex: 0,
        firstSanctuaryVisit: true,
        hasCompletedFirstRun: false,
    };
};

const getCurrentlyEffectiveEcos = (allActiveEcos: Echo[], deactivatedEcosInfo: DeactivatedEchoInfo[]): Echo[] => {
  if (!deactivatedEcosInfo || deactivatedEcosInfo.length === 0) {
    return allActiveEcos;
  }
  const deactivatedIds = new Set(deactivatedEcosInfo.map(info => info.echoId));
  return allActiveEcos.filter(echo => !deactivatedIds.has(echo.id));
};

const getFuryOptionsForOracle = (level: number, awakenedFuryIds: string[], nextOracleOnlyCommon: boolean): FuryAbility[] => {
    let pool = [...INITIAL_STARTING_FURIESS];
    awakenedFuryIds.forEach(id => {
        const fury = ALL_FURY_ABILITIES_MAP.get(id);
        if (fury && !pool.some(p => p.id === id)) {
            pool.push(fury);
        }
    });

    if (nextOracleOnlyCommon) {
        pool = pool.filter(f => f.rarity === Rarity.Common);
    }
     if (pool.length === 0) { pool = [...INITIAL_STARTING_FURIESS]; }

    pool.sort(() => 0.5 - Math.random());
    const selectedOptionsMap = new Map<string, FuryAbility>();
    for(const fury of pool) {
        if(selectedOptionsMap.size < 3 && !selectedOptionsMap.has(fury.id)) {
            selectedOptionsMap.set(fury.id, fury);
        }
        if(selectedOptionsMap.size >= 3) break;
    }
    let finalSelectedOptions = Array.from(selectedOptionsMap.values());
    let poolIndex = 0;
    while (finalSelectedOptions.length < 3 && pool.length > 0) {
        const candidate = pool[poolIndex % pool.length];
        if(!finalSelectedOptions.some(f => f.id === candidate.id)) finalSelectedOptions.push(candidate);
        poolIndex++;
         if (poolIndex > pool.length * 2 && finalSelectedOptions.length < 3) break;
    }
    return finalSelectedOptions.slice(0, 3);
};


export const useGameEngine = () => {
  const eventIdCounter = useRef(0);
  const [metaProgress, setMetaProgressState] = useState<MetaProgressState>(getInitialMetaProgress());


  const initialDummyEnemyArchetype = ENEMY_ARCHETYPE_DEFINITIONS[PROLOGUE_ENEMY_SHADOW_EMBER.id as EnemyArchetypeId];
  const initialDummyEnemy: EnemyInstance = {
      id: 'dummy-init', name: "Abyssal Foe (Init)", archetypeId: PROLOGUE_ENEMY_SHADOW_EMBER.id as EnemyArchetypeId, rank: EnemyRank.Minion,
      currentHp: 10, maxHp: 10, currentFuryCharge: 0, furyActivationThreshold: 10, armor: 0,
      furyAbilities: [], activeFuryCycleIndex: 0, baseArchetype: initialDummyEnemyArchetype,
  };

  const [gameState, setGameState] = useState<GameStateCore>({
    status: GameStatus.MainMenu,
    currentPhase: GamePhase.PLAYER_TURN,
    currentLevel: PROLOGUE_LEVEL_ID,
    currentFloor: 0,
    isFuryMinigameActive: false,
    furyMinigamePhase: 'inactive',
    furyMinigameCompletedForThisLevel: false,
    furyCardOptions: [],
    shuffledFuryCardOrder: [0,1,2],
    playerSelectedFuryCardDisplayIndex: null,
    oracleSelectedFuryAbility: null,
    isPrologueActive: false,
    prologueStep: 0,
    prologueEnemyFuryAbility: null,
    conditionalEchoTriggeredId: null,
    isCorazonDelAbismoChoiceActive: false,
    corazonDelAbismoOptions: null,
    eventQueue: [],
    playerTookDamageThisLevel: false,
    currentArenaLevel: 0,
    maxArenaReductions: MAX_ARENA_REDUCTIONS,
    isBattlefieldReductionTransitioning: false,
    guidingTextKey: '',
    defeatReason: 'standard',
    currentBoardDimensions: { rows: DEFAULT_BOARD_ROWS, cols: DEFAULT_BOARD_COLS },
    currentRunMap: null,
    currentBiomeId: BiomeId.Default,
    levelsInCurrentStretch: DEFAULT_LEVELS_PER_STRETCH,
    currentStretchCompletedLevels: 0,
    stretchStartLevel: PROLOGUE_LEVEL_ID,
    mapDecisionPending: false,
    stretchRewardPending: null,
    postLevelActionTaken: false,
    aiThinkingCellCoords: null,
    aiActionTargetCell: null,
  });
  const [player, setPlayer] = useState<PlayerState>({
    hp: INITIAL_PLAYER_HP, maxHp: INITIAL_PLAYER_HP, gold: INITIAL_PLAYER_GOLD, shield: INITIAL_PLAYER_SHIELD,
    venganzaSpectralCharge: 0, consecutiveSwordsRevealed: 0,
    firstBombDamageTakenThisLevel: false, swordDamageModifier: 0, swordDamageModifierClicksRemaining: 0,
    ultimoAlientoUsedThisRun: false, isInvulnerable: false, invulnerabilityClicksRemaining: 0, criticalHitClicksRemaining: 0,
    alquimiaImprovisadaChargeAvailable: false, alquimiaImprovisadaActiveForNextBomb: false,
    vinculoDolorosoActive: false, vinculoDolorosoClicksRemaining: 0,
    pasoLigeroTrapIgnoredThisLevel: false, ojoOmniscienteUsedThisLevel: false,
    debuffEspadasOxidadasClicksRemaining: 0, deactivatedEcos: [],
    nextEchoCostsDoubled: false, nextOracleOnlyCommonFury: false,
    pistasFalsasClicksRemaining: 0, paranoiaGalopanteClicksRemaining: 0,
  });
  const [enemy, setEnemy] = useState<EnemyInstance>(initialDummyEnemy);
  const [board, setBoard] = useState<BoardState>([]);
  const [activeEcos, setActiveEcosState] = useState<Echo[]>([]);
  const [availableEchoChoices, setAvailableEchoChoices] = useState<Echo[]>([]);
  const [runStats, setRunStats] = useState<RunStats>(initialRunStats);

  const ftueEventTracker = useRef<{
    firstClueRevealed?: boolean;
    firstAttackRevealedByPlayer?: boolean; // Changed from firstSwordRevealed
    firstGoldRevealed?: boolean;
    firstAttackRevealedByEnemy?: boolean; // Changed from firstBombRevealed
  }>({});

  const conditionalEchoTimeoutRef = useRef<number | null>(null);
  const wasCorazonDelAbismoChoiceActivePreviously = useRef(gameState.isCorazonDelAbismoChoiceActive);
  const battlefieldReductionTimeoutRef = useRef<number | null>(null);
  const aiThinkingIntervalRef = useRef<number | null>(null);
  const phaseTransitionTimeoutRef = useRef<number | null>(null);

  const aiPlayerRef = useRef<AIPlayer>(new AIPlayer());

  const saveMetaProgress = useCallback((currentMeta: MetaProgressState) => {
    try {
      localStorage.setItem('numeriasEdgeMetaProgress', JSON.stringify(currentMeta));
    } catch (error) {
      console.error("Error saving meta progress to localStorage:", error);
    }
  }, []);

  const loadMetaProgress = useCallback(() => {
    try {
      const saved = localStorage.getItem('numeriasEdgeMetaProgress');
      if (saved) {
        const loadedMeta = JSON.parse(saved) as MetaProgressState;
        const defaultMeta = getInitialMetaProgress();
        const mergedMeta = {
            ...defaultMeta,
            ...loadedMeta,
            mirrorUpgrades: { ...defaultMeta.mirrorUpgrades, ...(loadedMeta.mirrorUpgrades || {}) },
            goalsProgress: { ...defaultMeta.goalsProgress, ...(loadedMeta.goalsProgress || {}) },
        };
        INITIAL_GOALS_CONFIG.forEach(goalDef => {
            if (!mergedMeta.goalsProgress[goalDef.id]) {
                mergedMeta.goalsProgress[goalDef.id] = { currentValue: 0, completed: false, claimed: false };
            }
        });
        setMetaProgressState(mergedMeta);
      } else {
        setMetaProgressState(getInitialMetaProgress());
      }
    } catch (error) {
      console.error("Error loading meta progress from localStorage:", error);
      setMetaProgressState(getInitialMetaProgress());
    }
  }, []);


  useEffect(() => {
    loadMetaProgress();
  }, [loadMetaProgress]);

  const setAndSaveMetaProgress = useCallback((updater: React.SetStateAction<MetaProgressState>) => {
    setMetaProgressState(prevMeta => {
      const newState = typeof updater === 'function' ? updater(prevMeta) : updater;
      const newlyCompletedThisUpdate: string[] = [];
      if (gameState.status === GameStatus.Playing || gameState.status === GameStatus.PostLevel) {
          INITIAL_GOALS_CONFIG.forEach(goalDef => {
              const oldGoalProg = prevMeta.goalsProgress[goalDef.id];
              const newGoalProg = newState.goalsProgress[goalDef.id];
              if (newGoalProg && newGoalProg.completed && !newGoalProg.claimed) {
                  if (!oldGoalProg || !oldGoalProg.completed) {
                      newlyCompletedThisUpdate.push(goalDef.id);
                  }
              }
          });
      }
      if (newlyCompletedThisUpdate.length > 0) {
          setRunStats(prevRunStats => {
              const updatedNewlyCompleted = Array.from(new Set([...prevRunStats.newlyCompletedGoalIdsThisRun, ...newlyCompletedThisUpdate]));
              return { ...prevRunStats, newlyCompletedGoalIdsThisRun: updatedNewlyCompleted };
          });
      }
      saveMetaProgress(newState);
      return newState;
    });
  }, [saveMetaProgress, gameState.status]);


  const addGameEvent = useCallback((payload: FloatingTextEventPayload | any, type: GameEvent['type'] = 'FLOATING_TEXT') => {
    const newEvent: GameEvent = { id: `event-${eventIdCounter.current++}`, type, payload };
    setGameState(prev => ({ ...prev, eventQueue: [...prev.eventQueue, newEvent] }));
  }, []);

  const popEvent = useCallback((): GameEvent | undefined => {
    let eventToReturn: GameEvent | undefined = undefined;
    setGameState(prev => {
      if (prev.eventQueue.length === 0) return prev;
      eventToReturn = prev.eventQueue[0];
      return { ...prev, eventQueue: prev.eventQueue.slice(1) };
    });
    return eventToReturn;
  }, []);

  const setGamePhase = useCallback((newPhase: GamePhase) => {
    console.log(`Transitioning to phase: ${newPhase}`);
    setGameState(prev => ({ ...prev, currentPhase: newPhase }));
  }, []);

  const setGameStatus = useCallback((newStatus: GameStatus, newDefeatReason: 'standard' | 'attrition' = 'standard') => {
    if (newStatus === GameStatus.GameOverDefeat || newStatus === GameStatus.GameOverWin) {
        const finalFragmentsForRun = runStats.soulFragmentsEarnedThisRun + (gameState.currentLevel * SOUL_FRAGMENTS_END_RUN_MULTIPLIER);
        setAndSaveMetaProgress(prevMeta => ({
            ...prevMeta,
            soulFragments: Math.min(prevMeta.maxSoulFragments, prevMeta.soulFragments + finalFragmentsForRun),
        }));
        setRunStats(prevRunStats => ({...prevRunStats, soulFragmentsEarnedThisRun: finalFragmentsForRun }));
        if (gameState.currentLevel >= 1 && gameState.status === GameStatus.Playing) {
             GoalTrackingService.processEvent('PROLOGUE_COMPLETED', null, metaProgress, setAndSaveMetaProgress);
        }
    }
    if (newStatus === GameStatus.Sanctuary && metaProgress.firstSanctuaryVisit) {
        GoalTrackingService.processEvent('SANCTUARY_FIRST_VISIT', null, metaProgress, setAndSaveMetaProgress);
        setAndSaveMetaProgress(prev => ({...prev, firstSanctuaryVisit: false }));
    }
    setGameState(prev => ({ ...prev, status: newStatus, defeatReason: newStatus === GameStatus.GameOverDefeat ? newDefeatReason : 'standard' }));
  }, [runStats.soulFragmentsEarnedThisRun, gameState.currentLevel, gameState.status, setAndSaveMetaProgress, metaProgress]);


  useEffect(() => {
    if (player.hp <= 0 && gameState.status === GameStatus.Playing) {
      playMidiSoundPlaceholder('player_defeat');
      setGameStatus(GameStatus.GameOverDefeat);
    }
  }, [player.hp, gameState.status, setGameStatus]);


  const confirmAndAbandonRun = useCallback(() => {
    playMidiSoundPlaceholder('abandon_run_confirmed');
    setGameStatus(GameStatus.GameOverDefeat);
  }, [setGameStatus]);


  const advancePrologueStep = useCallback((specificStepOrKey?: number | GuidingTextKey) => {
    setGameState(prev => {
        let newGuidingTextKey: GuidingTextKey = '';
        let newPrologueStep = prev.prologueStep;
        if (typeof specificStepOrKey === 'number') {
            newPrologueStep = specificStepOrKey;
            if (prev.isPrologueActive && PROLOGUE_MESSAGES[newPrologueStep]) {
                newGuidingTextKey = newPrologueStep as keyof typeof PROLOGUE_MESSAGES;
            }
        } else if (typeof specificStepOrKey === 'string') {
            newGuidingTextKey = specificStepOrKey;
            const numericKey = parseInt(specificStepOrKey, 10);
            if (!isNaN(numericKey) && prev.isPrologueActive && PROLOGUE_MESSAGES[numericKey]) {
                 newPrologueStep = numericKey;
            }
        } else {
             if (prev.isPrologueActive && PROLOGUE_MESSAGES[prev.prologueStep]) { newGuidingTextKey = ''; }
        }
        if (newGuidingTextKey && !PROLOGUE_MESSAGES[newGuidingTextKey]) { newGuidingTextKey = ''; }
        return { ...prev, prologueStep: newPrologueStep, guidingTextKey: newGuidingTextKey };
    });
  }, []);

  const triggerConditionalEchoAnimation = useCallback((echoId: string) => {
    if (conditionalEchoTimeoutRef.current) clearTimeout(conditionalEchoTimeoutRef.current);
    setGameState(prev => ({ ...prev, conditionalEchoTriggeredId: echoId }));
    conditionalEchoTimeoutRef.current = window.setTimeout(() => {
      setGameState(prev => ({ ...prev, conditionalEchoTriggeredId: null }));
      conditionalEchoTimeoutRef.current = null;
    }, 1500);
  }, []);

  const recalculateAllClues = useCallback((currentBoard: BoardState): BoardState => {
    const newBoard: BoardState = currentBoard.map(r => r.map(c => ({ ...c })));
    const BOARD_ROWS_FOR_LEVEL = newBoard.length;
    const BOARD_COLS_FOR_LEVEL = newBoard[0]?.length || 0;

    for (let r_idx = 0; r_idx < BOARD_ROWS_FOR_LEVEL; r_idx++) {
      for (let c_idx = 0; c_idx < BOARD_COLS_FOR_LEVEL; c_idx++) {
        if (newBoard[r_idx][c_idx].type === CellType.Clue || newBoard[r_idx][c_idx].type === CellType.Empty) {
            if (!newBoard[r_idx][c_idx].revealed || newBoard[r_idx][c_idx].type === CellType.Empty) { // Also update for empty revealed (holes)
                 newBoard[r_idx][c_idx].type = CellType.Clue;
            }
            let attacksAdj = 0, goldAdj = 0;
            for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = r_idx + dr;
                const nc = c_idx + dc;
                if (nr >= 0 && nr < BOARD_ROWS_FOR_LEVEL && nc >= 0 && nc < BOARD_COLS_FOR_LEVEL) {
                  const neighbor = newBoard[nr][nc];
                  // If a hole (Empty & Revealed) is next to a clue, it shouldn't count for items.
                  if (neighbor.revealed && neighbor.type === CellType.Empty) continue;

                  if (neighbor.type === CellType.Attack) attacksAdj++;
                  else if (neighbor.type === CellType.Gold) goldAdj++;
                }
            }
            newBoard[r_idx][c_idx].adjacentItems = { attacks: attacksAdj, gold: goldAdj, total: attacksAdj + goldAdj };
        }
      }
    }
    return newBoard;
  }, []);

  const updateBoardVisualEffects = useCallback((currentBoard: BoardState, ecosForEffects: Echo[]): BoardState => {
    let newBoard: BoardState = currentBoard.map(row => row.map(cell => ({ ...cell, visualEffect: null })));
    // Visual effects for Attack tiles (pulse-red/glow-blue) are removed as Detector/Sentido now target 'Attack' generally.
    // A new generic 'attack-pulse' could be added if desired.
    return newBoard;
  }, [player.deactivatedEcos]);


  const generateBoardFromBoardParameters = useCallback((params: BoardParameters, currentActiveEcosArg: Echo[]): BoardState => {
    const { rows, cols, densityPercent, objectRatioKey, traps, irregularPatternType } = params;
    const totalCells = rows * cols;

    const isFTUERun = metaProgress.hasCompletedFirstRun === false;

    let newBoard: BoardState = Array(rows).fill(null).map((_, r_idx) =>
        Array(cols).fill(null).map((_, c_idx): CellState => ({
            id: `cell-${r_idx}-${c_idx}-${gameState.currentLevel}-${gameState.currentArenaLevel}-${gameState.currentBiomeId}`,
            row: r_idx, col: c_idx, type: CellType.Empty,
            revealed: false, markType: null, lockedIncorrectlyForClicks: 0, visualEffect: null,
        }))
    );

    let effectiveTotalCells = totalCells;

    if (irregularPatternType === 'ilusionista_holes') {
        const numHoles = Math.max(1, Math.min(Math.floor(totalCells * 0.08), 5));
        let holesPlaced = 0;
        for (let i = 0; i < totalCells * 3 && holesPlaced < numHoles; i++) {
            const r = Math.floor(Math.random() * rows);
            const c = Math.floor(Math.random() * cols);
            if (newBoard[r][c].type === CellType.Empty && !newBoard[r][c].revealed) {
                newBoard[r][c].type = CellType.Empty;
                newBoard[r][c].revealed = true;
                holesPlaced++;
            }
        }
        effectiveTotalCells -= holesPlaced;
    }

    const numTotalItemsToPlaceBasedOnDensity = Math.floor(effectiveTotalCells * (densityPercent / 100));

    // For FTUE, objectRatioKey might be 'ftueAttackClueOnly', which won't be in OBJECT_RATIO_DEFINITIONS.
    // We handle this by overriding numGold and numAttacks later.
    const ratioDef = !isFTUERun ? OBJECT_RATIO_DEFINITIONS[objectRatioKey] : null;
    if (!isFTUERun && !ratioDef) {
        console.warn(`Object ratio definition not found for key: ${objectRatioKey}. Using fallback.`);
        // Fallback or default ratio if a key is bad and not in FTUE
        // For now, this error will propagate if not FTUE. FTUE handles it.
    }
    if (!ratioDef && !isFTUERun) throw new Error(`Object ratio definition not found for key: ${objectRatioKey}`);


    let numAttacks = 0, numGold = 0;

    if (!isFTUERun && ratioDef) { // Standard calculation for non-FTUE
        const ratioPartsSum = ratioDef.attacks + ratioDef.gold;
        if (ratioPartsSum > 0) {
            numAttacks = Math.floor(numTotalItemsToPlaceBasedOnDensity * (ratioDef.attacks / ratioPartsSum));
            numGold = Math.floor(numTotalItemsToPlaceBasedOnDensity * (ratioDef.gold / ratioPartsSum));
        }
    } else if (isFTUERun) {
        numGold = 0; // Force no gold for FTUE
        numAttacks = numTotalItemsToPlaceBasedOnDensity; // All items are attacks
    }

    const effectiveTraps = isFTUERun ? 0 : traps;
    const cellsAvailableForMainItems = effectiveTotalCells - effectiveTraps;
    let currentMainItemSum = numAttacks + numGold;

    if (currentMainItemSum > cellsAvailableForMainItems) {
        const overflow = currentMainItemSum - cellsAvailableForMainItems;
        if (isFTUERun) { // In FTUE, only attacks can overflow
            numAttacks = Math.max(0, numAttacks - overflow);
        } else { // Non-FTUE, distribute overflow reduction
            numAttacks = Math.max(0, numAttacks - Math.ceil(overflow / (numGold > 0 ? 2 : 1) ));
            if (numGold > 0) {
                 numGold = Math.max(0, numGold - Math.floor(overflow / 2));
            }
        }
    }
    currentMainItemSum = numAttacks + numGold; // Recalculate sum after adjustment


    const placeItemsOnBoard = (count: number, itemType: CellType, boardToPlaceOn: BoardState) => {
        let placedCount = 0; let attempts = 0;
        while (placedCount < count && attempts < totalCells * 5) {
            const r = Math.floor(Math.random() * rows);
            const c = Math.floor(Math.random() * cols);

            if (boardToPlaceOn[r][c].type === CellType.Empty && !boardToPlaceOn[r][c].revealed) {
                boardToPlaceOn[r][c].type = itemType;
                placedCount++;
            }
            attempts++;
        }
        if (placedCount < count) console.warn(`Could not place all ${itemType} items. Requested: ${count}, Placed: ${placedCount}`);
    };

    if (!isFTUERun) {
        placeItemsOnBoard(effectiveTraps, CellType.Trap, newBoard);
    }
    placeItemsOnBoard(numAttacks, CellType.Attack, newBoard); // Attacks are always placed
    if (!isFTUERun) {
        placeItemsOnBoard(numGold, CellType.Gold, newBoard);
    }

    newBoard = recalculateAllClues(newBoard);
    newBoard = updateBoardVisualEffects(newBoard, currentActiveEcosArg);

    setGameState(prev => ({...prev, currentBoardDimensions: { rows, cols }}));
    return newBoard;
  }, [recalculateAllClues, updateBoardVisualEffects, gameState.currentLevel, gameState.currentArenaLevel, gameState.currentBiomeId, metaProgress.hasCompletedFirstRun]);


  const generateEchoChoicesForPostLevelScreen = useCallback((levelCompleted: number, currentActiveEcos: Echo[], currentPlayer: PlayerState, currentMetaProgress: MetaProgressState): Echo[] => {
    if (currentMetaProgress.hasCompletedFirstRun === false) {
      return []; // Return no Echo choices for FTUE
    }
    console.log("[GenerateChoices] Unlocked Base IDs in MetaProgress:", currentMetaProgress.unlockedEchoBaseIds);
    if (levelCompleted === PROLOGUE_LEVEL_ID && gameState.isPrologueActive) {
        const prologueChoices = PROLOGUE_PREDEFINED_ECHO_CHOICES_BASE_IDS
          .map(baseId => ALL_ECHOS_LIST.find(e => e.baseId === baseId && e.level === 1))
          .filter(Boolean) as Echo[];
        const freeHeal = ALL_ECHOS_LIST.find(e => e.id === 'eco_recover_hp_free_1');
        if (freeHeal && prologueChoices.length < 3) prologueChoices.push(freeHeal);
        return prologueChoices.slice(0, 3);
    }
    const aprendizajeRapidoEcho = currentActiveEcos.find(e => e.baseId === BASE_ECHO_APRENDIZAJE_RAPIDO);
    const numChoices = 3;
    const baseEchoLevels: Record<string, number> = {};
    currentActiveEcos.forEach(ae => { baseEchoLevels[ae.baseId] = Math.max(baseEchoLevels[ae.baseId] || 0, ae.level); });

    const availableUpgradesAndNewEcos: Echo[] = [];

    // 1. Add Lvl 1 of any base Echo unlocked in the tree, if not already active.
    currentMetaProgress.unlockedEchoBaseIds.forEach(unlockedBaseId => {
        const echoIsActive = currentActiveEcos.some(ae => ae.baseId === unlockedBaseId);
        if (!echoIsActive) {
            const lvl1Echo = ALL_ECHOS_LIST.find(e => e.baseId === unlockedBaseId && e.level === 1);
            if (lvl1Echo && !availableUpgradesAndNewEcos.some(existing => existing.id === lvl1Echo.id)) {
                availableUpgradesAndNewEcos.push(lvl1Echo);
                 console.log(`[GenerateChoices] Added new Lvl1 tree Echo: ${lvl1Echo.name}`);
            }
        }
    });

    // 2. Add available upgrades for Echos (both initial and tree-unlocked ones that are active)
    currentActiveEcos.forEach(activeEcho => {
        const potentialUpgrade = NEW_AVAILABLE_ECHOS_FOR_TREE.find(treeEcho =>
            treeEcho.baseId === activeEcho.baseId &&
            treeEcho.level === activeEcho.level + 1 &&
            currentMetaProgress.unlockedEchoBaseIds.includes(treeEcho.baseId)
        );
        if (potentialUpgrade && !availableUpgradesAndNewEcos.some(existing => existing.id === potentialUpgrade.id)) {
            availableUpgradesAndNewEcos.push(potentialUpgrade);
            console.log(`[GenerateChoices] Added upgrade for active Echo: ${potentialUpgrade.name}`);
        }
    });


    let choicePool: Echo[] = [...INITIAL_STARTING_ECHOS, ...availableUpgradesAndNewEcos];
    choicePool = Array.from(new Map(choicePool.map(item => [item.id, item])).values());
    choicePool = choicePool.filter(echo => {
        const activeVersion = currentActiveEcos.find(ae => ae.baseId === echo.baseId);
        if (activeVersion) return echo.level > activeVersion.level;
        return true;
    });
    const freeEchoInstance = { ...FREE_ECHO_OPTIONS[Math.floor(Math.random() * FREE_ECHO_OPTIONS.length)] };
    if (aprendizajeRapidoEcho && freeEchoInstance.effectType === EchoEffectType.GainHP && typeof freeEchoInstance.value === 'number') {
        freeEchoInstance.value = Math.max(1, freeEchoInstance.value + 1);
        freeEchoInstance.description = `Restaura <strong>${freeEchoInstance.value} HP</strong>. Un respiro en la oscuridad.`;
    }
    const finalChoices: Echo[] = [freeEchoInstance];
    const nonFreePool = choicePool.filter(e => !e.isFree);
    nonFreePool.sort(() => 0.5 - Math.random());
    for(let i = 0; i < Math.min(numChoices - 1, nonFreePool.length); i++) { finalChoices.push(nonFreePool[i]); }
    const uniqueByIdChoices = Array.from(new Map(finalChoices.map(item => [item.id, item])).values());
    const finalUniqueChoices: Echo[] = [];
    const baseIdsInFinal = new Set<string>();
    for (const choice of uniqueByIdChoices) {
        if (!baseIdsInFinal.has(choice.baseId) || choice.isFree) {
            finalUniqueChoices.push(choice);
            if (!choice.isFree) baseIdsInFinal.add(choice.baseId);
        }
    }
    if (finalUniqueChoices.length < numChoices) {
        for (const potentialChoice of nonFreePool) {
            if (finalUniqueChoices.length >= numChoices) break;
            if (!finalUniqueChoices.some(fc => fc.id === potentialChoice.id) &&
                (!baseIdsInFinal.has(potentialChoice.baseId) || potentialChoice.isFree)) {
                finalUniqueChoices.push(potentialChoice);
                 if (!potentialChoice.isFree) baseIdsInFinal.add(potentialChoice.baseId);
            }
        }
    }
    console.log('[GenerateChoices] Final choices offered:', finalUniqueChoices.map(c => c.name));
    return finalUniqueChoices.slice(0, numChoices);
  }, [gameState.isPrologueActive, metaProgress.unlockedEchoBaseIds]); // Added metaProgress.unlockedEchoBaseIds as dependency

  const generateRunMap = useCallback((): RunMapState => {
    const nodes: Record<string, RunMapNode> = {};
    const mapDepth = MAP_DEFAULT_DEPTH; let nodeIdCounter = 0;
    const createNode = (layer: number, biome: BiomeId, reward: MapRewardType, encounter: MapEncounterType, isCurrent = false): RunMapNode => {
        const id = `mapnode-${nodeIdCounter++}`;
        let rewardVal: number | undefined = undefined;
        if (reward === MapRewardType.SoulFragments) rewardVal = MAP_NODE_REWARD_SOUL_FRAGMENTS_VALUE;
        if (reward === MapRewardType.WillLumens) rewardVal = MAP_NODE_REWARD_WILL_LUMENS_VALUE;
        if (reward === MapRewardType.HealingFountain) rewardVal = MAP_NODE_REWARD_HEALING_FOUNTAIN_VALUE;
        nodes[id] = { id, layer, biomeId: biome, encounterType: encounter, rewardType: reward, childrenNodeIds: [], isCurrent, isCompleted: false, rewardValue: rewardVal };
        return nodes[id];
    };
    const startNode = createNode(0, BiomeId.Default, MapRewardType.None, MapEncounterType.Standard, true);
    let previousLayerNodes = [startNode.id];
    for (let layer = 1; layer < mapDepth; layer++) {
        const currentLayerNodes: string[] = [];
        previousLayerNodes.forEach(parentId => {
            const numChoices = Math.floor(Math.random() * (MAP_CHOICES_PER_NODE_MAX - MAP_CHOICES_PER_NODE_MIN + 1)) + MAP_CHOICES_PER_NODE_MIN;
            for (let i = 0; i < numChoices; i++) {
                const choiceBiomeOptions = [BiomeId.Default, BiomeId.BrokenBazaar, BiomeId.BloodForge];
                const choiceBiome = choiceBiomeOptions[Math.floor(Math.random() * choiceBiomeOptions.length)];
                const choiceRewardOptions = [MapRewardType.None, MapRewardType.ExtraGold, MapRewardType.SoulFragments, MapRewardType.WillLumens, MapRewardType.HealingFountain, MapRewardType.FreeEcho];
                const choiceReward = choiceRewardOptions[Math.floor(Math.random() * choiceRewardOptions.length)];

                const choiceEncounter = layer >= mapDepth -1 ? MapEncounterType.Boss : (Math.random() < 0.2 ? MapEncounterType.Elite : MapEncounterType.Standard);
                const choiceNode = createNode(layer, choiceBiome, choiceReward, choiceEncounter);
                nodes[parentId].childrenNodeIds.push(choiceNode.id);
                currentLayerNodes.push(choiceNode.id);
            }
        });
        previousLayerNodes = currentLayerNodes;
    }
    return { nodes, startNodeId: startNode.id, currentNodeId: startNode.id, mapDepth };
  }, []);


  const proceedToNextLevel = useCallback(() => {
    const isCurrentlyProloguePostLevel = gameState.isPrologueActive &&
                                        gameState.currentLevel === PROLOGUE_LEVEL_ID &&
                                        gameState.status === GameStatus.PostLevel;
    if (
        (gameState.status === GameStatus.PostLevel || isCurrentlyProloguePostLevel) &&
        !gameState.furyMinigameCompletedForThisLevel &&
        !gameState.isFuryMinigameActive
    ) {
        const nextLevelForFuryOptions = isCurrentlyProloguePostLevel ? 1 : gameState.currentLevel + 1;
        const options = getFuryOptionsForOracle(nextLevelForFuryOptions, metaProgress.awakenedFuryIds, player.nextOracleOnlyCommonFury);
        setGameState(prev => ({
            ...prev,
            // isPrologueActive, prologueStep, guidingTextKey are NOT changed here to preserve state for Oracle FTUE.
            // isPrologueActive remains true if it was true.
            isFuryMinigameActive: true,
            furyMinigamePhase: 'starting',
            furyCardOptions: options,
            playerSelectedFuryCardDisplayIndex: null,
            postLevelActionTaken: false, 
        }));
        return;
    }

    const levelForNextSetup = gameState.isPrologueActive && gameState.currentLevel === PROLOGUE_LEVEL_ID
                                   ? 1
                                   : gameState.currentLevel + 1;
    const currentFloor = getCurrentFloorNumber(levelForNextSetup);
    const isTransitioningFromPrologue = gameState.isPrologueActive && levelForNextSetup === 1;


    let newPlayerGold = player.gold + GOLD_REWARD_PER_LEVEL;
    const bolsaAgrandadaEcho = activeEcos.find(e => e.baseId === BASE_ECHO_BOLSA_AGRANDADA);
    if (bolsaAgrandadaEcho) { newPlayerGold += (bolsaAgrandadaEcho.value as number) * (bolsaAgrandadaEcho.effectivenessMultiplier || 1); }

    setPlayer(prevPlayer => ({
      ...prevPlayer, gold: newPlayerGold, firstBombDamageTakenThisLevel: false,
      swordDamageModifier: 0, swordDamageModifierClicksRemaining: 0, venganzaSpectralCharge: 0,
      alquimiaImprovisadaActiveForNextBomb: false, pasoLigeroTrapIgnoredThisLevel: false,
      ojoOmniscienteUsedThisLevel: false, consecutiveSwordsRevealed: 0,
    }));
    setRunStats(prevStats => ({
      ...prevStats, soulFragmentsEarnedThisRun: prevStats.soulFragmentsEarnedThisRun + SOUL_FRAGMENTS_PER_LEVEL_COMPLETE,
      levelsCompletedThisRun: prevStats.levelsCompletedThisRun + 1, swordUsedThisLevel: false, swordUsedThisLevelForMirror: false, // Attack-related
    }));
    if(!gameState.playerTookDamageThisLevel && gameState.currentLevel !== PROLOGUE_LEVEL_ID) {
        setRunStats(prevStats => ({ ...prevStats, levelsCompletedWithoutDamageThisRun: prevStats.levelsCompletedWithoutDamageThisRun + 1 }));
        GoalTrackingService.processEvent('LEVEL_COMPLETED_NO_DAMAGE', { levelNumber: gameState.currentLevel } as GoalLevelCompletedPayload, metaProgress, setAndSaveMetaProgress);
    }
    GoalTrackingService.processEvent('LEVEL_COMPLETED_IN_RUN', { levelNumber: gameState.currentLevel } as GoalLevelCompletedPayload, metaProgress, setAndSaveMetaProgress);


    const oracleFury = gameState.oracleSelectedFuryAbility;
    if (!oracleFury && !gameState.isPrologueActive && !isTransitioningFromPrologue) { 
      console.error("Oracle fury not selected before proceeding to next level!");
    }
    const effectiveOracleFury = oracleFury || (isTransitioningFromPrologue ? INITIAL_STARTING_FURIESS[0] : PROLOGUE_SHADOW_EMBER_FURY_ABILITY);


    const encounter = generateEncounterForFloor(currentFloor, levelForNextSetup, effectiveOracleFury, metaProgress);
    setEnemy(encounter.enemy);

    let finalBoardParams = encounter.boardParams;
    let currentBiomeForBoard = gameState.currentBiomeId;

    if (isTransitioningFromPrologue && !gameState.currentRunMap) { 
        const tempMap = generateRunMap(); 
        currentBiomeForBoard = tempMap.nodes[tempMap.startNodeId].biomeId;
        console.log("[Prologue Transition Pre-Set] Generated temporary map, start node biome:", currentBiomeForBoard);
    }
    
    const biome = BIOME_DEFINITIONS[currentBiomeForBoard];
    if (biome && biome.boardModifiers) {
      let currentMapNodeForModifiers = null;
      if(gameState.currentRunMap && gameState.currentRunMap.nodes[gameState.currentRunMap.currentNodeId]){
        currentMapNodeForModifiers = gameState.currentRunMap.nodes[gameState.currentRunMap.currentNodeId];
      }
      finalBoardParams = biome.boardModifiers(encounter.boardParams, levelForNextSetup, currentMapNodeForModifiers?.rewardType);
    }

    const newBoard = generateBoardFromBoardParameters(finalBoardParams, activeEcos);
    setBoard(newBoard);
    
    setGameState(prev => {
        let newMapState = prev.currentRunMap;
        let newBiomeIdForState = prev.currentBiomeId;
        let newLevelsInStretchForState = prev.levelsInCurrentStretch;
        let newStretchStartLevelForState = prev.stretchStartLevel;
        let newStretchCompletedForState = prev.currentStretchCompletedLevels + 1;

        if (isTransitioningFromPrologue) {
            console.log("[Prologue Transition] Entering isTransitioningFromPrologue block for map generation.");
            newMapState = generateRunMap();
            if (newMapState && newMapState.nodes && newMapState.startNodeId && newMapState.nodes[newMapState.startNodeId]) {
                const startNode = newMapState.nodes[newMapState.startNodeId];
                newBiomeIdForState = startNode.biomeId;
                newLevelsInStretchForState = DEFAULT_LEVELS_PER_STRETCH;
                newStretchStartLevelForState = levelForNextSetup; 
                newStretchCompletedForState = 0; 
                console.log("[Prologue Transition] Map generated successfully. New Map State exists, Start Node Biome:", newBiomeIdForState);
            } else {
                 console.error("[Prologue Transition] Map generation FAILED or startNode invalid. newMapState:", newMapState);
                 // Critical Fallback
                const fallbackNodeId = 'mapnode-fallback-0';
                newMapState = {
                    nodes: { [fallbackNodeId]: { id: fallbackNodeId, layer: 0, biomeId: BiomeId.Default, encounterType: MapEncounterType.Standard, rewardType: MapRewardType.None, childrenNodeIds: [], isCurrent: true, isCompleted: false } },
                    startNodeId: fallbackNodeId,
                    currentNodeId: fallbackNodeId,
                    mapDepth: 1
                };
                newBiomeIdForState = BiomeId.Default;
                newLevelsInStretchForState = DEFAULT_LEVELS_PER_STRETCH;
                newStretchStartLevelForState = levelForNextSetup;
                newStretchCompletedForState = 0;
                console.warn("[Prologue Transition] CRITICAL FALLBACK: Using minimal default map.");
            }
        }
        console.log("[ProceedToNextLevel] Final map state being set:", newMapState ? "Valid Map" : "NULL MAP");
        return {
            ...prev, 
            status: GameStatus.Playing, 
            currentPhase: GamePhase.PLAYER_TURN, 
            currentLevel: levelForNextSetup, 
            currentFloor,
            currentArenaLevel: 0, 
            furyMinigameCompletedForThisLevel: false, 
            postLevelActionTaken: false,
            mapDecisionPending: false, 
            eventQueue: [], 
            playerTookDamageThisLevel: false,
            isPrologueActive: false, 
            guidingTextKey: '',
            currentBoardDimensions: {rows: newBoard.length, cols: newBoard[0]?.length || 0},
            oracleSelectedFuryAbility: null,
            aiThinkingCellCoords: null, 
            aiActionTargetCell: null,
            currentRunMap: newMapState,
            currentBiomeId: newBiomeIdForState,
            levelsInCurrentStretch: newLevelsInStretchForState,
            currentStretchCompletedLevels: newStretchCompletedForState,
            stretchStartLevel: newStretchStartLevelForState,
        };
    });
  }, [
        gameState, player.gold, player.nextOracleOnlyCommonFury, activeEcos,
        generateBoardFromBoardParameters, metaProgress, setAndSaveMetaProgress, generateRunMap
    ]);


  const selectMapPathAndStartStretch = useCallback((chosenNodeId: string) => {
    setGameState(prev => {
        if (!prev.currentRunMap) return prev;
        const newNodes = { ...prev.currentRunMap.nodes };
        if (newNodes[prev.currentRunMap.currentNodeId]) {
          newNodes[prev.currentRunMap.currentNodeId].isCurrent = false;
          newNodes[prev.currentRunMap.currentNodeId].isCompleted = true;
        }
        if (newNodes[chosenNodeId]) { newNodes[chosenNodeId].isCurrent = true; }
        else { console.error("Chosen node ID not found in map:", chosenNodeId); return prev; }
        const chosenNode = newNodes[chosenNodeId];
        let nextStretchRewardPending: GameStateCore['stretchRewardPending'] = null;
        if (chosenNode.rewardType === MapRewardType.SoulFragments || chosenNode.rewardType === MapRewardType.WillLumens ||
            chosenNode.rewardType === MapRewardType.HealingFountain || chosenNode.rewardType === MapRewardType.FreeEcho ||
            chosenNode.rewardType === MapRewardType.EchoForge) {
            nextStretchRewardPending = { type: chosenNode.rewardType, value: chosenNode.rewardValue };
        }
        return {
            ...prev,
            currentRunMap: { ...prev.currentRunMap, nodes: newNodes, currentNodeId: chosenNodeId },
            currentBiomeId: chosenNode.biomeId, levelsInCurrentStretch: DEFAULT_LEVELS_PER_STRETCH,
            currentStretchCompletedLevels: 0, stretchStartLevel: prev.currentLevel,
            mapDecisionPending: false, furyMinigameCompletedForThisLevel: false,
            postLevelActionTaken: true, stretchRewardPending: nextStretchRewardPending,
        };
    });
    setGameStatus(GameStatus.PostLevel);
  }, [setGameStatus]);

  const requestPrologueStart = useCallback(() => {
    setGameState(prev => ({ ...prev, status: GameStatus.IntroScreen }));
  }, []);

  const startPrologueActual = useCallback(() => {
    console.log("Attempting to start prologue actual...");
    try {
      ftueEventTracker.current = {};
      const initialLevel = PROLOGUE_LEVEL_ID;
      const initialFloor = 0;
      const initialBoardDimensions = { rows: PROLOGUE_BOARD_ROWS, cols: PROLOGUE_BOARD_COLS };
      
      setRunStats({ ...initialRunStats, swordUsedThisLevel: false, swordUsedThisLevelForMirror: false, runUniqueEcosActivated: [], runUniqueFuriesExperienced: [], newlyCompletedGoalIdsThisRun: [] });

      let baseHp = INITIAL_PLAYER_HP, baseGold = INITIAL_PLAYER_GOLD, baseShield = INITIAL_PLAYER_SHIELD, currentMaxSoulFragments = INITIAL_MAX_SOUL_FRAGMENTS;
      for (const upgradeId in metaProgress.mirrorUpgrades) {
          const currentMirrorLevel = metaProgress.mirrorUpgrades[upgradeId];
          if (currentMirrorLevel > 0) {
              const upgradeDef = MIRROR_UPGRADES_CONFIG.find(u => u.id === upgradeId);
              if (upgradeDef) {
                  let totalEffectValue = 0; for(let i=0; i < currentMirrorLevel; i++) { totalEffectValue += upgradeDef.levels[i].effectValue; }
                  switch (upgradeDef.appliesTo) {
                      case 'playerMaxHp': baseHp += totalEffectValue; break;
                      case 'playerStartGold': baseGold += totalEffectValue; break;
                      case 'playerStartShield': baseShield += totalEffectValue; break;
                      case 'playerMaxSoulFragments': currentMaxSoulFragments += totalEffectValue; break;
                  }
              }
          }
      }
      if (metaProgress.maxSoulFragments !== currentMaxSoulFragments) { setAndSaveMetaProgress(prev => ({...prev, maxSoulFragments: currentMaxSoulFragments})); }
      const initialPlayerState: PlayerState = {
        hp: baseHp, maxHp: baseHp, gold: baseGold, shield: baseShield,
        venganzaSpectralCharge: 0, consecutiveSwordsRevealed: 0, firstBombDamageTakenThisLevel: false,
        swordDamageModifier: 0, swordDamageModifierClicksRemaining: 0, ultimoAlientoUsedThisRun: false,
        isInvulnerable: false, invulnerabilityClicksRemaining: 0, criticalHitClicksRemaining: 0,
        alquimiaImprovisadaChargeAvailable: false, alquimiaImprovisadaActiveForNextBomb: false,
        vinculoDolorosoActive: false, vinculoDolorosoClicksRemaining: 0, pasoLigeroTrapIgnoredThisLevel: false,
        ojoOmniscienteUsedThisLevel: false, debuffEspadasOxidadasClicksRemaining: 0, deactivatedEcos: [],
        nextEchoCostsDoubled: false, nextOracleOnlyCommonFury: false, pistasFalsasClicksRemaining: 0, paranoiaGalopanteClicksRemaining: 0,
      };
      setPlayer(initialPlayerState);
      setAndSaveMetaProgress(prevMeta => {
          const newGoalsProgress = { ...prevMeta.goalsProgress }; let changed = false;
          INITIAL_GOALS_CONFIG.forEach(goalDef => {
              if (goalDef.resetsPerRun && newGoalsProgress[goalDef.id]) {
                  if (newGoalsProgress[goalDef.id].currentValue !== 0 || newGoalsProgress[goalDef.id].completed) {
                      newGoalsProgress[goalDef.id] = { ...newGoalsProgress[goalDef.id], currentValue: 0, completed: false }; changed = true;
                  }
              }
          });
          return changed ? { ...prevMeta, goalsProgress: newGoalsProgress } : prevMeta;
      });

      const newEnemyInstance = createEnemyInstance(PROLOGUE_ENEMY_SHADOW_EMBER.id as EnemyArchetypeId, EnemyRank.Minion, initialLevel, PROLOGUE_SHADOW_EMBER_FURY_ABILITY);
      
      const { attacks, gold, traps } = PROLOGUE_BOARD_CONFIG;
      const prologueRatioKey = "prologueFixed"; 
      const currentRatioDefs = {...OBJECT_RATIO_DEFINITIONS}; 
      currentRatioDefs[prologueRatioKey] = { attacks, gold }; 
      
      const prologueBoardParams: BoardParameters = {
        rows: PROLOGUE_BOARD_CONFIG.rows || PROLOGUE_BOARD_ROWS,
        cols: PROLOGUE_BOARD_CONFIG.cols || PROLOGUE_BOARD_COLS,
        densityPercent: 25, 
        objectRatioKey: prologueRatioKey, 
        traps: traps || 0,
      };
      const newBoard = generateBoardFromBoardParameters(prologueBoardParams, []); 
      
      setEnemy(newEnemyInstance);
      setBoard(newBoard);
      setActiveEcosState([]); setAvailableEchoChoices([]);
      setGameState(prev => ({
        ...prev, status: GameStatus.Playing, currentPhase: GamePhase.PLAYER_TURN, currentLevel: initialLevel, currentFloor: initialFloor,
        isFuryMinigameActive: false, furyMinigamePhase: 'inactive', furyMinigameCompletedForThisLevel: true, 
        oracleSelectedFuryAbility: null, isPrologueActive: true, prologueStep: 1, prologueEnemyFuryAbility: null,
        conditionalEchoTriggeredId: null, isCorazonDelAbismoChoiceActive: false, corazonDelAbismoOptions: null,
        eventQueue: [], playerTookDamageThisLevel: false, currentArenaLevel: 0, maxArenaReductions: MAX_ARENA_REDUCTIONS,
        isBattlefieldReductionTransitioning: false, guidingTextKey: 1, defeatReason: 'standard',
        currentBoardDimensions: initialBoardDimensions, postLevelActionTaken: false,
        currentRunMap: null, 
        aiThinkingCellCoords: null, aiActionTargetCell: null,
      }));
      console.log("Prologue setup complete. Game status set to Playing.");
    } catch (error) {
      console.error("Error during startPrologueActual:", error);
      setGameState(prev => ({ ...prev, status: GameStatus.MainMenu, guidingTextKey: '' }));
    }
  }, [generateBoardFromBoardParameters, metaProgress, setAndSaveMetaProgress]);

  const initializeNewRun = useCallback((isPrologueRun: boolean) => {
    if (isPrologueRun) {
      requestPrologueStart(); 
      return;
    }
    ftueEventTracker.current = {};
    const initialLevel = 1;
    const initialFloor = getCurrentFloorNumber(initialLevel);
    const newRunMap = generateRunMap();
    console.log("[InitializeNewRun] Generated map for new run:", newRunMap); 
    const startNode = newRunMap.nodes[newRunMap.startNodeId];
    console.log("[InitializeNewRun] Start node:", startNode); 
    setRunStats({ ...initialRunStats, swordUsedThisLevel: false, swordUsedThisLevelForMirror: false, runUniqueEcosActivated: [], runUniqueFuriesExperienced: [], newlyCompletedGoalIdsThisRun: [] });

    let baseHp = INITIAL_PLAYER_HP, baseGold = INITIAL_PLAYER_GOLD, baseShield = INITIAL_PLAYER_SHIELD, currentMaxSoulFragments = INITIAL_MAX_SOUL_FRAGMENTS;
    for (const upgradeId in metaProgress.mirrorUpgrades) {
        const currentMirrorLevel = metaProgress.mirrorUpgrades[upgradeId];
        if (currentMirrorLevel > 0) {
            const upgradeDef = MIRROR_UPGRADES_CONFIG.find(u => u.id === upgradeId);
            if (upgradeDef) {
                let totalEffectValue = 0; for(let i=0; i < currentMirrorLevel; i++) { totalEffectValue += upgradeDef.levels[i].effectValue; }
                switch (upgradeDef.appliesTo) {
                    case 'playerMaxHp': baseHp += totalEffectValue; break;
                    case 'playerStartGold': baseGold += totalEffectValue; break;
                    case 'playerStartShield': baseShield += totalEffectValue; break;
                    case 'playerMaxSoulFragments': currentMaxSoulFragments += totalEffectValue; break;
                }
            }
        }
    }
    if (metaProgress.maxSoulFragments !== currentMaxSoulFragments) { setAndSaveMetaProgress(prev => ({...prev, maxSoulFragments: currentMaxSoulFragments})); }
    const initialPlayerState: PlayerState = {
      hp: baseHp, maxHp: baseHp, gold: baseGold, shield: baseShield,
      venganzaSpectralCharge: 0, consecutiveSwordsRevealed: 0, firstBombDamageTakenThisLevel: false,
      swordDamageModifier: 0, swordDamageModifierClicksRemaining: 0, ultimoAlientoUsedThisRun: false,
      isInvulnerable: false, invulnerabilityClicksRemaining: 0, criticalHitClicksRemaining: 0,
      alquimiaImprovisadaChargeAvailable: false, alquimiaImprovisadaActiveForNextBomb: false,
      vinculoDolorosoActive: false, vinculoDolorosoClicksRemaining: 0, pasoLigeroTrapIgnoredThisLevel: false,
      ojoOmniscienteUsedThisLevel: false, debuffEspadasOxidadasClicksRemaining: 0, deactivatedEcos: [],
      nextEchoCostsDoubled: false, nextOracleOnlyCommonFury: false, pistasFalsasClicksRemaining: 0, paranoiaGalopanteClicksRemaining: 0,
    };
    setPlayer(initialPlayerState);
    setAndSaveMetaProgress(prevMeta => {
        const newGoalsProgress = { ...prevMeta.goalsProgress }; let changed = false;
        INITIAL_GOALS_CONFIG.forEach(goalDef => {
            if (goalDef.resetsPerRun && newGoalsProgress[goalDef.id]) {
                if (newGoalsProgress[goalDef.id].currentValue !== 0 || newGoalsProgress[goalDef.id].completed) {
                    newGoalsProgress[goalDef.id] = { ...newGoalsProgress[goalDef.id], currentValue: 0, completed: false }; changed = true;
                }
            }
        });
        return changed ? { ...prevMeta, goalsProgress: newGoalsProgress } : prevMeta;
    });

    const encounter = generateEncounterForFloor(initialFloor, initialLevel, INITIAL_STARTING_FURIESS[0]);
    const biome = BIOME_DEFINITIONS[startNode.biomeId];
    let finalBoardParams = encounter.boardParams;
    if (biome && biome.boardModifiers) {
         finalBoardParams = biome.boardModifiers(encounter.boardParams, initialLevel, startNode.rewardType);
    }
    const newBoard = generateBoardFromBoardParameters(finalBoardParams, []);
    
    setEnemy(encounter.enemy);
    setBoard(newBoard);
    setActiveEcosState([]); setAvailableEchoChoices([]);
    setGameState(prev => ({
      ...prev, status: GameStatus.Playing, currentPhase: GamePhase.PLAYER_TURN, currentLevel: initialLevel, currentFloor: initialFloor,
      isFuryMinigameActive: false, furyMinigamePhase: 'inactive',
      furyMinigameCompletedForThisLevel: false, oracleSelectedFuryAbility: INITIAL_STARTING_FURIESS[0],
      isPrologueActive: false, prologueStep: 0, prologueEnemyFuryAbility: null,
      conditionalEchoTriggeredId: null, isCorazonDelAbismoChoiceActive: false, corazonDelAbismoOptions: null,
      eventQueue: [], playerTookDamageThisLevel: false, currentArenaLevel: 0, maxArenaReductions: MAX_ARENA_REDUCTIONS,
      isBattlefieldReductionTransitioning: false, guidingTextKey: '', defeatReason: 'standard',
      currentBoardDimensions: { rows: finalBoardParams.rows, cols: finalBoardParams.cols }, postLevelActionTaken: false,
      currentRunMap: newRunMap, currentBiomeId: startNode.biomeId,
      levelsInCurrentStretch: DEFAULT_LEVELS_PER_STRETCH, currentStretchCompletedLevels: 0,
      stretchStartLevel: initialLevel, mapDecisionPending: false,
      stretchRewardPending: startNode.rewardType !== MapRewardType.None && startNode.rewardType !== MapRewardType.ExtraGold ? {type: startNode.rewardType, value: startNode.rewardValue} : null,
      aiThinkingCellCoords: null, aiActionTargetCell: null,
    }));

  }, [generateBoardFromBoardParameters, generateRunMap, metaProgress, setAndSaveMetaProgress, requestPrologueStart]);


  const applyFuryEffect = useCallback((ability: FuryAbility) => {
    playMidiSoundPlaceholder(`fury_activate_${ability.id}_${ability.rarity.toLowerCase()}`);
    let newPlayerState = { ...player };
    let newEnemyState = { ...enemy };
    let newBoardState = board.map(r => r.map(c => ({ ...c })));
    const allCurrentActiveEcos = activeEcos;
    const effectiveEcos = getCurrentlyEffectiveEcos(allCurrentActiveEcos, player.deactivatedEcos);

    console.log(`Applying Fury: ${ability.name}`);
    const voluntadEcho = effectiveEcos.find(e => e.id === 'eco_voluntad_inquebrantable_1');
    const reductionFactor = voluntadEcho ? (1 - (voluntadEcho.value as number * (voluntadEcho.effectivenessMultiplier || 1))) : 1;

    if (!runStats.runUniqueFuriesExperienced.includes(ability.id)) {
        setRunStats(prev => ({...prev, runUniqueFuriesExperienced: [...prev.runUniqueFuriesExperienced, ability.id] }));
        GoalTrackingService.processEvent('UNIQUE_FURY_EXPERIENCED', null, metaProgress, setAndSaveMetaProgress);
    }

    switch (ability.effectType) {
        case FuryAbilityEffectType.PlayerDamage:
            if (!newPlayerState.isInvulnerable) {
                let damage = Math.round((ability.value as number) * reductionFactor);
                if (newPlayerState.shield > 0) {
                    const shieldDamage = Math.min(newPlayerState.shield, damage);
                    newPlayerState.shield -= shieldDamage; damage -= shieldDamage;
                    addGameEvent({ text: `-${shieldDamage}🛡️`, type: 'armor-break', targetId: 'player-stats-container' });
                }
                if (damage > 0) {
                    newPlayerState.hp = Math.max(0, newPlayerState.hp - damage);
                    addGameEvent({ text: `-${damage}`, type: 'damage-player', targetId: 'player-stats-container' });
                    setGameState(prev => ({...prev, playerTookDamageThisLevel: true }));
                }
            } break;
        case FuryAbilityEffectType.PlayerGoldLoss: {
                const goldLoss = Math.round((ability.value as number) * reductionFactor);
                const actualGoldLoss = Math.min(newPlayerState.gold, goldLoss);
                newPlayerState.gold -= actualGoldLoss;
                if (actualGoldLoss > 0) addGameEvent({ text: `-${actualGoldLoss}💰`, type: 'info', targetId: 'player-stats-container' });
            } break;
        case FuryAbilityEffectType.PlayerGoldLossAndEnemyHeal: {
                const {goldLoss, enemyHeal} = ability.value as {goldLoss: number, enemyHeal: number};
                const actualGoldLoss = Math.min(newPlayerState.gold, Math.round(goldLoss * reductionFactor));
                newPlayerState.gold -= actualGoldLoss;
                 if (actualGoldLoss > 0) addGameEvent({ text: `-${actualGoldLoss}💰`, type: 'info', targetId: 'player-stats-container' });

                newEnemyState.currentHp = Math.min(newEnemyState.maxHp, newEnemyState.currentHp + enemyHeal);
                addGameEvent({ text: `+${enemyHeal}HP (Enemigo)`, type: 'heal-player', targetId: 'enemy-stats-container' });
            } break;
        case FuryAbilityEffectType.EnemyGainArmor:
            newEnemyState.armor += (ability.value as number);
            addGameEvent({ text: `+${ability.value}🛡️ (Enemigo)`, type: 'armor-gain', targetId: 'enemy-stats-container'});
            break;
        case FuryAbilityEffectType.EnemyHeal:
            newEnemyState.currentHp = Math.min(newEnemyState.maxHp, newEnemyState.currentHp + (ability.value as number));
            addGameEvent({ text: `+${ability.value}HP (Enemigo)`, type: 'heal-player', targetId: 'enemy-stats-container' });
            break;
        case FuryAbilityEffectType.BoardAddAttacks: { // Changed from BoardAddBombs
            let attacksToAdd = ability.value as number;
            if (typeof ability.value === 'object' && ability.value && 'min' in ability.value && 'max' in ability.value) {
                attacksToAdd = randomInt(ability.value.min, ability.value.max);
            }
            let placedCount = 0; let attempts = 0;
            const maxAttempts = newBoardState.length * newBoardState[0].length;
            while(placedCount < attacksToAdd && attempts < maxAttempts) {
                const r = randomInt(0, newBoardState.length -1);
                const c = randomInt(0, newBoardState[0].length -1);
                if(!newBoardState[r][c].revealed && newBoardState[r][c].type !== CellType.Attack) { // Check for Attack
                    newBoardState[r][c].type = CellType.Attack; // Place Attack
                    placedCount++;
                }
                attempts++;
            }
            newBoardState = recalculateAllClues(newBoardState);
            newBoardState = updateBoardVisualEffects(newBoardState, effectiveEcos);
            addGameEvent({ text: `+${placedCount} Ataques!`, type: 'info', targetId: 'board-container' }); // Updated text
        } break;
         case FuryAbilityEffectType.BoardHideClues: {
            const cluesToHide = ability.value as number;
            let hiddenCount = 0;
            const revealedClueCells: {r:number, c:number}[] = [];
            newBoardState.forEach((row, r_idx) => row.forEach((cell, c_idx) => {
                if (cell.revealed && cell.type === CellType.Clue) revealedClueCells.push({r:r_idx, c:c_idx});
            }));
            revealedClueCells.sort(() => 0.5 - Math.random());
            for(let i=0; i < Math.min(cluesToHide, revealedClueCells.length); i++){
                newBoardState[revealedClueCells[i].r][revealedClueCells[i].c].revealed = false;
                hiddenCount++;
            }
            if(hiddenCount > 0) addGameEvent({ text: `${hiddenCount} Pistas Ocultas!`, type: 'info', targetId: 'board-container' });
        } break;
        case FuryAbilityEffectType.PlayerChanceToFailAttack: addGameEvent({ text: `¡Torpeza Fugaz!`, type: 'info', targetId: 'player-stats-container'}); break; 
        case FuryAbilityEffectType.EnemyFuryBarPartialFill: addGameEvent({ text: `¡Rescoldo Persistente!`, type: 'info', targetId: 'enemy-stats-container'}); newEnemyState.currentFuryCharge = Math.min(newEnemyState.furyActivationThreshold, newEnemyState.currentFuryCharge + Math.floor(newEnemyState.furyActivationThreshold * (ability.value as number))); break;
        case FuryAbilityEffectType.PlayerTemporaryEcoDeactivation: {
                const { chance, duration } = ability.value as { chance: number, duration: number };
                if (Math.random() < chance && allCurrentActiveEcos.length > 0) {
                    const newestEcho = allCurrentActiveEcos[allCurrentActiveEcos.length - 1];
                    if (newestEcho && !(newPlayerState.deactivatedEcos || []).some(de => de.echoId === newestEcho.id)) {
                        newPlayerState.deactivatedEcos = [...(newPlayerState.deactivatedEcos || []), { echoId: newestEcho.id, baseId: newestEcho.baseId, icon: newestEcho.icon, name: newestEcho.name, clicksRemaining: duration }];
                        addGameEvent({ text: `Eco "${newestEcho.name}" distorsionado! (${duration} clics)`, type: 'info', targetId: 'player-stats-container'});
                    }
                }
             } break;
        case FuryAbilityEffectType.BoardVisualDisruption: addGameEvent({ text: `¡Mirada Inquietante!`, type: 'info', targetId: 'player-stats-container'}); break;
        case FuryAbilityEffectType.BoardAddMixedItems: {
             const { area, items } = ability.value as { area: string, items: ('attack' | 'gold' | 'trap')[] }; // Attack instead of bomb/sword
             // Placeholder: Actual placement logic for area and mixed items needed.
             addGameEvent({ text: `¡Objetos Mezclados! (${area})`, type: 'info', targetId: 'board-container'});
        } break;
        default: console.warn(`Unhandled Fury effect type: ${ability.effectType}`);
    }
    setPlayer(newPlayerState);
    setEnemy(prevEnemy => ({...prevEnemy, ...newEnemyState}));
    setBoard(newBoardState);
  }, [player, enemy, board, activeEcos, addGameEvent, setGameState, runStats.runUniqueFuriesExperienced, metaProgress, setAndSaveMetaProgress, recalculateAllClues, updateBoardVisualEffects]);

  const checkAllPlayerBeneficialAttacksRevealed = useCallback((): boolean => { // Renamed for clarity
    for (const row of board) for (const cell of row) if (cell.type === CellType.Attack && !cell.revealed) return false;
    return true;
  }, [board]);

  const triggerBattlefieldReduction = useCallback(() => {
    if (battlefieldReductionTimeoutRef.current) clearTimeout(battlefieldReductionTimeoutRef.current);
    playMidiSoundPlaceholder('battlefield_reduce_start');
    setGameState(prev => ({ ...prev, isBattlefieldReductionTransitioning: true, guidingTextKey: 'BATTLEFIELD_REDUCTION_START' }));
    battlefieldReductionTimeoutRef.current = window.setTimeout(() => {
        const nextArenaLevel = gameState.currentArenaLevel + 1;
        if (nextArenaLevel > gameState.maxArenaReductions) {
            playMidiSoundPlaceholder('player_defeat_attrition');
            setGameStatus(GameStatus.GameOverDefeat, 'attrition');
            setGameState(prev => ({ ...prev, isBattlefieldReductionTransitioning: false })); return;
        }
        playMidiSoundPlaceholder('battlefield_board_collapse');
        const newDimensions = MINI_ARENA_SIZES[nextArenaLevel - 1];
        const attackDensityKey = `level${nextArenaLevel}` as keyof typeof MINI_ARENA_ATTACK_DENSITY_FACTOR_PERCENT;
        const attackDensityPercent = MINI_ARENA_ATTACK_DENSITY_FACTOR_PERCENT[attackDensityKey] || MINI_ARENA_ATTACK_DENSITY_FACTOR_PERCENT.level2;


        const miniArenaParams: BoardParameters = {
            rows: newDimensions.rows, cols: newDimensions.cols,
            densityPercent: attackDensityPercent,
            objectRatioKey: 'hostile', // Hostile now implies more attacks for player to hit, or for enemy to hit player
            traps: 0,
        };
        const newMiniBoard = generateBoardFromBoardParameters(miniArenaParams, activeEcos);
        setBoard(newMiniBoard); playMidiSoundPlaceholder('mini_arena_form');
        setEnemy(prevEnemy => ({ ...prevEnemy, currentFuryCharge: Math.floor(prevEnemy.currentFuryCharge / 2) }));
        setGameState(prev => ({ ...prev, currentArenaLevel: nextArenaLevel, isBattlefieldReductionTransitioning: false, guidingTextKey: 'BATTLEFIELD_REDUCTION_COMPLETE', currentBoardDimensions: { rows: newDimensions.rows, cols: newDimensions.cols }}));
        setTimeout(() => advancePrologueStep(''), 5000);
    }, BATTLEFIELD_TRANSITION_DURATION_MS);
  }, [gameState.currentArenaLevel, gameState.maxArenaReductions, activeEcos, generateBoardFromBoardParameters, setGameStatus, advancePrologueStep ]);


  const processEnemyMove = useCallback((row: number, col: number) => {
    let currentBoard = board.map(r => r.map(c => ({ ...c })));
    const cell = currentBoard[row][col];
    if (cell.revealed) return;

    playMidiSoundPlaceholder('cell_click_enemy');
    let newPlayerState = { ...player };
    let newEnemyState = { ...enemy };
    let message = `Enemigo revela (${row},${col}): `;
    let newRunStats = {...runStats};

    currentBoard[row][col].revealed = true;
    GoalTrackingService.processEvent('CELL_REVEALED', { cellType: cell.type, revealedByPlayer: false } as GoalCellRevealedPayload, metaProgress, setAndSaveMetaProgress);


    switch (cell.type) {
      case CellType.Attack: // Acts like a Bomb for the player
        playMidiSoundPlaceholder('reveal_attack_enemy_hits_player'); // New sound
        message += "¡Ataque! Jugador recibe daño.";
        newRunStats.attacksTriggeredByEnemy++;
        if (!newPlayerState.isInvulnerable) {
          let damage = ATTACK_DAMAGE_ENEMY_VS_PLAYER;
          if (newPlayerState.shield > 0) {
            const shieldDamage = Math.min(newPlayerState.shield, damage);
            newPlayerState.shield -= shieldDamage; damage -= shieldDamage;
            addGameEvent({ text: `-${shieldDamage}🛡️`, type: 'armor-break', targetId: 'player-stats-container' });
          }
          if (damage > 0) {
            newPlayerState.hp = Math.max(0, newPlayerState.hp - damage);
            addGameEvent({ text: `-${damage}`, type: 'damage-player', targetId: 'player-stats-container' });
            setGameState(prev => ({ ...prev, playerTookDamageThisLevel: true }));
          }
        } else {
            addGameEvent({ text: '¡Invulnerable!', type: 'info', targetId: 'player-stats-container' });
        }
        if (gameState.isPrologueActive && gameState.prologueStep === 5 && !ftueEventTracker.current.firstAttackRevealedByEnemy) { ftueEventTracker.current.firstAttackRevealedByEnemy = true; advancePrologueStep(6); }
        break;
      case CellType.Gold:
        playMidiSoundPlaceholder('reveal_gold_enemy_fury');
        message += "¡Oro! Furia del enemigo aumenta.";
        newRunStats.goldCellsRevealedThisRun++;
        newEnemyState.currentFuryCharge = Math.min(newEnemyState.furyActivationThreshold, newEnemyState.currentFuryCharge + ENEMY_FURY_GAIN_ON_GOLD_REVEAL);
        addGameEvent({ text: `+${ENEMY_FURY_GAIN_ON_GOLD_REVEAL} Furia!`, type: 'info', targetId: 'enemy-stats-container' });
        break;
      case CellType.Clue:
        message += "Pista revelada.";
        break;
      case CellType.Trap:
        playMidiSoundPlaceholder('reveal_trap_enemy_effect');
        message += "¡Trampa activada por el enemigo!";
        newRunStats.trapsTriggeredThisRun++;
        let trapDamageToEnemy = 1;
        if (newEnemyState.armor > 0) {
            const armorDamage = Math.min(newEnemyState.armor, trapDamageToEnemy);
            newEnemyState.armor -= armorDamage; trapDamageToEnemy -= armorDamage;
            addGameEvent({ text: `-${armorDamage}🛡️ (Trampa Enem.)`, type: 'armor-break', targetId: 'enemy-stats-container' });
        }
        if (trapDamageToEnemy > 0) {
            newEnemyState.currentHp = Math.max(0, newEnemyState.currentHp - trapDamageToEnemy);
            addGameEvent({ text: `-${trapDamageToEnemy} (Trampa Enem.)`, type: 'damage-enemy', targetId: 'enemy-stats-container' });
        }
        break;
      default:
        message += `Tipo de casilla desconocido: ${cell.type}`;
    }
    console.log(message);
    setPlayer(newPlayerState);
    setEnemy(newEnemyState);
    setRunStats(newRunStats);

    const newBoard = recalculateAllClues(currentBoard);
    setBoard(updateBoardVisualEffects(newBoard, activeEcos));

    if (newPlayerState.hp <= 0) {
      // Defeat is handled by useEffect [player.hp]
    } else if (newEnemyState.currentHp <= 0) {
      playMidiSoundPlaceholder('enemy_defeat');
      GoalTrackingService.processEvent('ENEMY_DEFEATED', { enemyArchetypeId: newEnemyState.archetypeId } as GoalEnemyDefeatedPayload, metaProgress, setAndSaveMetaProgress);

      const isFTUERun = metaProgress.hasCompletedFirstRun === false;
      setRunStats(prev => ({ ...prev, enemiesDefeatedThisRun: prev.enemiesDefeatedThisRun + 1, soulFragmentsEarnedThisRun: prev.soulFragmentsEarnedThisRun + SOUL_FRAGMENTS_PER_ENEMY_DEFEAT }));

      setAvailableEchoChoices(generateEchoChoicesForPostLevelScreen(gameState.currentLevel, activeEcos, newPlayerState, metaProgress));

      let mapDecisionNowPending = false;
      if (!isFTUERun && !gameState.isPrologueActive && gameState.currentStretchCompletedLevels >= gameState.levelsInCurrentStretch -1 ) {
        mapDecisionNowPending = true;
      }

      setGameState(prev => ({
        ...prev,
        status: GameStatus.PostLevel,
        mapDecisionPending: mapDecisionNowPending,
        postLevelActionTaken: isFTUERun ? true : false,
        furyMinigameCompletedForThisLevel: isFTUERun ? true : false,
        // currentPhase will be handled by ENEMY_ACTION_RESOLVING -> PLAYER_TURN transition
      }));
    }
  }, [board, player, enemy, activeEcos, addGameEvent, setGameStatus, recalculateAllClues, updateBoardVisualEffects, metaProgress, setAndSaveMetaProgress, generateEchoChoicesForPostLevelScreen, gameState.currentLevel, gameState.isPrologueActive, gameState.currentStretchCompletedLevels, gameState.levelsInCurrentStretch, runStats, advancePrologueStep]);


  const handlePlayerCellSelection = useCallback((row: number, col: number) => {
    if (gameState.currentPhase !== GamePhase.PLAYER_TURN) return;

    let currentBoard = board.map(r => r.map(c => ({ ...c }))); const cell = currentBoard[row][col];
    if (cell.revealed || cell.lockedIncorrectlyForClicks > 0) return;
    playMidiSoundPlaceholder('cell_click');
    let newPlayerState = { ...player }; let newEnemyState = { ...enemy }; let newRunStats = { ...runStats };
    newRunStats.clicksOnBoardThisRun++;
    const cellsToProcessQueue: { r: number, c: number, depth: number }[] = [{ r: row, c: col, depth: 0 }];
    const processedCellsInTurn = new Set<string>();
    let attacksByPlayerThisTurn = 0, goldCollectedThisTurn = 0, trapsTriggeredThisTurn = 0, cellsRevealedThisTurnForFury = 0;
    const effectiveEcos = getCurrentlyEffectiveEcos(activeEcos, player.deactivatedEcos);
    const highestCascadeEcho = effectiveEcos.filter(e => e.baseId === BASE_ECHO_ECO_CASCADA).sort((a,b) => (b.level || 0) - (a.level || 0))[0] || null;
    let cascadeDepthValue = 0, cascadeDisarmChance = 0;
    if (highestCascadeEcho) {
        if (typeof highestCascadeEcho.value === 'number') cascadeDepthValue = highestCascadeEcho.value * (highestCascadeEcho.effectivenessMultiplier || 1);
        else if (typeof highestCascadeEcho.value === 'object' && highestCascadeEcho.value && 'depth' in highestCascadeEcho.value) {
            cascadeDepthValue = highestCascadeEcho.value.depth * (highestCascadeEcho.effectivenessMultiplier || 1);
            if ('disarmChance' in highestCascadeEcho.value) cascadeDisarmChance = highestCascadeEcho.value.disarmChance * (highestCascadeEcho.effectivenessMultiplier || 1);
        }
    }
    if (newPlayerState.deactivatedEcos.length > 0) {
        const stillDeactivated: DeactivatedEchoInfo[] = [];
        newPlayerState.deactivatedEcos.forEach(de => {
            de.clicksRemaining -=1;
            if (de.clicksRemaining > 0) stillDeactivated.push(de);
            else addGameEvent({ text: `Eco "${de.name}" reactivado!`, type: 'info', targetId: 'player-stats-container'});
        });
        newPlayerState.deactivatedEcos = stillDeactivated;
    }
    if (newPlayerState.debuffEspadasOxidadasClicksRemaining > 0) newPlayerState.debuffEspadasOxidadasClicksRemaining--;
    if (newPlayerState.vinculoDolorosoClicksRemaining > 0) newPlayerState.vinculoDolorosoClicksRemaining--; else if (newPlayerState.vinculoDolorosoActive) newPlayerState.vinculoDolorosoActive = false;
    if (newPlayerState.pistasFalsasClicksRemaining > 0) newPlayerState.pistasFalsasClicksRemaining--;
    if (newPlayerState.paranoiaGalopanteClicksRemaining > 0) newPlayerState.paranoiaGalopanteClicksRemaining--;
    if (newPlayerState.invulnerabilityClicksRemaining > 0) newPlayerState.invulnerabilityClicksRemaining--;
    if (newPlayerState.criticalHitClicksRemaining > 0) newPlayerState.criticalHitClicksRemaining--;
    if (newPlayerState.swordDamageModifierClicksRemaining > 0) newPlayerState.swordDamageModifierClicksRemaining--; else if (newPlayerState.swordDamageModifier > 0) newPlayerState.swordDamageModifier = 0;

    while(cellsToProcessQueue.length > 0) {
        const current = cellsToProcessQueue.shift()!; const r = current.r; const c = current.c; const depth = current.depth; const cellId = `${r}-${c}`;
        if (r < 0 || r >= gameState.currentBoardDimensions.rows || c < 0 || c >= gameState.currentBoardDimensions.cols || processedCellsInTurn.has(cellId) || currentBoard[r][c].revealed) continue;
        currentBoard[r][c].revealed = true; processedCellsInTurn.add(cellId); cellsRevealedThisTurnForFury++;
        const cellData = currentBoard[r][c];
        GoalTrackingService.processEvent('CELL_REVEALED', { cellType: cellData.type, revealedByPlayer: true } as GoalCellRevealedPayload, metaProgress, setAndSaveMetaProgress);

        switch (cellData.type) {
          case CellType.Attack: // Player reveals an Attack tile - acts like Sword
            playMidiSoundPlaceholder('reveal_attack_player_hits_enemy'); attacksByPlayerThisTurn++; newRunStats.swordUsedThisLevel = true; // swordUsedThisLevel for Mirror compatibility for now
            let baseDamageForAttack = ATTACK_DAMAGE_PLAYER_VS_ENEMY; let attackDamageReductionFromDebuff = 0;
            if (newPlayerState.debuffEspadasOxidadasClicksRemaining > 0) { const debuffData = ALL_FURY_ABILITIES_MAP.get('fury_espadas_oxidadas')?.value as {reduction:number} | undefined; if(debuffData) attackDamageReductionFromDebuff = debuffData.reduction;}
            let actualAttackDamage = Math.max(1, baseDamageForAttack - attackDamageReductionFromDebuff);
            if (newPlayerState.swordDamageModifier > 0 && newPlayerState.swordDamageModifierClicksRemaining > 0) { actualAttackDamage += newPlayerState.swordDamageModifier; newPlayerState.venganzaSpectralCharge = 0; }
            newPlayerState.consecutiveSwordsRevealed++; // Track consecutive Attack reveals by player
            const maestriaEcho = effectiveEcos.find(e => e.baseId === BASE_ECHO_MAESTRIA_ESTOCADA); const torrenteEcho = effectiveEcos.find(e => e.baseId === BASE_ECHO_TORRENTE_ACERO);
            if (torrenteEcho) {
                const torrenteConfig = torrenteEcho.value as { count: number, bonusIncremental: boolean, reduceFury: boolean };
                if (newPlayerState.consecutiveSwordsRevealed >= torrenteConfig.count) {
                    const bonus = torrenteConfig.bonusIncremental ? (newPlayerState.consecutiveSwordsRevealed - torrenteConfig.count + 1) : 1; actualAttackDamage += bonus; triggerConditionalEchoAnimation(torrenteEcho.id);
                    if(torrenteConfig.reduceFury) newEnemyState.currentFuryCharge = Math.max(0, newEnemyState.currentFuryCharge - Math.floor(newEnemyState.furyActivationThreshold * 0.1));
                }
            } else if (maestriaEcho) {
                const maestriaConfig = maestriaEcho.value as { count: number, bonus: number };
                if (newPlayerState.consecutiveSwordsRevealed >= maestriaConfig.count) { actualAttackDamage += (maestriaConfig.bonus * (maestriaEcho.effectivenessMultiplier || 1)); triggerConditionalEchoAnimation(maestriaEcho.id); }
            }
            if (newPlayerState.criticalHitClicksRemaining > 0) { actualAttackDamage *= 2; addGameEvent({ text: '¡Crítico!', type: 'info', targetId: 'enemy-stats-container' }); }
            const golpeCerteroUpgrade = MIRROR_UPGRADES_CONFIG.find(u => u.id === MIRROR_UPGRADE_IDS.GOLPE_CERTERO_INICIAL);
            if (golpeCerteroUpgrade && metaProgress.mirrorUpgrades[MIRROR_UPGRADE_IDS.GOLPE_CERTERO_INICIAL] > 0 && !newRunStats.swordUsedThisLevelForMirror) { // swordUsedThisLevelForMirror for Mirror compatibility
                let totalBonus = 0; for(let i=0; i < metaProgress.mirrorUpgrades[MIRROR_UPGRADE_IDS.GOLPE_CERTERO_INICIAL]; i++) { totalBonus += golpeCerteroUpgrade.levels[i].effectValue; }
                actualAttackDamage += totalBonus; newRunStats.swordUsedThisLevelForMirror = true; addGameEvent({ text: `¡Golpe Certero Inicial! (+${totalBonus})`, type: 'info', targetId: 'enemy-stats-container' });
            }
            let damageToArmor = 0, damageToHp = actualAttackDamage;
            if (newEnemyState.armor > 0) {
                damageToArmor = Math.min(newEnemyState.armor, actualAttackDamage); newEnemyState.armor -= damageToArmor; damageToHp -= damageToArmor;
                addGameEvent({ text: `-${damageToArmor}🛡️`, type: 'armor-break', targetId: 'enemy-stats-container' }); if (damageToArmor > 0) playMidiSoundPlaceholder('enemy_armor_break');
            }
            if (damageToHp > 0) { newEnemyState.currentHp = Math.max(0, newEnemyState.currentHp - damageToHp); addGameEvent({ text: `-${damageToHp}`, type: 'damage-enemy', targetId: 'enemy-stats-container' }); }
            if (newPlayerState.vinculoDolorosoActive && newPlayerState.vinculoDolorosoClicksRemaining > 0) {
                 const vinculoAbilityValue = ALL_FURY_ABILITIES_MAP.get('fury_vinculo_doloroso')?.value as {damage:number} | undefined;
                 if (vinculoAbilityValue) { const recoilDamage = vinculoAbilityValue.damage;
                     if (!newPlayerState.isInvulnerable) { let actualRecoilDamage = recoilDamage;
                         if (newPlayerState.shield > 0) { const shieldDamage = Math.min(newPlayerState.shield, actualRecoilDamage); newPlayerState.shield -= shieldDamage; actualRecoilDamage -= shieldDamage; }
                         if(actualRecoilDamage > 0) newPlayerState.hp = Math.max(0, newPlayerState.hp - actualRecoilDamage); addGameEvent({ text: `-${actualRecoilDamage}🩸 (Vínculo)`, type: 'damage-player', targetId: 'player-stats-container' });
                         setGameState(prev => ({...prev, playerTookDamageThisLevel: true }));
                     }
                 }
            }
            if (gameState.isPrologueActive && gameState.prologueStep === 3 && !ftueEventTracker.current.firstAttackRevealedByPlayer) { ftueEventTracker.current.firstAttackRevealedByPlayer = true; advancePrologueStep(4); }
            break;
          case CellType.Gold:
            playMidiSoundPlaceholder('reveal_gold'); goldCollectedThisTurn++; let goldCollectedValue = GOLD_VALUE;
            const instintoBuscadorEcho = effectiveEcos.find(e => e.baseId === BASE_ECHO_INSTINTO_BUSCADOR);
            if (instintoBuscadorEcho) { const chance = (instintoBuscadorEcho.value as number) * (instintoBuscadorEcho.effectivenessMultiplier || 1); if (Math.random() < chance) { goldCollectedValue *= 2; triggerConditionalEchoAnimation(instintoBuscadorEcho.id); }}
            if (goldCollectedValue > 0) { newPlayerState.gold += goldCollectedValue; addGameEvent({ text: `+${goldCollectedValue}`, type: 'gold-player', targetId: 'player-stats-container' }); }
            if (gameState.isPrologueActive && gameState.prologueStep === 4 && !ftueEventTracker.current.firstGoldRevealed) { ftueEventTracker.current.firstGoldRevealed = true; advancePrologueStep(5); }
            newPlayerState.consecutiveSwordsRevealed = 0; // Reset combo on Gold
            break;
          case CellType.Clue:
            if (!ftueEventTracker.current.firstClueRevealed && gameState.isPrologueActive && gameState.prologueStep === 2) { ftueEventTracker.current.firstClueRevealed = true; advancePrologueStep(3); }
            if (cascadeDepthValue > 0 && cellData.adjacentItems?.total === 0 && depth < cascadeDepthValue) {
                for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { if (dr === 0 && dc === 0) continue;
                    const nextR = r + dr; const nextC = c + dc;
                    if (nextR >= 0 && nextR < gameState.currentBoardDimensions.rows && nextC >= 0 && nextC < gameState.currentBoardDimensions.cols && !currentBoard[nextR][nextC].revealed) {
                        if (currentBoard[nextR][nextC].type === CellType.Attack && Math.random() < cascadeDisarmChance) { // Changed from Bomb
                            playMidiSoundPlaceholder('cascade_disarm_attack');
                            addGameEvent({ text: '¡Ataque Neutralizado por Cascada!', type: 'info', targetId: `cell-${nextR}-${nextC}`});
                        } else {
                             cellsToProcessQueue.push({ r: nextR, c: nextC, depth: depth + 1});
                        }
                    }
                }
                if (highestCascadeEcho) triggerConditionalEchoAnimation(highestCascadeEcho.id);
            }
            newPlayerState.consecutiveSwordsRevealed = 0; // Reset combo on Clue
            break;
          case CellType.Trap:
            playMidiSoundPlaceholder('reveal_trap'); trapsTriggeredThisTurn++; const pasoLigeroActive = effectiveEcos.some(e => e.baseId === BASE_ECHO_PASO_LIGERO);
            if (pasoLigeroActive && !newPlayerState.pasoLigeroTrapIgnoredThisLevel) {
                newPlayerState.pasoLigeroTrapIgnoredThisLevel = true; const pasoLigeroEcho = effectiveEcos.find(e => e.baseId === BASE_ECHO_PASO_LIGERO); if(pasoLigeroEcho) triggerConditionalEchoAnimation(pasoLigeroEcho.id);
                addGameEvent({ text: '¡Paso Ligero anula trampa!', type: 'info', targetId: 'player-stats-container' });
            } else if (!newPlayerState.isInvulnerable) {
                let trapDamage = 1;
                if (newPlayerState.shield > 0) { const shieldDamage = Math.min(newPlayerState.shield, trapDamage); newPlayerState.shield -= shieldDamage; trapDamage -= shieldDamage; addGameEvent({ text: `-${shieldDamage}🛡️ (Trampa)`, type: 'armor-break', targetId: 'player-stats-container' }); }
                if (trapDamage > 0) { newPlayerState.hp = Math.max(0, newPlayerState.hp - trapDamage); addGameEvent({ text: `-${trapDamage} (Trampa)`, type: 'damage-player', targetId: 'player-stats-container' }); setGameState(prev => ({...prev, playerTookDamageThisLevel: true })); }
            }
            newPlayerState.consecutiveSwordsRevealed = 0; // Reset combo on Trap
            break;
        }
    }
    newRunStats.attacksTriggeredByPlayer += attacksByPlayerThisTurn;
    newRunStats.goldCellsRevealedThisRun += goldCollectedThisTurn;
    newRunStats.trapsTriggeredThisRun += trapsTriggeredThisTurn;

    setPlayer(newPlayerState);
    setEnemy(newEnemyState);

    const currentBoardWithEffects = updateBoardVisualEffects(recalculateAllClues(currentBoard), effectiveEcos);
    setBoard(currentBoardWithEffects);
    setRunStats(newRunStats);

    if (newPlayerState.hp <= 0) {
      // Defeat is handled by useEffect [player.hp]
      setGamePhase(GamePhase.PLAYER_ACTION_RESOLVING); // Still transition phase to allow effects to resolve
      return;
    } else if (newEnemyState.currentHp <= 0) {
      playMidiSoundPlaceholder('enemy_defeat');
      GoalTrackingService.processEvent('ENEMY_DEFEATED', { enemyArchetypeId: newEnemyState.archetypeId } as GoalEnemyDefeatedPayload, metaProgress, setAndSaveMetaProgress);

      const isFTUERun = metaProgress.hasCompletedFirstRun === false;
      setRunStats(prev => ({ ...prev, enemiesDefeatedThisRun: prev.enemiesDefeatedThisRun + 1, soulFragmentsEarnedThisRun: prev.soulFragmentsEarnedThisRun + SOUL_FRAGMENTS_PER_ENEMY_DEFEAT }));

      setAvailableEchoChoices(generateEchoChoicesForPostLevelScreen(gameState.currentLevel, activeEcos, newPlayerState, metaProgress));

      let mapDecisionNowPending = false;
      if (!isFTUERun && !gameState.isPrologueActive && gameState.currentStretchCompletedLevels >= gameState.levelsInCurrentStretch -1 ) {
        mapDecisionNowPending = true;
      }

      setGameState(prev => ({
        ...prev,
        status: GameStatus.PostLevel,
        mapDecisionPending: mapDecisionNowPending,
        postLevelActionTaken: isFTUERun ? true : false,
        furyMinigameCompletedForThisLevel: isFTUERun ? true : false,
        currentPhase: GamePhase.PLAYER_ACTION_RESOLVING, // Player action is resolving
      }));
      return;
    } else if (gameState.status === GameStatus.Playing && checkAllPlayerBeneficialAttacksRevealed()) {
      triggerBattlefieldReduction();
    }

    let finalEnemyStateForFuryUpdate = { ...newEnemyState };
    if (finalEnemyStateForFuryUpdate.currentHp > 0 && !gameState.isPrologueActive) {
        finalEnemyStateForFuryUpdate.currentFuryCharge = Math.min(finalEnemyStateForFuryUpdate.furyActivationThreshold, finalEnemyStateForFuryUpdate.currentFuryCharge + (cellsRevealedThisTurnForFury * FURY_INCREMENT_PER_CLICK));
    }
    setEnemy(finalEnemyStateForFuryUpdate);

    if (newPlayerState.hp === 1 && !newPlayerState.ultimoAlientoUsedThisRun) {
        const ultimoAlientoEcho = effectiveEcos.find(e => e.baseId === BASE_ECHO_ULTIMO_ALIENTO);
        if (ultimoAlientoEcho) {
            const updatedPlayerForAliento = {...newPlayerState, ultimoAlientoUsedThisRun: true, isInvulnerable: true, invulnerabilityClicksRemaining: (ultimoAlientoEcho.value as { clicks: number }).clicks, criticalHitClicksRemaining: (ultimoAlientoEcho.value as { clicks: number }).clicks};
            setPlayer(updatedPlayerForAliento);
            triggerConditionalEchoAnimation(ultimoAlientoEcho.id); addGameEvent({ text: '¡Último Aliento!', type: 'info', targetId: 'player-stats-container' });
        }
    }

    if (gameState.isPrologueActive && gameState.currentLevel === PROLOGUE_LEVEL_ID && gameState.prologueStep === 6 && newEnemyState.currentHp > 0) {
      advancePrologueStep(6); // Should be 7 after enemy defeat for prologue
    }

    setGamePhase(GamePhase.PLAYER_ACTION_RESOLVING);

  }, [
    board, player, enemy, activeEcos, runStats, gameState, addGameEvent, setGameStatus, advancePrologueStep,
    triggerConditionalEchoAnimation, metaProgress, setAndSaveMetaProgress, checkAllPlayerBeneficialAttacksRevealed,
    triggerBattlefieldReduction, updateBoardVisualEffects, applyFuryEffect, generateEchoChoicesForPostLevelScreen,
    generateBoardFromBoardParameters, setGamePhase,
  ]);


  useEffect(() => {
    if (phaseTransitionTimeoutRef.current) clearTimeout(phaseTransitionTimeoutRef.current);
    if (aiThinkingIntervalRef.current) clearInterval(aiThinkingIntervalRef.current);

    switch (gameState.currentPhase) {
      case GamePhase.PLAYER_ACTION_RESOLVING:
        phaseTransitionTimeoutRef.current = window.setTimeout(() => {
           if (gameState.status !== GameStatus.Playing) { // Check game status first
             console.log("Game ended during player action resolution. Halting turn progression.");
             return;
           }
           setGamePhase(GamePhase.ENEMY_THINKING);
        }, PLAYER_ACTION_RESOLVE_DELAY_MS);
        break;

      case GamePhase.ENEMY_THINKING:
        setGameState(prev => ({ ...prev, aiThinkingCellCoords: null, aiActionTargetCell: null }));
        const thinkDuration = randomInt(ENEMY_THINKING_MIN_DURATION_MS, ENEMY_THINKING_MAX_DURATION_MS);
        let elapsedThinkTime = 0;
        let aiHasMadeDecision = false;

        aiPlayerRef.current.decideNextMove(board, enemy, player)
            .then(decision => {
                if (gameState.currentPhase === GamePhase.ENEMY_THINKING) {
                    aiHasMadeDecision = true;
                    if (aiThinkingIntervalRef.current) clearInterval(aiThinkingIntervalRef.current);
                    setGameState(prev => ({ ...prev, aiActionTargetCell: decision.cell, aiThinkingCellCoords: null }));
                    console.log("AI Decision:", decision.reasoning);
                    setGamePhase(GamePhase.ENEMY_ACTION_PENDING_REVEAL);
                }
            })
            .catch(error => {
                console.error("AI decision error:", error);
                 if (gameState.currentPhase === GamePhase.ENEMY_THINKING) {
                    const hiddenCells: CellPosition[] = [];
                    board.forEach((row, r_idx) => row.forEach((cell, c_idx) => { if (!cell.revealed) hiddenCells.push({ row: r_idx, col: c_idx }); }));
                    if (hiddenCells.length > 0) {
                        const randomCell = hiddenCells[Math.floor(Math.random() * hiddenCells.length)];
                        setGameState(prev => ({ ...prev, aiActionTargetCell: randomCell, aiThinkingCellCoords: null }));
                    }
                    setGamePhase(GamePhase.ENEMY_ACTION_PENDING_REVEAL);
                }
            });

        aiThinkingIntervalRef.current = window.setInterval(() => {
          if (aiHasMadeDecision) {
            if (aiThinkingIntervalRef.current) clearInterval(aiThinkingIntervalRef.current);
            return;
          }
          const hiddenCells: AICellInfo[] = [];
          board.forEach((row, r_idx) => row.forEach((cell, c_idx) => { if (!cell.revealed) hiddenCells.push({ row: r_idx, col: c_idx }); }));
          if (hiddenCells.length > 0) {
            const randomThinkingCell = hiddenCells[Math.floor(Math.random() * hiddenCells.length)];
            setGameState(prev => ({ ...prev, aiThinkingCellCoords: randomThinkingCell }));
          }
          elapsedThinkTime += ENEMY_THINKING_HIGHLIGHT_INTERVAL_MS;
          if (elapsedThinkTime >= thinkDuration && !aiHasMadeDecision) {
            if (aiThinkingIntervalRef.current) clearInterval(aiThinkingIntervalRef.current);
            console.warn("AI thinking timed out, AI promise might be stuck. Forcing fallback.");
             const hidden: CellPosition[] = [];
             board.forEach((r, r_idx) => r.forEach((c, c_idx) => { if (!c.revealed) hidden.push({ row: r_idx, col: c_idx }); }));
             if (hidden.length > 0) {
                 const randomCell = hidden[Math.floor(Math.random() * hidden.length)];
                 setGameState(prev => ({ ...prev, aiActionTargetCell: randomCell, aiThinkingCellCoords: null }));
             }
            setGamePhase(GamePhase.ENEMY_ACTION_PENDING_REVEAL);
          }
        }, ENEMY_THINKING_HIGHLIGHT_INTERVAL_MS);
        break;

      case GamePhase.ENEMY_ACTION_PENDING_REVEAL:
        phaseTransitionTimeoutRef.current = window.setTimeout(() => {
          if (gameState.aiActionTargetCell) {
            processEnemyMove(gameState.aiActionTargetCell.row, gameState.aiActionTargetCell.col);
          }
          setGamePhase(GamePhase.ENEMY_ACTION_RESOLVING);
        }, ENEMY_ACTION_PENDING_REVEAL_DELAY_MS);
        break;

      case GamePhase.ENEMY_ACTION_RESOLVING:
        if (gameState.status === GameStatus.Playing && // Check if game is still playing before Fury
            enemy.currentHp > 0 &&
            // player.hp > 0 check here is tricky due to state closure.
            // The useEffect for player.hp handles defeat.
            // If player was defeated by the enemy's main move, status would not be Playing.
            enemy.currentFuryCharge >= enemy.furyActivationThreshold) {

            let abilityToApply: FuryAbility | null = null;
            if (gameState.isPrologueActive && gameState.currentLevel === PROLOGUE_LEVEL_ID) {
                abilityToApply = gameState.prologueEnemyFuryAbility || PROLOGUE_SHADOW_EMBER_FURY_ABILITY;
            } else if (enemy.furyAbilities.length > 0) {
                abilityToApply = enemy.furyAbilities[enemy.activeFuryCycleIndex];
                setEnemy(prev => ({ ...prev, activeFuryCycleIndex: (prev.activeFuryCycleIndex + 1) % prev.furyAbilities.length }));
            }

            if (abilityToApply) {
                addGameEvent({ text: `¡FURIA! ${abilityToApply.name}`, type: 'info', targetId: 'enemy-stats-container' });
                applyFuryEffect(abilityToApply); // This will call setPlayer, triggering the player.hp useEffect if HP drops to 0
                setEnemy(prev => ({ ...prev, currentFuryCharge: 0 }));

                if (enemy.nextEnemyFuryIsDoubled && abilityToApply) {
                    const secondAbilityInstance = {...abilityToApply};
                    applyFuryEffect(secondAbilityInstance);
                    setEnemy(prev => ({ ...prev, nextEnemyFuryIsDoubled: false }));
                    addGameEvent({ text: `¡FURIA DOBLE!`, type: 'info', targetId: 'enemy-stats-container' });
                }
                // No explicit player.hp <= 0 check here; useEffect [player.hp] handles it.
            }
        }

        phaseTransitionTimeoutRef.current = window.setTimeout(() => {
          setGameState(prev => ({ ...prev, aiActionTargetCell: null }));
          // Transition to player turn only if the game is still 'Playing'
          // The player.hp > 0 check here is a secondary guard; gameState.status is primary.
          if (gameState.status === GameStatus.Playing && player.hp > 0 && enemy.currentHp > 0) {
             setGamePhase(GamePhase.PLAYER_TURN);
          }
        }, ENEMY_ACTION_RESOLVE_DELAY_MS);
        break;

      case GamePhase.PLAYER_TURN:
        if (gameState.aiThinkingCellCoords || gameState.aiActionTargetCell) {
            setGameState(prev => ({ ...prev, aiThinkingCellCoords: null, aiActionTargetCell: null }));
        }
        break;
    }
    return () => {
        if (phaseTransitionTimeoutRef.current) clearTimeout(phaseTransitionTimeoutRef.current);
        if (aiThinkingIntervalRef.current) clearInterval(aiThinkingIntervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.currentPhase, board, setGamePhase, player.hp, enemy.currentHp, enemy.furyActivationThreshold]);


  const cycleCellMark = useCallback((row: number, col: number) => {
    if (gameState.currentPhase !== GamePhase.PLAYER_TURN) return;

    let canMark = false;
    const marcadorTactico = activeEcos.find(e => e.baseId === BASE_ECHO_MARCADOR_TACTICO);
    const cartografiaAvanzada = activeEcos.find(e => e.baseId === BASE_ECHO_CARTOGRAFIA_AVANZADA);
    if (marcadorTactico || cartografiaAvanzada) canMark = true;
    if (!canMark) { addGameEvent({ text: "Eco de Marcado no activo.", type: 'info' }); playMidiSoundPlaceholder('mark_attempt_fail_no_echo'); return; }
    setBoard(prevBoard => {
      const newBoard = prevBoard.map(r => r.map(cell => ({ ...cell }))); const cell = newBoard[row][col];
      if (cell.revealed || cell.lockedIncorrectlyForClicks > 0) return prevBoard;
      const markOrder: (MarkType | null)[] = [null, MarkType.GenericFlag];
      if (cartografiaAvanzada) { markOrder.push(MarkType.Bomb, MarkType.Sword, MarkType.Gold, MarkType.Question); } // Bomb/Sword mark Attack now
      const currentMarkIndex = markOrder.indexOf(cell.markType); cell.markType = markOrder[(currentMarkIndex + 1) % markOrder.length];
      playMidiSoundPlaceholder(`mark_cell_${cell.markType || 'none'}`); return newBoard;
    });
  }, [activeEcos, addGameEvent, gameState.currentPhase]);

  const selectEchoOption = useCallback((echoId: string): boolean => {
    const selectedFullEcho = ALL_ECHOS_MAP.get(echoId); if (!selectedFullEcho) return false;
    const costMultiplier = player.nextEchoCostsDoubled && !selectedFullEcho.isFree ? 2 : 1;
    const actualCost = selectedFullEcho.cost * costMultiplier;
    if (!selectedFullEcho.isFree && player.gold < actualCost) { addGameEvent({ text: "Oro insuficiente.", type: 'info' }); return false; }
    playMidiSoundPlaceholder(`echo_select_${selectedFullEcho.id}`);
    let newActiveEcos = [...activeEcos]; const existingEchoIndex = newActiveEcos.findIndex(e => e.baseId === selectedFullEcho.baseId);
    if (existingEchoIndex !== -1) newActiveEcos[existingEchoIndex] = selectedFullEcho; else newActiveEcos.push(selectedFullEcho);
    if (!runStats.runUniqueEcosActivated.includes(selectedFullEcho.baseId)) { setRunStats(prev => ({...prev, runUniqueEcosActivated: [...prev.runUniqueEcosActivated, selectedFullEcho.baseId]})); GoalTrackingService.processEvent('UNIQUE_ECO_ACTIVATED', null, metaProgress, setAndSaveMetaProgress); }
    let newPlayerHp = player.hp, newPlayerMaxHp = player.maxHp, newPlayerGold = selectedFullEcho.isFree ? player.gold : player.gold - actualCost, newPlayerNextEchoCostsDoubled = false;
    if (player.nextEchoCostsDoubled && !selectedFullEcho.isFree) newPlayerNextEchoCostsDoubled = false; else newPlayerNextEchoCostsDoubled = player.nextEchoCostsDoubled;
    if (selectedFullEcho.effectType === EchoEffectType.GainHP) { const healAmount = (selectedFullEcho.value as number) * (selectedFullEcho.effectivenessMultiplier || 1); newPlayerHp = Math.min(player.maxHp, player.hp + healAmount); addGameEvent({ text: `+${healAmount} HP`, type: 'heal-player', targetId: 'player-stats-container' }); }
    else if (selectedFullEcho.effectType === EchoEffectType.IncreaseMaxHP) { const increaseAmount = (selectedFullEcho.value as number) * (selectedFullEcho.effectivenessMultiplier || 1); newPlayerMaxHp = player.maxHp + increaseAmount; newPlayerHp = player.hp + increaseAmount; addGameEvent({ text: `Max HP +${increaseAmount}`, type: 'info', targetId: 'player-stats-container' }); }
    else if (selectedFullEcho.baseId === BASE_ECHO_ALQUIMIA_IMPROVISADA) setPlayer(prev => ({...prev, alquimiaImprovisadaChargeAvailable: true}));
    setPlayer(prev => ({ ...prev, hp: newPlayerHp, maxHp: newPlayerMaxHp, gold: newPlayerGold, nextEchoCostsDoubled: newPlayerNextEchoCostsDoubled }));
    setActiveEcosState(newActiveEcos); if(!selectedFullEcho.isFree) setRunStats(prev => ({...prev, nonFreeEcosAcquiredThisRun: prev.nonFreeEcosAcquiredThisRun + 1}));
    if (gameState.isPrologueActive && gameState.currentLevel === PROLOGUE_LEVEL_ID && gameState.prologueStep === 7) advancePrologueStep(8);
    if (selectedFullEcho.baseId === BASE_ECHO_CORAZON_ABISMO) {
        const sacrificeAmount = Math.floor(player.hp / 2); const hpAfterSacrifice = player.hp - sacrificeAmount;
        if (hpAfterSacrifice < 1) { addGameEvent({ text: "¡Sacrificio demasiado grande!", type: 'info' }); setActiveEcosState(activeEcos.filter(e => e.baseId !== BASE_ECHO_CORAZON_ABISMO)); return false; }
        setPlayer(prev => ({ ...prev, hp: hpAfterSacrifice })); addGameEvent({ text: `-${sacrificeAmount} HP (Corazón del Abismo)`, type: 'damage-player', targetId: 'player-stats-container' });
        const epicEchos = ALL_ECHOS_LIST.filter(e => e.rarity === Rarity.Epic && !activeEcos.some(ae => ae.baseId === e.baseId) && e.baseId !== BASE_ECHO_CORAZON_ABISMO);
        const randomEpicEcho = epicEchos.length > 0 ? epicEchos[Math.floor(Math.random() * epicEchos.length)] : null;
        const duplicableActiveEcos = activeEcos.filter(e => (e.rarity === Rarity.Common || e.rarity === Rarity.Rare) && e.baseId !== BASE_ECHO_CORAZON_ABISMO);
        setGameState(prev => ({ ...prev, isCorazonDelAbismoChoiceActive: true, corazonDelAbismoOptions: { randomEpicEcho, duplicableActiveEcos: duplicableActiveEcos as Echo[] }}));
        triggerConditionalEchoAnimation(selectedFullEcho.id); return true;
    } else setGameState(prev => ({ ...prev, postLevelActionTaken: true }));
    return false;
  }, [player, activeEcos, addGameEvent, runStats, metaProgress, setAndSaveMetaProgress, triggerConditionalEchoAnimation, setGameState, advancePrologueStep, gameState.isPrologueActive, gameState.currentLevel, gameState.prologueStep]);

  const advanceFuryMinigamePhase = useCallback((shuffledOrder?: number[] | null) => {
    setGameState(prev => {
        let nextPhase: FuryMinigamePhase = prev.furyMinigamePhase;
        let newPlayerSelectedFuryCardDisplayIndex = prev.playerSelectedFuryCardDisplayIndex;
        let newShuffledOrder = prev.shuffledFuryCardOrder;
        let newGuidingTextKey = prev.guidingTextKey; let newPrologueStep = prev.prologueStep;
        let newOracleSelectedFuryAbility = prev.oracleSelectedFuryAbility;

        switch (prev.furyMinigamePhase) {
            case 'starting': nextPhase = 'reveal_cards'; if (prev.isPrologueActive && prev.currentLevel === PROLOGUE_LEVEL_ID && prev.prologueStep === 9) { newPrologueStep = 10; newGuidingTextKey = 10 as keyof typeof PROLOGUE_MESSAGES; } break;
            case 'reveal_cards': nextPhase = 'cards_revealed'; break;
            case 'cards_revealed': nextPhase = 'flipping_to_back'; if (prev.isPrologueActive && prev.currentLevel === PROLOGUE_LEVEL_ID && prev.prologueStep === 10) { newPrologueStep = 11; newGuidingTextKey = 11 as keyof typeof PROLOGUE_MESSAGES; } break;
            case 'flipping_to_back': nextPhase = 'shuffling'; break;
            case 'shuffling': 
                nextPhase = 'ready_to_pick'; 
                if (shuffledOrder) newShuffledOrder = shuffledOrder; 
                if (prev.isPrologueActive && prev.currentLevel === PROLOGUE_LEVEL_ID && prev.prologueStep === 11) { newPrologueStep = 12; newGuidingTextKey = 12 as keyof typeof PROLOGUE_MESSAGES; } break;
            case 'card_picked': nextPhase = 'revealing_choice'; break;
            case 'revealing_choice':
                nextPhase = 'inactive';
                if (prev.playerSelectedFuryCardDisplayIndex !== null && prev.furyCardOptions.length > 0) {
                    const actualOriginalIndex = newShuffledOrder[prev.playerSelectedFuryCardDisplayIndex]; // Use newShuffledOrder as it's the final order
                    const chosenAbility = prev.furyCardOptions[actualOriginalIndex];
                    if (chosenAbility) newOracleSelectedFuryAbility = chosenAbility;
                }
                if (prev.isPrologueActive && prev.currentLevel === PROLOGUE_LEVEL_ID && prev.prologueStep === 12) { newPrologueStep = 13; newGuidingTextKey = 13 as keyof typeof PROLOGUE_MESSAGES; }
                break;
            case 'inactive': nextPhase = 'inactive'; break;
        }
        const furyMinigameCompleted = nextPhase === 'inactive';
        return { ...prev, furyMinigamePhase: nextPhase, oracleSelectedFuryAbility: newOracleSelectedFuryAbility, playerSelectedFuryCardDisplayIndex: newPlayerSelectedFuryCardDisplayIndex, shuffledFuryCardOrder: newShuffledOrder, furyMinigameCompletedForThisLevel: furyMinigameCompleted ? true : prev.furyMinigameCompletedForThisLevel, guidingTextKey: newGuidingTextKey, prologueStep: newPrologueStep, isFuryMinigameActive: nextPhase === 'inactive' ? false : prev.isFuryMinigameActive };
    });
  }, [advancePrologueStep]);

  const handlePlayerFuryCardSelection = useCallback((displayIndex: number) => {
    if (gameState.furyMinigamePhase !== 'ready_to_pick') return;
    playMidiSoundPlaceholder('fury_card_select');
    setGameState(prev => ({ ...prev, playerSelectedFuryCardDisplayIndex: displayIndex, furyMinigamePhase: 'card_picked' }));
  }, [gameState.furyMinigamePhase]);

  const tryActivateAlquimiaImprovisada = useCallback(() => {
    const alquimiaEcho = activeEcos.find(e => e.baseId === BASE_ECHO_ALQUIMIA_IMPROVISADA);
    if (!alquimiaEcho || !player.alquimiaImprovisadaChargeAvailable) return;
    const cost = (alquimiaEcho.value as number)  * (alquimiaEcho.effectivenessMultiplier || 1);
    if (player.gold < cost) { addGameEvent({ text: `Oro insuficiente para Alquimia (${cost})`, type: 'info' }); playMidiSoundPlaceholder('alquimia_activate_fail_gold'); return; }
    playMidiSoundPlaceholder('alquimia_activate_success');
    setPlayer(prev => ({ ...prev, gold: prev.gold - cost, alquimiaImprovisadaChargeAvailable: false, alquimiaImprovisadaActiveForNextBomb: true }));
    triggerConditionalEchoAnimation(alquimiaEcho.id); addGameEvent({ text: 'Alquimia Improvisada ¡Activada!', type: 'info', targetId: 'player-stats-container' });
  }, [player, activeEcos, addGameEvent, triggerConditionalEchoAnimation]);

  const tryActivateOjoOmnisciente = useCallback(() => {
    const ojoEcho = activeEcos.find(e => e.baseId === BASE_ECHO_OJO_OMNISCIENTE); if (!ojoEcho || player.ojoOmniscienteUsedThisLevel) return;
    let targetFound = false, revealedCellR = -1, revealedCellC = -1;
    const BOARD_ROWS_FOR_LEVEL = board.length; const BOARD_COLS_FOR_LEVEL = board[0]?.length || 0;
    for (let r = 0; r < BOARD_ROWS_FOR_LEVEL && !targetFound; r++) for (let c = 0; c < BOARD_COLS_FOR_LEVEL && !targetFound; c++) {
        if (board[r][c].revealed && board[r][c].type === CellType.Clue) {
            for (let dr = -1; dr <= 1 && !targetFound; dr++) for (let dc = -1; dc <= 1 && !targetFound; dc++) { if (dr === 0 && dc === 0) continue;
                const nr = r + dr; const nc = c + dc;
                if (nr >= 0 && nr < BOARD_ROWS_FOR_LEVEL && nc >= 0 && nc < BOARD_COLS_FOR_LEVEL && !board[nr][nc].revealed && (board[nr][nc].type === CellType.Attack || board[nr][nc].type === CellType.Gold)) { targetFound = true; revealedCellR = nr; revealedCellC = nc; } // Check for Attack
            }
        }
    }
    if (targetFound && revealedCellR !== -1) {
        playMidiSoundPlaceholder('ojo_omnisciente_activate'); const newBoard = board.map(bRow => bRow.map(bCell => ({...bCell})));
        newBoard[revealedCellR][revealedCellC].revealed = true; setBoard(updateBoardVisualEffects(recalculateAllClues(newBoard), activeEcos));
        setPlayer(prev => ({ ...prev, ojoOmniscienteUsedThisLevel: true })); triggerConditionalEchoAnimation(ojoEcho.id);
        addGameEvent({ text: '¡Ojo Omnisciente revela un objeto!', type: 'info', targetId: `cell-${revealedCellR}-${revealedCellC}` });
    } else { playMidiSoundPlaceholder('ojo_omnisciente_fail_no_targets'); addGameEvent({ text: 'Ojo Omnisciente: No hay objetos válidos que revelar.', type: 'info' }); }
  }, [player, board, activeEcos, addGameEvent, triggerConditionalEchoAnimation, updateBoardVisualEffects, recalculateAllClues]);

  const resolveCorazonDelAbismoChoice = useCallback((type: 'epic' | 'duplicate', chosenEchoId?: string) => {
    if (!gameState.isCorazonDelAbismoChoiceActive) return; const { corazonDelAbismoOptions } = gameState; if (!corazonDelAbismoOptions) return;
    let echoToAddOrUpdate: Echo | null = null; let effectApplied = false;
    if (type === 'epic' && corazonDelAbismoOptions.randomEpicEcho) { echoToAddOrUpdate = corazonDelAbismoOptions.randomEpicEcho; playMidiSoundPlaceholder(`corazon_resolve_epic_${echoToAddOrUpdate.id}`); addGameEvent({ text: `¡Nuevo Eco Épico: ${echoToAddOrUpdate.name}!`, type: 'info' }); effectApplied = true; }
    else if (type === 'duplicate' && chosenEchoId) {
        const echoToDuplicate = activeEcos.find(e => e.id === chosenEchoId);
        if (echoToDuplicate) { echoToAddOrUpdate = { ...echoToDuplicate, effectivenessMultiplier: (echoToDuplicate.effectivenessMultiplier || 1) + 1 }; playMidiSoundPlaceholder(`corazon_resolve_duplicate_${echoToDuplicate.id}`); addGameEvent({ text: `¡Eco ${echoToDuplicate.name} potenciado! (x${echoToAddOrUpdate.effectivenessMultiplier})`, type: 'info' }); effectApplied = true; }
    }
    if (effectApplied && echoToAddOrUpdate) {
        let newActiveEcos = [...activeEcos]; const existingIndex = newActiveEcos.findIndex(e => e.baseId === echoToAddOrUpdate!.baseId);
        if (existingIndex !== -1) newActiveEcos[existingIndex] = echoToAddOrUpdate; else newActiveEcos.push(echoToAddOrUpdate);
        setActiveEcosState(newActiveEcos);
        if (!runStats.runUniqueEcosActivated.includes(echoToAddOrUpdate.baseId)) { setRunStats(prev => ({...prev, runUniqueEcosActivated: [...prev.runUniqueEcosActivated, echoToAddOrUpdate!.baseId]})); GoalTrackingService.processEvent('UNIQUE_ECO_ACTIVATED', null, metaProgress, setAndSaveMetaProgress); }
    }
    setGameState(prev => ({ ...prev, isCorazonDelAbismoChoiceActive: false, corazonDelAbismoOptions: null, postLevelActionTaken: true }));
  }, [gameState.isCorazonDelAbismoChoiceActive, gameState.corazonDelAbismoOptions, activeEcos, addGameEvent, runStats.runUniqueEcosActivated, metaProgress, setAndSaveMetaProgress, gameState]);

  const fullActiveEcos = useMemo(() => getCurrentlyEffectiveEcos(activeEcos, player.deactivatedEcos), [activeEcos, player.deactivatedEcos]);

 useEffect(() => {
    const playerActionJustCompleted = gameState.postLevelActionTaken && !gameState.isFuryMinigameActive && !gameState.furyMinigameCompletedForThisLevel;
    const furyGameJustCompleted = !gameState.isFuryMinigameActive && gameState.furyMinigameCompletedForThisLevel;
    if (gameState.status === GameStatus.PostLevel && (playerActionJustCompleted || furyGameJustCompleted) && !gameState.isCorazonDelAbismoChoiceActive && !gameState.isBattlefieldReductionTransitioning) {
        if (gameState.mapDecisionPending) setGameStatus(GameStatus.AbyssMapView); else proceedToNextLevel();
    }
    wasCorazonDelAbismoChoiceActivePreviously.current = gameState.isCorazonDelAbismoChoiceActive;
  }, [gameState.status, gameState.postLevelActionTaken, gameState.isFuryMinigameActive, gameState.furyMinigameCompletedForThisLevel, gameState.isCorazonDelAbismoChoiceActive, gameState.isBattlefieldReductionTransitioning, gameState.mapDecisionPending, proceedToNextLevel, setGameStatus]);

  useEffect(() => {
    if (gameState.guidingTextKey === 'BATTLEFIELD_REDUCTION_COMPLETE' && !gameState.isBattlefieldReductionTransitioning) {
      const timer = setTimeout(() => { if (gameState.guidingTextKey === 'BATTLEFIELD_REDUCTION_COMPLETE') advancePrologueStep(''); }, 4000);
      return () => clearTimeout(timer);
    }
  }, [gameState.guidingTextKey, gameState.isBattlefieldReductionTransitioning, advancePrologueStep]);

  const debugWinLevel = useCallback(() => {
    if (gameState.status !== GameStatus.Playing) return; playMidiSoundPlaceholder('debug_win_level');
    setEnemy(prev => ({...prev, currentHp: 0}));
    GoalTrackingService.processEvent('ENEMY_DEFEATED', { enemyArchetypeId: enemy.archetypeId } as GoalEnemyDefeatedPayload, metaProgress, setAndSaveMetaProgress);
    setRunStats(prev => ({ ...prev, enemiesDefeatedThisRun: prev.enemiesDefeatedThisRun + 1, soulFragmentsEarnedThisRun: prev.soulFragmentsEarnedThisRun + SOUL_FRAGMENTS_PER_ENEMY_DEFEAT }));

    const isFTUERun = metaProgress.hasCompletedFirstRun === false;
    setAvailableEchoChoices(generateEchoChoicesForPostLevelScreen(gameState.currentLevel, activeEcos, player, metaProgress));

    let mapDecisionNowPending = false;
    if (!isFTUERun && !gameState.isPrologueActive && gameState.currentStretchCompletedLevels >= gameState.levelsInCurrentStretch - 1) {
        mapDecisionNowPending = true;
        if (gameState.stretchRewardPending) {
            const reward = gameState.stretchRewardPending; let newSoulFragments = runStats.soulFragmentsEarnedThisRun + SOUL_FRAGMENTS_PER_ENEMY_DEFEAT;
            if (reward.type === MapRewardType.SoulFragments && reward.value) { newSoulFragments += reward.value; addGameEvent({text: `+${reward.value} Fragmentos de Alma (Mapa)!`, type: 'gold-player', targetId: 'player-stats-container'}); }
            else if (reward.type === MapRewardType.WillLumens && reward.value) { setAndSaveMetaProgress(prevMeta => ({...prevMeta, willLumens: prevMeta.willLumens + (reward.value || 0)})); addGameEvent({text: `+${reward.value} Lúmenes (Mapa)!`, type: 'gold-player', targetId: 'player-stats-container'}); }
            else if (reward.type === MapRewardType.HealingFountain && reward.value) { setPlayer(p => { const healedHp = Math.min(p.maxHp, p.hp + (reward.value || 0)); addGameEvent({text: `+${healedHp - p.hp} HP (Fuente)!`, type: 'heal-player', targetId: 'player-stats-container'}); return {...p, hp: healedHp}; }); }
            setRunStats(prev => ({ ...prev, soulFragmentsEarnedThisRun: newSoulFragments })); setGameState(prev => ({...prev, stretchRewardPending: null}));
        }
    }
    setGameState(prev => ({
      ...prev,
      status: GameStatus.PostLevel,
      postLevelActionTaken: isFTUERun ? true : false,
      furyMinigameCompletedForThisLevel: isFTUERun ? true : false,
      prologueStep: (prev.isPrologueActive && prev.currentLevel === PROLOGUE_LEVEL_ID) ? 7 : prev.prologueStep,
      guidingTextKey: (prev.isPrologueActive && prev.currentLevel === PROLOGUE_LEVEL_ID) ? 7 as keyof typeof PROLOGUE_MESSAGES : prev.guidingTextKey,
      mapDecisionPending: mapDecisionNowPending,
      // currentPhase: prev.currentPhase,
    }));
  }, [gameState, enemy.archetypeId, activeEcos, player, metaProgress, setAndSaveMetaProgress, generateEchoChoicesForPostLevelScreen, addGameEvent, runStats.soulFragmentsEarnedThisRun]);


  return {
    gameState, player, enemy, board, activeEcos, availableEchoChoices, fullActiveEcos, runStats, metaProgress,
    setAndSaveMetaProgress, initializeNewRun, requestPrologueStart, startPrologueActual, 
    handlePlayerCellSelection, cycleCellMark, selectEchoOption, proceedToNextLevel,
    setGameStatus, advanceFuryMinigamePhase, handlePlayerFuryCardSelection,
    advancePrologueStep, conditionalEchoTriggeredId: gameState.conditionalEchoTriggeredId,
    popEvent, tryActivateAlquimiaImprovisada, tryActivateOjoOmnisciente, resolveCorazonDelAbismoChoice,
    confirmAndAbandonRun, triggerBattlefieldReduction, selectMapPathAndStartStretch, debugWinLevel,
  };
};
