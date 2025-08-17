import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "@/hooks/useTranslation";
import Ionicons from "react-native-vector-icons/Ionicons";
import React from "react";
import { Animated, StyleSheet, TouchableOpacity, View } from "react-native";
import { UIText } from "../../../ui/Typography";

interface ModalHeaderProps {
  isEditMode: boolean;
  onClose: () => void;
  onSave: () => void;
  isLoading: boolean;
  canSave: boolean;
  progressPercentage: number;
  fadeAnim: Animated.Value;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({
  isEditMode,
  onClose,
  onSave,
  isLoading,
  canSave,
  progressPercentage,
  fadeAnim,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={[
        styles.headerGradient,
        { backgroundColor: currentTheme.colors.primary + "15" },
      ]}
    >
      <View style={styles.headerContent}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={[
              styles.closeButton,
              { backgroundColor: currentTheme.colors.surface },
            ]}
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color={currentTheme.colors.text} />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <UIText
              size="xl"
              weight="bold"
              color={currentTheme.colors.text}
              style={styles.headerTitle}
            >
              {isEditMode
                ? t("planning.events.modal.header.editEvent", "✏️ Modifier")
                : t(
                    "planning.events.modal.header.newEvent",
                    "✨ Nouvel événement"
                  )}
            </UIText>
          </View>

          <TouchableOpacity
            style={[
              styles.saveButton,
              {
                backgroundColor: currentTheme.colors.primary,
                opacity: !canSave || isLoading ? 0.5 : 1,
              },
            ]}
            onPress={onSave}
            disabled={!canSave || isLoading}
          >
            <View
              style={[
                styles.saveButtonGradient,
                { backgroundColor: currentTheme.colors.primary },
              ]}
            >
              {isLoading ? (
                <Animated.View style={styles.loadingContainer}>
                  <Ionicons name="hourglass" size={16} color="#fff" />
                </Animated.View>
              ) : (
                <View style={styles.saveButtonContent}>
                  <Ionicons
                    name={isEditMode ? "checkmark" : "add"}
                    size={16}
                    color="#fff"
                  />
                  <UIText size="base" weight="bold" color="#fff">
                    {isEditMode
                      ? t("planning.events.modal.header.save", "Sauver")
                      : t("planning.events.modal.header.create", "Créer")}
                  </UIText>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Barre de progression */}
        <View style={styles.progressContainer}>
          <View style={styles.progressInfo}>
            <UIText
              size="xs"
              weight="semibold"
              color={currentTheme.colors.textSecondary}
              style={styles.progressLabel}
            >
              {t("planning.events.modal.header.progress", "Progression")}
            </UIText>
            <UIText size="sm" weight="bold" color={currentTheme.colors.primary}>
              {Math.round(progressPercentage)}%
            </UIText>
          </View>
          <View
            style={[
              styles.progressBar,
              { backgroundColor: currentTheme.colors.surface },
            ]}
          >
            <Animated.View
              style={[
                styles.progressFill,
                {
                  backgroundColor: currentTheme.colors.primary,
                  transform: [
                    {
                      scaleX: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, progressPercentage / 100],
                      }),
                    },
                  ],
                },
              ]}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerGradient: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 4,
  },
  headerContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitleContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    letterSpacing: -0.3,
    marginBottom: 1,
  },
  headerSubtitle: {
    opacity: 0.7,
    lineHeight: 16,
  },
  saveButton: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonGradient: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  saveButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  progressContainer: {
    marginTop: 4,
  },
  progressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  progressLabel: {
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  progressBar: {
    height: 3,
    borderRadius: 1.5,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    width: "100%",
    borderRadius: 2,
    transformOrigin: "left",
  },
});
