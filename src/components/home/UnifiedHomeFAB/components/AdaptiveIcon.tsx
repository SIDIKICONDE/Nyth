import React from "react";
import { View } from "react-native";

interface AdaptiveIconProps {
  children: React.ReactElement<{ size?: number }>;
  containerSize?: number;
  iconSizeRatio?: number; // Ratio de la taille de l'icône par rapport au conteneur (0.8 = 80%)
}

export const AdaptiveIcon: React.FC<AdaptiveIconProps> = ({
  children,
  containerSize = 48, // Taille par défaut du bouton orbital
  iconSizeRatio = 0.8,
}) => {
  const iconSize = Math.round(containerSize * iconSizeRatio);

  // Clone l'élément enfant en passant la nouvelle taille
  const adaptedChild = React.cloneElement(children, {
    size: iconSize,
  });

  return (
    <View
      style={{
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {adaptedChild}
    </View>
  );
};
