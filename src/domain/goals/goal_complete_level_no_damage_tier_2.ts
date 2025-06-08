import { GoalDefinition } from "../../../types";
import {
  GOAL_IDS,
  GOAL_CATEGORIES,
} from "../../../constants/metaProgressionConstants";

const goalCompleteLevelNoDamageTier2: GoalDefinition = {
  id: GOAL_IDS.COMPLETE_LEVEL_NO_DAMAGE_TIER_2,
  name: "Danza Impecable (II)",
  description:
    "Completa 5 niveles sin recibir daño (en total, no necesariamente en una run).",
  category: GOAL_CATEGORIES.COMBAT,
  icon: "💃💃",
  rewardLumens: 100,
  targetValue: 5,
  relevantEventType: "LEVEL_COMPLETED_NO_DAMAGE",
  resetsPerRun: false,
  prerequisitesGoalIds: [GOAL_IDS.COMPLETE_LEVEL_NO_DAMAGE_TIER_1],
};

export default goalCompleteLevelNoDamageTier2;
