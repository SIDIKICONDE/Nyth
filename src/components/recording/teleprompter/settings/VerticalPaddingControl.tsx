import React from "react";
import { View, TouchableOpacity } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";
import { useTheme } from "../../../../contexts/ThemeContext";
import { UIText } from "../../../../components/ui/Typography";

interface VerticalPaddingControlProps {
  top: number | undefined;
  bottom: number | undefined;
  onChange: (next: { top: number; bottom: number }) => void;
}

export function VerticalPaddingControl({
  top,
  bottom,
  onChange,
}: VerticalPaddingControlProps): React.JSX.Element {
  const { currentTheme } = useTheme();
  const t = Math.max(0, Math.min(120, top ?? 40));
  const b = Math.max(0, Math.min(120, bottom ?? 40));
  const step = 8;

  return (
    <View style={tw`mb-5`}>
      <UIText
        size="lg"
        weight="semibold"
        style={[tw`mb-3`, { color: currentTheme.colors.text }]}
      >
        Marges verticales
      </UIText>

      {/* Top */}
      <View style={tw`flex-row items-center justify-between mb-2`}>
        <UIText style={{ color: currentTheme.colors.textSecondary }}>
          Haut
        </UIText>
        <UIText style={{ color: currentTheme.colors.accent }}>{t}px</UIText>
      </View>
      <View style={tw`flex-row items-center mb-3`}>
        <TouchableOpacity
          style={[
            tw`w-10 h-10 rounded-full items-center justify-center`,
            { backgroundColor: currentTheme.colors.surface },
          ]}
          onPress={() => onChange({ top: Math.max(0, t - step), bottom: b })}
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
                  width: `${(t / 120) * 100}%`,
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
          onPress={() => onChange({ top: Math.min(120, t + step), bottom: b })}
        >
          <MaterialCommunityIcons
            name="plus"
            size={20}
            color={currentTheme.colors.accent}
          />
        </TouchableOpacity>
      </View>

      {/* Bottom */}
      <View style={tw`flex-row items-center justify-between mb-2`}>
        <UIText style={{ color: currentTheme.colors.textSecondary }}>
          Bas
        </UIText>
        <UIText style={{ color: currentTheme.colors.accent }}>{b}px</UIText>
      </View>
      <View style={tw`flex-row items-center`}>
        <TouchableOpacity
          style={[
            tw`w-10 h-10 rounded-full items-center justify-center`,
            { backgroundColor: currentTheme.colors.surface },
          ]}
          onPress={() => onChange({ top: t, bottom: Math.max(0, b - step) })}
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
                  width: `${(b / 120) * 100}%`,
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
          onPress={() => onChange({ top: t, bottom: Math.min(120, b + step) })}
        >
          <MaterialCommunityIcons
            name="plus"
            size={20}
            color={currentTheme.colors.accent}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
