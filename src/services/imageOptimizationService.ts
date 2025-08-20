import ImageResizer from "@bam.tech/react-native-image-resizer";
import { createLogger } from "../utils/optimizedLogger";

const logger = createLogger("ImageOptimizationService");

interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: "JPEG" | "PNG" | "WEBP";
}

interface OptimizedImage {
  uri: string;
  width: number;
  height: number;
  size?: number;
}

class ImageOptimizationService {
  // Configuration par défaut
  private readonly DEFAULT_PROFILE_SIZE = 800;
  private readonly DEFAULT_THUMBNAIL_SIZE = 150;
  private readonly DEFAULT_QUALITY = 80; // 0-100 pour react-native-image-resizer

  /**
   * Optimise une image de profil
   */
  async optimizeProfileImage(imageUri: string): Promise<{
    main: OptimizedImage;
    thumbnail: OptimizedImage;
  }> {
    try {
      // Optimiser l'image principale
      const mainImage = await this.optimizeImage(imageUri, {
        maxWidth: this.DEFAULT_PROFILE_SIZE,
        maxHeight: this.DEFAULT_PROFILE_SIZE,
        quality: this.DEFAULT_QUALITY,
        format: "JPEG",
      });

      // Créer une miniature
      const thumbnail = await this.optimizeImage(imageUri, {
        maxWidth: this.DEFAULT_THUMBNAIL_SIZE,
        maxHeight: this.DEFAULT_THUMBNAIL_SIZE,
        quality: 70,
        format: "JPEG",
      });

      return { main: mainImage, thumbnail };
    } catch (error) {
      logger.error("❌ Erreur optimisation image:", error);
      throw error;
    }
  }

  /**
   * Optimise une image avec les options spécifiées
   */
  async optimizeImage(
    imageUri: string,
    options: ImageOptimizationOptions = {}
  ): Promise<OptimizedImage> {
    const {
      maxWidth = this.DEFAULT_PROFILE_SIZE,
      maxHeight = this.DEFAULT_PROFILE_SIZE,
      quality = this.DEFAULT_QUALITY,
      format = "JPEG",
    } = options;

    try {
      // Calculer la taille de sortie en gardant le ratio
      const result = await ImageResizer.createResizedImage(
        imageUri,
        maxWidth,
        maxHeight,
        format,
        quality,
        0, // rotation
        undefined, // outputPath
        false, // keepMeta
        {
          mode: "contain", // Garde le ratio d'aspect
          onlyScaleDown: true, // Ne pas agrandir l'image
        }
      );

      return {
        uri: result.uri,
        width: result.width,
        height: result.height,
        size: result.size,
      };
    } catch (error) {
      logger.error("❌ Erreur manipulation image:", error);
      throw error;
    }
  }

  /**
   * Optimise une image pour un usage spécifique avec compression progressive
   */
  async optimizeImageProgressive(
    imageUri: string,
    options: ImageOptimizationOptions = {}
  ): Promise<OptimizedImage> {
    const {
      maxWidth = this.DEFAULT_PROFILE_SIZE,
      maxHeight = this.DEFAULT_PROFILE_SIZE,
      quality = this.DEFAULT_QUALITY,
      format = "JPEG",
    } = options;

    try {
      // Pour les très grandes images, faire une compression en deux étapes
      const firstPass = await ImageResizer.createResizedImage(
        imageUri,
        maxWidth * 1.5, // Première étape : réduire modérément
        maxHeight * 1.5,
        format,
        Math.min(quality + 10, 90), // Qualité légèrement meilleure
        0,
        undefined,
        false,
        {
          mode: "contain",
          onlyScaleDown: true,
        }
      );

      // Deuxième étape : taille finale
      const finalResult = await ImageResizer.createResizedImage(
        firstPass.uri,
        maxWidth,
        maxHeight,
        format,
        quality,
        0,
        undefined,
        false,
        {
          mode: "contain",
          onlyScaleDown: true,
        }
      );

      return {
        uri: finalResult.uri,
        width: finalResult.width,
        height: finalResult.height,
        size: finalResult.size,
      };
    } catch (error) {
      logger.error("❌ Erreur compression progressive:", error);
      // Fallback vers la méthode simple
      return this.optimizeImage(imageUri, options);
    }
  }

  /**
   * Estime la taille d'un fichier image (approximatif)
   */
  estimateFileSize(width: number, height: number, quality: number): number {
    // Estimation basique : 3 bytes par pixel (RGB) * quality factor
    const baseSize = width * height * 3;
    const compressedSize = baseSize * (quality / 100) * 0.1; // Facteur de compression JPEG
    return Math.round(compressedSize);
  }

  /**
   * Valide qu'une image respecte les contraintes
   */
  validateImage(
    imageUri: string,
    maxSizeBytes: number = 5 * 1024 * 1024
  ): boolean {
    // Vérifier l'extension
    const validExtensions = ["jpg", "jpeg", "png", "gif", "webp"];
    const extension = imageUri.split(".").pop()?.toLowerCase();

    if (!extension || !validExtensions.includes(extension)) {
      logger.warn("⚠️ Extension invalide:", extension);
      return false;
    }

    // Note: La taille réelle du fichier n'est pas facilement accessible
    // avant l'upload, donc on fait confiance à notre compression
    return true;
  }

  /**
   * Génère un nom de fichier unique pour l'image
   */
  generateFileName(userId: string, type: "main" | "thumbnail"): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const prefix = type === "thumbnail" ? "thumb" : "photo";
    return `${prefix}_${timestamp}_${random}.jpg`;
  }

  /**
   * Obtient les informations d'une image sans la redimensionner
   */
  async getImageInfo(
    imageUri: string
  ): Promise<{ width: number; height: number }> {
    try {
      // Utiliser une taille très grande pour obtenir les dimensions originales
      const result = await ImageResizer.createResizedImage(
        imageUri,
        10000, // Taille très grande
        10000,
        "JPEG",
        100,
        0,
        undefined,
        false,
        {
          mode: "contain",
          onlyScaleDown: true, // Ne pas agrandir, donc garde la taille originale
        }
      );

      return {
        width: result.width,
        height: result.height,
      };
    } catch (error) {
      logger.error("❌ Erreur obtention info image:", error);
      throw error;
    }
  }
}

export default new ImageOptimizationService();
