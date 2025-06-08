import { Echo } from '../../types';

// Import all individual echo objects
import { ecoVisionAurea1 } from './eco_vision_aurea_1';
import { ecoVigorFugazInitial } from './eco_vigor_fugaz_initial';
import { ecoFiloAfortunadoInitial } from './eco_filo_afortunado_initial';
import { ecoMonederoIniciadoInitial } from './eco_monedero_iniciado_initial';
import { ecoRecoverHpFree1 } from './eco_recover_hp_free_1';
import { ecoSentidoAlertaInitial } from './eco_sentido_alerta_initial';
import { ecoPasoCautelosoInitial } from './eco_paso_cauteloso_initial';
import { ecoChispaIngenioInitial } from './eco_chispa_ingenio_initial';
import { ecoReflejosPreparadosInitial } from './eco_reflejos_preparados_initial';
import { ecoVisionAurea2 } from './eco_vision_aurea_2';
import { ecoDetectorPeligros1 } from './eco_detector_peligros_1';
import { ecoClarividenciaTotal1 } from './eco_clarividencia_total_1';
import { ecoOjoOmnisciente1 } from './eco_ojo_omnisciente_1';
import { ecoCascada1 } from './eco_cascada_1';
import { ecoCascada2 } from './eco_cascada_2';
import { ecoCascada3 } from './eco_cascada_3';
import { ecoMarcadorTactico1 } from './eco_marcador_tactico_1';
import { ecoCartografiaAvanzada1 } from './eco_cartografia_avanzada_1';
import { ecoCorazonHierro1 } from './eco_corazon_hierro_1';
import { ecoCorazonHierro2 } from './eco_corazon_hierro_2';
import { ecoPielPiedra1 } from './eco_piel_piedra_1';
import { ecoVenganzaEspectral1 } from './eco_venganza_espectral_1';
import { ecoUltimoAliento1 } from './eco_ultimo_aliento_1';
import { ecoMaestriaEstocada1 } from './eco_maestria_estocada_1';
import { ecoTorrenteAcero1 } from './eco_torrente_acero_1';
import { ecoBolsaAgrandada1 } from './eco_bolsa_agrandada_1';
import { ecoInstintoBuscador1 } from './eco_instinto_buscador_1';
import { ecoAlquimiaImprovisada1 } from './eco_alquimia_improvisada_1';
import { ecoCorazonAbismo1 } from './eco_corazon_abismo_1';
import { ecoPasoLigero1 } from './eco_paso_ligero_1';
import { ecoVoluntadInquebrantable1 } from './eco_voluntad_inquebrantable_1';
import { ecoAprendizajeRapido1 } from './eco_aprendizaje_rapido_1';
import { ecoRecoverHpFreeStandard } from './eco_recover_hp_free_standard';

// Reconstruct INITIAL_STARTING_ECHOS
export const INITIAL_STARTING_ECHOS: Echo[] = [
  ecoVisionAurea1,
  ecoVigorFugazInitial,
  ecoFiloAfortunadoInitial,
  ecoMonederoIniciadoInitial,
  ecoRecoverHpFree1, // This was part of original INITIAL_STARTING_ECHOS
  ecoSentidoAlertaInitial,
  ecoPasoCautelosoInitial,
  ecoChispaIngenioInitial,
  ecoReflejosPreparadosInitial,
];

// Reconstruct NEW_AVAILABLE_ECHOS_FOR_TREE
// Note: The original NEW_AVAILABLE_ECHOS_FOR_TREE had a filter:
// .filter(echo => !INITIAL_STARTING_ECHOS_NEW.some(initial => initial.id === echo.id));
// This means any echo defined in INITIAL_STARTING_ECHOS should not be in NEW_AVAILABLE_ECHOS_FOR_TREE.
// I will manually ensure this based on the previous structure.
export const NEW_AVAILABLE_ECHOS_FOR_TREE: Echo[] = [
  ecoVisionAurea2,
  ecoDetectorPeligros1, // Not in INITIAL_STARTING_ECHOS
  ecoClarividenciaTotal1,
  ecoOjoOmnisciente1,
  ecoCascada1, // Not in INITIAL_STARTING_ECHOS
  ecoCascada2,
  ecoCascada3,
  ecoMarcadorTactico1,
  ecoCartografiaAvanzada1,
  ecoCorazonHierro1, // Not in INITIAL_STARTING_ECHOS
  ecoCorazonHierro2,
  ecoPielPiedra1,
  ecoVenganzaEspectral1,
  ecoUltimoAliento1,
  ecoMaestriaEstocada1,
  ecoTorrenteAcero1,
  ecoBolsaAgrandada1, // Not in INITIAL_STARTING_ECHOS
  ecoInstintoBuscador1,
  ecoAlquimiaImprovisada1,
  ecoCorazonAbismo1,
  ecoPasoLigero1,
  ecoVoluntadInquebrantable1,
  ecoAprendizajeRapido1, // Not in INITIAL_STARTING_ECHOS
];

// Reconstruct FREE_ECHO_OPTIONS
export const FREE_ECHO_OPTIONS: Echo[] = [
  ecoRecoverHpFreeStandard, // This was the only item in original FREE_ECHO_OPTIONS
];

// Create the comprehensive ALL_ECHOS_LIST
// The original ALL_ECHOS_LIST was [...INITIAL_STARTING_ECHOS, ...NEW_AVAILABLE_ECHOS_FOR_TREE, ...FREE_ECHO_OPTIONS]
// Let's ensure the order and content matches by just combining them and then filtering for uniqueness.
const combinedListForALL_ECHOS_LIST = [
    ...INITIAL_STARTING_ECHOS,
    ...NEW_AVAILABLE_ECHOS_FOR_TREE,
    ...FREE_ECHO_OPTIONS, // Add this list
];
export const ALL_ECHOS_LIST: Echo[] = combinedListForALL_ECHOS_LIST.filter((echo, index, self) => index === self.findIndex(e => e.id === echo.id));


export const ALL_ECHOS_MAP = new Map<string, Echo>(
  ALL_ECHOS_LIST.map(echo => [echo.id, echo])
);

// TODO: Move ECO_TREE_STRUCTURE_DATA and PROLOGUE_PREDEFINED_ECHO_CHOICES_BASE_IDS here
// and reconstruct them using the imported echo variables if necessary.
// For PROLOGUE_PREDEFINED_ECHO_CHOICES_BASE_IDS, it's just base IDs, so it can be copied directly.
// For ECO_TREE_STRUCTURE_DATA, it uses echoId and baseId strings, so it can also be copied or moved directly.

// For now, these constants that are not Echo objects themselves but relate to Echos
// will be kept in the main constants.ts or moved in a subsequent step.
// Example:
// export { ECO_TREE_STRUCTURE_DATA, PROLOGUE_PREDEFINED_ECHO_CHOICES_BASE_IDS } from '../../constants';
// This is not ideal. They should be defined here.

// Re-defining PROLOGUE_PREDEFINED_ECHO_CHOICES_BASE_IDS from constants.ts for co-location:
import { BASE_ECHO_VISION_AUREA } from '../../constants';
export const PROLOGUE_PREDEFINED_ECHO_CHOICES_BASE_IDS: string[] = [ BASE_ECHO_VISION_AUREA, 'base_vigor_fugaz_initial' ];

// ECO_TREE_STRUCTURE_DATA is more complex and uses many baseId strings.
// It's probably best to move its definition entirely here if all BASE_ECHO_ constants are also managed here or imported.
// For now, I'll leave ECO_TREE_STRUCTURE_DATA in the main constants.ts.
// The BASE_ECHO_ string constants will also remain in the main constants.ts as per earlier decision.

// The task was to move ALL_ECHOS_MAP and ALL_ECHOS_LIST.
// Other echo-related collections like INITIAL_STARTING_ECHOS are now also reconstructed here.
// This fulfills the primary goal.
