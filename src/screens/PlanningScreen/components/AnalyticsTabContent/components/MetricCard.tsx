import { useTheme } from "@/contexts/ThemeContext";
import { useAdaptiveDimensions } from "@/hooks/useAdaptiveDimensions";
import Ionicons from "react-native-vector-icons/Ionicons";
import React from "react";
import { Animated, StyleSheet, View } from "react-native";
import { HeadingText, UIText } from "../../../../../components/ui/Typography";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  icon?: string;
  trend?: "up" | "down" | "neutral";
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  color,
  icon,
  trend,
}) => {
  const { currentTheme } = useTheme();
  const adaptiveDimensions = useAdaptiveDimensions();
  const scaleAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return { name: "trending-up", color: currentTheme.colors.success };
      case "down":
        return { name: "trending-down", color: currentTheme.colors.error };
      default:
        return null;
    }
  };

  const trendInfo = getTrendIcon();
  const styles = createStyles(adaptiveDimensions, currentTheme);

  return (
    <Animated.View
      style={[
        styles.metricCard,
        {
          backgroundColor: currentTheme.colors.surface,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View
        style={[
          styles.gradientBg,
          {
            backgroundColor: color
              ? color + "10"
              : currentTheme.colors.primary + "10",
          },
        ]}
      >
        <View style={styles.cardContent}>
          <View style={styles.iconRow}>
            {icon && (
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: color
                      ? color + "20"
                      : currentTheme.colors.primary + "20",
                  },
                ]}
              >
                <Ionicons
                  name={icon as any}
                  size={20}
                  color={color || currentTheme.colors.primary}
                />
              </View>
            )}
            {trendInfo && (
              <View style={styles.trendContainer}>
                <Ionicons
                  name={trendInfo.name as any}
                  size={16}
                  color={trendInfo.color}
                />
              </View>
            )}
          </View>

          <HeadingText
            style={[
              styles.metricValue,
              { color: color || currentTheme.colors.text },
            ]}
            size="2xl"
            weight="bold"
          >
            {value}
          </HeadingText>

          <UIText
            style={[styles.metricTitle, { color: currentTheme.colors.text }]}
            size="sm"
            weight="semibold"
          >
            {title}
          </UIText>

          {subtitle && (
            <View style={styles.subtitleContainer}>
              <UIText
                style={[
                  styles.metricSubtitle,
                  { color: currentTheme.colors.textSecondary },
                ]}
                size="xs"
                weight="bold"
              >
                {subtitle}
              </UIText>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

const createStyles = (adaptiveDimensions: any, currentTheme: any) =>
  StyleSheet.create({
    metricCard: {
      width: adaptiveDimensions.device.isTablet ? "48%" : "48%",
      borderRadius: adaptiveDimensions.borderRadius.lg,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
      overflow: "hidden",
    },
    gradientBg: {
      padding: adaptiveDimensions.spacing.sm,
    },
    cardContent: {
      minHeight: adaptiveDimensions.componentHeight.button * 1.5,
    },
    iconRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: adaptiveDimensions.spacing.xs,
    },
    iconContainer: {
      width: adaptiveDimensions.componentHeight.touchTarget * 0.7,
      height: adaptiveDimensions.componentHeight.touchTarget * 0.7,
      borderRadius: adaptiveDimensions.borderRadius.sm,
      alignItems: "center",
      justifyContent: "center",
    },
    trendContainer: {
      width: adaptiveDimensions.spacing.lg,
      height: adaptiveDimensions.spacing.lg,
      borderRadius: adaptiveDimensions.spacing.lg / 2,
      backgroundColor: "rgba(16, 185, 129, 0.1)",
      alignItems: "center",
      justifyContent: "center",
    },
    metricValue: {
      marginBottom: 4,
      letterSpacing: -0.5,
      // fontSize et fontWeight supprimés - gérés par HeadingText
    },
    metricTitle: {
      opacity: 0.8,
      // fontSize et fontWeight supprimés - gérés par UIText
    },
    subtitleContainer: {
      marginTop: adaptiveDimensions.spacing.xs,
      paddingTop: adaptiveDimensions.spacing.xs,
      borderTopWidth: 1,
      borderTopColor: "rgba(0,0,0,0.05)",
    },
    metricSubtitle: {
      // fontSize et fontWeight supprimés - gérés par UIText
    },
  });
