import { useTheme } from "@/contexts/ThemeContext";
import React from "react";
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { ModalContent, ModalHeader } from "./components";
import { useEventForm } from "./hooks/useEventForm";
import { useModalAnimations } from "./hooks/useModalAnimations";
import { EventModalProps, isEditMode } from "./types";
import { calculateProgressPercentage } from "./utils/progressCalculator";

const { height: screenHeight } = Dimensions.get("window");

export const EventModal: React.FC<EventModalProps> = ({
  visible,
  event,
  onClose,
  onCreate,
  onSave,
  selectedDate = new Date(),
}) => {
  const { currentTheme } = useTheme();

  // Animations
  const { slideAnim, fadeAnim, scaleAnim, hideModal } =
    useModalAnimations(visible);

  // Form logic
  const {
    title,
    setTitle,
    type,
    setType,
    priority,
    setPriority,
    startDate,
    startTime,
    estimatedDuration,
    setEstimatedDuration,
    tags,
    setTags,
    location,
    setLocation,
    isLoading,
    showDatePicker,
    setShowDatePicker,
    showTimePicker,
    setShowTimePicker,
    handleSubmit,
    onDateChange,
    onTimeChange,
  } = useEventForm(event, selectedDate, onCreate, onSave, onClose);

  // Progress calculation
  const progressPercentage = calculateProgressPercentage({
    title,
    location,
    type,
    priority,
    estimatedDuration,
  });

  const canSave = title.trim().length > 0;

  const handleClose = () => {
    hideModal(onClose);
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={handleClose}
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.overlayTouch}
          activeOpacity={1}
          onPress={handleClose}
        />

        <Animated.View
          style={[
            styles.modalContainer,
            {
              backgroundColor: currentTheme.colors.background,
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            },
          ]}
        >
          <KeyboardAvoidingView
            style={styles.keyboardContainer}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
          >
            {/* Header */}
            <ModalHeader
              isEditMode={isEditMode(event)}
              onClose={handleClose}
              onSave={handleSubmit}
              isLoading={isLoading}
              canSave={canSave}
              progressPercentage={progressPercentage}
              fadeAnim={fadeAnim}
            />

            {/* Content */}
            <ModalContent
              fadeAnim={fadeAnim}
              title={title}
              setTitle={setTitle}
              location={location}
              setLocation={setLocation}
              tags={tags}
              setTags={setTags}
              type={type}
              setType={setType}
              priority={priority}
              setPriority={setPriority}
              startDate={startDate}
              startTime={startTime}
              showDatePicker={showDatePicker}
              showTimePicker={showTimePicker}
              onDateChange={onDateChange}
              onTimeChange={onTimeChange}
              setShowDatePicker={setShowDatePicker}
              setShowTimePicker={setShowTimePicker}
              estimatedDuration={estimatedDuration}
              setEstimatedDuration={setEstimatedDuration}
            />
          </KeyboardAvoidingView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  overlayTouch: {
    flex: 1,
  },
  modalContainer: {
    height: screenHeight * 0.90,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  keyboardContainer: {
    flex: 1,
  },
});
