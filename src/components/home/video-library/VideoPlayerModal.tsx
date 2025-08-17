import { BlurView } from "@react-native-community/blur";
import React, { useRef, useState } from "react";
import { Dimensions, Image, Modal, TouchableOpacity, View } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Video from "react-native-video";
import tw from "twrnc";
import { useTheme } from "../../../contexts/ThemeContext";
import { useCentralizedFont } from "../../../hooks/useCentralizedFont";
import { useTranslation } from "../../../hooks/useTranslation";
import { Recording } from "../../../types";
import { ContentText, UIText } from "../../ui/Typography";

import { createOptimizedLogger } from '../../../utils/optimizedLogger';
const logger = createOptimizedLogger('VideoPlayerModal');

interface VideoPlayerModalProps {
  visible: boolean;
  recording: Recording | null;
  onClose: () => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  visible,
  recording,
  onClose,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { ui, content } = useCentralizedFont();
  const { width, height } = Dimensions.get("window");
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<React.ElementRef<typeof Video> | null>(null);

  const videoUri = recording?.videoUri || recording?.uri || "";

  if (!recording) return null;

  logger.debug("🎬 VideoPlayerModal - Recording:", {
    id: recording.id,
    videoUri: videoUri,
    thumbnailUri: recording.thumbnailUri,
    scriptTitle: recording.scriptTitle,
  });

  const handlePlayVideo = () => {
    logger.debug(
      "🎬 Lancement de la lecture vidéo dans le modal:",
      recording.id
    );
    setIsPlaying(true);
    setShowPreview(false);
    setIsLoading(true);

    // Simuler la fin du chargement
    setTimeout(() => setIsLoading(false), 1000);
  };

  const handlePauseVideo = () => {
    logger.debug("⏸️ Retour à l'aperçu");
    setIsPlaying(false);
    setShowPreview(true);
    setIsLoading(false);
  };

  const handleClose = () => {
    setIsPlaying(false);
    setShowPreview(true);
    setIsLoading(false);
    onClose();
  };

  // Calculer les dimensions de la vidéo
  const getVideoDimensions = () => {
    const modalWidth = Math.min(width * 0.9, 400);
    const modalHeight = Math.min(height * 0.7, 600);

    // Utiliser presque tout l'espace du modal
    const videoWidth = modalWidth - 8; // Très petite marge
    const videoHeight = modalHeight - 40; // Espace minimal pour les contrôles

    return {
      width: videoWidth,
      height: videoHeight,
    };
  };

  const videoDimensions = getVideoDimensions();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <BlurView
        blurType="dark"
        blurAmount={10}
        style={tw`flex-1 justify-center items-center`}
      >
        <View
          style={[
            tw`relative overflow-hidden`,
            {
              backgroundColor: currentTheme.colors.surface,
              width: width * 0.9,
              height: height * 0.7,
              maxWidth: 400,
              maxHeight: 600,
              borderBottomLeftRadius: 16,
              borderBottomRightRadius: 16,
            },
          ]}
        >
          {/* Bouton de fermeture - masqué pendant la lecture */}
          {!isPlaying && (
            <TouchableOpacity
              onPress={handleClose}
              style={[
                tw`absolute top-4 right-4 z-10 w-10 h-10 rounded-full items-center justify-center`,
                { backgroundColor: "rgba(0,0,0,0.7)" },
              ]}
            >
              <MaterialCommunityIcons name="close" size={24} color="white" />
            </TouchableOpacity>
          )}

          {/* Contenu principal */}
          <View style={tw`flex-1`}>
            {showPreview && !isPlaying ? (
              // Mode aperçu avec thumbnail
              <View
                style={[
                  tw`flex-1 justify-center items-center`,
                  { backgroundColor: currentTheme.colors.background },
                ]}
              >
                {recording.thumbnailUri || videoUri ? (
                  <View style={tw`w-full h-full relative`}>
                    <Image
                      source={{ uri: recording.thumbnailUri || videoUri }}
                      style={tw`w-full h-full`}
                      resizeMode="contain"
                      onError={(error) => {
                        logger.debug(
                          "❌ Erreur chargement image:",
                          error.nativeEvent.error
                        );
                      }}
                    />

                    {/* Overlay sombre */}
                    <View
                      style={[
                        tw`absolute inset-0`,
                        { backgroundColor: "rgba(0,0,0,0.4)" },
                      ]}
                    />

                    {/* Bouton de lecture central */}
                    <View
                      style={tw`absolute inset-0 justify-center items-center`}
                    >
                      <TouchableOpacity
                        onPress={handlePlayVideo}
                        style={[
                          tw`w-20 h-20 rounded-full items-center justify-center`,
                          {
                            backgroundColor: "rgba(255,255,255,0.95)",
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 8,
                            elevation: 8,
                          },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name="play"
                          size={40}
                          color="#2C3E50"
                          style={{ marginLeft: 2 }}
                        />
                      </TouchableOpacity>

                      <UIText
                        size="base"
                        weight="semibold"
                        style={[
                          ui,
                          tw`text-center mt-4 px-4`,
                          {
                            color: "white",
                            textShadowColor: "rgba(0,0,0,0.8)",
                            textShadowOffset: { width: 0, height: 1 },
                            textShadowRadius: 3,
                          },
                        ]}
                      >
                        Appuyez pour lire la vidéo
                      </UIText>
                    </View>
                  </View>
                ) : (
                  <View style={tw`items-center`}>
                    <MaterialCommunityIcons
                      name="video"
                      size={64}
                      color={currentTheme.colors.textSecondary}
                    />
                    <UIText
                      style={[
                        ui,
                        tw`mt-4 text-center px-4`,
                        { color: currentTheme.colors.textSecondary },
                      ]}
                    >
                      Aperçu vidéo non disponible
                    </UIText>
                    <TouchableOpacity
                      onPress={handlePlayVideo}
                      style={[
                        tw`mt-6 px-6 py-3 rounded-full items-center justify-center`,
                        { backgroundColor: currentTheme.colors.primary },
                      ]}
                    >
                      <View style={tw`flex-row items-center`}>
                        <MaterialCommunityIcons
                          name="play"
                          size={20}
                          color="white"
                        />
                        <UIText
                          weight="semibold"
                          style={[ui, tw`ml-2`, { color: "white" }]}
                        >
                          Lire la vidéo
                        </UIText>
                      </View>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : (
              // Mode lecture vidéo avec react-native-video
              <View style={tw`flex-1 relative bg-black`}>
                {isLoading && (
                  <View
                    style={[
                      tw`absolute inset-0 justify-center items-center z-10`,
                      { backgroundColor: "rgba(0,0,0,0.7)" },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="loading"
                      size={48}
                      color="white"
                    />
                    <UIText style={[ui, tw`mt-2`, { color: "white" }]}>
                      Chargement de la vidéo...
                    </UIText>
                  </View>
                )}

                {videoUri && (
                  <Video
                    ref={videoRef}
                    source={{ uri: videoUri }}
                    style={{
                      width: videoDimensions.width,
                      height: videoDimensions.height,
                      alignSelf: "center",
                      marginTop: 8,
                    }}
                    resizeMode="contain"
                    controls={true}
                    paused={!isPlaying}
                    onLoad={() => setIsLoading(false)}
                    onError={(error) => {
                      logger.error("❌ Video playback error:", error);
                      setIsLoading(false);
                    }}
                  />
                )}

                {/* Bouton retour à l'aperçu - visible pendant la lecture */}
                {!showPreview && !isLoading && (
                  <TouchableOpacity
                    onPress={handlePauseVideo}
                    style={[
                      tw`absolute bottom-4 left-4 w-12 h-12 rounded-full items-center justify-center`,
                      { backgroundColor: "rgba(0,0,0,0.7)" },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="arrow-left"
                      size={24}
                      color="white"
                    />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Informations sur la vidéo - seulement en mode aperçu */}
          {!isPlaying && (
            <View
              style={[
                tw`absolute bottom-0 left-0 right-0 p-4`,
                { backgroundColor: "rgba(0,0,0,0.8)" },
              ]}
            >
              <UIText weight="semibold" style={[ui, { color: "white" }]}>
                {recording.scriptTitle ||
                  t("teleprompter.videoLibrary.actionModal.untitledVideo")}
              </UIText>
              <ContentText style={[content, tw`mt-1`, { color: "#d1d5db" }]}>
                {isPlaying
                  ? "Lecture en cours..."
                  : "Appuyez sur le bouton pour lire"}
              </ContentText>
            </View>
          )}
        </View>
      </BlurView>
    </Modal>
  );
};
