
import React from 'react';
import Button from '../common/Button';

interface SandboxDebugControlsProps {
  isGodMode: boolean;
  isRevealAll: boolean;
  onToggleGodMode: () => void;
  onToggleRevealAll: () => void;
  onResetSimulation: () => void;
}

const SandboxDebugControls: React.FC<SandboxDebugControlsProps> = ({
  isGodMode,
  isRevealAll,
  onToggleGodMode,
  onToggleRevealAll,
  onResetSimulation,
}) => {
  return (
    // Removed mb-4 from here, spacing should be handled by parent in SandboxScreen or SandboxSimulationView
    <div className="p-3 bg-slate-700 rounded-md shadow"> 
      <h3 className="text-lg font-medium text-slate-200 mb-2">Simulation Controls</h3>
      <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
        <Button onClick={onResetSimulation} variant="danger" size="sm" className="flex-1">
          Reset Simulation
        </Button>
        <Button onClick={onToggleRevealAll} variant={isRevealAll ? "secondary" : "primary"} size="sm" className="flex-1">
          {isRevealAll ? 'Hide All Cells' : 'Reveal All Cells'}
        </Button>
        <Button onClick={onToggleGodMode} variant={isGodMode ? "secondary" : "primary"} size="sm" className="flex-1">
          {isGodMode ? 'Disable God Mode' : 'Enable God Mode'}
        </Button>
      </div>
    </div>
  );
};

export default SandboxDebugControls;