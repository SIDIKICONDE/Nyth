import React, { useState } from "react";
import { Alert, TouchableOpacity, View, ScrollView, Image } from "react-native";
import {
  launchImageLibrary,
  launchCamera,
  ImagePickerResponse,
  MediaType,
} from "react-native-image-picker";
import * as DocumentPicker from "@react-native-documents/picker";
import { UIText } from "../../../ui/Typography";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../hooks/useTranslation";
import { TaskAttachment, TaskImage } from "../../../../types/planning";
import {
  attachmentService,
  UploadProgress,
} from "../../../../services/firebase/attachmentService";
import { imageCompressionService } from "../../../../services/imageCompressionService";
import { useAuth } from "../../../../contexts/AuthContext";
import { FileViewer } from "./FileViewer";

import { createOptimizedLogger } from "../../../../utils/optimizedLogger";
const logger = createOptimizedLogger("AttachmentPicker");

interface AttachmentPickerProps {
  attachments: TaskAttachment[];
  images: TaskImage[];
  onAttachmentsChange: (attachments: TaskAttachment[]) => void;
  onImagesChange: (images: TaskImage[]) => void;
  maxAttachments?: number;
  maxImages?: number;
}

export const AttachmentPicker: React.FC<AttachmentPickerProps> = ({
  attachments,
  images,
  onAttachmentsChange,
  onImagesChange,
  maxAttachments = 10,
  maxImages = 5,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
    null
  );
  const [fileViewerVisible, setFileViewerVisible] = useState(false);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);

  const generateReadableName = (fileName?: string | null): string => {
    if (fileName && fileName.trim()) {
      return fileName.trim();
    }

    const timestamp = new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[:-]/g, "");
    return `image_${timestamp}`;
  };

  const pickImage = () => {
    if (images.length >= maxImages) {
      Alert.alert(
        t("planning.tasks.attachments.limitReached", "Limite atteinte"),
        t(
          "planning.tasks.attachments.maxImagesReached",
          `Maximum ${maxImages} images autorisées`
        )
      );
      return;
    }

    Alert.alert(
      t("planning.tasks.attachments.selectImage", "Sélectionner une image"),
      t("planning.tasks.attachments.selectImageSource", "Choisir la source"),
      [
        { text: t("common.cancel", "Annuler"), style: "cancel" },
        {
          text: t("planning.tasks.attachments.camera", "Appareil photo"),
          onPress: () => openCamera(),
        },
        {
          text: t("planning.tasks.attachments.gallery", "Galerie"),
          onPress: () => openImageLibrary(),
        },
      ]
    );
  };

  const openCamera = () => {
    launchCamera(
      {
        mediaType: "photo" as MediaType,
        quality: 0.8,
        maxWidth: 1920,
        maxHeight: 1920,
      },
      handleImageResponse
    );
  };

  const openImageLibrary = () => {
    launchImageLibrary(
      {
        mediaType: "photo" as MediaType,
        quality: 0.8,
        maxWidth: 1920,
        maxHeight: 1920,
        selectionLimit: maxImages - images.length,
      },
      handleImageResponse
    );
  };

  const handleImageResponse = async (response: ImagePickerResponse) => {
    if (
      response.didCancel ||
      response.errorMessage ||
      !response.assets ||
      response.assets.length === 0
    ) {
      return;
    }

    setIsUploading(true);
    setUploadProgress(null);

    try {
      const processedImages: TaskImage[] = [];

      for (const asset of response.assets) {
        if (!asset.uri) continue;

        // Compression de l'image
        const compressionOptions =
          imageCompressionService.getOptimalCompressionOptions(
            asset.width || 1920,
            asset.height || 1920
          );

        const compressedImage = await imageCompressionService.compressImage(
          asset.uri,
          compressionOptions
        );

        const readableName = generateReadableName(asset.fileName);

        // Upload vers Firebase Storage
        const uploadResult = await attachmentService.uploadImage(
          compressedImage.uri,
          readableName,
          user?.uid || "",
          (progress) => setUploadProgress(progress)
        );

        const newImage: TaskImage = {
          id: `image-${Date.now()}-${Math.random()}`,
          taskId: "", // Sera défini lors de la sauvegarde
          fileName: uploadResult.fileName,
          originalName: readableName,
          fileSize: uploadResult.fileSize,
          url: uploadResult.url,
          thumbnailUrl: uploadResult.thumbnailUrl,
          uploadedAt: new Date().toISOString(),
          uploadedBy: user?.uid || "",
          width: compressedImage.width,
          height: compressedImage.height,
        };

        processedImages.push(newImage);
      }

      onImagesChange([...images, ...processedImages]);
    } catch (error) {
      logger.error("❌ Erreur traitement image:", error);
      Alert.alert(
        t("common.error", "Erreur"),
        t(
          "planning.tasks.attachments.uploadError",
          "Erreur lors de l'upload de l'image"
        )
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const pickDocument = async () => {
    if (attachments.length >= maxAttachments) {
      Alert.alert(
        t("planning.tasks.attachments.limitReached", "Limite atteinte"),
        t(
          "planning.tasks.attachments.maxAttachmentsReached",
          `Maximum ${maxAttachments} fichiers autorisés`
        )
      );
      return;
    }

    try {
      const results = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
        allowMultiSelection: true,
      });

      setIsUploading(true);
      setUploadProgress(null);

      try {
        const processedAttachments: TaskAttachment[] = [];

        for (const result of results) {
          // Upload vers Firebase Storage
          const uploadResult = await attachmentService.uploadFile(
            result.uri,
            result.name || `file-${Date.now()}`,
            result.type || "application/octet-stream",
            user?.uid || "",
            (progress) => setUploadProgress(progress)
          );

          const newAttachment: TaskAttachment = {
            id: `attachment-${Date.now()}-${Math.random()}`,
            taskId: "", // Sera défini lors de la sauvegarde
            fileName: uploadResult.fileName,
            originalName: result.name || `file-${Date.now()}`,
            fileSize: uploadResult.fileSize,
            mimeType: uploadResult.mimeType,
            url: uploadResult.url,
            uploadedAt: new Date().toISOString(),
            uploadedBy: user?.uid || "",
            type: getFileType(result.type || ""),
          };

          processedAttachments.push(newAttachment);
        }

        onAttachmentsChange([...attachments, ...processedAttachments]);
      } catch (error) {
        logger.error("❌ Erreur traitement fichier:", error);
        Alert.alert(
          t("common.error", "Erreur"),
          t(
            "planning.tasks.attachments.uploadError",
            "Erreur lors de l'upload du fichier"
          )
        );
      } finally {
        setIsUploading(false);
        setUploadProgress(null);
      }
    } catch (error) {
      if (
        !(
          DocumentPicker.isErrorWithCode(error) &&
          error.code === DocumentPicker.errorCodes.OPERATION_CANCELED
        )
      ) {
        Alert.alert(
          t("common.error", "Erreur"),
          t(
            "planning.tasks.attachments.pickError",
            "Erreur lors de la sélection du fichier"
          )
        );
      }
    }
  };

  const getFileType = (mimeType: string): TaskAttachment["type"] => {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("video/")) return "video";
    if (mimeType.startsWith("audio/")) return "audio";
    if (
      mimeType.includes("pdf") ||
      mimeType.includes("document") ||
      mimeType.includes("text")
    )
      return "document";
    return "other";
  };

  const removeImage = (imageId: string) => {
    onImagesChange(images.filter((img) => img.id !== imageId));
  };

  const removeAttachment = (attachmentId: string) => {
    onAttachmentsChange(attachments.filter((att) => att.id !== attachmentId));
  };

  const replaceImage = (imageId: string) => {
    Alert.alert(
      t("planning.tasks.attachments.replaceImage", "Remplacer l'image"),
      t("planning.tasks.attachments.selectImageSource", "Choisir la source"),
      [
        { text: t("common.cancel", "Annuler"), style: "cancel" },
        {
          text: t("planning.tasks.attachments.camera", "Appareil photo"),
          onPress: () => {
            launchCamera(
              {
                mediaType: "photo" as MediaType,
                quality: 0.8,
                maxWidth: 1920,
                maxHeight: 1920,
              },
              (response) => handleImageReplacement(response, imageId)
            );
          },
        },
        {
          text: t("planning.tasks.attachments.gallery", "Galerie"),
          onPress: () => {
            launchImageLibrary(
              {
                mediaType: "photo" as MediaType,
                quality: 0.8,
                maxWidth: 1920,
                maxHeight: 1920,
                selectionLimit: 1,
              },
              (response) => handleImageReplacement(response, imageId)
            );
          },
        },
      ]
    );
  };

  const handleImageReplacement = async (
    response: ImagePickerResponse,
    imageId: string
  ) => {
    if (
      response.didCancel ||
      response.errorMessage ||
      !response.assets ||
      response.assets.length === 0
    ) {
      return;
    }

    setIsUploading(true);
    setUploadProgress(null);

    try {
      const asset = response.assets[0];

      if (!asset.uri) {
        return;
      }

      // Compression de l'image
      const compressionOptions =
        imageCompressionService.getOptimalCompressionOptions(
          asset.width || 1920,
          asset.height || 1920
        );

      const compressedImage = await imageCompressionService.compressImage(
        asset.uri,
        compressionOptions
      );

      const readableName = generateReadableName(asset.fileName);

      // Upload vers Firebase Storage
      const uploadResult = await attachmentService.uploadImage(
        compressedImage.uri,
        readableName,
        user?.uid || "",
        (progress) => setUploadProgress(progress)
      );

      const newImage: TaskImage = {
        id: imageId, // Garder le même ID
        taskId: "", // Sera défini lors de la sauvegarde
        fileName: uploadResult.fileName,
        originalName: readableName,
        fileSize: uploadResult.fileSize,
        url: uploadResult.url,
        thumbnailUrl: uploadResult.thumbnailUrl,
        uploadedAt: new Date().toISOString(),
        uploadedBy: user?.uid || "",
        width: compressedImage.width,
        height: compressedImage.height,
      };

      // Remplacer l'image dans la liste
      const updatedImages = images.map((img) =>
        img.id === imageId ? newImage : img
      );
      onImagesChange(updatedImages);
    } catch (error) {
      logger.error("❌ Erreur remplacement image:", error);
      Alert.alert(
        t("common.error", "Erreur"),
        t(
          "planning.tasks.attachments.replaceError",
          "Erreur lors du remplacement de l'image"
        )
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const replaceAttachment = async (attachmentId: string) => {
    try {
      const results = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
        allowMultiSelection: false,
      });

      if (results.length === 0) return;

      setIsUploading(true);
      setUploadProgress(null);

      const result = results[0];

      // Upload vers Firebase Storage
      const uploadResult = await attachmentService.uploadFile(
        result.uri,
        result.name || `file-${Date.now()}`,
        result.type || "application/octet-stream",
        user?.uid || "",
        (progress) => setUploadProgress(progress)
      );

      const newAttachment: TaskAttachment = {
        id: attachmentId, // Garder le même ID
        taskId: "", // Sera défini lors de la sauvegarde
        fileName: uploadResult.fileName,
        originalName: result.name || `file-${Date.now()}`,
        fileSize: uploadResult.fileSize,
        mimeType: uploadResult.mimeType,
        url: uploadResult.url,
        uploadedAt: new Date().toISOString(),
        uploadedBy: user?.uid || "",
        type: getFileType(result.type || ""),
      };

      // Remplacer le fichier dans la liste
      const updatedAttachments = attachments.map((att) =>
        att.id === attachmentId ? newAttachment : att
      );
      onAttachmentsChange(updatedAttachments);
    } catch (error) {
      if (
        !(
          DocumentPicker.isErrorWithCode(error) &&
          error.code === DocumentPicker.errorCodes.OPERATION_CANCELED
        )
      ) {
        logger.error("❌ Erreur remplacement fichier:", error);
        Alert.alert(
          t("common.error", "Erreur"),
          t(
            "planning.tasks.attachments.replaceError",
            "Erreur lors du remplacement du fichier"
          )
        );
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
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

  return (
    <View style={{ marginVertical: 12 }}>
      <UIText
        size="sm"
        weight="semibold"
        color={currentTheme.colors.text}
        style={{ marginBottom: 8 }}
      >
        {t("planning.tasks.attachments.title", "Images et pièces jointes")}
      </UIText>

      {/* Indicateur de progression */}
      {isUploading && uploadProgress && (
        <View
          style={{
            marginBottom: 12,
            padding: 8,
            backgroundColor: currentTheme.colors.primary + "10",
            borderRadius: 8,
          }}
        >
          <UIText size="xs" color={currentTheme.colors.primary}>
            {t("planning.tasks.attachments.uploading", "Upload en cours...")} (
            {Math.round(uploadProgress.percentage)}%)
          </UIText>
        </View>
      )}

      {/* Boutons d'ajout */}
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
        <TouchableOpacity
          onPress={pickImage}
          disabled={isUploading}
          style={{
            flex: 1,
            padding: 12,
            backgroundColor: currentTheme.colors.primary + "15",
            borderRadius: 8,
            borderWidth: 1,
            borderColor: currentTheme.colors.primary + "30",
            opacity: isUploading ? 0.5 : 1,
          }}
        >
          <UIText
            size="sm"
            weight="medium"
            color={currentTheme.colors.primary}
            style={{ textAlign: "center" }}
          >
            📷 {t("planning.tasks.attachments.addImage", "Ajouter une image")} (
            {images.length}/{maxImages})
          </UIText>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={pickDocument}
          disabled={isUploading}
          style={{
            flex: 1,
            padding: 12,
            backgroundColor: currentTheme.colors.secondary + "15",
            borderRadius: 8,
            borderWidth: 1,
            borderColor: currentTheme.colors.secondary + "30",
            opacity: isUploading ? 0.5 : 1,
          }}
        >
          <UIText
            size="sm"
            weight="medium"
            color={currentTheme.colors.secondary}
            style={{ textAlign: "center" }}
          >
            📎 {t("planning.tasks.attachments.addFile", "Ajouter un fichier")} (
            {attachments.length}/{maxAttachments})
          </UIText>
        </TouchableOpacity>
      </View>

      {/* Liste des images */}
      {images.length > 0 && (
        <View style={{ marginBottom: 12 }}>
          <UIText
            size="xs"
            weight="medium"
            color={currentTheme.colors.textSecondary}
            style={{ marginBottom: 6 }}
          >
            {t("planning.tasks.attachments.images", "Images")} ({images.length})
          </UIText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {images.map((image, index) => (
                <TouchableOpacity
                  key={image.id}
                  style={{
                    position: "relative",
                    width: 80,
                    height: 80,
                    borderRadius: 8,
                    overflow: "hidden",
                    backgroundColor: currentTheme.colors.surface,
                  }}
                >
                  <Image
                    source={{ uri: image.thumbnailUrl || image.url }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />

                  <View
                    style={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      flexDirection: "row",
                      gap: 2,
                    }}
                  >
                    {/* Bouton de remplacement */}
                    <TouchableOpacity
                      onPress={() => replaceImage(image.id)}
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: currentTheme.colors.primary,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <UIText size="xs" color="white" weight="bold">
                        🔄
                      </UIText>
                    </TouchableOpacity>
                    {/* Bouton de suppression */}
                    <TouchableOpacity
                      onPress={() => removeImage(image.id)}
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: currentTheme.colors.error || "#ef4444",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <UIText size="xs" color="white" weight="bold">
                        ×
                      </UIText>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Liste des fichiers */}
      {attachments.length > 0 && (
        <View>
          <UIText
            size="xs"
            weight="medium"
            color={currentTheme.colors.textSecondary}
            style={{ marginBottom: 6 }}
          >
            {t("planning.tasks.attachments.files", "Fichiers")} (
            {attachments.length})
          </UIText>
          {attachments.map((attachment, index) => (
            <TouchableOpacity
              key={attachment.id}
              onPress={() => {
                setSelectedFileIndex(index);
                setFileViewerVisible(true);
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 8,
                backgroundColor: currentTheme.colors.surface,
                borderRadius: 6,
                marginBottom: 6,
              }}
            >
              <UIText size="sm" style={{ marginRight: 8 }}>
                {getFileIcon(attachment.type)}
              </UIText>
              <View style={{ flex: 1 }}>
                <UIText
                  size="sm"
                  weight="medium"
                  color={currentTheme.colors.text}
                  numberOfLines={1}
                >
                  {attachment.originalName}
                </UIText>
                <UIText size="xs" color={currentTheme.colors.textSecondary}>
                  {formatFileSize(attachment.fileSize)}
                </UIText>
              </View>

              <View style={{ flexDirection: "row", gap: 3 }}>
                {/* Bouton de remplacement */}
                <TouchableOpacity
                  onPress={() => replaceAttachment(attachment.id)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: currentTheme.colors.primary,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <UIText size="xs" color="white" weight="bold">
                    🔄
                  </UIText>
                </TouchableOpacity>
                {/* Bouton de suppression */}
                <TouchableOpacity
                  onPress={() => removeAttachment(attachment.id)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: currentTheme.colors.error || "#ef4444",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <UIText size="xs" color="white" weight="bold">
                    ×
                  </UIText>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* FileViewer pour les fichiers attachés */}
      <FileViewer
        visible={fileViewerVisible}
        files={attachments}
        initialIndex={selectedFileIndex}
        onClose={() => setFileViewerVisible(false)}
      />
    </View>
  );
};
