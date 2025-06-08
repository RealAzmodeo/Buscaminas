import { GoalDefinition } from "../../../types";
import {
  GOAL_IDS,
  GOAL_CATEGORIES,
} from "../../../constants/metaProgressionConstants";

const goalRevealXCellsTier2: GoalDefinition = {
  id: GOAL_IDS.REVEAL_X_CELLS_TIER_2,
  name: "Explorador Diligente (II)",
  description: "Revela un total de 500 casillas.",
  category: GOAL_CATEGORIES.BOARD,
  icon: "🗺️🗺️",
  rewardLumens: 40,
  targetValue: 500,
  relevantEventType: "CELL_REVEALED",
  prerequisitesGoalIds: [GOAL_IDS.REVEAL_X_CELLS_TIER_1],
};

export default goalRevealXCellsTier2;
