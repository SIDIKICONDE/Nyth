import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import tw from "twrnc";
import { useTheme } from "../../contexts/ThemeContext";
import { useCentralizedFont } from "../../hooks/useCentralizedFont";
import { useTranslation } from "../../hooks/useTranslation";
import { AIPrompt } from "../../types/ai";
import { UIText } from "../ui/Typography";
import { TopicInputSection } from "./TopicInputSection";
import { TemplatesTab } from "./advanced-generator/components";
import { useAdvancedAIGenerator } from "./advanced-generator/hooks/useAdvancedAIGenerator";
import { GenerationParameters } from "./generation-parameters/GenerationParameters";

/**
 * Composant TabButton simple
 */
interface TabButtonProps {
  label: string;
  icon: string;
  isActive: boolean;
  onPress: () => void;
  currentTheme: any;
}

const TabButton: React.FC<TabButtonProps> = ({
  label,
  icon,
  isActive,
  onPress,
  currentTheme,
}) => {
  const { ui } = useCentralizedFont();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        tw`flex-1 py-2 px-3 rounded-md items-center justify-center flex-row`,
        isActive
          ? { backgroundColor: currentTheme.colors.primary }
          : tw`bg-transparent`,
      ]}
    >
      <MaterialCommunityIcons
        name={icon as any}
        size={16}
        color={isActive ? "white" : "#666"}
        style={tw`mr-1`}
      />
      <UIText
        size="sm"
        weight="medium"
        style={[ui, isActive ? { color: "white" } : { color: "#666" }]}
      >
        {label}
      </UIText>
    </TouchableOpacity>
  );
};

/**
 * Générateur IA avancé avec onglets et templates
 */
interface AdvancedAIGeneratorProps {
  topic: string;
  setTopic: (topic: string) => void;
  parameters: any;
  updateParameter: (key: string, value: any) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const AdvancedAIGenerator: React.FC<AdvancedAIGeneratorProps> = ({
  topic,
  setTopic,
  parameters,
  updateParameter,
  onGenerate,
  isGenerating,
  activeTab,
  setActiveTab,
}) => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();
  const navigation = useNavigation();
  const { ui } = useCentralizedFont();

  const {
    isLoading,
    prompt,
    setPrompt,
    templates,
    selectedTemplate,
    setSelectedTemplate,
  } = useAdvancedAIGenerator();

  // Fonctions de génération
  const handleGenerate = () => {
    onGenerate();
  };

  const handleGenerateFromTemplate = () => {
    onGenerate();
  };

  return (
    <View
      style={[tw`flex-1`, { backgroundColor: currentTheme.colors.background }]}
    >
      {/* En-tête des onglets */}
      <View
        style={[
          tw`flex-row p-1 rounded-lg mx-4 mt-2`,
          { backgroundColor: currentTheme.colors.surface },
        ]}
      >
        <TabButton
          label={t("ai.tabs.basic")}
          icon="text"
          isActive={activeTab === "basic"}
          onPress={() => setActiveTab("basic")}
          currentTheme={currentTheme}
        />
        <TabButton
          label={t("ai.tabs.advanced")}
          icon="tune"
          isActive={activeTab === "advanced"}
          onPress={() => setActiveTab("advanced")}
          currentTheme={currentTheme}
        />
        <TabButton
          label={t("ai.tabs.templates")}
          icon="shape-outline"
          isActive={activeTab === "templates"}
          onPress={() => setActiveTab("templates")}
          currentTheme={currentTheme}
        />
      </View>

      {/* Contenu selon l'onglet actif */}
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`pb-20`}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "basic" && (
          <View style={tw`px-4 py-3`}>
            <TopicInputSection
              topic={prompt.topic}
              onTopicChange={(topic) =>
                setPrompt((prev) => ({ ...prev, topic }))
              }
            />

            <GenerationParameters
              tone={prompt.tone}
              onToneChange={(tone) =>
                setPrompt((prev) => ({
                  ...prev,
                  tone: tone as AIPrompt["tone"],
                }))
              }
              platform={prompt.platform}
              onPlatformChange={(platform) =>
                setPrompt((prev) => ({
                  ...prev,
                  platform: platform as AIPrompt["platform"],
                }))
              }
              creativity={prompt.creativity}
              onCreativityChange={(creativity) =>
                setPrompt((prev) => ({ ...prev, creativity }))
              }
            />
          </View>
        )}

        {activeTab === "advanced" && (
          <View style={tw`px-4 py-3`}>
            <TopicInputSection
              topic={prompt.topic}
              onTopicChange={(topic) =>
                setPrompt((prev) => ({ ...prev, topic }))
              }
            />

            <GenerationParameters
              tone={prompt.tone}
              onToneChange={(tone) =>
                setPrompt((prev) => ({
                  ...prev,
                  tone: tone as AIPrompt["tone"],
                }))
              }
              platform={prompt.platform}
              onPlatformChange={(platform) =>
                setPrompt((prev) => ({
                  ...prev,
                  platform: platform as AIPrompt["platform"],
                }))
              }
              creativity={prompt.creativity}
              onCreativityChange={(creativity) =>
                setPrompt((prev) => ({ ...prev, creativity }))
              }
              showAdvanced={true}
              narrativeStructure={prompt.narrativeStructure}
              onNarrativeStructureChange={(narrativeStructure) =>
                setPrompt((prev) => ({
                  ...prev,
                  narrativeStructure:
                    narrativeStructure as AIPrompt["narrativeStructure"],
                }))
              }
              emotionalTone={prompt.emotionalTone}
              onEmotionalToneChange={(emotionalTone) =>
                setPrompt((prev) => ({
                  ...prev,
                  emotionalTone: emotionalTone as AIPrompt["emotionalTone"],
                }))
              }
              showContentLengthControls={true}
              wordCount={prompt.wordCount}
              onWordCountChange={(wordCount) =>
                setPrompt((prev) => ({ ...prev, wordCount }))
              }
              characterCount={prompt.characterCount}
              onCharacterCountChange={(characterCount) =>
                setPrompt((prev) => ({ ...prev, characterCount }))
              }
              paragraphCount={prompt.paragraphCount}
              onParagraphCountChange={(paragraphCount) =>
                setPrompt((prev) => ({ ...prev, paragraphCount }))
              }
            />
          </View>
        )}

        {activeTab === "templates" && (
          <TemplatesTab
            templates={templates}
            selectedTemplate={selectedTemplate}
            onTemplateSelect={setSelectedTemplate}
            topic={prompt.topic}
            onTopicChange={(topic) => setPrompt((prev) => ({ ...prev, topic }))}
          />
        )}
      </ScrollView>

      {/* Bouton Générer */}
      <View
        style={[
          tw`absolute bottom-0 left-0 right-0 p-4 rounded-t-xl`,
          {
            backgroundColor: currentTheme.colors.surface,
            borderTopWidth: 1,
            borderTopColor: currentTheme.colors.border,
          },
          styles.generateButtonContainer,
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            if (activeTab === "templates" && selectedTemplate) {
              handleGenerateFromTemplate();
            } else {
              handleGenerate();
            }
          }}
          disabled={isLoading}
          style={[
            tw`py-3 rounded-lg items-center justify-center flex-row`,
            { backgroundColor: currentTheme.colors.primary },
          ]}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <MaterialCommunityIcons
                name="robot"
                size={20}
                color="white"
                style={tw`mr-2`}
              />
              <UIText
                size="base"
                weight="medium"
                style={[ui, { color: "white" }]}
              >
                {t("ai.generate")}
              </UIText>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  generateButtonContainer: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
});
