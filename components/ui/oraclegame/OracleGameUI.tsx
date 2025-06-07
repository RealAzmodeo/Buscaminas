import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FuryAbility, FuryMinigamePhase } from '../../../types';
import { useGameEngine } from '../../../hooks/useGameEngine';
import OracleCard from './OracleCard'; 

interface OracleGameUIProps { 
  gameEngine: ReturnType<typeof useGameEngine>;
}

const STARTING_PHASE_DURATION_MS = 100;
const CARD_APPEARANCE_DURATION_MS = 1000; 
const REVEAL_DURATION_MS = 4000; 
const FLIP_ANIMATION_DURATION_MS = 700; 
const SELECTION_ANIMATION_MS = 500; 
const REVEALING_CHOICE_DURATION_MS = 2000; 

const MIN_SHUFFLE_SWAPS = 5;
const MAX_SHUFFLE_SWAPS = 7;
const SWAP_ANIMATION_DURATION_MS = 350;
const POST_SWAP_BUFFER_MS = 50;

const CARD_WIDTH = 160;
const CARD_HEIGHT = 240;
const CARD_GAP = 16;
const CONTAINER_HORIZONTAL_PADDING = 8;
const EFFECTIVE_CARD_SLOT_WIDTH = CARD_WIDTH + CARD_GAP;

interface VisualCardElement {
  originalIndex: number;
  currentSlot: number;
  ability: FuryAbility | null;
  key: string;
}

const OracleGameUI: React.FC<OracleGameUIProps> = ({ gameEngine }) => { 
  const { gameState, advanceFuryMinigamePhase, handlePlayerFuryCardSelection } = gameEngine;
  const { furyMinigamePhase, furyCardOptions, playerSelectedFuryCardDisplayIndex } = gameState;

  const [allowPickInteraction, setAllowPickInteraction] = useState(false);
  const [currentPromptText, setCurrentPromptText] = useState("El Oráculo se agita...");
  const [visualCardElements, setVisualCardElements] = useState<VisualCardElement[]>([]);

  const shuffleTimeoutRef = useRef<number[]>([]);
  const shuffleStartedForPhaseRef = useRef<boolean>(false);
  const phaseTimeoutRef = useRef<number | undefined>();

  useEffect(() => {
    if (gameState.isFuryMinigameActive && furyCardOptions.length > 0) {
        const needsReInit = visualCardElements.length !== furyCardOptions.length ||
            visualCardElements.some((vc, i) => vc.ability?.id !== furyCardOptions[i]?.id) ||
            (furyMinigamePhase === 'starting' && !visualCardElements.every((vc,i) => vc.currentSlot === i && vc.originalIndex === i));

        if (needsReInit) {
            const initialElements = furyCardOptions.map((ability: FuryAbility, index: number): VisualCardElement => ({
                originalIndex: index,
                currentSlot: index,
                ability: ability,
                key: `oracle-visual-card-${index}-${ability.id}` 
            }));
            setVisualCardElements(initialElements);
            shuffleStartedForPhaseRef.current = false;
        }
    } else if (!gameState.isFuryMinigameActive) {
        setVisualCardElements([]);
        shuffleStartedForPhaseRef.current = false;
    }
  }, [gameState.isFuryMinigameActive, furyCardOptions, furyMinigamePhase, visualCardElements]);

  const performShuffleSequence = useCallback(() => {
    let elementsSnapshot = visualCardElements.map(el => ({...el}));
    shuffleTimeoutRef.current.forEach(id => clearTimeout(id));
    shuffleTimeoutRef.current = [];
    let swapsDone = 0;
    const numSwaps = Math.floor(Math.random() * (MAX_SHUFFLE_SWAPS - MIN_SHUFFLE_SWAPS + 1)) + MIN_SHUFFLE_SWAPS;

    const doSwap = () => {
        if (swapsDone >= numSwaps) {
            const sortedSnapshot = [...elementsSnapshot].sort((a, b) => a.currentSlot - b.currentSlot);
            
            const mapCardToOriginalIndex = (card: VisualCardElement): number => card.originalIndex;
            const finalOrder: number[] = sortedSnapshot.map(mapCardToOriginalIndex);
            
            if (finalOrder.length > 0) {
                advanceFuryMinigamePhase(finalOrder);
            } else {
                advanceFuryMinigamePhase(null); 
            }
            return;
        }
        const cardIndex1 = Math.floor(Math.random() * elementsSnapshot.length);
        let cardIndex2 = Math.floor(Math.random() * elementsSnapshot.length);
        while (cardIndex1 === cardIndex2) cardIndex2 = Math.floor(Math.random() * elementsSnapshot.length);

        const tempSlot = elementsSnapshot[cardIndex1].currentSlot;
        elementsSnapshot[cardIndex1].currentSlot = elementsSnapshot[cardIndex2].currentSlot;
        elementsSnapshot[cardIndex2].currentSlot = tempSlot;

        setVisualCardElements([...elementsSnapshot]);
        swapsDone++;
        const timeoutId = window.setTimeout(doSwap, SWAP_ANIMATION_DURATION_MS + POST_SWAP_BUFFER_MS);
        shuffleTimeoutRef.current.push(timeoutId);
    };

    if (elementsSnapshot.length > 0) {
      const initialTimeoutId = window.setTimeout(doSwap, 50);
      shuffleTimeoutRef.current.push(initialTimeoutId);
    } else {
      if (furyCardOptions.length > 0) {
          const orderArgument = [...Array(furyCardOptions.length).keys()];
          advanceFuryMinigamePhase(orderArgument);
      } else {
          advanceFuryMinigamePhase(null); 
      }
    }
  }, [visualCardElements, furyCardOptions, advanceFuryMinigamePhase]);


  useEffect(() => {
    if (phaseTimeoutRef.current) clearTimeout(phaseTimeoutRef.current);
    phaseTimeoutRef.current = undefined;
    setAllowPickInteraction(false);

    if (furyMinigamePhase !== 'shuffling' && shuffleStartedForPhaseRef.current) {
        shuffleTimeoutRef.current.forEach(id => clearTimeout(id));
        shuffleTimeoutRef.current = [];
        shuffleStartedForPhaseRef.current = false;
    }

    let newPromptText = "El Oráculo se agita...";
    let timeoutDuration: number | undefined;
    let shouldAdvancePhaseAutomatically = true;


    switch (furyMinigamePhase) {
      case 'starting':
        newPromptText = "El Oráculo se agita...";
        timeoutDuration = STARTING_PHASE_DURATION_MS;
        break;
      case 'reveal_cards':
        newPromptText = "Los destinos se revelan...";
        timeoutDuration = CARD_APPEARANCE_DURATION_MS + (furyCardOptions.length * 150);
        break;
      case 'cards_revealed':
        newPromptText = "Observa bien y memoriza...";
        timeoutDuration = REVEAL_DURATION_MS;
        break;
      case 'flipping_to_back':
        newPromptText = "Las sombras danzan...";
        timeoutDuration = FLIP_ANIMATION_DURATION_MS;
        break;
      case 'shuffling':
        newPromptText = "El caos arremolina el futuro...";
        if (visualCardElements.length > 0 && !shuffleStartedForPhaseRef.current) {
            shuffleStartedForPhaseRef.current = true;
            performShuffleSequence();
        }
        shouldAdvancePhaseAutomatically = false;
        break;
      case 'ready_to_pick':
        newPromptText = "El Abismo te observa. Elige.";
        setAllowPickInteraction(true);
        shouldAdvancePhaseAutomatically = false;
        break;
      case 'card_picked':
        newPromptText = "El destino ha sido sellado...";
        setAllowPickInteraction(false);
        timeoutDuration = SELECTION_ANIMATION_MS;
        break;
      case 'revealing_choice':
        newPromptText = "Tu agonía se manifiesta...";
        timeoutDuration = REVEALING_CHOICE_DURATION_MS;
        break;
      case 'inactive':
        newPromptText = "El Oráculo duerme...";
        if (shuffleStartedForPhaseRef.current) {
            shuffleTimeoutRef.current.forEach(id => clearTimeout(id));
            shuffleTimeoutRef.current = [];
            shuffleStartedForPhaseRef.current = false;
        }
        shouldAdvancePhaseAutomatically = false;
        break;
      default:
        shouldAdvancePhaseAutomatically = false;
    }

    setCurrentPromptText(newPromptText);
    if (shouldAdvancePhaseAutomatically && timeoutDuration !== undefined) {
        phaseTimeoutRef.current = window.setTimeout(() => {
          advanceFuryMinigamePhase(null); 
        }, timeoutDuration);
    }

    return () => {
        if (phaseTimeoutRef.current) clearTimeout(phaseTimeoutRef.current);
    }
  }, [furyMinigamePhase, visualCardElements, performShuffleSequence, furyCardOptions, advanceFuryMinigamePhase]);

  useEffect(() => {
    return () => {
        if (phaseTimeoutRef.current) clearTimeout(phaseTimeoutRef.current);
        shuffleTimeoutRef.current.forEach(id => clearTimeout(id));
    };
  }, []);

  if (!gameState.isFuryMinigameActive || furyMinigamePhase === 'inactive') return null;

  const containerWidth = (CARD_WIDTH * Math.max(1, furyCardOptions.length)) + (CARD_GAP * Math.max(0, furyCardOptions.length - 1)) + (CONTAINER_HORIZONTAL_PADDING * 2);
  const containerHeight = CARD_HEIGHT + (CONTAINER_HORIZONTAL_PADDING * 2);

  return (
    <div className="oracle-game-overlay" aria-modal="true" role="dialog" aria-labelledby="oracleGamePrompt">
      <div
        id="oracleGamePrompt"
        className={`oracle-game-prompt text-2xl sm:text-3xl font-bold text-sky-300 mb-6 text-center ${furyMinigamePhase === 'starting' || furyMinigamePhase === 'shuffling' ? 'animate-pulse' : ''}`}
      >
        {currentPromptText}
      </div>

      {furyMinigamePhase === 'cards_revealed' && (
        <div className="oracle-reveal-timer-bar-container">
          <div className={`oracle-reveal-timer-bar is-depleting`} style={{ animationDuration: `${REVEAL_DURATION_MS}ms`}}></div>
        </div>
      )}

      <div
        className="oracle-card-container"
        style={{ width: `${containerWidth}px`, height: `${containerHeight}px`, position: 'relative' }}
      >
        {visualCardElements.map((cardElement, index) => {
          let cardIsFaceUp;
          let shouldRenderCard = true;
          switch (furyMinigamePhase) {
            case 'starting':
            case 'reveal_cards':
            case 'cards_revealed':
              cardIsFaceUp = true;
              break;
            case 'flipping_to_back':
            case 'shuffling':
            case 'ready_to_pick':
              cardIsFaceUp = false;
              break;
            case 'card_picked':
              cardIsFaceUp = false;
              break;
            case 'revealing_choice':
              if (playerSelectedFuryCardDisplayIndex !== cardElement.currentSlot) {
                 shouldRenderCard = false;
              }
              cardIsFaceUp = (playerSelectedFuryCardDisplayIndex === cardElement.currentSlot);
              break;
            default:
              cardIsFaceUp = true;
              shouldRenderCard = false;
          }

          if (!shouldRenderCard) return null;

          const cardSlotX = CONTAINER_HORIZONTAL_PADDING + (cardElement.currentSlot * EFFECTIVE_CARD_SLOT_WIDTH);

          return (
            <OracleCard
              key={cardElement.key}
              ability={cardElement.ability}
              isFaceUp={cardIsFaceUp}
              onClick={() => allowPickInteraction && handlePlayerFuryCardSelection(cardElement.currentSlot)}
              isSelectable={allowPickInteraction}
              appearanceDelay={furyMinigamePhase === 'reveal_cards' ? index * 150 : -1}
              isSelectedForAnimation={furyMinigamePhase === 'card_picked' && playerSelectedFuryCardDisplayIndex === cardElement.currentSlot}
              inlineCardStyle={{
                position: 'absolute',
                left: `${cardSlotX}px`,
                top: `${CONTAINER_HORIZONTAL_PADDING}px`,
                transition: furyMinigamePhase === 'shuffling' ? `left ${SWAP_ANIMATION_DURATION_MS}ms ease-in-out` : 'none',
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default OracleGameUI;