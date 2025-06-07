
import React, { useState, useEffect, useRef } from 'react';
import { GoalDefinition, GoalProgress } from '../../../types';
import Button from '../../common/Button';
import Tooltip from '../../common/Tooltip'; // Import Tooltip
import { playMidiSoundPlaceholder } from '../../../utils/soundUtils';

interface GoalItemProps {
  goalDef: GoalDefinition;
  goalProgress: GoalProgress;
  onClaimReward: () => void;
  prerequisitesMet: boolean; 
  prerequisiteNames?: string[]; 
}

const GoalItem: React.FC<GoalItemProps> = ({ goalDef, goalProgress, onClaimReward, prerequisitesMet, prerequisiteNames }) => {
  const [justClaimedVisual, setJustClaimedVisual] = useState(false);
  const prevClaimedState = useRef(goalProgress.claimed);

  useEffect(() => {
    if (goalProgress.claimed && !prevClaimedState.current) {
      setJustClaimedVisual(true);
      playMidiSoundPlaceholder('goal_item_claimed_animation_start'); // Sound for visual animation
      const timer = setTimeout(() => {
        setJustClaimedVisual(false);
      }, 1200); // Duration of enhanced animation
      prevClaimedState.current = true;
      return () => clearTimeout(timer);
    } else if (!goalProgress.claimed) {
      prevClaimedState.current = false; 
    }
  }, [goalProgress.claimed]);

  const handleClaimClick = () => {
    if (prerequisitesMet && goalProgress.completed && !goalProgress.claimed) {
        playMidiSoundPlaceholder(`goal_claim_sound_success_${goalDef.id}`); 
    }
    onClaimReward();
  }

  const isClaimable = prerequisitesMet && goalProgress.completed && !goalProgress.claimed;
  const isCompletedAndClaimed = prerequisitesMet && goalProgress.completed && goalProgress.claimed;
  const isLocked = !prerequisitesMet;

  let progressBarWidth = '0%';
  if (goalDef.targetValue && goalDef.targetValue > 0) {
    progressBarWidth = `${Math.min(100, (goalProgress.currentValue / goalDef.targetValue) * 100)}%`;
  } else if (goalProgress.completed) {
    progressBarWidth = '100%';
  }

  let baseBorderClass = 'border-stone-600/80';
  let itemBgClass = 'bg-stone-700/80 hover:bg-stone-600/70';
  let animationClass = '';
  let containerOpacityClass = 'opacity-100';
  let filterClass = '';
  let titleColorClass = 'text-amber-300 group-hover:text-amber-200';
  let iconContainerClasses = 'bg-stone-800/60';

  if (isLocked) {
    baseBorderClass = 'border-stone-700/50';
    itemBgClass = 'bg-stone-800/50';
    containerOpacityClass = 'opacity-60';
    filterClass = 'grayscale';
    titleColorClass = 'text-slate-500';
    iconContainerClasses = 'bg-stone-700/30';
  } else if (isClaimable) {
    baseBorderClass = 'border-yellow-400 shadow-lg shadow-yellow-500/30';
    itemBgClass = 'bg-yellow-700/20 hover:bg-yellow-600/30';
    animationClass = 'animate-pulse'; 
    titleColorClass = 'text-yellow-300 group-hover:text-yellow-200';
    iconContainerClasses = 'bg-yellow-700/30';
  } else if (isCompletedAndClaimed) {
    baseBorderClass = 'border-green-700/70';
    itemBgClass = 'bg-green-800/20';
    if (!justClaimedVisual) {
        containerOpacityClass = 'opacity-70';
        filterClass = 'grayscale-[30%]';
    }
    titleColorClass = 'text-green-400';
    iconContainerClasses = 'bg-green-800/30';
  }
  
  if (justClaimedVisual) {
    animationClass += ' animate-goal-claimed-enhanced'; 
  }

  const lockedTooltipContent = isLocked && prerequisiteNames && prerequisiteNames.length > 0 ? (
    <div>
      <div className="tooltip-title">Bloqueado</div>
      <div className="tooltip-description">Requiere completar:</div>
      <ul className="list-disc list-inside text-xs">
        {prerequisiteNames.map(name => <li key={name}>{name}</li>)}
      </ul>
    </div>
  ) : "Bloqueado";


  const goalItemContent = (
    <div className={`p-4 rounded-lg shadow-xl flex flex-col justify-between h-full border-2 group
                    ${itemBgClass}
                    ${baseBorderClass} 
                    ${isLocked ? '' : (isCompletedAndClaimed && !justClaimedVisual ? '' : 'hover:border-amber-500/70')}
                    ${animationClass}
                    ${containerOpacityClass} ${filterClass}
                    transition-all duration-300 relative overflow-hidden`}
    >
      {justClaimedVisual && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <span className="text-5xl text-green-400 animate-ping-once opacity-80">✔️</span>
        </div>
      )}
      <div className="relative z-0"> {/* Content relative to the above animation */}
        <div className="flex items-start mb-2">
          <div className={`p-2 rounded-full mr-3 ${iconContainerClasses} transition-colors duration-300 shadow-inner`}>
            <span className="text-3xl" aria-hidden="true">{isLocked ? '🔒' : goalDef.icon}</span>
          </div>
          <div>
            <h3 className={`text-md font-semibold ${titleColorClass} transition-colors duration-300`}>{goalDef.name}</h3>
            <p className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors duration-300">{goalDef.category}</p>
          </div>
        </div>
        <p className={`text-xs ${isLocked ? 'text-slate-500' : 'text-slate-300'} mb-2 min-h-[30px] group-hover:text-slate-200 transition-colors duration-300`}>{goalDef.description}</p>

        {!isLocked && goalDef.targetValue && goalDef.targetValue > 0 && !isCompletedAndClaimed && (
          <div className="my-2">
            <div className="w-full bg-slate-600 rounded-full h-2.5 shadow-inner">
              <div
                className={`h-2.5 rounded-full transition-all duration-300 ${isClaimable || goalProgress.currentValue >= goalDef.targetValue ? 'bg-green-500' : 'bg-amber-500'}`}
                style={{ width: progressBarWidth }}
              ></div>
            </div>
            <p className="text-xs text-slate-400 text-right mt-0.5">
              {goalProgress.currentValue} / {goalDef.targetValue}
            </p>
          </div>
        )}

        {!isLocked && (
            <p className="text-sm text-yellow-400 font-semibold group-hover:text-yellow-300 transition-colors duration-300">
            Recompensa: {goalDef.rewardLumens} <span aria-label="Lúmenes de Voluntad" className="inline-block transform-gpu transition-transform duration-300 group-hover:scale-110">💡</span>
            </p>
        )}
      </div>

      <div className="mt-4 relative z-0">
        {isLocked ? (
           <p className="text-sm text-slate-500 font-semibold text-center">Bloqueado</p>
        ) :isClaimable ? (
          <Button onClick={handleClaimClick} variant="primary" className="w-full">
            Reclamar Recompensa
          </Button>
        ) : isCompletedAndClaimed ? (
           <div className="text-center">
            <span className={`text-2xl text-green-400 ${justClaimedVisual ? '' : ''}`} role="img" aria-label="Reclamado">✔️</span>
            <p className="text-sm text-green-400 font-semibold">Reclamado</p>
          </div>
        ) : goalProgress.completed && !goalDef.targetValue ? ( 
           <p className="text-sm text-sky-400 font-semibold text-center">Completado</p>
        ) : (
          <p className="text-sm text-slate-500 font-semibold text-center">En Progreso...</p>
        )}
      </div>
    </div>
  );

  if (isLocked) {
    return <Tooltip content={lockedTooltipContent} position="top">{goalItemContent}</Tooltip>;
  }

  return goalItemContent;
};

export default GoalItem;