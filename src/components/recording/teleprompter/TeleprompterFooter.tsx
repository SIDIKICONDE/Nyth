import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React from "react";
import { View, PanResponderInstance, Text } from "react-native";
import tw from "twrnc";
import { Menu, MenuTrigger, MenuOptions, MenuOption } from 'react-native-popup-menu';
import { useTranslation } from "@/hooks/useTranslation";
import { useTheme } from "@/contexts/ThemeContext";

interface TeleprompterFooterProps {
  isResizing: boolean;
  resizeHandlers: PanResponderInstance["panHandlers"];
  onSettings?: () => void;
  onEditText?: () => void;
  hideControls?: boolean;
}

export function TeleprompterFooter({
  isResizing: _isResizing,
  resizeHandlers,
  onSettings,
  onEditText,
  hideControls,
}: TeleprompterFooterProps) {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();
  
  return (
    <View
      style={[
        tw`absolute bottom-0 left-0 right-0 h-10 items-center justify-center`,
        { 
          zIndex: 101, // Au-dessus du conteneur parent (100)
          position: 'absolute',
        },
      ]}
      {...resizeHandlers}
    >
      {!hideControls && (
        <View style={tw`w-16 h-1 rounded-full bg-white opacity-50`} />
      )}
      
      {!hideControls && (onSettings || onEditText) && (
        <Menu>
          <MenuTrigger customStyles={{
            triggerWrapper: {
              position: 'absolute',
              left: 150,
              bottom: -20,
              marginBottom: 10,
             
              
            },
          }}>
            <View style={tw`bg-black/50 rounded-full p-2`}>
              <MaterialCommunityIcons
                name="plus"
                size={24}
                color="white"
              />
            </View>
          </MenuTrigger>
          <MenuOptions customStyles={{
            optionsContainer: {
              backgroundColor: currentTheme.colors.surface,
              borderRadius: 12,
              padding: 5,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            },
          }}>
            {onSettings && (
              <MenuOption onSelect={onSettings} customStyles={{
                optionWrapper: {
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 10,
                  paddingHorizontal: 15,
                },
              }}>
                <MaterialCommunityIcons name="cog" size={20} color={currentTheme.colors.text} />
                <Text style={{ color: currentTheme.colors.text, marginLeft: 10 }}>{t('teleprompter.settings', 'Réglages')}</Text>
              </MenuOption>
            )}
            {onEditText && (
               <MenuOption onSelect={onEditText} customStyles={{
                optionWrapper: {
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 0,
                  paddingHorizontal: 0,
                },
              }}>
                <MaterialCommunityIcons name="pencil" size={20} color={currentTheme.colors.text} />
                <Text style={{ color: currentTheme.colors.text, marginLeft: 10 }}>{t('teleprompter.edit_text', 'Éditer le texte')}</Text>
              </MenuOption>
            )}
          </MenuOptions>
        </Menu>
      )}
    </View>
  );
}
