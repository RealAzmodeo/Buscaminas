import {
  PlayerState,
  EnemyState,
  BoardState,
  CellType,
  Echo,
  MetaProgressState,
  RunStats,
  GameEvent,
  CellPosition,
  FTUEEventTracker,
} from '../types';
import {
  ATTACK_DAMAGE_PLAYER_VS_ENEMY,
  ATTACK_DAMAGE_ENEMY_VS_PLAYER,
  GOLD_VALUE,
  BASE_ECHO_ECO_CASCADA,
  BASE_ECHO_VENGANZA_ESPECTRAL,
  BASE_ECHO_MAESTRIA_ESTOCADA,
  BASE_ECHO_TORRENTE_ACERO,
  BASE_ECHO_INSTINTO_BUSCADOR,
  BASE_ECHO_ALQUIMIA_IMPROVISADA,
  BASE_ECHO_PIEL_PIEDRA,
  BASE_ECHO_PASO_LIGERO,
  ALL_FURY_ABILITIES_MAP, // For Espadas Oxidadas, Vinculo Doloroso
  PROLOGUE_LEVEL_ID,
  ENEMY_FURY_GAIN_ON_GOLD_REVEAL,
} from '../constants';
import { GoalTrackingService, GoalCellRevealedPayload } from '../services/goalTrackingService';
import { playMidiSoundPlaceholder } from '../utils/soundUtils';
import { MirrorUpgradeId, MIRROR_UPGRADES_CONFIG } from '../constants/metaProgressionConstants';


export interface UseCellRevealHandlerProps {
  fullActiveEcos: Echo[];
  metaProgress: MetaProgressState;
  isPrologueActive: boolean;
  prologueStep: number;
  ftueEventTrackerRef: React.MutableRefObject<FTUEEventTracker>;

  addGameEvent: (event: GameEvent) => void;
  triggerConditionalEchoAnimation: (echoId: string) => void;
  advancePrologueStep: (nextStep?: number | '') => void;
  setPlayerTookDamageThisLevelInEngine: (value: boolean) => void;
  getBoardDimensions: () => { rows: number; cols: number };
  recalculateCluesAndUpdateBoard: (board: BoardState) => BoardState; // This will wrap boardHook utils & setBoard
  setAndSaveMetaProgress: (updater: React.SetStateAction<MetaProgressState>) => void; // Added, for GoalTrackingService
}

export interface ResolvePlayerCellRevealParams {
  row: number;
  col: number;
  currentBoard: BoardState;
  player: PlayerState;
  enemy: EnemyState | null; // Enemy can be null
  runStats: RunStats;
}

export interface ResolvePlayerCellRevealResult {
  newPlayer: PlayerState;
  newEnemy: EnemyState | null;
  newRunStats: RunStats;
  updatedBoard: BoardState;
  cellsRevealedThisTurnForFury: number;
  attacksByPlayerThisTurn: number; // Added to track for achievements or other logic
}

export interface ResolveEnemyCellRevealParams {
  row: number;
  col: number;
  currentBoard: BoardState;
  player: PlayerState;
  enemy: EnemyState | null;
  runStats: RunStats;
}

export interface ResolveEnemyCellRevealResult {
  newPlayer: PlayerState;
  newEnemy: EnemyState | null;
  newRunStats: RunStats;
  updatedBoard: BoardState;
}

export const useCellRevealHandler = (props: UseCellRevealHandlerProps) => {
  const {
    fullActiveEcos,
    metaProgress,
    isPrologueActive,
    prologueStep,
    ftueEventTrackerRef,
    addGameEvent,
    triggerConditionalEchoAnimation,
    advancePrologueStep,
    setPlayerTookDamageThisLevelInEngine,
    getBoardDimensions,
    recalculateCluesAndUpdateBoard,
    setAndSaveMetaProgress,
  } = props;

  const resolvePlayerCellReveal = (
    params: ResolvePlayerCellRevealParams
  ): ResolvePlayerCellRevealResult => {
    let { row, col, currentBoard, player, enemy, runStats } = params;
    let boardCopy = currentBoard.map(r => r.map(c => ({ ...c })));
    let playerCopy = { ...player };
    let enemyCopy = enemy ? { ...enemy } : null;
    let runStatsCopy = { ...runStats };

    const cellsToProcessQueue: { r: number, c: number, depth: number }[] = [{ r: row, c: col, depth: 0 }];
    const processedCellsInTurn = new Set<string>();
    let attacksByPlayerThisTurn = 0;
    let goldCollectedThisTurn = 0;
    let trapsTriggeredThisTurn = 0;
    let cellsRevealedThisTurnForFury = 0;

    const boardDimensions = getBoardDimensions();

    const highestCascadeEcho = fullActiveEcos.filter(e => e.baseId === BASE_ECHO_ECO_CASCADA).sort((a,b) => (b.level || 0) - (a.level || 0))[0] || null;
    let cascadeDepthValue = 0, cascadeDisarmChance = 0;
    if (highestCascadeEcho) {
        if (typeof highestCascadeEcho.value === 'number') cascadeDepthValue = highestCascadeEcho.value * (highestCascadeEcho.effectivenessMultiplier || 1);
        else if (typeof highestCascadeEcho.value === 'object' && highestCascadeEcho.value && 'depth' in highestCascadeEcho.value) {
            cascadeDepthValue = highestCascadeEcho.value.depth * (highestCascadeEcho.effectivenessMultiplier || 1);
            if ('disarmChance' in highestCascadeEcho.value) cascadeDisarmChance = (highestCascadeEcho.value.disarmChance || 0) * (highestCascadeEcho.effectivenessMultiplier || 1);
        }
    }

    // Note: Debuff/Buff click decrements are still handled in useGameEngine's handlePlayerCellSelection
    // as they happen once per player selection, not per cascaded cell.

    while(cellsToProcessQueue.length > 0) {
        const current = cellsToProcessQueue.shift()!;
        const r_curr = current.r;
        const c_curr = current.c;
        const depth = current.depth;
        const cellId = `${r_curr}-${c_curr}`;

        if (r_curr < 0 || r_curr >= boardDimensions.rows || c_curr < 0 || c_curr >= boardDimensions.cols || processedCellsInTurn.has(cellId) || boardCopy[r_curr][c_curr].revealed) {
            continue;
        }
        boardCopy[r_curr][c_curr].revealed = true;
        processedCellsInTurn.add(cellId);
        cellsRevealedThisTurnForFury++;
        const cellData = boardCopy[r_curr][c_curr];
        GoalTrackingService.processEvent('CELL_REVEALED', { cellType: cellData.type, revealedByPlayer: true } as GoalCellRevealedPayload, metaProgress, setAndSaveMetaProgress);

        switch (cellData.type) {
          case CellType.Attack:
            playMidiSoundPlaceholder('reveal_attack_player_hits_enemy');
            attacksByPlayerThisTurn++;
            runStatsCopy.swordUsedThisLevel = true;
            let baseDamageForAttack = ATTACK_DAMAGE_PLAYER_VS_ENEMY;
            let attackDamageReductionFromDebuff = 0;
            if (playerCopy.debuffEspadasOxidadasClicksRemaining > 0) {
                const debuffData = ALL_FURY_ABILITIES_MAP.get('fury_espadas_oxidadas')?.value as {reduction:number} | undefined;
                if(debuffData) attackDamageReductionFromDebuff = debuffData.reduction;
            }
            let actualAttackDamage = Math.max(1, baseDamageForAttack - attackDamageReductionFromDebuff);
            if (playerCopy.swordDamageModifier > 0 && playerCopy.swordDamageModifierClicksRemaining > 0) {
                actualAttackDamage += playerCopy.swordDamageModifier;
                playerCopy.venganzaSpectralCharge = 0;
            }
            playerCopy.consecutiveSwordsRevealed++;
            const maestriaEcho = fullActiveEcos.find(e => e.baseId === BASE_ECHO_MAESTRIA_ESTOCADA);
            const torrenteEcho = fullActiveEcos.find(e => e.baseId === BASE_ECHO_TORRENTE_ACERO);
            if (torrenteEcho) {
                const torrenteConfig = torrenteEcho.value as { count: number, bonusIncremental: boolean, reduceFury: boolean };
                if (playerCopy.consecutiveSwordsRevealed >= torrenteConfig.count) {
                    const bonus = torrenteConfig.bonusIncremental ? (playerCopy.consecutiveSwordsRevealed - torrenteConfig.count + 1) : 1;
                    actualAttackDamage += bonus;
                    triggerConditionalEchoAnimation(torrenteEcho.id);
                    if(torrenteConfig.reduceFury && enemyCopy) enemyCopy.currentFuryCharge = Math.max(0, enemyCopy.currentFuryCharge - Math.floor(enemyCopy.furyActivationThreshold * 0.1));
                }
            } else if (maestriaEcho) {
                const maestriaConfig = maestriaEcho.value as { count: number, bonus: number };
                if (playerCopy.consecutiveSwordsRevealed >= maestriaConfig.count) {
                    actualAttackDamage += (maestriaConfig.bonus * (maestriaEcho.effectivenessMultiplier || 1));
                    triggerConditionalEchoAnimation(maestriaEcho.id);
                }
            }
            if (playerCopy.criticalHitClicksRemaining > 0) {
                actualAttackDamage *= 2;
                addGameEvent({ text: '¡Crítico!', type: 'info', targetId: 'enemy-stats-container' });
            }
            const golpeCerteroUpgrade = MIRROR_UPGRADES_CONFIG.find(u => u.id === MirrorUpgradeId.GolpeCerteroInicial);
            if (golpeCerteroUpgrade && metaProgress.mirrorUpgrades[MirrorUpgradeId.GolpeCerteroInicial] > 0 && !runStatsCopy.swordUsedThisLevelForMirror) {
                let totalBonus = 0;
                const currentGolpeCerteroLevel = metaProgress.mirrorUpgrades[MirrorUpgradeId.GolpeCerteroInicial];
                for(let i=0; i < currentGolpeCerteroLevel; i++) { totalBonus += golpeCerteroUpgrade.levels[i].effectValue; }
                actualAttackDamage += totalBonus;
                runStatsCopy.swordUsedThisLevelForMirror = true;
                addGameEvent({ text: `¡Golpe Certero Inicial! (+${totalBonus})`, type: 'info', targetId: 'enemy-stats-container' });
            }
            if (enemyCopy) {
                let damageToArmor = 0, damageToHp = actualAttackDamage;
                if (enemyCopy.armor > 0) {
                    damageToArmor = Math.min(enemyCopy.armor, actualAttackDamage);
                    enemyCopy.armor -= damageToArmor;
                    damageToHp -= damageToArmor;
                    addGameEvent({ text: `-${damageToArmor}🛡️`, type: 'armor-break', targetId: 'enemy-stats-container' });
                    if (damageToArmor > 0) playMidiSoundPlaceholder('enemy_armor_break');
                }
                if (damageToHp > 0) {
                    enemyCopy.currentHp = Math.max(0, enemyCopy.currentHp - damageToHp);
                    addGameEvent({ text: `-${damageToHp}`, type: 'damage-enemy', targetId: 'enemy-stats-container' });
                }
            }
            if (playerCopy.vinculoDolorosoActive && playerCopy.vinculoDolorosoClicksRemaining > 0) {
                 const vinculoAbilityValue = ALL_FURY_ABILITIES_MAP.get('fury_vinculo_doloroso')?.value as {damage:number} | undefined;
                 if (vinculoAbilityValue) {
                     const recoilDamage = vinculoAbilityValue.damage;
                     if (!playerCopy.isInvulnerable) {
                         let actualRecoilDamage = recoilDamage;
                         if (playerCopy.shield > 0) {
                             const shieldDamage = Math.min(playerCopy.shield, actualRecoilDamage);
                             playerCopy.shield -= shieldDamage;
                             actualRecoilDamage -= shieldDamage;
                         }
                         if(actualRecoilDamage > 0) playerCopy.hp = Math.max(0, playerCopy.hp - actualRecoilDamage);
                         addGameEvent({ text: `-${actualRecoilDamage}🩸 (Vínculo)`, type: 'damage-player', targetId: 'player-stats-container' });
                         setPlayerTookDamageThisLevelInEngine(true);
                     }
                 }
            }
            if (isPrologueActive && prologueStep === 3 && !ftueEventTrackerRef.current.firstAttackRevealedByPlayer) {
                ftueEventTrackerRef.current.firstAttackRevealedByPlayer = true;
                advancePrologueStep(4);
            }
            break;
          case CellType.Gold:
            playMidiSoundPlaceholder('reveal_gold');
            goldCollectedThisTurn++;
            let goldCollectedValue = GOLD_VALUE;
            const instintoBuscadorEcho = fullActiveEcos.find(e => e.baseId === BASE_ECHO_INSTINTO_BUSCADOR);
            if (instintoBuscadorEcho) {
                const chance = (instintoBuscadorEcho.value as number) * (instintoBuscadorEcho.effectivenessMultiplier || 1);
                if (Math.random() < chance) {
                    goldCollectedValue *= 2;
                    triggerConditionalEchoAnimation(instintoBuscadorEcho.id);
                }
            }
            if (goldCollectedValue > 0) {
                playerCopy.gold += goldCollectedValue;
                addGameEvent({ text: `+${goldCollectedValue}`, type: 'gold-player', targetId: 'player-stats-container' });
            }
            if (isPrologueActive && prologueStep === 4 && !ftueEventTrackerRef.current.firstGoldRevealed) {
                ftueEventTrackerRef.current.firstGoldRevealed = true;
                advancePrologueStep(5);
            }
            playerCopy.consecutiveSwordsRevealed = 0;
            break;
          case CellType.Clue:
            if (isPrologueActive && !ftueEventTrackerRef.current.firstClueRevealed && prologueStep === 2) {
                ftueEventTrackerRef.current.firstClueRevealed = true;
                advancePrologueStep(3);
            }
            if (cascadeDepthValue > 0 && cellData.adjacentItems?.total === 0 && depth < cascadeDepthValue) {
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        if (dr === 0 && dc === 0) continue;
                        const nextR = r_curr + dr;
                        const nextC = c_curr + dc;
                        if (nextR >= 0 && nextR < boardDimensions.rows && nextC >= 0 && nextC < boardDimensions.cols && !boardCopy[nextR][nextC].revealed) {
                            if (boardCopy[nextR][nextC].type === CellType.Attack && Math.random() < cascadeDisarmChance) {
                                playMidiSoundPlaceholder('cascade_disarm_attack');
                                addGameEvent({ text: '¡Ataque Neutralizado por Cascada!', type: 'info', targetId: `cell-${nextR}-${nextC}`});
                                // Potentially mark as "disarmed attack" on boardCopy[nextR][nextC] if needed for visuals
                            } else {
                                 cellsToProcessQueue.push({ r: nextR, c: nextC, depth: depth + 1});
                            }
                        }
                    }
                }
                if (highestCascadeEcho) triggerConditionalEchoAnimation(highestCascadeEcho.id);
            }
            playerCopy.consecutiveSwordsRevealed = 0;
            break;
          case CellType.Trap:
            playMidiSoundPlaceholder('reveal_trap');
            trapsTriggeredThisTurn++;
            const pasoLigeroActive = fullActiveEcos.some(e => e.baseId === BASE_ECHO_PASO_LIGERO);
            if (pasoLigeroActive && !playerCopy.pasoLigeroTrapIgnoredThisLevel) {
                playerCopy.pasoLigeroTrapIgnoredThisLevel = true;
                const pasoLigeroEcho = fullActiveEcos.find(e => e.baseId === BASE_ECHO_PASO_LIGERO);
                if(pasoLigeroEcho) triggerConditionalEchoAnimation(pasoLigeroEcho.id);
                addGameEvent({ text: '¡Paso Ligero anula trampa!', type: 'info', targetId: 'player-stats-container' });
            } else if (!playerCopy.isInvulnerable) {
                let trapDamage = 1;
                if (playerCopy.shield > 0) {
                    const shieldDamage = Math.min(playerCopy.shield, trapDamage);
                    playerCopy.shield -= shieldDamage;
                    trapDamage -= shieldDamage;
                    addGameEvent({ text: `-${shieldDamage}🛡️ (Trampa)`, type: 'armor-break', targetId: 'player-stats-container' });
                }
                if (trapDamage > 0) {
                    playerCopy.hp = Math.max(0, playerCopy.hp - trapDamage);
                    addGameEvent({ text: `-${trapDamage} (Trampa)`, type: 'damage-player', targetId: 'player-stats-container' });
                    setPlayerTookDamageThisLevelInEngine(true);
                }
            }
            playerCopy.consecutiveSwordsRevealed = 0;
            break;
        }
    }
    runStatsCopy.attacksTriggeredByPlayer += attacksByPlayerThisTurn;
    runStatsCopy.goldCellsRevealedThisRun += goldCollectedThisTurn;
    runStatsCopy.trapsTriggeredThisRun += trapsTriggeredThisTurn;

    const finalBoard = recalculateCluesAndUpdateBoard(boardCopy);

    return {
        newPlayer: playerCopy,
        newEnemy: enemyCopy,
        newRunStats: runStatsCopy,
        updatedBoard: finalBoard,
        cellsRevealedThisTurnForFury,
        attacksByPlayerThisTurn
    };
  };

  const resolveEnemyCellReveal = (
    params: ResolveEnemyCellRevealParams
  ): ResolveEnemyCellRevealResult => {
    let { row, col, currentBoard, player, enemy, runStats } = params;
    let boardCopy = currentBoard.map(r => r.map(c => ({ ...c })));
    let playerCopy = { ...player };
    let enemyCopy = enemy ? { ...enemy } : null;
    let runStatsCopy = { ...runStats };
    const cell = boardCopy[row][col];

    if (cell.revealed) { // Should ideally not happen if called correctly
        return { newPlayer: playerCopy, newEnemy: enemyCopy, newRunStats: runStatsCopy, updatedBoard: boardCopy };
    }

    playMidiSoundPlaceholder('cell_click_enemy');
    boardCopy[row][col].revealed = true;
    GoalTrackingService.processEvent('CELL_REVEALED', { cellType: cell.type, revealedByPlayer: false } as GoalCellRevealedPayload, metaProgress, setAndSaveMetaProgress);

    switch (cell.type) {
      case CellType.Attack:
        playMidiSoundPlaceholder('reveal_attack_enemy_hits_player');
        runStatsCopy.attacksTriggeredByEnemy++;
        if (!playerCopy.isInvulnerable) {
          let damage = ATTACK_DAMAGE_ENEMY_VS_PLAYER;
          if (playerCopy.alquimiaImprovisadaActiveForNextBomb) {
            damage = 0; playerCopy.alquimiaImprovisadaActiveForNextBomb = false;
            const alquimiaEcho = fullActiveEcos.find(e => e.baseId === BASE_ECHO_ALQUIMIA_IMPROVISADA);
            if(alquimiaEcho) triggerConditionalEchoAnimation(alquimiaEcho.id);
            addGameEvent({ text: '¡Alquimia anula daño!', type: 'info', targetId: 'player-stats-container' });
          } else if (playerCopy.shield > 0) {
            const shieldDamage = Math.min(playerCopy.shield, damage);
            playerCopy.shield -= shieldDamage; damage -= shieldDamage;
            addGameEvent({ text: `-${shieldDamage}🛡️`, type: 'armor-break', targetId: 'player-stats-container' });
          }
          if (damage > 0) {
            if (playerCopy.firstBombDamageTakenThisLevel === false) {
                const pielPiedraEcho = fullActiveEcos.find(e => e.baseId === BASE_ECHO_PIEL_PIEDRA);
                if (pielPiedraEcho) {
                    damage = Math.max(0, damage - (pielPiedraEcho.value as number * (pielPiedraEcho.effectivenessMultiplier || 1)));
                    triggerConditionalEchoAnimation(pielPiedraEcho.id);
                }
                playerCopy.firstBombDamageTakenThisLevel = true;
            }
            if (damage > 0) {
                playerCopy.hp = Math.max(0, playerCopy.hp - damage);
                addGameEvent({ text: `-${damage}`, type: 'damage-player', targetId: 'player-stats-container' });
                setPlayerTookDamageThisLevelInEngine(true);
                const venganzaEcho = fullActiveEcos.find(e => e.baseId === BASE_ECHO_VENGANZA_ESPECTRAL);
                if (venganzaEcho) {
                    playerCopy.venganzaSpectralCharge = (venganzaEcho.value as number * (venganzaEcho.effectivenessMultiplier || 1));
                    triggerConditionalEchoAnimation(venganzaEcho.id);
                }
            } else { addGameEvent({ text: '¡Bloqueado!', type: 'info', targetId: 'player-stats-container'});}
          }
        } else {
            addGameEvent({ text: '¡Invulnerable!', type: 'info', targetId: 'player-stats-container' });
        }
        if (isPrologueActive && prologueStep === 5 && !ftueEventTrackerRef.current.firstAttackRevealedByEnemy) {
            ftueEventTrackerRef.current.firstAttackRevealedByEnemy = true;
            advancePrologueStep(6);
        }
        break;
      case CellType.Gold:
        playMidiSoundPlaceholder('reveal_gold_enemy_fury');
        runStatsCopy.goldCellsRevealedThisRun++; // Although enemy revealed, count it for stats
        if (enemyCopy) {
            enemyCopy.currentFuryCharge = Math.min(enemyCopy.furyActivationThreshold, enemyCopy.currentFuryCharge + ENEMY_FURY_GAIN_ON_GOLD_REVEAL);
            addGameEvent({ text: `+${ENEMY_FURY_GAIN_ON_GOLD_REVEAL} Furia!`, type: 'info', targetId: 'enemy-stats-container' });
        }
        break;
      case CellType.Clue:
        // No direct effect on player/enemy from enemy revealing clue
        break;
      case CellType.Trap:
        playMidiSoundPlaceholder('reveal_trap_enemy_effect');
        runStatsCopy.trapsTriggeredThisRun++;
        if (enemyCopy) {
            let trapDamageToEnemy = 1; // Standard trap damage to enemy
            if (enemyCopy.armor > 0) {
                const armorDamage = Math.min(enemyCopy.armor, trapDamageToEnemy);
                enemyCopy.armor -= armorDamage; trapDamageToEnemy -= armorDamage;
                addGameEvent({ text: `-${armorDamage}🛡️ (Trampa Enem.)`, type: 'armor-break', targetId: 'enemy-stats-container' });
            }
            if (trapDamageToEnemy > 0) {
                enemyCopy.currentHp = Math.max(0, enemyCopy.currentHp - trapDamageToEnemy);
                addGameEvent({ text: `-${trapDamageToEnemy} (Trampa Enem.)`, type: 'damage-enemy', targetId: 'enemy-stats-container' });
            }
        }
        break;
    }

    const finalBoard = recalculateCluesAndUpdateBoard(boardCopy);

    return { newPlayer: playerCopy, newEnemy: enemyCopy, newRunStats: runStatsCopy, updatedBoard: finalBoard };
  };

  return {
    resolvePlayerCellReveal,
    resolveEnemyCellReveal,
  };
};
