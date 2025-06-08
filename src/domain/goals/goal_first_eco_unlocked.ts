import { GoalDefinition } from "../../../types";
import {
  GOAL_IDS,
  GOAL_CATEGORIES,
} from "../../../constants/metaProgressionConstants";

const goalFirstEcoUnlocked: GoalDefinition = {
  id: GOAL_IDS.FIRST_ECO_UNLOCKED,
  name: "Eco Primigenio",
  description: "Desbloquea tu primer Eco en el Árbol del Conocimiento.",
  category: GOAL_CATEGORIES.ECHOS_FURIAS,
  icon: "💡🌳",
  rewardLumens: 30,
  targetValue: 1,
  relevantEventType: "FIRST_ECO_UNLOCKED",
};

export default goalFirstEcoUnlocked;
