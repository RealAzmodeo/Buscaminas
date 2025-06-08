import { GoalDefinition } from "../../../types";
import {
  GOAL_IDS,
  GOAL_CATEGORIES,
} from "../../../constants/metaProgressionConstants";

const goalFirstSanctuaryVisit: GoalDefinition = {
  id: GOAL_IDS.FIRST_SANCTUARY_VISIT,
  name: "Refugio Encontrado",
  description: "Visita el Santuario por primera vez.",
  category: GOAL_CATEGORIES.PROGRESS,
  icon: "🌳",
  rewardLumens: 10,
  targetValue: 1,
  relevantEventType: "SANCTUARY_FIRST_VISIT",
};

export default goalFirstSanctuaryVisit;
