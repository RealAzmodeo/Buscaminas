
import React, { useState, useMemo } from 'react';
import { MetaProgressState, Echo, FuryAbility, Rarity, GameStatus } from '../types';
import Button from '../components/common/Button';
import {
    ECO_TREE_STRUCTURE_DATA,
    ECO_UNLOCK_AWAKENING_POINTS,
    FURY_AWAKENING_THRESHOLD,
    // FURY_ABILITIES_TO_AWAKEN_SEQUENTIALLY, // Will be imported from core/furies
} from '../constants';
import { ALL_ECHOS_MAP, ALL_ECHOS_LIST } from '../core/echos'; // Updated import
import { ALL_FURY_ABILITIES_MAP, FURY_ABILITIES_TO_AWAKEN_SEQUENTIALLY } from '../core/furies'; // Updated import
import { playMidiSoundPlaceholder } from '../utils/soundUtils';
import { GoalTrackingService } from '../services/goalTrackingService'; // Import GoalTrackingService

// Re-using styles and components from the original SanctuaryScreen for the Eco Tree part
const getRarityStyles = (rarity: Rarity): { borderClass: string; nameColorClass: string; shadowClass?: string; } => {
  switch (rarity) {
    case Rarity.Common: return { borderClass: 'border-slate-600', nameColorClass: 'text-slate-300' };
    case Rarity.Rare: return { borderClass: 'border-sky-500', nameColorClass: 'text-sky-400', shadowClass: 'hover:shadow-sky-500/40' };
    case Rarity.Epic: return { borderClass: 'border-purple-500', nameColorClass: 'text-purple-400', shadowClass: 'hover:shadow-purple-500/40' };
    case Rarity.Legendary: return { borderClass: 'border-amber-500', nameColorClass: 'text-amber-400', shadowClass: 'hover:shadow-amber-500/50' };
    default: return { borderClass: 'border-slate-600', nameColorClass: 'text-slate-300' };
  }
};

interface EcoTreeNodeProps {
  nodeData: typeof ECO_TREE_STRUCTURE_DATA[0];
  fullEcho: Echo | undefined;
  isUnlocked: boolean;
  canUnlock: boolean;
  onSelect: () => void;
}

const EcoTreeNode: React.FC<EcoTreeNodeProps> = ({ nodeData, fullEcho, isUnlocked, canUnlock, onSelect }) => {
  if (!fullEcho) return <div className="p-3 border border-dashed border-slate-600 rounded-md text-slate-500">Eco no encontrado</div>;
  const rarityStyles = getRarityStyles(fullEcho.rarity);
  let baseClasses = `p-3 border-2 rounded-lg shadow-md transition-all duration-200 cursor-pointer flex flex-col text-left min-h-[120px] ${rarityStyles.borderClass}`;
  let statusText = "";

  if (isUnlocked) {
    baseClasses += ` bg-slate-600 opacity-70 filter grayscale-[30%]`;
    statusText = "Desbloqueado";
  } else if (canUnlock) {
    baseClasses += ` bg-slate-700 hover:bg-slate-650 ${rarityStyles.shadowClass || 'hover:shadow-md'}`;
  } else {
    baseClasses += ` bg-slate-800 opacity-50 cursor-not-allowed`;
    statusText = "Bloqueado";
  }

  return (
    <div className={baseClasses} onClick={canUnlock && !isUnlocked ? onSelect : undefined} role="button" tabIndex={canUnlock && !isUnlocked ? 0 : -1}
      aria-label={`${isUnlocked ? "Desbloqueado: " : (canUnlock ? "Desbloquear: " : "Bloqueado: ")} ${fullEcho.name}`}
    >
      <div className="flex justify-between items-start mb-1">
        <h4 className={`text-sm font-semibold ${rarityStyles.nameColorClass}`}>{fullEcho.name}</h4>
        <span className="text-xl">{fullEcho.icon}</span>
      </div>
      {!isUnlocked && <p className="text-xs text-yellow-400">Costo: {nodeData.cost} ✨</p>}
      {statusText && <p className="text-xs text-slate-400 mt-auto">{statusText}</p>}
    </div>
  );
};

interface EcoInfoPanelProps {
  selectedNodeData: typeof ECO_TREE_STRUCTURE_DATA[0] | null;
  fullEcho: Echo | undefined;
  isUnlocked: boolean;
  canAfford: boolean;
  prerequisitesMet: boolean;
  onUnlock: () => void;
  onClose: () => void;
}

const EcoInfoPanel: React.FC<EcoInfoPanelProps> = ({ selectedNodeData, fullEcho, isUnlocked, canAfford, prerequisitesMet, onUnlock, onClose }) => {
  if (!selectedNodeData || !fullEcho) return null;
  const descriptionHtml = { __html: fullEcho.description };
  const rarityStyles = getRarityStyles(fullEcho.rarity);
  const awakeningPoints = selectedNodeData.awakeningPoints ?? ECO_UNLOCK_AWAKENING_POINTS;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className={`bg-slate-800 p-6 rounded-xl shadow-2xl max-w-md w-full border-2 ${rarityStyles.borderClass}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-3">
          <h3 className={`text-2xl font-bold ${rarityStyles.nameColorClass}`}>{fullEcho.name}</h3>
          <span className="text-4xl">{fullEcho.icon}</span>
        </div>
        <p className="text-sm text-slate-300 mb-3" dangerouslySetInnerHTML={descriptionHtml}></p>
        <p className="text-xs text-slate-400 mb-1">Rareza: <span className={rarityStyles.nameColorClass}>{fullEcho.rarity}</span></p>
        <p className="text-xs text-slate-400 mb-1">Costo: <span className="text-yellow-400">{selectedNodeData.cost} Fragmentos de Alma ✨</span></p>
        <p className="text-xs text-slate-400 mb-3">Aporta: <span className="text-purple-400">{awakeningPoints} Puntos de Despertar de Furia</span></p>
        {!isUnlocked && selectedNodeData.prerequisites.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-slate-400">Prerrequisitos:</p>
            <ul className="list-disc list-inside text-xs text-slate-500">
              {selectedNodeData.prerequisites.map(prereqBaseId => {
                const prereqEco = ALL_ECHOS_LIST.find(e => e.baseId === prereqBaseId);
                return <li key={prereqBaseId}>{prereqEco?.name || prereqBaseId}</li>;
              })}
            </ul>
          </div>
        )}
        {isUnlocked ? (
          <p className="text-green-400 font-semibold">¡Ya Desbloqueado!</p>
        ) : !prerequisitesMet ? (
          <p className="text-red-400 font-semibold">Prerrequisitos no cumplidos.</p>
        ) : !canAfford ? (
          <p className="text-red-400 font-semibold">Fragmentos de Alma insuficientes.</p>
        ) : (
          <Button onClick={onUnlock} variant="primary" className="w-full">Desbloquear Eco</Button>
        )}
        <Button onClick={onClose} variant="secondary" className="w-full mt-2">Cerrar</Button>
      </div>
    </div>
  );
};

interface FuryAwakenedModalProps {
  fury: FuryAbility;
  onClose: () => void;
}
const FuryAwakenedModal: React.FC<FuryAwakenedModalProps> = ({ fury, onClose }) => (
  <div className="fixed inset-0 bg-red-900/50 backdrop-blur-md flex items-center justify-center z-[60] p-4" onClick={onClose}>
    <div className="bg-slate-800 p-6 rounded-xl shadow-2xl max-w-md w-full border-2 border-red-500 text-center" onClick={(e) => e.stopPropagation()}>
      <h2 className="text-3xl font-bold text-red-400 mb-3">¡Furia Despertada!</h2>
      <div className="text-5xl my-4">{fury.icon}</div>
      <h3 className="text-2xl font-semibold text-red-300 mb-2">{fury.name}</h3>
      <p className="text-sm text-slate-300 mb-4" dangerouslySetInnerHTML={{ __html: fury.description }}></p>
      <p className="text-xs text-slate-400 mb-4">Rareza: {fury.rarity}</p>
      <Button onClick={onClose} variant="danger" className="w-full">Entendido</Button>
    </div>
  </div>
);

interface SanctuaryHubProps {
  metaProgress: MetaProgressState;
  setMetaProgress: (updater: React.SetStateAction<MetaProgressState>) => void;
  onExitSanctuary: () => void;
  onNavigateToMirror: () => void;
  onNavigateToGoals: () => void;
  onNavigateToTree: () => void; // For future direct navigation or if tree becomes separate
}

const SanctuaryHub: React.FC<SanctuaryHubProps> = ({
  metaProgress,
  setMetaProgress,
  onExitSanctuary,
  onNavigateToMirror,
  onNavigateToGoals,
}) => {
  const [activeView, setActiveView] = useState<'hub' | 'tree'>('hub');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showFtue, setShowFtue] = useState(metaProgress.firstSanctuaryVisit);
  const [awakenedFuryModalContent, setAwakenedFuryModalContent] = useState<FuryAbility | null>(null);

  const hasClaimableGoals = useMemo(() => {
    return Object.values(metaProgress.goalsProgress).some(
      (goal) => goal.completed && !goal.claimed
    );
  }, [metaProgress.goalsProgress]);

  const handleNodeSelect = (nodeId: string) => setSelectedNodeId(nodeId);

  const handleUnlockEco = () => {
    if (!selectedNodeId) return;
    const nodeData = ECO_TREE_STRUCTURE_DATA.find(n => n.echoId === selectedNodeId);
    const fullEcho = ALL_ECHOS_MAP.get(selectedNodeId);
    if (!nodeData || !fullEcho || metaProgress.unlockedEchoBaseIds.includes(nodeData.baseId) || metaProgress.soulFragments < nodeData.cost) {
      playMidiSoundPlaceholder('unlock_fail_sanctuary');
      return;
    }
    const prerequisitesMet = nodeData.prerequisites.every(prereqBaseId => metaProgress.unlockedEchoBaseIds.includes(prereqBaseId));
    if (!prerequisitesMet) {
      playMidiSoundPlaceholder('unlock_fail_prereq_sanctuary');
      return;
    }
    playMidiSoundPlaceholder(`unlock_success_sanctuary_${fullEcho.id}`);
    const awakeningPointsYield = nodeData.awakeningPoints ?? ECO_UNLOCK_AWAKENING_POINTS;
    
    const wasFirstUnlock = metaProgress.unlockedEchoBaseIds.length === 0;

    setMetaProgress(prev => {
      const newProgress = prev.furyAwakeningProgress + awakeningPointsYield;
      let newAwakenedFuryIds = [...prev.awakenedFuryIds];
      let newNextFuryIndex = prev.nextFuryToAwakenIndex;
      let newFuryAwakeningActualProgress = newProgress;
      if (newProgress >= FURY_AWAKENING_THRESHOLD) {
        if (newNextFuryIndex < FURY_ABILITIES_TO_AWAKEN_SEQUENTIALLY.length) {
          const furyToAwakenId = FURY_ABILITIES_TO_AWAKEN_SEQUENTIALLY[newNextFuryIndex];
          const furyDetails = ALL_FURY_ABILITIES_MAP.get(furyToAwakenId);
          if (furyDetails && !newAwakenedFuryIds.includes(furyToAwakenId)) {
            newAwakenedFuryIds.push(furyToAwakenId);
            newNextFuryIndex++;
            newFuryAwakeningActualProgress = newProgress % FURY_AWAKENING_THRESHOLD;
            playMidiSoundPlaceholder(`fury_awakened_sanctuary_${furyDetails.id}`);
            setAwakenedFuryModalContent(furyDetails);
          }
        }
      }
      return {
        ...prev,
        soulFragments: prev.soulFragments - nodeData.cost,
        unlockedEchoBaseIds: [...prev.unlockedEchoBaseIds, nodeData.baseId],
        furyAwakeningProgress: newFuryAwakeningActualProgress,
        nextFuryToAwakenIndex: newNextFuryIndex,
        awakenedFuryIds: newAwakenedFuryIds,
      };
    });

    if (wasFirstUnlock) {
        // Pass current metaProgress directly for goal check, as setMetaProgress is async
        GoalTrackingService.processEvent('FIRST_ECO_UNLOCKED', null, metaProgress, setMetaProgress);
    }

    setSelectedNodeId(null);
  };

  const closeFtue = () => {
    setShowFtue(false);
    // Persist that FTUE has been seen by setting firstSanctuaryVisit to false if it was true
    if (metaProgress.firstSanctuaryVisit) {
        setMetaProgress(prev => ({...prev, firstSanctuaryVisit: false}));
    }
  };

  const tiers: Record<number, typeof ECO_TREE_STRUCTURE_DATA> = {};
  ECO_TREE_STRUCTURE_DATA.forEach(node => {
      if (!tiers[node.tier]) tiers[node.tier] = [];
      tiers[node.tier].push(node);
  });

  const selectedNodeFullData = selectedNodeId ? ECO_TREE_STRUCTURE_DATA.find(n => n.echoId === selectedNodeId) : null;
  const selectedFullEcho = selectedNodeId ? ALL_ECHOS_MAP.get(selectedNodeId) : undefined;
  const isSelectedUnlocked = selectedNodeFullData ? metaProgress.unlockedEchoBaseIds.includes(selectedNodeFullData.baseId) : false;
  const canAffordSelected = selectedNodeFullData ? metaProgress.soulFragments >= selectedNodeFullData.cost : false;
  const selectedPrerequisitesMet = selectedNodeFullData ? selectedNodeFullData.prerequisites.every(p => metaProgress.unlockedEchoBaseIds.includes(p)) : false;

  const renderHubView = () => (
    <div className="space-y-4 text-center">
        <Button onClick={() => setActiveView('tree')} variant="primary" size="lg" className="w-full max-w-md">
            Árbol del Conocimiento (Ecos)
        </Button>
        <Button onClick={onNavigateToMirror} variant="primary" size="lg" className="w-full max-w-md">
            El Espejo del Ser Interior
        </Button>
        <Button onClick={onNavigateToGoals} variant="primary" size="lg" className="w-full max-w-md relative">
            El Tablón de Hazañas
            {hasClaimableGoals && (
                <span className="absolute top-1 right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                </span>
            )}
        </Button>
    </div>
  );

  const renderTreeView = () => (
    <>
        <div className="flex justify-between items-center mb-3">
             <h2 className="text-2xl font-semibold text-green-400">Árbol del Conocimiento (Ecos)</h2>
             <Button onClick={() => setActiveView('hub')} variant="secondary" size="sm">Volver al Refugio</Button>
        </div>
        <div className="flex-grow space-y-4 p-4 bg-slate-800/70 rounded-lg overflow-y-auto max-h-[50vh]">
            {Object.entries(tiers).sort(([a],[b]) => Number(a) - Number(b)).map(([tier, nodes]) => (
            <div key={`tier-${tier}`}>
                <h3 className="text-lg font-medium text-slate-300 mb-2 ml-1">Nivel de Raíz {Number(tier) + 1}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {nodes.map(nodeData => {
                    const fullEcho = ALL_ECHOS_MAP.get(nodeData.echoId);
                    const isUnlocked = metaProgress.unlockedEchoBaseIds.includes(nodeData.baseId);
                    const prerequisitesMet = nodeData.prerequisites.every(p => metaProgress.unlockedEchoBaseIds.includes(p));
                    const canUnlock = prerequisitesMet && metaProgress.soulFragments >= nodeData.cost;
                    return (
                    <EcoTreeNode
                        key={nodeData.echoId}
                        nodeData={nodeData}
                        fullEcho={fullEcho}
                        isUnlocked={isUnlocked}
                        canUnlock={canUnlock}
                        onSelect={() => handleNodeSelect(nodeData.echoId)}
                    />
                    );
                })}
                </div>
            </div>
            ))}
        </div>
        <div className="mt-4 p-4 bg-red-900/30 rounded-lg">
            <h2 className="text-xl font-semibold text-red-300 mb-2">Raíces Sombrías (Despertar de Furia)</h2>
            <div className="w-full bg-slate-700 rounded-full h-6 border border-red-700 overflow-hidden">
            <div
                className="bg-red-500 h-full rounded-full transition-all duration-500 ease-out flex items-center justify-center text-sm font-medium text-white"
                style={{ width: `${Math.min(100, (metaProgress.furyAwakeningProgress / FURY_AWAKENING_THRESHOLD) * 100)}%` }}
            >
                {metaProgress.furyAwakeningProgress} / {FURY_AWAKENING_THRESHOLD}
            </div>
            </div>
            <p className="text-xs text-red-200 mt-1 text-center">Al llenarse, una nueva Furia se unirá a tus pesadillas.</p>
        </div>
    </>
  );


  return (
    <div className="p-4 sm:p-6 w-full flex flex-col space-y-6 min-h-[85vh] bg-slate-900/50 rounded-xl">
      {showFtue && (
        <div className="ftue-guiding-text-overlay" style={{zIndex: 70}}> {/* Ensure FTUE is above other hub elements */}
          <p>Bienvenido al <strong>Refugio del Alma</strong>. Aquí puedes fortalecerte permanentemente.<br/> Visita el <strong>Árbol del Conocimiento</strong> para Ecos, el <strong>Espejo</strong> para mejoras o el <strong>Tablón</strong> para hazañas.</p>
          <button onClick={closeFtue} className="mt-3 px-4 py-2 bg-sky-600 text-white rounded-md text-sm">Entendido</button>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-sky-300">
            {activeView === 'hub' ? "Refugio del Alma" : "Santuario del Árbol"}
        </h1>
        <Button onClick={onExitSanctuary} variant="secondary">Volver al Menú</Button>
      </div>

      <div className="text-right text-xl font-semibold">
        <span className="text-yellow-300">Fragmentos de Alma: {metaProgress.soulFragments} ✨</span>
        <span className="text-cyan-300 ml-4">Lúmenes de Voluntad: {metaProgress.willLumens} 💡</span>
      </div>

      {activeView === 'hub' ? renderHubView() : renderTreeView()}

      {selectedNodeId && selectedFullEcho && selectedNodeFullData && activeView === 'tree' && (
        <EcoInfoPanel
          selectedNodeData={selectedNodeFullData}
          fullEcho={selectedFullEcho}
          isUnlocked={isSelectedUnlocked}
          canAfford={canAffordSelected}
          prerequisitesMet={selectedPrerequisitesMet}
          onUnlock={handleUnlockEco}
          onClose={() => setSelectedNodeId(null)}
        />
      )}
      {awakenedFuryModalContent && (
        <FuryAwakenedModal
            fury={awakenedFuryModalContent}
            onClose={() => setAwakenedFuryModalContent(null)}
        />
      )}
    </div>
  );
};

export default SanctuaryHub;
