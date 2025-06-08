import { useState, useCallback, useMemo } from 'react';
import { MetaProgressState } from '../types';

export type FTUEGuideKey =
  | 'FTUE_SECOND_RUN_INTRO'
  | 'FTUE_GOLD_REVEALED'
  | 'FTUE_ECHO_SCREEN_INTRO';

export const FTUE_GUIDE_TEXTS: Record<FTUEGuideKey, string> = {
  FTUE_SECOND_RUN_INTRO: "Has sobrevivido. Pero para prosperar, necesitarás poder. Busca el ORO (💰).",
  FTUE_GOLD_REVEALED: "¡ORO! Acumúlalo. Es la llave para obtener Ecos, poderes que alterarán las reglas del duelo.",
  FTUE_ECHO_SCREEN_INTRO: "Estos son los ECOS. Elige uno para potenciarte. La curación es gratuita, pero a veces el poder tiene un precio.",
};

// Define which milestone each guide is primarily associated with for showing conditions
const GUIDE_TO_MILESTONE_MAP: Partial<Record<FTUEGuideKey, keyof MetaProgressState>> = {
  FTUE_SECOND_RUN_INTRO: 'hasSeenGoldAndEchoes',
  FTUE_GOLD_REVEALED: 'hasSeenGoldAndEchoes',
  FTUE_ECHO_SCREEN_INTRO: 'hasSeenGoldAndEchoes',
};

export const useFTUEManager = () => {
  const [activeGuideKey, setActiveGuideKey] = useState<FTUEGuideKey | null>(null);
  const [shownGuidesThisSession, setShownGuidesThisSession] = useState<Set<FTUEGuideKey>>(new Set());

  const currentGuide = useMemo(() => {
    if (!activeGuideKey) return null;
    return {
      key: activeGuideKey,
      text: FTUE_GUIDE_TEXTS[activeGuideKey],
    };
  }, [activeGuideKey]);

  const showGuide = useCallback((guideKey: FTUEGuideKey, metaProgress: MetaProgressState) => {
    if (activeGuideKey) return; // Don't show if another guide is already active

    const associatedMilestone = GUIDE_TO_MILESTONE_MAP[guideKey];

    // Condition: FTUE part 1 done, associated milestone not yet seen, and guide not shown this session
    if (
      metaProgress.hasCompletedFirstRun === true &&
      (!associatedMilestone || metaProgress[associatedMilestone] === false) &&
      !shownGuidesThisSession.has(guideKey)
    ) {
      setActiveGuideKey(guideKey);
      setShownGuidesThisSession(prev => new Set(prev).add(guideKey));
    }
  }, [activeGuideKey, shownGuidesThisSession]);

  const dismissGuide = useCallback(() => {
    setActiveGuideKey(null);
  }, []);

  const markMilestoneComplete = useCallback(
    (milestoneKey: 'hasSeenGoldAndEchoes', setAndSaveMetaProgress: (updater: (prevMeta: MetaProgressState) => MetaProgressState) => void) => {
      setAndSaveMetaProgress(prev => {
        if (prev[milestoneKey] === false) {
          return { ...prev, [milestoneKey]: true };
        }
        return prev;
      });
    },
    []
  );

  // Function to reset session-specific guide tracking, e.g., on new run start
  const resetSessionGuides = useCallback(() => {
    setShownGuidesThisSession(new Set());
    // Potentially dismiss active guide as well, if a run ends while a guide is up.
    // setActiveGuideKey(null); // Decided against this for now, might be abrupt. Dismissal should be explicit.
  }, []);


  return {
    activeGuideKey, // Exposing for potential direct checks if needed elsewhere
    currentGuide,
    showGuide,
    dismissGuide,
    markMilestoneComplete,
    resetSessionGuides, // To be called from useGameEngine when a new run starts
  };
};
