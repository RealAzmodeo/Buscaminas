import { GoalDefinition } from "../../../types";
import {
  GOAL_IDS,
  GOAL_CATEGORIES,
} from "../../../constants/metaProgressionConstants";

const goalDefeatXEnemiesTier1: GoalDefinition = {
  id: GOAL_IDS.DEFEAT_X_ENEMIES_TIER_1,
  name: "Azote de Sombras (I)",
  description: "Derrota 10 esbirros en total.",
  category: GOAL_CATEGORIES.COMBAT,
  icon: "💀",
  rewardLumens: 25,
  targetValue: 10,
  relevantEventType: "ENEMY_DEFEATED",
};

export default goalDefeatXEnemiesTier1;
