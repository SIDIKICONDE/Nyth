import React, { useCallback, useRef, useState } from "react";
import {
  View,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Platform,
  StyleProp,
  ViewStyle,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import LinearGradient from "react-native-linear-gradient";
import { BlurView } from "@react-native-community/blur";
import { FABAction } from "../types";
import { useTheme } from "@/contexts/ThemeContext";
import { useContrastOptimization } from "@/hooks/useContrastOptimization";
import { UIText } from "@/components/ui/Typography";

interface HamburgerMenuProps {
  actions: FABAction[];
}

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ actions }) => {
  const { currentTheme } = useTheme();
  const { getOptimizedButtonColors } = useContrastOptimization();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Animations
  const menuAnimation = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const menuScale = useRef(new Animated.Value(0.8)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const buttonRotate = useRef(new Animated.Value(0)).current;

  // Animations des lignes hamburger
  const line1Rotate = useRef(new Animated.Value(0)).current;
  const line1TranslateY = useRef(new Animated.Value(0)).current;
  const line2Opacity = useRef(new Animated.Value(1)).current;
  const line3Rotate = useRef(new Animated.Value(0)).current;
  const line3TranslateY = useRef(new Animated.Value(0)).current;

  const toggleMenu = useCallback(() => {
    const toValue = isMenuOpen ? 0 : 1;

    // Animation de l'overlay
    Animated.timing(overlayOpacity, {
      toValue: toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Animation du menu
    Animated.parallel([
      Animated.spring(menuAnimation, {
        toValue,
        useNativeDriver: true,
        tension: 65,
        friction: 8,
      }),
      Animated.spring(menuScale, {
        toValue: toValue ? 1 : 0.8,
        useNativeDriver: true,
        tension: 65,
        friction: 8,
      }),
    ]).start();

    // Animation du bouton
    Animated.parallel([
      Animated.spring(buttonScale, {
        toValue: toValue ? 1.1 : 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.spring(buttonRotate, {
        toValue: toValue ? 1 : 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();

    // Animation des lignes hamburger
    Animated.parallel([
      // Ligne 1 (haut)
      Animated.parallel([
        Animated.timing(line1Rotate, {
          toValue: toValue ? 1 : 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(line1TranslateY, {
          toValue: toValue ? 1 : 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      // Ligne 2 (milieu)
      Animated.timing(line2Opacity, {
        toValue: toValue ? 0 : 1,
        duration: 200,
        useNativeDriver: true,
      }),
      // Ligne 3 (bas)
      Animated.parallel([
        Animated.timing(line3Rotate, {
          toValue: toValue ? 1 : 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(line3TranslateY, {
          toValue: toValue ? 1 : 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    setIsMenuOpen(!isMenuOpen);
  }, [
    isMenuOpen,
    menuAnimation,
    overlayOpacity,
    menuScale,
    buttonScale,
    buttonRotate,
    line1Rotate,
    line1TranslateY,
    line2Opacity,
    line3Rotate,
    line3TranslateY,
  ]);

  const menuItemStyle = (index: number): StyleProp<ViewStyle> => {
    const translateY = menuAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -65 * (actions.length - index - 1) - 18],
    });

    const scale = menuAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1],
    });

    const opacity = menuAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    const rotate = menuAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: ["180deg", "0deg"],
    });

    return {
      transform: [{ translateY }, { scale }, { rotate }],
      opacity,
    };
  };

  // Interpolations pour les lignes hamburger
  const line1RotateInterpolate = line1Rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "45deg"],
  });

  const line1TranslateYInterpolate = line1TranslateY.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 6],
  });

  const line3RotateInterpolate = line3Rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "-45deg"],
  });

  const line3TranslateYInterpolate = line3TranslateY.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6],
  });

  const buttonRotateInterpolate = buttonRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  return (
    <View
      style={[
        StyleSheet.absoluteFillObject,
        {
          zIndex: 1000,
          pointerEvents: isMenuOpen ? "auto" : "box-none",
        },
      ]}
    >
      {/* Overlay avec blur */}
      {isMenuOpen && (
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            {
              opacity: overlayOpacity,
              zIndex: 999,
            },
          ]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            onPress={toggleMenu}
            activeOpacity={1}
          >
            {Platform.OS === "ios" ? (
              <BlurView
                style={StyleSheet.absoluteFillObject}
                blurType={currentTheme.isDark ? "dark" : "light"}
                blurAmount={10}
              />
            ) : (
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  {
                    backgroundColor: currentTheme.isDark
                      ? "rgba(0, 0, 0, 0.6)"
                      : "rgba(0, 0, 0, 0.4)",
                  },
                ]}
              />
            )}
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Menu Items */}
      <View
        style={{
          position: "absolute",
          bottom: 95,
          left: 0,
          right: 0,
          alignItems: "center",
          zIndex: 1000,
          pointerEvents: isMenuOpen ? "auto" : "none",
        }}
      >
        {[...actions].reverse().map((action, index) => (
          <Animated.View
            key={action.id}
            style={[
              {
                position: "absolute",
                bottom: 0,
                alignItems: "center",
                width: 280,
              },
              menuItemStyle(index),
            ]}
          >
            <TouchableOpacity
              onPress={() => {
                toggleMenu();
                action.onPress();
              }}
              style={[
                styles.menuItem,
                {
                  backgroundColor: currentTheme.isDark
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(255, 255, 255, 0.9)",
                  borderColor: currentTheme.isDark
                    ? "rgba(255, 255, 255, 0.2)"
                    : "rgba(0, 0, 0, 0.1)",
                },
              ]}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  currentTheme.isDark
                    ? ["rgba(255, 255, 255, 0.1)", "rgba(255, 255, 255, 0.05)"]
                    : ["rgba(255, 255, 255, 0.8)", "rgba(255, 255, 255, 0.6)"]
                }
                style={styles.menuItemGradient}
              />

              <View style={styles.menuItemContent}>
                <View
                  style={[
                    styles.iconContainer,
                    {
                      backgroundColor: `${currentTheme.colors.primary}20`,
                    },
                  ]}
                >
                  {action.iconComponent || (
                    <MaterialCommunityIcons
                      name={action.icon as string}
                      size={24}
                      color={currentTheme.colors.text}
                    />
                  )}
                </View>

                <UIText
                  style={[
                    styles.menuItemText,
                    { color: currentTheme.colors.text },
                  ]}
                  weight="semibold"
                >
                  {action.label}
                </UIText>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      {/* Menu Button */}
      <View
        style={{
          position: "absolute",
          bottom: 20,
          left: 0,
          right: 0,
          alignItems: "center",
          zIndex: 1001,
          pointerEvents: "auto",
        }}
      >
        <Animated.View
          style={{
            transform: [
              { scale: buttonScale },
              { rotate: buttonRotateInterpolate },
            ],
          }}
        >
          <TouchableOpacity
            onPress={toggleMenu}
            style={[
              styles.menuButton,
              {
                backgroundColor: getOptimizedButtonColors().background,
                shadowColor: getOptimizedButtonColors().shadow,
              },
            ]}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[
                getOptimizedButtonColors().background,
                `${getOptimizedButtonColors().background}CC`,
              ]}
              style={styles.menuButtonGradient}
            />

            {/* Lignes hamburger animées */}
            <View style={styles.hamburgerContainer}>
              {/* Ligne 1 (haut) */}
              <Animated.View
                style={[
                  styles.hamburgerLine,
                  {
                    backgroundColor: getOptimizedButtonColors().text,
                    transform: [
                      { rotate: line1RotateInterpolate },
                      { translateY: line1TranslateYInterpolate },
                    ],
                  },
                ]}
              />

              {/* Ligne 2 (milieu) */}
              <Animated.View
                style={[
                  styles.hamburgerLine,
                  {
                    backgroundColor: getOptimizedButtonColors().text,
                    opacity: line2Opacity,
                  },
                ]}
              />

              {/* Ligne 3 (bas) */}
              <Animated.View
                style={[
                  styles.hamburgerLine,
                  {
                    backgroundColor: getOptimizedButtonColors().text,
                    transform: [
                      { rotate: line3RotateInterpolate },
                      { translateY: line3TranslateYInterpolate },
                    ],
                  },
                ]}
              />
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    minWidth: 200,
    borderWidth: 1,
    overflow: "hidden",
  },
  menuItemGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 14,
    flex: 1,
  },
  menuButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    overflow: "hidden",
  },
  menuButtonGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 28,
  },
  hamburgerContainer: {
    width: 20,
    height: 18,
    justifyContent: "space-between",
    alignItems: "center",
  },
  hamburgerLine: {
    width: 18,
    height: 2,
    borderRadius: 1,
  },
});
