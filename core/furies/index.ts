import { FuryAbility } from '../../types';

// Import all individual fury objects
import { furyShadowEmberSparkPrologue } from './fury_shadow_ember_spark_prologue';
import { furyToqueVacioInitial } from './fury_toque_vacio_initial';
import { furySemillaInoportunaInitial } from './fury_semilla_inoportuna_initial';
import { furyVeloMomentaneoInitial } from './fury_velo_momentaneo_initial';
import { furyAlientoEfimeroInitial } from './fury_aliento_efimero_initial';
import { furyImpuestoSombrioInitial } from './fury_impuesto_sombrio_initial';
import { furyTorpezaFugazInitial } from './fury_torpeza_fugaz_initial';
import { furyRescoldoPersistenteInitial } from './fury_rescoldo_persistente_initial';
import { furyEcoDistorsionadoMenorInitial } from './fury_eco_distorsionado_menor_initial';
import { furyMiradaInquietanteInitial } from './fury_mirada_inquietante_initial';
import { furyImpactoMenor } from './fury_impacto_menor';
import { furyGolpeCertero } from './fury_golpe_certero';
import { furyTormentaEsquirlas } from './fury_tormenta_esquirlas';
import { furyAlientoAniquilador } from './fury_aliento_aniquilador';
import { furySiembraFugaz } from './fury_siembra_fugaz';
import { furyNidoPeligros } from './fury_nido_peligros';
import { furyCampoMinadoSubito } from './fury_campo_minado_subito';
import { furyRemodelacionCaotica } from './fury_remodelacion_caotica';
import { furySombrasPersistentes } from './fury_sombras_persistentes';
import { furyGranEclipse } from './fury_gran_eclipse';
import { furyVigorMomentaneo } from './fury_vigor_momentaneo';
import { furyResistenciaImpia } from './fury_resistencia_impia';
import { furyFestinOscuro } from './fury_festin_oscuro';

// Reconstruct PROLOGUE_SHADOW_EMBER_FURY_ABILITY
export const PROLOGUE_SHADOW_EMBER_FURY_ABILITY = furyShadowEmberSparkPrologue;

// Reconstruct INITIAL_STARTING_FURIESS
export const INITIAL_STARTING_FURIESS: FuryAbility[] = [
  furyToqueVacioInitial,
  furySemillaInoportunaInitial,
  furyVeloMomentaneoInitial,
  furyAlientoEfimeroInitial,
  furyImpuestoSombrioInitial,
  furyTorpezaFugazInitial,
  furyRescoldoPersistenteInitial,
  furyEcoDistorsionadoMenorInitial,
  furyMiradaInquietanteInitial,
];

// Base list of other game furies (excluding prologue and initial, if they are distinct)
// This matches the original ALL_GAME_FURY_ABILITIES_BASE content
const allGameFuryAbilitiesBase: FuryAbility[] = [
  furyImpactoMenor,
  furyGolpeCertero,
  furyTormentaEsquirlas,
  furyAlientoAniquilador,
  furySiembraFugaz, // Note: fury_siembra_fugaz is identical to fury_semilla_inoportuna_initial in effect, but has a different ID.
  furyNidoPeligros,
  furyCampoMinadoSubito,
  furyRemodelacionCaotica,
  furySombrasPersistentes,
  furyGranEclipse,
  furyVigorMomentaneo, // Note: fury_vigor_momentaneo is identical to fury_aliento_efimero_initial in effect.
  furyResistenciaImpia,
  furyFestinOscuro,
];

// Create the comprehensive ALL_FURY_ABILITIES_LIST
// The original ALL_GAME_FURY_ABILITIES was:
// [...INITIAL_STARTING_FURIESS, ...ALL_GAME_FURY_ABILITIES_BASE].filter(...)
// And PROLOGUE_SHADOW_EMBER_FURY_ABILITY was separate but should be included in a truly "all" list.
const combinedList: FuryAbility[] = [
  furyShadowEmberSparkPrologue, // Ensure prologue fury is included
  ...INITIAL_STARTING_FURIESS,
  ...allGameFuryAbilitiesBase,
];

export const ALL_FURY_ABILITIES_LIST: FuryAbility[] = combinedList.filter(
  (fury, index, self) => index === self.findIndex((f) => f.id === fury.id)
);

export const ALL_FURY_ABILITIES_MAP = new Map<string, FuryAbility>(
  ALL_FURY_ABILITIES_LIST.map(fury => [fury.id, fury])
);

// FURY_ABILITIES_TO_AWAKEN_SEQUENTIALLY - this is an array of IDs, so it can be copied directly.
export const FURY_ABILITIES_TO_AWAKEN_SEQUENTIALLY: string[] = [
    'fury_golpe_certero',
    'fury_nido_peligros',
    'fury_sombras_persistentes',
    'fury_resistencia_impia',
    'fury_tormenta_esquirlas',
    'fury_campo_minado_subito',
    'fury_gran_eclipse',
    'fury_festin_oscuro',
    'fury_aliento_aniquilador',
    'fury_remodelacion_caotica',
];
