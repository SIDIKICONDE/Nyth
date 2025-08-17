import Ionicons from "react-native-vector-icons/Ionicons";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ContentText, H3, Label, UIText } from "../../components/ui/Typography";
import { useTheme } from "../../contexts/ThemeContext";
import { useTranslation } from "../../hooks/useTranslation";
import { PlanningEvent } from "../../types/planning";
import { STATUS_LABELS } from "./event-timeline/constants";

interface EditEventModalProps {
  visible: boolean;
  event: PlanningEvent | null;
  onClose: () => void;
  onSave: (eventId: string, updates: Partial<PlanningEvent>) => Promise<void>;
}

export const EditEventModal: React.FC<EditEventModalProps> = ({
  visible,
  event,
  onClose,
  onSave,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description || "");
    }
  }, [event]);

  const handleSave = async () => {
    if (!event || !title.trim()) {
      Alert.alert(
        t("common.error", "Error"),
        t("planning.events.errors.titleRequired", "Title is required")
      );
      return;
    }

    try {
      setIsLoading(true);
      await onSave(event.id, {
        title: title.trim(),
        description: description.trim(),
      });
      onClose();
    } catch (error) {
      Alert.alert(
        t("common.error", "Error"),
        t("planning.events.errors.saveFailed", "Could not save changes")
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!event) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.container,
          { backgroundColor: currentTheme.colors.background },
        ]}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: currentTheme.colors.surface,
              borderBottomColor: currentTheme.colors.border,
            },
          ]}
        >
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={[
                styles.closeButton,
                { backgroundColor: currentTheme.colors.background },
              ]}
              onPress={onClose}
            >
              <Ionicons
                name="close"
                size={24}
                color={currentTheme.colors.text}
              />
            </TouchableOpacity>
            <H3 style={{ color: currentTheme.colors.text }}>
              {t("planning.events.editTitle", "Edit Event")}
            </H3>
          </View>

          <TouchableOpacity
            style={[
              styles.saveButton,
              {
                backgroundColor: currentTheme.colors.primary,
                opacity: !title.trim() || isLoading ? 0.5 : 1,
              },
            ]}
            onPress={handleSave}
            disabled={!title.trim() || isLoading}
          >
            {isLoading ? (
              <UIText size={14} weight="600" style={{ color: "white" }}>
                ...
              </UIText>
            ) : (
              <UIText size={14} weight="600" style={{ color: "white" }}>
                {t("common.save", "Save")}
              </UIText>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Title Field */}
          <View
            style={[
              styles.fieldContainer,
              { backgroundColor: currentTheme.colors.surface },
            ]}
          >
            <Label style={{ color: currentTheme.colors.text }}>
              {t("planning.events.titleLabel", "Title")} *
            </Label>
            <TextInput
              style={[
                styles.textInput,
                {
                  color: currentTheme.colors.text,
                  backgroundColor: currentTheme.colors.background,
                  borderColor: currentTheme.colors.border,
                },
              ]}
              value={title}
              onChangeText={setTitle}
              placeholder={t("planning.events.titlePlaceholder", "Event title")}
              placeholderTextColor={currentTheme.colors.textSecondary}
              multiline={false}
            />
          </View>

          {/* Description Field */}
          <View
            style={[
              styles.fieldContainer,
              { backgroundColor: currentTheme.colors.surface },
            ]}
          >
            <Label style={{ color: currentTheme.colors.text }}>
              {t("planning.events.descriptionLabel", "Description")}
            </Label>
            <TextInput
              style={[
                styles.textInput,
                styles.textArea,
                {
                  color: currentTheme.colors.text,
                  backgroundColor: currentTheme.colors.background,
                  borderColor: currentTheme.colors.border,
                },
              ]}
              value={description}
              onChangeText={setDescription}
              placeholder={t(
                "planning.events.descriptionPlaceholder",
                "Event description"
              )}
              placeholderTextColor={currentTheme.colors.textSecondary}
              multiline={true}
              numberOfLines={4}
            />
          </View>

          {/* Event Info */}
          <View
            style={[
              styles.infoContainer,
              { backgroundColor: currentTheme.colors.surface },
            ]}
          >
            <Label style={{ color: currentTheme.colors.text }}>
              {t("planning.events.infoTitle", "Event Information")}
            </Label>

            <View style={styles.infoRow}>
              <Ionicons
                name="calendar"
                size={16}
                color={currentTheme.colors.primary}
              />
              <ContentText
                size={14}
                style={{ color: currentTheme.colors.textSecondary }}
              >
                {new Date(event.startDate).toLocaleDateString()}
              </ContentText>
            </View>

            <View style={styles.infoRow}>
              <Ionicons
                name="time"
                size={16}
                color={currentTheme.colors.primary}
              />
              <ContentText
                size={14}
                style={{ color: currentTheme.colors.textSecondary }}
              >
                {new Date(event.startDate).toLocaleTimeString()}
              </ContentText>
            </View>

            <View style={styles.infoRow}>
              <Ionicons
                name="flag"
                size={16}
                color={currentTheme.colors.primary}
              />
              <ContentText
                size={14}
                style={{ color: currentTheme.colors.textSecondary }}
              >
                {STATUS_LABELS[event.status]}
              </ContentText>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  fieldContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    // Taille de police gérée par Typography
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  infoContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
});
