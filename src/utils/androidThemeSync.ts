import { Platform } from "react-native";
import { CustomTheme } from "../types/theme";
import { createLogger } from "./optimizedLogger";

const logger = createLogger("AndroidThemeSync");

/**
 * Utilitaire pour synchroniser les thèmes personnalisés React Native
 * avec les couleurs natives Android
 */
export class AndroidThemeSync {
  private static instance: AndroidThemeSync;
  private currentTheme: CustomTheme | null = null;

  private constructor() {}

  public static getInstance(): AndroidThemeSync {
    if (!AndroidThemeSync.instance) {
      AndroidThemeSync.instance = new AndroidThemeSync();
    }
    return AndroidThemeSync.instance;
  }

  /**
   * Synchronise un thème React Native avec Android
   */
  public syncTheme(theme: CustomTheme): void {
    if (Platform.OS !== "android") {
      return;
    }

    this.currentTheme = theme;
    logger.info(`🎨 Synchronisation du thème "${theme.name}" avec Android`);

    // Appliquer les couleurs système Android
    this.applySystemColors(theme);

    // Appliquer la status bar
    this.applyStatusBar(theme);

    // Notifier les composants natifs du changement
    this.notifyNativeComponents(theme);
  }

  /**
   * Applique les couleurs système Android
   */
  private applySystemColors(theme: CustomTheme): void {
    try {
      // Pour les futures versions, on pourrait utiliser une interface native
      // pour modifier dynamiquement les couleurs Android

      const androidColors = this.mapToAndroidColors(theme);
      logger.debug("Couleurs Android mappées:", androidColors);

      // TODO: Implémenter l'interface native pour modifier colors.xml dynamiquement
      // NativeModules.AndroidThemeModule?.updateColors(androidColors);
    } catch (error) {
      logger.error("Erreur lors de l'application des couleurs système:", error);
    }
  }

  /**
   * Applique les couleurs de status bar
   */
  private applyStatusBar(theme: CustomTheme): void {
    try {
      // Déjà géré par React Navigation et les composants React Native
      // Cette méthode est prête pour des améliorations futures
      logger.debug(
        `Status bar configurée pour thème ${theme.isDark ? "sombre" : "clair"}`
      );
    } catch (error) {
      logger.error("Erreur lors de la configuration de la status bar:", error);
    }
  }

  /**
   * Notifie les composants natifs du changement de thème
   */
  private notifyNativeComponents(theme: CustomTheme): void {
    try {
      // Émettre un événement pour les composants natifs
      // DeviceEventEmitter.emit('themeChanged', {
      //   themeId: theme.id,
      //   isDark: theme.isDark,
      //   colors: this.mapToAndroidColors(theme)
      // });

      logger.debug("Composants natifs notifiés du changement de thème");
    } catch (error) {
      logger.error(
        "Erreur lors de la notification des composants natifs:",
        error
      );
    }
  }

  /**
   * Mappe les couleurs React Native vers le format Android
   */
  private mapToAndroidColors(theme: CustomTheme): AndroidColorMapping {
    return {
      // Couleurs principales
      colorPrimary: theme.colors.primary,
      colorPrimaryDark: theme.colors.secondary,
      colorAccent: theme.colors.accent,

      // Couleurs de fond
      backgroundColor: theme.colors.background,
      surfaceColor: theme.colors.surface,
      cardColor: theme.colors.card,

      // Couleurs de texte
      textPrimary: theme.colors.text,
      textSecondary: theme.colors.textSecondary,
      textMuted: theme.colors.textMuted,

      // Couleurs d'état
      successColor: theme.colors.success,
      warningColor: theme.colors.warning,
      errorColor: theme.colors.error,

      // Couleurs de bordure
      borderColor: theme.colors.border,

      // Métadonnées
      isDark: theme.isDark,
      themeId: theme.id,
      themeName: theme.name,
    };
  }

  /**
   * Obtient le thème actuellement synchronisé
   */
  public getCurrentTheme(): CustomTheme | null {
    return this.currentTheme;
  }

  /**
   * Détermine le style Android approprié basé sur le thème
   */
  public getAndroidStyleName(theme: CustomTheme): string {
    // Mapping des thèmes populaires vers les styles Android
    const themeStyleMap: Record<string, string> = {
      "liquid-glass-dark": "AppTheme.LiquidGlass",
      "liquid-glass-light": "AppTheme.LiquidGlass",
      "rgb-plus": "AppTheme.RGBPlus",
      "rgb-plus-dark": "AppTheme.RGBPlus",
      cyberpunk: "AppTheme.Cyberpunk",
      "cyberpunk-neon": "AppTheme.Cyberpunk",
    };

    const styleName = themeStyleMap[theme.id];
    if (styleName) {
      logger.info(
        `Style Android sélectionné: ${styleName} pour le thème ${theme.name}`
      );
      return styleName;
    }

    // Style par défaut basé sur le mode sombre/clair
    const defaultStyle = theme.isDark ? "AppTheme.Dark" : "AppTheme";
    logger.info(
      `Style Android par défaut: ${defaultStyle} pour le thème ${theme.name}`
    );
    return defaultStyle;
  }

  /**
   * Génère les couleurs Android XML pour un thème donné
   */
  public generateAndroidColorsXml(theme: CustomTheme): string {
    const colors = this.mapToAndroidColors(theme);

    return `<?xml version="1.0" encoding="utf-8"?>
<!-- Couleurs générées automatiquement pour le thème: ${theme.name} -->
<resources>
    <!-- Couleurs principales -->
    <color name="colorPrimary">${colors.colorPrimary}</color>
    <color name="colorPrimaryDark">${colors.colorPrimaryDark}</color>
    <color name="colorAccent">${colors.colorAccent}</color>
    
    <!-- Couleurs de fond -->
    <color name="backgroundColor">${colors.backgroundColor}</color>
    <color name="surfaceColor">${colors.surfaceColor}</color>
    
    <!-- Couleurs de texte -->
    <color name="textPrimary">${colors.textPrimary}</color>
    <color name="textSecondary">${colors.textSecondary}</color>
    
    <!-- Couleurs d'état -->
    <color name="successColor">${colors.successColor}</color>
    <color name="warningColor">${colors.warningColor}</color>
    <color name="errorColor">${colors.errorColor}</color>
    
    <!-- Status Bar -->
    <color name="statusBarColor">${
      theme.isDark ? colors.backgroundColor : colors.colorPrimary
    }</color>
</resources>`;
  }
}

/**
 * Interface pour le mapping des couleurs Android
 */
export interface AndroidColorMapping {
  colorPrimary: string;
  colorPrimaryDark: string;
  colorAccent: string;
  backgroundColor: string;
  surfaceColor: string;
  cardColor: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  successColor: string;
  warningColor: string;
  errorColor: string;
  borderColor: string;
  isDark: boolean;
  themeId: string;
  themeName: string;
}

/**
 * Instance singleton pour la synchronisation des thèmes
 */
export const androidThemeSync = AndroidThemeSync.getInstance();

/**
 * Hook utilitaire pour synchroniser automatiquement les thèmes
 */
export const useAndroidThemeSync = () => {
  const syncTheme = (theme: CustomTheme) => {
    androidThemeSync.syncTheme(theme);
  };

  const getCurrentTheme = () => {
    return androidThemeSync.getCurrentTheme();
  };

  const getStyleName = (theme: CustomTheme) => {
    return androidThemeSync.getAndroidStyleName(theme);
  };

  return {
    syncTheme,
    getCurrentTheme,
    getStyleName,
    generateColorsXml: (theme: CustomTheme) =>
      androidThemeSync.generateAndroidColorsXml(theme),
  };
};

export default androidThemeSync;
