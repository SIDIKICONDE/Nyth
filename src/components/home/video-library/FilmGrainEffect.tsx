import React, { useEffect, useRef } from "react";
import { Animated, Image } from "react-native";

export const FilmGrainEffect: React.FC = () => {
  const opacity = useRef(new Animated.Value(0.05)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.08,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.03,
          duration: 100,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity,
        pointerEvents: "none",
      }}
    >
      {/* Motif de bruit en base64 2x2 répété pour performance */}
      <Image
        source={{
          uri: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAB7GkOtAAAAEklEQVR42mNgYGD4z8DAwMAABEYBAMcHS58AAAAAElFTkSuQmCC",
        }}
        style={{ flex: 1, width: "100%", height: "100%" }}
        resizeMode="repeat"
      />
    </Animated.View>
  );
};
