import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "@/hooks/useTranslation";
import { useScripts } from "@/contexts/ScriptsContext";
import { useDisplayPreferences } from "@/hooks/useDisplayPreferences";
import { useAuth } from "@/contexts/AuthContext";
import { useCustomAlert } from "@/components/ui/CustomAlert";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StackNavigationProp } from "@react-navigation/stack";
import {
  Recording,
  RecordingSettings,
  RootStackParamList,
} from "../../../types";
import {
  VideoCodec,
  VideoQuality,
  VideoStabilization,
} from "../../../types/video";
import { NavigationHandlers, TabType } from "../types";
import type { Script } from "@/types";

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

export function useNavigationHandlers(
  selectionMode: boolean,
  clearSelection: () => void,
  scripts: Script[]
): NavigationHandlers {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const handleScriptPress = (scriptId: string) => {
    // Ne pas naviguer si en mode sélection
    if (!selectionMode) {
      // Vérifier que le script existe
      const scriptExists = scripts.find((s) => s.id === scriptId);
      if (scriptExists) {
        navigation.navigate("Editor", { scriptId });
      } else {}
    }
  };

  const handleRecordingPress = async (recordingId: string) => {
    // Ne pas naviguer si en mode sélection
    if (!selectionMode) {
      // Les enregistrements sont maintenant sauvegardés directement dans la galerie
      // Aucune navigation n'est nécessaire
    }
  };

  const handleCreateScript = () => {
    navigation.navigate("Editor", {});
  };

  const handleRecordVideo = async (scriptId: string) => {
    // Vérifier que le script existe avant de naviguer
    const scriptExists = scripts.find((s) => s.id === scriptId);
    if (!scriptExists) {
      return;
    }

    try {
      const savedSettings = await AsyncStorage.getItem("recordingSettings");
      let settings: RecordingSettings;

      if (savedSettings) {
        settings = JSON.parse(savedSettings);
        // Forcer l'activation du micro et de la caméra
        settings.isMicEnabled = true;
        settings.isVideoEnabled = true;
        settings.audioEnabled = true;
        settings.videoEnabled = true;
      } else {
        // Paramètres par défaut
        settings = {
          audioEnabled: true,
          videoEnabled: true,
          quality: "high",
          countdown: 3,
          fontSize: 24,
          textColor: "#ffffff",
          horizontalMargin: 0,
          isCompactMode: false,
          scrollSpeed: 50,
          isMirrored: false,
          isMicEnabled: true,
          isVideoEnabled: true,
          textAlignment: "center",
          textShadow: false,
          showCountdown: true,
          countdownDuration: 3,
          videoQuality: "720p",
          scrollAreaTop: 15,
          scrollAreaBottom: 20,
          scrollStartLevel: 5,
          videoSettings: {
            codec: VideoCodec.H264,
            quality: VideoQuality["720p"],
            stabilization: VideoStabilization.auto,
          },
        };
      }

      navigation.navigate("Recording", {
        scriptId: scriptId,
        settings: settings,
      });
    } catch (error) {
      // Vérifier encore une fois avant de naviguer vers Settings
      if (scriptExists) {
        navigation.navigate("Settings", { scriptId: scriptId });
      }
    }
  };

  const handleAIGenerate = () => {
    navigation.navigate("AIGenerator");
  };

  const handleAIChat = () => {
    navigation.navigate("AIChat", {});
  };

  const handlePlanning = () => {
    clearSelection();
    navigation.navigate("Planning");
  };

  const handleAudioScreen = () => {
    clearSelection();
    navigation.navigate("AudioScreen");
  };

  const handlePreview = async () => {
    // La fonctionnalité de prévisualisation n'est plus disponible
    // Les vidéos sont directement sauvegardées dans la galerie
  };

  // Node Editor supprimé
  const handleNodeEditor = () => {};

  const handleTabChange = (tab: TabType) => {
    clearSelection();
  };

  const handleSettings = () => {
    clearSelection();
    navigation.navigate("SettingsScreen");
  };

  return {
    handleScriptPress,
    handleRecordingPress,
    handleCreateScript,
    handleRecordVideo,
    handleAIGenerate,
    handleAIChat,
    handlePlanning,
    handleAudioScreen,
    handlePreview,
    // handleNodeEditor supprimé,
    handleTabChange,
    handleSettings,
  };
}
