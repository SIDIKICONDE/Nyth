import { Platform, StyleSheet } from "react-native";
import { DROPDOWN_CONFIG, SPACING, UI_CONFIG, Z_INDEX } from "./constants";

export const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.CONTAINER_BOTTOM,
    zIndex: Z_INDEX.CONTAINER,
  },
  label: {
    // Taille de police gérée par Typography
    // Poids de police géré par Typography
    marginBottom: SPACING.LABEL_BOTTOM,
  },
  picker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: DROPDOWN_CONFIG.BORDER_RADIUS,
    paddingHorizontal: SPACING.PICKER_HORIZONTAL,
    paddingVertical: SPACING.PICKER_VERTICAL,
    minHeight: UI_CONFIG.MINIMUM_TOUCH_SIZE,
  },
  selectedContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: SPACING.CATEGORY_GAP,
  },
  categoryIcon: {
    fontSize: UI_CONFIG.ICON_SIZE,
  },
  selectedText: {
    // Taille de police gérée par Typography
    // Poids de police géré par Typography
    flex: 1,
  },
  customBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  customBadgeText: {
    // Taille de police gérée par Typography
    // Poids de police géré par Typography
  },
  placeholderText: {
    // Taille de police gérée par Typography
  },
  chevron: {
    fontSize: UI_CONFIG.CHEVRON_SIZE,
    // Poids de police géré par Typography
    marginLeft: SPACING.CATEGORY_GAP,
  },
  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: DROPDOWN_CONFIG.BORDER_RADIUS,
    marginTop: SPACING.DROPDOWN_TOP,
    maxHeight: DROPDOWN_CONFIG.MAX_HEIGHT,
    elevation: DROPDOWN_CONFIG.ELEVATION,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: DROPDOWN_CONFIG.SHADOW_OPACITY,
    shadowRadius: DROPDOWN_CONFIG.SHADOW_RADIUS,
    zIndex: Z_INDEX.DROPDOWN,
  },
  dropdownScroll: {
    maxHeight: DROPDOWN_CONFIG.MAX_HEIGHT,
  },
  categoryOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.PICKER_HORIZONTAL,
    paddingVertical: SPACING.PICKER_VERTICAL,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  categoryContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: SPACING.CATEGORY_GAP,
  },
  categoryInfo: {
    flex: 1,
  },
  customCategoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  customBadgeSmall: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  customBadgeSmallText: {
    // Taille de police gérée par Typography
    // Poids de police géré par Typography
  },
  categoryName: {
    // Taille de police gérée par Typography
    // Poids de police géré par Typography
  },
  categoryDescription: {
    // Taille de police gérée par Typography
    marginTop: 2,
  },
  checkIcon: {
    fontSize: UI_CONFIG.CHECK_ICON_SIZE,
    // Poids de police géré par Typography
  },
  separator: {
    height: 1,
    marginVertical: SPACING.SEPARATOR_VERTICAL,
    marginHorizontal: SPACING.SEPARATOR_HORIZONTAL,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  separatorText: {
    // Taille de police gérée par Typography
    // Poids de police géré par Typography
    textTransform: "uppercase",
    paddingHorizontal: SPACING.CATEGORY_GAP,
    backgroundColor: "inherit",
  },
  addCategoryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.PICKER_VERTICAL,
    marginHorizontal: SPACING.ADD_BUTTON_MARGIN,
    marginVertical: SPACING.ADD_BUTTON_MARGIN,
    borderRadius: 6,
    borderWidth: 1,
    borderStyle: Platform.OS === "ios" ? "solid" : "dashed",
    gap: SPACING.CATEGORY_GAP,
  },
  addIcon: {
    fontSize: UI_CONFIG.ADD_ICON_SIZE,
    // Poids de police géré par Typography
  },
  addCategoryText: {
    // Taille de police gérée par Typography
    // Poids de police géré par Typography
  },
  errorText: {
    color: "#EF4444",
    // Taille de police gérée par Typography
    marginTop: 4,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: -1000,
    right: -1000,
    bottom: -1000,
    zIndex: Z_INDEX.OVERLAY,
  },
});
