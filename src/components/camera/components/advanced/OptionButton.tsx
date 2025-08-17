import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useTheme } from "../../../../contexts/ThemeContext";

interface OptionButtonProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
}

export const OptionButton: React.FC<OptionButtonProps> = ({
  label,
  isActive,
  onPress,
}) => {
  const { currentTheme } = useTheme();
  return (
    <TouchableOpacity
      style={[
        styles.optionButton,
        isActive && styles.optionButtonActive,
        { borderColor: currentTheme.colors.border },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {isActive && (
        <View
          style={[
            styles.optionButtonGlow,
            { backgroundColor: currentTheme.colors.accent },
          ]}
        />
      )}
      <View style={styles.optionButtonContent}>
        {isActive && (
          <MaterialCommunityIcons
            name="check-circle"
            size={14}
            color={currentTheme.colors.accent}
            style={styles.optionCheckIcon}
          />
        )}
        <Text
          style={[
            styles.optionText,
            { color: currentTheme.colors.textSecondary },
            isActive && [
              styles.optionTextActive,
              { color: currentTheme.colors.text },
            ],
          ]}
        >
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  optionButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "transparent",
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "transparent",
    position: "relative",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  optionButtonActive: {
    backgroundColor: "transparent",
    transform: [{ scale: 1.05 }],
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  optionButtonGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 25,
  },
  optionButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  optionCheckIcon: {
    marginRight: 6,
  },
  optionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  optionTextActive: {
    fontWeight: "700",
  },
});
