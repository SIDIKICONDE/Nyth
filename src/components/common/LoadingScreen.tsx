import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

const { width, height } = Dimensions.get("window");

interface LoadingScreenProps {
  onLoadingComplete?: () => void;
  duration?: number;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  onLoadingComplete,
  duration = 3000,
}) => {
  // Récupérer le thème de l'application
  const { currentTheme } = useTheme();

  // Animations React Native
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animation d'entrée
    const fadeIn = Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    });

    const scaleUp = Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    });

    // Animation de rotation continue
    const rotationLoop = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    );

    // Animation de pulse continue
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    // Démarrer toutes les animations
    Animated.parallel([fadeIn, scaleUp]).start();
    rotationLoop.start();
    pulseLoop.start();

    // Timer pour terminer le chargement
    const timer = setTimeout(() => {
      if (onLoadingComplete) {
        onLoadingComplete();
      }
    }, duration);

    return () => {
      clearTimeout(timer);
      rotationLoop.stop();
      pulseLoop.stop();
    };
  }, [fadeAnim, scaleAnim, rotateAnim, pulseAnim, onLoadingComplete, duration]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: currentTheme.colors.background },
      ]}
    >
      <StatusBar
        barStyle={currentTheme.isDark ? "light-content" : "dark-content"}
        backgroundColor={currentTheme.colors.background}
      />

      {/* Background gradient simulé */}
      <View
        style={[
          styles.gradient,
          { backgroundColor: currentTheme.colors.background },
        ]}
      />

      {/* Éléments décoratifs */}
      <Animated.View
        style={[
          styles.decorativeCircle,
          {
            opacity: fadeAnim,
            backgroundColor: currentTheme.colors.primary + "20", // 20 = 12% opacity
          },
        ]}
      />
      <Animated.View
        style={[
          styles.decorativeCircle2,
          {
            opacity: fadeAnim,
            backgroundColor: currentTheme.colors.primary + "10", // 10 = 6% opacity
          },
        ]}
      />

      {/* Contenu principal animé */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }, { scale: pulseAnim }],
          },
        ]}
      >
        {/* Titre principal */}
        <Text
          style={[
            styles.title,
            {
              color: currentTheme.colors.text,
              textShadowColor: currentTheme.colors.primary + "B3", // B3 = 70% opacity
            },
          ]}
        >
          Visions
        </Text>

        {/* Sous-titre */}
        <Text
          style={[
            styles.subtitle,
            { color: currentTheme.colors.textSecondary },
          ]}
        >
          Vision Intelligence Platform
        </Text>

        {/* Indicateur de chargement rotatif */}
        <Animated.View
          style={[
            styles.loadingContainer,
            {
              transform: [{ rotate: spin }],
            },
          ]}
        >
          <View
            style={[
              styles.loadingRing,
              {
                borderTopColor: currentTheme.colors.primary,
                borderRightColor: currentTheme.colors.primary,
              },
            ]}
          />
          <View
            style={[
              styles.loadingRing,
              styles.loadingRingInner,
              {
                borderTopColor: currentTheme.colors.primary + "80", // 80 = 50% opacity
                borderRightColor: currentTheme.colors.primary + "80",
              },
            ]}
          />
        </Animated.View>

        {/* Texte de chargement */}
        <Text
          style={[styles.loadingText, { color: currentTheme.colors.textMuted }]}
        >
          Chargement...
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  gradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#141418",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 48,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 60,
    fontWeight: "300",
    letterSpacing: 1,
  },
  loadingContainer: {
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  loadingRing: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: "transparent",
    borderTopColor: "#4c4cff",
    borderRightColor: "#4c4cff",
  },
  loadingRingInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderTopColor: "rgba(76, 76, 255, 0.5)",
    borderRightColor: "rgba(76, 76, 255, 0.5)",
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "300",
    letterSpacing: 1,
  },
  decorativeCircle: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -50,
    right: -50,
  },
  decorativeCircle2: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    bottom: -30,
    left: -30,
  },
});

export default LoadingScreen;
