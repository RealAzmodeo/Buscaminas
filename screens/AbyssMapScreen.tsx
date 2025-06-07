
import React, { useState } from 'react';
import { useGameEngine } from '../hooks/useGameEngine';
import { RunMapNode, BiomeId, MapRewardType, MapEncounterType } from '../types';
// import Button from '../components/common/Button'; // Not directly used for path selection, MapNodeComponent handles it.
import { BIOME_DEFINITIONS, REWARD_ICONS, REWARD_DESCRIPTIONS, ENCOUNTER_ICONS, ENCOUNTER_DESCRIPTIONS } from '../constants/biomeConstants';
import Tooltip from '../components/common/Tooltip';

interface MapNodeComponentProps {
  node: RunMapNode;
  onClick: () => void;
  isCurrent: boolean;
  isSelectable: boolean;
}

const MapNodeComponent: React.FC<MapNodeComponentProps> = ({ node, onClick, isCurrent, isSelectable }) => {
  const biomeInfo = BIOME_DEFINITIONS[node.biomeId] || BIOME_DEFINITIONS[BiomeId.Default];
  const rewardIcon = node.rewardType !== MapRewardType.None ? REWARD_ICONS[node.rewardType] : '';
  const rewardDescription = REWARD_DESCRIPTIONS[node.rewardType];
  const encounterIcon = ENCOUNTER_ICONS[node.encounterType] || ENCOUNTER_ICONS[MapEncounterType.Standard];
  const encounterDescription = ENCOUNTER_DESCRIPTIONS[node.encounterType] || ENCOUNTER_DESCRIPTIONS[MapEncounterType.Standard];


  let baseClasses = "p-3 sm:p-4 rounded-lg shadow-lg text-center transition-all duration-200 ease-in-out border-2 min-w-[160px] sm:min-w-[180px] min-h-[120px] sm:min-h-[140px] flex flex-col items-center justify-center relative";
  
  if (isCurrent) {
    baseClasses += ` ${biomeInfo.nodeColorClass} bg-opacity-50 ring-4 ring-offset-2 ring-offset-slate-900 ring-yellow-400 scale-105`;
  } else if (isSelectable) {
    baseClasses += ` ${biomeInfo.nodeColorClass} hover:scale-105 hover:shadow-xl cursor-pointer bg-slate-700 hover:bg-slate-600`;
  } else { // Future completed, non-current nodes
    baseClasses += ` ${biomeInfo.nodeColorClass} bg-slate-800 opacity-50 filter grayscale`;
  }

  const tooltipContent = (
    <div className="text-sm max-w-xs">
      <strong className="block text-sky-300 text-base">{biomeInfo.name}</strong>
      <p className="text-xs text-slate-400 mb-1">{biomeInfo.description}</p>
      <hr className="my-1 border-slate-600" />
      <strong className="block text-amber-300">Encuentro: {encounterDescription}</strong>
      {node.rewardType !== MapRewardType.None && (
        <>
        <hr className="my-1 border-slate-600" />
        <strong className="block text-yellow-300">Recompensa: {rewardDescription}</strong>
        </>
      )}
      {node.isCompleted && <p className="text-xs text-green-400 mt-1">(Completado)</p>}
    </div>
  );

  return (
    <Tooltip content={tooltipContent} position="top">
      <div
        className={baseClasses}
        onClick={isSelectable ? onClick : undefined}
        role={isSelectable ? "button" : "img"}
        tabIndex={isSelectable ? 0 : -1}
        aria-label={`Camino hacia: ${biomeInfo.name}. ${encounterDescription}. ${node.rewardType !== MapRewardType.None ? `Recompensa: ${rewardDescription}.` : ''} ${isCurrent ? 'Ubicación actual.' : (node.isCompleted ? 'Completado.' : '')}`}
      >
        <div className="absolute top-1 left-1 text-xl sm:text-2xl bg-slate-800/70 p-1 rounded-full shadow" aria-hidden="true">{encounterIcon}</div>
        <span className="text-3xl sm:text-4xl my-1" aria-hidden="true">{biomeInfo.icon}</span>
        <p className="text-xs sm:text-sm font-semibold text-slate-200 mt-1">{biomeInfo.name}</p>
        {rewardIcon && <span className="text-2xl sm:text-3xl mt-1" aria-hidden="true">{rewardIcon}</span>}
         {isCurrent && <div className="absolute -bottom-2 -right-2 text-xs bg-yellow-500 text-black px-1.5 py-0.5 rounded-md shadow-md font-bold">AQUÍ</div>}
      </div>
    </Tooltip>
  );
};


const AbyssMapScreen: React.FC<{ gameEngine: ReturnType<typeof useGameEngine> }> = ({ gameEngine }) => {
  const { gameState, selectMapPathAndStartStretch } = gameEngine;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null); // For potential visual feedback before transition

  console.log("[AbyssMapScreen] Rendering. Current Run Map in gameState:", gameState.currentRunMap); // LOGGING

  if (!gameState.currentRunMap) {
    return <div className="text-center p-10 text-slate-400">Cargando el Mapa del Abismo...</div>;
  }

  const { nodes, currentNodeId } = gameState.currentRunMap;
  const currentNode = nodes[currentNodeId];
  const choiceNodes = currentNode?.childrenNodeIds.map(id => nodes[id]).filter(Boolean) || [];

  const handleSelectPath = (nodeId: string) => {
    setSelectedPathId(nodeId); 
    selectMapPathAndStartStretch(nodeId);
  };

  // Simple line drawing placeholder
  const Line: React.FC<{x1: number, y1: number, x2: number, y2: number, isDimmed?: boolean}> = ({x1,y1,x2,y2, isDimmed}) => (
    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{overflow: 'visible'}}>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={isDimmed? "rgba(71, 85, 105, 0.5)" : "rgba(125, 211, 252, 0.7)"} strokeWidth="3" strokeDasharray={isDimmed ? "4 4" : "none"} />
    </svg>
  );

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full min-h-[80vh] bg-slate-800/30 rounded-xl">
      <h1 className="text-3xl sm:text-4xl font-bold text-sky-300 mb-2">El Mapa del Abismo</h1>
      <p className="text-slate-400 mb-6 text-center max-w-xl">Has completado un tramo de tu viaje. Elige tu próximo camino sabiamente. El Abismo es profundo y sus senderos, inciertos.</p>

      <div className="relative w-full flex flex-col items-center space-y-12">
        {currentNode && (
          <div className="mb-0 text-center z-10"> {/* Reduced margin bottom */}
            {/* <p className="text-lg text-slate-200 mb-2">Ubicación Actual:</p> */}
            <MapNodeComponent node={currentNode} onClick={() => {}} isCurrent={true} isSelectable={false} />
          </div>
        )}

        {choiceNodes.length > 0 && (
          <div className="w-full flex justify-center z-10">
            <div className="flex flex-row flex-wrap justify-center items-start gap-6 sm:gap-8">
              {choiceNodes.map((choiceNode, index) => (
                <MapNodeComponent
                  key={choiceNode.id}
                  node={choiceNode}
                  onClick={() => handleSelectPath(choiceNode.id)}
                  isCurrent={false}
                  isSelectable={true}
                />
              ))}
            </div>
          </div>
        )}
      </div>


      {/* Placeholder for line drawing if we had positions (conceptual) */}
      {/* {currentNode && choiceNodes.length > 0 && (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
          {choiceNodes.map((choice, idx) => {
            // These positions are completely arbitrary placeholders
            const currentX = 50; // %
            const currentY = 25; // % (approx for current node)
            const choiceX = 30 + (idx * 20); // %
            const choiceY = 65; // % (approx for choice nodes)
            return <Line key={`line-${idx}`} x1={`${currentX}%`} y1={`${currentY}%`} x2={`${choiceX}%`} y2={`${choiceY}%`} />;
          })}
        </div>
      )} */}


      {choiceNodes.length === 0 && gameState.currentRunMap && currentNode?.layer === gameState.currentRunMap.mapDepth -1 && (
         <p className="text-xl text-amber-400 mt-8 text-center">Has llegado al final de este mapa. El desafío final de este Abismo te espera...</p>
      )}
    </div>
  );
};

export default AbyssMapScreen;
