import { Platform } from "react-native";
import RNFS from "react-native-fs";

export interface StorageDiagnostics {
  platform: string;
  directories: {
    document: string;
    cache: string;
    temporary: string;
    mainBundle: string;
  };
  directoryStatus: {
    [key: string]: {
      exists: boolean;
      readable: boolean;
      writable: boolean;
      error?: string;
    };
  };
  freeSpace?: {
    total: number;
    free: number;
    used: number;
    usedPercent: number;
  };
  permissions: {
    [key: string]: boolean;
  };
  timestamp: string;
}

/**
 * Effectue un diagnostic complet du système de stockage
 */
export const diagnoseStorageSystem = async (): Promise<StorageDiagnostics> => {
  const diagnostics: StorageDiagnostics = {
    platform: Platform.OS,
    directories: {
      document: RNFS.DocumentDirectoryPath,
      cache: RNFS.CachesDirectoryPath,
      temporary: RNFS.TemporaryDirectoryPath,
      mainBundle: RNFS.MainBundlePath,
    },
    directoryStatus: {},
    permissions: {},
    timestamp: new Date().toISOString(),
  };

  // Diagnostiquer chaque répertoire
  const dirsToCheck = [
    { name: "document", path: RNFS.DocumentDirectoryPath },
    { name: "cache", path: RNFS.CachesDirectoryPath },
    { name: "temporary", path: RNFS.TemporaryDirectoryPath },
    { name: "mainBundle", path: RNFS.MainBundlePath },
  ];

  for (const dir of dirsToCheck) {
    try {
      const status = await diagnoseDirectory(dir.path);
      diagnostics.directoryStatus[dir.name] = status;
    } catch (error) {
      diagnostics.directoryStatus[dir.name] = {
        exists: false,
        readable: false,
        writable: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Obtenir les informations sur l'espace libre
  try {
    const fsInfo = await RNFS.getFSInfo();
    diagnostics.freeSpace = {
      total: fsInfo.totalSpace,
      free: fsInfo.freeSpace,
      used: fsInfo.totalSpace - fsInfo.freeSpace,
      usedPercent: Math.round(
        ((fsInfo.totalSpace - fsInfo.freeSpace) / fsInfo.totalSpace) * 100
      ),
    };
  } catch (error) {}

  // Vérifier les permissions spécifiques à la plateforme
  if (Platform.OS === "android") {
    try {
      const { PermissionsAndroid } = require("react-native");
      diagnostics.permissions.writeExternalStorage =
        await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
        );
    } catch (error) {}
  }

  return diagnostics;
};

/**
 * Diagnostique un répertoire spécifique
 */
export const diagnoseDirectory = async (dirPath: string) => {
  const status = {
    exists: false,
    readable: false,
    writable: false,
    error: undefined as string | undefined,
  };

  try {
    // Vérifier si le répertoire existe
    status.exists = await RNFS.exists(dirPath);

    if (!status.exists) {
      return status;
    }

    // Tester la lecture
    try {
      await RNFS.readDir(dirPath);
      status.readable = true;
    } catch (readError) {
      status.error = `Lecture impossible: ${
        readError instanceof Error ? readError.message : "Unknown error"
      }`;
    }

    // Tester l'écriture
    try {
      const testFile = `${dirPath}/test-write-${Date.now()}.txt`;
      await RNFS.writeFile(testFile, "test");
      await RNFS.unlink(testFile);
      status.writable = true;
    } catch (writeError) {
      status.error = `Écriture impossible: ${
        writeError instanceof Error ? writeError.message : "Unknown error"
      }`;
    }
  } catch (error) {
    status.error = `Erreur générale: ${
      error instanceof Error ? error.message : "Unknown error"
    }`;
  }

  return status;
};

/**
 * Formate les diagnostics pour l'affichage
 */
export const formatStorageDiagnostics = (
  diagnostics: StorageDiagnostics
): string => {
  const lines: string[] = [];

  lines.push(`📊 Diagnostics du Stockage (${diagnostics.platform})`);
  lines.push(`🕐 ${new Date(diagnostics.timestamp).toLocaleString()}`);
  lines.push("");

  // Espace libre
  if (diagnostics.freeSpace) {
    const fs = diagnostics.freeSpace;
    lines.push(`💾 Espace Disque:`);
    lines.push(`  Total: ${formatBytes(fs.total)}`);
    lines.push(`  Libre: ${formatBytes(fs.free)}`);
    lines.push(`  Utilisé: ${formatBytes(fs.used)} (${fs.usedPercent}%)`);
    lines.push("");
  }

  // État des répertoires
  lines.push(`📁 État des Répertoires:`);
  for (const [name, status] of Object.entries(diagnostics.directoryStatus)) {
    const exists = status.exists ? "✅" : "❌";
    const readable = status.readable ? "👁️" : "❌";
    const writable = status.writable ? "✏️" : "❌";

    lines.push(`  ${name}: ${exists} ${readable} ${writable}`);
    if (status.error) {
      lines.push(`    ⚠️ ${status.error}`);
    }
  }

  // Permissions
  if (Object.keys(diagnostics.permissions).length > 0) {
    lines.push("");
    lines.push(`🔐 Permissions:`);
    for (const [perm, granted] of Object.entries(diagnostics.permissions)) {
      const status = granted ? "✅" : "❌";
      lines.push(`  ${perm}: ${status}`);
    }
  }

  return lines.join("\n");
};

/**
 * Formate les octets en unités lisibles
 */
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * Vérifie si l'espace libre est suffisant
 */
export const hasEnoughFreeSpace = (
  diagnostics: StorageDiagnostics,
  requiredMB: number = 100
): boolean => {
  if (!diagnostics.freeSpace) return true; // Si on ne peut pas vérifier, on assume que c'est ok

  const requiredBytes = requiredMB * 1024 * 1024;
  return diagnostics.freeSpace.free >= requiredBytes;
};

/**
 * Trouve le meilleur répertoire pour l'écriture
 */
export const findBestWritableDirectory = (
  diagnostics: StorageDiagnostics
): string | null => {
  const priorities = ["document", "cache", "temporary"];

  for (const priority of priorities) {
    const status = diagnostics.directoryStatus[priority];
    if (status?.exists && status?.writable) {
      return diagnostics.directories[
        priority as keyof typeof diagnostics.directories
      ];
    }
  }

  return null;
};

/**
 * Génère des recommandations basées sur les diagnostics
 */
export const generateStorageRecommendations = (
  diagnostics: StorageDiagnostics
): string[] => {
  const recommendations: string[] = [];

  // Vérifier l'espace libre
  if (diagnostics.freeSpace) {
    if (diagnostics.freeSpace.usedPercent > 90) {
      recommendations.push(
        "📱 Espace de stockage très faible (>90% utilisé). Libérez de l'espace en supprimant des fichiers inutiles."
      );
    } else if (diagnostics.freeSpace.usedPercent > 80) {
      recommendations.push(
        "⚠️ Espace de stockage faible (>80% utilisé). Considérez libérer de l'espace."
      );
    }
  }

  // Vérifier les répertoires
  const workingDirs = Object.entries(diagnostics.directoryStatus).filter(
    ([, status]) => status.exists && status.writable
  );

  if (workingDirs.length === 0) {
    recommendations.push(
      "❌ Aucun répertoire accessible en écriture. Redémarrez l'application ou contactez le support."
    );
  } else if (workingDirs.length === 1) {
    recommendations.push(
      "⚠️ Un seul répertoire accessible. Les performances peuvent être affectées."
    );
  }

  // Vérifier les permissions Android
  if (
    diagnostics.platform === "android" &&
    diagnostics.permissions.writeExternalStorage === false
  ) {
    recommendations.push(
      "🔐 Permission de stockage Android non accordée. Activez-la dans les paramètres de l'application."
    );
  }

  if (recommendations.length === 0) {
    recommendations.push("✅ Système de stockage en bon état.");
  }

  return recommendations;
};
