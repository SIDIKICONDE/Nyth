import { useTheme } from "@/contexts/ThemeContext";
import { useCentralizedFont } from "@/hooks/useCentralizedFont";
import { useTranslation } from "@/hooks/useTranslation";
import React from "react";
import { Animated, Dimensions, StyleSheet, View } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { HeadingText, UIText } from "../../../../../components/ui/Typography";

const { width: screenWidth } = Dimensions.get("window");

export const EmptyState: React.FC = () => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { ui, heading } = useCentralizedFont();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;
  const rotateAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Animation de rotation continue pour l'icône
    Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View
      style={[
        styles.emptyState,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {/* Illustration avec gradient animé */}
      <View style={styles.illustrationContainer}>
        <View
          style={[
            styles.illustrationBackground,
            { backgroundColor: currentTheme.colors.primary + "20" },
          ]}
        >
          <Animated.View
            style={[
              styles.iconContainer,
              {
                backgroundColor: currentTheme.colors.primary + "15",
                transform: [{ rotate }],
              },
            ]}
          >
            <Ionicons
              name="analytics-outline"
              size={48}
              color={currentTheme.colors.primary}
            />
          </Animated.View>

          {/* Particules décoratives */}
          <View style={styles.particles}>
            {[0, 1, 2].map((index) => (
              <Animated.View
                key={index}
                style={[
                  styles.particle,
                  {
                    backgroundColor: currentTheme.colors.primary,
                    opacity: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 0.3 + index * 0.1],
                    }),
                    transform: [
                      {
                        translateY: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, -10 - index * 10],
                        }),
                      },
                      {
                        scale: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.5, 1 - index * 0.2],
                        }),
                      },
                    ],
                  },
                ]}
              />
            ))}
          </View>
        </View>
      </View>

      {/* Contenu textuel */}
      <View style={styles.textContent}>
        <HeadingText
          size="2xl"
          weight="bold"
          style={[
            heading,
            styles.emptyTitle,
            { color: currentTheme.colors.text },
          ]}
        >
          {t("ai.analytics.emptyState.title", "Commencez votre analyse")}
        </HeadingText>
        <UIText
          size="base"
          weight="medium"
          style={[
            ui,
            styles.emptySubtitle,
            { color: currentTheme.colors.textSecondary },
          ]}
        >
          {t(
            "ai.analytics.emptyState.subtitle",
            "Créez des événements et définissez des objectifs pour suivre vos performances et visualiser vos progrès"
          )}
        </UIText>
      </View>

      {/* Cartes de suggestions */}
      <View style={styles.actionsContainer}>
        <View style={styles.suggestionsGrid}>
          <Animated.View
            style={[
              styles.suggestionCard,
              {
                backgroundColor: currentTheme.colors.surface,
                borderColor: currentTheme.colors.border,
                opacity: fadeAnim,
                transform: [
                  {
                    translateX: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-50, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View
              style={[styles.suggestionIcon, { backgroundColor: "#3B82F615" }]}
            >
              <Ionicons name="calendar" size={20} color="#3B82F6" />
            </View>
            <HeadingText
              size="base"
              weight="bold"
              style={[
                heading,
                styles.suggestionTitle,
                { color: currentTheme.colors.text },
              ]}
            >
              {t("ai.analytics.emptyState.suggestions.plan.title", "Planifier")}
            </HeadingText>
            <UIText
              size="sm"
              weight="medium"
              style={[
                ui,
                styles.suggestionDescription,
                { color: currentTheme.colors.textSecondary },
              ]}
            >
              {t(
                "ai.analytics.emptyState.suggestions.plan.description",
                "Organisez vos événements"
              )}
            </UIText>
          </Animated.View>

          <Animated.View
            style={[
              styles.suggestionCard,
              {
                backgroundColor: currentTheme.colors.surface,
                borderColor: currentTheme.colors.border,
                opacity: fadeAnim,
                transform: [
                  {
                    translateX: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View
              style={[styles.suggestionIcon, { backgroundColor: "#F59E0B15" }]}
            >
              <Ionicons name="flag" size={20} color="#F59E0B" />
            </View>
            <HeadingText
              size="base"
              weight="bold"
              style={[
                heading,
                styles.suggestionTitle,
                { color: currentTheme.colors.text },
              ]}
            >
              {t(
                "ai.analytics.emptyState.suggestions.goals.title",
                "Objectifs"
              )}
            </HeadingText>
            <UIText
              size="sm"
              weight="medium"
              style={[
                ui,
                styles.suggestionDescription,
                { color: currentTheme.colors.textSecondary },
              ]}
            >
              {t(
                "ai.analytics.emptyState.suggestions.goals.description",
                "Définissez vos buts"
              )}
            </UIText>
          </Animated.View>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  illustrationContainer: {
    marginBottom: 32,
  },
  illustrationBackground: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  particles: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  particle: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  textContent: {
    alignItems: "center",
    marginBottom: 32,
    maxWidth: screenWidth * 0.85,
  },
  emptyTitle: {
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  emptySubtitle: {
    textAlign: "center",
    lineHeight: 24,
    opacity: 0.8,
  },
  actionsContainer: {
    width: "100%",
    alignItems: "center",
  },
  suggestionsGrid: {
    flexDirection: "row",
    gap: 16,
    width: "100%",
  },
  suggestionCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
  },
  suggestionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  suggestionTitle: {
    marginBottom: 4,
  },
  suggestionDescription: {
    textAlign: "center",
    opacity: 0.8,
  },
});
