import { StyleSheet } from "react-native";
import { SPACING, STYLING } from "./constants";

export const styles = StyleSheet.create({
  container: {
    borderRadius: STYLING.BORDER_RADIUS_CONTAINER,
    marginHorizontal: SPACING.CONTAINER_MARGIN_HORIZONTAL,
    marginVertical: SPACING.CONTAINER_MARGIN_VERTICAL,
    shadowOffset: STYLING.SHADOW_OFFSET,
    shadowOpacity: STYLING.SHADOW_OPACITY,
    shadowRadius: STYLING.SHADOW_RADIUS,
    elevation: STYLING.ELEVATION,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.HEADER_PADDING,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.HEADER_LEFT_GAP,
  },
  headerTitle: {
        // Taille de police gérée par Typography
        // Poids de police géré par Typography
  },
  content: {
    paddingHorizontal: SPACING.CONTENT_PADDING_HORIZONTAL,
    paddingBottom: SPACING.CONTENT_PADDING_BOTTOM,
  },
  section: {
    marginBottom: SPACING.SECTION_MARGIN_BOTTOM,
  },
  sectionTitle: {
        // Taille de police gérée par Typography
        // Poids de police géré par Typography
    marginBottom: SPACING.SECTION_TITLE_MARGIN_BOTTOM,
  },
  suggestionCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.HEADER_PADDING,
    borderRadius: STYLING.BORDER_RADIUS_CARDS,
    marginBottom: SPACING.SUGGESTION_MARGIN_BOTTOM,
    borderWidth: STYLING.BORDER_WIDTH,
  },
  suggestionText: {
    flex: 1,
        // Taille de police gérée par Typography
    lineHeight: 20,
  },
  quickActions: {
    marginHorizontal: SPACING.QUICK_ACTIONS_MARGIN,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: STYLING.BORDER_RADIUS_ACTIONS,
    marginHorizontal: SPACING.ACTION_BUTTON_MARGIN,
    minWidth: STYLING.ACTION_MIN_WIDTH,
  },
  actionButtonText: {
        // Taille de police gérée par Typography
        // Poids de police géré par Typography
    textAlign: "center",
  },
  chatButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.HEADER_PADDING,
    borderRadius: STYLING.BORDER_RADIUS_CARDS,
    marginTop: SPACING.CHAT_BUTTON_MARGIN_TOP,
    gap: SPACING.CHAT_BUTTON_GAP,
  },
  chatButtonText: {
        // Taille de police gérée par Typography
        // Poids de police géré par Typography
  },
  insightCard: {
    padding: SPACING.HEADER_PADDING,
    borderRadius: STYLING.BORDER_RADIUS_CARDS,
    marginBottom: SPACING.INSIGHT_MARGIN_BOTTOM,
    borderLeftWidth: STYLING.BORDER_LEFT_WIDTH,
  },
  insightText: {
        // Taille de police gérée par Typography
    lineHeight: 20,
  },
});
