import React, { useState, useEffect } from "react";
import { View } from "react-native";
import tw from "twrnc";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Animated, {
  FadeIn,
  FadeInDown,
  SlideInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { UIText } from "../ui/Typography";
import { useTheme } from "../../contexts/ThemeContext";
import { useCentralizedFont } from "../../hooks/useCentralizedFont";
import { useTranslation } from "../../hooks/useTranslation";
import { Recording } from "../../types";
import VideoPlayer from "../VideoPlayer";
import VideoStats from "../VideoStats";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface VideoPlayerSectionProps {
  recording: Recording;
  previewVideoUri: string | null;
  isGeneratingPreview: boolean;
  videoSize: string;
  exportFormat?: "mp4" | "mov";
  exportQuality?: "720p" | "1080p" | "4K" | "480p";
}

export function VideoPlayerSection({
  recording,
  previewVideoUri,
  isGeneratingPreview,
  videoSize,
  exportFormat,
  exportQuality,
}: VideoPlayerSectionProps) {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { ui } = useCentralizedFont();
  const [localIsGeneratingPreview, setLocalIsGeneratingPreview] =
    useState(isGeneratingPreview);
  const [localPreviewVideoUri, setLocalPreviewVideoUri] =
    useState(previewVideoUri);
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      const subscription = await AsyncStorage.getItem("subscription");
      if (subscription) {
        const data = JSON.parse(subscription);
        setIsSubscribed(data.isActive === true);
      } else {
        setIsSubscribed(false);
      }
    } catch (error) {
      setIsSubscribed(false);
    }
  };

  // Animation values
  const overlayOpacity = useSharedValue(0);
  const overlayScale = useSharedValue(0.9);

  // Fonction pour obtenir la résolution en fonction de la qualité
  const getResolution = () => {
    if (!exportQuality) return "1280x720";

    switch (exportQuality) {
      case "4K":
        return "3840x2160";
      case "1080p":
        return "1920x1080";
      case "720p":
        return "1280x720";
      case "480p":
        return "854x480";
      default:
        return "1280x720";
    }
  };

  // Convertir la qualité en un format valide pour le VideoPlayer
  const getSafeQuality = (): "480p" | "720p" | "1080p" | "4K" | undefined => {
    if (
      exportQuality === "4K" ||
      exportQuality === "1080p" ||
      exportQuality === "720p" ||
      exportQuality === "480p"
    ) {
      return exportQuality;
    }
    return undefined;
  };

  // Utiliser l'URI de prévisualisation ou l'URI original
  const videoUri = previewVideoUri || recording.videoUri;

  // Get quality color
  const getQualityColor = (quality: string) => {
    switch (quality) {
      case "480p":
        return "#ef4444";
      case "720p":
        return "#3b82f6";
      case "1080p":
        return "#10b981";
      case "4K":
        return "#f59e0b";
      default:
        return "#3b82f6";
    }
  };

  const qualityColor = getQualityColor(exportQuality || "720p");

  // Animation pour l'overlay de génération
  React.useEffect(() => {
    if (isGeneratingPreview) {
      overlayOpacity.value = withSpring(1, { damping: 15 });
      overlayScale.value = withSpring(1, { damping: 15 });
    } else {
      overlayOpacity.value = withSpring(0, { damping: 15 });
      overlayScale.value = withSpring(0.9, { damping: 15 });
    }
  }, [isGeneratingPreview]);

  const overlayAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: overlayOpacity.value,
      transform: [{ scale: overlayScale.value }],
    };
  });

  return (
    <View style={tw`relative`}>
      {/* Conteneur principal avec bordures arrondies */}
      <View style={tw`overflow-hidden rounded-2xl relative`}>
        {/* Conteneur vidéo avec transitions fluides */}
        <Animated.View
          key={`video-${exportFormat}-${exportQuality}`}
          entering={FadeIn.duration(400).springify()}
          exiting={FadeIn.duration(200)}
          style={tw`items-center justify-center`}
        >
          <VideoPlayer
            videoUri={localPreviewVideoUri || recording.videoUri}
            showFormatInfo={true}
            formatOverride={exportFormat}
            qualityOverride={getSafeQuality()}
            enableColorFilters={true}
            videoId="preview-player"
          />
        </Animated.View>

        {/* Overlay de génération moderne */}
        {isGeneratingPreview && (
          <Animated.View
            style={[
              tw`absolute inset-0 flex items-center justify-center z-10`,
              { backgroundColor: "rgba(0, 0, 0, 0.75)" },
            ]}
          >
            {/* Gradient de fond */}
            <Animated.View
              style={[
                tw`absolute inset-0`,
                {
                  backgroundColor: `${qualityColor}25`,
                },
              ]}
            />
            <Animated.View
              style={[
                tw`absolute inset-0`,
                {
                  backgroundColor: `${qualityColor}15`,
                },
              ]}
            />
            <Animated.View
              style={[
                tw`absolute inset-0`,
                {
                  backgroundColor: `${qualityColor}05`,
                },
              ]}
            />

            {/* Contenu de l'overlay */}
            <Animated.View
              style={[overlayAnimatedStyle, tw`items-center mx-4`]}
            >
              <View
                style={[
                  tw`rounded-2xl p-6 items-center min-w-60`,
                  {
                    backgroundColor: `${currentTheme.colors.surface}F5`,
                    borderWidth: 1,
                    borderColor: `${qualityColor}40`,
                    shadowColor: qualityColor,
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.3,
                    shadowRadius: 16,
                    elevation: 12,
                  },
                ]}
              >
                {/* Icône animée */}
                <Animated.View
                  entering={FadeIn.delay(200).duration(400)}
                  style={[
                    tw`w-16 h-16 rounded-full items-center justify-center mb-4`,
                    { backgroundColor: `${qualityColor}20` },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="video-outline"
                    size={32}
                    color={qualityColor}
                  />
                </Animated.View>

                {/* Texte principal */}
                <Animated.View entering={FadeInDown.delay(300).duration(400)}>
                  <UIText
                    size="lg"
                    weight="bold"
                    style={[
                      ui,
                      tw`mb-2 text-center`,
                      { color: currentTheme.colors.text },
                    ]}
                  >
                    {t("preview.generating", "Génération en cours")}
                  </UIText>
                </Animated.View>

                {/* Sous-texte */}
                <Animated.View entering={FadeInDown.delay(400).duration(400)}>
                  <UIText
                    size="sm"
                    style={[
                      ui,
                      tw`text-center mb-3`,
                      { color: currentTheme.colors.textSecondary },
                    ]}
                  >
                    {t("preview.preparingVideo", "Préparation de votre vidéo")}
                  </UIText>
                </Animated.View>

                {/* Badge de qualité - MASQUÉ */}
                {false && (
                  <Animated.View
                    entering={FadeInDown.delay(500).duration(400)}
                    style={[
                      tw`px-4 py-2 rounded-full`,
                      { backgroundColor: `${qualityColor}15` },
                    ]}
                  >
                    <UIText
                      size="sm"
                      weight="semibold"
                      style={[ui, { color: qualityColor }]}
                    >
                      {exportFormat?.toUpperCase()} • {exportQuality}
                    </UIText>
                  </Animated.View>
                )}
              </View>
            </Animated.View>
          </Animated.View>
        )}
      </View>

      {/* Statistiques vidéo avec animation - MASQUÉ */}
      {false && (
        <Animated.View
          entering={FadeInDown.delay(400).duration(500).springify()}
          style={tw`mt-4`}
        >
          <View
            style={[
              tw`rounded-xl p-4`,
              {
                backgroundColor: currentTheme.colors.surface,
                borderWidth: 1,
                borderColor: `${currentTheme.colors.border}30`,
                shadowColor: currentTheme.colors.text,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 3,
              },
            ]}
          >
            <VideoStats
              duration={recording.duration || 0}
              size={videoSize}
              resolution={getResolution()}
              format={exportFormat}
            />
          </View>
        </Animated.View>
      )}
    </View>
  );
}
