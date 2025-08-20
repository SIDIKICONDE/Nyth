import { useTheme } from "@/contexts/ThemeContext";
import { useCentralizedFont } from "@/hooks/useCentralizedFont";
import { useTranslation } from "@/hooks/useTranslation";
import Ionicons from "react-native-vector-icons/Ionicons";
import React from "react";
import { Animated, StyleSheet, TouchableOpacity, View } from "react-native";
import { HeadingText, UIText } from "../../../../../components/ui/Typography";

interface AnalyticsHeaderProps {
  onRefresh: () => void;
  isLoading: boolean;
  totalEvents?: number;
  completionRate?: number;
}

export const AnalyticsHeader: React.FC<AnalyticsHeaderProps> = ({
  onRefresh,
  isLoading,
  totalEvents = 0,
  completionRate = 0,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { ui, heading } = useCentralizedFont();
  const rotateAnim = React.useRef(new Animated.Value(0)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleRefresh = () => {
    // Animation de rotation
    Animated.timing(rotateAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      rotateAnim.setValue(0);
    });
    onRefresh();
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View
        style={[
          styles.gradientBg,
          { backgroundColor: currentTheme.colors.primary + "08" },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.titleSection}>
            <HeadingText
              size="xl"
              weight="bold"
              style={[
                heading,
                styles.headerTitle,
                { color: currentTheme.colors.text },
              ]}
            >
              {t("planning.analytics.header.title", "📊 Analytics")}
            </HeadingText>
            <UIText
              size="sm"
              weight="medium"
              style={[
                ui,
                styles.headerSubtitle,
                { color: currentTheme.colors.textSecondary },
              ]}
            >
              {t(
                "planning.analytics.header.subtitle",
                "Overview of your performance"
              )}
            </UIText>
          </View>

          <View style={styles.headerButtons}>
            {/* Refresh Button */}
            <TouchableOpacity
              style={[
                styles.refreshButton,
                { backgroundColor: currentTheme.colors.primary },
              ]}
              onPress={handleRefresh}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <Ionicons
                  name="refresh"
                  size={20}
                  color={currentTheme.colors.background}
                />
              </Animated.View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  gradientBg: {
    borderRadius: 12,
    padding: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  titleSection: {
    flex: 1,
  },
  headerTitle: {
    letterSpacing: -0.3,
    marginBottom: 2,
    // fontSize et fontWeight supprimés - gérés par HeadingText
  },
  headerSubtitle: {
    opacity: 0.7,
    // fontSize et fontWeight supprimés - gérés par UIText
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  refreshButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },

});
