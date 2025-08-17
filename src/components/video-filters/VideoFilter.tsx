import React from "react";
import { View, StyleSheet } from "react-native";
import {
  Canvas,
  Fill,
  Group,
  Paint,
  ColorMatrix,
  ImageShader,
  useImage,
} from "@shopify/react-native-skia";

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
  const image = useImage(imageUri);

  const getColorMatrix = (type: string, intensity: number) => {
    switch (type) {
      case "sepia":
        return [
          0.393 + 0.607 * (1 - intensity),
          0.769 - 0.769 * (1 - intensity),
          0.189 - 0.189 * (1 - intensity),
          0,
          0,
          0.349 - 0.349 * (1 - intensity),
          0.686 + 0.314 * (1 - intensity),
          0.168 - 0.168 * (1 - intensity),
          0,
          0,
          0.272 - 0.272 * (1 - intensity),
          0.534 - 0.534 * (1 - intensity),
          0.131 + 0.869 * (1 - intensity),
          0,
          0,
          0,
          0,
          0,
          1,
          0,
        ];

      case "vintage":
        return [
          1.2, 0, 0, 0, 0.1, 0, 1.1, 0, 0, 0.05, 0, 0, 0.9, 0, 0.1, 0, 0, 0, 1,
          0,
        ];

      case "cool":
        return [
          1.1, 0, 0, 0, 0, 0, 0.9, 0, 0, 0.1, 0, 0, 1.2, 0, 0.1, 0, 0, 0, 1, 0,
        ];

      case "warm":
        return [
          1.2, 0, 0, 0, 0.1, 0, 1.1, 0, 0, 0.05, 0, 0, 0.9, 0, 0, 0, 0, 0, 1, 0,
        ];

      case "dramatic":
        return [
          1.3, 0, 0, 0, -0.1, 0, 1.1, 0, 0, -0.05, 0, 0, 0.8, 0, -0.1, 0, 0, 0,
          1, 0,
        ];

      case "blackAndWhite":
        return [
          0.299, 0.587, 0.114, 0, 0, 0.299, 0.587, 0.114, 0, 0, 0.299, 0.587,
          0.114, 0, 0, 0, 0, 0, 1, 0,
        ];

      case "vivid":
        return [
          1.4, 0, 0, 0, 0.1, 0, 1.3, 0, 0, 0.05, 0, 0, 1.2, 0, 0.1, 0, 0, 0, 1,
          0,
        ];

      default:
        return [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0];
    }
  };

  const colorMatrix = getColorMatrix(filterType, intensity);

  return (
    <View style={[styles.container, { width, height }]}>
      <Canvas style={styles.canvas}>
        <Fill color="#000000" />

        {image && (
          <Group>
            <Paint>
              <ColorMatrix matrix={colorMatrix} />
            </Paint>
            <Fill>
              <ImageShader image={image} fit="cover" />
            </Fill>
          </Group>
        )}
      </Canvas>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    borderRadius: 8,
  },
  canvas: {
    flex: 1,
  },
});
