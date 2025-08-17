import Ionicons from "react-native-vector-icons/Ionicons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../../../../../contexts/ThemeContext";
import { styles } from "../styles";
import { FeatureTogglesProps } from "../types";

export const FeatureToggles: React.FC<FeatureTogglesProps> = ({
  features,
  onToggle,
}) => {
  const { currentTheme } = useTheme();

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
        ⚙️ Fonctionnalités
      </Text>

      {features.map((feature) => (
        <TouchableOpacity
          key={feature.key}
          style={[
            styles.featureOption,
            { backgroundColor: currentTheme.colors.surface },
          ]}
          onPress={() => onToggle(feature.key, !feature.enabled)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={feature.icon as any}
            size={20}
            color={currentTheme.colors.primary}
          />
          <View style={styles.featureInfo}>
            <Text
              style={[styles.featureLabel, { color: currentTheme.colors.text }]}
            >
              {feature.label}
            </Text>
            <Text
              style={[
                styles.featureDescription,
                { color: currentTheme.colors.textSecondary },
              ]}
            >
              {feature.description}
            </Text>
          </View>
          <View
            style={[
              styles.toggle,
              {
                backgroundColor: feature.enabled
                  ? currentTheme.colors.primary
                  : currentTheme.colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.toggleIndicator,
                {
                  backgroundColor: "white",
                  transform: [{ translateX: feature.enabled ? 16 : 2 }],
                },
              ]}
            />
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};
