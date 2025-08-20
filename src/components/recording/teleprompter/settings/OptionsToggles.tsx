import React from "react";
import { View, TouchableOpacity } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";
import { useTheme } from "../../../../contexts/ThemeContext";
import { UIText } from "../../../../components/ui/Typography";

interface OptionsTogglesProps {
  isMirrored: boolean | undefined;
  onToggleMirror: (value: boolean) => void;
  textShadow: boolean | undefined;
  onToggleTextShadow: (value: boolean) => void;
  hideControls: boolean | undefined;
  onToggleHideControls: (value: boolean) => void;
  isMirroredVertical?: boolean | undefined;
  onToggleMirrorVertical?: (value: boolean) => void;
  guideEnabled?: boolean | undefined;
  onToggleGuide?: (value: boolean) => void;
}

export function OptionsToggles({
  isMirrored,
  onToggleMirror,
  textShadow,
  onToggleTextShadow,
  hideControls,
  onToggleHideControls,
  isMirroredVertical,
  onToggleMirrorVertical,
  guideEnabled,
  onToggleGuide,
}: OptionsTogglesProps): React.JSX.Element {
  const { currentTheme } = useTheme();
  return (
    <View style={tw`mb-5`}>
      <UIText
        size="lg"
        weight="semibold"
        style={[tw`mb-3`, { color: currentTheme.colors.text }]}
      >
        Options
      </UIText>

      <TouchableOpacity
        style={[
          tw`flex-row items-center justify-between px-3 py-2 rounded-lg mb-1`,
          { backgroundColor: currentTheme.colors.surface },
        ]}
        onPress={() => onToggleMirror(!isMirrored)}
      >
        <View style={tw`flex-row items-center`}>
          <MaterialCommunityIcons
            name="flip-horizontal"
            size={18}
            color={currentTheme.colors.text}
          />
          <UIText
            size="sm"
            weight="medium"
            style={[tw`ml-2`, { color: currentTheme.colors.text }]}
          >
            Mode miroir (horizontal)
          </UIText>
        </View>
        <View
          style={[
            tw`w-10 h-5 rounded-full p-0.5`,
            {
              backgroundColor: isMirrored ? currentTheme.colors.accent : "#ccc",
            },
          ]}
        >
          <View
            style={[
              tw`w-4 h-4 rounded-full bg-white shadow-sm`,
              { transform: [{ translateX: isMirrored ? 16 : 0 }] },
            ]}
          />
        </View>
      </TouchableOpacity>

      {onToggleMirrorVertical && (
        <TouchableOpacity
          style={[
            tw`flex-row items-center justify-between px-3 py-2 rounded-lg mb-1`,
            { backgroundColor: currentTheme.colors.surface },
          ]}
          onPress={() => onToggleMirrorVertical(!isMirroredVertical)}
        >
          <View style={tw`flex-row items-center`}>
            <MaterialCommunityIcons
              name="flip-vertical"
              size={18}
              color={currentTheme.colors.text}
            />
            <UIText
              size="sm"
              weight="medium"
              style={[tw`ml-2`, { color: currentTheme.colors.text }]}
            >
              Mode miroir (vertical)
            </UIText>
          </View>
          <View
            style={[
              tw`w-10 h-5 rounded-full p-0.5`,
              {
                backgroundColor: isMirroredVertical
                  ? currentTheme.colors.accent
                  : "#ccc",
              },
            ]}
          >
            <View
              style={[
                tw`w-4 h-4 rounded-full bg-white shadow-sm`,
                { transform: [{ translateX: isMirroredVertical ? 16 : 0 }] },
              ]}
            />
          </View>
        </TouchableOpacity>
      )}

      {onToggleGuide && (
        <TouchableOpacity
          style={[
            tw`flex-row items-center justify-between px-3 py-2 rounded-lg mb-1`,
            { backgroundColor: currentTheme.colors.surface },
          ]}
          onPress={() => onToggleGuide(!guideEnabled)}
        >
          <View style={tw`flex-row items-center`}>
            <MaterialCommunityIcons
              name="minus"
              size={18}
              color={currentTheme.colors.text}
            />
            <UIText
              size="sm"
              weight="medium"
              style={[tw`ml-2`, { color: currentTheme.colors.text }]}
            >
              Ligne guide
            </UIText>
          </View>
          <View
            style={[
              tw`w-10 h-5 rounded-full p-0.5`,
              {
                backgroundColor: guideEnabled
                  ? currentTheme.colors.accent
                  : "#ccc",
              },
            ]}
          >
            <View
              style={[
                tw`w-4 h-4 rounded-full bg-white shadow-sm`,
                { transform: [{ translateX: guideEnabled ? 16 : 0 }] },
              ]}
            />
          </View>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[
          tw`flex-row items-center justify-between px-3 py-2 rounded-lg`,
          { backgroundColor: currentTheme.colors.surface },
        ]}
        onPress={() => onToggleHideControls(!hideControls)}
      >
        <View style={tw`flex-row items-center`}>
          <MaterialCommunityIcons
            name="eye-off"
            size={18}
            color={currentTheme.colors.text}
          />
          <UIText
            size="sm"
            weight="medium"
            style={[tw`ml-2`, { color: currentTheme.colors.text }]}
          >
            Masquer contrôles
          </UIText>
        </View>
        <View
          style={[
            tw`w-10 h-5 rounded-full p-0.5`,
            {
              backgroundColor: hideControls
                ? currentTheme.colors.accent
                : "#ccc",
            },
          ]}
        >
          <View
            style={[
              tw`w-4 h-4 rounded-full bg-white shadow-sm`,
              { transform: [{ translateX: hideControls ? 16 : 0 }] },
            ]}
          />
        </View>
      </TouchableOpacity>
    </View>
  );
}
