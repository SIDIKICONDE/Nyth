import { useCallback } from "react";
import { Alert, BackHandler } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "@/hooks/useTranslation";
import { createLogger } from "@/utils/optimizedLogger";

const logger = createLogger("useRecordingEvents");

interface UseRecordingEventsProps {
  isRecording: boolean;
  onBackPress?: () => void;
}

export function useRecordingEvents({ isRecording, onBackPress }: UseRecordingEventsProps) {
  const navigation = useNavigation();
  const { t } = useTranslation();

  // Gestion du bouton retour pendant l'enregistrement
  const handleBackPress = useCallback(() => {
    if (isRecording) {
      Alert.alert(
        t("recording.exitWarning.title", "Enregistrement en cours"),
        t(
          "recording.exitWarning.message",
          "Voulez-vous vraiment arrêter l'enregistrement et quitter ?"
        ),
        [
          {
            text: t("common.cancel", "Annuler"),
            style: "cancel",
          },
          {
            text: t("recording.exitWarning.stop", "Arrêter et quitter"),
            style: "destructive",
            onPress: () => {
              onBackPress?.();
              navigation.goBack();
            },
          },
        ]
      );
      return true; // Empêcher la navigation par défaut
    }
    return false; // Permettre la navigation normale
  }, [isRecording, navigation, t, onBackPress]);

  // Configuration du listener pour le bouton retour Android
  const setupBackHandler = useCallback(() => {
    const onBackPress = () => handleBackPress();

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress
    );

    return () => subscription.remove();
  }, [handleBackPress]);

  return {
    handleBackPress,
    setupBackHandler,
  };
}
