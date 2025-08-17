import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import tw from "twrnc";
import { useTranslation } from "../../../hooks/useTranslation";

interface ToneTabProps {
  isDarkMode: boolean;
  currentText?: string;
  onToneSuggestions: () => void;
  onAdaptToAudience: () => void;
  onOptimizeEngagement: () => void;
  isLoading: boolean;
}

export function ToneTab({
  isDarkMode,
  currentText,
  onToneSuggestions,
  onAdaptToAudience,
  onOptimizeEngagement,
  isLoading,
}: ToneTabProps) {
  const { t } = useTranslation();

  return (
    <View>
      <Text
        style={[
          tw`text-lg font-semibold mb-4`,
          { color: isDarkMode ? "#ffffff" : "#1e293b" },
        ]}
      >
        {t("ai.assistant.tone.title")}
      </Text>

      <View style={tw`gap-3`}>
        <TouchableOpacity
          onPress={onToneSuggestions}
          disabled={isLoading || !currentText}
          style={[
            tw`flex-row items-center p-4 rounded-lg`,
            {
              backgroundColor: isDarkMode ? "#2a2a2a" : "#f1f5f9",
              opacity: isLoading || !currentText ? 0.6 : 1,
            },
          ]}
        >
          <MaterialIcons
            name="music-note"
            size={24}
            color={isDarkMode ? "#ffffff" : "#1e293b"}
          />
          <View style={tw`ml-3 flex-1`}>
            <Text
              style={[
                tw`text-base font-semibold`,
                { color: isDarkMode ? "#ffffff" : "#1e293b" },
              ]}
            >
              {t("ai.assistant.tone.analyzeTone")}
            </Text>
            <Text
              style={[
                tw`text-sm`,
                { color: isDarkMode ? "#cccccc" : "#6b7280" },
              ]}
            >
              {t("ai.assistant.tone.analyzeToneDesc")}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onAdaptToAudience}
          disabled={isLoading || !currentText}
          style={[
            tw`flex-row items-center p-4 rounded-lg`,
            {
              backgroundColor: isDarkMode ? "#2a2a2a" : "#f1f5f9",
              opacity: isLoading || !currentText ? 0.6 : 1,
            },
          ]}
        >
          <MaterialIcons
            name="psychology"
            size={24}
            color={isDarkMode ? "#ffffff" : "#1e293b"}
          />
          <View style={tw`ml-3 flex-1`}>
            <Text
              style={[
                tw`text-base font-semibold`,
                { color: isDarkMode ? "#ffffff" : "#1e293b" },
              ]}
            >
              {t("ai.assistant.tone.adaptToAudience")}
            </Text>
            <Text
              style={[
                tw`text-sm`,
                { color: isDarkMode ? "#cccccc" : "#6b7280" },
              ]}
            >
              {t(
                "ai.assistant.tone.adaptToAudienceDesc",
                "Adapter le texte pour votre public cible"
              )}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onOptimizeEngagement}
          disabled={isLoading || !currentText}
          style={[
            tw`flex-row items-center p-4 rounded-lg`,
            {
              backgroundColor: isDarkMode ? "#2a2a2a" : "#f1f5f9",
              opacity: isLoading || !currentText ? 0.6 : 1,
            },
          ]}
        >
          <MaterialIcons
            name="trending-up"
            size={24}
            color={isDarkMode ? "#ffffff" : "#1e293b"}
          />
          <View style={tw`ml-3 flex-1`}>
            <Text
              style={[
                tw`text-base font-semibold`,
                { color: isDarkMode ? "#ffffff" : "#1e293b" },
              ]}
            >
              {t("ai.assistant.tone.optimizeEngagement")}
            </Text>
            <Text
              style={[
                tw`text-sm`,
                { color: isDarkMode ? "#cccccc" : "#6b7280" },
              ]}
            >
              {t(
                "ai.assistant.tone.optimizeEngagementDesc",
                "Maximiser l'impact et l'engagement"
              )}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {!currentText && (
        <View
          style={[
            tw`p-4 rounded-lg mt-6`,
            { backgroundColor: isDarkMode ? "#1a1a1a" : "#f8fafc" },
          ]}
        >
          <Text
            style={[
              tw`text-center text-sm`,
              { color: isDarkMode ? "#cccccc" : "#6b7280" },
            ]}
          >
            {t("ai.assistant.correct.writeFirstText")}
          </Text>
        </View>
      )}
    </View>
  );
}
