
import { BiomeDefinition, BiomeId, BoardParameters, MapRewardType, MapEncounterType } from '../types';
import { MAP_NODE_REWARD_GOLD_MODIFIER_VALUE } from '../constants'; // MAP_NODE_REWARD_GOLD_MODIFIER_VALUE is fine here.

export const BIOME_DEFINITIONS: Record<BiomeId, BiomeDefinition> = {
  [BiomeId.Default]: {
    id: BiomeId.Default,
    name: "Cámaras Resonantes",
    icon: "⛰️",
    description: "El bioma por defecto, equilibrado. Un eco de lo familiar en la penumbra.",
    backgroundColor: "bg-slate-900",
    nodeColorClass: "border-slate-500",
    // No specific board modifiers for default biome
  },
  [BiomeId.BrokenBazaar]: {
    id: BiomeId.BrokenBazaar,
    name: "Bazar Quebrado",
    icon: "🏺", 
    description: "Mayor Oro, más Parásitos. Restos de un mercado olvidado.",
    backgroundColor: "bg-amber-900/70", 
    nodeColorClass: "border-amber-600", 
    boardModifiers: (config: BoardParameters, _currentLevel: number, nodeRewardType?: MapRewardType): BoardParameters => {
      let newConfig = { ...config };
      // If the node itself has an ExtraGold reward, or generally for this biome, make it richer.
      // This could mean favoring a gold-rich object ratio or slightly increasing item density.
      if (nodeRewardType === MapRewardType.ExtraGold || Math.random() < 0.3) { // 30% chance for biome itself to be richer
        if (config.objectRatioKey !== 'richInGold' && !config.objectRatioKey.includes('scarce')) { // Avoid overriding strong themes
          newConfig.objectRatioKey = 'richInGold';
        }
        newConfig.densityPercent = Math.min(100, config.densityPercent + 5); // Slightly more items
      }
      // Future: "más Parásitos" would be handled by encounter generation rules for this biome.
      return newConfig;
    },
  },
  [BiomeId.BloodForge]: {
    id: BiomeId.BloodForge,
    name: "Forja de Sangre",
    icon: "🔥",
    description: "Más Verdugos, mayor densidad de Ataques. Un calor antinatural emana de estas cámaras.",
    backgroundColor: "bg-red-900/70", 
    nodeColorClass: "border-red-700", 
    boardModifiers: (config: BoardParameters): BoardParameters => {
      let newConfig = { ...config };
      // Favor attack-heavy ratios
      if (config.objectRatioKey !== 'manyAttacks' && config.objectRatioKey !== 'hostile') {
        newConfig.objectRatioKey = 'manyAttacks';
      }
      // Increase overall item density, which should lead to more attacks given the ratio.
      newConfig.densityPercent = Math.min(100, config.densityPercent + 8);
      // Potentially add more traps
      newConfig.traps = Math.min(config.traps + 1, 5); // Example: Add a trap, max 5
      return newConfig;
    },
  },
  [BiomeId.CrystalGallery]: { 
    id: BiomeId.CrystalGallery,
    name: "Galería de los Espejismos",
    icon: "💎",
    description: "Más Ilusionistas, Furias que distorsionan la información.",
    backgroundColor: "bg-purple-900/70",
    nodeColorClass: "border-purple-600",
    // boardModifiers: (config) => config, // Placeholder
  },
  [BiomeId.SilentLibrary]: { 
    id: BiomeId.SilentLibrary,
    name: "La Biblioteca Silenciosa",
    icon: "📜",
    description: "Menos enemigos, pero los que hay son más difíciles. Mayor probabilidad de Ecos relacionados con la información.",
    backgroundColor: "bg-blue-900/70",
    nodeColorClass: "border-blue-600",
     // boardModifiers: (config) => config, // Placeholder
  },
  [BiomeId.InfectedGarden]: { 
    id: BiomeId.InfectedGarden,
    name: "El Jardín Infecto",
    icon: "🌿",
    description: "Introduce el estado \"Veneno\".",
    backgroundColor: "bg-green-900/70",
    nodeColorClass: "border-green-600",
    // boardModifiers: (config) => config, // Placeholder
  },
};

export const REWARD_ICONS: Record<MapRewardType, string> = {
    [MapRewardType.None]: "", 
    [MapRewardType.ExtraGold]: "🪙", // Path of the Avaricious
    [MapRewardType.SoulFragments]: "✨", // Senda del Alma
    [MapRewardType.WillLumens]: "💡", // Destello de Voluntad
    [MapRewardType.FreeEcho]: "🌀ECO", // Santuario Olvidado: Eco Gratuito
    [MapRewardType.HealingFountain]: "💖+", // Santuario Olvidado: Fuente de Curación
    [MapRewardType.EchoForge]: "🛠️ECO", // Santuario Olvidado: Forja de Ecos
};

export const REWARD_DESCRIPTIONS: Record<MapRewardType, string> = {
    [MapRewardType.None]: "Sin recompensa adicional.",
    [MapRewardType.ExtraGold]: "Camino del Avaro: Mayor generación de Oro en este tramo.",
    [MapRewardType.SoulFragments]: "Senda del Alma: Recompensa de Fragmentos de Alma al final del tramo.",
    [MapRewardType.WillLumens]: "Destello de Voluntad: Recompensa de Lúmenes de Voluntad al final del tramo.",
    [MapRewardType.FreeEcho]: "Santuario Olvidado: Se te ofrecerán 3 Ecos y podrás elegir uno sin coste.",
    [MapRewardType.HealingFountain]: "Santuario Olvidado: Recupera una cantidad significativa de HP.",
    [MapRewardType.EchoForge]: "Santuario Olvidado: Permite mejorar un Eco existente a su siguiente nivel.",
};

export const ENCOUNTER_ICONS: Record<MapEncounterType, string> = {
    [MapEncounterType.Standard]: "?",
    [MapEncounterType.ArchetypeSpecific]: "👤", // Placeholder, could be specific enemy icons
    [MapEncounterType.Elite]: "🔥",
    [MapEncounterType.Boss]: "👹",
};

export const ENCOUNTER_DESCRIPTIONS: Record<MapEncounterType, string> = {
    [MapEncounterType.Standard]: "Encuentro estándar. Lo que acecha es incierto.",
    [MapEncounterType.ArchetypeSpecific]: "Encuentro con arquetipo específico garantizado.",
    [MapEncounterType.Elite]: "Encuentro de Élite. Alto riesgo, alta recompensa.",
    [MapEncounterType.Boss]: "Jefe de Piso. El desafío definitivo del tramo.",
};