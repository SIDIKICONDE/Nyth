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
      try {
        // Charger l'enregistrement depuis AsyncStorage
        const recordingsData = await AsyncStorage.getItem("recordings");
        if (recordingsData) {
          const recordings: Recording[] = JSON.parse(recordingsData);
          const recording = recordings.find((r) => r.id === recordingId);

          if (recording) {
            navigation.navigate("Preview", {
              videoUri: recording.videoUri || recording.uri || "",
              duration: recording.duration || 0,
              scriptId: recording.scriptId,
              scriptTitle: recording.scriptTitle,
              thumbnailUri: recording.thumbnailUri,
              recordingId: recordingId,
            });
          } else {}
        }
      } catch (error) {}
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

  const handlePreview = async () => {
    try {
      // Créer un enregistrement de démonstration
      const demoRecording = {
        id: "demo-preview",
        scriptId: "demo",
        scriptTitle: "Démo Prévisualisation",
        videoUri:
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        duration: 60,
        createdAt: new Date().toISOString(),
      };

      // Sauvegarder dans AsyncStorage
      const savedRecordings = await AsyncStorage.getItem("recordings");
      const recordings = savedRecordings ? JSON.parse(savedRecordings) : [];
      const exists = recordings.find((r: any) => r.id === demoRecording.id);

      if (!exists) {
        recordings.push(demoRecording);
        await AsyncStorage.setItem("recordings", JSON.stringify(recordings));
      }

      // Naviguer vers l'écran Preview
      navigation.navigate("Preview", {
        recordingId: "demo-preview",
        videoUri:
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        duration: 60,
        scriptTitle: "Démo Prévisualisation",
        scriptId: "demo",
      });
    } catch (error) {
      // Naviguer quand même vers Preview
      navigation.navigate("Preview", {
        recordingId: "demo-preview",
        videoUri:
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        duration: 60,
        scriptTitle: "Démo Prévisualisation",
        scriptId: "demo",
      });
    }
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
    handlePreview,
    // handleNodeEditor supprimé,
    handleTabChange,
    handleSettings,
  };
}
