import { GoalDefinition, CellType } from "../../../types";
import {
  GOAL_IDS,
  GOAL_CATEGORIES,
} from "../../../constants/metaProgressionConstants";

const goalRevealXGoldCellsTier2: GoalDefinition = {
  id: GOAL_IDS.REVEAL_X_GOLD_CELLS_TIER_2,
  name: "Buscador de Tesoros (II)",
  description: "Revela 100 casillas de Oro.",
  category: GOAL_CATEGORIES.BOARD,
  icon: "💰💰✨",
  rewardLumens: 60,
  targetValue: 100,
  relevantEventType: "CELL_REVEALED",
  eventPropertyToCheck: "cellType",
  eventPropertyValueToMatch: CellType.Gold,
  prerequisitesGoalIds: [GOAL_IDS.REVEAL_X_GOLD_CELLS_TIER_1],
};

export default goalRevealXGoldCellsTier2;
