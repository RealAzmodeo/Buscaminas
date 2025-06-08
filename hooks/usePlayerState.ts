import { useState, useEffect, useCallback } from 'react';
import { PlayerState, GameStatus, DeactivatedEchoInfo, Echo } from '../types';
import { INITIAL_PLAYER_HP, INITIAL_PLAYER_GOLD, INITIAL_PLAYER_SHIELD } from '../constants';

// Minimal initial player state for now
const getInitialPlayerState = (): PlayerState => ({
  hp: INITIAL_PLAYER_HP,
  maxHp: INITIAL_PLAYER_HP,
  gold: INITIAL_PLAYER_GOLD,
  shield: INITIAL_PLAYER_SHIELD,
  venganzaSpectralCharge: 0,
  consecutiveSwordsRevealed: 0,
  firstBombDamageTakenThisLevel: false, // Will be 'firstAttackDamageTakenThisLevel'
  swordDamageModifier: 0,
  swordDamageModifierClicksRemaining: 0,
  ultimoAlientoUsedThisRun: false,
  isInvulnerable: false,
  invulnerabilityClicksRemaining: 0,
  criticalHitClicksRemaining: 0,
  alquimiaImprovisadaChargeAvailable: false,
  alquimiaImprovisadaActiveForNextBomb: false, // Will be 'alquimiaImprovisadaActiveForNextAttack'
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

export interface UsePlayerStateReturn {
  player: PlayerState;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerState>>;
  resetPlayerForNewRun: (baseHp?: number, baseGold?: number, baseShield?: number) => void;
  // Potentially other player-specific actions can be added here
}

interface PlayerStateProps {
  // Dependency from useGameState to set game over status
  setGameStatus: (newStatus: GameStatus, newDefeatReason?: 'standard' | 'attrition') => void;
  // Dependency from useGameStatus to know current game status
  getCurrentGameStatus: () => GameStatus;
}

export const usePlayerState = ({ setGameStatus, getCurrentGameStatus }: PlayerStateProps): UsePlayerStateReturn => {
  const [player, setPlayer] = useState<PlayerState>(getInitialPlayerState());

  // Effect to check for player defeat
  useEffect(() => {
    const currentGameStatus = getCurrentGameStatus();
    if (player.hp <= 0 && currentGameStatus === GameStatus.Playing) {
      // playMidiSoundPlaceholder('player_defeat'); // Sound playing will be handled by a game event or game loop effect
      setGameStatus(GameStatus.GameOverDefeat);
    }
  }, [player.hp, getCurrentGameStatus, setGameStatus]);

  const resetPlayerForNewRun = useCallback((
    baseHp: number = INITIAL_PLAYER_HP,
    baseGold: number = INITIAL_PLAYER_GOLD,
    baseShield: number = INITIAL_PLAYER_SHIELD
  ) => {
    setPlayer({
      hp: baseHp,
      maxHp: baseHp,
      gold: baseGold,
      shield: baseShield,
      venganzaSpectralCharge: 0,
      consecutiveSwordsRevealed: 0,
      firstBombDamageTakenThisLevel: false,
      swordDamageModifier: 0,
      swordDamageModifierClicksRemaining: 0,
      ultimoAlientoUsedThisRun: false,
      isInvulnerable: false,
      invulnerabilityClicksRemaining: 0,
      criticalHitClicksRemaining: 0,
      alquimiaImprovisadaChargeAvailable: false,
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
  }, []);


  return { player, setPlayer, resetPlayerForNewRun };
};
