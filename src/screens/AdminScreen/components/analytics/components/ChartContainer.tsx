import React, { ReactNode } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { useTheme } from "../../../../../contexts/ThemeContext";

interface ChartContainerProps {
  title: ReactNode;
  children: ReactNode;
  subtitle?: string;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  children,
  subtitle,
}) => {
  const { currentTheme } = useTheme();
  const colors = currentTheme.colors;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          {typeof title === "string" ? (
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          ) : (
            <View style={styles.titleWithIcon}>{title}</View>
          )}
        </View>
        {subtitle && (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
      <View style={styles.contentContainer}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    maxWidth: 800,
    alignSelf: "center",
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  header: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  titleContainer: {
    marginBottom: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  titleWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "400",
    opacity: 0.8,
  },
  contentContainer: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
});
