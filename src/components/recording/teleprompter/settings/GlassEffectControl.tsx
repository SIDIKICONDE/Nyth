import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";
import { useTheme } from "../../../../contexts/ThemeContext";

interface GlassEffectControlProps {
  enabled: boolean | undefined;
  onToggle: (value: boolean) => void;
  blurAmount: number | undefined;
  onBlurChange: (value: number) => void;
}

export function GlassEffectControl({
  enabled,
  onToggle,
  blurAmount,
  onBlurChange,
}: GlassEffectControlProps): React.JSX.Element {
  const { currentTheme } = useTheme();
  const value = Math.max(0, Math.min(50, blurAmount ?? 25));
  const marks = [0, 10, 20, 30, 40, 50];
  return (
    <View style={tw`mb-5`}>
      <Text
        style={[
          tw`text-lg font-semibold mb-3`,
          { color: currentTheme.colors.text },
        ]}
      >
        Effet verre
      </Text>

      <TouchableOpacity
        style={[
          tw`flex-row items-center justify-between p-3 rounded-xl mb-3`,
          { backgroundColor: currentTheme.colors.surface },
        ]}
        onPress={() => onToggle(!enabled)}
      >
        <View style={tw`flex-row items-center`}>
          <MaterialCommunityIcons
            name="blur"
            size={20}
            color={currentTheme.colors.text}
          />
          <Text
            style={[tw`ml-3 font-medium`, { color: currentTheme.colors.text }]}
          >
            Activer
          </Text>
        </View>
        <View
          style={[
            tw`w-12 h-6 rounded-full p-1`,
            { backgroundColor: enabled ? currentTheme.colors.accent : "#ccc" },
          ]}
        >
          <View
            style={[
              tw`w-4 h-4 rounded-full bg-white`,
              { transform: [{ translateX: enabled ? 20 : 0 }] },
            ]}
          />
        </View>
      </TouchableOpacity>

      {enabled && (
        <View>
          <View style={tw`flex-row items-center justify-between mb-2`}>
            <Text
              style={[
                tw`text-sm`,
                { color: currentTheme.colors.textSecondary },
              ]}
            >
              Intensité du flou
            </Text>
            <Text
              style={[
                tw`text-sm font-medium`,
                { color: currentTheme.colors.accent },
              ]}
            >
              {value}
            </Text>
          </View>

          <View style={tw`flex-row items-center`}>
            <TouchableOpacity
              style={[
                tw`w-10 h-10 rounded-full items-center justify-center`,
                { backgroundColor: currentTheme.colors.surface },
              ]}
              onPress={() => onBlurChange(Math.max(0, value - 5))}
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
                      width: `${(value / 50) * 100}%`,
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
                {marks.map((mark) => (
                  <TouchableOpacity
                    key={mark}
                    onPress={() => onBlurChange(mark)}
                    style={tw`px-1`}
                  >
                    <Text
                      style={[
                        tw`text-xs`,
                        {
                          color:
                            Math.abs(value - mark) < 3
                              ? currentTheme.colors.accent
                              : currentTheme.colors.textSecondary,
                        },
                      ]}
                    >
                      {mark}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[
                tw`w-10 h-10 rounded-full items-center justify-center`,
                { backgroundColor: currentTheme.colors.surface },
              ]}
              onPress={() => onBlurChange(Math.min(50, value + 5))}
            >
              <MaterialCommunityIcons
                name="plus"
                size={20}
                color={currentTheme.colors.accent}
              />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
