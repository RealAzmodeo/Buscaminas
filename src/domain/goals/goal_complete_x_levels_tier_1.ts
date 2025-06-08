import { GoalDefinition } from "../../../types";
import {
  GOAL_IDS,
  GOAL_CATEGORIES,
} from "../../../constants/metaProgressionConstants";

const goalCompleteXLevelsTier1: GoalDefinition = {
  id: GOAL_IDS.COMPLETE_X_LEVELS_TIER_1,
  name: "Superviviente del Abismo (I)",
  description: "Completa 3 niveles en una misma partida.",
  category: GOAL_CATEGORIES.PROGRESS,
  icon: "🧭",
  rewardLumens: 75,
  targetValue: 3,
  relevantEventType: "LEVEL_COMPLETED_IN_RUN",
  resetsPerRun: true,
};

export default goalCompleteXLevelsTier1;
