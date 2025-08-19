// Ce fichier ne doit pas importer l'API namespacée Firestore

// Interface pour les métadonnées d'enregistrement dans Firestore
export interface RecordingMetadata {
  id: string;
  userId: string;
  scriptId?: string;
  scriptTitle?: string;
  duration: number;
  localFileName: string;
  thumbnailFileName?: string;
  createdAt: any;
  updatedAt?: any;
  // Pas d'URL vidéo - seulement les métadonnées
  iosPhotoLibraryUri?: string; // URI de la vidéo dans la photothèque iOS
}

// Interface pour les données de script dans Firestore
export interface ScriptData {
  id: string;
  userId: string;
  title: string;
  content: string;
  isFavorite: boolean;
  createdAt: any;
  updatedAt: any;
}

// Options d'optimisation d'image
export interface ImageOptimizationOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  format: "jpeg" | "png";
}

// Résultat d'optimisation d'image
export interface OptimizedImage {
  uri: string;
  width: number;
  height: number;
}
