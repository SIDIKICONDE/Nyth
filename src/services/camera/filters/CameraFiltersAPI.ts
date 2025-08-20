/**
 * API étendue pour les filtres de caméra
 * Wrapper autour du module natif avec helpers et types TypeScript
 */

import NativeCameraFiltersModule, {
  FilterState,
  FilterStateWithParams,
  FilterInfo,
  FilterType,
  ProcessorType,
  AdvancedFilterParams,
  LUT3DOptions,
  VideoFormat,
  FilterCapabilities,
  PerformanceConfig
} from '../../../../specs/NativeCameraFiltersModule';

/**
 * Valeurs par défaut pour les paramètres avancés
 */
export const DEFAULT_ADVANCED_PARAMS: AdvancedFilterParams = {
  brightness: 0.0,
  contrast: 1.0,
  saturation: 1.0,
  hue: 0.0,
  gamma: 1.0,
  warmth: 0.0,
  tint: 0.0,
  exposure: 0.0,
  shadows: 0.0,
  highlights: 0.0,
  vignette: 0.0,
  grain: 0.0
};

/**
 * Limites des paramètres
 */
export const PARAM_LIMITS = {
  brightness: { min: -1.0, max: 1.0 },
  contrast: { min: 0.0, max: 2.0 },
  saturation: { min: 0.0, max: 2.0 },
  hue: { min: -180, max: 180 },
  gamma: { min: 0.1, max: 3.0 },
  warmth: { min: -1.0, max: 1.0 },
  tint: { min: -1.0, max: 1.0 },
  exposure: { min: -2.0, max: 2.0 },
  shadows: { min: -1.0, max: 1.0 },
  highlights: { min: -1.0, max: 1.0 },
  vignette: { min: 0.0, max: 1.0 },
  grain: { min: 0.0, max: 1.0 }
} as const;

/**
 * Classe principale pour gérer les filtres de caméra
 */
export class CameraFiltersAPI {
  private static instance: CameraFiltersAPI;
  private capabilities: FilterCapabilities | null = null;
  private availableFilters: FilterInfo[] | null = null;

  private constructor() {}

  static getInstance(): CameraFiltersAPI {
    if (!CameraFiltersAPI.instance) {
      CameraFiltersAPI.instance = new CameraFiltersAPI();
    }
    return CameraFiltersAPI.instance;
  }

  // === API de base ===

  /**
   * Obtient la liste simple des filtres disponibles
   */
  async getAvailableFilters(): Promise<string[]> {
    return NativeCameraFiltersModule.getAvailableFilters();
  }

  /**
   * Applique un filtre simple
   */
  async setFilter(name: string, intensity: number = 1.0): Promise<boolean> {
    intensity = Math.max(0, Math.min(1, intensity));
    return NativeCameraFiltersModule.setFilter(name, intensity);
  }

  /**
   * Obtient l'état actuel du filtre
   */
  async getFilter(): Promise<FilterState | null> {
    return NativeCameraFiltersModule.getFilter();
  }

  /**
   * Supprime le filtre actif
   */
  async clearFilter(): Promise<boolean> {
    return NativeCameraFiltersModule.clearFilter();
  }

  // === API étendue ===

  /**
   * Obtient les informations détaillées sur tous les filtres disponibles
   */
  async getAvailableFiltersDetailed(forceRefresh = false): Promise<FilterInfo[]> {
    if (!this.availableFilters || forceRefresh) {
      this.availableFilters = await NativeCameraFiltersModule.getAvailableFiltersDetailed();
    }
    return this.availableFilters;
  }

  /**
   * Applique un filtre avec paramètres avancés
   */
  async setFilterWithParams(
    name: string,
    intensity: number = 1.0,
    params: Partial<AdvancedFilterParams> = {}
  ): Promise<boolean> {
    // Valider et normaliser les paramètres
    const normalizedParams = this.normalizeAdvancedParams(params);
    intensity = Math.max(0, Math.min(1, intensity));
    
    return NativeCameraFiltersModule.setFilterWithParams(name, intensity, normalizedParams);
  }

  /**
   * Obtient l'état complet du filtre avec paramètres
   */
  async getFilterWithParams(): Promise<FilterStateWithParams | null> {
    return NativeCameraFiltersModule.getFilterWithParams();
  }

  /**
   * Applique une LUT 3D
   */
  async setLUT3D(path: string, interpolation?: 'nearest' | 'trilinear' | 'tetrahedral'): Promise<boolean> {
    const options: LUT3DOptions = {
      path,
      interpolation: interpolation || 'tetrahedral'
    };
    
    // Valider le fichier
    const isValid = await NativeCameraFiltersModule.validateLUTFile(path);
    if (!isValid) {
      const error = await this.getLastError();
      throw new Error(error || 'Invalid LUT file');
    }
    
    return NativeCameraFiltersModule.setLUT3D(options);
  }

  /**
   * Obtient le chemin de la LUT 3D active
   */
  async getLUT3DPath(): Promise<string | null> {
    return NativeCameraFiltersModule.getLUT3DPath();
  }

  // === Gestion des processeurs ===

  /**
   * Obtient les capacités du système
   */
  async getCapabilities(forceRefresh = false): Promise<FilterCapabilities> {
    if (!this.capabilities || forceRefresh) {
      this.capabilities = await NativeCameraFiltersModule.getCapabilities();
    }
    return this.capabilities;
  }

  /**
   * Change le processeur de filtres
   */
  async setProcessor(type: ProcessorType): Promise<boolean> {
    const caps = await this.getCapabilities();
    if (!caps.availableProcessors.includes(type)) {
      throw new Error(`Processor ${type} is not available on this device`);
    }
    
    const success = await NativeCameraFiltersModule.setProcessor(type);
    if (success) {
      // Invalider le cache
      this.capabilities = null;
      this.availableFilters = null;
    }
    return success;
  }

  /**
   * Obtient le processeur actuel
   */
  async getProcessor(): Promise<ProcessorType> {
    return NativeCameraFiltersModule.getProcessor();
  }

  // === Configuration vidéo ===

  /**
   * Configure le format vidéo
   */
  async setVideoFormat(format: VideoFormat): Promise<boolean> {
    if (!format.width || !format.height || !format.pixelFormat) {
      throw new Error('VideoFormat must include width, height, and pixelFormat');
    }
    
    // Vérifier le support du format
    const supported = await NativeCameraFiltersModule.supportsFormat(format.pixelFormat);
    if (!supported) {
      throw new Error(`Pixel format ${format.pixelFormat} is not supported`);
    }
    
    return NativeCameraFiltersModule.setVideoFormat(format);
  }

  /**
   * Obtient le format vidéo actuel
   */
  async getVideoFormat(): Promise<VideoFormat | null> {
    return NativeCameraFiltersModule.getVideoFormat();
  }

  // === Performance ===

  /**
   * Configure les paramètres de performance
   */
  async setPerformanceConfig(config: PerformanceConfig): Promise<boolean> {
    return NativeCameraFiltersModule.setPerformanceConfig(config);
  }

  /**
   * Obtient la configuration de performance
   */
  async getPerformanceConfig(): Promise<PerformanceConfig> {
    return NativeCameraFiltersModule.getPerformanceConfig();
  }

  /**
   * Active/désactive le traitement parallèle
   */
  async setParallelProcessing(enabled: boolean): Promise<boolean> {
    return this.setPerformanceConfig({ parallelProcessing: enabled });
  }

  /**
   * Configure la taille du pool de threads
   */
  async setThreadPoolSize(size: number): Promise<boolean> {
    if (size < 1 || size > 16) {
      throw new Error('Thread pool size must be between 1 and 16');
    }
    return this.setPerformanceConfig({ threadPoolSize: size });
  }

  // === Diagnostics ===

  /**
   * Obtient la dernière erreur
   */
  async getLastError(): Promise<string | null> {
    return NativeCameraFiltersModule.getLastError();
  }

  /**
   * Efface la dernière erreur
   */
  async clearLastError(): Promise<void> {
    return NativeCameraFiltersModule.clearLastError();
  }

  /**
   * Vérifie si un format est supporté
   */
  async supportsFormat(pixelFormat: string): Promise<boolean> {
    return NativeCameraFiltersModule.supportsFormat(pixelFormat);
  }

  /**
   * Vérifie si un filtre est supporté
   */
  async supportsFilter(filterName: string): Promise<boolean> {
    return NativeCameraFiltersModule.supportsFilter(filterName);
  }

  // === Helpers ===

  /**
   * Normalise et valide les paramètres avancés
   */
  private normalizeAdvancedParams(params: Partial<AdvancedFilterParams>): AdvancedFilterParams {
    const normalized = { ...DEFAULT_ADVANCED_PARAMS };
    
    for (const [key, value] of Object.entries(params)) {
      if (key in PARAM_LIMITS) {
        const limits = PARAM_LIMITS[key as keyof typeof PARAM_LIMITS];
        normalized[key as keyof AdvancedFilterParams] = Math.max(
          limits.min,
          Math.min(limits.max, value as number)
        );
      }
    }
    
    return normalized;
  }

  /**
   * Obtient un filtre par son nom
   */
  async getFilterInfo(name: string): Promise<FilterInfo | null> {
    const filters = await this.getAvailableFiltersDetailed();
    return filters.find(f => f.name === name) || null;
  }

  /**
   * Obtient les filtres par type
   */
  async getFiltersByType(type: FilterType): Promise<FilterInfo[]> {
    const filters = await this.getAvailableFiltersDetailed();
    return filters.filter(f => f.type === type);
  }

  /**
   * Obtient les filtres personnalisés
   */
  async getCustomFilters(): Promise<FilterInfo[]> {
    const filters = await this.getAvailableFiltersDetailed();
    return filters.filter(f => f.isCustom);
  }

  /**
   * Crée un preset de filtre avec paramètres
   */
  createFilterPreset(
    name: string,
    intensity: number,
    params: Partial<AdvancedFilterParams>
  ): { name: string; intensity: number; params: AdvancedFilterParams } {
    return {
      name,
      intensity: Math.max(0, Math.min(1, intensity)),
      params: this.normalizeAdvancedParams(params)
    };
  }

  /**
   * Applique un preset de filtre
   */
  async applyFilterPreset(preset: {
    name: string;
    intensity: number;
    params: AdvancedFilterParams;
  }): Promise<boolean> {
    return this.setFilterWithParams(preset.name, preset.intensity, preset.params);
  }

  /**
   * Réinitialise tous les paramètres
   */
  async reset(): Promise<boolean> {
    const cleared = await this.clearFilter();
    if (cleared) {
      // Réinitialiser au processeur par défaut si nécessaire
      const caps = await this.getCapabilities();
      if (caps.currentProcessor !== ProcessorType.FFMPEG) {
        await this.setProcessor(ProcessorType.FFMPEG);
      }
    }
    return cleared;
  }

  /**
   * Obtient un rapport de diagnostic complet
   */
  async getDiagnostics(): Promise<{
    capabilities: FilterCapabilities;
    currentFilter: FilterStateWithParams | null;
    videoFormat: VideoFormat | null;
    performance: PerformanceConfig;
    error: string | null;
  }> {
    const [capabilities, currentFilter, videoFormat, performance, error] = await Promise.all([
      this.getCapabilities(),
      this.getFilterWithParams(),
      this.getVideoFormat(),
      this.getPerformanceConfig(),
      this.getLastError()
    ]);

    return {
      capabilities,
      currentFilter,
      videoFormat,
      performance,
      error
    };
  }
}

// Export singleton
export const cameraFiltersAPI = CameraFiltersAPI.getInstance();

// Export des types réutilisables
export type {
  FilterState,
  FilterStateWithParams,
  FilterInfo,
  FilterType,
  ProcessorType,
  AdvancedFilterParams,
  LUT3DOptions,
  VideoFormat,
  FilterCapabilities,
  PerformanceConfig
};
