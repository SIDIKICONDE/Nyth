import React from "react";
import { View, TouchableOpacity } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";
import { useTheme } from "../../../../contexts/ThemeContext";
import { UIText } from "../../../../components/ui/Typography";

type AlignValue = "left" | "center" | "right";

interface AlignmentSelectorProps {
  value: AlignValue | undefined;
  onChange: (value: AlignValue) => void;
}

export function AlignmentSelector({
  value,
  onChange,
}: AlignmentSelectorProps): React.JSX.Element {
  const { currentTheme } = useTheme();
  const options: Array<{ key: AlignValue; label: string; icon: string }> = [
    { key: "left", label: "Gauche", icon: "format-align-left" },
    { key: "center", label: "Centre", icon: "format-align-center" },
    { key: "right", label: "Droite", icon: "format-align-right" },
  ];
  return (
    <View style={tw`mb-5`}>
      <UIText
        size="lg"
        weight="semibold"
        style={[tw`mb-3`, { color: currentTheme.colors.text }]}
      >
        Alignement
      </UIText>
      <View style={tw`flex-row justify-between`}>
        {options.map((align) => (
          <TouchableOpacity
            key={align.key}
            style={[
              tw`flex-1 items-center py-3 mx-1 rounded-xl`,
              {
                backgroundColor:
                  value === align.key
                    ? currentTheme.colors.accent
                    : currentTheme.colors.surface,
              },
            ]}
            onPress={() => onChange(align.key)}
          >
            <MaterialCommunityIcons
              name={align.icon}
              size={20}
              color={value === align.key ? "white" : currentTheme.colors.text}
            />
            <UIText
              size="xs"
              style={[
                tw`mt-1`,
                {
                  color:
                    value === align.key ? "white" : currentTheme.colors.text,
                },
              ]}
            >
              {align.label}
            </UIText>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
