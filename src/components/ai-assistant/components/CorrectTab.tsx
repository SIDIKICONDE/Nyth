import React from "react";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import tw from "twrnc";
import { useTranslation } from "../../../hooks/useTranslation";

interface CorrectTabProps {
  isDarkMode: boolean;
  currentText?: string;
  onCorrectGrammar: () => void;
  onImproveStyle: () => void;
  onShortenText: () => void;
  isLoading: boolean;
}

export function CorrectTab({
  isDarkMode,
  currentText,
  onCorrectGrammar,
  onImproveStyle,
  onShortenText,
  isLoading,
}: CorrectTabProps) {
  const { t } = useTranslation();

  return (
    <View>
      <Text
        style={[
          tw`text-lg font-semibold mb-4`,
          { color: isDarkMode ? "#ffffff" : "#1e293b" },
        ]}
      >
        {t("ai.assistant.correct.title")}
      </Text>

      {/* Current text */}
      {currentText && (
        <View style={tw`mb-4`}>
          <Text
            style={[
              tw`text-sm font-medium mb-2`,
              { color: isDarkMode ? "#cccccc" : "#4b5563" },
            ]}
          >
            {t("ai.assistant.correct.currentText")}
          </Text>
          <View
            style={[
              tw`p-3 rounded-lg`,
              {
                backgroundColor: isDarkMode ? "#1a1a1a" : "#f8fafc",
                borderWidth: 1,
                borderColor: isDarkMode ? "#2a2a2a" : "#e2e8f0",
                maxHeight: 150,
              },
            ]}
          >
            <Text
              style={[
                tw`text-sm`,
                { color: isDarkMode ? "#cccccc" : "#4b5563" },
              ]}
            >
              {currentText.substring(0, 200)}
              {currentText.length > 200 && "..."}
            </Text>
          </View>
        </View>
      )}

      {/* Correction actions */}
      <View style={tw`gap-3`}>
        <TouchableOpacity
          onPress={onCorrectGrammar}
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
            name="spellcheck"
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
              {t("ai.assistant.correct.correctGrammar")}
            </Text>
            <Text
              style={[
                tw`text-sm`,
                { color: isDarkMode ? "#cccccc" : "#6b7280" },
              ]}
            >
              {t("ai.assistant.correct.correctGrammarDesc")}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onImproveStyle}
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
            name="auto-fix-high"
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
              {t("ai.assistant.correct.improveStyle")}
            </Text>
            <Text
              style={[
                tw`text-sm`,
                { color: isDarkMode ? "#cccccc" : "#6b7280" },
              ]}
            >
              {t(
                "ai.assistant.correct.improveStyleDesc",
                "Rendre le texte plus fluide et engageant"
              )}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onShortenText}
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
            name="compress"
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
              {t("ai.assistant.correct.shortenText")}
            </Text>
            <Text
              style={[
                tw`text-sm`,
                { color: isDarkMode ? "#cccccc" : "#6b7280" },
              ]}
            >
              {t(
                "ai.assistant.correct.shortenTextDesc",
                "Réduire la longueur tout en gardant l'essentiel"
              )}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {!currentText && (
        <View
          style={[
            tw`p-4 rounded-lg mt-4`,
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
