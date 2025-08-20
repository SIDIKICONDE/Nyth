import React from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  View,
} from "react-native";
import { useTheme } from "../../../../../contexts/ThemeContext";
import {
  DescriptionField,
  Header,
  IconSelector,
  NameField,
} from "./components";
import { EMOJI_OPTIONS } from "./constants";
import { useCategoryForm } from "./hooks";
import { styles } from "./styles";
import { AddCategoryModalProps } from "./types";

export const AddCategoryModalComponent: React.FC<AddCategoryModalProps> = ({
  visible,
  onClose,
  onAdd,
}) => {
  const { currentTheme } = useTheme();
  const {
    formData,
    isSubmitting,
    isValidName,
    updateName,
    updateDescription,
    updateIcon,
    handleSubmit,
    resetForm,
  } = useCategoryForm();

  const handleModalSubmit = async () => {
    const success = await handleSubmit(onAdd);
    if (success) {
      handleClose();
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={[
          styles.container,
          { backgroundColor: currentTheme.colors.background },
        ]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <Header
          onClose={handleClose}
          onSubmit={handleModalSubmit}
          isValidName={isValidName}
          isSubmitting={isSubmitting}
        />

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <NameField value={formData.name} onChange={updateName} />

          <IconSelector
            selectedIcon={formData.selectedIcon}
            onSelect={updateIcon}
            options={EMOJI_OPTIONS}
          />

          <DescriptionField
            value={formData.description}
            onChange={updateDescription}
          />

          {/* Espace pour le clavier */}
          <View style={styles.spacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};
