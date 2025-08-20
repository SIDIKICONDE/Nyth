import React from "react";
import { View, TouchableOpacity } from "react-native";
import tw from "twrnc";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useTheme } from "../../../../contexts/ThemeContext";
import { UIText } from "../../../../components/ui/Typography";

interface StartPositionSelectorProps {
  value: "top" | "center" | "bottom" | undefined;
  offset: number | undefined;
  onChange: (value: {
    position: "top" | "center" | "bottom";
    offset: number;
  }) => void;
}

export function StartPositionSelector({
  value,
  offset,
  onChange,
}: StartPositionSelectorProps): React.JSX.Element {
  const { currentTheme } = useTheme();
  const items: Array<{
    key: "top" | "center" | "bottom";
    label: string;
    icon: string;
  }> = [
    { key: "top", label: "Haut", icon: "arrow-collapse-up" },
    { key: "center", label: "Centre", icon: "arrow-collapse-vertical" },
    { key: "bottom", label: "Bas", icon: "arrow-collapse-down" },
  ];
  const off = Math.max(-400, Math.min(400, offset ?? 0));

  return (
    <View style={tw`mb-5`}>
      <UIText
        size="lg"
        weight="semibold"
        style={[tw`mb-3`, { color: currentTheme.colors.text }]}
      >
        Position de départ
      </UIText>
      <View style={tw`flex-row justify-between mb-3`}>
        {items.map((it) => (
          <TouchableOpacity
            key={it.key}
            style={[
              tw`flex-1 items-center py-3 mx-1 rounded-xl`,
              {
                backgroundColor:
                  value === it.key
                    ? currentTheme.colors.accent
                    : currentTheme.colors.surface,
              },
            ]}
            onPress={() => onChange({ position: it.key, offset: off })}
          >
            <MaterialCommunityIcons
              name={it.icon}
              size={20}
              color={value === it.key ? "white" : currentTheme.colors.text}
            />
            <UIText
              size="xs"
              style={[
                tw`mt-1`,
                {
                  color: value === it.key ? "white" : currentTheme.colors.text,
                },
              ]}
            >
              {it.label}
            </UIText>
          </TouchableOpacity>
        ))}
      </View>

      <View style={tw`flex-row items-center justify-between mb-2`}>
        <UIText style={{ color: currentTheme.colors.textSecondary }}>
          Décalage
        </UIText>
        <UIText style={{ color: currentTheme.colors.accent }}>{off}px</UIText>
      </View>
      <View style={tw`flex-row items-center`}>
        <TouchableOpacity
          style={[
            tw`w-10 h-10 rounded-full items-center justify-center`,
            { backgroundColor: currentTheme.colors.surface },
          ]}
          onPress={() =>
            onChange({
              position: value ?? "top",
              offset: Math.max(-400, off - 10),
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
                  width: `${((off + 400) / 800) * 100}%`,
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
              position: value ?? "top",
              offset: Math.min(400, off + 10),
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
    </View>
  );
}
