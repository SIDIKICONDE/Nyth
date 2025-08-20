import { Dimensions, ViewStyle } from "react-native";

/**
 * Utilitaire centralisé pour la détection des types d'appareils
 */
export const deviceUtils = {
  /**
   * Détecte si l'appareil est une tablette selon des critères unifiés
   */
  isTablet: (): boolean => {
    const { width, height } = Dimensions.get("window");
    const minDimension = Math.min(width, height);
    const maxDimension = Math.max(width, height);
    const diagonalInches = Math.sqrt(width * width + height * height) / 160;

    return (
      minDimension >= 768 ||
      maxDimension >= 1024 ||
      diagonalInches >= 7 ||
      (width >= 768 && height >= 1024)
    );
  },

  /**
   * Retourne les dimensions de l'écran
   */
  getScreenDimensions: () => {
    const { width, height } = Dimensions.get("window");
    return { width, height };
  },

  /**
   * Calcule les dimensions optimales pour la caméra selon le type d'appareil
   */
  getCameraStyle: (aspectRatio?: {
    width: number;
    height: number;
  }): ViewStyle => {
    const { width: screenWidth, height: screenHeight } =
      Dimensions.get("window");
    const isTablet = deviceUtils.isTablet();

    if (isTablet) {
      // Pour les tablettes, utiliser 100% mais sans position absolue
      return {
        width: "100%",
        height: "100%",
        // Assurer que la caméra remplit tout l'espace disponible
        flex: 1,
      };
    }

    // Pour les téléphones, calculer les dimensions basées sur l'aspect ratio
    if (!aspectRatio) {
      return {
        width: screenWidth,
        height: screenHeight,
        flex: 1,
      };
    }

    const ratio = aspectRatio.width / aspectRatio.height;
    const isPortraitRatio = aspectRatio.width < aspectRatio.height;

    let width, height;

    if (isPortraitRatio) {
      // Pour un ratio portrait, prioriser la hauteur
      height = screenHeight;
      width = height * ratio;
      if (width > screenWidth) {
        width = screenWidth;
        height = width / ratio;
      }
    } else {
      // Pour un ratio paysage, prioriser la largeur
      width = screenWidth;
      height = width / ratio;
      if (height > screenHeight) {
        height = screenHeight;
        width = height * ratio;
      }
    }

    return {
      width: Math.round(width),
      height: Math.round(height),
      flex: 1,
    };
  },

  /**
   * Calcule le style du conteneur pour la caméra
   */
  getCameraContainerStyle: (aspectRatio?: {
    width: number;
    height: number;
  }): ViewStyle => {
    const isTablet = deviceUtils.isTablet();

    if (isTablet) {
      // Pour les tablettes, utiliser tout l'espace disponible sans position absolue
      return {
        flex: 1,
        width: "100%",
        height: "100%",
      };
    }

    // Pour les téléphones, utiliser les dimensions calculées
    const cameraStyle = deviceUtils.getCameraStyle(aspectRatio);
    return {
      flex: 1,
      width: cameraStyle.width,
      height: cameraStyle.height,
    };
  },

  /**
   * Retourne le mode de redimensionnement approprié
   */
  getResizeMode: (): "cover" | "contain" => {
    return deviceUtils.isTablet() ? "cover" : "contain";
  },

  /**
   * Informations de debug sur l'appareil
   */
  getDeviceInfo: () => {
    const { width, height } = Dimensions.get("window");
    const minDimension = Math.min(width, height);
    const maxDimension = Math.max(width, height);
    const diagonalInches = Math.sqrt(width * width + height * height) / 160;
    const isTablet = deviceUtils.isTablet();

    return {
      screenWidth: width,
      screenHeight: height,
      minDimension,
      maxDimension,
      diagonalInches: Math.round(diagonalInches * 10) / 10,
      isTablet,
      deviceType: isTablet ? "Tablette" : "Téléphone",
    };
  },
};
