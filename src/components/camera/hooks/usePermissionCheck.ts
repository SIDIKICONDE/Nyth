import { useState, useEffect } from "react";
import { Platform } from "react-native";
import {
  check,
  PERMISSIONS,
  RESULTS,
} from "react-native-permissions";

export const usePermissionCheck = () => {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [hasMicrophonePermission, setHasMicrophonePermission] = useState<boolean | null>(null);

  useEffect(() => {
    // Vérifier les permissions sans les demander
    const checkPermissions = async () => {
      try {
        const cameraPermission = Platform.select({
          ios: PERMISSIONS.IOS.CAMERA,
          android: PERMISSIONS.ANDROID.CAMERA,
        })!;

        const microphonePermission = Platform.select({
          ios: PERMISSIONS.IOS.MICROPHONE,
          android: PERMISSIONS.ANDROID.RECORD_AUDIO,
        })!;

        const [cameraResult, microphoneResult] = await Promise.all([
          check(cameraPermission),
          check(microphonePermission),
        ]);

        setHasCameraPermission(cameraResult === RESULTS.GRANTED);
        setHasMicrophonePermission(microphoneResult === RESULTS.GRANTED);
      } catch (error) {
        console.error("Erreur lors de la vérification des permissions:", error);
        setHasCameraPermission(false);
        setHasMicrophonePermission(false);
      }
    };

    checkPermissions();
  }, []);

  return {
    hasCameraPermission,
    hasMicrophonePermission,
  };
};