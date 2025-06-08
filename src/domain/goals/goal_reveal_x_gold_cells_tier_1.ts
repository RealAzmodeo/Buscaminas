import { GoalDefinition, CellType } from "../../../types";
import {
  GOAL_IDS,
  GOAL_CATEGORIES,
} from "../../../constants/metaProgressionConstants";

const goalRevealXGoldCellsTier1: GoalDefinition = {
  id: GOAL_IDS.REVEAL_X_GOLD_CELLS_TIER_1,
  name: "Buscador de Tesoros (I)",
  description: "Revela 25 casillas de Oro.",
  category: GOAL_CATEGORIES.BOARD,
  icon: "💰✨",
  rewardLumens: 30,
  targetValue: 25,
  relevantEventType: "CELL_REVEALED",
  eventPropertyToCheck: "cellType",
  eventPropertyValueToMatch: CellType.Gold,
};

export default goalRevealXGoldCellsTier1;
