import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 60,
    alignItems: "center",
  },
  saveButton: {
    paddingHorizontal: 12,
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  field: {
    marginBottom: 20,
  },
  label: {
        // Taille de police gérée par Typography
        // Poids de police géré par Typography
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
        // Taille de police gérée par Typography
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  charCount: {
        // Taille de police gérée par Typography
    textAlign: "right",
    marginTop: 4,
  },
  emojiScrollContainer: {
    paddingVertical: 4,
  },
  emojiGrid: {
    flexDirection: "row",
    gap: 8,
  },
  emojiOption: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
        // Taille de police gérée par Typography
  },
  spacer: {
    height: 60,
  },
});
