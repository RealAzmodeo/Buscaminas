
import React from 'react';
import Button from '../components/common/Button';

interface MainMenuScreenProps {
  onStartNewRun: () => void;
  onContinueRun: () => void;
  onNavigateToSanctuary: () => void;
  onNavigateToSandbox: () => void;
  onNavigateToSettings: () => void;
}

const MainMenuScreen: React.FC<MainMenuScreenProps> = ({
  onStartNewRun,
  onContinueRun,
  onNavigateToSanctuary,
  onNavigateToSandbox,
  onNavigateToSettings
}) => {

  const handleContinue = () => {
    onStartNewRun(); // For now, continue starts a new run with prologue
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 min-h-[60vh]">
      <div className="bg-slate-800 p-10 rounded-xl shadow-2xl text-center">
        <h2 className="text-5xl font-extrabold text-sky-400 mb-4">Numeria's Edge</h2>
        <p className="text-slate-300 mb-10 text-lg">Descubre secretos. Enfréntate a enemigos. Asciende con Furia.</p>
        <div className="space-y-4 flex flex-col items-center">
          <Button onClick={onStartNewRun} variant="primary" size="lg" className="px-12 py-4 text-xl w-full max-w-xs">
            Comenzar Nueva Partida (Prólogo)
          </Button>
          <Button onClick={onNavigateToSanctuary} variant="secondary" size="md" className="px-8 py-3 text-lg w-full max-w-xs">
            Refugio del Alma
          </Button>
          <Button onClick={onNavigateToSandbox} variant="secondary" size="md" className="px-8 py-3 text-lg w-full max-w-xs">
            Sandbox Test Ground
          </Button>
          <Button onClick={onNavigateToSettings} variant="secondary" size="md" className="px-8 py-3 text-lg w-full max-w-xs">
            Ajustes
          </Button>
        </div>
        <div className="mt-8 text-xs text-slate-500">
            <p>Version Lucien 0.6 - Espejo y Hazañas</p>
        </div>
      </div>
    </div>
  );
};

export default MainMenuScreen;
