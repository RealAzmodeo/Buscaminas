
import React, { useCallback } from 'react';
import { useSandboxGame, DEFAULT_SANDBOX_CONFIG } from '../hooks/useSandboxGame';
import { SandboxConfig } from '../types';
import SandboxConfigPanel from '../components/sandbox/SandboxConfigPanel';
import SandboxSimulationView from '../components/sandbox/SandboxSimulationView';
import SandboxDebugControls from '../components/sandbox/SandboxDebugControls';
import SandboxDebugTools from '../components/sandbox/SandboxDebugTools';
import SandboxEventLog from '../components/sandbox/SandboxEventLog';
import Button from '../components/common/Button';

interface SandboxScreenProps {
  onExitSandbox: () => void;
}

const SandboxScreen: React.FC<SandboxScreenProps> = ({ onExitSandbox }) => {
  const game = useSandboxGame(DEFAULT_SANDBOX_CONFIG);
  const { config, setConfig, sandboxState, initializeSimulation, resetSimulation, ...gameActions } = game;
  
  const handleConfigChange = useCallback((newConfig: SandboxConfig) => {
    setConfig(newConfig);
  }, [setConfig]);

  const handleStartSimulation = useCallback(() => {
    initializeSimulation(config);
  }, [initializeSimulation, config]);

  return (
    <div className="p-2 sm:p-4 w-full max-w-full flex flex-col space-y-4 min-h-screen h-full">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-sky-400">Sandbox Test Ground</h1>
        <Button onClick={onExitSandbox} variant="secondary" size="sm">Exit Sandbox</Button>
      </div>

      <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-120px)]"> {/* Parent grid for 2 main sections */}
        {/* Column 1: Config Panel (takes 1/3 on lg screens) */}
        <div className="lg:col-span-1 bg-slate-800 p-4 rounded-lg shadow-lg overflow-y-auto">
          <SandboxConfigPanel 
            config={config} 
            onConfigChange={handleConfigChange}
            onStartSimulation={handleStartSimulation}
            isSimulationRunning={sandboxState.isSimulationRunning}
          />
        </div>

        {/* Column 2: Simulation Area (takes 2/3 on lg screens) */}
        <div className="lg:col-span-2 bg-slate-800 p-4 rounded-lg shadow-lg flex flex-col space-y-3 overflow-y-auto">
          {sandboxState.isSimulationRunning ? (
            <>
              {/* Simulation Controls at the top of this column */}
              <SandboxDebugControls
                isGodMode={sandboxState.isGodMode}
                isRevealAll={sandboxState.isRevealAll}
                onToggleGodMode={gameActions.toggleGodMode}
                onToggleRevealAll={gameActions.toggleRevealAll}
                onResetSimulation={resetSimulation}
              />

              {/* Simulation View (HeaderUI and Board) - give it some flex-grow if needed, or set fixed height for board */}
              <div className="flex-grow flex flex-col items-center justify-start">
                <SandboxSimulationView game={game} />
              </div>
              

              {/* Debug Tools and Event Log below the board */}
              <div className="mt-3 space-y-3"> {/* Add some top margin */}
                <SandboxDebugTools
                  onAdjustPlayerHp={gameActions.adjustPlayerHp}
                  onAdjustEnemyHp={gameActions.adjustEnemyHp}
                  onAddPlayerGold={gameActions.addPlayerGold}
                  onSetEnemyFury={gameActions.setEnemyFury}
                  maxEnemyFury={game.enemy.maxFury}
                  onAdjustEnemyArmor={gameActions.adjustEnemyArmor}
                />
                <SandboxEventLog events={sandboxState.eventLog} />
              </div>
            </>
          ) : (
            <div className="text-center p-10 text-slate-400 flex-grow flex flex-col items-center justify-center">
              <p>Configure parameters and click "Apply Config & Restart" to begin.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SandboxScreen;
