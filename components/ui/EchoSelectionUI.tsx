
import React, { useState, useRef, useEffect } from 'react';
import { Echo, PlayerState, Rarity, ActiveEchoId } from '../../types';
import Button from '../common/Button';
import { playMidiSoundPlaceholder } from '../../utils/soundUtils';
import { ALL_ECHOS_MAP } from '../../core/echos'; // Updated import path

interface EchoCardProps {
  echo: Echo;
  playerGold: number;
  onSelect: (echoId: string) => void;
  isSelectedForAnimation: boolean;
  isUpgrade?: boolean;
  isDisabled?: boolean; 
  nextEchoCostsDoubled: boolean; // New prop
}

const getRarityStyles = (rarity: Rarity): { borderClass: string; nameColorClass: string; shadowClass?: string; focusRingClass?: string; } => {
  switch (rarity) {
    case Rarity.Common:
      return { borderClass: 'border-slate-600', nameColorClass: 'text-slate-300', focusRingClass: 'focus-visible:ring-slate-500' };
    case Rarity.Rare:
      return { borderClass: 'border-sky-500', nameColorClass: 'text-sky-400', shadowClass: 'hover:shadow-sky-500/40', focusRingClass: 'focus-visible:ring-sky-500' };
    case Rarity.Epic:
      return { borderClass: 'border-purple-500', nameColorClass: 'text-purple-400', shadowClass: 'hover:shadow-purple-500/40', focusRingClass: 'focus-visible:ring-purple-500' };
    case Rarity.Legendary:
      return { borderClass: 'border-amber-500', nameColorClass: 'text-amber-400', shadowClass: 'hover:shadow-amber-500/50', focusRingClass: 'focus-visible:ring-amber-500' };
    default:
      return { borderClass: 'border-slate-600', nameColorClass: 'text-slate-300', focusRingClass: 'focus-visible:ring-slate-500' };
  }
};


const EchoCard: React.FC<EchoCardProps> = ({ 
  echo, 
  playerGold, 
  onSelect, 
  isSelectedForAnimation, 
  isUpgrade, 
  isDisabled = false,
  nextEchoCostsDoubled 
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const costMultiplier = nextEchoCostsDoubled && !echo.isFree ? 2 : 1;
  const actualCost = echo.cost * costMultiplier;
  const canAfford = echo.isFree || playerGold >= actualCost;
  const rarityStyles = getRarityStyles(echo.rarity);
  
  const isEffectivelyDisabled = isDisabled || !canAfford;

  useEffect(() => {
    if (echo.rarity === Rarity.Epic || echo.rarity === Rarity.Legendary) {
      playMidiSoundPlaceholder(`echo_reveal_${echo.rarity.toLowerCase()}_${echo.baseId}`);
    }
  }, [echo.rarity, echo.baseId]);

  const handleCardClick = () => {
    if (!isEffectivelyDisabled && cardRef.current && !isSelectedForAnimation) {
      onSelect(echo.id);
    }
  };

  let cardClasses = `p-4 border-2 rounded-xl shadow-xl transition-all duration-300 ease-in-out transform text-left flex flex-col justify-between min-h-[240px] sm:min-h-[260px]`;
  cardClasses += ` animate-float`;
  cardClasses += ` ${rarityStyles.borderClass}`;
  cardClasses += ` focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 ${rarityStyles.focusRingClass}`;


  if (!isEffectivelyDisabled) {
    cardClasses += ` bg-slate-700 hover:scale-105 ${rarityStyles.shadowClass || 'hover:shadow-slate-500/30'} cursor-pointer`;
  } else {
    cardClasses += ` bg-slate-800/70 opacity-60 filter grayscale-[60%] cursor-not-allowed`;
  }

  if (isSelectedForAnimation && canAfford) { 
    cardClasses += ` animate-select-echo`;
  }

  const descriptionHtml = { __html: echo.description };

  return (
    <div
      ref={cardRef}
      className={cardClasses}
      onClick={handleCardClick}
      onMouseEnter={() => { if(!isEffectivelyDisabled) playMidiSoundPlaceholder('echo_card_hover'); }}
      role="button"
      aria-disabled={isEffectivelyDisabled}
      tabIndex={isEffectivelyDisabled ? -1 : 0}
      aria-label={`Echo: ${echo.name}${echo.level > 1 ? ` Nivel ${echo.level}` : ''} - Rareza: ${echo.rarity}${isUpgrade ? ' - Mejora Disponible' : ''}`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCardClick(); }}}
    >
      <div className="flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h4 className={`text-md sm:text-lg font-bold ${echo.isFree ? 'text-green-400' : rarityStyles.nameColorClass}`}>
            {echo.name} 
            {echo.level > 1 && <span className="text-xs sm:text-sm font-normal text-slate-400">(Nv. {echo.level})</span>}
            {isUpgrade && <span className="text-green-400 font-bold ml-1 text-sm" title="Mejora a un Eco existente">++</span>}
            {echo.isFree && <span className="text-xs sm:text-sm font-normal text-green-400">(Gratis)</span>}
          </h4>
          <span className="text-3xl sm:text-4xl ml-2">{echo.icon}</span>
        </div>
        <p 
          className="text-xs sm:text-sm text-slate-300 my-2 leading-relaxed"
          dangerouslySetInnerHTML={descriptionHtml}
        />
      </div>
      <div className="mt-auto pt-3">
        {!echo.isFree && (
          <p className={`text-sm font-semibold mb-2 ${canAfford ? 'text-yellow-400' : 'text-red-400'}`}>
            Costo: <span className="text-lg">💰</span>{actualCost} {nextEchoCostsDoubled && costMultiplier > 1 && <span className="text-red-400">(x2)</span>}
          </p>
        )}
        <Button 
          disabled={isEffectivelyDisabled} 
          className="w-full text-sm sm:text-base py-1.5 sm:py-2"
          variant={echo.isFree ? 'secondary' : 'primary'}
          onClick={(e) => { 
            e.stopPropagation(); 
            handleCardClick();
           }}
        >
          {canAfford ? (echo.isFree ? "Elegir" : "Adquirir") : "Muy Caro"}
        </Button>
      </div>
    </div>
  );
};

interface EchoSelectionUIProps {
  echoOptions: Echo[];
  player: PlayerState; // Changed from playerGold to full player object
  onSelectEcho: (echoId: string) => void;
  activeEcos: ActiveEchoId[];
  isUiDisabled?: boolean; 
  animatingEchoId: string | null;
}

const EchoSelectionUI: React.FC<EchoSelectionUIProps> = ({ 
  echoOptions, 
  player, 
  onSelectEcho, 
  activeEcos, 
  isUiDisabled = false,
  animatingEchoId
}) => {

  const handleCardSelect = (echoId: string) => {
    if (isUiDisabled && animatingEchoId !== echoId) return; 
    if (animatingEchoId === echoId) return;

    const selectedEcho = echoOptions.find(e => e.id === echoId);
    if (selectedEcho) {
      const costMultiplier = player.nextEchoCostsDoubled && !selectedEcho.isFree ? 2 : 1;
      const actualCost = selectedEcho.cost * costMultiplier;
      if (selectedEcho.isFree || player.gold >= actualCost) {
        onSelectEcho(echoId); 
      }
    }
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 bg-slate-800/70 backdrop-blur-md rounded-xl shadow-2xl">
      <h2 className="text-2xl sm:text-3xl font-bold text-center text-sky-300 mb-4 sm:mb-6">Elige tu Eco</h2>
      <p className="text-center text-yellow-400 mb-4 sm:mb-6 text-lg sm:text-xl">
        Tu Oro: <span className="text-2xl">💰</span>{player.gold}
        {player.nextEchoCostsDoubled && <span className="text-red-400 text-sm ml-2">(Próximo Eco x2 Coste!)</span>}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {echoOptions.map(option => {
          let isUpgrade = false;
          const activeEchoOfTheSameBase = activeEcos
            .map(id => ALL_ECHOS_MAP.get(id))
            .find(ae => ae && ae.baseId === option.baseId);
          
          if (activeEchoOfTheSameBase && option.level > activeEchoOfTheSameBase.level) {
            isUpgrade = true;
          }

          return (
            <EchoCard 
              key={option.id} 
              echo={option} 
              playerGold={player.gold} 
              onSelect={handleCardSelect}
              isSelectedForAnimation={animatingEchoId === option.id}
              isUpgrade={isUpgrade}
              isDisabled={isUiDisabled || (animatingEchoId !== null && animatingEchoId !== option.id)}
              nextEchoCostsDoubled={player.nextEchoCostsDoubled} // Pass the flag
            />
          );
        })}
      </div>
    </div>
  );
};

export default EchoSelectionUI;
