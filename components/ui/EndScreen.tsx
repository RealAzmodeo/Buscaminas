

import React, { useEffect, useState } from 'react';
import Button from '../common/Button';
import { RunStats, MetaProgressState, GameStateCore } from '../../types'; 
import { playMidiSoundPlaceholder } from '../../utils/soundUtils';

interface EndScreenProps {
  message: string;
  level: number; 
  gold: number;
  runStats: RunStats; 
  metaProgress: MetaProgressState;
  defeatReason?: GameStateCore['defeatReason']; // Added defeatReason
  onNavigateToMainMenu: () => void;
}

const EndScreen: React.FC<EndScreenProps> = ({ message, level, gold, runStats, metaProgress, defeatReason, onNavigateToMainMenu }) => {
  const isDefeat = message.toLowerCase().includes("defeat") || message.toLowerCase().includes("derrota") || defeatReason === 'attrition';
  const [bannerState, setBannerState] = useState<'hidden' | 'visible' | 'hiding'>('hidden');

  useEffect(() => {
    let appearTimeout: number | undefined;
    let disappearTimeout: number | undefined;
    let removeTimeout: number | undefined;

    if (runStats.newlyCompletedGoalIdsThisRun && runStats.newlyCompletedGoalIdsThisRun.length > 0 && bannerState === 'hidden') {
      appearTimeout = window.setTimeout(() => {
        setBannerState('visible');
        playMidiSoundPlaceholder('goal_banner_appear');
        disappearTimeout = window.setTimeout(() => {
          setBannerState('hiding');
          playMidiSoundPlaceholder('goal_banner_disappear');
          removeTimeout = window.setTimeout(() => {
            // Set to hidden only if it's still in 'hiding' state,
            // to allow potential re-trigger if runStats change again for a new EndScreen instance.
            setBannerState(current => current === 'hiding' ? 'hidden' : current);
          }, 500); // Animation duration
        }, 7000); // Banner visible for 7 seconds
      }, 500); // Appear after 0.5 seconds
    }

    return () => {
      clearTimeout(appearTimeout);
      clearTimeout(disappearTimeout);
      clearTimeout(removeTimeout);
    };
  }, [runStats.newlyCompletedGoalIdsThisRun, bannerState]);

  const bannerClasses = `goal-notification-banner ${
    bannerState === 'visible' ? 'slide-in' : bannerState === 'hiding' ? 'slide-out' : ''
  }`;

  let finalMessage = message;
  if (defeatReason === 'attrition') {
    finalMessage = "El Abismo te consume. No queda esperanza.";
  }


  return (
    <div className="text-center p-6 sm:p-8 bg-slate-800 rounded-xl shadow-2xl max-w-lg mx-auto relative">
      <h2 className={`text-3xl sm:text-4xl font-bold mb-6 ${isDefeat ? 'text-red-500' : 'text-green-500'}`}>
        {finalMessage}
      </h2>
      <div className="text-sm sm:text-base space-y-1.5 mb-6 text-slate-300 text-left">
        <p>Nivel Alcanzado: <span className="font-semibold text-sky-400 float-right">{level}</span></p>
        <p>Oro final: <span className="font-semibold text-yellow-400 float-right">💰{gold}</span></p>
        <hr className="my-2 border-slate-700"/>
        <h4 className="text-md font-semibold text-slate-200 mt-3 mb-1">Estadísticas de la Partida:</h4>
        <p>Enemigos Derrotados: <span className="font-semibold text-sky-400 float-right">{runStats.enemiesDefeatedThisRun}</span></p>
        <p>Ataques del Enemigo Detonados: <span className="font-semibold text-red-400 float-right">{runStats.attacksTriggeredByEnemy}</span></p>
        <p>Trampas Activadas: <span className="font-semibold text-indigo-400 float-right">{runStats.trapsTriggeredThisRun}</span></p>
        <p>Ataques Propios Realizados: <span className="font-semibold text-sky-300 float-right">{runStats.attacksTriggeredByPlayer}</span></p>
        <p>Casillas de Oro Reveladas: <span className="font-semibold text-yellow-300 float-right">{runStats.goldCellsRevealedThisRun}</span></p>
        <p>Ecos (no gratuitos) Adquiridos: <span className="font-semibold text-purple-400 float-right">{runStats.nonFreeEcosAcquiredThisRun}</span></p>
        <p>Total de Clics en Tablero: <span className="font-semibold text-slate-400 float-right">{runStats.clicksOnBoardThisRun}</span></p>
        <hr className="my-2 border-slate-700"/>
        <p>Fragmentos de Alma Obtenidos (Esta Partida): <span className="font-semibold text-purple-300 float-right">{runStats.soulFragmentsEarnedThisRun} ✨</span></p>
        <p>Total Fragmentos de Alma: <span className="font-semibold text-purple-400 float-right">{metaProgress.soulFragments} ✨</span></p>
      </div>
      <Button onClick={onNavigateToMainMenu} variant="primary" size="lg" className="w-full sm:w-auto">
        Volver al Menú Principal
      </Button>

      {bannerState !== 'hidden' && (
        <div className={bannerClasses} aria-live="assertive">
          ¡Nuevas Hazañas Completadas! Visita el Tablón en el Refugio para reclamar tus recompensas. 🏆
        </div>
      )}
    </div>
  );
};

export default EndScreen;
