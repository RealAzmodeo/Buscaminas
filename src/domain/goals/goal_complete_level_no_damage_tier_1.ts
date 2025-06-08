import { GoalDefinition } from "../../../types";
import {
  GOAL_IDS,
  GOAL_CATEGORIES,
} from "../../../constants/metaProgressionConstants";

const goalCompleteLevelNoDamageTier1: GoalDefinition = {
  id: GOAL_IDS.COMPLETE_LEVEL_NO_DAMAGE_TIER_1,
  name: "Danza Impecable (I)",
  description: "Completa 1 nivel sin recibir daño.",
  category: GOAL_CATEGORIES.COMBAT,
  icon: "💃",
  rewardLumens: 50,
  targetValue: 1,
  relevantEventType: "LEVEL_COMPLETED_NO_DAMAGE",
  resetsPerRun: false,
};

export default goalCompleteLevelNoDamageTier1;
