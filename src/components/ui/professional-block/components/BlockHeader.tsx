import React from "react";
import { View, StyleProp, ViewStyle, TextStyle } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";
import { useTheme } from "../../../../contexts/ThemeContext";
import { UIText } from "../../Typography";
import { SizeConfig, ProfessionalBlockStatus } from "../types";

interface BlockHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  icon?: string;
  iconColor?: string;
  iconSize?: number;
  statusColor?: string;
  statusIndicator?: ProfessionalBlockStatus;
  headerAction?: React.ReactNode;
  collapsible?: boolean;
  isExpanded?: boolean;
  sizeConfig: SizeConfig;
  padding: number;
  headerStyle?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  subtitleStyle?: StyleProp<TextStyle>;
}

export const BlockHeader: React.FC<BlockHeaderProps> = ({
  title,
  subtitle,
  description,
  icon,
  iconColor,
  iconSize,
  statusColor,
  headerAction,
  collapsible,
  isExpanded,
  sizeConfig,
  padding,
  headerStyle,
  titleStyle,
  subtitleStyle,
}) => {
  const { currentTheme } = useTheme();

  return (
    <View
      style={[
        tw`flex-row items-center justify-between p-${padding}`,
        headerStyle,
      ]}
    >
      <View style={tw`flex-row items-center flex-1`}>
        {/* 🎭 Icône principale */}
        {icon && (
          <View style={tw`mr-${sizeConfig.spacing}`}>
            <MaterialCommunityIcons
              name={icon}
              size={iconSize || sizeConfig.iconSize}
              color={iconColor || currentTheme.colors.primary}
            />
          </View>
        )}

        {/* 📝 Contenu textuel */}
        <View style={tw`flex-1`}>
          <View style={tw`flex-row items-center`}>
            <UIText
              size={sizeConfig.titleSize}
              weight="semibold"
              color={currentTheme.colors.text}
              style={tw`flex-1`}
            >
              {title}
            </UIText>

            {/* 🎯 Indicateur de statut */}
            {statusColor && (
              <View
                style={[
                  tw`w-3 h-3 rounded-full ml-2`,
                  { backgroundColor: statusColor },
                ]}
              />
            )}
          </View>

          {subtitle && (
            <UIText
              size={sizeConfig.subtitleSize}
              color={currentTheme.colors.textSecondary}
              style={tw`mt-1`}
            >
              {subtitle}
            </UIText>
          )}

          {description && (
            <UIText
              size={sizeConfig.descriptionSize}
              color={currentTheme.colors.textMuted}
              style={tw`mt-1`}
            >
              {description}
            </UIText>
          )}
        </View>
      </View>

      {/* 🔧 Actions de l'en-tête */}
      <View style={tw`flex-row items-center ml-${sizeConfig.spacing}`}>
        {headerAction}
        {collapsible && (
          <MaterialCommunityIcons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color={currentTheme.colors.textSecondary}
            style={tw`ml-2`}
          />
        )}
      </View>
    </View>
  );
};
