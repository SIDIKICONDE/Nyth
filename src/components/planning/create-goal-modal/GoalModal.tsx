import React, { useRef, useEffect } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  ScrollView,
  Keyboard,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { UIText } from "../../../components/ui/Typography";
import { useTheme } from "../../../contexts/ThemeContext";
import { useTranslation } from "../../../hooks/useTranslation";
import { Goal } from "../../../types/planning";
import { useCreateGoal } from "./hooks/useCreateGoal";
import { GoalModalProps } from "./types";
import { calculateProgress } from "./utils/progressCalculator";
import { ModalContent } from "./components/ModalContent";

interface ExtendedGoalModalProps extends GoalModalProps {
  goal?: Goal;
  onGoalUpdated?: (goal: Goal) => void;
}

// Composant d'header moderne
const ModernHeader: React.FC<{
  onClose: () => void;
  onSubmit: () => Promise<void>;
  loading: boolean;
  isEditMode: boolean;
  canSubmit: boolean;
}> = ({ onClose, onSubmit, loading, isEditMode, canSubmit }) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={[
        headerStyles.container,
        {
          backgroundColor: currentTheme.colors.surface,
          borderBottomColor: currentTheme.colors.border,
        },
      ]}
    >
      <View style={headerStyles.content}>
        <TouchableOpacity
          style={[
            headerStyles.closeButton,
            { backgroundColor: currentTheme.colors.background },
          ]}
          onPress={onClose}
        >
          <Ionicons name="close" size={20} color={currentTheme.colors.text} />
        </TouchableOpacity>

        <UIText
          size="lg"
          weight="bold"
          style={[headerStyles.title, { color: currentTheme.colors.text }]}
        >
          {isEditMode
            ? t("planning.goals.modal.header.editGoal", "🎯 Modifier")
            : t("planning.goals.modal.header.newGoal", "✨ Nouvel objectif")}
        </UIText>

        <TouchableOpacity
          style={[
            headerStyles.saveButton,
            {
              backgroundColor: canSubmit
                ? currentTheme.colors.primary
                : currentTheme.colors.border,
              opacity: canSubmit ? 1 : 0.5,
            },
          ]}
          onPress={onSubmit}
          disabled={!canSubmit || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <UIText size="sm" weight="bold" style={{ color: "#FFFFFF" }}>
              {t("common.save", "Sauvegarder")}
            </UIText>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const headerStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    textAlign: "center",
    marginHorizontal: 12,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    minWidth: 80,
    alignItems: "center",
    justifyContent: "center",
  },
});

export const GoalModal: React.FC<ExtendedGoalModalProps> = ({
  visible,
  onClose,
  onGoalCreated,
  goal,
  onGoalUpdated,
}) => {
  const { currentTheme } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);

  // Form logic
  const { formData, loading, updateFormData, handleSubmit, handleClose } =
    useCreateGoal(onGoalCreated, onClose, goal, onGoalUpdated);

  const isEditMode = !!goal;

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const handleModalClose = () => {
    dismissKeyboard();
    handleClose();
  };

  const handleFormSubmit = async () => {
    dismissKeyboard();
    await handleSubmit();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleModalClose}
    >
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <SafeAreaView
            style={[
              styles.safeArea,
              { backgroundColor: currentTheme.colors.background },
            ]}
          >
            {/* Header */}
            <ModernHeader
              onClose={handleModalClose}
              onSubmit={handleFormSubmit}
              loading={loading}
              isEditMode={isEditMode}
              canSubmit={formData.title.trim().length > 0}
            />

            {/* Content */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
            >
              <ModalContent
                formData={formData}
                updateFormData={updateFormData}
                isEditMode={isEditMode}
              />
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
});
