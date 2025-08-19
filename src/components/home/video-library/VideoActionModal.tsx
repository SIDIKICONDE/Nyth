import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { BlurView } from "@react-native-community/blur";
import React, { useState } from "react";
import { Modal, Pressable, TouchableOpacity, View } from "react-native";
import tw from "twrnc";
import { useTheme } from "../../../contexts/ThemeContext";
import { useCentralizedFont } from "../../../hooks/useCentralizedFont";
import { useTranslation } from "../../../hooks/useTranslation";
import { Recording, RootStackParamList } from "../../../types";
import { HeadingText, UIText } from "../../ui/Typography";
import { VideoPlayerModal } from "./VideoPlayerModal";

import { createOptimizedLogger } from '../../../utils/optimizedLogger';
const logger = createOptimizedLogger('VideoActionModal');

type VideoActionModalNavigationProp = StackNavigationProp<RootStackParamList>;

interface VideoActionModalProps {
  visible: boolean;
  recording: Recording | null;
  onClose: () => void;
  onPlayVideo: (recording: Recording) => void;
  onSendToPreview: (recording: Recording) => void;
}

export const VideoActionModal: React.FC<VideoActionModalProps> = ({
  visible,
  recording,
  onClose,
  onPlayVideo: _onPlayVideo,
  onSendToPreview: _onSendToPreview,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { ui, heading } = useCentralizedFont();
  const [videoPlayerVisible, setVideoPlayerVisible] = useState(false);
  const navigation = useNavigation<VideoActionModalNavigationProp>();

  if (!recording) return null;

  const handlePlayVideo = () => {
    logger.debug(
      "🎬 Ouverture du lecteur vidéo dans le modal pour:",
      recording.id
    );

    // Ouvrir le VideoPlayerModal
    setVideoPlayerVisible(true);
  };

  const handleSendToPreview = () => {
    logger.debug("🎬 Navigation vers l'écran Preview pour:", recording.id);

    // Fermer le modal
    onClose();

    // Naviguer vers l'écran Preview
    navigation.navigate("Preview", {
      recordingId: recording.id,
      videoUri: recording.videoUri || recording.uri || "",
      duration: recording.duration || 0,
      scriptId: recording.scriptId,
      scriptTitle: recording.scriptTitle,
      thumbnailUri: recording.thumbnailUri,
    });
  };

  const closeVideoPlayer = () => {
    setVideoPlayerVisible(false);
    // Fermer aussi le modal principal quand on ferme le lecteur vidéo
    onClose();
  };

  return (
    <>
      <Modal
        visible={visible && !videoPlayerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={onClose}
      >
        <Pressable
          style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}
          onPress={onClose}
        >
          <BlurView blurAmount={80} blurType="dark"
            style={[
              tw`rounded-2xl overflow-hidden`,
              { width: "85%", maxWidth: 320 },
            ]}
          >
            <View
              style={[
                tw`p-6`,
                { backgroundColor: currentTheme.colors.surface + "95" },
              ]}
            >
              {/* En-tête */}
              <View style={tw`items-center mb-6`}>
                <View
                  style={[
                    tw`w-16 h-16 rounded-full items-center justify-center mb-3`,
                    { backgroundColor: currentTheme.colors.primary + "20" },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="video"
                    size={32}
                    color={currentTheme.colors.primary}
                  />
                </View>
                <HeadingText
                  size="lg"
                  weight="bold"
                  style={[
                    heading,
                    tw`text-center`,
                    { color: currentTheme.colors.text },
                  ]}
                >
                  {t("teleprompter.videoLibrary.actionModal.title")}
                </HeadingText>
                <UIText
                  size="sm"
                  weight="medium"
                  style={[
                    ui,
                    tw`text-center mt-1 opacity-70`,
                    { color: currentTheme.colors.text },
                  ]}
                >
                  {recording.scriptTitle ||
                    t("teleprompter.videoLibrary.actionModal.untitledVideo")}
                </UIText>
              </View>

              {/* Options */}
              <View style={tw`gap-3`}>
                {/* Lire la vidéo */}
                <TouchableOpacity
                  onPress={handlePlayVideo}
                  style={[
                    tw`flex-row items-center p-4 rounded-xl`,
                    { backgroundColor: currentTheme.colors.primary + "15" },
                  ]}
                >
                  <View
                    style={[
                      tw`w-10 h-10 rounded-full items-center justify-center mr-3`,
                      { backgroundColor: currentTheme.colors.primary },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="play"
                      size={20}
                      color="white"
                    />
                  </View>
                  <View style={tw`flex-1`}>
                    <UIText
                      size="base"
                      weight="semibold"
                      style={[ui, { color: currentTheme.colors.text }]}
                    >
                      {t("teleprompter.videoLibrary.actionModal.playVideo")}
                    </UIText>
                    <UIText
                      size="sm"
                      weight="medium"
                      style={[
                        ui,
                        tw`opacity-70`,
                        { color: currentTheme.colors.text },
                      ]}
                    >
                      {t(
                        "teleprompter.videoLibrary.actionModal.playVideoDescription"
                      )}
                    </UIText>
                  </View>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={20}
                    color={currentTheme.colors.text + "60"}
                  />
                </TouchableOpacity>

                {/* Envoyer vers prévisualisation */}
                <TouchableOpacity
                  onPress={handleSendToPreview}
                  style={[
                    tw`flex-row items-center p-4 rounded-xl`,
                    { backgroundColor: currentTheme.colors.secondary + "15" },
                  ]}
                >
                  <View
                    style={[
                      tw`w-10 h-10 rounded-full items-center justify-center mr-3`,
                      { backgroundColor: currentTheme.colors.secondary },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="eye"
                      size={20}
                      color="white"
                    />
                  </View>
                  <View style={tw`flex-1`}>
                    <UIText
                      size="base"
                      weight="semibold"
                      style={[ui, { color: currentTheme.colors.text }]}
                    >
                      {t("teleprompter.videoLibrary.actionModal.sendToPreview")}
                    </UIText>
                    <UIText
                      size="sm"
                      weight="medium"
                      style={[
                        ui,
                        tw`opacity-70`,
                        { color: currentTheme.colors.text },
                      ]}
                    >
                      {t(
                        "teleprompter.videoLibrary.actionModal.sendToPreviewDescription"
                      )}
                    </UIText>
                  </View>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={20}
                    color={currentTheme.colors.text + "60"}
                  />
                </TouchableOpacity>
              </View>

              {/* Bouton Annuler */}
              <TouchableOpacity
                onPress={onClose}
                style={[
                  tw`mt-4 p-3 rounded-xl items-center`,
                  { backgroundColor: currentTheme.colors.surface },
                ]}
              >
                <UIText
                  size="base"
                  weight="medium"
                  style={[ui, { color: currentTheme.colors.text + "80" }]}
                >
                  {t("common.cancel")}
                </UIText>
              </TouchableOpacity>
            </View>
          </BlurView>
        </Pressable>
      </Modal>

      {/* Modal de lecture vidéo */}
      <VideoPlayerModal
        visible={videoPlayerVisible}
        recording={recording}
        onClose={closeVideoPlayer}
      />
    </>
  );
};
