import { useTheme } from "@/contexts/ThemeContext";
import { useCentralizedFont } from "@/hooks/useCentralizedFont";
import { useTranslation } from "@/hooks/useTranslation";
import React from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  StyleSheet,
  View,
} from "react-native";
import { HeadingText, UIText } from "../../../../../components/ui/Typography";

interface LoadingStateProps {
  isLoading: boolean;
  isCalculating: boolean;
}

const { width: screenWidth } = Dimensions.get("window");

export const LoadingState: React.FC<LoadingStateProps> = ({
  isLoading,
  isCalculating,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { ui, heading } = useCentralizedFont();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const dotsAnim = React.useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  React.useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Dots animation
    dotsAnim.forEach((anim, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 200),
          Animated.timing(anim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, []);

  const loadingText = isLoading
    ? t("planning.analytics.loading.dataLoading", "Loading data...")
    : t("planning.analytics.loading.calculating", "Calculating analytics...");

  const subtitle = isLoading
    ? t(
        "planning.analytics.loading.dataSubtitle",
        "Retrieving your events and goals"
      )
    : t(
        "planning.analytics.loading.calculatingSubtitle",
        "Analyzing your performance"
      );

  return (
    <Animated.View
      style={[
        styles.loadingContainer,
        {
          opacity: fadeAnim,
        },
      ]}
    >
      {/* Fond avec couleur */}
      <View
        style={[
          styles.gradientBackground,
          { backgroundColor: currentTheme.colors.primary + "08" },
        ]}
      >
        {/* Conteneur principal */}
        <View style={styles.contentContainer}>
          {/* Indicateur de chargement personnalisé */}
          <View style={styles.loaderContainer}>
            <Animated.View
              style={[
                styles.loaderBackground,
                {
                  backgroundColor: currentTheme.colors.primary + "15",
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <View style={styles.innerLoader}>
                <ActivityIndicator
                  size="large"
                  color={currentTheme.colors.primary}
                  style={styles.spinner}
                />
              </View>
            </Animated.View>

            {/* Cercles décoratifs */}
            <View style={styles.decorativeCircles}>
              {[0, 1, 2].map((index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.decorativeCircle,
                    {
                      backgroundColor: currentTheme.colors.primary,
                      opacity: pulseAnim.interpolate({
                        inputRange: [1, 1.2],
                        outputRange: [0.1, 0],
                      }),
                      transform: [
                        {
                          scale: pulseAnim.interpolate({
                            inputRange: [1, 1.2],
                            outputRange: [1, 1.5 + index * 0.2],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Texte de chargement */}
          <View style={styles.textContainer}>
            <HeadingText
              size="xl"
              weight="bold"
              style={[
                heading,
                styles.loadingTitle,
                { color: currentTheme.colors.text },
              ]}
            >
              {loadingText}
            </HeadingText>
            <UIText
              size="base"
              weight="medium"
              style={[
                ui,
                styles.loadingSubtitle,
                { color: currentTheme.colors.textSecondary },
              ]}
            >
              {subtitle}
            </UIText>
          </View>

          {/* Indicateurs de progression animés */}
          <View style={styles.progressIndicators}>
            <View style={styles.progressDots}>
              {dotsAnim.map((anim, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.progressDot,
                    {
                      backgroundColor: currentTheme.colors.primary,
                      opacity: anim,
                      transform: [
                        {
                          scale: anim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.8, 1.2],
                          }),
                        },
                        {
                          translateY: anim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, -5],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              ))}
            </View>

            {/* Barre de progression */}
            <View
              style={[
                styles.progressBar,
                { backgroundColor: currentTheme.colors.surface },
              ]}
            >
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: currentTheme.colors.primary,
                    transform: [
                      {
                        scaleX: pulseAnim.interpolate({
                          inputRange: [1, 1.2],
                          outputRange: [0.3, 0.7],
                        }),
                      },
                    ],
                  },
                ]}
              />
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  gradientBackground: {
    width: screenWidth - 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    paddingVertical: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  contentContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  loaderContainer: {
    marginBottom: 32,
    position: "relative",
  },
  loaderBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  innerLoader: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  spinner: {
    transform: [{ scale: 1.2 }],
  },
  decorativeCircles: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  decorativeCircle: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  textContainer: {
    alignItems: "center",
    marginBottom: 32,
    maxWidth: screenWidth * 0.8,
  },
  loadingTitle: {
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: -0.3,
    // fontSize et fontWeight supprimés - gérés par HeadingText
  },
  loadingSubtitle: {
    textAlign: "center",
    opacity: 0.8,
    lineHeight: 22,
    // fontSize et fontWeight supprimés - gérés par UIText
  },
  progressIndicators: {
    alignItems: "center",
    width: "100%",
  },
  progressDots: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  progressBar: {
    width: screenWidth * 0.6,
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    width: "100%",
    borderRadius: 2,
    transformOrigin: "left",
  },
});
