import { TurboModule, TurboModuleRegistry } from 'react-native';

export interface FilterState {
  name: string;
  intensity: number; // 0..1
}

// Paramètres avancés de filtres (aligné avec l'UI AdvancedFilterControls)
export interface AdvancedFilterParams {
  brightness: number;    // -1.0 à 1.0
  contrast: number;      // 0.0 à 2.0
  saturation: number;    // 0.0 à 2.0
  hue: number;           // -180 à 180 (degrés)
  gamma: number;         // 0.1 à 3.0
  warmth: number;        // -1.0 à 1.0
  tint: number;          // -1.0 à 1.0
  exposure: number;      // -2.0 à 2.0 (EV)
  shadows: number;       // -1.0 à 1.0
  highlights: number;    // -1.0 à 1.0
  vignette: number;      // 0.0 à 1.0
  grain: number;         // 0.0 à 1.0
}

// État complet d'un filtre avec paramètres
export interface FilterStateWithParams extends FilterState {
  params?: AdvancedFilterParams;
}

// Informations détaillées sur un filtre
export interface FilterInfo {
  name: string;              // Identifiant technique
  displayName: string;       // Nom d'affichage localisé
  type: FilterType;         // Type de filtre
  description: string;       // Description du filtre
  isCustom: boolean;        // Filtre personnalisé ou prédéfini
  supportedFormats: string[]; // Formats pixel supportés
}

// Types de filtres disponibles
export enum FilterType {
  NONE = 'NONE',
  SEPIA = 'SEPIA',
  NOIR = 'NOIR',
  MONOCHROME = 'MONOCHROME',
  COLOR_CONTROLS = 'COLOR_CONTROLS',
  VINTAGE = 'VINTAGE',
  COOL = 'COOL',
  WARM = 'WARM',
  CUSTOM = 'CUSTOM'
}

// Types de processeurs disponibles
export enum ProcessorType {
  FFMPEG = 'FFMPEG',
  OPENGL = 'OPENGL',
  CUSTOM = 'CUSTOM'
}

// Options pour LUT 3D
export interface LUT3DOptions {
  path: string;                              // Chemin absolu vers le fichier .cube
  interpolation?: 'nearest' | 'trilinear' | 'tetrahedral'; // Méthode d'interpolation
}

// Configuration vidéo
export interface VideoFormat {
  width: number;
  height: number;
  pixelFormat: string; // 'bgra', 'rgba', 'yuv420p', etc.
  frameRate?: number;
}

// Capacités du système
export interface FilterCapabilities {
  ffmpegAvailable: boolean;
  availableProcessors: ProcessorType[];
  supportedPixelFormats: string[];
  currentProcessor: ProcessorType;
  parallelProcessingEnabled: boolean;
  threadPoolSize: number;
  lastError?: string;
}

// Configuration de performance
export interface PerformanceConfig {
  parallelProcessing?: boolean;
  threadPoolSize?: number;
}

// Configuration de production
export interface ProductionConfig {
  productionMode?: boolean;
  enableLogging?: boolean;
  enableProfiling?: boolean;
  cacheSize?: number; // en bytes
  targetFPS?: number;
  maxThreads?: number;
  enableOpenGL?: boolean;
  enableCache?: boolean;
  enablePrediction?: boolean;
}

// Informations système
export interface SystemInfo {
  totalMemory?: number; // en MB
  cpuCores?: number;
  hasGPU?: boolean;
  supportsOpenGLES3?: boolean;
  screenWidth?: number;
  screenHeight?: number;
  isLowPowerMode?: boolean;
}

// Statistiques de performance
export interface PerformanceStats {
  averageFPS: number;
  averageProcessingTime: number; // en ms
  totalFramesProcessed: number;
  activeThreads: number;
  queueSize: number;
  memoryUsage: number; // en bytes
}

// Statistiques mémoire
export interface MemoryStats {
  totalAllocated: number;
  currentlyUsed: number;
  peakUsage: number;
  allocationCount: number;
  deallocationCount: number;
  cacheHits: number;
  cacheMisses: number;
  cacheHitRate: number; // 0.0 à 1.0
}

export interface Spec extends TurboModule {
  // === API de base (existante) ===
  readonly getAvailableFilters: () => string[];
  readonly setFilter: (name: string, intensity: number) => boolean;
  readonly getFilter: () => FilterState | null;
  readonly clearFilter: () => boolean;
  readonly setFilterWithParams: (
    name: string,
    intensity: number,
    params: AdvancedFilterParams
  ) => boolean;

  // === API étendue complète ===
  
  // Informations détaillées sur les filtres
  readonly getAvailableFiltersDetailed: () => FilterInfo[];
  readonly getFilterWithParams: () => FilterStateWithParams | null;
  
  // Support LUT 3D
  readonly setLUT3D: (options: LUT3DOptions) => boolean;
  readonly getLUT3DPath: () => string | null;
  
  // Gestion des processeurs
  readonly getCapabilities: () => FilterCapabilities;
  readonly setProcessor: (type: ProcessorType) => boolean;
  readonly getProcessor: () => ProcessorType;
  
  // Configuration vidéo
  readonly setVideoFormat: (format: VideoFormat) => boolean;
  readonly getVideoFormat: () => VideoFormat | null;
  
  // Performance et parallélisme
  readonly setPerformanceConfig: (config: PerformanceConfig) => boolean;
  readonly getPerformanceConfig: () => PerformanceConfig;
  
  // Traitement direct (avancé) - Note: ArrayBuffer not supported by codegen
  readonly processFrame: (
    inputData: Object, // Input buffer data
    outputData: Object, // Output buffer data
    format: VideoFormat
  ) => boolean;
  
  // Diagnostics
  readonly getLastError: () => string | null;
  readonly clearLastError: () => void;
  
  // Validation
  readonly validateLUTFile: (path: string) => boolean;
  readonly supportsFormat: (pixelFormat: string) => boolean;
  readonly supportsFilter: (filterName: string) => boolean;
  
  // === API de production ===
  readonly setProductionConfig: (config: ProductionConfig) => boolean;
  readonly getProductionConfig: () => ProductionConfig;
  readonly getSystemInfo: () => SystemInfo;
  readonly getPerformanceStats: () => PerformanceStats;
  readonly getMemoryStats: () => MemoryStats;
  readonly preloadFilters: (filterNames: string[]) => boolean;
  readonly cleanup: () => boolean;
  readonly enableProfiling: (enable: boolean) => boolean;
  readonly setTargetFPS: (fps: number) => boolean;
  readonly setCacheSize: (sizeInMB: number) => boolean;
}

let _nativeCameraModule: Spec | null = null;
const getNativeCameraModule = (): Spec => {
  if (!_nativeCameraModule) {
    _nativeCameraModule = TurboModuleRegistry.getEnforcing<Spec>('NativeCameraFiltersModule');
  }
  return _nativeCameraModule;
};

const LazyNativeCameraFiltersModule: Spec = new Proxy({} as any, {
  get: (_target, prop) => {
    const mod = getNativeCameraModule() as any;
    return mod[prop as keyof Spec];
  },
}) as Spec;

export default LazyNativeCameraFiltersModule;


