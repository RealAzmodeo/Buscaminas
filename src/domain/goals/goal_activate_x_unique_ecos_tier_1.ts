import { GoalDefinition } from "../../../types";
import {
  GOAL_IDS,
  GOAL_CATEGORIES,
} from "../../../constants/metaProgressionConstants";

const goalActivateXUniqueEcosTier1: GoalDefinition = {
  id: GOAL_IDS.ACTIVATE_X_UNIQUE_ECOS_TIER_1,
  name: "Paleta de Poderes (I)",
  description: "Activa 5 Ecos diferentes (tipos únicos) en una misma partida.",
  category: GOAL_CATEGORIES.ECHOS_FURIAS,
  icon: "🎨🌀",
  rewardLumens: 60,
  targetValue: 5,
  relevantEventType: "UNIQUE_ECO_ACTIVATED",
  resetsPerRun: true,
};

export default goalActivateXUniqueEcosTier1;
