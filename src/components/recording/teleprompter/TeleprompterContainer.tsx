import React, { useRef, useEffect, useCallback, useState } from "react";
import {
  Animated,
  View,
  StyleSheet,
  Dimensions,
  Platform,
  TouchableOpacity,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { BlurView } from "@react-native-community/blur";
import LinearGradient from "react-native-linear-gradient";
import tw from "twrnc";
import { useTheme } from "../../../contexts/ThemeContext";
import { TeleprompterContent } from "./TeleprompterContent";
import { TeleprompterHeader } from "./TeleprompterHeader";
import { TeleprompterFooter } from "./TeleprompterFooter";
import { TeleprompterSpeedIndicator } from "./TeleprompterSpeedIndicator";
import { ResetIndicator } from "./components/ResetIndicator";
import { useContainerGestures } from "./useContainerGestures";
import { useScrollAnimation } from "./useScrollAnimation";
import { useTeleprompterState } from "./hooks/useTeleprompterState";
import { useTeleprompterEffects } from "./hooks/useTeleprompterEffects";
import { useDoubleTapHandler } from "./hooks/useDoubleTapHandler";
import { useTouchHandlers } from "./hooks/useTouchHandlers";
import { TeleprompterProps } from "./types";

import { createOptimizedLogger } from "../../../utils/optimizedLogger";
const logger = createOptimizedLogger("TeleprompterContainer");

export function TeleprompterContainer({
  script,
  settings,
  isRecording,
  isPaused,
  scrollSpeed = 16,
  backgroundOpacity = 80,
  backgroundColor = "#000000",
  hideResizeIndicators = false,
  isScreenFocused = true,
  onSettings,
  onEditText,
  disabled,
}: TeleprompterProps) {
  const { currentTheme } = useTheme();

  // Surveiller les changements de paramètres
  useEffect(() => {
    logger.debug("🔄 TeleprompterContainer - Paramètres mis à jour:", {
      isMirrored: settings?.isMirrored,
      textShadow: settings?.textShadow,
      fontSize: settings?.fontSize,
      textColor: settings?.textColor,
      textAlignment: settings?.textAlignment,
      horizontalMargin: settings?.horizontalMargin,
      timestamp: new Date().toLocaleTimeString(),
    });

    // Log spécifique pour les changements de couleur
    if (settings?.textColor) {
      logger.debug(
        "🎨 TeleprompterContainer - Couleur de texte reçue:",
        settings.textColor
      );
    }
  }, [
    settings?.isMirrored,
    settings?.textShadow,
    settings?.fontSize,
    settings?.textColor,
    settings?.textAlignment,
    settings?.horizontalMargin,
  ]);

  // Log du mode miroir pour diagnostic
  logger.debug("🪞 TeleprompterContainer - Mode miroir:", {
    isMirrored: settings?.isMirrored,
    transform: settings?.isMirrored ? "scaleX(-1)" : "scaleX(1)",
    allSettings: Object.keys(settings || {}),
    settingsType: typeof settings,
  });

  // État centralisé
  const {
    isUpdatingHeight,
    setIsUpdatingHeight,
    textHeight,
    setTextHeight,
    isTextMeasured,
    setIsTextMeasured,
    isTouchPaused,
    setIsTouchPaused,
    isResetting,
    setIsResetting,
    showResetIndicator,
    setShowResetIndicator,
    prevIsPausedRef,
    prevIsRecordingRef,
    doubleTapCountRef,
    currentScrollPositionRef,
  } = useTeleprompterState();

  // Handle container gestures
  const [
    containerState,
    panResponder,
    resizePanResponder,
    resetContainerPosition,
  ] = useContainerGestures(
    // onResize callback
    (newHeight) => {
      logger.debug(
        `🔄 Redimensionnement en cours - Nouvelle hauteur: ${newHeight}px`
      );
      setIsUpdatingHeight(true);
    },
    // onResizeEnd callback
    () => {
      logger.debug("✅ Redimensionnement terminé");
      setIsUpdatingHeight(false);
    }
  );

  useEffect(() => {
    resetContainerPosition();
  }, []);

  // Handle scroll animation
  const [scrollAnimation, scrollingState, scrollHandlers] = useScrollAnimation(
    isRecording,
    isPaused || isUpdatingHeight || isTouchPaused || isResetting,
    scrollSpeed,
    containerState.containerHeight,
    textHeight,
    isTextMeasured,
    isScreenFocused,
    {
      method: (settings as any)?.scrollCalculationMethod,
      wpm: (settings as any)?.scrollWPM,
      durationMinutes: (settings as any)?.scrollDurationMinutes,
      linesPerSecond: (settings as any)?.scrollLinesPerSecond,
      wordCount: script?.content
        ? Math.max(1, String(script.content).trim().split(/\s+/).length)
        : undefined,
      fontSize: settings?.fontSize,
      lineHeightMultiplier: (settings as any)?.lineHeightMultiplier,
    }
  );

  // Double tap handler
  const { handleDoubleTap } = useDoubleTapHandler({
    doubleTapCountRef,
    currentScrollPositionRef,
    setShowResetIndicator,
    setIsResetting,
    scrollHandlers,
    scrollAnimation,
    isRecording,
    isPaused,
  });

  // Touch handlers
  const { handleTogglePause, handlePauseScroll, handleResumeScroll } =
    useTouchHandlers({
      isRecording,
      isPaused,
      isTouchPaused,
      isResetting,
      setIsTouchPaused,
      scrollHandlers,
    });

  // Tous les effets
  useTeleprompterEffects({
    isRecording,
    isPaused,
    isScreenFocused,
    isTextMeasured,
    textHeight,
    isTouchPaused,
    isResetting,
    containerHeight: containerState.containerHeight,
    isResizing: containerState.isResizing,
    scriptId: script?.id,
    prevIsPausedRef,
    prevIsRecordingRef,
    currentScrollPositionRef,
    setIsTextMeasured,
    setIsTouchPaused,
    setIsResetting,
    scrollHandlers,
    scrollAnimation,
    scrollingState,
  });

  // Handle text measurement updates
  const handleTextHeightChange = useCallback(
    (height: number) => {
      logger.debug(`📏 Mise à jour de la hauteur du texte: ${height}px`);
      if (height > 0 && height !== textHeight) {
        setTextHeight(height);
      }
    },
    [textHeight, setTextHeight]
  );

  const handleTextMeasured = useCallback(
    (measured: boolean) => {
      logger.debug(`🔍 Changement d'état de mesure du texte: ${measured}`);
      setIsTextMeasured(measured);
    },
    [setIsTextMeasured]
  );

  // Fonction utilitaire pour convertir une couleur hex en rgba avec opacité
  const hexToRgba = (hex: string, opacity: number) => {
    const hexValue = hex.replace("#", "");
    const r = parseInt(hexValue.substring(0, 2), 16);
    const g = parseInt(hexValue.substring(2, 4), 16);
    const b = parseInt(hexValue.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
  };

  // Styles pour l'effet glassmorphism
  const glassStyles = StyleSheet.create({
    container: {
      borderRadius: 24, // Légèrement plus arrondi pour un effet moderne
      overflow: "hidden",
      shadowColor: currentTheme.name === "dark" ? "#000000" : "#1a1a1a",
      shadowOffset: {
        width: 0,
        height: 12,
      },
      shadowOpacity: currentTheme.name === "dark" ? 0.6 : 0.4,
      shadowRadius: 25,
      elevation: 15,
      // Ajout d'un backdrop-filter effect simulation
      backgroundColor: "transparent",
    },
    glassLayer: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: 24,
      borderWidth: 1.5,
      borderColor:
        currentTheme.name === "dark"
          ? "rgba(255, 255, 255, 0.15)"
          : "rgba(255, 255, 255, 0.25)",
    },
    innerGlow: {
      position: "absolute",
      top: 2,
      left: 2,
      right: 2,
      bottom: 2,
      borderRadius: 22,
      borderWidth: 1,
      borderColor:
        currentTheme.name === "dark"
          ? "rgba(255, 255, 255, 0.08)"
          : "rgba(255, 255, 255, 0.12)",
    },
    highlight: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: "35%",
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
    },
    frostOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: 24,
      backgroundColor:
        currentTheme.name === "dark"
          ? "rgba(255, 255, 255, 0.02)"
          : "rgba(255, 255, 255, 0.05)",
    },
  });

  // État pour gérer les erreurs BlurView
  const [blurViewError, setBlurViewError] = useState(false);
  const [isLowPerformanceDevice, setIsLowPerformanceDevice] = useState(false);

  // Détecter les appareils à faible performance
  useEffect(() => {
    const checkDevicePerformance = () => {
      try {
        const { width, height } = Dimensions.get("window");
        const screenArea = width * height;

        // Appareils avec écran < 2M pixels considérés comme faibles performance
        if (screenArea < 2000000) {
          logger.debug(
            "⚠️ Appareil à faible performance détecté, désactivation des effets avancés"
          );
          setIsLowPerformanceDevice(true);
        }
      } catch (error) {
        logger.error("❌ Erreur détection performance:", error);
        setIsLowPerformanceDevice(true); // Mode sécurisé par défaut
      }
    };

    checkDevicePerformance();
  }, []);

  // Gestionnaire d'erreur pour BlurView
  const handleBlurViewError = useCallback((error: any) => {
    logger.error("❌ Erreur BlurView:", error);
    setBlurViewError(true);
  }, []);

  // Décider si on utilise BlurView ou fallback
  const shouldUseBlurView =
    !blurViewError &&
    !isLowPerformanceDevice &&
    Platform.OS === "ios" &&
    Boolean(settings?.glassEnabled);

  if (disabled) {
    return null;
  }

  return (
    <Animated.View
      style={[
        tw`absolute left-0 right-0`,
        glassStyles.container,
        {
          top: containerState.containerY,
          height: containerState.containerHeight,
          zIndex: 100, // Au-dessus de la caméra mais sous les outils (9998)
          opacity:
            containerState.isDragging || containerState.isResizing ? 0.8 : 1,
        },
      ]}
    >
      {/* Effet glassmorphism avec BlurView */}
      {shouldUseBlurView ? (
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType={currentTheme.name === "dark" ? "dark" : "light"}
          blurAmount={Math.max(
            0,
            Math.min(50, settings?.glassBlurAmount ?? 25)
          )}
          reducedTransparencyFallbackColor={hexToRgba(
            backgroundColor,
            backgroundOpacity
          )}
        />
      ) : (
        <>
          {/* Fallback pour les appareils à faible performance */}
          {settings?.glassEnabled && (
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: hexToRgba(
                    backgroundColor,
                    backgroundOpacity * 0.8
                  ),
                  opacity: 0.9,
                },
              ]}
            />
          )}
        </>
      )}

      {/* Gradient de profondeur pour l'effet de verre */}
      <LinearGradient
        colors={
          currentTheme.name === "dark"
            ? [
                hexToRgba(backgroundColor, backgroundOpacity * 0.2),
                hexToRgba(backgroundColor, backgroundOpacity * 0.5),
                hexToRgba(backgroundColor, backgroundOpacity * 0.7),
              ]
            : [
                hexToRgba(backgroundColor, backgroundOpacity * 0.4),
                hexToRgba(backgroundColor, backgroundOpacity * 0.7),
                hexToRgba(backgroundColor, backgroundOpacity * 0.9),
              ]
        }
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Couche de frost pour l'effet givré */}
      <View style={glassStyles.frostOverlay} />

      {/* Bordure externe avec effet de verre */}
      <View style={glassStyles.glassLayer} />

      {/* Lueur interne subtile */}
      <View style={glassStyles.innerGlow} />

      {/* Highlight sur le haut pour l'effet de réflexion avec gradient */}
      <LinearGradient
        colors={
          currentTheme.name === "dark"
            ? [
                "rgba(255, 255, 255, 0.12)",
                "rgba(255, 255, 255, 0.04)",
                "transparent",
              ]
            : [
                "rgba(255, 255, 255, 0.25)",
                "rgba(255, 255, 255, 0.08)",
                "transparent",
              ]
        }
        locations={[0, 0.7, 1]}
        style={glassStyles.highlight}
      />

      {/* Effet de brillance subtil sur les bords */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: 24,
            borderWidth: 0.5,
            borderColor:
              currentTheme.name === "dark"
                ? "rgba(255, 255, 255, 0.2)"
                : "rgba(255, 255, 255, 0.4)",
          },
        ]}
      />

      {/* Bordure de déplacement/redimensionnement avec effet glassmorphism */}
      {(containerState.isDragging || containerState.isResizing) && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: 24,
              borderWidth: 2,
              borderColor: currentTheme.colors.accent,
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              shadowColor: currentTheme.colors.accent,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            },
          ]}
        />
      )}

      {/* Header with movement handlers */}
      {!hideResizeIndicators && !settings?.hideControls && (
        <TeleprompterHeader
          isDragging={containerState.isDragging}
          panHandlers={panResponder.panHandlers}
          currentTheme={currentTheme}
        />
      )}

      {/* Main content area */}
      <TeleprompterContent
        script={script}
        settings={settings}
        scrollAnimation={scrollAnimation}
        scrollingState={scrollingState}
        currentTheme={currentTheme}
        onDoubleTap={handleDoubleTap}
        onTextHeightChange={handleTextHeightChange}
        onTextMeasured={handleTextMeasured}
        onTogglePause={handleTogglePause}
        onPauseScroll={handlePauseScroll}
        onResumeScroll={handleResumeScroll}
      />

      {/* Speed indicator */}
      <TeleprompterSpeedIndicator
        isRecording={isRecording}
        scrollSpeed={scrollSpeed}
        currentTheme={currentTheme}
      />

      {/* Footer with resize handlers */}
      {!hideResizeIndicators && (
        <TeleprompterFooter
          isResizing={containerState.isResizing}
          resizeHandlers={resizePanResponder.panHandlers}
          currentTheme={currentTheme}
          onSettings={onSettings}
          onEditText={onEditText}
          settingsIconColor={settings?.settingsIconColor}
          editIconColor={settings?.editIconColor}
          hideControls={settings?.hideControls}
        />
      )}

      {/* Indicateur de réinitialisation */}
      <ResetIndicator showResetIndicator={showResetIndicator} />
    </Animated.View>
  );
}
