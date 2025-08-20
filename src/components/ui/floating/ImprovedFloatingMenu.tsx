import { BlurView } from "@react-native-community/blur";
import React from "react";
import {
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

interface ImprovedFloatingMenuProps {
  visible: boolean;
  onClose: () => void;
  position?: "bottom-left" | "bottom-right" | "center";
  children: React.ReactNode;
  animationValue?: Animated.Value;
  backdropBlur?: boolean;
  glassEffect?: boolean;
}

export const ImprovedFloatingMenu: React.FC<ImprovedFloatingMenuProps> = ({
  visible,
  onClose,
  position = "bottom-left",
  children,
  animationValue,
  backdropBlur = true,
  glassEffect = true,
}) => {
  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

  if (!visible) return null;

  const getPositionStyles = () => {
    switch (position) {
      case "bottom-right":
        return {
          bottom: 100,
          right: 16,
          alignSelf: undefined,
        };
      case "center":
        return {
          top: screenHeight / 2 - 150,
          alignSelf: "center" as const,
          left: (screenWidth - 280) / 2,
        };
      case "bottom-left":
      default:
        return {
          bottom: 100,
          left: 16,
          alignSelf: undefined,
        };
    }
  };

  const renderBackdrop = () => (
    <TouchableOpacity
      style={StyleSheet.absoluteFillObject}
      onPress={onClose}
      activeOpacity={1}
    >
      {Platform.OS === "ios" && backdropBlur ? (
        <BlurView
          blurAmount={15}
          blurType="dark"
          style={StyleSheet.absoluteFillObject}
        />
      ) : (
        <View style={[StyleSheet.absoluteFillObject, styles.androidBackdrop]} />
      )}
    </TouchableOpacity>
  );

  const renderMenuContainer = () => {
    const containerStyle = [
      styles.menuContainer,
      getPositionStyles(),
      glassEffect && Platform.OS === "ios" && styles.iosGlassContainer,
      glassEffect && Platform.OS === "android" && styles.androidGlassContainer,
    ];

    return (
      <View style={containerStyle}>
        {/* Effet de verre pour iOS */}
        {Platform.OS === "ios" && glassEffect && (
          <BlurView
            blurAmount={100}
            blurType="xlight"
            style={StyleSheet.absoluteFillObject}
          />
        )}

        {/* Contenu du menu */}
        <View style={styles.menuContent}>{children}</View>

        {/* Petite flèche indicatrice */}
        {position.includes("bottom") && (
          <View
            style={[
              styles.arrow,
              position === "bottom-right" && styles.arrowRight,
            ]}
          />
        )}
      </View>
    );
  };

  const content = (
    <>
      <View style={styles.backdrop}>{renderBackdrop()}</View>
      {renderMenuContainer()}
    </>
  );

  if (animationValue) {
    return (
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            opacity: animationValue,
            transform: [
              {
                scale: animationValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              },
            ],
          },
        ]}
      >
        {content}
      </Animated.View>
    );
  }

  return <View style={StyleSheet.absoluteFillObject}>{content}</View>;
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9998,
  },
  androidBackdrop: {
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  menuContainer: {
    position: "absolute",
    width: 280,
    maxWidth: "90%",
    borderRadius: 20,
    overflow: "hidden",
    zIndex: 10000,
    // Ombrage amélioré
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  iosGlassContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  androidGlassContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  menuContent: {
    padding: 16,
    backgroundColor: Platform.OS === "ios" ? "transparent" : undefined,
  },
  arrow: {
    position: "absolute",
    bottom: -8,
    left: 24,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor:
      Platform.OS === "ios"
        ? "rgba(255, 255, 255, 0.9)"
        : "rgba(255, 255, 255, 0.95)",
  },
  arrowRight: {
    left: undefined,
    right: 24,
  },
});

export default ImprovedFloatingMenu;
