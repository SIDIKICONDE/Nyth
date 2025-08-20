import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    borderWidth: 1,
    borderLeftWidth: 4,
    padding: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  priorityContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  priorityIcon: {
    // Taille de police gérée par Typography
  },
  dueDate: {
    // Taille de police gérée par Typography
    // Poids de police géré par Typography
  },
  title: {
    // Taille de police gérée par Typography
    // Poids de police géré par Typography
    marginBottom: 4,
    lineHeight: 18,
  },
  description: {
    // Taille de police gérée par Typography
    lineHeight: 16,
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 8,
  },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    // Taille de police gérée par Typography
    // Poids de police géré par Typography
  },
  moreTagsText: {
    // Taille de police gérée par Typography
    // Poids de police géré par Typography
    alignSelf: "center",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 2,
  },
  estimatedHours: {
    // Taille de police gérée par Typography
    // Poids de police géré par Typography
  },
});
