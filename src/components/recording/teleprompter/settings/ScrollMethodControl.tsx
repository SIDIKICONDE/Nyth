import React from "react";
import { View, TouchableOpacity, TextInput } from "react-native";
import tw from "twrnc";
import { useTheme } from "../../../../contexts/ThemeContext";
import { UIText } from "../../../../components/ui/Typography";

type Method = "classic" | "wpm" | "duration" | "lines";

interface ScrollMethodControlProps {
  method: Method | undefined;
  wpm?: number | undefined;
  durationMinutes?: number | undefined;
  linesPerSecond?: number | undefined;
  onChange: (next: {
    method: Method;
    wpm?: number;
    durationMinutes?: number;
    linesPerSecond?: number;
  }) => void;
}

export function ScrollMethodControl({
  method,
  wpm,
  durationMinutes,
  linesPerSecond,
  onChange,
}: ScrollMethodControlProps): React.JSX.Element {
  const { currentTheme } = useTheme();
  const selected = method ?? "classic";

  const option = (key: Method, label: string) => (
    <TouchableOpacity
      key={key}
      style={[
        tw`flex-1 items-center py-3 mx-1 rounded-xl`,
        {
          backgroundColor:
            selected === key
              ? currentTheme.colors.accent
              : currentTheme.colors.surface,
        },
      ]}
      onPress={() =>
        onChange({ method: key, wpm, durationMinutes, linesPerSecond })
      }
    >
      <UIText
        size="xs"
        weight="medium"
        style={{ color: selected === key ? "white" : currentTheme.colors.text }}
      >
        {label}
      </UIText>
    </TouchableOpacity>
  );

  return (
    <View style={tw`mb-5`}>
      <UIText
        size="lg"
        weight="semibold"
        style={[tw`mb-3`, { color: currentTheme.colors.text }]}
      >
        Méthode de défilement
      </UIText>
      <View style={tw`flex-row`}>
        {[
          option("classic", "Classique"),
          option("wpm", "WPM"),
          option("duration", "Durée"),
          option("lines", "Lignes/s"),
        ]}
      </View>

      {selected === "wpm" && (
        <View style={tw`mt-3`}>
          <UIText
            size="sm"
            style={{ color: currentTheme.colors.textSecondary }}
          >
            Mots/minute
          </UIText>
          <TextInput
            keyboardType="numeric"
            value={String(wpm ?? 160)}
            onChangeText={(t) =>
              onChange({
                method: selected,
                wpm: Math.max(40, Math.min(400, Number(t) || 160)),
                durationMinutes,
                linesPerSecond,
              })
            }
            style={[
              tw`mt-1 p-2 rounded`,
              {
                backgroundColor: currentTheme.colors.surface,
                color: currentTheme.colors.text,
              },
            ]}
          />
        </View>
      )}

      {selected === "duration" && (
        <View style={tw`mt-3`}>
          <UIText
            size="sm"
            style={{ color: currentTheme.colors.textSecondary }}
          >
            Durée (minutes)
          </UIText>
          <TextInput
            keyboardType="numeric"
            value={String(durationMinutes ?? 3)}
            onChangeText={(t) =>
              onChange({
                method: selected,
                durationMinutes: Math.max(1, Math.min(120, Number(t) || 3)),
                wpm,
                linesPerSecond,
              })
            }
            style={[
              tw`mt-1 p-2 rounded`,
              {
                backgroundColor: currentTheme.colors.surface,
                color: currentTheme.colors.text,
              },
            ]}
          />
        </View>
      )}

      {selected === "lines" && (
        <View style={tw`mt-3`}>
          <UIText
            size="sm"
            style={{ color: currentTheme.colors.textSecondary }}
          >
            Lignes par seconde
          </UIText>
          <TextInput
            keyboardType="numeric"
            value={String(linesPerSecond ?? 1)}
            onChangeText={(t) =>
              onChange({
                method: selected,
                linesPerSecond: Math.max(0.2, Math.min(10, Number(t) || 1)),
                wpm,
                durationMinutes,
              })
            }
            style={[
              tw`mt-1 p-2 rounded`,
              {
                backgroundColor: currentTheme.colors.surface,
                color: currentTheme.colors.text,
              },
            ]}
          />
        </View>
      )}
    </View>
  );
}
