import Ionicons from "react-native-vector-icons/Ionicons";
import React from "react";
import { Animated, StyleSheet, TouchableOpacity, View } from "react-native";
import { UIText } from "../../../../components/ui/Typography";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../hooks/useTranslation";

interface ModalHeaderProps {
  onClose: () => void;
  onSubmit: () => Promise<void>;
  loading: boolean;
  isEditMode?: boolean;
  progressPercentage?: number;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({
  onClose,
  onSubmit,
  loading,
  isEditMode = false,
  progressPercentage = 0,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={[
        styles.headerGradient,
        { backgroundColor: currentTheme.colors.success + "10" },
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
            <Ionicons name="close" size={20} color={currentTheme.colors.text} />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <UIText
              style={[styles.headerTitle, { color: currentTheme.colors.text }]}
              size="lg"
              weight="bold"
            >
              {isEditMode
                ? t("planning.goals.modal.header.editGoal", "🎯 Modifier")
                : t(
                    "planning.goals.modal.header.newGoal",
                    "✨ Nouvel objectif"
                  )}
            </UIText>
          </View>

          <TouchableOpacity
            style={[
              styles.saveButton,
              {
                backgroundColor: currentTheme.colors.success,
                opacity: loading ? 0.5 : 1,
              },
            ]}
            onPress={onSubmit}
            disabled={loading}
          >
            <View
              style={[
                styles.saveButtonGradient,
                { backgroundColor: currentTheme.colors.success },
              ]}
            >
              {loading ? (
                <Animated.View style={styles.loadingContainer}>
                  <Ionicons name="hourglass" size={14} color="#fff" />
                </Animated.View>
              ) : (
                <View style={styles.saveButtonContent}>
                  <Ionicons
                    name={isEditMode ? "checkmark" : "flag"}
                    size={14}
                    color="#fff"
                  />
                  <UIText
                    style={styles.saveButtonText}
                    size="sm"
                    weight="bold"
                    color="#fff"
                  >
                    {isEditMode
                      ? t("common.save", "Sauver")
                      : t("common.create", "Créer")}
                  </UIText>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Barre de progression simplifiée */}
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressBar,
              { backgroundColor: currentTheme.colors.surface },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: currentTheme.colors.success,
                  width: `${progressPercentage}%`,
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
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 8,
  },
  headerContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTitleContainer: {
    flex: 1,
    marginHorizontal: 10,
    justifyContent: "center",
  },
  headerTitle: {
    letterSpacing: -0.2,
  },
  saveButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  saveButtonGradient: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  saveButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  saveButtonText: {
    color: "#fff",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  progressContainer: {
    marginTop: 4,
  },
  progressBar: {
    height: 3,
    borderRadius: 1.5,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    width: "100%",
    borderRadius: 1.5,
    transformOrigin: "left",
  },
});
