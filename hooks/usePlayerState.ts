// hooks/usePlayerState.ts
import { useState } from 'react';
import { PlayerState } from '../types';
import { INITIAL_PLAYER_HP, INITIAL_PLAYER_GOLD, INITIAL_PLAYER_SHIELD } from '../constants';

// This is the full initial state for a new run, including buffs/debuffs that start at 0 or false.
// Level-specific parts of the state will be reset by useGameEngine during level transitions.
export const initialPlayerRunState: PlayerState = {
  hp: INITIAL_PLAYER_HP,
  maxHp: INITIAL_PLAYER_HP,
  gold: INITIAL_PLAYER_GOLD,
  shield: INITIAL_PLAYER_SHIELD,
  // Buffs/Trackers (typically reset or re-evaluated per level or run)
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
  // Flags affected by other game systems
  nextEchoCostsDoubled: false,
  nextOracleOnlyCommonFury: false,
  pistasFalsasClicksRemaining: 0,
  paranoiaGalopanteClicksRemaining: 0,
};

export const usePlayerState = () => {
  const [player, setPlayer] = useState<PlayerState>(initialPlayerRunState);

  // It might be useful to return a function to reset to initial run state
  // or a function to reset per-level player state aspects.
  // For now, only state and setter are returned as per plan.
  return { player, setPlayer, initialPlayerRunState }; // Exporting initial state for reset purposes
};
