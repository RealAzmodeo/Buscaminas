import { GoalDefinition } from "../../../types";
import {
  GOAL_IDS,
  GOAL_CATEGORIES,
} from "../../../constants/metaProgressionConstants";

const goalRevealXCellsTier1: GoalDefinition = {
  id: GOAL_IDS.REVEAL_X_CELLS_TIER_1,
  name: "Explorador Diligente (I)",
  description: "Revela un total de 100 casillas.",
  category: GOAL_CATEGORIES.BOARD,
  icon: "🗺️",
  rewardLumens: 15,
  targetValue: 100,
  relevantEventType: "CELL_REVEALED",
};

export default goalRevealXCellsTier1;
