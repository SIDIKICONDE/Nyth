import React from "react";
import { View, TouchableOpacity } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";
import { useTheme } from "../../../../contexts/ThemeContext";
import { UIText } from "../../../../components/ui/Typography";

interface LineHeightControlProps {
  value: number | undefined;
  onChange: (value: number) => void;
}

export function LineHeightControl({
  value,
  onChange,
}: LineHeightControlProps): React.JSX.Element {
  const { currentTheme } = useTheme();
  const v = Math.max(1.0, Math.min(2.0, value ?? 1.4));
  const step = 0.1;
  const toFixed = (n: number) => Math.round(n * 10) / 10;

  return (
    <View style={tw`mb-5`}>
      <View style={tw`flex-row items-center justify-between mb-3`}>
        <UIText
          size="lg"
          weight="semibold"
          style={{ color: currentTheme.colors.text }}
        >
          Interligne
        </UIText>
        <UIText size="lg" style={{ color: currentTheme.colors.accent }}>
          {toFixed(v)}x
        </UIText>
      </View>

      <View style={tw`flex-row items-center justify-center mb-2`}>
        <TouchableOpacity
          style={[
            tw`w-12 h-12 rounded-full items-center justify-center`,
            { backgroundColor: currentTheme.colors.surface },
          ]}
          onPress={() => onChange(toFixed(Math.max(1.0, v - step)))}
        >
          <MaterialCommunityIcons
            name="minus-circle"
            size={24}
            color={currentTheme.colors.accent}
          />
        </TouchableOpacity>

        <View style={tw`flex-1 mx-4 flex-row justify-between`}>
          {[1.0, 1.2, 1.4, 1.6, 1.8, 2.0].map((mark) => (
            <TouchableOpacity
              key={mark}
              onPress={() => onChange(mark)}
              style={tw`px-1`}
            >
              <UIText
                size="xs"
                style={{
                  color:
                    Math.abs(v - mark) < 0.1
                      ? currentTheme.colors.accent
                      : currentTheme.colors.textSecondary,
                }}
              >
                {mark.toFixed(1)}x
              </UIText>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[
            tw`w-12 h-12 rounded-full items-center justify-center`,
            { backgroundColor: currentTheme.colors.surface },
          ]}
          onPress={() => onChange(toFixed(Math.min(2.0, v + step)))}
        >
          <MaterialCommunityIcons
            name="plus-circle"
            size={24}
            color={currentTheme.colors.accent}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
