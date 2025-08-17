import React from "react";
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import tw from "twrnc";
import { useTheme } from "../../../contexts/ThemeContext";
import { useTranslation } from "../../../hooks/useTranslation";
import { AIPrompt } from "../../../types/ai";
import {
  getLengthOptions,
  getPlatformOptions,
  getToneOptions,
} from "../constants/options";
import { AIAssistantState } from "../types";
import { OptionButton } from "./OptionButton";

interface GenerateTabProps {
  state: AIAssistantState;
  isDarkMode: boolean;
  onPromptChange: (prompt: string) => void;
  onToneChange: (tone: AIPrompt["tone"]) => void;
  onDurationChange: (duration: AIPrompt["duration"]) => void;
  onPlatformChange: (platform: AIPrompt["platform"]) => void;
  onAudienceChange: (audience: string) => void;
  onGenerate?: () => void;
}

export function GenerateTab({
  state,
  isDarkMode,
  onPromptChange,
  onToneChange,
  onDurationChange,
  onPlatformChange,
  onAudienceChange,
  onGenerate,
}: GenerateTabProps) {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();

  return (
    <View>
      <Text
        style={[
          tw`text-lg font-semibold mb-4`,
          { color: isDarkMode ? "#ffffff" : "#1e293b" },
        ]}
      >
        {t("ai.assistant.generate.title")}
      </Text>

      {/* Script description */}
      <View style={tw`mb-4`}>
        <Text
          style={[
            tw`text-sm font-medium mb-2`,
            { color: isDarkMode ? "#cccccc" : "#4b5563" },
          ]}
        >
          {t("ai.assistant.generate.describeScript")}
        </Text>
        <TextInput
          style={[
            tw`p-3 rounded-lg text-base`,
            {
              backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
              borderWidth: 1,
              borderColor: isDarkMode ? "#2a2a2a" : "#e2e8f0",
              color: isDarkMode ? "#ffffff" : "#000000",
              minHeight: 100,
              textAlignVertical: "top",
            },
          ]}
          placeholder={t("ai.assistant.generate.scriptPlaceholder")}
          placeholderTextColor={isDarkMode ? "#666666" : "#999999"}
          value={state.prompt}
          onChangeText={onPromptChange}
          multiline
        />
      </View>

      {/* Target audience */}
      <View style={tw`mb-4`}>
        <Text
          style={[
            tw`text-sm font-medium mb-2`,
            { color: isDarkMode ? "#cccccc" : "#4b5563" },
          ]}
        >
          {t("ai.assistant.generate.targetAudience")}
        </Text>
        <TextInput
          style={[
            tw`p-3 rounded-lg text-base`,
            {
              backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
              borderWidth: 1,
              borderColor: isDarkMode ? "#2a2a2a" : "#e2e8f0",
              color: isDarkMode ? "#ffffff" : "#000000",
            },
          ]}
          placeholder={t("ai.assistant.generate.audiencePlaceholder")}
          placeholderTextColor={isDarkMode ? "#666666" : "#999999"}
          value={state.audience}
          onChangeText={onAudienceChange}
        />
      </View>

      {/* Platform */}
      <View style={tw`mb-4`}>
        <Text
          style={[
            tw`text-sm font-medium mb-2`,
            { color: isDarkMode ? "#cccccc" : "#4b5563" },
          ]}
        >
          {t("ai.assistant.generate.targetPlatform")}
        </Text>
        <View style={tw`flex-row flex-wrap gap-2`}>
          {getPlatformOptions().map((option) => (
            <OptionButton
              key={option.key}
              option={option}
              isSelected={state.platform === option.key}
              onPress={() =>
                onPlatformChange(option.key as AIPrompt["platform"])
              }
              isDarkMode={isDarkMode}
            />
          ))}
        </View>
      </View>

      {/* Tone selection */}
      <View style={tw`mb-4`}>
        <Text
          style={[
            tw`text-sm font-medium mb-2`,
            { color: isDarkMode ? "#cccccc" : "#4b5563" },
          ]}
        >
          {t("ai.assistant.generate.chooseTone")}
        </Text>
        <View style={tw`flex-row flex-wrap gap-2`}>
          {getToneOptions(t).map((option) => (
            <OptionButton
              key={option.key}
              option={option}
              isSelected={state.tone === option.key}
              onPress={() => onToneChange(option.key as AIPrompt["tone"])}
              isDarkMode={isDarkMode}
            />
          ))}
        </View>
      </View>

      {/* Duration selection */}
      <View style={tw`mb-4`}>
        <Text
          style={[
            tw`text-sm font-medium mb-2`,
            { color: isDarkMode ? "#cccccc" : "#4b5563" },
          ]}
        >
          {t("ai.assistant.generate.scriptDuration")}
        </Text>
        <View style={tw`flex-row flex-wrap gap-2`}>
          {getLengthOptions(t).map((option) => (
            <OptionButton
              key={option.key}
              option={option}
              isSelected={state.duration === option.key}
              onPress={() =>
                onDurationChange(option.key as AIPrompt["duration"])
              }
              isDarkMode={isDarkMode}
            />
          ))}
        </View>
      </View>

      {/* Generate button */}
      <TouchableOpacity
        style={[
          tw`p-4 rounded-lg mt-6 flex-row justify-center items-center`,
          {
            backgroundColor:
              state.prompt.trim() && !state.isLoading
                ? currentTheme.colors.primary
                : isDarkMode
                ? "#1a1a1a"
                : "#e5e7eb",
            opacity: state.prompt.trim() && !state.isLoading ? 1 : 0.5,
          },
        ]}
        onPress={onGenerate}
        disabled={!state.prompt.trim() || state.isLoading}
      >
        {state.isLoading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text
            style={[
              tw`text-base font-semibold`,
              {
                color: state.prompt.trim()
                  ? "#ffffff"
                  : isDarkMode
                  ? "#666666"
                  : "#9ca3af",
              },
            ]}
          >
            {t("ai.generate")}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
