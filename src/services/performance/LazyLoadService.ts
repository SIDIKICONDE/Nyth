import { InteractionManager } from "react-native";

export class LazyLoadService {
  private static loadedModules = new Set<string>();
  private static loadingPromises = new Map<string, Promise<any>>();

  /**
   * Charge un module de manière lazy avec mise en cache
   */
  static async loadModule<T>(
    moduleName: string,
    loader: () => Promise<T>
  ): Promise<T> {
    // Si déjà en cours de chargement, retourner la promesse existante
    if (this.loadingPromises.has(moduleName)) {
      return this.loadingPromises.get(moduleName) as Promise<T>;
    }

    // Si déjà chargé, charger directement
    if (this.loadedModules.has(moduleName)) {
      return loader();
    }

    // Créer une nouvelle promesse de chargement
    const loadPromise = new Promise<T>((resolve, reject) => {
      // Attendre que les interactions soient terminées
      InteractionManager.runAfterInteractions(async () => {
        try {
          const module = await loader();
          this.loadedModules.add(moduleName);
          this.loadingPromises.delete(moduleName);
          resolve(module);
        } catch (error) {
          this.loadingPromises.delete(moduleName);
          reject(error);
        }
      });
    });

    this.loadingPromises.set(moduleName, loadPromise);
    return loadPromise;
  }

  /**
   * Précharge plusieurs modules en parallèle
   */
  static async preloadModules(
    modules: Array<{ name: string; loader: () => Promise<any> }>
  ): Promise<void> {
    const promises = modules.map(({ name, loader }) =>
      this.loadModule(name, loader).catch(() => {
        // Ignorer les erreurs de préchargement
      })
    );

    await Promise.all(promises);
  }

  /**
   * Charge un module après un délai
   */
  static async loadModuleDelayed<T>(
    moduleName: string,
    loader: () => Promise<T>,
    delay: number = 1000
  ): Promise<T> {
    return new Promise((resolve) => {
      setTimeout(async () => {
        const module = await this.loadModule(moduleName, loader);
        resolve(module);
      }, delay);
    });
  }

  /**
   * Charge un module uniquement si nécessaire (avec condition)
   */
  static async loadModuleConditional<T>(
    moduleName: string,
    loader: () => Promise<T>,
    condition: () => boolean | Promise<boolean>
  ): Promise<T | null> {
    const shouldLoad = await Promise.resolve(condition());
    
    if (shouldLoad) {
      return this.loadModule(moduleName, loader);
    }
    
    return null;
  }

  /**
   * Nettoie le cache des modules chargés
   */
  static clearCache(moduleName?: string): void {
    if (moduleName) {
      this.loadedModules.delete(moduleName);
      this.loadingPromises.delete(moduleName);
    } else {
      this.loadedModules.clear();
      this.loadingPromises.clear();
    }
  }

  /**
   * Vérifie si un module est chargé
   */
  static isLoaded(moduleName: string): boolean {
    return this.loadedModules.has(moduleName);
  }

  /**
   * Obtient la liste des modules chargés
   */
  static getLoadedModules(): string[] {
    return Array.from(this.loadedModules);
  }
}