
import React, { useState, useRef, useEffect } from 'react';
import { useGameEngine } from '../hooks/useGameEngine';
import EchoSelectionUI from '../components/ui/EchoSelectionUI';
import EchoesDisplay from '../components/ui/EchoesDisplay';
import { GameStatus, ActiveEchoId, Echo } 
from '../types';
import CorazonDelAbismoChoiceUI from '../components/ui/CorazonDelAbismoChoiceUI';

interface PostLevelScreenProps {
  gameEngine: ReturnType<typeof useGameEngine>;
}

const PostLevelScreen: React.FC<PostLevelScreenProps> = ({ gameEngine }) => {
  const {
    player,
    availableEchoChoices,
    selectEchoOption,
    proceedToNextLevel, 
    activeEcos, 
    fullActiveEcos, 
    gameState,
    resolveCorazonDelAbismoChoice,
    setGameStatus, 
  } = gameEngine;

  const [processingSelectionEchoId, setProcessingSelectionEchoId] = useState<string | null>(null);
  const selectionTimeoutRef = useRef<number | null>(null);

  const handleEchoSelection = (echoId: string) => {
    if (processingSelectionEchoId || gameState.isFuryMinigameActive || gameState.isCorazonDelAbismoChoiceActive) {
        console.warn("Echo selection attempted while another process is active or selection already processed.");
        return;
    }

    if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current);
        selectionTimeoutRef.current = null;
    }

    setProcessingSelectionEchoId(echoId);
    const corazonWasActivated = selectEchoOption(echoId);

    if (!corazonWasActivated) {
        // The useEffect in useGameEngine handles the next step.
        // If processingSelectionEchoId was the *only* thing preventing
        // a UI update for a brief moment before engine took over, this is okay.
        // But if PostLevelScreen unmounts, processingSelectionEchoId should clear via useEffect.
    }
  };

  const handleCorazonChoice = (type: 'epic' | 'duplicate', chosenEchoId?: string) => {
    if (processingSelectionEchoId === 'corazon_choice_active' || gameState.isFuryMinigameActive) {
        console.warn("Corazon choice attempted while processing or fury minigame active.");
        return;
    }

    if (selectionTimeoutRef.current) { 
        clearTimeout(selectionTimeoutRef.current);
        selectionTimeoutRef.current = null;
    }

    setProcessingSelectionEchoId('corazon_choice_active');
    resolveCorazonDelAbismoChoice(type, chosenEchoId);
  };

  useEffect(() => {
    // Clear processingSelectionEchoId if the game moves away from PostLevel screen
    if (gameState.status !== GameStatus.PostLevel && processingSelectionEchoId) {
      setProcessingSelectionEchoId(null);
    }
    // Cleanup timeout on unmount
    return () => { 
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current);
      }
    };
  }, [gameState.status, processingSelectionEchoId]);

  const activeEchoIdsFromPlayerActiveEcos: ActiveEchoId[] = activeEcos.map(e => e.id); 
  const currentCorazonOptions = gameState.corazonDelAbismoOptions;


  return (
    <div className="flex flex-col items-center justify-center p-4 w-full min-h-[80vh]">
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-bold text-green-400">¡Nivel {gameState.currentLevel} Superado!</h2>
        <p className="text-slate-300 mt-1" id="postLevelMessage">
          {gameState.isCorazonDelAbismoChoiceActive
            ? "El Corazón del Abismo exige una ofrenda..."
            : "Los Ecos de la batalla resuenan. Elige tu bendición."}
        </p>
      </div>

      {fullActiveEcos.length > 0 && (
        <div className="mb-6 w-full max-w-3xl p-3 bg-slate-700/60 rounded-lg shadow-md">
           <EchoesDisplay
              activeEcos={fullActiveEcos} 
              player={player}
              conditionalEchoTriggeredId={gameState.conditionalEchoTriggeredId}
            />
        </div>
      )}

      {gameState.isCorazonDelAbismoChoiceActive && currentCorazonOptions ? (
        <CorazonDelAbismoChoiceUI
          {...currentCorazonOptions} 
          onChoice={handleCorazonChoice}
          playerGold={player.gold}
        />
      ) : (
        <EchoSelectionUI
          echoOptions={availableEchoChoices}
          player={player} 
          onSelectEcho={handleEchoSelection}
          activeEcos={activeEchoIdsFromPlayerActiveEcos} 
          isUiDisabled={processingSelectionEchoId !== null || gameState.isFuryMinigameActive || gameState.isCorazonDelAbismoChoiceActive}
          animatingEchoId={processingSelectionEchoId}
        />
      )}
    </div>
  );
};

export default PostLevelScreen;
