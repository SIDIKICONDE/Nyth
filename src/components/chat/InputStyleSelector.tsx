import { UIText } from "@/components/ui/Typography";
import { InputStyleId, useInputStyle } from "@/contexts/InputStyleContext";
import { useTheme } from "@/contexts/ThemeContext";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import tw from "twrnc";

interface StyleOption {
  id: InputStyleId;
  label: string;
  icon: string;
  color: string;
}

const OPTIONS: StyleOption[] = [
  {
    id: "classic",
    label: "Classique",
    icon: "rectangle-outline",
    color: "#888888",
  },
  {
    id: "glass",
    label: "Verre",
    icon: "glass-mug-variant",
    color: "#00D4AA",
  },
  {
    id: "sheet",
    label: "Feuille",
    icon: "dock-bottom",
    color: "#4B5563",
  },
  {
    id: "neon",
    label: "Néon",
    icon: "lightning-bolt",
    color: "#00F5FF",
  },
];

const InputStyleSelector: React.FC = () => {
  const { selectedInputStyle, setSelectedInputStyle } = useInputStyle();
  const { currentTheme } = useTheme();

  return (
    <View style={tw`flex-row gap-2 flex-wrap`}>
      {OPTIONS.map((opt) => {
        const isSelected = selectedInputStyle === opt.id;
        return (
          <TouchableOpacity
            key={opt.id}
            onPress={() => setSelectedInputStyle(opt.id)}
            style={[
              tw`flex-row items-center px-3 py-2 rounded-full`,
              {
                backgroundColor: isSelected
                  ? currentTheme.colors.accent + "20"
                  : currentTheme.isDark
                  ? "rgba(255,255,255,0.05)"
                  : "rgba(0,0,0,0.05)",
              },
            ]}
          >
            <MaterialCommunityIcons
              name={opt.icon as any}
              size={16}
              color={isSelected ? currentTheme.colors.accent : opt.color}
            />
            <UIText
              size="sm"
              style={[
                tw`ml-2`,
                {
                  color: isSelected
                    ? currentTheme.colors.accent
                    : currentTheme.colors.text,
                },
              ]}
            >
              {opt.label}
            </UIText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default InputStyleSelector;
