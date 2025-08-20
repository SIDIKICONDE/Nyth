import { Platform, StyleSheet } from "react-native";
import { SPACING, UI_CONFIG } from "./task-modal-constants";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.HEADER_HORIZONTAL,
    paddingVertical: SPACING.HEADER_VERTICAL,
    borderBottomWidth: 1,
  },
  headerButton: {
    paddingHorizontal: SPACING.HEADER_BUTTON_HORIZONTAL,
    paddingVertical: SPACING.HEADER_BUTTON_VERTICAL,
    borderRadius: SPACING.BORDER_RADIUS_HEADER_BUTTON,
    minWidth: UI_CONFIG.HEADER_BUTTON_MIN_WIDTH,
    alignItems: "center",
  },
  saveButton: {
    paddingHorizontal: UI_CONFIG.HEADER_SAVE_PADDING,
  },
  headerButtonText: {
    // Taille de police gérée par Typography
    // Poids de police géré par Typography
  },
  saveButtonText: {
    // Poids de police géré par Typography
  },
  title: {
    // Taille de police gérée par Typography
    // Poids de police géré par Typography
  },
  tabNavigation: {
    flexDirection: "row",
    paddingHorizontal: SPACING.TAB_NAVIGATION_HORIZONTAL,
    paddingVertical: SPACING.TAB_NAVIGATION_VERTICAL,
    gap: SPACING.TAB_GAP,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.TAB_PADDING_VERTICAL,
    paddingHorizontal: SPACING.TAB_PADDING_HORIZONTAL,
    borderRadius: SPACING.BORDER_RADIUS_TAB,
    gap: SPACING.TAB_ICON_GAP,
  },
  tabText: {
    // Taille de police gérée par Typography
    // Poids de police géré par Typography
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.CONTENT_PADDING,
  },
  spacer: {
    height: UI_CONFIG.SPACER_HEIGHT,
  },
  // Styles pour les sous-tâches
  subtasksContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  subtasksHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  addSubtaskButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  subtasksList: {
    maxHeight: 200,
  },
  subtaskItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  subtaskStatusButton: {
    marginRight: 12,
    padding: 4,
  },
  subtaskContent: {
    flex: 1,
  },
  subtaskTitle: {
    flex: 1,
  },
  subtaskDeleteButton: {
    padding: 4,
  },
  addSubtaskContainer: {
    marginTop: 8,
  },
  addSubtaskInput: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: Platform.OS === "ios" ? "solid" : "dashed",
  },
  addSubtaskPlaceholder: {
    marginLeft: 8,
    fontStyle: "italic",
  },
  addSubtaskTextInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    minHeight: 20,
  },
  // Styles pour les sections horizontales
  horizontalSection: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  halfWidth: {
    flex: 1,
  },
});
