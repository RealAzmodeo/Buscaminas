
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MetaProgressState, GoalDefinition, GoalProgress } from '../../../types';
import Button from '../../common/Button';
import { INITIAL_GOALS_CONFIG, GOAL_IDS, GOAL_CATEGORIES } from '../../../constants/metaProgressionConstants';
import { playMidiSoundPlaceholder } from '../../../utils/soundUtils';
import GoalItem from './GoalItem';

interface GoalsScreenProps {
  metaProgress: MetaProgressState;
  setMetaProgress: (updater: React.SetStateAction<MetaProgressState>) => void;
  onExit: () => void;
}

type GoalStatusFilter = 'all' | 'inProgress' | 'claimable' | 'completed';
type GoalCategoryFilter = 'all' | typeof GOAL_CATEGORIES[keyof typeof GOAL_CATEGORIES];


const GoalsScreen: React.FC<GoalsScreenProps> = ({ metaProgress, setMetaProgress, onExit }) => {
  const [activeStatusFilter, setActiveStatusFilter] = useState<GoalStatusFilter>('all');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<GoalCategoryFilter>('all');
  const [lumenDisplayValue, setLumenDisplayValue] = useState(metaProgress.willLumens);
  const lumenDisplayRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (lumenDisplayValue !== metaProgress.willLumens) {
      if (lumenDisplayRef.current) {
        lumenDisplayRef.current.classList.remove('animate-lumen-change'); // Remove first to re-trigger if value changes back quickly
        void lumenDisplayRef.current.offsetWidth; // Trigger reflow
        lumenDisplayRef.current.classList.add('animate-lumen-change');
        setTimeout(() => {
          lumenDisplayRef.current?.classList.remove('animate-lumen-change');
        }, 600); // Match animation duration
      }
      setLumenDisplayValue(metaProgress.willLumens);
      playMidiSoundPlaceholder('goal_lumen_counter_change');
    }
  }, [metaProgress.willLumens, lumenDisplayValue]);


  const handleClaimReward = (goalId: string) => {
    const goalDef = INITIAL_GOALS_CONFIG.find(g => g.id === goalId);
    const goalProgress = metaProgress.goalsProgress[goalId];

    if (!goalDef || !goalProgress || !goalProgress.completed || goalProgress.claimed) {
      playMidiSoundPlaceholder('goal_claim_fail');
      return;
    }

    // Sound played in GoalItem for more immediate feedback
    setMetaProgress(prev => ({
      ...prev,
      willLumens: prev.willLumens + goalDef.rewardLumens,
      goalsProgress: {
        ...prev.goalsProgress,
        [goalId]: { ...goalProgress, claimed: true },
      },
    }));
  };

  const processedGoals = useMemo(() => {
    return INITIAL_GOALS_CONFIG.map(goalDef => {
      const progress = metaProgress.goalsProgress[goalDef.id] || { currentValue: 0, completed: false, claimed: false };
      let prerequisitesMet = true;
      let unmetPrerequisiteNames: string[] = [];

      if (goalDef.prerequisitesGoalIds && goalDef.prerequisitesGoalIds.length > 0) {
        for (const prereqId of goalDef.prerequisitesGoalIds) {
          const prereqProgress = metaProgress.goalsProgress[prereqId];
          if (!prereqProgress || !prereqProgress.completed) {
            prerequisitesMet = false;
            const prereqDef = INITIAL_GOALS_CONFIG.find(g => g.id === prereqId);
            if (prereqDef) unmetPrerequisiteNames.push(prereqDef.name);
            else unmetPrerequisiteNames.push(prereqId);
          }
        }
      }
      return { ...goalDef, progress, prerequisitesMet, unmetPrerequisiteNames };
    });
  }, [metaProgress.goalsProgress]);


  const filteredAndSortedGoals = useMemo(() => {
    return processedGoals.filter(goal => {
      if (activeCategoryFilter !== 'all' && goal.category !== activeCategoryFilter) {
        return false;
      }
      switch (activeStatusFilter) {
        case 'inProgress':
          return !goal.progress.completed && goal.prerequisitesMet;
        case 'claimable':
          return goal.progress.completed && !goal.progress.claimed && goal.prerequisitesMet;
        case 'completed':
          return goal.progress.claimed && goal.prerequisitesMet;
        case 'all':
        default:
          return true;
      }
    }).sort((a, b) => {
      const isLockedA = !a.prerequisitesMet;
      const isLockedB = !b.prerequisitesMet;

      const isClaimableA = a.prerequisitesMet && a.progress.completed && !a.progress.claimed;
      const isClaimableB = b.prerequisitesMet && b.progress.completed && !b.progress.claimed;

      const isInProgressA = a.prerequisitesMet && !a.progress.completed;
      const isInProgressB = b.prerequisitesMet && !b.progress.completed;
      
      const isCompletedAndClaimedA = a.prerequisitesMet && a.progress.completed && a.progress.claimed;
      const isCompletedAndClaimedB = b.prerequisitesMet && b.progress.completed && b.progress.claimed;

      if (isLockedA && !isLockedB) return 1;
      if (!isLockedA && isLockedB) return -1;
      if (isLockedA && isLockedB) return a.name.localeCompare(b.name);


      if (isClaimableA && !isClaimableB) return -1;
      if (!isClaimableA && isClaimableB) return 1;

      if (isInProgressA && !isInProgressB) return -1;
      if (!isInProgressA && isInProgressB) return 1;
      
      if (isCompletedAndClaimedA && !isCompletedAndClaimedB) return -1;
      if (!isCompletedAndClaimedA && isCompletedAndClaimedB) return 1;


      return a.name.localeCompare(b.name);
    });
  }, [processedGoals, activeStatusFilter, activeCategoryFilter]);


  const StatusFilterButton: React.FC<{filter: GoalStatusFilter, label: string}> = ({filter, label}) => (
    <Button
        onClick={() => setActiveStatusFilter(filter)}
        variant={activeStatusFilter === filter ? 'primary' : 'secondary'}
        size="sm"
    >
        {label}
    </Button>
  );
  
  const CategoryFilterButton: React.FC<{filter: GoalCategoryFilter, label: string}> = ({filter, label}) => (
    <Button
        onClick={() => setActiveCategoryFilter(filter)}
        variant={activeCategoryFilter === filter ? 'primary' : 'secondary'}
        size="sm"
        className="capitalize"
    >
        {label}
    </Button>
  );
  
  const availableCategories = useMemo(() => {
    const categories = new Set<string>(INITIAL_GOALS_CONFIG.map(g => g.category));
    return ['all', ...Array.from(categories).sort()];
  }, []);


  return (
    <div className="p-4 sm:p-6 w-full flex flex-col space-y-6 min-h-[85vh] bg-stone-800 rounded-xl shadow-2xl border border-amber-700/30 backdrop-brightness-90">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-amber-300 drop-shadow-[0_2px_3px_rgba(120,53,15,0.7)]">El Tablón de Hazañas</h1>
        <Button onClick={onExit} variant="secondary">Volver al Refugio</Button>
      </div>

      <div className="text-right text-xl font-semibold text-cyan-300">
        Lúmenes de Voluntad: <span ref={lumenDisplayRef} className="inline-block">{lumenDisplayValue}</span> <span aria-label="Lúmenes de Voluntad" className="inline-block transform-gpu transition-transform duration-300 hover:scale-125">💡</span>
      </div>

      <div className="space-y-3 bg-stone-900/50 p-3 rounded-md shadow">
        <div className="flex flex-wrap gap-2 pb-2 border-b border-stone-700/50">
            <span className="text-sm font-medium text-slate-300 self-center mr-2">Categoría:</span>
            {availableCategories.map(cat => (
                <CategoryFilterButton 
                    key={cat} 
                    filter={cat as GoalCategoryFilter}
                    label={cat === 'all' ? "Todas" : cat} 
                />
            ))}
        </div>
        <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-slate-300 self-center mr-2">Estado:</span>
            <StatusFilterButton filter="all" label="Todos" />
            <StatusFilterButton filter="claimable" label="Reclamables" />
            <StatusFilterButton filter="inProgress" label="En Progreso" />
            <StatusFilterButton filter="completed" label="Completados" />
        </div>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 overflow-y-auto flex-grow p-2 bg-stone-900/40 rounded-lg shadow-inner min-h-[300px]">
        {filteredAndSortedGoals.length > 0 ? filteredAndSortedGoals.map(goal => (
          <GoalItem
            key={goal.id}
            goalDef={goal}
            goalProgress={goal.progress}
            onClaimReward={() => handleClaimReward(goal.id)}
            prerequisitesMet={goal.prerequisitesMet}
            prerequisiteNames={goal.unmetPrerequisiteNames}
          />
        )) : (
            <p className="col-span-full text-center text-slate-400 py-8">No hay hazañas que mostrar para esta combinación de filtros.</p>
        )}
      </div>
        <p className="text-xs text-slate-400 text-center mt-4">
            Completa hazañas para ganar Lúmenes de Voluntad y fortalecerte en El Espejo del Ser Interior.
        </p>
    </div>
  );
};

export default GoalsScreen;