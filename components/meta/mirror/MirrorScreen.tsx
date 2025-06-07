
import React, { useState, useEffect, useRef } from 'react';
import { MetaProgressState, MirrorUpgradeDefinition } from '../../../types';
import Button from '../../common/Button';
import { MIRROR_UPGRADES_CONFIG, CONFIRMATION_THRESHOLD_LUMENS, INITIAL_MAX_SOUL_FRAGMENTS } from '../../../constants/metaProgressionConstants';
import { playMidiSoundPlaceholder } from '../../../utils/soundUtils';
import MirrorUpgradeItem from './MirrorUpgradeItem';
import ConfirmMirrorUpgradeModal from '../../modals/ConfirmMirrorUpgradeModal'; 

interface MirrorScreenProps {
  metaProgress: MetaProgressState;
  setMetaProgress: (updater: React.SetStateAction<MetaProgressState>) => void;
  onExit: () => void;
}

const MirrorScreen: React.FC<MirrorScreenProps> = ({ metaProgress, setMetaProgress, onExit }) => {
  const [confirmUpgradeData, setConfirmUpgradeData] = useState<{
    upgradeDef: MirrorUpgradeDefinition;
    nextLevelInfo: NonNullable<MirrorUpgradeDefinition['levels'][0]>;
  } | null>(null);
  
  const [lumenDisplayValue, setLumenDisplayValue] = useState(metaProgress.willLumens);
  const lumenDisplayRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (lumenDisplayValue !== metaProgress.willLumens) {
      if (lumenDisplayRef.current) {
        lumenDisplayRef.current.classList.remove('animate-lumen-change');
        void lumenDisplayRef.current.offsetWidth; 
        lumenDisplayRef.current.classList.add('animate-lumen-change');
        // Sound is played when lumens are actually spent/gained
        setTimeout(() => {
          lumenDisplayRef.current?.classList.remove('animate-lumen-change');
        }, 800); // Match animation duration
      }
      setLumenDisplayValue(metaProgress.willLumens);
    }
  }, [metaProgress.willLumens, lumenDisplayValue]);

  const performUpgrade = (upgradeId: string) => {
    const upgradeDef = MIRROR_UPGRADES_CONFIG.find(u => u.id === upgradeId);
    if (!upgradeDef) return;
    const currentLevel = metaProgress.mirrorUpgrades[upgradeId] || 0;
    const nextLevelInfo = upgradeDef.levels.find(l => l.level === currentLevel + 1);

    if (!nextLevelInfo) return; 

    playMidiSoundPlaceholder(`mirror_upgrade_success_${upgradeId}`);
    if (nextLevelInfo.cost >= CONFIRMATION_THRESHOLD_LUMENS * 0.75) { 
        playMidiSoundPlaceholder(`mirror_upgrade_success_MAJOR_${upgradeId}`);
    }
    playMidiSoundPlaceholder('mirror_lumen_counter_change');

    setMetaProgress(prev => {
      const newMirrorUpgrades = {
        ...prev.mirrorUpgrades,
        [upgradeId]: currentLevel + 1,
      };
      
      let newMaxSoulFragments = prev.maxSoulFragments;
      if (upgradeDef.appliesTo === 'playerMaxSoulFragments') {
        const affinityUpgrade = MIRROR_UPGRADES_CONFIG.find(u => u.id === upgradeId);
        if (affinityUpgrade) {
            let totalBonus = 0;
            for(let i=0; i < (currentLevel + 1); i++) {
                totalBonus += affinityUpgrade.levels[i].effectValue;
            }
            newMaxSoulFragments = INITIAL_MAX_SOUL_FRAGMENTS + totalBonus;
        }
      }

      return {
        ...prev,
        willLumens: prev.willLumens - nextLevelInfo.cost,
        mirrorUpgrades: newMirrorUpgrades,
        maxSoulFragments: newMaxSoulFragments,
      };
    });
  };


  const handleAttemptUpgrade = (upgradeId: string) => {
    const upgradeDef = MIRROR_UPGRADES_CONFIG.find(u => u.id === upgradeId);
    if (!upgradeDef) return;

    const currentLevel = metaProgress.mirrorUpgrades[upgradeId] || 0;
    if (currentLevel >= upgradeDef.maxLevel) {
      playMidiSoundPlaceholder('mirror_upgrade_fail_maxlevel');
      return;
    }

    const nextLevelInfo = upgradeDef.levels.find(l => l.level === currentLevel + 1);
    if (!nextLevelInfo || metaProgress.willLumens < nextLevelInfo.cost) {
      playMidiSoundPlaceholder('mirror_upgrade_fail_cost');
      return;
    }

    if (nextLevelInfo.cost >= CONFIRMATION_THRESHOLD_LUMENS) {
      playMidiSoundPlaceholder('modal_open_confirm_mirror');
      setConfirmUpgradeData({ upgradeDef, nextLevelInfo });
    } else {
      performUpgrade(upgradeId);
    }
  };

  const handleConfirmModal = (confirmed: boolean) => {
    if (confirmed && confirmUpgradeData) {
      playMidiSoundPlaceholder('modal_confirm_action');
      performUpgrade(confirmUpgradeData.upgradeDef.id);
    } else {
      playMidiSoundPlaceholder('modal_cancel_action');
    }
    setConfirmUpgradeData(null);
  };


  return (
    <div 
      className="p-4 sm:p-6 w-full flex flex-col space-y-6 min-h-[85vh] 
                 bg-gradient-to-br from-slate-900 via-sky-900/30 to-slate-900 
                 rounded-xl shadow-2xl border border-sky-700/50 relative overflow-hidden"
    >
      {/* Ethereal background elements - refined opacities and blur */}
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-sky-800/40 via-transparent to-transparent pointer-events-none blur-sm"></div>
      <div className="absolute top-0 left-0 w-3/5 h-3/5 opacity-10 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-cyan-600/50 to-transparent blur-3xl pointer-events-none animate-pulse duration-[5000ms] ease-in-out infinite alternate"></div>
      <div className="absolute bottom-0 right-0 w-3/5 h-3/5 opacity-10 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-purple-600/40 to-transparent blur-3xl pointer-events-none animate-pulse duration-[6000ms] ease-in-out infinite alternate delay-1000"></div>

      <div className="flex justify-between items-center relative z-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-sky-300 drop-shadow-[0_2px_3px_rgba(14,165,233,0.5)]">El Espejo del Ser Interior</h1>
        <Button onClick={onExit} variant="secondary">Volver al Refugio</Button>
      </div>

      <div className="text-right text-xl font-semibold text-cyan-300 relative z-10">
        Lúmenes de Voluntad: <span ref={lumenDisplayRef} className="inline-block">{lumenDisplayValue}</span> <span aria-label="Lúmenes de Voluntad" className="inline-block transform-gpu transition-transform duration-300 hover:scale-125">💡</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 overflow-y-auto flex-grow p-2 bg-slate-900/60 rounded-lg shadow-inner relative z-10 min-h-[400px]">
        {MIRROR_UPGRADES_CONFIG.map(upgradeDef => (
          <MirrorUpgradeItem
            key={upgradeDef.id}
            upgradeDef={upgradeDef}
            currentLevel={metaProgress.mirrorUpgrades[upgradeDef.id] || 0}
            willLumens={metaProgress.willLumens}
            onUpgrade={() => handleAttemptUpgrade(upgradeDef.id)}
          />
        ))}
      </div>
       <p className="text-xs text-slate-400 text-center mt-4 relative z-10">
        Las mejoras adquiridas aquí son permanentes y afectan el inicio de cada nueva partida.
      </p>
      {confirmUpgradeData && (
        <ConfirmMirrorUpgradeModal
          isOpen={!!confirmUpgradeData}
          upgradeName={confirmUpgradeData.upgradeDef.name}
          upgradeCost={confirmUpgradeData.nextLevelInfo.cost}
          onConfirm={() => handleConfirmModal(true)}
          onCancel={() => handleConfirmModal(false)}
        />
      )}
    </div>
  );
};

export default MirrorScreen;
