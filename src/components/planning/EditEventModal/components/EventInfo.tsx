import Ionicons from "react-native-vector-icons/Ionicons";
import React from "react";
import { Text, View } from "react-native";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../hooks/useTranslation";
import { STATUS_LABELS } from "../../event-timeline/constants";
import { ICONS, LABELS, UI_CONFIG } from "../constants";
import { styles } from "../styles";
import { EventInfoProps } from "../types";

export const EventInfo: React.FC<EventInfoProps> = ({ event }) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={[
        styles.infoContainer,
        { backgroundColor: currentTheme.colors.surface },
      ]}
    >
      <Text style={[styles.infoTitle, { color: currentTheme.colors.text }]}>
        {t("planning.events.infoTitle", LABELS.EVENT_INFO_TITLE)}
      </Text>

      <View style={styles.infoRow}>
        <Ionicons
          name={ICONS.CALENDAR}
          size={UI_CONFIG.INFO_ICON_SIZE}
          color={currentTheme.colors.primary}
        />
        <Text
          style={[
            styles.infoText,
            { color: currentTheme.colors.textSecondary },
          ]}
        >
          {new Date(event.startDate).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.infoRow}>
        <Ionicons
          name={ICONS.TIME}
          size={UI_CONFIG.INFO_ICON_SIZE}
          color={currentTheme.colors.primary}
        />
        <Text
          style={[
            styles.infoText,
            { color: currentTheme.colors.textSecondary },
          ]}
        >
          {new Date(event.startDate).toLocaleTimeString()}
        </Text>
      </View>

      <View style={styles.infoRow}>
        <Ionicons
          name={ICONS.FLAG}
          size={UI_CONFIG.INFO_ICON_SIZE}
          color={currentTheme.colors.primary}
        />
        <Text
          style={[
            styles.infoText,
            { color: currentTheme.colors.textSecondary },
          ]}
        >
          {STATUS_LABELS[event.status]}
        </Text>
      </View>
    </View>
  );
};
