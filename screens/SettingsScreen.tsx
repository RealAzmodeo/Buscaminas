
import React from 'react';
import Button from '../components/common/Button';

interface SettingsScreenProps {
  onExitSettings: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onExitSettings }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 min-h-[60vh] w-full max-w-md">
      <div className="bg-slate-800 p-8 sm:p-10 rounded-xl shadow-2xl text-center w-full">
        <h2 className="text-3xl sm:text-4xl font-bold text-sky-400 mb-6">Ajustes</h2>
        <p className="text-slate-300 mb-8 text-base sm:text-lg">
          Esta sección está en construcción. ¡Vuelve pronto para más opciones!
        </p>
        <div className="mt-6 border-t border-slate-700 pt-6">
            {/* Future settings options can go here */}
            <p className="text-sm text-slate-400 italic">Ejemplos futuros: Volumen, Calidad de Animación, etc.</p>
        </div>
        <Button 
          onClick={onExitSettings} 
          variant="primary" 
          size="lg" 
          className="mt-10 w-full max-w-xs"
        >
          Volver al Menú Principal
        </Button>
      </div>
    </div>
  );
};

export default SettingsScreen;
