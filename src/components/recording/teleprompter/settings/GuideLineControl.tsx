import React from "react";
import { View, TouchableOpacity } from "react-native";
import tw from "twrnc";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useTheme } from "../../../../contexts/ThemeContext";
import { UIText } from "../../../../components/ui/Typography";

interface GuideLineControlProps {
  color: string | undefined;
  opacity: number | undefined;
  height: number | undefined;
  onChange: (next: {
    color?: string;
    opacity?: number;
    height?: number;
  }) => void;
}

export function GuideLineControl({
  color,
  opacity,
  height,
  onChange,
}: GuideLineControlProps): React.JSX.Element {
  const { currentTheme } = useTheme();

  const availableColors = [
    "#FFCC00",
    "#FF4444",
    "#22C55E",
    "#3B82F6",
    "#FFFFFF",
  ];
  const op = Math.max(0, Math.min(1, opacity ?? 0.35));
  const h = Math.max(1, Math.min(8, height ?? 2));

  return (
    <View style={tw`mb-5`}>
      <UIText
        size="lg"
        weight="semibold"
        style={[tw`mb-3`, { color: currentTheme.colors.text }]}
      >
        Ligne guide
      </UIText>

      <UIText
        size="sm"
        style={[tw`mb-2`, { color: currentTheme.colors.textSecondary }]}
      >
        Couleur
      </UIText>
      <View style={tw`flex-row justify-between mb-3`}>
        {availableColors.map((c) => (
          <TouchableOpacity
            key={c}
            style={[
              tw`w-10 h-10 rounded-full border-2`,
              {
                backgroundColor: c,
                borderColor:
                  color === c ? currentTheme.colors.accent : "transparent",
              },
            ]}
            onPress={() => onChange({ color: c })}
          />
        ))}
      </View>

      <View style={tw`flex-row items-center justify-between mb-2`}>
        <UIText size="sm" style={{ color: currentTheme.colors.textSecondary }}>
          Opacité
        </UIText>
        <UIText
          size="sm"
          weight="medium"
          style={{ color: currentTheme.colors.accent }}
        >
          {Math.round(op * 100)}%
        </UIText>
      </View>
      <View style={tw`flex-row items-center mb-3`}>
        <TouchableOpacity
          style={[
            tw`w-10 h-10 rounded-full items-center justify-center`,
            { backgroundColor: currentTheme.colors.surface },
          ]}
          onPress={() =>
            onChange({
              opacity: Math.max(0, Math.round((op - 0.05) * 100) / 100),
            })
          }
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
                  width: `${op * 100}%`,
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
          onPress={() =>
            onChange({
              opacity: Math.min(1, Math.round((op + 0.05) * 100) / 100),
            })
          }
        >
          <MaterialCommunityIcons
            name="plus"
            size={20}
            color={currentTheme.colors.accent}
          />
        </TouchableOpacity>
      </View>

      <View style={tw`flex-row items-center justify-between mb-2`}>
        <UIText size="sm" style={{ color: currentTheme.colors.textSecondary }}>
          Épaisseur
        </UIText>
        <UIText
          size="sm"
          weight="medium"
          style={{ color: currentTheme.colors.accent }}
        >
          {h}px
        </UIText>
      </View>
      <View style={tw`flex-row items-center`}>
        <TouchableOpacity
          style={[
            tw`w-10 h-10 rounded-full items-center justify-center`,
            { backgroundColor: currentTheme.colors.surface },
          ]}
          onPress={() => onChange({ height: Math.max(1, h - 1) })}
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
                  width: `${((h - 1) / 7) * 100}%`,
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
          onPress={() => onChange({ height: Math.min(8, h + 1) })}
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
