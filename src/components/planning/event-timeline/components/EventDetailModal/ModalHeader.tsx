import Ionicons from "react-native-vector-icons/Ionicons";
import React, { useRef } from "react";
import { Animated, StyleSheet, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../../../../contexts/ThemeContext";
import { useCentralizedFont } from "../../../../../hooks/useCentralizedFont";
import { useTranslation } from "../../../../../hooks/useTranslation";
import { PlanningEvent } from "../../../../../types/planning";
import { UIText } from "../../../../ui/Typography";

interface ModalHeaderProps {
  event: PlanningEvent;
  onClose: () => void;
  onEdit?: (event: PlanningEvent) => void;
  onDelete?: (eventId: string) => void;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({
  event,
  onClose,
  onEdit,
  onDelete,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { ui } = useCentralizedFont();

  // Animation pour les boutons
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: "transparent",
          borderBottomColor: currentTheme.colors.border + "20",
        },
      ]}
    >
      <View style={styles.headerLeft}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            style={[
              styles.closeButton,
              {
                backgroundColor: currentTheme.colors.surface,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              },
            ]}
            onPress={onClose}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={24} color={currentTheme.colors.text} />
          </TouchableOpacity>
        </Animated.View>

        <UIText
          size="base"
          weight="semibold"
          style={[ui, styles.headerTitle, { color: currentTheme.colors.text }]}
        >
          {t("planning.timeline.eventDetails", "Détails de l'événement")}
        </UIText>
      </View>

      <View style={styles.headerActions}>
        {onEdit && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: currentTheme.colors.primary + "15",
                borderWidth: 1,
                borderColor: currentTheme.colors.primary + "30",
              },
            ]}
            onPress={() => onEdit(event)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="pencil"
              size={20}
              color={currentTheme.colors.primary}
            />
          </TouchableOpacity>
        )}

        {onDelete && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: "#FEE2E2",
                borderWidth: 1,
                borderColor: "#FCA5A5",
              },
            ]}
            onPress={() => onDelete(event.id)}
            activeOpacity={0.7}
          >
            <Ionicons name="trash" size={20} color="#DC2626" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    zIndex: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  headerTitle: {
    letterSpacing: 0.2,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
});
