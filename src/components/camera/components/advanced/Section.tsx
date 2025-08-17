import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useTheme } from "../../../../contexts/ThemeContext";

interface SectionProps {
  title: string;
  icon: string;
  isActive: boolean;
  onToggle: () => void;
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
  children: React.ReactNode;
}

export const Section: React.FC<SectionProps> = ({
  title,
  icon,
  isActive,
  onToggle,
  fadeAnim,
  slideAnim,
  children,
}) => {
  const { currentTheme } = useTheme();
  return (
    <Animated.View
      style={[
        styles.section,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.sectionHeader,
          isActive && styles.sectionHeaderActive,
          { borderColor: currentTheme.colors.border, borderWidth: 1 },
        ]}
        onPress={onToggle}
        activeOpacity={0.8}
      >
        <View
          style={[
            styles.sectionHeaderGradient,
            { backgroundColor: currentTheme.colors.card },
          ]}
        >
          <View style={styles.sectionHeaderLeft}>
            <View
              style={[
                styles.iconContainer,
                isActive && styles.iconContainerActive,
                {
                  backgroundColor: currentTheme.colors.surface,
                  borderColor: currentTheme.colors.border,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={icon}
                size={16}
                color={
                  isActive
                    ? currentTheme.colors.text
                    : currentTheme.colors.textSecondary
                }
              />
            </View>
            <Text
              style={[
                styles.sectionTitle,
                isActive && styles.sectionTitleActive,
                {
                  color: isActive
                    ? currentTheme.colors.text
                    : currentTheme.colors.textSecondary,
                },
              ]}
            >
              {title}
            </Text>
          </View>
          <MaterialCommunityIcons
            name={isActive ? "chevron-up" : "chevron-down"}
            size={20}
            color={
              isActive
                ? currentTheme.colors.text
                : currentTheme.colors.textSecondary
            }
          />
        </View>
      </TouchableOpacity>
      {isActive && (
        <Animated.View
          style={[
            styles.sectionContent,
            { backgroundColor: currentTheme.colors.surface },
          ]}
        >
          {children}
        </Animated.View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  sectionHeaderGradient: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  sectionHeaderActive: {
    transform: [{ scale: 1.02 }],
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
  },
  iconContainerActive: {
    transform: [{ scale: 1.1 }],
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  sectionTitleActive: {
    fontWeight: "700",
  },
  sectionContent: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: -8,
  },
});
