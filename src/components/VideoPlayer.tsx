import React, { useEffect, useState } from "react";
import { Dimensions, View, Alert } from "react-native";
import RNFS from "react-native-fs";
import Video from "react-native-video";
import tw from "twrnc";
import { useTheme } from "../contexts/ThemeContext";
import { useCentralizedFont } from "../hooks/useCentralizedFont";
import { useTranslation } from "../hooks/useTranslation";
import { UIText } from "./ui/Typography";

import { createOptimizedLogger } from '../utils/optimizedLogger';
const logger = createOptimizedLogger('VideoPlayer');

interface VideoPlayerProps {
  videoUri: string;
  showFormatInfo?: boolean;
  formatOverride?: string;
  qualityOverride?: "480p" | "720p" | "1080p" | "4K";
  enableColorFilters?: boolean;
  videoId?: string;
  onVideoRef?: (ref: unknown) => void;
}

const { width: screenWidth } = Dimensions.get("window");

export default function VideoPlayer({
  videoUri,
  showFormatInfo = false,
  formatOverride,
  qualityOverride,
  enableColorFilters = true,
  videoId,
  onVideoRef,
}: VideoPlayerProps) {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { ui } = useCentralizedFont();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1.0);
  const [videoFormat, setVideoFormat] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Référence pour le lecteur vidéo React Native
  const playerRef = React.useRef<React.ElementRef<typeof Video> | null>(null);

  // Intégration égaliseur pour cette vidéo
  const uniqueVideoId =
    videoId || `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Validation de l'URI vidéo
  const toLocalPath = (uri: string): string =>
    uri && uri.startsWith("file://") ? uri.replace("file://", "") : uri;

  const validateVideoUri = async (uri: string) => {
    try {
      if (!uri || uri.trim() === "") {
        throw new Error("URI vidéo vide");
      }

      // Vérifier si le fichier existe
      const fileExists = await RNFS.exists(toLocalPath(uri));
      if (!fileExists) {
        throw new Error("Fichier vidéo introuvable");
      }

      const fileInfo = await RNFS.stat(toLocalPath(uri));
      if (!fileInfo.isFile()) {
        throw new Error("Le chemin ne pointe pas vers un fichier valide");
      }

      return true;
    } catch (error) {
      logger.error("❌ Video validation failed:", error);
      return false;
    }
  };

  useEffect(() => {
    const initializeVideo = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        setErrorMessage(null);

        // Valider l'URI vidéo
        const isValid = await validateVideoUri(videoUri);
        if (!isValid) {
          setHasError(true);
          setErrorMessage("Fichier vidéo non disponible");
          setIsLoading(false);
          return;
        }

        if (showFormatInfo) {
          if (formatOverride) {
            setVideoFormat(formatOverride.toUpperCase());
          } else {
            await detectVideoFormat(videoUri);
          }
        }

        // Simuler un délai de chargement
        const timer = setTimeout(() => {
          setIsLoading(false);
        }, 1000);

        return () => {
          clearTimeout(timer);
        };
      } catch (error) {
        logger.error("❌ Error initializing video:", error);
        setHasError(true);
        setErrorMessage("Erreur lors de l'initialisation");
        setIsLoading(false);
        return; // Ajouter un return explicite pour ce path
      }
    };

    initializeVideo();
  }, [videoUri, formatOverride, qualityOverride, showFormatInfo]);

  // Effet pour notifier la référence vidéo
  useEffect(() => {
    if (onVideoRef && playerRef.current && !hasError) {
      try {
        onVideoRef(playerRef.current);
      } catch (error) {
        logger.warn("⚠️ Error setting video ref:", error);
      }
    }
  }, [onVideoRef, hasError]);

  const handleVideoLoad = (data: unknown) => {
    try {
      logger.debug("✅ Video loaded successfully:", data);
      setIsLoading(false);
      setHasError(false);
      setErrorMessage(null);
    } catch (error) {
      logger.warn("⚠️ Error in video load handler:", error);
    }
  };

  const handleVideoError = (error: unknown) => {
    logger.error("❌ Video playback error:", error);
    setIsLoading(false);
    setHasError(true);
    setErrorMessage("Erreur de lecture vidéo");
  };

  useEffect(() => {
    if (!isLoading && !hasError && playerRef.current) {
      logger.debug(`🎵 Lecteur vidéo initialisé pour ${uniqueVideoId}`);
    }
  }, [isLoading, hasError, uniqueVideoId]);

  // Nettoyage du lecteur lors du démontage du composant
  useEffect(() => {
    return () => {
      logger.debug("🧹 Cleaning up video player");
      try {
        if (playerRef.current) {
          // Nettoyer les ressources du lecteur si nécessaire
        }
      } catch (error) {
        logger.warn("⚠️ Error during video player cleanup:", error);
      }
    };
  }, []);

  // Function to calculate video dimensions based on quality
  const getVideoDimensions = () => {
    const availableWidth = screenWidth - 16;
    let aspectRatio = 16 / 9;
    let maxHeight = (availableWidth * 9) / 16;

    if (qualityOverride) {
      switch (qualityOverride) {
        case "4K":
        case "1080p":
        case "720p":
          maxHeight = (availableWidth * 9) / 16;
          break;
        case "480p":
          aspectRatio = 4 / 3;
          maxHeight = (availableWidth * 3) / 4;
          break;
        default:
          maxHeight = (availableWidth * 9) / 16;
      }
    }

    return {
      width: availableWidth,
      height: maxHeight,
      aspectRatio,
    };
  };

  const dimensions = getVideoDimensions();

  const getQualityBadgeColor = () => {
    if (!qualityOverride) return "rgba(150, 150, 150, 0.8)";

    switch (qualityOverride) {
      case "4K":
        return "rgba(255, 59, 48, 0.8)";
      case "1080p":
        return "rgba(52, 199, 89, 0.8)";
      case "720p":
        return "rgba(0, 122, 255, 0.8)";
      case "480p":
        return "rgba(255, 149, 0, 0.8)";
      default:
        return "rgba(150, 150, 150, 0.8)";
    }
  };

  const getQualityLabel = () => {
    if (!qualityOverride) {
      return videoFormat || t("videoPlayer.formats.mp4", "MP4");
    }

    let qualityText = "";
    switch (qualityOverride) {
      case "4K":
        qualityText = t("videoPlayer.quality.uhd", "4K UHD");
        break;
      case "1080p":
        qualityText = t("videoPlayer.quality.fhd", "FHD");
        break;
      case "720p":
        qualityText = t("videoPlayer.quality.hd", "HD");
        break;
      case "480p":
        qualityText = t("videoPlayer.quality.sd", "SD");
        break;
      default:
        qualityText = qualityOverride;
    }

    return `${qualityText} ${videoFormat || ""}`;
  };

  const detectVideoFormat = async (uri: string) => {
    try {
      if (formatOverride) {
        setVideoFormat(formatOverride.toUpperCase());
        return;
      }

      logger.debug("🔍 Detecting format for:", uri);
      const extension = uri.split(".").pop()?.toLowerCase();

      if (extension === "mp4") {
        setVideoFormat(t("videoPlayer.formats.mp4", "MP4"));
      } else if (extension === "mov") {
        setVideoFormat(t("videoPlayer.formats.mov", "MOV"));
      } else if (extension === "hevc") {
        setVideoFormat(t("videoPlayer.formats.hevc", "HEVC"));
      } else {
        // Utiliser RNFS pour obtenir les informations du fichier
        const fileInfo = await RNFS.stat(toLocalPath(uri));
        if (fileInfo.isFile()) {
          if (uri.includes("mp4")) {
            setVideoFormat(t("videoPlayer.formats.mp4", "MP4"));
          } else if (uri.includes("mov") || uri.includes("quicktime")) {
            setVideoFormat(t("videoPlayer.formats.mov", "MOV"));
          } else {
            setVideoFormat(t("videoPlayer.formats.unknown", "Unknown"));
          }
        }
      }
    } catch (error) {
      logger.warn("⚠️ Error detecting video format:", error);
      setVideoFormat(t("videoPlayer.formats.error", "Error"));
    }
  };

  const togglePlayback = () => {
    if (!hasError) {
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (!hasError) {
      setIsMuted(!isMuted);
    }
  };

  const adjustVolume = (newVolume: number) => {
    if (!hasError) {
      setVolume(newVolume);
      if (newVolume === 0) {
        setIsMuted(true);
      } else if (isMuted) {
        setIsMuted(false);
      }
    }
  };

  // Affichage d'erreur
  if (hasError) {
    return (
      <View
        style={[
          tw`rounded-xl overflow-hidden items-center justify-center`,
          {
            width: dimensions.width,
            height: dimensions.height,
            backgroundColor: currentTheme.colors.surface,
            borderWidth: 1,
            borderColor: "#ef4444",
          },
        ]}
      >
        <View style={tw`items-center p-4`}>
          <View
            style={[
              tw`w-12 h-12 rounded-full items-center justify-center mb-3`,
              { backgroundColor: "#fef2f2" },
            ]}
          >
            <UIText style={{ color: "#ef4444", fontSize: 24 }}>⚠️</UIText>
          </View>
          <UIText
            size="base"
            weight="semibold"
            style={[
              ui,
              tw`mb-2 text-center`,
              { color: currentTheme.colors.text },
            ]}
          >
            Erreur de lecture
          </UIText>
          <UIText
            size="sm"
            style={[
              ui,
              tw`text-center`,
              { color: currentTheme.colors.textSecondary },
            ]}
          >
            {errorMessage || "Impossible de lire la vidéo"}
          </UIText>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        tw`rounded-xl overflow-hidden`,
        {
          backgroundColor: currentTheme.colors.surface,
          shadowColor: currentTheme.colors.primary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 6,
          elevation: 4,
          borderWidth: 1,
          borderColor: currentTheme.colors.border,
        },
      ]}
    >
      <Video
        ref={playerRef}
        source={{ uri: videoUri }}
        style={{
          width: dimensions.width,
          height: dimensions.height,
        }}
        resizeMode="contain"
        controls={true}
        paused={!isPlaying}
        muted={isMuted}
        volume={volume}
        onLoad={handleVideoLoad}
        onError={handleVideoError}
        // Configuration audio pour l'égaliseur
        audioOutput="speaker"
        progressUpdateInterval={100}
        playInBackground={false}
        playWhenInactive={false}
        // Paramètres de robustesse
        ignoreSilentSwitch="ignore"
        mixWithOthers="duck"
      />

      {/* Loading indicator */}
      {isLoading && (
        <View
          style={[
            tw`absolute inset-0 items-center justify-center`,
            { backgroundColor: "rgba(0, 0, 0, 0.3)" },
          ]}
        >
          <View
            style={[
              tw`rounded-lg p-3 items-center`,
              { backgroundColor: `${currentTheme.colors.surface}F0` },
            ]}
          >
            <UIText
              size="sm"
              weight="medium"
              style={[ui, { color: currentTheme.colors.text }]}
            >
              {t("videoPlayer.loading", "Chargement...")}
            </UIText>
          </View>
        </View>
      )}

      {/* Masqué : Format badge */}
      {false && showFormatInfo && videoFormat && (
        <View
          style={[
            tw`absolute top-3 right-3 px-2 py-1 rounded-lg`,
            { backgroundColor: getQualityBadgeColor() },
          ]}
        >
          <UIText size="xs" weight="semibold" style={[ui, { color: "white" }]}>
            {getQualityLabel()}
          </UIText>
        </View>
      )}
    </View>
  );
}
