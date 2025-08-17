import Ionicons from "react-native-vector-icons/Ionicons";
import React from "react";
import { StyleSheet, Switch, View } from "react-native";
import { UIText } from "../../../ui/Typography";
import { useTheme } from "../../../../contexts/ThemeContext";
import { SettingItemProps } from "../types";

export const SettingItem: React.FC<SettingItemProps> = ({
  title,
  description,
  value,
  onValueChange,
  icon,
}) => {
  const { currentTheme } = useTheme();

  return (
    <View
      style={[
        styles.settingItem,
        { borderBottomColor: currentTheme.colors.border },
      ]}
    >
      <View style={styles.settingLeft}>
        <View
          style={[
            styles.settingIcon,
            { backgroundColor: currentTheme.colors.primary + "20" },
          ]}
        >
          <Ionicons
            name={icon as any}
            size={20}
            color={currentTheme.colors.primary}
          />
        </View>
        <View style={styles.settingText}>
          <UIText
            size="base"
            weight="medium"
            style={[styles.settingTitle, { color: currentTheme.colors.text }]}
          >
            {title}
          </UIText>
          <UIText
            size="sm"
            style={[
              styles.settingDescription,
              { color: currentTheme.colors.textSecondary },
            ]}
          >
            {description}
          </UIText>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{
          false: currentTheme.colors.border,
          true: currentTheme.colors.primary + "40",
        }}
        thumbColor={
          value
            ? currentTheme.colors.primary
            : currentTheme.colors.textSecondary
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    // fontSize et fontWeight gérés par UIText
    marginBottom: 2,
  },
  settingDescription: {
    // fontSize géré par UIText
    lineHeight: 20,
  },
});
