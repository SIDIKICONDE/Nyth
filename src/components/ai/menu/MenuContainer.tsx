import * as React from "react";
import { useEffect, useState } from "react";
import {
  Animated,
  Dimensions,
  Keyboard,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../../contexts/ThemeContext";

interface MenuContainerProps {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const MenuContainer: React.FC<MenuContainerProps> = ({
  isVisible,
  onClose,
  children,
}) => {
  const { currentTheme } = useTheme();
  const menuWidth = Dimensions.get("window").width * 0.85;
  const [slideAnim] = useState(new Animated.Value(-menuWidth));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.95));

  // Animations améliorées style Apple
  useEffect(() => {
    // Fermer le clavier à l'ouverture du menu
    if (isVisible) {
      Keyboard.dismiss();
    }

    if (isVisible) {
      // Animation d'entrée
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 20,
          stiffness: 90,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          damping: 15,
          stiffness: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animation de sortie
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -menuWidth,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible, slideAnim, fadeAnim, scaleAnim, menuWidth]);

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay avec animation de fade */}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundColor: currentTheme.isDark
                ? "rgba(0, 0, 0, 0.5)"
                : "rgba(0, 0, 0, 0.3)",
            },
          ]}
        />
      </Animated.View>

      {/* Menu principal */}
      <Animated.View
        style={[
          styles.menuContainer,
          {
            width: menuWidth,
            left: 0,
            transform: [{ translateX: slideAnim }, { scale: scaleAnim }],
            opacity: fadeAnim,
          },
        ]}
      >
        {/* Effet de flou simulé avec plusieurs couches */}
        <View
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundColor: currentTheme.isDark
                ? "rgba(20, 20, 20, 0.85)"
                : "rgba(248, 248, 248, 0.85)",
              borderTopRightRadius: 24,
              borderBottomRightRadius: 24,
            },
          ]}
        />

        {/* Couche de glassmorphism */}
        <View
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundColor: currentTheme.isDark
                ? "rgba(255, 255, 255, 0.05)"
                : "rgba(255, 255, 255, 0.7)",
              borderTopRightRadius: 24,
              borderBottomRightRadius: 24,
            },
          ]}
        />

        {/* Barre indicatrice style Apple */}
        <View
          style={[
            styles.indicator,
            {
              backgroundColor: currentTheme.isDark
                ? "rgba(255, 255, 255, 0.2)"
                : "rgba(0, 0, 0, 0.15)",
              right: 16,
            },
          ]}
        />

        {/* Contenu principal */}
        <View style={styles.content}>{children}</View>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  menuContainer: {
    backgroundColor: "#FFFFFF",    position: "absolute",
    top: 0,
    bottom: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 24,
  },
  indicator: {
    position: "absolute",
    top: 24,
    width: 4,
    height: 36,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
  },
});

export default MenuContainer;
