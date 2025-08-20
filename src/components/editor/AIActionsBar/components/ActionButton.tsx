import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React from "react";
import { ActivityIndicator, TouchableOpacity } from "react-native";
import tw from "twrnc";
import { Caption } from "../../../../components/ui/Typography";
import { ActionButtonProps } from "../types";

export const ActionButton: React.FC<ActionButtonProps> = ({
  action,
  isProcessing,
  isActive,
  onPress,
}) => {
  // Si c'est l'icône AI (iconComponent), afficher directement sans conteneur
  const isIconComponent = !!action.iconComponent;

  if (isIconComponent) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isProcessing}
        activeOpacity={0.8}
      >
        {action.iconComponent}
      </TouchableOpacity>
    );
  }

  // Pour les autres boutons, garder le style normal
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isProcessing}
      style={[
        tw`flex-1 mx-1 px-2 py-2 rounded-lg flex-row items-center justify-center`,
        {
          backgroundColor: isActive ? `${action.color}30` : `${action.color}15`,
          opacity: isProcessing && !isActive ? 0.5 : 1,
        },
      ]}
    >
      {isProcessing && isActive ? (
        <ActivityIndicator size="small" color={action.color} />
      ) : (
        <>
          <MaterialCommunityIcons
            name={action.icon ?? "robot"}
            size={18}
            color={action.color}
          />
          {action.showLabel !== false && (
            <Caption style={[tw`ml-1`, { color: action.color }]}>
              {action.label}
            </Caption>
          )}
        </>
      )}
    </TouchableOpacity>
  );
};
