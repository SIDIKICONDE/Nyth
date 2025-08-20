import { StyleSheet } from "react-native";
import { SPACING, UI_CONFIG } from "./constants";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.HEADER_HORIZONTAL,
    paddingVertical: SPACING.HEADER_VERTICAL,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  closeButton: {
    width: UI_CONFIG.CLOSE_BUTTON_SIZE,
    height: UI_CONFIG.CLOSE_BUTTON_SIZE,
    borderRadius: UI_CONFIG.CLOSE_BUTTON_RADIUS,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.CLOSE_BUTTON_MARGIN,
  },
  headerTitle: {
        // Taille de police gérée par Typography
        // Poids de police géré par Typography
  },
  saveButton: {
    paddingHorizontal: SPACING.SAVE_BUTTON_HORIZONTAL,
    paddingVertical: SPACING.SAVE_BUTTON_VERTICAL,
    borderRadius: UI_CONFIG.SAVE_BUTTON_RADIUS,
  },
  saveButtonText: {
        // Taille de police gérée par Typography
        // Poids de police géré par Typography
  },
  content: {
    flex: 1,
    padding: SPACING.CONTENT_PADDING,
  },
  fieldContainer: {
    borderRadius: UI_CONFIG.CONTAINER_BORDER_RADIUS,
    padding: SPACING.FIELD_CONTAINER_PADDING,
    marginBottom: SPACING.FIELD_CONTAINER_MARGIN,
  },
  fieldLabel: {
        // Taille de police gérée par Typography
        // Poids de police géré par Typography
    marginBottom: SPACING.FIELD_LABEL_MARGIN,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: UI_CONFIG.FIELD_BORDER_RADIUS,
    paddingHorizontal: SPACING.TEXT_INPUT_HORIZONTAL,
    paddingVertical: SPACING.TEXT_INPUT_VERTICAL,
        // Taille de police gérée par Typography
  },
  textArea: {
    minHeight: UI_CONFIG.TEXT_AREA_MIN_HEIGHT,
    textAlignVertical: "top",
  },
  infoContainer: {
    borderRadius: UI_CONFIG.CONTAINER_BORDER_RADIUS,
    padding: SPACING.FIELD_CONTAINER_PADDING,
    marginBottom: SPACING.FIELD_CONTAINER_MARGIN,
  },
  infoTitle: {
        // Taille de police gérée par Typography
        // Poids de police géré par Typography
    marginBottom: SPACING.INFO_TITLE_MARGIN,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.INFO_ROW_MARGIN,
    gap: SPACING.INFO_ROW_GAP,
  },
  infoText: {
        // Taille de police gérée par Typography
  },
});
