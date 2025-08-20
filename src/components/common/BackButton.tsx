import React from "react";
import { TouchableOpacity } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import tw from "twrnc";
import { useTheme } from "../../contexts/ThemeContext";

interface BackButtonProps {
  onPress?: () => void;
  style?: any;
  top?: number;
  left?: number;
  right?: number;
  size?: number;
  iconSize?: number;
  floating?: boolean; // Contrôle du positionnement flottant
  iconColor?: string; // Couleur personnalisée pour l'icône
}

export default function BackButton({
  onPress,
  style,
  top = 16,
  left = 4,
  right,
  size = 12,
  iconSize = 24,
  floating = true,
  iconColor,
}: BackButtonProps) {
  const navigation = useNavigation();
  const { currentTheme } = useTheme();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      // Vérifier si on peut aller en arrière, sinon aller à l'accueil
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate("Home" as never);
      }
    }
  };

  // Position style
  const positionStyle =
    right !== undefined
      ? { top: top * 4, right: right * 4 }
      : { top: top * 4, left: left * 4 };

  const baseStyles = [
    tw`w-${size} h-${size} rounded-full items-center justify-center`,
    {
      backgroundColor: currentTheme.colors.surface,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    },
    style,
  ];

  const floatingStyles = floating ? [tw`absolute z-10`, positionStyle] : [];

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[...baseStyles, ...floatingStyles]}
    >
      <Ionicons
        name="arrow-back"
        size={iconSize}
        color={iconColor || currentTheme.colors.text}
      />
    </TouchableOpacity>
  );
}
