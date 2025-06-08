// hooks/useFuryMinigame.ts
import { useState, useCallback } from 'react';
import { FuryAbility, FuryMinigamePhase, GuidingTextKey } from '../types';
import { PROLOGUE_MESSAGES, PROLOGUE_LEVEL_ID } from '../constants'; // Assuming constants are needed
// import { playMidiSoundPlaceholder } from '../utils/soundUtils'; // If sounds handled here

export interface UseFuryMinigameProps {
  // Callbacks to update parts of the main gameState in useGameEngine if needed
  // For example, if prologue steps are still managed by useGameEngine's gameState:
  isPrologueActiveCurrently: boolean; // from gameState.isPrologueActive
  currentLevelCurrently: number; // from gameState.currentLevel
  prologueStepCurrently: number; // from gameState.prologueStep
  advancePrologueStepCallback: (step?: number | GuidingTextKey) => void;
  // If guidingTextKey is also managed outside:
  // setGuidingTextKeyCallback: (key: GuidingTextKey) => void;

  // Sound utility if not imported directly
  // playSoundCallback: (soundId: string) => void;
}

export const useFuryMinigame = (props: UseFuryMinigameProps) => {
  const [isFuryMinigameActive, setIsFuryMinigameActive] = useState<boolean>(false);
  const [furyMinigamePhase, setFuryMinigamePhase] = useState<FuryMinigamePhase>('inactive');
  const [furyCardOptions, setFuryCardOptions] = useState<FuryAbility[]>([]);
  const [shuffledFuryCardOrder, setShuffledFuryCardOrder] = useState<number[]>([0, 1, 2]);
  const [playerSelectedFuryCardDisplayIndex, setPlayerSelectedFuryCardDisplayIndex] = useState<number | null>(null);
  const [oracleSelectedFuryAbility, setOracleSelectedFuryAbility] = useState<FuryAbility | null>(null);

  const advanceFuryMinigamePhase = useCallback((newShuffledOrder?: number[] | null) => {
    setFuryMinigamePhase(prevPhase => {
      let nextPhase: FuryMinigamePhase = prevPhase;
      let newPlayerSelectedIdx = playerSelectedFuryCardDisplayIndex; // Use state directly
      let currentShuffledOrder = newShuffledOrder || shuffledFuryCardOrder; // Use state or new
      let chosenAbilityForOracle = oracleSelectedFuryAbility; // Use state

      // Logic from useGameEngine's advanceFuryMinigamePhase
      // This will also need access to currentLevel, isPrologueActive, prologueStep from props
      // and call props.advancePrologueStepCallback
      switch (prevPhase) {
        case 'starting':
          nextPhase = 'reveal_cards';
          if (props.isPrologueActiveCurrently && props.currentLevelCurrently === PROLOGUE_LEVEL_ID && props.prologueStepCurrently === 9) {
            props.advancePrologueStepCallback(10);
          }
          break;
        case 'reveal_cards':
          nextPhase = 'cards_revealed';
          break;
        case 'cards_revealed':
          nextPhase = 'flipping_to_back';
          if (props.isPrologueActiveCurrently && props.currentLevelCurrently === PROLOGUE_LEVEL_ID && props.prologueStepCurrently === 10) {
            props.advancePrologueStepCallback(11);
          }
          break;
        case 'flipping_to_back':
          nextPhase = 'shuffling';
          break;
        case 'shuffling':
          nextPhase = 'ready_to_pick';
          if (currentShuffledOrder) setShuffledFuryCardOrder(currentShuffledOrder as number[]);
          if (props.isPrologueActiveCurrently && props.currentLevelCurrently === PROLOGUE_LEVEL_ID && props.prologueStepCurrently === 11) {
            props.advancePrologueStepCallback(12);
          }
          break;
        case 'card_picked':
          nextPhase = 'revealing_choice';
          break;
        case 'revealing_choice':
          nextPhase = 'inactive';
          if (newPlayerSelectedIdx !== null && furyCardOptions.length > 0) {
            const actualOriginalIndex = currentShuffledOrder[newPlayerSelectedIdx];
            const chosenAbility = furyCardOptions[actualOriginalIndex];
            if (chosenAbility) setOracleSelectedFuryAbility(chosenAbility);
          }
          if (props.isPrologueActiveCurrently && props.currentLevelCurrently === PROLOGUE_LEVEL_ID && props.prologueStepCurrently === 12) {
            props.advancePrologueStepCallback(13);
          }
          break;
        case 'inactive':
          nextPhase = 'inactive';
          break;
      }

      const minigameCompleted = nextPhase === 'inactive';
      if (minigameCompleted) {
        setIsFuryMinigameActive(false);
      }
      // The original function also updated gameState.furyMinigameCompletedForThisLevel
      // This should be handled by useGameEngine based on isFuryMinigameActive and phase
      return nextPhase;
    });
  }, [
    playerSelectedFuryCardDisplayIndex, furyCardOptions, shuffledFuryCardOrder, oracleSelectedFuryAbility, // Include state dependencies
    props.isPrologueActiveCurrently, props.currentLevelCurrently, props.prologueStepCurrently,
    props.advancePrologueStepCallback
  ]);

  const handlePlayerFuryCardSelection = useCallback((displayIndex: number) => {
    if (furyMinigamePhase !== 'ready_to_pick') return;
    // props.playSoundCallback('fury_card_select'); // Sound handled by GameEngine or UI
    setPlayerSelectedFuryCardDisplayIndex(displayIndex);
    setFuryMinigamePhase('card_picked');
  }, [furyMinigamePhase]);

  // Function to initiate the minigame (called by useGameEngine)
  const startFuryMinigame = useCallback((options: FuryAbility[]) => {
    setIsFuryMinigameActive(true);
    setFuryMinigamePhase('starting');
    setFuryCardOptions(options);
    setPlayerSelectedFuryCardDisplayIndex(null);
    setOracleSelectedFuryAbility(null); // Clear previous selection
    // Initial shuffle can be done here or in 'shuffling' phase
    setShuffledFuryCardOrder([0,1,2].sort(() => Math.random() - 0.5));
  }, []);

  // Function to reset minigame state, e.g. when a level ends/starts
  const resetFuryMinigame = useCallback(() => {
    setIsFuryMinigameActive(false);
    setFuryMinigamePhase('inactive');
    setFuryCardOptions([]);
    setPlayerSelectedFuryCardDisplayIndex(null);
    // oracleSelectedFuryAbility might be kept until next minigame starts or explicitly cleared by game engine
  }, []);


  return {
    isFuryMinigameActive,
    furyMinigamePhase,
    furyCardOptions,
    shuffledFuryCardOrder,
    playerSelectedFuryCardDisplayIndex,
    oracleSelectedFuryAbility,
    setOracleSelectedFuryAbility, // Expose if GameEngine needs to set it (e.g. for prologue)
    startFuryMinigame, // New function to trigger minigame
    advanceFuryMinigamePhase,
    handlePlayerFuryCardSelection,
    resetFuryMinigame,
  };
};
