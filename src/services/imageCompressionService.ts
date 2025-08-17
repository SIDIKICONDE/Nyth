import ImageResizer from "@bam.tech/react-native-image-resizer";
import { Platform } from "react-native";

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: "JPEG" | "PNG" | "WEBP";
}

export interface CompressionResult {
  uri: string;
  width: number;
  height: number;
  size: number;
}

class ImageCompressionService {
  private defaultOptions: CompressionOptions = {
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 0.8,
    format: "JPEG",
  };

  async compressImage(
    uri: string,
    options: CompressionOptions = {}
  ): Promise<CompressionResult> {
    try {
      const finalOptions = { ...this.defaultOptions, ...options };

      const result = await ImageResizer.createResizedImage(
        uri,
        finalOptions.maxWidth!,
        finalOptions.maxHeight!,
        finalOptions.format!,
        finalOptions.quality!,
        0,
        undefined,
        false,
        { mode: "contain", onlyScaleDown: true }
      );

      return {
        uri: result.uri,
        width: result.width,
        height: result.height,
        size: result.size,
      };
    } catch (error) {
      // En cas d'erreur, retourner l'image originale
      return {
        uri,
        width: 0,
        height: 0,
        size: 0,
      };
    }
  }

  async createThumbnail(
    uri: string,
    size: number = 200
  ): Promise<CompressionResult> {
    return this.compressImage(uri, {
      maxWidth: size,
      maxHeight: size,
      quality: 0.6,
      format: "JPEG",
    });
  }

  shouldCompressImage(uri: string, maxSizeMB: number = 5): boolean {
    // Pour l'instant, on compresse toujours
    // Plus tard, on pourrait vérifier la taille du fichier
    return true;
  }

  getOptimalCompressionOptions(
    originalWidth: number,
    originalHeight: number
  ): CompressionOptions {
    const maxDimension = 1920;
    const aspectRatio = originalWidth / originalHeight;

    if (aspectRatio > 1) {
      // Image horizontale
      return {
        maxWidth: maxDimension,
        maxHeight: Math.round(maxDimension / aspectRatio),
        quality: 0.8,
        format: "JPEG",
      };
    } else {
      // Image verticale
      return {
        maxWidth: Math.round(maxDimension * aspectRatio),
        maxHeight: maxDimension,
        quality: 0.8,
        format: "JPEG",
      };
    }
  }
}

export const imageCompressionService = new ImageCompressionService();
