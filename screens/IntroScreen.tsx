
import React, { useEffect } from 'react';
import Button from '../components/common/Button';
import { playMidiSoundPlaceholder } from '../utils/soundUtils';

interface IntroScreenProps {
  onStartPrologue: () => void;
}

const introScreenStyles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fadeIn {
    animation: fadeIn 0.8s ease-out forwards;
  }
`;

const IntroScreen: React.FC<IntroScreenProps> = ({ onStartPrologue }) => {
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = introScreenStyles;
    document.head.appendChild(styleElement);

    return () => {
      // Robust cleanup: Check if the element is still a child before removing
      if (document.head.contains(styleElement)) {
        document.head.removeChild(styleElement);
      }
    };
  }, []);

  const handleStartClick = () => {
    playMidiSoundPlaceholder('ui_button_click_start_prologue');
    onStartPrologue();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center animate-fadeIn">
      <div className="bg-slate-800/80 backdrop-blur-sm p-6 sm:p-10 rounded-xl shadow-2xl max-w-2xl w-full border border-purple-700/50">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-sky-300 mb-4 drop-shadow-[0_2px_4px_rgba(14,165,233,0.6)]">
          Bienvenido a Numeria's Edge
        </h1>
        <p className="text-lg sm:text-xl text-slate-300 mb-6 italic">
          Donde los números ocultan tanto peligro como oportunidad.
        </p>

        <div className="text-left space-y-3 text-sm sm:text-base text-slate-200 mb-8 leading-relaxed">
          <p>
            Te adentras en un abismo de casillas misteriosas. Tu supervivencia depende de tu astucia y un poco de suerte. Cada casilla que reveles puede ser una bendición o una maldición.
          </p>
          <p>
            Busca <strong>PISTAS</strong>: números que te dirán cuántos objetos valiosos (💰 Oro) o peligrosos (💥 Ataque) hay en las casillas adyacentes.
          </p>
          <p>
            El <strong>ORO</strong> te permitirá adquirir <strong>ECOS</strong>, artefactos arcanos que otorgan poderes pasivos y habilidades únicas para ayudarte en tu descenso.
          </p>
          <p>
            Las casillas de <strong>ATAQUE</strong> son de doble filo: si tú las revelas, dañarás a tu enemigo. Pero si el enemigo las descubre primero, ¡el daño será para ti!
          </p>
          <p>
            Cada adversario acumula <strong>FURIA</strong> con el tiempo, desatando devastadores ataques especiales. Prepárate para enfrentarlos.
          </p>
          <p className="mt-4 font-semibold text-sky-200">
            Tu aventura comienza ahora. ¿Podrás dominar los números y conquistar el abismo?
          </p>
        </div>

        <Button 
          onClick={handleStartClick} 
          variant="primary" 
          size="lg" 
          className="w-full max-w-xs py-3 text-lg shadow-purple-500/30 hover:shadow-purple-500/50"
          aria-label="Comenzar el descenso al prólogo del juego"
        >
          Comenzar el Descenso (Prólogo)
        </Button>
      </div>
    </div>
  );
};

export default IntroScreen;