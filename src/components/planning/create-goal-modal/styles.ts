import { StyleSheet } from "react-native";

export const modalStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40, // Espace supplémentaire en bas
  },
  lastSection: {
    marginBottom: 40, // Plus d'espace pour la dernière section
  },
});
