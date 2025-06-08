import { GoalDefinition } from "../../../types";
import {
  GOAL_IDS,
  GOAL_CATEGORIES,
} from "../../../constants/metaProgressionConstants";

const goalPrologueComplete: GoalDefinition = {
  id: GOAL_IDS.PROLOGUE_COMPLETE,
  name: "Primeros Pasos",
  description: "Completa el Prólogo.",
  category: GOAL_CATEGORIES.PROGRESS,
  icon: "🏞️",
  rewardLumens: 20,
  targetValue: 1,
  relevantEventType: "PROLOGUE_COMPLETED",
};

export default goalPrologueComplete;
