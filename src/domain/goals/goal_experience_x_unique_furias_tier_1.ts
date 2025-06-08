import { GoalDefinition } from "../../../types";
import {
  GOAL_IDS,
  GOAL_CATEGORIES,
} from "../../../constants/metaProgressionConstants";

const goalExperienceXUniqueFuriasTier1: GoalDefinition = {
  id: GOAL_IDS.EXPERIENCE_X_UNIQUE_FURIAS_TIER_1,
  name: "Confrontador de Calamidades (I)",
  description:
    "Experimenta 5 Furias diferentes (tipos únicos) en una misma partida.",
  category: GOAL_CATEGORIES.ECHOS_FURIAS,
  icon: "🔥👹",
  rewardLumens: 65,
  targetValue: 5,
  relevantEventType: "UNIQUE_FURY_EXPERIENCED",
  resetsPerRun: true,
};

export default goalExperienceXUniqueFuriasTier1;
