import { useTheme } from "@/contexts/ThemeContext";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React from "react";
import { Animated, TouchableOpacity, View } from "react-native";
import { UIText } from "../../ui/Typography";
import tw from "twrnc";

interface ModernStepControlProps {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  onValueChange: (value: number) => void;
  presets?: readonly number[];
  icon: string;
}

export const ModernStepControl: React.FC<ModernStepControlProps> = ({
  label,
  value,
  unit,
  min,
  max,
  step,
  onValueChange,
  presets,
  icon,
}) => {
  const { currentTheme } = useTheme();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handleDecrease = () => {
    const newValue = Math.max(min, value - step);
    onValueChange(newValue);
    animatePress();
  };

  const handleIncrease = () => {
    const newValue = Math.min(max, value + step);
    onValueChange(newValue);
    animatePress();
  };

  const animatePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <Animated.View
      style={[
        tw`mb-6 p-4 rounded-2xl`,
        {
          backgroundColor: currentTheme.isDark
            ? "rgba(255, 255, 255, 0.03)"
            : "rgba(0, 0, 0, 0.02)",
          borderWidth: 1,
          borderColor: currentTheme.isDark
            ? "rgba(255, 255, 255, 0.05)"
            : "rgba(0, 0, 0, 0.05)",
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {/* En-tête avec icône */}
      <View style={tw`flex-row items-center justify-between mb-4`}>
        <View style={tw`flex-row items-center`}>
          <View
            style={[
              tw`w-8 h-8 rounded-lg items-center justify-center mr-3`,
              {
                backgroundColor: currentTheme.colors.primary + "15",
              },
            ]}
          >
            <MaterialCommunityIcons
              name={icon as any}
              size={18}
              color={currentTheme.colors.primary}
            />
          </View>
          <UIText
            size="sm"
            weight="semibold"
            style={[{ color: currentTheme.colors.text }]}
          >
            {label}
          </UIText>
        </View>
        <View
          style={[
            tw`px-3 py-1.5 rounded-full`,
            {
              backgroundColor: currentTheme.colors.primary + "15",
            },
          ]}
        >
          <UIText
            size="sm"
            weight="bold"
            style={[{ color: currentTheme.colors.primary }]}
          >
            {value}
            {unit}
          </UIText>
        </View>
      </View>

      {/* Barre de progression visuelle */}
      <View
        style={[
          tw`h-1 rounded-full mb-4`,
          {
            backgroundColor: currentTheme.isDark
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.1)",
          },
        ]}
      >
        <View
          style={[
            tw`h-full rounded-full`,
            {
              width: `${percentage}%`,
              backgroundColor: currentTheme.colors.primary,
            },
          ]}
        />
      </View>

      {/* Contrôles modernes */}
      <View style={tw`flex-row items-center justify-center`}>
        {/* Conteneur principal des contrôles */}
        <View style={tw`flex-row items-center justify-center flex-1`}>
          {/* Bouton moins */}
          <TouchableOpacity
            onPress={handleDecrease}
            disabled={value <= min}
            style={[
              tw`w-10 h-10 rounded-xl items-center justify-center mr-3`,
              {
                backgroundColor: currentTheme.isDark
                  ? "rgba(255, 255, 255, 0.05)"
                  : "rgba(0, 0, 0, 0.05)",
                opacity: value <= min ? 0.3 : 1,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="minus"
              size={20}
              color={
                value <= min
                  ? currentTheme.colors.textSecondary
                  : currentTheme.colors.text
              }
            />
          </TouchableOpacity>

          {/* Valeurs prédéfinies */}
          <View style={tw`flex-row items-center flex-1 justify-center`}>
            {presets &&
              presets.slice(0, 4).map((preset) => (
                <TouchableOpacity
                  key={preset}
                  onPress={() => onValueChange(preset)}
                  style={[
                    tw`px-2 py-1 rounded-lg mx-0.5`,
                    {
                      backgroundColor:
                        value === preset
                          ? currentTheme.colors.primary
                          : currentTheme.isDark
                          ? "rgba(255, 255, 255, 0.05)"
                          : "rgba(0, 0, 0, 0.05)",
                    },
                  ]}
                >
                  <UIText
                    size="xs"
                    weight="medium"
                    style={[
                      {
                        color:
                          value === preset
                            ? "#FFFFFF"
                            : currentTheme.colors.textSecondary,
                      },
                    ]}
                  >
                    {preset}
                  </UIText>
                </TouchableOpacity>
              ))}
          </View>

          {/* Bouton plus */}
          <TouchableOpacity
            onPress={handleIncrease}
            disabled={value >= max}
            style={[
              tw`w-10 h-10 rounded-xl items-center justify-center ml-3`,
              {
                backgroundColor: currentTheme.isDark
                  ? "rgba(255, 255, 255, 0.05)"
                  : "rgba(0, 0, 0, 0.05)",
                opacity: value >= max ? 0.3 : 1,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="plus"
              size={20}
              color={
                value >= max
                  ? currentTheme.colors.textSecondary
                  : currentTheme.colors.text
              }
            />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};
