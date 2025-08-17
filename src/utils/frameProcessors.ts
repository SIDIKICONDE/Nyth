import { runOnJS } from "react-native-reanimated";
import { Frame, FrameProcessorPlugin } from "react-native-vision-camera";

// Types pour les Frame Processors
export interface FrameProcessorResult {
  type: "face" | "object" | "text" | "barcode" | "custom";
  data: any;
  confidence?: number;
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface FrameProcessorOptions {
  // Fréquence de traitement (1 = toutes les frames, 2 = une frame sur deux, etc.)
  processingInterval: number;

  // Résolution de traitement (pour optimiser les performances)
  processingResolution?: {
    width: number;
    height: number;
  };

  // Format de pixel préféré
  pixelFormat: "yuv" | "rgb";

  // Callback pour les résultats
  onResult?: (results: FrameProcessorResult[]) => void;

  // Callback pour les erreurs
  onError?: (error: Error) => void;
}

// Compteur de frames pour l'intervalle de traitement
let frameCounter = 0;

/**
 * Créer un Frame Processor optimisé pour la détection en temps réel
 * Utilise react-native-reanimated au lieu de react-native-worklets
 */
export const createOptimizedFrameProcessor = (
  options: FrameProcessorOptions,
  processingFunction: (
    frame: Frame
  ) => FrameProcessorResult[] | Promise<FrameProcessorResult[]>
) => {
  return (frame: Frame) => {
    // Vérifier l'intervalle de traitement
    frameCounter++;
    if (frameCounter % options.processingInterval !== 0) {
      return;
    }

    try {
      // Traitement de la frame
      const results = processingFunction(frame);

      // Si c'est une promesse, la gérer
      if (results instanceof Promise) {
        results
          .then((resolvedResults) => {
            if (options.onResult) {
              runOnJS(options.onResult)(resolvedResults);
            }
          })
          .catch((error) => {
            if (options.onError) {
              runOnJS(options.onError)(error);
            }
          });
      } else {
        // Résultat synchrone
        if (options.onResult) {
          runOnJS(options.onResult)(results);
        }
      }
    } catch (error) {
      if (options.onError) {
        runOnJS(options.onError)(error as Error);
      }
    }
  };
};

/**
 * Frame Processor pour la détection de visages (exemple)
 */
export const createFaceDetectionProcessor = (
  onFacesDetected: (faces: FrameProcessorResult[]) => void,
  processingInterval: number = 5
) => {
  return createOptimizedFrameProcessor(
    {
      processingInterval,
      pixelFormat: "rgb", // Nécessaire pour la plupart des modèles de détection de visages
      onResult: onFacesDetected,
      onError: (error) => void 0,
    },
    (frame: Frame) => {
      // Ici, vous intégreriez votre bibliothèque de détection de visages
      // Par exemple: MLKit, TensorFlow Lite, ou un plugin personnalisé

      // Exemple de structure de retour
      return [
        {
          type: "face" as const,
          confidence: 0.95,
          bounds: {
            x: 100,
            y: 150,
            width: 200,
            height: 250,
          },
          data: {
            landmarks: {
              leftEye: { x: 150, y: 200 },
              rightEye: { x: 250, y: 200 },
              nose: { x: 200, y: 250 },
              mouth: { x: 200, y: 300 },
            },
            emotions: {
              happy: 0.8,
              sad: 0.1,
              neutral: 0.1,
            },
          },
        },
      ];
    }
  );
};

/**
 * Frame Processor pour la détection d'objets (exemple)
 */
export const createObjectDetectionProcessor = (
  onObjectsDetected: (objects: FrameProcessorResult[]) => void,
  processingInterval: number = 10
) => {
  return createOptimizedFrameProcessor(
    {
      processingInterval,
      pixelFormat: "rgb",
      onResult: onObjectsDetected,
      onError: (error) => void 0,
    },
    (frame: Frame) => {
      // Ici, vous intégreriez votre modèle de détection d'objets
      // Par exemple: YOLO, MobileNet, etc.

      return [
        {
          type: "object" as const,
          confidence: 0.87,
          bounds: {
            x: 50,
            y: 100,
            width: 300,
            height: 400,
          },
          data: {
            label: "person",
            category: "human",
          },
        },
      ];
    }
  );
};

/**
 * Frame Processor pour l'analyse de qualité vidéo
 */
export const createVideoQualityProcessor = (
  onQualityAnalysis: (analysis: FrameProcessorResult[]) => void,
  processingInterval: number = 30 // Analyser moins fréquemment
) => {
  return createOptimizedFrameProcessor(
    {
      processingInterval,
      pixelFormat: "yuv", // YUV est plus efficace pour l'analyse de qualité
      onResult: onQualityAnalysis,
      onError: (error) => void 0,
    },
    (frame: Frame) => {
      // Analyse basique de la qualité (luminosité, contraste, etc.)
      // Ici vous pourriez calculer des métriques comme:
      // - Luminosité moyenne
      // - Contraste
      // - Netteté
      // - Détection de flou

      return [
        {
          type: "custom" as const,
          data: {
            brightness: 0.6, // 0-1
            contrast: 0.8, // 0-1
            sharpness: 0.7, // 0-1
            blur: 0.2, // 0-1 (0 = net, 1 = très flou)
            recommendation: "good", // "good", "warning", "poor"
          },
        },
      ];
    }
  );
};

/**
 * Utilitaire pour mesurer les performances des Frame Processors
 */
export const createPerformanceMonitor = () => {
  let frameCount = 0;
  let lastTimestamp = Date.now();
  let fpsHistory: number[] = [];

  return {
    measureFrame: () => {
      frameCount++;
      const now = Date.now();

      if (now - lastTimestamp >= 1000) {
        const fps = frameCount;
        frameCount = 0;
        lastTimestamp = now;

        runOnJS((currentFps: number) => {
          fpsHistory.push(currentFps);
          if (fpsHistory.length > 10) {
            fpsHistory.shift();
          }

          const avgFps =
            fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length;
        })(fps);
      }
    },

    reset: () => {
      frameCount = 0;
      lastTimestamp = Date.now();
      fpsHistory = [];
    },
  };
};

/**
 * Configuration recommandée pour différents types d'usage
 */
export const FrameProcessorPresets = {
  // Pour la détection de visages en temps réel
  FACE_DETECTION: {
    processingInterval: 3,
    pixelFormat: "rgb" as const,
    processingResolution: { width: 640, height: 480 },
  },

  // Pour la détection d'objets
  OBJECT_DETECTION: {
    processingInterval: 5,
    pixelFormat: "rgb" as const,
    processingResolution: { width: 416, height: 416 }, // Format YOLO
  },

  // Pour l'analyse de qualité vidéo
  QUALITY_ANALYSIS: {
    processingInterval: 30,
    pixelFormat: "yuv" as const,
    processingResolution: { width: 320, height: 240 },
  },

  // Pour les effets en temps réel (filtres, etc.)
  REAL_TIME_EFFECTS: {
    processingInterval: 1,
    pixelFormat: "rgb" as const,
    processingResolution: { width: 1280, height: 720 },
  },

  // Pour l'analyse de performance
  PERFORMANCE_MONITORING: {
    processingInterval: 1,
    pixelFormat: "yuv" as const,
  },
};
