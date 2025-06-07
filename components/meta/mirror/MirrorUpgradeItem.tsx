
import React, { useState, useEffect, useRef } from 'react';
import { MirrorUpgradeDefinition } from '../../../types';
import Button from '../../common/Button';
import { playMidiSoundPlaceholder } from '../../../utils/soundUtils';

interface MirrorUpgradeItemProps {
  upgradeDef: MirrorUpgradeDefinition;
  currentLevel: number;
  willLumens: number;
  onUpgrade: () => void;
}

const MirrorUpgradeItem: React.FC<MirrorUpgradeItemProps> = ({
  upgradeDef,
  currentLevel,
  willLumens,
  onUpgrade,
}) => {
  const [justUpgradedLevel, setJustUpgradedLevel] = useState<number | null>(null);
  // showRipple state is now managed locally within handleUpgradeClick as the ripple is short-lived
  const prevLevelRef = React.useRef(currentLevel);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (currentLevel > prevLevelRef.current) {
      setJustUpgradedLevel(currentLevel);
      const timer = setTimeout(() => {
        setJustUpgradedLevel(null);
      }, 1000); // Duration for the gem fill visual feedback
      prevLevelRef.current = currentLevel;
      return () => clearTimeout(timer);
    }
    if (currentLevel < prevLevelRef.current) { // Handle potential resets if ever needed
      prevLevelRef.current = currentLevel;
    }
  }, [currentLevel]);

  const isMaxLevel = currentLevel >= upgradeDef.maxLevel;
  const nextLevelInfo = !isMaxLevel ? upgradeDef.levels.find(l => l.level === currentLevel + 1) : null;
  const canAfford = nextLevelInfo ? willLumens >= nextLevelInfo.cost : false;

  let currentEffectDescription = "Nivel Base";
  if (currentLevel > 0) {
    let totalEffectValue = 0;
    for(let i = 0; i < currentLevel; i++) {
        totalEffectValue += upgradeDef.levels[i].effectValue;
    }
    currentEffectDescription = upgradeDef.descriptionTemplate(totalEffectValue);
  }

  const handleUpgradeClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return;

    if (isMaxLevel) {
        playMidiSoundPlaceholder('mirror_upgrade_fail_maxlevel');
    } else if (nextLevelInfo && !canAfford) {
        playMidiSoundPlaceholder('mirror_upgrade_fail_cost');
    } else if (nextLevelInfo && canAfford) {
      // Create ripple element only if upgrade is possible
      const ripple = document.createElement('span');
      const rect = buttonRef.current.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      
      ripple.className = 'ripple'; // Ensure class is applied
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
      
      buttonRef.current.appendChild(ripple);
      ripple.onanimationend = () => ripple.remove(); // Clean up ripple
    }
    onUpgrade(); // Call onUpgrade regardless to handle modal logic or direct upgrade
  };

  const renderLevelGems = () => {
    const gems = [];
    for (let i = 1; i <= upgradeDef.maxLevel; i++) {
      const isFilled = i <= currentLevel;
      const isAnimatingFill = justUpgradedLevel === i;
      gems.push(
        <div
          key={i}
          className={`w-3 h-5 sm:w-4 sm:h-6 rounded-sm border border-sky-800/70 transition-all duration-300 
                      ${isFilled ? 'bg-sky-500 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4),0_0_5px_rgba(14,165,233,0.8)]' : 'bg-slate-600/40 shadow-inner'}
                      ${isAnimatingFill ? 'animate-gem-fill' : ''}`}
          title={`Nivel ${i}${isFilled ? ' (Conseguido)' : ''}`}
        ></div>
      );
    }
    return <div className="flex space-x-1.5 mt-1 mb-2 justify-center">{gems}</div>;
  };

  return (
    <div 
      className={`bg-gradient-to-br from-slate-700/70 via-sky-800/20 to-slate-700/70 p-4 rounded-lg shadow-xl flex flex-col justify-between h-full 
                  border-2 border-sky-500/30 hover:border-sky-400/60 transition-all duration-300 
                  relative overflow-hidden group
                  ${justUpgradedLevel === currentLevel && currentLevel > 0 ? 'animate-mirror-upgrade-item' : ''}`} // Ensure animation triggers on the correct level update
    >
      {/* Subtle grid pattern using CSS for a more crystalline feel */}
      <div 
        className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity duration-500 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(45deg, rgba(125, 211, 252, 0.2) 25%, transparent 25%, transparent 75%, rgba(125, 211, 252, 0.2) 75%, rgba(125, 211, 252, 0.2)),
                           linear-gradient(45deg, rgba(125, 211, 252, 0.2) 25%, transparent 25%, transparent 75%, rgba(125, 211, 252, 0.2) 75%, rgba(125, 211, 252, 0.2))`,
          backgroundSize: '12px 12px',
          backgroundPosition: '0 0, 6px 6px',
        }}
      ></div>
      
      <div className="relative z-10 flex flex-col flex-grow">
        <div className="flex items-center mb-2">
          <span 
            className={`text-3xl mr-3 transition-transform duration-300 group-hover:scale-110 ${justUpgradedLevel === currentLevel && currentLevel > 0 ? 'animate-ping-briefly' : ''}`} 
            aria-hidden="true"
          >
            {upgradeDef.icon}
          </span>
          <h3 className="text-lg font-semibold text-sky-200 group-hover:text-sky-100 transition-colors">{upgradeDef.name}</h3>
        </div>
        
        {renderLevelGems()}

        <p className="text-xs text-slate-300 mb-3 min-h-[30px] group-hover:text-slate-200 transition-colors text-center">
          {currentEffectDescription}
        </p>

        {!isMaxLevel && nextLevelInfo && (
          <div className="mt-auto"> {/* Ensure this section is pushed down if content above is short */}
            <p className="text-sm text-slate-200 mb-1 text-center">
              Próximo Nivel ({currentLevel + 1}):
            </p>
            <p className="text-xs text-sky-300 mb-1 min-h-[30px] group-hover:text-sky-200 transition-colors text-center">
              {upgradeDef.descriptionTemplate(
                upgradeDef.levels.slice(0, currentLevel + 1).reduce((sum, level) => sum + level.effectValue, 0)
              )}
            </p>
            <p className={`text-sm font-semibold text-center ${canAfford ? 'text-yellow-300 group-hover:text-yellow-200' : 'text-red-400 group-hover:text-red-300'} transition-colors`}>
              Costo: {nextLevelInfo.cost} <span aria-label="Lúmenes de Voluntad" className="inline-block transform-gpu transition-transform duration-300 group-hover:scale-110">💡</span>
            </p>
          </div>
        )}
        {isMaxLevel && (
          <p className="text-sm text-green-300 font-semibold text-center mt-auto">Nivel Máximo Alcanzado</p>
        )}
      </div>

      {!isMaxLevel && nextLevelInfo && (
        <Button
          ref={buttonRef}
          onClick={handleUpgradeClick}
          disabled={!canAfford && !isMaxLevel}
          variant={canAfford ? 'primary' : 'secondary'}
          className="w-full mt-4 relative z-10 overflow-hidden shadow-lg hover:shadow-sky-500/50" 
        >
          Mejorar
          {/* Ripple span is dynamically added in handleUpgradeClick */}
        </Button>
      )}
    </div>
  );
};

export default MirrorUpgradeItem;
