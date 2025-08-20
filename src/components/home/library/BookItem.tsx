import { UIText } from "@/components/ui";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import LinearGradient from "react-native-linear-gradient";
import React, { useState } from "react";
import { Animated, Image, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../../contexts/ThemeContext";
import { RecordingSettings, Script, RootStackParamList } from "../../../types";
import {
  VideoCodec,
  VideoQuality,
  VideoStabilization,
} from "../../../types/video";
import { TeleprompterSelectionModal } from "../../editor/TeleprompterSelectionModal";
import { getBookColor } from "./BookColors";
import { bookStyles } from "./BookStyles";
import { useDeviceTilt } from "../../../hooks/useDeviceTilt";

import { createOptimizedLogger } from '../../../utils/optimizedLogger';
const logger = createOptimizedLogger('BookItem');

interface BookItemProps {
  script: Script;
  onPress: () => void;
  onLongPress: () => void;
  isSelected: boolean;
  onToggleSelection?: () => void;
  isSelectionModeActive: boolean;
  index: number;
  onScriptShare?: (scriptId: string) => void;
  onScriptDuplicate?: (scriptId: string) => void;
  onScriptExport?: (scriptId: string) => void;
  onScriptDelete?: (scriptId: string) => void;
  onToggleFavorite?: (scriptId: string) => void;
}

export const BookItem: React.FC<BookItemProps> = ({
  script,
  onPress,
  onLongPress,
  isSelected,
  onToggleSelection,
  isSelectionModeActive,
  index,
  onScriptShare,
  onScriptDuplicate,
  onScriptExport,
  onScriptDelete,
  onToggleFavorite,
}) => {
  const { currentTheme } = useTheme();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const animatedValue = new Animated.Value(0);
  const longPressAnim = new Animated.Value(0);
  const [showTeleprompterModal, setShowTeleprompterModal] = useState(false);

  const { rotation, isAvailable, disableGyroscope, enableGyroscope } =
    useDeviceTilt(0.4, 15, {
      disableDuringTouch: true,
      disableDuringScroll: true,
    });

  const depthFactor = 1 - (index % 4) * 0.15;
  const adjustedRotation = isAvailable
    ? rotation.replace(/(-?\d+\.?\d*)deg/, (match, degrees) => {
        const adjustedDegrees = parseFloat(degrees) * depthFactor * 0.6;
        return `${adjustedDegrees.toFixed(1)}deg`;
      })
    : "0deg";

  const floatAnim = React.useRef(new Animated.Value(0)).current;
  const rotationAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    logger.debug(`📚 BookItem ${script.title} - Démarrage des animations`);

    const startFloatAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: 1,
            duration: 3000 + index * 200, // Délai différent par cahier
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 3000 + index * 200,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    // Animation de rotation subtile
    const startRotationAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(rotationAnim, {
            toValue: 1,
            duration: 8000 + index * 500,
            useNativeDriver: true,
          }),
          Animated.timing(rotationAnim, {
            toValue: 0,
            duration: 8000 + index * 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    startFloatAnimation();
    startRotationAnimation();

    // Cleanup au démontage
    return () => {
      logger.debug(`📚 BookItem ${script.title} - Cleanup des animations`);

      // Arrêter les animations
      floatAnim.stopAnimation();
      rotationAnim.stopAnimation();

      // Reset des valeurs d'animation
      floatAnim.setValue(0);
      rotationAnim.setValue(0);
    };
  }, [index, script.title, floatAnim, rotationAnim]);

  // Interpolations pour les animations
  const floatInterpolation = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -3], // Mouvement vertical de 3px
  });

  const rotationInterpolation = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["-0.5deg", "0.5deg"], // Rotation subtile de ±0.5°
  });

  // Rotation subtile déterministe par index pour un rendu organique
  const rotationDeg = `${((index % 5) - 2) * 0.6}deg`; // -1.2° à +1.2°

  // Debug: vérifier si les fonctions sont bien reçues
  React.useEffect(() => {
    logger.debug(`📚 BookItem ${script.title} - Props reçues:`, {
      onScriptShare: !!onScriptShare,
      onScriptDuplicate: !!onScriptDuplicate,
      onScriptExport: !!onScriptExport,
      onScriptDelete: !!onScriptDelete,
      onToggleFavorite: !!onToggleFavorite,
    });
  }, [
    onScriptShare,
    onScriptDuplicate,
    onScriptExport,
    onScriptDelete,
    onToggleFavorite,
    script.title,
  ]);

  // Cleanup global au démontage du composant
  React.useEffect(() => {
    return () => {
      logger.debug(`📚 BookItem ${script.title} - Cleanup global du composant`);

      // S'assurer que le gyroscope est réactivé au démontage
      if (enableGyroscope) {
        enableGyroscope();
      }
    };
  }, [script.title, enableGyroscope]);

  // Fonction pour charger les paramètres par défaut et naviguer vers l'écran d'enregistrement
  const loadDefaultSettingsAndNavigate = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem("recordingSettings");
      let settings: RecordingSettings;

      if (savedSettings) {
        settings = JSON.parse(savedSettings);
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
        scriptId: script.id,
        settings: settings,
      });
    } catch (error) {
      logger.error("Erreur lors du chargement des paramètres:", error);
      navigation.navigate("Settings", { scriptId: script.id });
    }
  };

  // Navigation vers le téléprompter standard
  const navigateToTeleprompter = () => {
    setShowTeleprompterModal(false);
    loadDefaultSettingsAndNavigate();
  };

  const handlePress = () => {
    // Désactiver temporairement le gyroscope pendant l'interaction
    disableGyroscope();

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
        // Afficher le modal au lieu d'appeler onPress directement
        setShowTeleprompterModal(true);
      });
    }

    // Réactiver le gyroscope après un délai
    setTimeout(() => {
      enableGyroscope();
    }, 500);
  };

  const handleLongPressEnhanced = () => {
    // Désactiver le gyroscope pendant le long press
    disableGyroscope();

    // Animation de "feuille qui glisse" (translateY)
    Animated.sequence([
      Animated.timing(longPressAnim, {
        toValue: -6,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(longPressAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    // Propager l'événement long press original
    onLongPress();

    // Réactiver le gyroscope après un délai plus long pour le long press
    setTimeout(() => {
      enableGyroscope();
    }, 1000);
  };

  const scale = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.95],
  });

  const translateY = longPressAnim;

  const colorPair = getBookColor(index);

  // Utilitaire simple pour convertir un hex en rgba avec alpha (%)
  const hexToRgba = (hex: string, alpha: number = 0.4) => {
    const sanitized = hex.replace("#", "");
    const bigint = parseInt(sanitized, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r},${g},${b},${alpha})`;
  };

  // Générer les trous de spirale
  const renderSpiralHoles = () => {
    const holes = [];
    // Plus de trous pour un effet plus réaliste
    for (let i = 0; i < 16; i++) {
      holes.push(
        <View
          key={i}
          style={[
            bookStyles.spiralHole,
            {
              marginVertical: i % 2 === 0 ? 2 : 1, // Espacement alterné
            },
          ]}
        />
      );
    }
    return holes;
  };

  return (
    <>
      <Animated.View
        style={{
          transform: [
            { scale },
            { translateY },
            { rotate: rotationDeg },
            { translateY: floatInterpolation }, // Appliquer l'animation de flottement
            { rotate: rotationInterpolation }, // Appliquer l'animation de rotation
            // Optimisation : appliquer la rotation gyroscope seulement si disponible et significative
            ...(isAvailable && adjustedRotation !== "0deg"
              ? [{ rotate: adjustedRotation }]
              : []),
          ],
        }}
      >
        <TouchableOpacity
          onPress={handlePress}
          onLongPress={handleLongPressEnhanced}
          activeOpacity={0.8}
          style={[
            bookStyles.bookContainer,
            isSelected && {
              borderColor: currentTheme.colors.primary,
              borderWidth: 2,
              borderRadius: 8,
            },
          ]}
        >
          <LinearGradient
            colors={colorPair}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0.1 }}
            style={bookStyles.bookSpine}
          >
            {/* Texture de papier/cuir simulée avec gradient */}
            <LinearGradient
              colors={[
                "rgba(255,255,255,0.05)",
                "rgba(255,255,255,0.02)",
                "rgba(0,0,0,0.05)",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={bookStyles.bookTexture}
            />

            {/* Texture de bruit subtile répétée */}
            <Image
              source={{
                uri: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAB7GkOtAAAAEklEQVR42mNgYGD4z8DAwMAABEYBAMcHS58AAAAAElFTkSuQmCC",
              }}
              style={bookStyles.noiseTexture}
              resizeMode="repeat"
            />

            {/* Reliure avec spirales */}
            <View style={bookStyles.bookBinding}>
              <View style={bookStyles.spiralHoles}>{renderSpiralHoles()}</View>
            </View>

            {/* Élastique de fermeture */}
            <View
              style={[
                bookStyles.elasticBand,
                {
                  backgroundColor: hexToRgba(currentTheme.colors.primary, 0.5),
                },
              ]}
            />

            {/* Contenu principal */}
            <View style={bookStyles.titleContainer}>
              <UIText
                size="sm"
                weight="semibold"
                style={bookStyles.bookTitle}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {script.title}
              </UIText>

              {/* Métadonnées */}
              <View style={bookStyles.bookFooter}>
                <UIText size="xs" style={bookStyles.bookDate} numberOfLines={1}>
                  {new Date(script.createdAt).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "2-digit",
                  })}
                </UIText>
              </View>
            </View>

            {/* Pages sur le côté */}
            <View style={bookStyles.bookPages} />

            {/* Pages individuelles visibles */}
            <View style={[bookStyles.pageLayer, bookStyles.pageLayer1]} />
            <View style={[bookStyles.pageLayer, bookStyles.pageLayer2]} />
            <View style={[bookStyles.pageLayer, bookStyles.pageLayer3]} />

            {/* Lignes de papier pour l'effet cahier */}
            <View style={bookStyles.paperLines}>
              {[...Array(8)].map((_, i) => (
                <View key={i} style={bookStyles.paperLine} />
              ))}
            </View>

            {/* Décorations artistiques */}
            <View style={bookStyles.artisticDecorations}>
              {/* Bordure décorative */}
              <View style={bookStyles.decorativeBorder} />

              {/* Points décoratifs avec animation */}
              <Animated.View
                style={[
                  bookStyles.decorativeDots,
                  {
                    transform: [
                      {
                        translateY: floatAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                {[...Array(3)].map((_, i) => (
                  <View key={i} style={bookStyles.decorativeDot} />
                ))}
              </Animated.View>

              {/* Étoile décorative avec animation */}
              <Animated.View
                style={[
                  bookStyles.starDecoration,
                  {
                    transform: [
                      {
                        rotate: rotationAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ["0deg", "360deg"],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <UIText size="xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                  ✨
                </UIText>
              </Animated.View>

              {/* Vagues décoratives avec animation */}
              <Animated.View
                style={[
                  bookStyles.waveDecoration,
                  {
                    transform: [
                      {
                        translateX: rotationAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 2],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <UIText size="xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                  〰️
                </UIText>
              </Animated.View>
            </View>

            {/* Indicateur de favori - Badge premium */}
            {script.isFavorite && !isSelectionModeActive && (
              <View style={bookStyles.premiumBadge}>
                <MaterialCommunityIcons name="star" size={18} color="#FFF" />
              </View>
            )}

            {/* Icône de sélection */}
            {isSelectionModeActive && (
              <View
                style={[
                  bookStyles.selectionIcon,
                  isSelected && {
                    backgroundColor: currentTheme.colors.primary,
                    borderColor: currentTheme.colors.primary,
                  },
                ]}
              >
                {isSelected && (
                  <MaterialCommunityIcons
                    name="check"
                    size={16}
                    color="white"
                  />
                )}
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Modal de sélection du téléprompter */}
      <TeleprompterSelectionModal
        visible={showTeleprompterModal}
        onClose={() => setShowTeleprompterModal(false)}
        onSelectTeleprompterWithCamera={navigateToTeleprompter}
        onEdit={() => {
          setShowTeleprompterModal(false);
          onPress();
        }}
        onToggleFavorite={
          onToggleFavorite
            ? () => {
                setShowTeleprompterModal(false);
                onToggleFavorite(script.id);
              }
            : undefined
        }
        isFavorite={script.isFavorite}
        onDuplicate={
          onScriptDuplicate
            ? () => {
                logger.debug(
                  `📋 BookItem - Duplication du script: ${script.title} (${script.id})`
                );
                setShowTeleprompterModal(false);
                onScriptDuplicate(script.id);
              }
            : undefined
        }
        onDelete={
          onScriptDelete
            ? () => {
                setShowTeleprompterModal(false);
                onScriptDelete(script.id);
              }
            : undefined
        }
      />
    </>
  );
};
