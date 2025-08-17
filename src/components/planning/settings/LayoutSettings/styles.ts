import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    lineHeight: 18,
    textAlign: "center",
    marginBottom: 16,
  },
  navigation: {
    marginBottom: 16,
  },
  navContent: {
    paddingHorizontal: 4,
    gap: 12,
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  navText: {
    fontWeight: "500",
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 28,
    backgroundColor: "transparent",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: "600",
  },
  sectionDescription: {
    lineHeight: 20,
    marginBottom: 20,
  },
  presetCard: {
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  presetHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 14,
  },
  presetIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  presetInfo: {
    flex: 1,
  },
  presetName: {
    marginBottom: 4,
    fontWeight: "600",
  },
  presetDescription: {
    lineHeight: 18,
  },
  presetValues: {
    fontStyle: "italic",
    opacity: 0.8,
  },
  settingContainer: {
    marginBottom: 24,
  },
  settingLabel: {
    marginBottom: 10,
    fontWeight: "500",
  },
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  valueButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 50,
    alignItems: "center",
    borderWidth: 1,
  },
  valueButtonText: {
    fontWeight: "500",
  },
  toggleOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
    gap: 12,
    borderWidth: 1,
  },
  toggleInfo: {
    flex: 1,
  },
  toggleLabel: {
    marginBottom: 4,
    fontWeight: "500",
  },
  toggleDescription: {
    lineHeight: 16,
  },
  toggle: {
    width: 40,
    height: 22,
    borderRadius: 11,
    position: "relative",
    justifyContent: "center",
  },
  toggleIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
    position: "absolute",
  },
  actions: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "center",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  resetButton: {
    borderWidth: 1,
  },
  actionText: {
    fontWeight: "500",
  },
});
