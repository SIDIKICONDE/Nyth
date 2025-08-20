import Ionicons from "react-native-vector-icons/Ionicons";
import React from "react";
import {
  ActivityIndicator,
  Animated,
  TouchableOpacity,
  View,
} from "react-native";
import { ContentText, UIText } from "../../../../../components/ui/Typography";
import { styles } from "../styles";
import { PresetCardProps } from "../types";

export const PresetCard: React.FC<PresetCardProps> = ({
  preset,
  onPress,
  themeColors,
  isSelected = false,
  isApplying = false,
}) => {
  const scaleAnimation = React.useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    // Animation de feedback tactile
    Animated.sequence([
      Animated.timing(scaleAnimation, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onPress(preset.id);
  };

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnimation }],
      }}
    >
      <TouchableOpacity
        style={[
          styles.presetCard,
          {
            backgroundColor: themeColors.surface,
            borderWidth: isSelected ? 2 : 1,
            borderColor: isSelected ? preset.color : themeColors.border,
          },
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.presetHeader}>
          <View
            style={[
              styles.presetIcon,
              {
                backgroundColor: isSelected
                  ? preset.color + "30"
                  : preset.color + "20",
              },
            ]}
          >
            <Ionicons
              name={preset.icon as any}
              size={20}
              color={preset.color}
            />
          </View>
          <View style={styles.presetInfo}>
            <UIText
              size={16}
              weight="600"
              style={[
                styles.presetName,
                {
                  color: isSelected ? preset.color : themeColors.text,
                },
              ]}
            >
              {preset.name}
              {isSelected && (
                <UIText size={14} style={{ color: preset.color }}>
                  {" "}
                  ✓
                </UIText>
              )}
            </UIText>
            <ContentText
              size={13}
              style={[
                styles.presetDescription,
                { color: themeColors.textSecondary },
              ]}
            >
              {preset.description}
            </ContentText>
          </View>
          {isApplying && (
            <ActivityIndicator size="small" color={preset.color} />
          )}
        </View>
        <ContentText
          size={12}
          style={[
            styles.presetValues,
            {
              fontStyle: "italic",
              color: isSelected ? preset.color : themeColors.textSecondary,
            },
          ]}
        >
          {preset.values}
        </ContentText>
      </TouchableOpacity>
    </Animated.View>
  );
};
