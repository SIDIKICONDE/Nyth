import React from "react";
import { Modal, ScrollView, View } from "react-native";
import { useTheme } from "../../../contexts/ThemeContext";
import { EditEventHeader, EventFormFields, EventInfo } from "./components";
import { ANIMATION, PRESENTATION_STYLE } from "./constants";
import { useEditEventModal } from "./hooks";
import { styles } from "./styles";
import { EditEventModalProps } from "./types";

export const EditEventModalComponent: React.FC<EditEventModalProps> = (
  props
) => {
  const { visible, event, onClose } = props;
  const { currentTheme } = useTheme();

  const {
    title,
    description,
    isLoading,
    isValid,
    handleSave,
    handleTitleChange,
    handleDescriptionChange,
  } = useEditEventModal(props);

  if (!event) return null;

  return (
    <Modal
      visible={visible}
      animationType={ANIMATION.SLIDE}
      presentationStyle={PRESENTATION_STYLE.PAGE_SHEET}
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.container,
          { backgroundColor: currentTheme.colors.background },
        ]}
      >
        <EditEventHeader
          title={title}
          isLoading={isLoading}
          isValid={isValid}
          onClose={onClose}
          onSave={handleSave}
        />

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <EventFormFields
            title={title}
            description={description}
            onTitleChange={handleTitleChange}
            onDescriptionChange={handleDescriptionChange}
          />

          <EventInfo event={event} />
        </ScrollView>
      </View>
    </Modal>
  );
};
