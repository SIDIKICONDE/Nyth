// Fichier AISettingsScreen refactorisé et internationalisé
import { useNavigation } from "@react-navigation/native";
import * as React from "react";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Divider } from "react-native-paper";
import tw from "twrnc";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { AI_PROVIDERS } from "../config/aiConfig";
import { useTheme } from "../contexts/ThemeContext";
import { useAISettings } from "../hooks/useAISettings";
import { useDefaultKeyListener } from "../hooks/useDefaultKeyListener";
import { useTranslation } from "../hooks/useTranslation";
import {
  checkHasAnyApiKey,
  checkHasAnyApiKeyFromSettings,
} from "../utils/checkApiKeys";

import { createOptimizedLogger } from "../utils/optimizedLogger";
const logger = createOptimizedLogger("AISettingsScreen");

// Composants refactorisés
import ApiCard from "../components/ai/ApiCard";

import PrioritySection from "../components/ai/PrioritySection";
import SaveButton from "../components/ai/SaveButton";
import SettingsSection from "../components/ai/SettingsSection";
import { ApiSecurityStatus } from "../components/ai/api-security";
import { CustomHeader } from "../components/common";
import { BiometricSettings } from "../components/settings/BiometricSettings";

export default function AISettingsScreen() {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();

  // Utilisation du hook personnalisé pour toute la logique métier
  const {
    settings,
    updateSetting,
    isLoading,
    isSaving,
    priorityOrder,
    setPriorityOrder,
    saveSettings,
    handleServiceToggle,
    loadSettings,
  } = useAISettings();

  // Écouter les changements de clé par défaut et recharger les paramètres
  useDefaultKeyListener(() => {
    logger.debug(
      "🔄 Rechargement automatique des paramètres après configuration de la clé par défaut"
    );
    loadSettings();
  });

  // Fonction pour gérer la suppression instantanée des clés
  const handleApiKeyChange = async (
    settingKey: keyof typeof settings,
    value: string,
    storageKey?: string
  ) => {
    // Mettre à jour l'état local UNIQUEMENT
    // Ne pas supprimer les clés immédiatement - attendre la sauvegarde explicite
    updateSetting(settingKey, value);
    
    // Log pour debug
    logger.debug(`📝 Clé ${settingKey} modifiée dans l'état local`);
    
    // NOTE: La suppression des clés vides sera gérée lors de la sauvegarde
    // Cela évite de supprimer accidentellement des clés pendant la saisie
  };

  // Vérifier s'il y a des clés API au montage
  React.useEffect(() => {
    const checkKeys = async () => {
      const hasKeys = await checkHasAnyApiKey();
      logger.debug(
        "🔑 Vérification initiale des clés API - Section sécurité:",
        hasKeys ? "affichée" : "masquée"
      );
    };
    checkKeys();
  }, []);

  // Vérifier en temps réel quand les clés changent
  React.useEffect(() => {
    const hasKeys = checkHasAnyApiKeyFromSettings(
      settings as unknown as Record<string, string | undefined>
    );
    logger.debug(
      "🔑 Mise à jour temps réel - Section sécurité:",
      hasKeys ? "affichée" : "masquée"
    );
  }, [
    settings.apiKey,
    settings.geminiKey,
    settings.mistralKey,
    settings.cohereKey,
    // Nouveaux services premium
    settings.claudeKey,
    settings.perplexityKey,
    settings.togetherKey,
    settings.groqKey,
    settings.fireworksKey,
    (settings as any).azureopenaiKey,
    (settings as any).openrouterKey,
    (settings as any).deepinfraKey,
    (settings as any).xaiKey,
    (settings as any).deepseekKey,
  ]);

  const hasKeys = checkHasAnyApiKeyFromSettings(
    settings as unknown as Record<string, string | undefined>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[tw`flex-1`, { backgroundColor: currentTheme.colors.background }]}
    >
      <CustomHeader
        title={t("aiSettings.title")}
        showBackButton={true}
        onBackPress={() => {
          navigation.goBack();
        }}
        rightComponent={
          <SaveButton onPress={saveSettings} isSaving={isSaving} />
        }
      />

      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`pt-3 pb-8 px-3`}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Section APIs Gratuites */}
        <SettingsSection
          title={t("aiSettings.freeApis.title")}
          icon="api"
          delay={100}
        >
          <ApiCard
            title={t("aiSettings.freeApis.cohere.title")}
            description={t("aiSettings.freeApis.cohere.description")}
            apiName="cohere"
            isEnabled={settings.useCohere}
            setEnabled={(value) => {
              updateSetting("useCohere", value);
              handleServiceToggle(AI_PROVIDERS.COHERE, value);
            }}
            apiKey={settings.cohereKey}
            setApiKey={(value) => handleApiKeyChange("cohereKey", value)}
            placeholder={t("aiSettings.freeApis.cohere.placeholder")}
            color="#10b981"
            icon="lightning-bolt"
            isLoading={isLoading}
          />

          <ApiCard
            title={t("aiSettings.freeApis.gemini.title")}
            description={t("aiSettings.freeApis.gemini.description")}
            apiName="gemini"
            isEnabled={settings.useGemini}
            setEnabled={(value) => {
              updateSetting("useGemini", value);
              handleServiceToggle(AI_PROVIDERS.GEMINI, value);
            }}
            apiKey={settings.geminiKey}
            setApiKey={(value) => handleApiKeyChange("geminiKey", value)}
            placeholder={t("aiSettings.freeApis.gemini.placeholder")}
            color="#3b82f6"
            icon="google"
            isLoading={isLoading}
          />

          <ApiCard
            title={t("aiSettings.freeApis.mistral.title")}
            description={t("aiSettings.freeApis.mistral.description")}
            apiName="mistral"
            isEnabled={settings.useMistral}
            setEnabled={(value) => {
              updateSetting("useMistral", value);
              handleServiceToggle(AI_PROVIDERS.MISTRAL, value);
            }}
            apiKey={settings.mistralKey}
            setApiKey={(value) => handleApiKeyChange("mistralKey", value)}
            placeholder={t("aiSettings.freeApis.mistral.placeholder")}
            color="#ef4444"
            icon="weather-windy"
            isLoading={isLoading}
          />
        </SettingsSection>

        <Divider style={tw`my-3 bg-gray-200`} />

        {/* Section APIs Premium */}
        <SettingsSection
          title={t("aiSettings.premium.title")}
          icon="star"
          iconColor="#f59e0b"
          delay={300}
        >
          {/* Azure OpenAI */}
          <ApiCard
            title="Azure OpenAI"
            description={t(
              "aiSettings.premium.azureopenai.description",
              "OpenAI via Azure (compliance, réseaux privés)"
            )}
            apiName="azureopenai"
            isEnabled={settings.useAzureOpenAI}
            setEnabled={(value) => {
              updateSetting("useAzureOpenAI" as any, value as any);
              handleServiceToggle(AI_PROVIDERS.AZUREOPENAI, value);
            }}
            apiKey={settings.azureopenaiKey}
            setApiKey={(value) =>
              updateSetting("azureopenaiKey" as any, value as any)
            }
            placeholder={t(
              "aiSettings.premium.azureopenai.placeholder",
              "AZURE_OPENAI_API_KEY"
            )}
            color="#2563EB"
            icon="microsoft-azure"
            isLoading={isLoading}
          />

          {/* OpenRouter */}
          <ApiCard
            title="OpenRouter"
            description={t(
              "aiSettings.premium.openrouter.description",
              "Accès à de nombreux modèles via une seule API"
            )}
            apiName="openrouter"
            isEnabled={settings.useOpenRouter}
            setEnabled={(value) => {
              updateSetting("useOpenRouter" as any, value as any);
              handleServiceToggle(AI_PROVIDERS.OPENROUTER, value);
            }}
            apiKey={settings.openrouterKey}
            setApiKey={(value) =>
              updateSetting("openrouterKey" as any, value as any)
            }
            placeholder={t(
              "aiSettings.premium.openrouter.placeholder",
              "OPENROUTER_API_KEY"
            )}
            color="#0EA5E9"
            icon="router-wireless"
            isLoading={isLoading}
          />

          {/* DeepInfra */}
          <ApiCard
            title="DeepInfra"
            description={t(
              "aiSettings.premium.deepinfra.description",
              "Hébergement de modèles open-source à coût réduit"
            )}
            apiName="deepinfra"
            isEnabled={settings.useDeepInfra}
            setEnabled={(value) => {
              updateSetting("useDeepInfra" as any, value as any);
              handleServiceToggle(AI_PROVIDERS.DEEPINFRA, value);
            }}
            apiKey={settings.deepinfraKey}
            setApiKey={(value) =>
              updateSetting("deepinfraKey" as any, value as any)
            }
            placeholder={t(
              "aiSettings.premium.deepinfra.placeholder",
              "DEEPINFRA_API_KEY"
            )}
            color="#00A38C"
            icon="server"
            isLoading={isLoading}
          />

          {/* xAI (Grok) */}
          <ApiCard
            title="xAI (Grok)"
            description={t(
              "aiSettings.premium.xai.description",
              "Modèle Grok de xAI, performant en contexte temps réel"
            )}
            apiName="xai"
            isEnabled={settings.useXAI}
            setEnabled={(value) => {
              updateSetting("useXAI" as any, value as any);
              handleServiceToggle(AI_PROVIDERS.XAI, value);
            }}
            apiKey={settings.xaiKey}
            setApiKey={(value) => updateSetting("xaiKey" as any, value as any)}
            placeholder={t("aiSettings.premium.xai.placeholder", "XAI_API_KEY")}
            color="#111827"
            icon="twitter"
            isLoading={isLoading}
          />

          {/* DeepSeek */}
          <ApiCard
            title="DeepSeek"
            description={t(
              "aiSettings.premium.deepseek.description",
              "Modèles efficaces et économiques, bon raisonnement"
            )}
            apiName="deepseek"
            isEnabled={settings.useDeepSeek}
            setEnabled={(value) => {
              updateSetting("useDeepSeek" as any, value as any);
              handleServiceToggle(AI_PROVIDERS.DEEPSEEK, value);
            }}
            apiKey={settings.deepseekKey}
            setApiKey={(value) =>
              updateSetting("deepseekKey" as any, value as any)
            }
            placeholder={t(
              "aiSettings.premium.deepseek.placeholder",
              "DEEPSEEK_API_KEY"
            )}
            color="#06B6D4"
            icon="chip"
            isLoading={isLoading}
          />
          <ApiCard
            title="OpenAI"
            description={t("aiSettings.premium.openai.description")}
            apiName="openai"
            isEnabled={settings.useCustomAPI}
            setEnabled={(value) => {
              updateSetting("useCustomAPI", value);
              handleServiceToggle(AI_PROVIDERS.OPENAI, value);
            }}
            apiKey={settings.apiKey}
            setApiKey={(value) => handleApiKeyChange("apiKey", value)}
            placeholder={t("aiSettings.premium.openai.placeholder")}
            color="#f59e0b"
            icon="robot"
            isLoading={isLoading}
          />

          <ApiCard
            title="Claude (Anthropic)"
            description={t("aiSettings.premium.claude.description")}
            apiName="claude"
            isEnabled={settings.useClaude}
            setEnabled={(value) => {
              updateSetting("useClaude", value);
              handleServiceToggle(AI_PROVIDERS.CLAUDE, value);
            }}
            apiKey={settings.claudeKey}
            setApiKey={(value) => handleApiKeyChange("claudeKey", value)}
            placeholder={t("aiSettings.premium.claude.placeholder")}
            color="#8B5CF6"
            icon="brain"
            isLoading={isLoading}
          />

          <ApiCard
            title="Perplexity AI"
            description={t("aiSettings.premium.perplexity.description")}
            apiName="perplexity"
            isEnabled={settings.usePerplexity}
            setEnabled={(value) => {
              updateSetting("usePerplexity", value);
              handleServiceToggle(AI_PROVIDERS.PERPLEXITY, value);
            }}
            apiKey={settings.perplexityKey}
            setApiKey={(value) => handleApiKeyChange("perplexityKey", value)}
            placeholder={t("aiSettings.premium.perplexity.placeholder")}
            color="#10B981"
            icon="search-web"
            isLoading={isLoading}
          />

          <ApiCard
            title="Groq"
            description={t("aiSettings.premium.groq.description")}
            apiName="groq"
            isEnabled={settings.useGroq}
            setEnabled={(value) => {
              updateSetting("useGroq", value);
              handleServiceToggle(AI_PROVIDERS.GROQ, value);
            }}
            apiKey={settings.groqKey}
            setApiKey={(value) => handleApiKeyChange("groqKey", value)}
            placeholder={t("aiSettings.premium.groq.placeholder")}
            color="#F59E0B"
            icon="flash"
            isLoading={isLoading}
          />

          <ApiCard
            title="Together AI"
            description={t("aiSettings.premium.together.description")}
            apiName="together"
            isEnabled={settings.useTogether}
            setEnabled={(value) => {
              updateSetting("useTogether", value);
              handleServiceToggle(AI_PROVIDERS.TOGETHER, value);
            }}
            apiKey={settings.togetherKey}
            setApiKey={(value) => handleApiKeyChange("togetherKey", value)}
            placeholder={t("aiSettings.premium.together.placeholder")}
            color="#6366F1"
            icon="account-group"
            isLoading={isLoading}
          />

          <ApiCard
            title="Fireworks AI"
            description={t("aiSettings.premium.fireworks.description")}
            apiName="fireworks"
            isEnabled={settings.useFireworks}
            setEnabled={(value) => {
              updateSetting("useFireworks", value);
              handleServiceToggle(AI_PROVIDERS.FIREWORKS, value);
            }}
            apiKey={settings.fireworksKey}
            setApiKey={(value) => handleApiKeyChange("fireworksKey", value)}
            placeholder={t("aiSettings.premium.fireworks.placeholder")}
            color="#EC4899"
            icon="rocket"
            isLoading={isLoading}
          />
        </SettingsSection>

        {/* Section de priorité des API - Affichée uniquement s'il y a des clés ET des services activés */}
        {checkHasAnyApiKeyFromSettings(
          settings as unknown as Record<string, string | undefined>
        ) &&
          (settings.useCustomAPI ||
            settings.useGemini ||
            settings.useMistral ||
            settings.useCohere ||
            settings.useClaude ||
            settings.usePerplexity ||
            settings.useTogether ||
            settings.useGroq ||
            settings.useFireworks ||
            settings.useAzureOpenAI ||
            settings.useOpenRouter ||
            settings.useDeepInfra ||
            settings.useXAI ||
            settings.useDeepSeek) && (
            <PrioritySection
              priorityOrder={priorityOrder}
              setPriorityOrder={setPriorityOrder}
              useOpenAI={settings.useCustomAPI}
              useGemini={settings.useGemini}
              useMistral={settings.useMistral}
              useCohere={settings.useCohere}
              useClaude={settings.useClaude}
              usePerplexity={settings.usePerplexity}
              useTogether={settings.useTogether}
              useGroq={settings.useGroq}
              useFireworks={settings.useFireworks}
              useAzureOpenAI={settings.useAzureOpenAI}
              useOpenRouter={settings.useOpenRouter}
              useDeepInfra={settings.useDeepInfra}
              useXAI={settings.useXAI}
              useDeepSeek={settings.useDeepSeek}
            />
          )}

        <Divider style={tw`my-3 bg-gray-200`} />
        <SettingsSection
          title={t("security.title", "Sécurité")}
          icon="shield-check"
          iconColor="#10b981"
          delay={400}
        >
          {hasKeys && (
            <>
              <ApiSecurityStatus />
              <Divider style={tw`my-2`} />
            </>
          )}
          <BiometricSettings />
        </SettingsSection>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
