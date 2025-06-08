import { GoalDefinition } from "../../../types";
import {
  GOAL_IDS,
  GOAL_CATEGORIES,
} from "../../../constants/metaProgressionConstants";

const goalDefeatXEnemiesTier3: GoalDefinition = {
  id: GOAL_IDS.DEFEAT_X_ENEMIES_TIER_3,
  name: "Azote de Sombras (III)",
  description: "Derrota 100 esbirros en total.",
  category: GOAL_CATEGORIES.COMBAT,
  icon: "💀💀💀",
  rewardLumens: 100,
  targetValue: 100,
  relevantEventType: "ENEMY_DEFEATED",
  prerequisitesGoalIds: [GOAL_IDS.DEFEAT_X_ENEMIES_TIER_2],
};

export default goalDefeatXEnemiesTier3;
