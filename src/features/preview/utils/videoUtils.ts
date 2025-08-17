import RNFS from "react-native-fs";
import { Alert } from "react-native";
import { VIDEO_SIZE_UNITS } from "../constants/defaultValues";

// Type pour la fonction de traduction
type TranslationFunction = (key: string, options?: any) => string;

export const calculateVideoSize = async (
  videoUri: string,
  t: TranslationFunction
): Promise<string> => {
  try {
    const toLocalPath = (uri: string) =>
      uri && uri.startsWith("file://") ? uri.replace("file://", "") : uri;
    const localPath = toLocalPath(videoUri);
    // Vérifier que l'URI n'est pas vide
    if (!localPath || localPath.trim() === "") {
      return t("preview.fileStatus.notFound");
    }

    const fileExists = await RNFS.exists(localPath);
    if (!fileExists) {
      return t("preview.fileStatus.notFound");
    }

    const fileInfo = await RNFS.stat(localPath);

    if (!fileInfo.isFile()) {
      return t("preview.fileStatus.notFound");
    }

    if (fileInfo.size) {
      return formatFileSize(fileInfo.size);
    } else {
      return t("preview.fileStatus.unknownSize");
    }
  } catch (error) {
    return t("preview.fileStatus.error");
  }
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < VIDEO_SIZE_UNITS.KB) return bytes + " B";
  else if (bytes < VIDEO_SIZE_UNITS.MB)
    return Math.round(bytes / VIDEO_SIZE_UNITS.KB) + " KB";
  else if (bytes < VIDEO_SIZE_UNITS.GB)
    return Math.round(bytes / VIDEO_SIZE_UNITS.MB) + " MB";
  else return Math.round(bytes / VIDEO_SIZE_UNITS.GB) + " GB";
};
