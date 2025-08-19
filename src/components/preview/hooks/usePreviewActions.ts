import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useCallback } from "react";
import { Alert, Share } from "react-native";
import RNFS from "react-native-fs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "../../../hooks/useTranslation";
import { Recording, RootStackParamList } from "../../../types";
import { EXPORT_PROGRESS_INTERVAL } from "../constants/defaultValues";
import { deleteRecordingFromStorage } from "../utils/storageUtils";
import { formatFileSize } from "../utils/videoUtils";
import { FileManager } from "../../../services/social-share/utils/fileManager";

type PreviewScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Preview"
>;

interface UsePreviewActionsProps {
  recording: Recording | null;
  isExporting: boolean;
  setIsExporting: (value: boolean) => void;
  setExportProgress: (value: number) => void;
  setCurrentStep: (value: string) => void;
  setShowSocialShare: (value: boolean) => void;
}

export const usePreviewActions = ({
  recording,
  isExporting,
  setIsExporting,
  setExportProgress,
  setCurrentStep,
  setShowSocialShare,
}: UsePreviewActionsProps) => {
  const { t } = useTranslation();
  const navigation = useNavigation<PreviewScreenNavigationProp>();

  const handleExport = useCallback(async () => {
    if (!recording || isExporting) return;

    setIsExporting(true);
    setExportProgress(0);
    setCurrentStep(t("preview.export.steps.preparation"));

    try {
      // Normaliser l'URI pour RNFS
      const toLocalPath = (uri: string) =>
        uri && uri.startsWith("file://") ? uri.replace("file://", "") : uri;

      const videoToExport = recording.videoUri;

      const fileInfo = await RNFS.stat(toLocalPath(videoToExport));
      const estimatedSize =
        fileInfo.isFile() && "size" in fileInfo ? fileInfo.size * 0.8 : 0;

      // Export standard
      for (let i = 0; i <= 100; i += 10) {
        setExportProgress(i);

        if (i < 30) setCurrentStep(t("preview.export.steps.videoPreparation"));
        else if (i < 60) setCurrentStep(t("preview.export.steps.encoding"));
        else if (i < 90) setCurrentStep(t("preview.export.steps.finalizing"));
        else setCurrentStep(t("preview.export.steps.completed"));

        await new Promise((resolve) =>
          setTimeout(resolve, EXPORT_PROGRESS_INTERVAL)
        );
      }

      // Sauvegarder dans la galerie avec gestion des permissions (Android/iOS)
      const saved = await FileManager.saveToGallery(videoToExport);
      if (!saved) {
        throw new Error("save_failed");
      }

      Alert.alert(
        t("preview.export.success.title"),
        t("preview.export.success.message", {
          size: formatFileSize(estimatedSize),
        }),
        [{ text: t("preview.export.success.ok") }]
      );

      navigation.goBack();
    } catch (error) {
      Alert.alert(
        t("preview.export.error.title"),
        t("preview.export.error.message"),
        [{ text: t("preview.export.error.ok") }]
      );
    } finally {
      setIsExporting(false);
      setExportProgress(0);
      setCurrentStep("");
    }
  }, [recording, isExporting, navigation, t]);

  const handleShare = async () => {
    if (recording) {
      setShowSocialShare(true);
    }
  };

  const handleBasicShare = async () => {
    if (!recording) return;

    try {
      const result = await Share.share({
        url: recording.videoUri,
        title: t("preview.share.details.title"),
        message: t("preview.share.details.message"),
      });

      if (result.action === Share.sharedAction) {}
    } catch (error) {
      Alert.alert(
        t("preview.share.error.title"),
        t("preview.share.error.message"),
        [{ text: t("common.ok") }]
      );
    }
  };

  const handleDelete = () => {
    if (!recording) return;

    Alert.alert(t("preview.delete.title"), t("preview.delete.message"), [
      {
        text: t("common.cancel"),
        style: "cancel",
      },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await deleteRecordingFromStorage(recording.id);

            try {
              await RNFS.unlink(recording.videoUri);
            } catch (fileError) {}

            navigation.goBack();
          } catch (error) {
            Alert.alert(
              t("preview.delete.error.title"),
              t("preview.delete.error.message"),
              [{ text: t("common.ok") }]
            );
          }
        },
      },
    ]);
  };

  return {
    handleExport,
    handleShare,
    handleBasicShare,
    handleDelete,
  };
};
