import AIMemorySettingsSection from "@/components/settings/AIMemorySettingsSection";
import DisplaySection from "@/components/settings/DisplaySection";
import { FloatingMenuStyleSection } from "@/components/settings/FloatingMenuStyleSection";
import HomePageSection from "@/components/settings/HomePageSection";
import LanguageSection from "@/components/settings/LanguageSection";
import { PlanningSection } from "@/components/settings/PlanningSection";

import { SecuritySection } from "@/components/settings/SecuritySection";
import { SubscriptionSection } from "@/components/settings/SubscriptionSection";
import TasksManagementSection from "@/components/settings/TasksManagementSection";
import WelcomeBubbleSection from "@/components/settings/WelcomeBubbleSection";

import { ComponentsDemoSection } from "@/components/settings/ComponentsDemoSection";

import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React from "react";
import { View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import tw from "twrnc";

import FontSection from "@/components/settings/FontSection";
import { UIText } from "@/components/ui/Typography";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "@/hooks/useTranslation";
import { RecordingSettings } from "@/types";
import { VideoSettings } from "@/types/video";
import AICacheSection from "./AICacheSection";
import AppCacheSection from "./AppCacheSection";

interface SettingsSectionsProps {
  settings: RecordingSettings;
  onUpdateSetting: <K extends keyof RecordingSettings>(
    key: K,
    value: RecordingSettings[K]
  ) => void;
  onVideoSettingsChange: (newVideoSettings: VideoSettings) => void;
  scriptId?: string;
}

interface SectionGroupProps {
  title: string;
  icon: string;
  color: string;
  children: React.ReactNode;
  delay: number;
}

const SectionGroup: React.FC<SectionGroupProps> = ({
  title,
  icon,
  color,
  children,
  delay,
}) => {
  const { currentTheme } = useTheme();

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(600)}>
      <View
        style={[
          tw`rounded-2xl p-4 mb-6`,
          {
            backgroundColor: currentTheme.colors.surface,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
          },
        ]}
      >
        {/* En-tête du groupe */}
        <View style={tw`flex-row items-center mb-4`}>
          <View
            style={[
              tw`p-2 rounded-full mr-3`,
              { backgroundColor: color + "20" },
            ]}
          >
            <MaterialCommunityIcons
              name={icon as any}
              size={20}
              color={color}
            />
          </View>
          <UIText size="lg" weight="semibold" color={currentTheme.colors.text}>
            {title}
          </UIText>
        </View>

        {/* Contenu du groupe */}
        <View>{children}</View>
      </View>
    </Animated.View>
  );
};

export default function SettingsSections({
  settings,
  onUpdateSetting,
  onVideoSettingsChange,
  scriptId,
}: SettingsSectionsProps) {
  const { t } = useTranslation();

  return (
    <View style={tw`flex-1`}>
      {/* Groupe Abonnement & Compte */}
      <SectionGroup
        title={t("settings.groups.account", "Compte & Abonnement")}
        icon="account-star"
        color="#6366f1"
        delay={50}
      >
        <SubscriptionSection />
      </SectionGroup>

      {/* Groupe Interface & Affichage */}
      <SectionGroup
        title={t("settings.groups.interface", "Interface & Affichage")}
        icon="monitor"
        color="#10b981"
        delay={100}
      >
        <HomePageSection />
        <View style={tw`mt-4`}>
          <FontSection />
        </View>
        <View style={tw`mt-4`}>
          <DisplaySection
            settings={settings}
            onUpdateSetting={onUpdateSetting}
            scriptId={scriptId}
          />
        </View>
        <View style={tw`mt-4`}>
          <WelcomeBubbleSection />
        </View>
        <View style={tw`mt-4`}>
          <FloatingMenuStyleSection />
        </View>
      </SectionGroup>

      {/* Groupe Production & Enregistrement */}
      <SectionGroup
        title={t("settings.groups.production", "Production & Enregistrement")}
        icon="video"
        color="#f59e0b"
        delay={150}
      >
        <PlanningSection />
        <View style={tw`mt-4`}>
          <TasksManagementSection />
        </View>
        {/* Section d'enregistrement supprimée - migration caméra native */}
      </SectionGroup>

      {/* Groupe Intelligence Artificielle */}
      <SectionGroup
        title={t("settings.groups.ai", "Intelligence Artificielle")}
        icon="brain"
        color="#8b5cf6"
        delay={200}
      >
        <AIMemorySettingsSection />
        <View style={tw`mt-4`}>
          <AICacheSection />
        </View>
      </SectionGroup>

      {/* Groupe Système & Sécurité */}
      <SectionGroup
        title={t("settings.groups.system", "Système & Sécurité")}
        icon="shield-check"
        color="#ef4444"
        delay={250}
      >
        <SecuritySection />
        <View style={tw`mt-4`}>
          <AppCacheSection />
        </View>
      </SectionGroup>

      {/* Groupe Localisation */}
      <SectionGroup
        title={t("settings.groups.localization", "Langue & Région")}
        icon="translate"
        color="#06b6d4"
        delay={300}
      >
        <LanguageSection />
      </SectionGroup>

      {/* Groupe Développeur */}
      <SectionGroup
        title={t("settings.groups.developer", "Développeur")}
        icon="code-braces"
        color="#6b7280"
        delay={350}
      >
        <ComponentsDemoSection />
        {/* CameraImplementationToggle supprimé - migration caméra native */}
      </SectionGroup>
    </View>
  );
}
