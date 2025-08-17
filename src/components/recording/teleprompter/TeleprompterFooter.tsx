import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React from "react";
import { View, TouchableOpacity, PanResponderInstance } from "react-native";
import tw from "twrnc";

interface TeleprompterFooterProps {
  isResizing: boolean;
  resizeHandlers: PanResponderInstance["panHandlers"];
  currentTheme: { colors: { accent: string } };
  onSettings?: () => void;
  onEditText?: () => void;
  hideControls?: boolean;
  settingsIconColor?: string;
  editIconColor?: string;
}

export function TeleprompterFooter({
  isResizing,
  resizeHandlers,
  currentTheme,
  onSettings,
  onEditText,
  hideControls,
  settingsIconColor,
  editIconColor,
}: TeleprompterFooterProps) {
  return (
    <View
      style={[
        tw`absolute bottom-0 left-0 right-0 h-8 items-center justify-center`,
        { zIndex: 2 },
        {
          backgroundColor: isResizing
            ? `${currentTheme.colors.accent}30`
            : hideControls
            ? "transparent"
            : "rgba(255,255,255,0.05)",
          borderTopWidth: hideControls ? 0 : 1,
          borderTopColor: "rgba(255,255,255,0.1)",
          cursor: "ns-resize",
        },
      ]}
    >
      <View
        {...resizeHandlers}
        style={[tw`absolute bottom-0 right-0 h-14`, { left: 0 }]}
      />
      {/* Barre de redimensionnement masquée pour laisser l'icône centrée */}
      {!hideControls && !onSettings && (
        <View style={tw`w-16 h-1 rounded-full bg-white opacity-60 mt-2`} />
      )}

      {/* Icône de réglages à gauche */}
      {onSettings && (
        <TouchableOpacity
          style={[
            tw`absolute left-2 bottom-0 items-center justify-center`,
            { width: 44, height: 44, borderRadius: 22 },
          ]}
          onPress={onSettings}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          pressRetentionOffset={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Réglages du téléprompteur"
        >
          <MaterialCommunityIcons
            name="cog"
            size={22}
            color={
              settingsIconColor || currentTheme.colors.accent || "#ffffff80"
            }
          />
        </TouchableOpacity>
      )}

      {/* Icône d'édition du texte à droite */}
      {onEditText && (
        <TouchableOpacity
          style={[
            tw`absolute right-2 bottom-0 items-center justify-center`,
            { width: 44, height: 44, borderRadius: 22 },
          ]}
          onPress={onEditText}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          pressRetentionOffset={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Éditer le texte"
        >
          <MaterialCommunityIcons
            name="pencil"
            size={22}
            color={editIconColor || currentTheme.colors.accent || "#ffffff80"}
          />
        </TouchableOpacity>
      )}

      {/* Icône de redimensionnement à droite - masquée si hideControls */}
      {!hideControls && !onEditText && (
        <View style={tw`absolute right-2 bottom-2`}>
          <MaterialCommunityIcons
            name="resize-bottom-right"
            size={18}
            color={isResizing ? currentTheme.colors.accent : "#ffffff80"}
          />
        </View>
      )}
    </View>
  );
}
