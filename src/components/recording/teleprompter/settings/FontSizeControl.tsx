import React from "react";
import { View, TouchableOpacity } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";
import { useTheme } from "../../../../contexts/ThemeContext";
import { UIText } from "../../../../components/ui/Typography";

interface FontSizeControlProps {
  value: number;
  onChange: (size: number) => void;
}

export function FontSizeControl({
  value,
  onChange,
}: FontSizeControlProps): React.JSX.Element {
  const { currentTheme } = useTheme();
  const clampedValue = Math.max(12, Math.min(48, value || 24));
  const percentage = ((clampedValue - 12) / 36) * 100;
  return (
    <View style={tw`mb-5`}>
      <View style={tw`flex-row items-center justify-between mb-3`}>
        <UIText
          size="lg"
          weight="semibold"
          style={{ color: currentTheme.colors.text }}
        >
          Taille du texte
        </UIText>
        <UIText size="lg" style={{ color: currentTheme.colors.accent }}>
          {clampedValue}px
        </UIText>
      </View>

      <View style={tw`flex-row items-center justify-center mb-2`}>
        <TouchableOpacity
          style={[
            tw`w-12 h-12 rounded-full items-center justify-center`,
            { backgroundColor: currentTheme.colors.surface },
          ]}
          onPress={() => onChange(Math.max(12, clampedValue - 2))}
        >
          <MaterialCommunityIcons
            name="format-font-size-decrease"
            size={24}
            color={currentTheme.colors.accent}
          />
        </TouchableOpacity>

        <View style={tw`flex-1 mx-4`}>
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
                  width: `${percentage}%`,
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
            {[12, 18, 24, 30, 36, 42, 48].map((size) => (
              <TouchableOpacity
                key={size}
                onPress={() => onChange(size)}
                style={tw`px-1`}
              >
                <UIText
                  size="xs"
                  style={[
                    {
                      color:
                        Math.abs(clampedValue - size) < 2
                          ? currentTheme.colors.accent
                          : currentTheme.colors.textSecondary,
                      fontSize: size === 24 ? 14 : 12,
                      fontWeight: size === 24 ? "600" : "400",
                    },
                  ]}
                >
                  {size}
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
          onPress={() => onChange(Math.min(48, clampedValue + 2))}
        >
          <MaterialCommunityIcons
            name="format-font-size-increase"
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
          onPress={() => onChange(Math.max(12, clampedValue - 1))}
        >
          <UIText style={{ color: currentTheme.colors.text }}>-1</UIText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            tw`px-3 py-1 rounded-full mx-1`,
            { backgroundColor: currentTheme.colors.surface },
          ]}
          onPress={() => onChange(Math.min(48, clampedValue + 1))}
        >
          <UIText style={{ color: currentTheme.colors.text }}>+1</UIText>
        </TouchableOpacity>
      </View>
    </View>
  );
}
