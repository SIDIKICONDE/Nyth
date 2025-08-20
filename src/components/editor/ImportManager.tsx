import { useState } from "react";
import { Alert } from "react-native";
import * as DocumentPicker from "@react-native-documents/picker";
import RNFS from "react-native-fs";
import { useTranslation } from "../../hooks/useTranslation";

export function useImportManager() {
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  const handleImport = async (
    type: "pdf" | "txt",
    onImportSuccess: (content: string) => void
  ) => {
    try {
      setIsLoading(true);

      if (type === "pdf") {
        Alert.alert(
          t("editor.import.comingSoonTitle"),
          t("editor.import.pdfFeature")
        );
        return;
      }

      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.plainText],
        allowMultiSelection: false,
      });

      // @react-native-documents/picker retourne un tableau
      if (result && result.length > 0) {
        const file = result[0];
        const content = await RNFS.readFile(file.uri);
        onImportSuccess(content);
      }
    } catch (error: any) {
      // Vérifier si l'utilisateur a annulé via le code d'erreur
      if (error && error.code === "DOCUMENT_PICKER_CANCELED") {
        return;
      }

      Alert.alert(t("common.error"), t("editor.import.fileError"));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    handleImport,
  };
}
