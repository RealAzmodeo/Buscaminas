import { GoalDefinition } from "../../../types";
import {
  GOAL_IDS,
  GOAL_CATEGORIES,
} from "../../../constants/metaProgressionConstants";

const goalDefeatXEnemiesTier2: GoalDefinition = {
  id: GOAL_IDS.DEFEAT_X_ENEMIES_TIER_2,
  name: "Azote de Sombras (II)",
  description: "Derrota 50 esbirros en total.",
  category: GOAL_CATEGORIES.COMBAT,
  icon: "💀💀",
  rewardLumens: 50,
  targetValue: 50,
  relevantEventType: "ENEMY_DEFEATED",
  prerequisitesGoalIds: [GOAL_IDS.DEFEAT_X_ENEMIES_TIER_1],
};

export default goalDefeatXEnemiesTier2;
