import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionNav: {
    marginBottom: 16,
  },
  sectionNavContent: {
    paddingHorizontal: 0,
    gap: 8,
  },
  sectionNavButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  sectionNavText: {
        // Taille de police gérée par Typography
        // Poids de police géré par Typography
  },
  content: {
    flex: 1,
    paddingHorizontal: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
        // Taille de police gérée par Typography
        // Poids de police géré par Typography
    marginBottom: 12,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  iconOption: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  iconText: {
        // Taille de police gérée par Typography
  },
  styleOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  stylePreview: {
        // Taille de police gérée par Typography
  },
  styleInfo: {
    flex: 1,
  },
  styleName: {
        // Taille de police gérée par Typography
        // Poids de police géré par Typography
    marginBottom: 2,
  },
  styleDescription: {
        // Taille de police gérée par Typography
  },
  featureOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  featureInfo: {
    flex: 1,
  },
  featureLabel: {
        // Taille de police gérée par Typography
        // Poids de police géré par Typography
    marginBottom: 2,
  },
  featureDescription: {
        // Taille de police gérée par Typography
  },
  toggle: {
    width: 36,
    height: 20,
    borderRadius: 10,
    position: "relative",
    justifyContent: "center",
  },
  toggleIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    position: "absolute",
  },
});
