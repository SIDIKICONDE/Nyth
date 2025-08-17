import React from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  TouchableWithoutFeedback,
} from "react-native";
import { useTheme } from "../../../contexts/ThemeContext";
import {
  CustomizationTab,
  DetailsTab,
  TabNavigation,
  TaskModalHeader,
} from "./task-modal-components";
import { useTaskModal } from "./task-modal-hooks";
import { useKeyboardStability } from "./hooks/useKeyboardStability";
import { styles } from "./task-modal-styles";
import { TaskModalProps } from "./types";

export const TaskModalComponent: React.FC<TaskModalProps> = (props) => {
  const { visible } = props;
  const { currentTheme } = useTheme();
  const { dismissKeyboard } = useKeyboardStability();

  const {
    activeTab,
    modalTitle,
    formState,
    isSubmitting,
    hasChanges,
    isValid,
    updateField,
    handleClose,
    handleSave,
    handleTabChange,
  } = useTaskModal(props);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <SafeAreaView
            style={[
              styles.container,
              { backgroundColor: currentTheme.colors.background },
            ]}
          >
            <TaskModalHeader
              title={modalTitle}
              isValid={isValid}
              hasChanges={hasChanges}
              isSubmitting={isSubmitting}
              onClose={handleClose}
              onSave={handleSave}
            />

            <TabNavigation
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />

            <KeyboardAvoidingView
              style={styles.content}
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              keyboardVerticalOffset={0}
            >
              {activeTab === "details" && (
                <DetailsTab formState={formState} updateField={updateField} />
              )}

              {activeTab === "customization" && (
                <CustomizationTab
                  formState={formState}
                  updateField={updateField}
                />
              )}
            </KeyboardAvoidingView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Modal>
  );
};
