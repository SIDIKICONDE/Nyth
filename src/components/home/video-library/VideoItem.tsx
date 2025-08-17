import { UIText } from "@/components/ui";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import LinearGradient from "react-native-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, TouchableOpacity, View } from "react-native";
import tw from "twrnc";
import { useTheme } from "../../../contexts/ThemeContext";
import { useTranslation } from "../../../hooks/useTranslation";
import { Recording, Script } from "../../../types";
import { toDate } from "../../../utils/dateHelpers";
import { FilmGrainEffect } from "./FilmGrainEffect";
import { getVideoColor } from "./VideoColors";
import { videoStyles } from "./VideoStyles";
import { VideoThumbnail } from "./VideoThumbnail";

interface VideoItemProps {
  recording: Recording;
  scripts: Script[];
  onPress: () => void;
  onLongPress: () => void;
  isSelected: boolean;
  onToggleSelection?: () => void;
  isSelectionModeActive: boolean;
  index: number;
}

export const VideoItem: React.FC<VideoItemProps> = ({
  recording,
  scripts,
  onPress,
  onLongPress,
  isSelected,
  onToggleSelection,
  isSelectionModeActive,
  index,
}) => {
  const { currentTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const animatedValue = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const shimmerAnimation = useRef(new Animated.Value(0)).current;

  // Animation de pulsation pour la LED
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.2,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Animation de brillance
  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.timing(shimmerAnimation, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    shimmer.start();
    return () => shimmer.stop();
  }, []);

  const handlePress = () => {
    if (isSelectionModeActive && onToggleSelection) {
      onToggleSelection();
    } else {
      // Animation de pression
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onPress();
      });
    }
  };

  const scale = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.95],
  });

  const colorPair = getVideoColor(index);

  const getScriptTitle = (scriptId: string): string => {
    const script = scripts.find((s) => s.id === scriptId);
    return (
      script?.title ?? t("home.recording.deletedScript", "Script supprimé")
    );
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(
      i18n.language === "fr" ? "fr-FR" : "en-US",
      {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      }
    );
  };

  const getQualityColor = () => {
    switch (recording.quality) {
      case "high":
        return "#27AE60";
      case "medium":
        return "#F39C12";
      case "low":
        return "#E74C3C";
      default:
        return "#95A5A6";
    }
  };

  // Vérifier si la vidéo est récente (moins de 24h)
  const isNew = () => {
    const now = new Date();
    const created = new Date(recording.createdAt);
    const diffHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
    return diffHours < 24;
  };

  // Obtenir la progression simulée (pour la démo)
  const getProgress = () => {
    // Simuler une progression basée sur l'ID pour la démo
    return Math.random() * 0.8 + 0.1;
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={
          t("home.record.play", "Lire la vidéo") +
          ` ${getScriptTitle(recording.scriptId ?? "")}`
        }
        onPress={handlePress}
        onLongPress={onLongPress}
        activeOpacity={0.8}
        style={[
          videoStyles.cassetteContainer,
          isSelected && {
            borderColor: currentTheme.colors.primary,
            borderWidth: 3,
            borderRadius: 6,
          },
        ]}
      >
        <LinearGradient
          colors={colorPair}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={videoStyles.cassetteBody}
        >
          {/* Effet 3D - côté droit */}
          <View
            style={[
              videoStyles.cassetteSide,
              { backgroundColor: colorPair[1] },
            ]}
          />

          {/* Effet 3D - dessus */}
          <View
            style={[videoStyles.cassetteTop, { backgroundColor: colorPair[0] }]}
          />

          {/* Effet de brillance animé */}
          <Animated.View
            style={[
              videoStyles.cassetteGloss,
              {
                opacity: shimmerAnimation.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.1, 0.3, 0.1],
                }),
              },
            ]}
          />

          {/* Effet holographique */}
          <LinearGradient
            colors={["transparent", `${colorPair[0]}20`, "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={videoStyles.holographicOverlay}
          />

          {/* Zone d'aperçu vidéo */}
          <View
            style={[
              videoStyles.cassetteLabel,
              {
                padding: 2,
                justifyContent: "space-between",
                alignItems: "center",
              },
            ]}
          >
            <View style={tw`items-center justify-center`}>
              <VideoThumbnail
                videoUri={recording.videoUri}
                width={134} // Largeur adaptée aux nouvelles dimensions (150-16)
                height={72} // Hauteur adaptée aux nouvelles dimensions (110-38)
                showPlayIcon={true}
              />
            </View>

            {/* Informations compactes en bas */}
            <View
              style={[
                videoStyles.cassetteInfo,
                { marginTop: 2, paddingVertical: 1, height: 16 },
              ]}
            >
              <View
                style={tw`flex-row justify-between items-center w-full h-full`}
              >
                <UIText
                  size="xs"
                  weight="bold"
                  style={videoStyles.cassetteDuration}
                >
                  {formatDuration(recording.duration)}
                </UIText>
                <UIText size="xs" style={videoStyles.cassetteDate}>
                  {formatDate(toDate(recording.createdAt))}
                </UIText>
              </View>
            </View>
          </View>

          {/* Trous de cassette (détail réaliste) */}
          <View style={videoStyles.cassetteHoles}>
            <View style={videoStyles.cassetteHole} />
            <View style={videoStyles.cassetteHole} />
          </View>

          {/* Effet de grain de film */}
          <FilmGrainEffect />

          {/* Indicateur de qualité (LED) avec pulsation */}
          <Animated.View
            style={[
              videoStyles.pulsingLed,
              {
                backgroundColor: getQualityColor(),
                transform: [{ scale: pulseAnimation }],
                shadowColor: getQualityColor(),
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 4,
                elevation: 3,
              },
            ]}
          />

          {/* Icône de sélection */}
          {isSelectionModeActive && (
            <View
              style={[
                videoStyles.selectionIcon,
                {
                  backgroundColor: isSelected
                    ? currentTheme.colors.primary
                    : "rgba(255,255,255,0.8)",
                },
              ]}
            >
              {isSelected && (
                <MaterialCommunityIcons name="check" size={12} color="white" />
              )}
            </View>
          )}

          {/* Badge overlay si présent */}
          {recording.hasOverlay && (
            <View
              style={{
                position: "absolute",
                bottom: 4,
                right: 4,
                backgroundColor: currentTheme.colors.accent,
                borderRadius: 8,
                paddingHorizontal: 4,
                paddingVertical: 1,
              }}
            >
              <UIText size="xs" weight="bold" style={{ color: "white" }}>
                📝
              </UIText>
            </View>
          )}

          {/* Badge NEW pour les vidéos récentes */}
          {isNew() && (
            <Animated.View
              style={[
                videoStyles.newBadge,
                {
                  transform: [
                    { rotate: "-15deg" },
                    {
                      scale: pulseAnimation.interpolate({
                        inputRange: [1, 1.2],
                        outputRange: [1, 1.1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <UIText style={videoStyles.newBadgeText}>NEW</UIText>
            </Animated.View>
          )}

          {/* Barre de progression */}
          <View style={videoStyles.progressBar}>
            <LinearGradient
              colors={[
                currentTheme.colors.primary,
                `${currentTheme.colors.primary}CC`,
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                videoStyles.progressFill,
                { width: `${getProgress() * 100}%` },
              ]}
            />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};
