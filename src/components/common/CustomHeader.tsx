import * as React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleProp,
  TextStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";

import tw from "twrnc";
import { useTheme } from "../../contexts/ThemeContext";

interface ActionButton {
  icon: string;
  onPress: () => void;
  backgroundColor?: string;
  iconComponent?: React.ReactNode;
  label?: string;
  isImportant?: boolean;
  isDestructive?: boolean;
}

interface CustomHeaderProps {
  title: string;
  subtitle?: string;
  customSubtitleStyle?: StyleProp<TextStyle>;
  actionButtons?: ActionButton[];
  rightComponent?: React.ReactNode;
  showBackButton?: boolean;
  onBackPress?: () => void;
  backButtonDisabled?: boolean;
  compact?: boolean;
  _isVideoEditor?: boolean;
}

export default function CustomHeader({
  title,
  subtitle,
  customSubtitleStyle,
  actionButtons = [],
  rightComponent,
  showBackButton = false,
  onBackPress,
  backButtonDisabled = false,
  compact = false,
  _isVideoEditor = false,
}: CustomHeaderProps) {
  const { currentTheme } = useTheme();

  // Utiliser les boutons fournis ou un tableau vide
  const finalActionButtons = actionButtons;

  // En mode compact, on ne met pas de SafeAreaView pour éviter l'espace en haut
  if (compact) {
    return (
      <View
        style={[
          tw`px-3 py-0.5`,
          {
            backgroundColor: currentTheme.colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: currentTheme.colors.border,
            shadowColor: currentTheme.colors.primary,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.08,
            shadowRadius: 2,
            elevation: 2,
          },
        ]}
      >
        <View style={tw`flex-row items-center justify-between`}>
          <View style={tw`flex-row items-center flex-1`}>
            {/* Côté gauche : BackButton + Titre et sous-titre */}
            {showBackButton && (
              <TouchableOpacity
                onPress={onBackPress}
                disabled={backButtonDisabled}
                style={[
                  tw`w-11 h-11 rounded-full items-center justify-center`,
                  {
                    backgroundColor: currentTheme.colors.surface,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 8,
                    elevation: 4,
                    opacity: backButtonDisabled ? 0.5 : 1,
                  },
                ]}
                activeOpacity={backButtonDisabled ? 1 : 0.8}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name="arrow-back"
                  size={16}
                  color={backButtonDisabled ? currentTheme.colors.textSecondary : currentTheme.colors.text}
                />
              </TouchableOpacity>
            )}

            <View style={tw`flex-1`}>
              <Text
                style={[
                  tw`text-sm font-bold`,
                  {
                    color: currentTheme.colors.text,
                    letterSpacing: -0.2,
                  },
                ]}
              >
                {title}
              </Text>

              {subtitle && (
                <Text
                  style={[
                    tw`text-[8px] mt-0`,
                    { color: currentTheme.colors.textSecondary },
                    customSubtitleStyle,
                  ]}
                >
                  {subtitle}
                </Text>
              )}
            </View>
          </View>

          {/* Côté droit : Boutons d'action */}
          <View style={tw`flex-row items-center`}>
            {finalActionButtons.map((button, index) => (
              <TouchableOpacity
                key={index}
                onPress={button.onPress}
                style={[
                  button.isImportant
                    ? tw`py-1.5 px-3 rounded-lg items-center justify-center`
                    : tw`w-11 h-11 rounded-full items-center justify-center`,
                  {
                    backgroundColor: button.isDestructive
                      ? currentTheme.colors.error
                      : button.backgroundColor ||
                        currentTheme.colors.background,
                    shadowColor: button.isDestructive
                      ? currentTheme.colors.error
                      : button.backgroundColor || currentTheme.colors.primary,
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: button.isImportant ? 0.25 : 0.1,
                    shadowRadius: button.isImportant ? 4 : 2,
                    elevation: button.isImportant ? 3 : 1,
                    borderWidth: button.isImportant ? 1 : 0,
                    borderColor: button.isDestructive
                      ? currentTheme.colors.error
                      : button.backgroundColor || "transparent",
                  },
                ]}
                activeOpacity={0.85}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {button.iconComponent ? (
                  button.iconComponent
                ) : (
                  <View style={tw`flex-row items-center`}>
                    <Text
                      style={[
                        tw`text-xs`,
                        {
                          color: button.isDestructive
                            ? "#fff"
                            : currentTheme.colors.text,
                        },
                      ]}
                    >
                      {button.icon}
                    </Text>
                    {button.label && (
                      <Text
                        style={[
                          tw`text-[8px] font-bold ml-1`,
                          {
                            color: button.isDestructive
                              ? "#fff"
                              : currentTheme.colors.text,
                          },
                        ]}
                      >
                        {button.label}
                      </Text>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            ))}
            {rightComponent}
          </View>
        </View>
      </View>
    );
  }

  // Mode normal avec SafeAreaView
  return (
    <View style={{ backgroundColor: currentTheme.colors.surface }}>
      <SafeAreaView
        edges={["top"]}
        style={{ backgroundColor: currentTheme.colors.surface }}
      >
        <View
          style={[
            tw`px-4 py-2`,
            {
              backgroundColor: currentTheme.colors.surface,
              borderBottomWidth: 1,
              borderBottomColor: currentTheme.colors.border,
              shadowColor: currentTheme.colors.primary,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.08,
              shadowRadius: 2,
              elevation: 2,
            },
          ]}
        >
          <View style={tw`flex-row items-center justify-between`}>
            <View style={tw`flex-row items-center flex-1`}>
              {/* Côté gauche : BackButton + Titre et sous-titre */}
              {showBackButton && (
                <TouchableOpacity
                  onPress={onBackPress}
                  disabled={backButtonDisabled}
                  style={[
                    tw`w-10 h-10 rounded-full items-center justify-center`,
                    {
                      backgroundColor: currentTheme.colors.surface,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.25,
                      shadowRadius: 8,
                      elevation: 4,
                      opacity: backButtonDisabled ? 0.5 : 1,
                    },
                  ]}
                  activeOpacity={backButtonDisabled ? 1 : 0.8}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name="arrow-back"
                    size={24}
                    color={backButtonDisabled ? currentTheme.colors.textSecondary : currentTheme.colors.text}
                  />
                </TouchableOpacity>
              )}

              <View style={tw`flex-1`}>
                <Text
                  style={[
                    tw`text-lg font-bold`,
                    {
                      color: currentTheme.colors.text,
                      letterSpacing: -0.2,
                    },
                  ]}
                >
                  {title}
                </Text>

                {subtitle && (
                  <Text
                    style={[
                      tw`text-xs mt-0.5`,
                      { color: currentTheme.colors.textSecondary },
                      customSubtitleStyle,
                    ]}
                  >
                    {subtitle}
                  </Text>
                )}
              </View>
            </View>

            {/* Côté droit : Boutons d'action */}
            <View style={tw`flex-row items-center`}>
              {finalActionButtons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={button.onPress}
                  style={[
                    button.isImportant
                      ? tw`py-1.5 px-2.5 rounded-lg items-center justify-center`
                      : tw`w-9 h-9 rounded-full items-center justify-center`,
                    {
                      backgroundColor: button.isDestructive
                        ? currentTheme.colors.error
                        : button.backgroundColor ||
                          currentTheme.colors.background,
                      shadowColor: button.isDestructive
                        ? currentTheme.colors.error
                        : button.backgroundColor || currentTheme.colors.primary,
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: button.isImportant ? 0.25 : 0.1,
                      shadowRadius: button.isImportant ? 4 : 2,
                      elevation: button.isImportant ? 3 : 1,
                      borderWidth: button.isImportant ? 1 : 0,
                      borderColor: button.isDestructive
                        ? currentTheme.colors.error
                        : button.backgroundColor || "transparent",
                    },
                  ]}
                  activeOpacity={0.85}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {button.iconComponent ? (
                    button.iconComponent
                  ) : (
                    <View style={tw`flex-row items-center`}>
                      <Text
                        style={[
                          tw`text-sm`,
                          {
                            color: button.isDestructive
                              ? "#fff"
                              : currentTheme.colors.text,
                          },
                        ]}
                      >
                        {button.icon}
                      </Text>
                      {button.label && (
                        <Text
                          style={[
                            tw`text-xs font-bold ml-1`,
                            {
                              color: button.isDestructive
                                ? "#fff"
                                : currentTheme.colors.text,
                            },
                          ]}
                        >
                          {button.label}
                        </Text>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              ))}
              {rightComponent}
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
