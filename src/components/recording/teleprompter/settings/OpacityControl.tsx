import React from "react";
import { View, TouchableOpacity } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";
import { useTheme } from "../../../../contexts/ThemeContext";
import { UIText } from "../../../../components/ui/Typography";

interface OpacityControlProps {
  value: number;
  onChange: (value: number) => void;
}

export function OpacityControl({
  value,
  onChange,
}: OpacityControlProps): React.JSX.Element {
  const { currentTheme } = useTheme();
  return (
    <View style={tw`mb-5`}>
      <UIText
        size="lg"
        weight="semibold"
        style={[tw`mb-3`, { color: currentTheme.colors.text }]}
      >
        Opacité du conteneur
      </UIText>
      <View style={tw`flex-row items-center justify-between mb-2`}>
        <UIText size="sm" style={{ color: currentTheme.colors.textSecondary }}>
          Transparence
        </UIText>
        <UIText
          size="sm"
          weight="medium"
          style={{ color: currentTheme.colors.accent }}
        >
          {value}%
        </UIText>
      </View>

      <View style={tw`flex-row items-center`}>
        <TouchableOpacity
          style={[
            tw`w-10 h-10 rounded-full items-center justify-center`,
            { backgroundColor: currentTheme.colors.surface },
          ]}
          onPress={() => onChange(Math.max(0, value - 10))}
        >
          <MaterialCommunityIcons
            name="minus"
            size={20}
            color={currentTheme.colors.accent}
          />
        </TouchableOpacity>

        <View style={tw`flex-1 mx-3`}>
          <View
            style={[
              tw`h-3 rounded-full overflow-hidden`,
              { backgroundColor: currentTheme.colors.surface },
            ]}
          >
            <View
              style={[
                tw`h-full rounded-full`,
                {
                  backgroundColor: currentTheme.colors.accent,
                  width: `${value}%`,
                },
              ]}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[
            tw`w-10 h-10 rounded-full items-center justify-center`,
            { backgroundColor: currentTheme.colors.surface },
          ]}
          onPress={() => onChange(Math.min(100, value + 10))}
        >
          <MaterialCommunityIcons
            name="plus"
            size={20}
            color={currentTheme.colors.accent}
          />
        </TouchableOpacity>
      </View>

      <View style={tw`flex-row justify-center mt-2`}>
        <TouchableOpacity
          style={[
            tw`px-3 py-1 rounded-full mx-1`,
            { backgroundColor: currentTheme.colors.surface },
          ]}
          onPress={() => onChange(Math.max(0, value - 1))}
        >
          <UIText style={{ color: currentTheme.colors.text }}>-1</UIText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            tw`px-3 py-1 rounded-full mx-1`,
            { backgroundColor: currentTheme.colors.surface },
          ]}
          onPress={() => onChange(Math.min(100, value + 1))}
        >
          <UIText style={{ color: currentTheme.colors.text }}>+1</UIText>
        </TouchableOpacity>
      </View>
    </View>
  );
}
