import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  TouchableOpacity,
  View,
  StyleSheet,
  Platform,
  Dimensions,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import LinearGradient from "react-native-linear-gradient";
import { BlurView } from "@react-native-community/blur";
import { useTheme } from "../../contexts/ThemeContext";
import { useCentralizedFont } from "../../hooks/useCentralizedFont";
import { UIText } from "./Typography";

interface NavigationOption {
  id: string;
  label: string;
  icon?: string;
  onPress: () => void;
}

interface ModernHamburgerMenuProps {
  options: NavigationOption[];
  style?: any;
  isHidden?: boolean;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

export default function ModernHamburgerMenu({
  options,
  style,
  isHidden = false,
  position = "top-left",
}: ModernHamburgerMenuProps) {
  const { currentTheme } = useTheme();
  const { ui } = useCentralizedFont();
  const [isExpanded, setIsExpanded] = useState(false);

  // Animations
  const menuAnimation = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const menuScale = useRef(new Animated.Value(0.8)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const buttonRotate = useRef(new Animated.Value(0)).current;
  const opacityAnimation = useRef(new Animated.Value(1)).current;

  // Animations des lignes hamburger
  const line1Rotate = useRef(new Animated.Value(0)).current;
  const line1TranslateY = useRef(new Animated.Value(0)).current;
  const line2Opacity = useRef(new Animated.Value(1)).current;
  const line3Rotate = useRef(new Animated.Value(0)).current;
  const line3TranslateY = useRef(new Animated.Value(0)).current;

  const screenHeight = Dimensions.get("window").height;
  const screenWidth = Dimensions.get("window").width;

  // Animation pour masquer/afficher le menu
  useEffect(() => {
    const animation = Animated.timing(opacityAnimation, {
      toValue: isHidden ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    });
    animation.start();

    // Si le menu est masqué, le fermer aussi
    if (isHidden && isExpanded) {
      toggleMenu();
    }
  }, [isHidden, isExpanded]);

  const toggleMenu = () => {
    // Ne pas permettre d'ouvrir le menu s'il est masqué
    if (isHidden) return;

    const toValue = isExpanded ? 0 : 1;

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

    setIsExpanded(!isExpanded);
  };

  const menuItemStyle = (index: number) => {
    const translateY = menuAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 55 * (index + 1)],
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
      outputRange: [-180, 0],
    });

    return {
      transform: [{ translateY }, { scale }, { rotate: `${rotate}deg` }],
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

  // Position du menu selon la prop position
  const getMenuPosition = () => {
    switch (position) {
      case "top-right":
        return { top: 60, right: 20 };
      case "bottom-left":
        return { bottom: 20, left: 20 };
      case "bottom-right":
        return { bottom: 20, right: 20 };
      default: // top-left
        return { top: 60, left: 20 };
    }
  };

  const getMenuItemsPosition = () => {
    switch (position) {
      case "top-right":
        return { top: 115, right: 20, alignItems: "flex-end" };
      case "bottom-left":
        return { bottom: 95, left: 20, alignItems: "flex-start" };
      case "bottom-right":
        return { bottom: 95, right: 20, alignItems: "flex-end" };
      default: // top-left
        return { top: 115, left: 20, alignItems: "flex-start" };
    }
  };

  return (
    <>
      {/* Overlay avec blur */}
      {isExpanded && (
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
                      : "rgba(255, 255, 255, 0.8)",
                  },
                ]}
              />
            )}
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Menu Items */}
      <Animated.View
        style={[
          {
            position: "absolute",
            zIndex: 1000,
            opacity: opacityAnimation,
          },
          getMenuItemsPosition(),
          style,
        ]}
      >
        {options.map((option, index) => (
          <Animated.View
            key={option.id}
            style={[
              {
                position: "absolute",
                width: 260,
              },
              menuItemStyle(index),
            ]}
          >
            <TouchableOpacity
              onPress={() => {
                toggleMenu();
                option.onPress();
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
                {option.icon && (
                  <View
                    style={[
                      styles.iconContainer,
                      {
                        backgroundColor: `${currentTheme.colors.primary}20`,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={option.icon as any}
                      size={16}
                      color={currentTheme.colors.primary}
                    />
                  </View>
                )}

                <UIText
                  style={[
                    styles.menuItemText,
                    { color: currentTheme.colors.text },
                  ]}
                  weight="semibold"
                >
                  {option.label}
                </UIText>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </Animated.View>

      {/* Menu Button */}
      <Animated.View
        style={[
          {
            position: "absolute",
            zIndex: 1001,
            opacity: opacityAnimation,
          },
          getMenuPosition(),
        ]}
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
                backgroundColor: currentTheme.colors.primary,
                shadowColor: currentTheme.colors.primary,
              },
            ]}
            activeOpacity={0.9}
            disabled={isHidden}
          >
            <LinearGradient
              colors={[
                currentTheme.colors.primary,
                `${currentTheme.colors.primary}CC`,
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
                    backgroundColor: currentTheme.colors.text,
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
                    backgroundColor: currentTheme.colors.text,
                    opacity: line2Opacity,
                  },
                ]}
              />

              {/* Ligne 3 (bas) */}
              <Animated.View
                style={[
                  styles.hamburgerLine,
                  {
                    backgroundColor: "#FFF",
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
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 14,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    minWidth: 126,
    borderWidth: 1,
    overflow: "hidden",
  },
  menuItemGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 14,
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  menuItemText: {
    fontSize: 13,
    flex: 1,
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    overflow: "hidden",
  },
  menuButtonGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 18,
  },
  hamburgerContainer: {
    width: 14,
    height: 12,
    justifyContent: "space-between",
    alignItems: "center",
  },
  hamburgerLine: {
    width: 12,
    height: 1.5,
    borderRadius: 1,
  },
});
