import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTheme } from "../../../../../contexts/ThemeContext";

interface StatCardProps {
  icon: string;
  iconColor: string;
  value: string | number;
  label: string;
}

export const StatCard: React.FC<StatCardProps> = React.memo(
  ({ icon, iconColor, value, label }) => {
    const { currentTheme } = useTheme();
    const colors = currentTheme.colors;

    return (
      <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
        <Ionicons name={icon as any} size={32} color={iconColor} />
        <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
          {label}
        </Text>
      </View>
    );
  }
);

StatCard.displayName = "StatCard";

const styles = StyleSheet.create({
  statCard: {
    width: "48%",
    padding: 20,
    marginBottom: 16,
    borderRadius: 12,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
});
