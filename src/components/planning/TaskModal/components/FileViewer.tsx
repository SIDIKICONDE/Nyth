import React from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Linking,
  Alert,
  Platform,
} from "react-native";
import RNFS from "react-native-fs";
import Share from "react-native-share";
import { UIText } from "../../../ui/Typography";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../hooks/useTranslation";
import { useAuth } from "../../../../contexts/AuthContext";
import { TaskAttachment } from "../../../../types/planning";
import FirebaseDownloadService from "../../../../services/firebase/downloadService";

import { createOptimizedLogger } from '../../../../utils/optimizedLogger';
const logger = createOptimizedLogger('FileViewer');

interface FileViewerProps {
  visible: boolean;
  files: TaskAttachment[];
  initialIndex?: number;
  onClose: () => void;
}

export const FileViewer: React.FC<FileViewerProps> = ({
  visible,
  files,
  initialIndex = 0,
  onClose,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);

  React.useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, visible]);

  // Nettoyer les fichiers téléchargés au démarrage
  React.useEffect(() => {
    if (visible) {
      cleanupDownloadedFiles();
    }
  }, [visible]);

  const currentFile = files[currentIndex];

  if (!currentFile) return null;

  const goToNext = () => {
    if (currentIndex < files.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (type: TaskAttachment["type"]): string => {
    switch (type) {
      case "image":
        return "🖼️";
      case "video":
        return "🎥";
      case "audio":
        return "🎵";
      case "document":
        return "📄";
      default:
        return "📎";
    }
  };

  const getFileTypeLabel = (type: TaskAttachment["type"]): string => {
    switch (type) {
      case "image":
        return "Image";
      case "video":
        return "Vidéo";
      case "audio":
        return "Audio";
      case "document":
        return "Document";
      default:
        return "Fichier";
    }
  };

  const handleOpenWithNativeApp = async () => {
    try {
      // Vérifier d'abord si l'URL est accessible
      logger.debug("URL du fichier:", currentFile.url);

      // Vérifier si l'utilisateur est connecté
      if (!user) {
        Alert.alert(
          "Authentification requise",
          "Vous devez être connecté pour accéder aux fichiers."
        );
        return;
      }

      // Télécharger d'abord le fichier temporairement
      const tempDir =
        Platform.OS === "ios"
          ? RNFS.TemporaryDirectoryPath
          : RNFS.CachesDirectoryPath;

      const tempFileName = `temp_${Date.now()}_${currentFile.originalName}`;
      const tempFilePath = `${tempDir}/${tempFileName}`;

      Alert.alert(
        "Ouverture avec application native",
        `"${currentFile.originalName}" va être téléchargé puis ouvert avec l'application appropriée.`,
        [
          {
            text: "Annuler",
            style: "cancel",
          },
          {
            text: "Ouvrir",
            onPress: async () => {
              try {
                logger.debug("📥 Tentative de téléchargement...");
                logger.debug("📍 URL:", currentFile.url);
                logger.debug("📍 Destination:", tempFilePath);

                // Utiliser notre service de téléchargement avec retry automatique
                const downloadResult =
                  await FirebaseDownloadService.downloadFileWithRetry(
                    currentFile.url,
                    tempFilePath,
                    undefined, // storagePath sera extrait automatiquement si nécessaire
                    {
                      onProgress: (progress) => {
                        logger.debug(`📊 Progression: ${progress.toFixed(1)}%`);
                      },
                    }
                  );

                logger.debug("📋 Résultat téléchargement:", downloadResult);

                if (downloadResult.statusCode === 200) {
                  // Vérifier que le fichier existe
                  const fileExists = await RNFS.exists(tempFilePath);
                  logger.debug("📁 Fichier existe:", fileExists);

                  if (fileExists) {
                    const fileStats = await RNFS.stat(tempFilePath);
                    logger.debug(
                      "📊 Taille du fichier téléchargé:",
                      fileStats.size,
                      "bytes"
                    );

                    if (fileStats.size === 0) {
                      throw new Error("Le fichier téléchargé est vide");
                    }

                    // Utiliser Share.open sur toutes les plateformes pour l'ouverture native
                    logger.debug(
                      "📱 Ouverture du fichier avec l'application native..."
                    );

                    try {
                      await Share.open({
                        url: `file://${tempFilePath}`,
                        type:
                          currentFile.mimeType || "application/octet-stream",
                        filename: currentFile.originalName,
                        title: `Ouvrir ${currentFile.originalName}`,
                      });
                      logger.debug("✅ Fichier ouvert avec succès");
                    } catch (shareError: any) {
                      logger.debug("⚠️ Share.open échoué:", shareError);

                      // Si Share.open échoue, proposer d'autres options
                      if (
                        shareError?.message?.includes("User did not share") ||
                        shareError?.error === "User did not share"
                      ) {
                        // L'utilisateur a annulé le partage, ce n'est pas une erreur
                        logger.debug("ℹ️ Utilisateur a annulé l'ouverture");
                      } else {
                        // Vraie erreur d'ouverture
                        Alert.alert(
                          "Ouverture impossible",
                          `Impossible d'ouvrir ce type de fichier (${
                            currentFile.mimeType || "type inconnu"
                          }). Le fichier a été téléchargé avec succès dans le dossier temporaire.`,
                          [
                            {
                              text: "OK",
                              style: "default",
                            },
                          ]
                        );
                      }
                    }

                    // Nettoyer le fichier temporaire après un délai
                    setTimeout(async () => {
                      try {
                        await RNFS.unlink(tempFilePath);
                        logger.debug("🧹 Fichier temporaire nettoyé");
                      } catch (cleanupError) {
                        logger.debug(
                          "Erreur nettoyage fichier temporaire:",
                          cleanupError
                        );
                      }
                    }, 5000); // 5 secondes de délai
                  } else {
                    throw new Error("Le fichier temporaire n'existe pas");
                  }
                } else if (downloadResult.statusCode === 404) {
                  // URL non trouvée - probablement expirée
                  Alert.alert(
                    "Fichier non disponible",
                    "L'URL du fichier a expiré ou le fichier n'existe plus. Essayez de rafraîchir la page ou contactez le support.",
                    [
                      {
                        text: "OK",
                        style: "default",
                      },
                    ]
                  );
                  return;
                } else if (
                  downloadResult.statusCode === 401 ||
                  downloadResult.statusCode === 403
                ) {
                  // Problème d'authentification
                  Alert.alert(
                    "Accès refusé",
                    "Vous n'avez pas les permissions pour accéder à ce fichier. Vérifiez que vous êtes bien connecté.",
                    [
                      {
                        text: "OK",
                        style: "default",
                      },
                    ]
                  );
                  return;
                } else {
                  throw new Error(
                    `Erreur de téléchargement: ${downloadResult.statusCode}`
                  );
                }
              } catch (error) {
                logger.error("❌ Erreur ouverture native:", error);
                Alert.alert(
                  "Erreur",
                  `Impossible d'ouvrir le fichier: ${(error as Error).message}`
                );
              }
            },
          },
        ]
      );
    } catch (error) {
      logger.error("❌ Erreur préparation ouverture native:", error);
      Alert.alert("Erreur", "Impossible de préparer l'ouverture native.");
    }
  };

  // Fonction pour nettoyer les fichiers téléchargés après 24h
  const cleanupDownloadedFiles = async () => {
    try {
      const downloadDir =
        Platform.OS === "ios"
          ? RNFS.DocumentDirectoryPath + "/Downloads"
          : RNFS.DownloadDirectoryPath;

      // Vérifier si le dossier existe avant de lister les fichiers
      const dirExists = await RNFS.exists(downloadDir);
      if (!dirExists) {
        // Le dossier n'existe pas encore, pas de fichiers à nettoyer
        return;
      }

      const files = await RNFS.readDir(downloadDir);
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000; // 24 heures en millisecondes

      for (const file of files) {
        if (file.isFile()) {
          const fileStats = await RNFS.stat(file.path);
          const fileAge = now - new Date(fileStats.mtime).getTime();

          if (fileAge > oneDay) {
            await RNFS.unlink(file.path);
            logger.debug(`Fichier supprimé: ${file.name}`);
          }
        }
      }
    } catch (error) {
      logger.error("Erreur nettoyage fichiers:", error);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View
        style={{
          flex: 1,
          backgroundColor: currentTheme.colors.background,
        }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingTop: 50,
            paddingBottom: 20,
            backgroundColor: currentTheme.colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: currentTheme.colors.border,
          }}
        >
          <TouchableOpacity
            onPress={onClose}
            style={{
              padding: 10,
              borderRadius: 20,
              backgroundColor: currentTheme.colors.border,
            }}
          >
            <UIText size="lg" color={currentTheme.colors.text} weight="bold">
              ✕
            </UIText>
          </TouchableOpacity>

          <View style={{ alignItems: "center" }}>
            <UIText size="sm" color={currentTheme.colors.text} weight="medium">
              {getFileTypeLabel(currentFile.type)}
            </UIText>
            <UIText
              size="xs"
              color={currentTheme.colors.textSecondary}
              style={{ marginTop: 2 }}
            >
              {currentIndex + 1} / {files.length}
            </UIText>
          </View>

          <TouchableOpacity
            onPress={handleOpenWithNativeApp}
            style={{
              padding: 10,
              borderRadius: 20,
              backgroundColor: currentTheme.colors.primary,
            }}
          >
            <UIText size="sm" color="white" weight="bold">
              Ouvrir
            </UIText>
          </TouchableOpacity>
        </View>

        {/* Contenu principal */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
          {/* Icône et nom du fichier */}
          <View style={{ alignItems: "center", marginBottom: 30 }}>
            <View
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: currentTheme.colors.primary + "20",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <UIText size={60}>{getFileIcon(currentFile.type)}</UIText>
            </View>

            <UIText
              size="lg"
              weight="bold"
              color={currentTheme.colors.text}
              style={{ textAlign: "center", marginBottom: 8 }}
              numberOfLines={2}
            >
              {currentFile.originalName}
            </UIText>

            <UIText
              size="sm"
              color={currentTheme.colors.textSecondary}
              style={{ textAlign: "center" }}
            >
              {getFileTypeLabel(currentFile.type)} •{" "}
              {formatFileSize(currentFile.fileSize)}
            </UIText>
          </View>

          {/* Informations détaillées */}
          <View
            style={{
              backgroundColor: currentTheme.colors.surface,
              borderRadius: 12,
              padding: 20,
              marginBottom: 20,
            }}
          >
            <UIText
              size="base"
              weight="bold"
              color={currentTheme.colors.text}
              style={{ marginBottom: 15 }}
            >
              Informations
            </UIText>

            <View style={{ gap: 12 }}>
              <View>
                <UIText
                  size="xs"
                  color={currentTheme.colors.textSecondary}
                  weight="medium"
                >
                  NOM DU FICHIER
                </UIText>
                <UIText
                  size="sm"
                  color={currentTheme.colors.text}
                  style={{ marginTop: 4 }}
                >
                  {currentFile.fileName}
                </UIText>
              </View>

              <View>
                <UIText
                  size="xs"
                  color={currentTheme.colors.textSecondary}
                  weight="medium"
                >
                  TAILLE
                </UIText>
                <UIText
                  size="sm"
                  color={currentTheme.colors.text}
                  style={{ marginTop: 4 }}
                >
                  {formatFileSize(currentFile.fileSize)}
                </UIText>
              </View>

              {currentFile.mimeType && (
                <View>
                  <UIText
                    size="xs"
                    color={currentTheme.colors.textSecondary}
                    weight="medium"
                  >
                    TYPE MIME
                  </UIText>
                  <UIText
                    size="sm"
                    color={currentTheme.colors.text}
                    style={{ marginTop: 4 }}
                  >
                    {currentFile.mimeType}
                  </UIText>
                </View>
              )}

              <View>
                <UIText
                  size="xs"
                  color={currentTheme.colors.textSecondary}
                  weight="medium"
                >
                  AJOUTÉ LE
                </UIText>
                <UIText
                  size="sm"
                  color={currentTheme.colors.text}
                  style={{ marginTop: 4 }}
                >
                  {formatDate(currentFile.uploadedAt)}
                </UIText>
              </View>
            </View>
          </View>

          {/* Boutons d'action */}
          <View style={{ gap: 12, marginBottom: 20 }}>
            {/* Information sur le stockage cloud */}
            <View
              style={{
                backgroundColor: currentTheme.colors.surface,
                borderRadius: 8,
                padding: 12,
                borderLeftWidth: 3,
                borderLeftColor: currentTheme.colors.primary,
              }}
            >
              <UIText size="xs" color={currentTheme.colors.textSecondary}>
                ℹ️ Ce fichier est stocké de manière sécurisée dans le cloud.
                Utilisez "Ouvrir avec app native" pour l'ouvrir directement ou
                "Partager" pour l'envoyer vers d'autres applications.
              </UIText>
            </View>
          </View>
        </ScrollView>

        {/* Navigation */}
        {files.length > 1 && (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              paddingVertical: 15,
              backgroundColor: currentTheme.colors.surface,
              borderTopWidth: 1,
              borderTopColor: currentTheme.colors.border,
            }}
          >
            <TouchableOpacity
              onPress={goToPrevious}
              disabled={currentIndex === 0}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                padding: 12,
                borderRadius: 8,
                backgroundColor:
                  currentIndex === 0
                    ? currentTheme.colors.border + "50"
                    : currentTheme.colors.border,
                marginRight: 10,
                opacity: currentIndex === 0 ? 0.5 : 1,
              }}
            >
              <UIText
                size="lg"
                color={currentTheme.colors.text}
                style={{ marginRight: 8 }}
              >
                ‹
              </UIText>
              <UIText
                size="sm"
                color={currentTheme.colors.text}
                weight="medium"
              >
                Précédent
              </UIText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={goToNext}
              disabled={currentIndex === files.length - 1}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                padding: 12,
                borderRadius: 8,
                backgroundColor:
                  currentIndex === files.length - 1
                    ? currentTheme.colors.border + "50"
                    : currentTheme.colors.border,
                marginLeft: 10,
                opacity: currentIndex === files.length - 1 ? 0.5 : 1,
              }}
            >
              <UIText
                size="sm"
                color={currentTheme.colors.text}
                weight="medium"
              >
                Suivant
              </UIText>
              <UIText
                size="lg"
                color={currentTheme.colors.text}
                style={{ marginLeft: 8 }}
              >
                ›
              </UIText>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
};
