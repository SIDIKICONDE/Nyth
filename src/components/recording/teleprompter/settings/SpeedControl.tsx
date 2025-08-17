import React from "react";
import { View, TouchableOpacity } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";
import { useTheme } from "../../../../contexts/ThemeContext";
import { UIText } from "../../../../components/ui/Typography";

interface SpeedControlProps {
  value: number;
  onChange: (speed: number) => void;
}

export function SpeedControl({
  value,
  onChange,
}: SpeedControlProps): React.JSX.Element {
  const { currentTheme } = useTheme();
  return (
    <View style={tw`mb-5`}>
      <View style={tw`flex-row items-center justify-between mb-3`}>
        <UIText
          size="lg"
          weight="semibold"
          style={{ color: currentTheme.colors.text }}
        >
          Vitesse
        </UIText>
        <UIText size="lg" style={{ color: currentTheme.colors.accent }}>
          {Math.round(value)}%
        </UIText>
      </View>

      <View style={tw`flex-row items-center justify-center mb-2`}>
        <TouchableOpacity
          style={[
            tw`w-12 h-12 rounded-full items-center justify-center`,
            { backgroundColor: currentTheme.colors.surface },
          ]}
          onPress={() => onChange(Math.max(1, value - 10))}
        >
          <MaterialCommunityIcons
            name="minus-circle"
            size={24}
            color={currentTheme.colors.accent}
          />
        </TouchableOpacity>

        <View style={tw`flex-1 mx-4`}>
          <View style={tw`flex-row justify-between mb-1`}>
            <UIText
              size="xs"
              style={{ color: currentTheme.colors.textSecondary }}
            >
              1%
            </UIText>
            <UIText
              size="xs"
              style={{ color: currentTheme.colors.textSecondary }}
            >
              100%
            </UIText>
          </View>
          <View
            style={[
              tw`h-2 rounded-full overflow-hidden`,
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
          <View
            style={[
              tw`w-full flex-row justify-between mt-2`,
              { paddingHorizontal: 0 },
            ]}
          >
            {[10, 25, 50, 75, 100].map((mark) => (
              <TouchableOpacity
                key={mark}
                onPress={() => onChange(mark)}
                style={tw`px-1`}
              >
                <UIText
                  size="xs"
                  style={[
                    {
                      color:
                        Math.abs(value - mark) < 5
                          ? currentTheme.colors.accent
                          : currentTheme.colors.textSecondary,
                    },
                  ]}
                >
                  {mark}
                </UIText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[
            tw`w-12 h-12 rounded-full items-center justify-center`,
            { backgroundColor: currentTheme.colors.surface },
          ]}
          onPress={() => onChange(Math.min(100, value + 10))}
        >
          <MaterialCommunityIcons
            name="plus-circle"
            size={24}
            color={currentTheme.colors.accent}
          />
        </TouchableOpacity>
      </View>

      <View style={tw`flex-row justify-center`}>
        <TouchableOpacity
          style={[
            tw`px-3 py-1 rounded-full mx-1`,
            { backgroundColor: currentTheme.colors.surface },
          ]}
          onPress={() => onChange(Math.max(1, value - 1))}
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
