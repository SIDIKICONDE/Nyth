import React from "react";
import { View, StyleSheet, Image, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from "react-native-reanimated";

export interface VideoFilterProps {
  width: number;
  height: number;
  filterType:
    | "none"
    | "sepia"
    | "vintage"
    | "cool"
    | "warm"
    | "dramatic"
    | "blackAndWhite"
    | "vivid";
  intensity?: number; // 0.0 à 1.0
  imageUri?: string;
}

export const VideoFilter: React.FC<VideoFilterProps> = ({
  width,
  height,
  filterType,
  intensity = 1.0,
  imageUri,
}) => {
  const getFilterStyle = (type: string, intensity: number) => {
    const baseStyle: any = {
      width,
      height,
      borderRadius: 8,
      overflow: "hidden",
    };

    switch (type) {
      case "sepia":
        return {
          ...baseStyle,
          tintColor: `rgba(112, 66, 20, ${intensity * 0.7})`,
        };

      case "vintage":
        return {
          ...baseStyle,
          tintColor: `rgba(255, 248, 220, ${intensity * 0.3})`,
        };

      case "cool":
        return {
          ...baseStyle,
          tintColor: `rgba(173, 216, 230, ${intensity * 0.4})`,
        };

      case "warm":
        return {
          ...baseStyle,
          tintColor: `rgba(255, 218, 185, ${intensity * 0.4})`,
        };

      case "dramatic":
        return {
          ...baseStyle,
          tintColor: `rgba(139, 69, 19, ${intensity * 0.6})`,
        };

      case "blackAndWhite":
        return {
          ...baseStyle,
          tintColor: `rgba(128, 128, 128, ${intensity})`,
        };

      case "vivid":
        return {
          ...baseStyle,
          tintColor: `rgba(255, 215, 0, ${intensity * 0.3})`,
        };

      default:
        return baseStyle;
    }
  };

  const filterStyle = getFilterStyle(filterType, intensity);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(intensity, { duration: 300 }),
    };
  });

  if (!imageUri) {
    return (
      <View style={[styles.container, { width, height }]}>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Aucune image</Text>
        </View>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Image
        source={{ uri: imageUri }}
        style={filterStyle}
        resizeMode="cover"
      />
      {filterType !== "none" && (
        <View style={[styles.overlay, { opacity: intensity * 0.3 }]} />
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    borderRadius: 8,
  },
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  placeholderText: {
    fontSize: 14,
    color: "#666",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
});
