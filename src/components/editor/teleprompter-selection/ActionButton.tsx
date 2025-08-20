import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React, { useRef } from "react";
import { Animated, TouchableOpacity, View } from "react-native";
import tw from "twrnc";
import { UIText } from "../../../components/ui/Typography";
import { useTheme } from "../../../contexts/ThemeContext";
import { ActionButtonProps } from "./types";

export const ActionButton: React.FC<ActionButtonProps> = ({
  onPress,
  backgroundColor,
  borderColor,
  iconBackgroundColor,
  iconName,
  iconLibrary,
  title,
  textColor,
}) => {
  const { currentTheme } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const IconComponent =
    iconLibrary === "Ionicons" ? Ionicons : MaterialCommunityIcons;

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={tw`m-2`}>
      <Animated.View
        style={[
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={[
            tw`rounded-2xl items-center justify-center overflow-hidden`,
            {
              backgroundColor,
              borderWidth: 1.5,
              borderColor,
              width: 72,
              height: 72,
              shadowColor: iconBackgroundColor,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.25,
              shadowRadius: 16,
              elevation: 8,
            },
          ]}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
        >
          {/* Effet de fond subtil */}
          <View
            style={[
              tw`absolute inset-0 opacity-5`,
              {
                backgroundColor: iconBackgroundColor,
              },
            ]}
          />

          {/* Conteneur de l'icône - repositionné et amélioré */}
          <View
            style={[
              tw`w-11 h-11 rounded-xl items-center justify-center mb-1`,
              {
                backgroundColor: iconBackgroundColor,
                shadowColor: iconBackgroundColor,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
                // Positionnement parfait au centre
                marginTop: 2,
              },
            ]}
          >
            <IconComponent
              name={iconName as any}
              size={24}
              color="#FFFFFF"
              style={{
                // Centrage parfait de l'icône
                textAlign: "center",
                textAlignVertical: "center",
                includeFontPadding: false,
                // Ombre subtile pour plus de profondeur
                textShadowColor: "rgba(0,0,0,0.3)",
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 2,
              }}
            />
          </View>

          {/* Titre avec style amélioré */}
          <UIText
            size="xs"
            weight="semibold"
            color={textColor}
            align="center"
            style={[
              tw`px-2`,
              {
                lineHeight: 11,
                letterSpacing: 0.2,
                opacity: 0.9,
                marginTop: -1,
              },
            ]}
            numberOfLines={2}
          >
            {title}
          </UIText>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};
