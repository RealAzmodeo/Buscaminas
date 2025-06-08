import { useCallback } from 'react';
import {
  GamePhase, GameStatus, CellType, MarkType, EchoEffectType, GoalCellRevealedPayload,
  GoalEnemyDefeatedPayload, GameStateCore, PlayerState, EnemyInstance, BoardState, Echo,
  RunStats, MetaProgressState, DeactivatedEchoInfo, GuidingTextKey
} from '../types';
import {
  ATTACK_DAMAGE_PLAYER_VS_ENEMY, GOLD_VALUE, BASE_ECHO_ECO_CASCADA, BASE_ECHO_MAESTRIA_ESTOCADA,
  BASE_ECHO_TORRENTE_ACERO, BASE_ECHO_INSTINTO_BUSCADOR, BASE_ECHO_PASO_LIGERO, BASE_ECHO_ULTIMO_ALIENTO,
  FURY_INCREMENT_PER_CLICK, SOUL_FRAGMENTS_PER_ENEMY_DEFEAT, PROLOGUE_LEVEL_ID,
  BASE_ECHO_MARCADOR_TACTICO, BASE_ECHO_CARTOGRAFIA_AVANZADA, MIRROR_UPGRADE_IDS, ALL_FURY_ABILITIES_MAP
} from '../constants';
import { MIRROR_UPGRADES_CONFIG } from '../constants/metaProgressionConstants';


// Stubs / Forward declarations
const playMidiSoundPlaceholder = (soundId: string) => console.log(`Playing sound (placeholder): ${soundId}`);
const GoalTrackingService = {
  processEvent: (event: string, payload: any, meta: MetaProgressState, saveMeta: Function) => console.log(`GoalTrackingService.processEvent(${event}) STUBBED in usePlayerActions`)
};

export interface UsePlayerActionsReturn {
  handlePlayerCellSelection: (row: number, col: number) => void;
  cycleCellMark: (row: number, col: number) => void;
}

interface PlayerActionsProps {
  // From useGameState
  gameState: GameStateCore;
  setGameState: React.Dispatch<React.SetStateAction<GameStateCore>>;
  setGamePhase: (phase: GamePhase) => void;
  setGameStatus: (status: GameStatus, reason?: 'standard' | 'attrition') => void;
  // From usePlayerState
  playerState: PlayerState;
  setPlayerState: React.Dispatch<React.SetStateAction<PlayerState>>;
  // From useEnemyState
  enemyState: EnemyInstance;
  setEnemyState: React.Dispatch<React.SetStateAction<EnemyInstance>>;
  // From useBoard
  boardState: BoardState;
  setBoardState: React.Dispatch<React.SetStateAction<BoardState>>;
  recalculateAllClues: (board: BoardState) => BoardState;
  updateBoardVisualEffects: (board: BoardState, ecos: Echo[], deactivated: DeactivatedEchoInfo[]) => BoardState;
  checkAllPlayerBeneficialAttacksRevealed: (board: BoardState) => boolean;
  triggerBattlefieldReduction: () => void;
  // From useEchos
  getEffectiveEcos: () => Echo[];
  triggerConditionalEchoAnimation: (echoId: string) => void;
  generateEchoChoicesForPostLevelScreen: () => void; // This itself has dependencies, called by PlayerActions
  // From useRunStats
  runStats: RunStats;
  setRunStats: React.Dispatch<React.SetStateAction<RunStats>>;
  // From useMetaProgress
  metaProgressState: MetaProgressState;
  setAndSaveMetaProgress: (updater: React.SetStateAction<MetaProgressState>, gameStatus?: GameStatus) => string[];
  // From useGameEvents
  addGameEvent: (payload: any, type?: string) => void;
  // From usePrologue
  ftueEventTrackerRef: React.MutableRefObject<{[key: string]: boolean | undefined}>; // From usePrologue
  advancePrologueStep: (stepOrKey?: number | GuidingTextKey) => void;               // From usePrologue
  // applyFuryEffect from useFuries - This creates a potential circular dependency if useFuries needs usePlayerActions.
  // This might need to live in useGameLoop or useGameEngine. For now, assume it's passed.
  // applyFuryEffect: (ability: FuryAbility) => void;
}

export const usePlayerActions = ({
  gameState, setGameState, setGamePhase, setGameStatus,
  playerState, setPlayerState,
  enemyState, setEnemyState,
  boardState, setBoardState, recalculateAllClues, updateBoardVisualEffects, checkAllPlayerBeneficialAttacksRevealed, triggerBattlefieldReduction,
  getEffectiveEcos, triggerConditionalEchoAnimation, generateEchoChoicesForPostLevelScreen,
  runStats, setRunStats,
  metaProgressState, setAndSaveMetaProgress,
  addGameEvent,
  ftueEventTrackerRef, advancePrologueStep,
  // applyFuryEffect,
}: PlayerActionsProps): UsePlayerActionsReturn => {

  const handlePlayerCellSelection = useCallback((row: number, col: number) => {
    if (gameState.currentPhase !== GamePhase.PLAYER_TURN) return;

    let currentBoard = boardState.map(r => r.map(c => ({ ...c }))); const cell = currentBoard[row][col];
    if (cell.revealed || cell.lockedIncorrectlyForClicks > 0) return;
    playMidiSoundPlaceholder('cell_click');

    let newPlayerState = { ...playerState };
    let newEnemyState = { ...enemyState };
    let newRunStats = { ...runStats };
    newRunStats.clicksOnBoardThisRun++;

    const cellsToProcessQueue: { r: number, c: number, depth: number }[] = [{ r: row, c: col, depth: 0 }];
    const processedCellsInTurn = new Set<string>();
    let attacksByPlayerThisTurn = 0, goldCollectedThisTurn = 0, trapsTriggeredThisTurn = 0, cellsRevealedThisTurnForFury = 0;
    const effectiveEcos = getEffectiveEcos();

    const highestCascadeEcho = effectiveEcos.filter(e => e.baseId === BASE_ECHO_ECO_CASCADA).sort((a,b) => (b.level || 0) - (a.level || 0))[0] || null;
    let cascadeDepthValue = 0, cascadeDisarmChance = 0;
    if (highestCascadeEcho) {
        if (typeof highestCascadeEcho.value === 'number') cascadeDepthValue = highestCascadeEcho.value * (highestCascadeEcho.effectivenessMultiplier || 1);
        else if (typeof highestCascadeEcho.value === 'object' && highestCascadeEcho.value && 'depth' in highestCascadeEcho.value) {
            cascadeDepthValue = highestCascadeEcho.value.depth * (highestCascadeEcho.effectivenessMultiplier || 1);
            if ('disarmChance' in highestCascadeEcho.value) cascadeDisarmChance = highestCascadeEcho.value.disarmChance * (highestCascadeEcho.effectivenessMultiplier || 1);
        }
    }

    // Process player debuffs and timed effects
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
        GoalTrackingService.processEvent('CELL_REVEALED', { cellType: cellData.type, revealedByPlayer: true } as GoalCellRevealedPayload, metaProgressState, (u) => setAndSaveMetaProgress(u, gameState.status));

        switch (cellData.type) {
          case CellType.Attack:
            playMidiSoundPlaceholder('reveal_attack_player_hits_enemy'); attacksByPlayerThisTurn++; newRunStats.swordUsedThisLevel = true;
            let baseDamageForAttack = ATTACK_DAMAGE_PLAYER_VS_ENEMY; let attackDamageReductionFromDebuff = 0;
            if (newPlayerState.debuffEspadasOxidadasClicksRemaining > 0) { const debuffData = ALL_FURY_ABILITIES_MAP.get('fury_espadas_oxidadas')?.value as {reduction:number} | undefined; if(debuffData) attackDamageReductionFromDebuff = debuffData.reduction;}
            let actualAttackDamage = Math.max(1, baseDamageForAttack - attackDamageReductionFromDebuff);
            if (newPlayerState.swordDamageModifier > 0 && newPlayerState.swordDamageModifierClicksRemaining > 0) { actualAttackDamage += newPlayerState.swordDamageModifier; newPlayerState.venganzaSpectralCharge = 0; }
            newPlayerState.consecutiveSwordsRevealed++;
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
            if (golpeCerteroUpgrade && metaProgressState.mirrorUpgrades[MIRROR_UPGRADE_IDS.GOLPE_CERTERO_INICIAL] > 0 && !newRunStats.swordUsedThisLevelForMirror) {
                let totalBonus = 0; for(let i=0; i < metaProgressState.mirrorUpgrades[MIRROR_UPGRADE_IDS.GOLPE_CERTERO_INICIAL]; i++) { totalBonus += golpeCerteroUpgrade.levels[i].effectValue; }
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
            if (gameState.isPrologueActive && gameState.prologueStep === 3 && !ftueEventTrackerRef.current.firstAttackRevealedByPlayer) { ftueEventTrackerRef.current.firstAttackRevealedByPlayer = true; advancePrologueStep(4); }
            break;
          case CellType.Gold:
            playMidiSoundPlaceholder('reveal_gold'); goldCollectedThisTurn++; let goldCollectedValue = GOLD_VALUE;
            const instintoBuscadorEcho = effectiveEcos.find(e => e.baseId === BASE_ECHO_INSTINTO_BUSCADOR);
            if (instintoBuscadorEcho) { const chance = (instintoBuscadorEcho.value as number) * (instintoBuscadorEcho.effectivenessMultiplier || 1); if (Math.random() < chance) { goldCollectedValue *= 2; triggerConditionalEchoAnimation(instintoBuscadorEcho.id); }}
            if (goldCollectedValue > 0) { newPlayerState.gold += goldCollectedValue; addGameEvent({ text: `+${goldCollectedValue}`, type: 'gold-player', targetId: 'player-stats-container' }); }
            if (gameState.isPrologueActive && gameState.prologueStep === 4 && !ftueEventTrackerRef.current.firstGoldRevealed) { ftueEventTrackerRef.current.firstGoldRevealed = true; advancePrologueStep(5); }
            newPlayerState.consecutiveSwordsRevealed = 0;
            break;
          case CellType.Clue:
            if (!ftueEventTrackerRef.current.firstClueRevealed && gameState.isPrologueActive && gameState.prologueStep === 2) { ftueEventTrackerRef.current.firstClueRevealed = true; advancePrologueStep(3); }
            if (cascadeDepthValue > 0 && cellData.adjacentItems?.total === 0 && depth < cascadeDepthValue) {
                for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { if (dr === 0 && dc === 0) continue;
                    const nextR = r + dr; const nextC = c + dc;
                    if (nextR >= 0 && nextR < gameState.currentBoardDimensions.rows && nextC >= 0 && nextC < gameState.currentBoardDimensions.cols && !currentBoard[nextR][nextC].revealed) {
                        if (currentBoard[nextR][nextC].type === CellType.Attack && Math.random() < cascadeDisarmChance) {
                            playMidiSoundPlaceholder('cascade_disarm_attack'); addGameEvent({ text: '¡Ataque Neutralizado por Cascada!', type: 'info', targetId: `cell-${nextR}-${nextC}`});
                        } else { cellsToProcessQueue.push({ r: nextR, c: nextC, depth: depth + 1}); }
                    }
                }
                if (highestCascadeEcho) triggerConditionalEchoAnimation(highestCascadeEcho.id);
            }
            newPlayerState.consecutiveSwordsRevealed = 0;
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
            newPlayerState.consecutiveSwordsRevealed = 0;
            break;
        }
    }
    newRunStats.attacksTriggeredByPlayer += attacksByPlayerThisTurn;
    newRunStats.goldCellsRevealedThisRun += goldCollectedThisTurn;
    newRunStats.trapsTriggeredThisRun += trapsTriggeredThisTurn;

    setPlayerState(newPlayerState);
    setEnemyState(newEnemyState);
    setRunStats(newRunStats);

    const boardWithEffects = updateBoardVisualEffects(recalculateAllClues(currentBoard), effectiveEcos, newPlayerState.deactivatedEcos);
    setBoardState(boardWithEffects);

    if (newPlayerState.hp <= 0) { setGamePhase(GamePhase.PLAYER_ACTION_RESOLVING); return; }
    if (newEnemyState.currentHp <= 0) {
      playMidiSoundPlaceholder('enemy_defeat');
      GoalTrackingService.processEvent('ENEMY_DEFEATED', { enemyArchetypeId: newEnemyState.archetypeId } as GoalEnemyDefeatedPayload, metaProgressState, (u)=>setAndSaveMetaProgress(u, gameState.status));
      setRunStats(prev => ({ ...prev, enemiesDefeatedThisRun: prev.enemiesDefeatedThisRun + 1, soulFragmentsEarnedThisRun: prev.soulFragmentsEarnedThisRun + SOUL_FRAGMENTS_PER_ENEMY_DEFEAT }));
      generateEchoChoicesForPostLevelScreen(); // This will call setAvailableEchoChoices internally via useEchos
      let mapDecisionNowPending = false;
      if (!gameState.isPrologueActive && gameState.currentStretchCompletedLevels >= gameState.levelsInCurrentStretch -1 ) mapDecisionNowPending = true;
      setGameState(prev => ({ ...prev, status: GameStatus.PostLevel, mapDecisionPending: mapDecisionNowPending, furyMinigameCompletedForThisLevel: false, postLevelActionTaken: false, currentPhase: GamePhase.PLAYER_ACTION_RESOLVING }));
      return;
    }

    if (gameState.status === GameStatus.Playing && checkAllPlayerBeneficialAttacksRevealed(boardWithEffects)) {
      triggerBattlefieldReduction();
    }

    let finalEnemyStateForFuryUpdate = { ...newEnemyState }; // Re-spread from the potentially updated newEnemyState
    if (finalEnemyStateForFuryUpdate.currentHp > 0 && !gameState.isPrologueActive) {
        finalEnemyStateForFuryUpdate.currentFuryCharge = Math.min(finalEnemyStateForFuryUpdate.furyActivationThreshold, finalEnemyStateForFuryUpdate.currentFuryCharge + (cellsRevealedThisTurnForFury * FURY_INCREMENT_PER_CLICK));
    }
    setEnemyState(finalEnemyStateForFuryUpdate); // Update enemy state after fury calculation

    if (newPlayerState.hp === 1 && !newPlayerState.ultimoAlientoUsedThisRun) {
        const ultimoAlientoEcho = effectiveEcos.find(e => e.baseId === BASE_ECHO_ULTIMO_ALIENTO);
        if (ultimoAlientoEcho) {
            const updatedPlayerForAliento = {...newPlayerState, ultimoAlientoUsedThisRun: true, isInvulnerable: true, invulnerabilityClicksRemaining: (ultimoAlientoEcho.value as { clicks: number }).clicks, criticalHitClicksRemaining: (ultimoAlientoEcho.value as { clicks: number }).clicks};
            setPlayerState(updatedPlayerForAliento); // Update player state again for Ultimo Aliento
            triggerConditionalEchoAnimation(ultimoAlientoEcho.id); addGameEvent({ text: '¡Último Aliento!', type: 'info', targetId: 'player-stats-container' });
        }
    }

    if (gameState.isPrologueActive && gameState.currentLevel === PROLOGUE_LEVEL_ID && gameState.prologueStep === 6 && newEnemyState.currentHp > 0) {
      advancePrologueStep(6); // Should be 7 after enemy defeat for prologue
    }
    setGamePhase(GamePhase.PLAYER_ACTION_RESOLVING);

  }, [
    gameState, setGameState, setGamePhase, setGameStatus, // gameState includes currentPhase, boardDimensions etc.
    playerState, setPlayerState,
    enemyState, setEnemyState,
    boardState, setBoardState, recalculateAllClues, updateBoardVisualEffects, checkAllPlayerBeneficialAttacksRevealed, triggerBattlefieldReduction,
    getEffectiveEcos, triggerConditionalEchoAnimation, generateEchoChoicesForPostLevelScreen,
    runStats, setRunStats,
    metaProgressState, setAndSaveMetaProgress,
    addGameEvent,
    ftueEventTrackerRef, advancePrologueStep,
  ]);

  const cycleCellMark = useCallback((row: number, col: number) => {
    if (gameState.currentPhase !== GamePhase.PLAYER_TURN) return;
    const effectiveEcos = getEffectiveEcos();
    let canMark = false;
    const marcadorTactico = effectiveEcos.find(e => e.baseId === BASE_ECHO_MARCADOR_TACTICO);
    const cartografiaAvanzada = effectiveEcos.find(e => e.baseId === BASE_ECHO_CARTOGRAFIA_AVANZADA);
    if (marcadorTactico || cartografiaAvanzada) canMark = true;

    if (!canMark) {
        addGameEvent({ text: "Eco de Marcado no activo.", type: 'info' });
        playMidiSoundPlaceholder('mark_attempt_fail_no_echo'); return;
    }

    setBoardState(prevBoard => {
      const newBoard = prevBoard.map(r => r.map(cell => ({ ...cell })));
      const cell = newBoard[row][col];
      if (cell.revealed || cell.lockedIncorrectlyForClicks > 0) return prevBoard;

      const markOrder: (MarkType | null)[] = [null, MarkType.GenericFlag];
      if (cartografiaAvanzada) {
        markOrder.push(MarkType.Attack, MarkType.Gold, MarkType.Question);
      }
      const currentMarkIndex = markOrder.indexOf(cell.markType);
      cell.markType = markOrder[(currentMarkIndex + 1) % markOrder.length];
      playMidiSoundPlaceholder(`mark_cell_${cell.markType || 'none'}`);
      return newBoard;
    });
  }, [gameState.currentPhase, getEffectiveEcos, addGameEvent, setBoardState]);

  return { handlePlayerCellSelection, cycleCellMark };
};
