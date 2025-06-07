
import { useState, useCallback, useEffect } from 'react';
import {
  PlayerState, EnemyState, BoardState, CellState, CellType,
  SandboxConfig, SandboxState, ActiveEchoId, FuryAbility, ItemLockConfig, MarkType, Echo 
} from '../types';
import {
  INITIAL_PLAYER_HP, INITIAL_PLAYER_GOLD, INITIAL_PLAYER_SHIELD,
  FURY_INCREMENT_PER_CLICK, ATTACK_DAMAGE_PLAYER_VS_ENEMY, ATTACK_DAMAGE_ENEMY_VS_PLAYER, GOLD_VALUE, // Using new ATTACK_DAMAGE constants
  ALL_ECHOS_MAP, BASE_ECHO_ECO_CASCADA, 
} from '../constants';
import { playMidiSoundPlaceholder } from '../utils/soundUtils';


export const DEFAULT_SANDBOX_CONFIG: SandboxConfig = {
  player: { hp: 10, maxHp: 10, gold: 5, shield: 0 },
  enemy: { hp: 10, maxHp: 10, fury: 0, maxFury: 10, name: "Dummy Target", armor: 0 }, 
  board: {
    rows: 8,
    cols: 8,
    attacks: 20, // Unified attacks
    gold: 5,
    clues: 8 * 8 - (20 + 5), 
  },
  itemLocks: { 
    attacksLocked: false, // Unified
    goldLocked: false,
    cluesLocked: false,
  },
  lockItemRatios: false, 
};

const generateSandboxBoard = (config: SandboxConfig['board']): BoardState => {
  const { rows, cols, attacks, gold } = config; // Use 'attacks'
  let newBoard: BoardState = Array(rows).fill(null).map((_, r) =>
    Array(cols).fill(null).map((_, c) => ({
      id: `cell-${r}-${c}`, row: r, col: c, type: CellType.Empty,
      revealed: false, 
      markType: null, 
      lockedIncorrectlyForClicks: 0,
    }))
  );

  const placeItems = (count: number, itemType: CellType) => {
    let placed = 0;
    let attempts = 0; 
    while (placed < count && attempts < rows * cols * 2) {
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);
      if (newBoard[r][c].type === CellType.Empty) {
        newBoard[r][c].type = itemType;
        placed++;
      }
      attempts++;
    }
  };

  const totalItemsToPlace = attacks + gold;
  if (totalItemsToPlace > rows * cols) {
    console.warn("Sandbox: Sum of attacks and gold exceeds total cells. Board generation might be incorrect.");
    let adjustedAttacks = Math.min(attacks, rows * cols);
    let adjustedGold = Math.min(gold, rows * cols - adjustedAttacks);
    
    placeItems(adjustedAttacks, CellType.Attack);
    placeItems(adjustedGold, CellType.Gold);
  } else {
    placeItems(attacks, CellType.Attack);
    placeItems(gold, CellType.Gold);
  }
  
  const MAX_SANDBOX_TRAPS = Math.floor((rows * cols) * 0.05); 
  let trapsToPlace = 0;
  const emptyCellsForTraps = newBoard.flat().filter(cell => cell.type === CellType.Empty).length;
  if (emptyCellsForTraps > MAX_SANDBOX_TRAPS) {
      trapsToPlace = MAX_SANDBOX_TRAPS;
  } else if (emptyCellsForTraps > 0) {
      trapsToPlace = 1;
  }
  placeItems(trapsToPlace, CellType.Trap);


  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (newBoard[r][c].type === CellType.Empty) {
        newBoard[r][c].type = CellType.Clue;
      }
      if (newBoard[r][c].type === CellType.Clue) {
        let attacksAdj = 0, goldAdj = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
              const neighborType = newBoard[nr][nc].type;
              if (neighborType === CellType.Attack) attacksAdj++;
              else if (neighborType === CellType.Gold) goldAdj++;
            }
          }
        }
        newBoard[r][c].adjacentItems = { attacks: attacksAdj, gold: goldAdj, total: attacksAdj + goldAdj };
      }
    }
  }
  return newBoard;
};

export const useSandboxGame = (initialConfig: SandboxConfig = DEFAULT_SANDBOX_CONFIG) => {
  const [config, setConfig] = useState<SandboxConfig>(initialConfig);
  const [player, setPlayer] = useState<PlayerState>({
    hp: initialConfig.player.hp,
    maxHp: initialConfig.player.maxHp,
    gold: initialConfig.player.gold,
    shield: initialConfig.player.shield,
    venganzaSpectralCharge: 0,
    consecutiveSwordsRevealed: 0,
    firstBombDamageTakenThisLevel: false,
    swordDamageModifier: 0,
    swordDamageModifierClicksRemaining: 0,
    ultimoAlientoUsedThisRun: false,
    isInvulnerable: false,
    invulnerabilityClicksRemaining: 0,
    criticalHitClicksRemaining: 0,
    alquimiaImprovisadaChargeAvailable: true,
    alquimiaImprovisadaActiveForNextBomb: false,
    vinculoDolorosoActive: false,
    vinculoDolorosoClicksRemaining: 0,
    pasoLigeroTrapIgnoredThisLevel: false,
    ojoOmniscienteUsedThisLevel: false,
    debuffEspadasOxidadasClicksRemaining: 0, 
    deactivatedEcos: [],
    nextEchoCostsDoubled: false,
    nextOracleOnlyCommonFury: false,
    pistasFalsasClicksRemaining: 0,
    paranoiaGalopanteClicksRemaining: 0,
  });
  const [enemy, setEnemy] = useState<EnemyState>({ ...initialConfig.enemy });
  const [board, setBoard] = useState<BoardState>(generateSandboxBoard(initialConfig.board));
  const [sandboxState, setSandboxState] = useState<SandboxState>({
    isGodMode: false,
    isRevealAll: false,
    eventLog: [],
    isSimulationRunning: false,
  });
  const [activeEcos , setActiveEcos] = useState<Echo[]>([]); 
  const [activeEnemyFuryAbilities , setActiveEnemyFuryAbilities] = useState<FuryAbility[]>([]);


  const addEventLog = useCallback((message: string) => {
    setSandboxState(prev => ({
      ...prev,
      eventLog: [message, ...prev.eventLog.slice(0, 99)] 
    }));
  }, []);

  const initializeSimulation = useCallback((newConfig: SandboxConfig) => {
    setConfig(newConfig);
    setPlayer({
        hp: newConfig.player.hp,
        maxHp: newConfig.player.maxHp,
        gold: newConfig.player.gold,
        shield: newConfig.player.shield,
        venganzaSpectralCharge: 0,
        consecutiveSwordsRevealed: 0,
        firstBombDamageTakenThisLevel: false,
        swordDamageModifier: 0,
        swordDamageModifierClicksRemaining: 0,
        ultimoAlientoUsedThisRun: false,
        isInvulnerable: false,
        invulnerabilityClicksRemaining: 0,
        criticalHitClicksRemaining: 0,
        alquimiaImprovisadaChargeAvailable: true,
        alquimiaImprovisadaActiveForNextBomb: false,
        vinculoDolorosoActive: false,
        vinculoDolorosoClicksRemaining: 0,
        pasoLigeroTrapIgnoredThisLevel: false,
        ojoOmniscienteUsedThisLevel: false,
        debuffEspadasOxidadasClicksRemaining: 0, 
        deactivatedEcos: [],
        nextEchoCostsDoubled: false,
        nextOracleOnlyCommonFury: false,
        pistasFalsasClicksRemaining: 0,
        paranoiaGalopanteClicksRemaining: 0,
    });
    setEnemy({ ...newConfig.enemy }); 
    setBoard(generateSandboxBoard(newConfig.board));
    setSandboxState(prev => ({
        ...prev,
        isSimulationRunning: true,
        eventLog: [`Simulation started with config: ${JSON.stringify(newConfig)}`]
    }));
  }, []);

  const resetSimulation = useCallback(() => {
    addEventLog("Simulation reset with current config.");
    initializeSimulation(config);
  }, [config, initializeSimulation, addEventLog]);

  const revealCellSandbox = useCallback((row: number, col: number) => {
    if (sandboxState.isRevealAll) return; 

    let currentBoard = board.map(r => r.map(c => ({ ...c })));
    if (currentBoard[row][col].revealed) return;
    playMidiSoundPlaceholder('cell_click_sandbox');

    let newPlayerHp = player.hp;
    let newPlayerGold = player.gold;
    let newPlayerShield = player.shield;
    let newEnemyHp = enemy.hp;
    let newEnemyArmor = enemy.armor; 
    let logMessage = `Player clicked cell (${row},${col}). `;

    const cellsToProcessQueue: { r: number, c: number, depth: number }[] = [{ r: row, c: col, depth: 0 }];
    const processedCells = new Set<string>();
    let cellsRevealedThisTurn = 0;

    const highestCascadeEchoFromMap = activeEcos.map(e => ALL_ECHOS_MAP.get(e.id)).filter(Boolean) 
      .filter(e => e && e.baseId === BASE_ECHO_ECO_CASCADA)
      .sort((a,b) => (b?.level || 0) - (a?.level || 0))[0] || null;


    let cascadeDepthValue = 0;
    if (highestCascadeEchoFromMap) {
        if (typeof highestCascadeEchoFromMap.value === 'number') {
            cascadeDepthValue = highestCascadeEchoFromMap.value;
        } else if (typeof highestCascadeEchoFromMap.value === 'object' && highestCascadeEchoFromMap.value && 'depth' in highestCascadeEchoFromMap.value) {
            cascadeDepthValue = highestCascadeEchoFromMap.value.depth;
        }
    }


    while(cellsToProcessQueue.length > 0) {
        const current = cellsToProcessQueue.shift()!;
        const {r, c: cIdx, depth} = current;
        const cellId = `${r}-${cIdx}`;

        if (r < 0 || r >= config.board.rows || cIdx < 0 || cIdx >= config.board.cols ||
            (currentBoard[r][cIdx].revealed && processedCells.has(cellId)) ) continue;

        if (!currentBoard[r][cIdx].revealed) cellsRevealedThisTurn++;
        currentBoard[r][cIdx].revealed = true;
        processedCells.add(cellId);
        const cellData = currentBoard[r][cIdx];
        if (cellsToProcessQueue.length === 0 && processedCells.size === 1) {
            logMessage += `Revealed: ${cellData.type}. `;
        }


        switch (cellData.type) {
            case CellType.Attack: // Player revealed Attack, acts like Sword
                playMidiSoundPlaceholder('reveal_attack_player_hits_enemy_sandbox');
                let damageToEnemy = ATTACK_DAMAGE_PLAYER_VS_ENEMY;
                if (newEnemyArmor > 0) {
                    const armorDamage = Math.min(newEnemyArmor, damageToEnemy);
                    newEnemyArmor -= armorDamage;
                    damageToEnemy -= armorDamage;
                    logMessage += `Attack hit armor for ${armorDamage}. Armor left: ${newEnemyArmor}. `;
                }
                if (damageToEnemy > 0) {
                    newEnemyHp -= damageToEnemy;
                    logMessage += `Attack hit HP for ${damageToEnemy}. `;
                }
                logMessage += `Enemy HP left: ${newEnemyHp}.`;
                break;
            case CellType.Gold:
                playMidiSoundPlaceholder('reveal_gold_sandbox');
                newPlayerGold += GOLD_VALUE;
                logMessage += `Gold! Player Gold +=${GOLD_VALUE}. `;
                break;
            case CellType.Clue:
                if (cascadeDepthValue > 0 && cellData.adjacentItems?.total === 0 && depth < cascadeDepthValue) {
                    logMessage += `Cascade from 0 at (${r},${cIdx}). `;
                    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
                        if (dr === 0 && dc === 0) continue;
                        cellsToProcessQueue.push({ r: r + dr, c: cIdx + dc, depth: depth + 1});
                    }
                }
                break;
            case CellType.Trap: 
                playMidiSoundPlaceholder('reveal_trap_sandbox');
                 if (!sandboxState.isGodMode) {
                    let trapDamage = 1; // Assuming traps damage player by 1
                     if (newPlayerShield > 0) {
                        const shieldDamage = Math.min(newPlayerShield, trapDamage);
                        newPlayerShield -= shieldDamage;
                        trapDamage -= shieldDamage;
                        logMessage += `Trap hit shield for ${shieldDamage}. Shield left: ${newPlayerShield}. `;
                    }
                    if (trapDamage > 0) {
                        newPlayerHp -= trapDamage;
                        logMessage += `Trap hit HP for ${trapDamage}. `;
                    }
                } else {
                   logMessage += 'Trap! Player HP no change (God Mode). ';
                }
                break;
        }
    }

    setBoard(currentBoard);
    setPlayer(p => ({
        ...p,
        hp: newPlayerHp,
        gold: newPlayerGold,
        shield: newPlayerShield,
        deactivatedEcos: [], 
        nextEchoCostsDoubled: false, 
        nextOracleOnlyCommonFury: false, 
        pistasFalsasClicksRemaining: 0, 
        paranoiaGalopanteClicksRemaining: 0, 
    }));

    let newEnemyFury = enemy.fury + (cellsRevealedThisTurn * FURY_INCREMENT_PER_CLICK);
    if (newEnemyHp <= 0) {
      logMessage += `Enemy defeated.`;
      newEnemyHp = 0;
    } else if (newEnemyFury >= enemy.maxFury) {
      logMessage += `Enemy Fury triggered! (Effect: Player -1 HP for Sandbox). Fury reset.`; // Updated message for clarity
      if (!sandboxState.isGodMode) {
        setPlayer(p => ({ ...p, hp: p.hp - 1 })); 
      }
      newEnemyFury = 0;
    }

    setEnemy(e => ({ ...e, hp: newEnemyHp, fury: newEnemyFury, armor: newEnemyArmor })); 
    addEventLog(logMessage);

  }, [board, player, enemy, sandboxState.isGodMode, sandboxState.isRevealAll, addEventLog, config.board.rows, config.board.cols, activeEcos]);

  const toggleGodMode = useCallback(() => {
    setSandboxState(prev => {
        const newGodMode = !prev.isGodMode;
        addEventLog(`God Mode ${newGodMode ? 'Enabled' : 'Disabled'}.`);
        return {...prev, isGodMode: newGodMode};
    });
  }, [addEventLog]);

  const toggleRevealAll = useCallback(() => {
    setSandboxState(prev => {
        const newRevealAll = !prev.isRevealAll;
        addEventLog(`Reveal All ${newRevealAll ? 'Enabled' : 'Disabled'}.`);
        return {...prev, isRevealAll: newRevealAll};
    });
  }, [addEventLog]);

  const adjustPlayerHp = useCallback((amount: number) => {
    setPlayer(prev => {
        const newHp = Math.max(0, Math.min(prev.maxHp, prev.hp + amount));
        addEventLog(`Player HP changed by ${amount} to ${newHp}.`);
        return { ...prev, hp: newHp };
    });
  }, [addEventLog]);

  const adjustEnemyHp = useCallback((amount: number) => {
    setEnemy(prev => {
        const newHp = Math.max(0, Math.min(prev.maxHp, prev.hp + amount));
        addEventLog(`Enemy HP changed by ${amount} to ${newHp}.`);
        return { ...prev, hp: newHp };
    });
  }, [addEventLog]);
  
  const adjustEnemyArmor = useCallback((amount: number) => {
    setEnemy(prev => {
        const newArmor = Math.max(0, prev.armor + amount);
        addEventLog(`Enemy Armor changed by ${amount} to ${newArmor}.`);
        return { ...prev, armor: newArmor };
    });
  }, [addEventLog]);

  const addPlayerGold = useCallback((amount: number) => {
    setPlayer(prev => {
        const newGold = prev.gold + amount;
        addEventLog(`Player Gold changed by ${amount} to ${newGold}.`);
        return { ...prev, gold: newGold };
    });
  }, [addEventLog]);

  const setEnemyFury = useCallback((amount: number) => {
    setEnemy(prev => {
        const newFury = Math.max(0, Math.min(prev.maxFury, amount));
        addEventLog(`Enemy Fury set to ${newFury}.`);
        return { ...prev, fury: newFury };
    });
  }, [addEventLog]);

  const cycleCellMarkSandbox = useCallback((row: number, col: number) => {
    setBoard(prevBoard => {
      const newBoard = prevBoard.map(r => r.map(cell => ({ ...cell })));
      const cell = newBoard[row][col];
      if (cell.revealed || cell.lockedIncorrectlyForClicks > 0) return prevBoard;
  
      const markOrder: (MarkType | null)[] = [
        null, 
        MarkType.GenericFlag, 
        MarkType.Bomb, // Marks an Attack tile as dangerous for Player
        MarkType.Sword, // Marks an Attack tile as beneficial for Player
        MarkType.Gold, 
        MarkType.Question
      ];
      const currentMarkIndex = markOrder.indexOf(cell.markType);
      cell.markType = markOrder[(currentMarkIndex + 1) % markOrder.length];
      
      addEventLog(`Cell (${row},${col}) mark changed to ${cell.markType || 'None'}.`);
      return newBoard;
    });
  }, [addEventLog]);

  useEffect(() => {
    if (!sandboxState.isSimulationRunning) {
        setPlayer({
            hp: config.player.hp,
            maxHp: config.player.maxHp,
            gold: config.player.gold,
            shield: config.player.shield,
            venganzaSpectralCharge: 0,
            consecutiveSwordsRevealed: 0,
            firstBombDamageTakenThisLevel: false,
            swordDamageModifier: 0,
            swordDamageModifierClicksRemaining: 0,
            ultimoAlientoUsedThisRun: false,
            isInvulnerable: false,
            invulnerabilityClicksRemaining: 0,
            criticalHitClicksRemaining: 0,
            alquimiaImprovisadaChargeAvailable: true,
            alquimiaImprovisadaActiveForNextBomb: false,
            vinculoDolorosoActive: false,
            vinculoDolorosoClicksRemaining: 0,
            pasoLigeroTrapIgnoredThisLevel: false,
            ojoOmniscienteUsedThisLevel: false,
            debuffEspadasOxidadasClicksRemaining: 0, 
            deactivatedEcos: [],
            nextEchoCostsDoubled: false,
            nextOracleOnlyCommonFury: false,
            pistasFalsasClicksRemaining: 0,
            paranoiaGalopanteClicksRemaining: 0,
        });
        setEnemy({ ...config.enemy }); 
        setBoard(generateSandboxBoard(config.board));
    }
  }, [config, sandboxState.isSimulationRunning]);


  return {
    config, setConfig,
    player, enemy, board, sandboxState,
    activeEcos, activeEnemyFuryAbilities,
    initializeSimulation,
    resetSimulation,
    revealCellSandbox,
    toggleGodMode,
    toggleRevealAll,
    adjustPlayerHp,
    adjustEnemyHp,
    adjustEnemyArmor, 
    addPlayerGold,
    setEnemyFury,
    addEventLog,
    cycleCellMarkSandbox,
  };
};
