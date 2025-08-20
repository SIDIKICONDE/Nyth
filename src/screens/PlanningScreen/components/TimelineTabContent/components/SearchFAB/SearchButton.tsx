import Ionicons from "react-native-vector-icons/Ionicons";
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "../../../../../../contexts/ThemeContext";

interface SearchButtonProps {
  onPress: () => void;
}

export const SearchButton: React.FC<SearchButtonProps> = ({ onPress }) => {
  const { currentTheme } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.fab, { backgroundColor: "transparent" }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons name="search" size={24} color={currentTheme.colors.primary} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 10,
    left: 35,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 1000,
  },
});
