import { UnifiedHomeFAB } from "@/components/home";
import { useAuth } from "@/contexts/AuthContext";
import { useScripts } from "@/contexts/ScriptsContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useNavigation } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import { SafeAreaView, ScrollView, Text, View } from "react-native";
import { TFunction } from "i18next";
import tw from "twrnc";
import {
  AIChatGuideSection,
  HelpDocumentationSection,
  HelpHeader,
  PlanningGuideSection,
  QuickHelpSection,
  SectionSelector,
  SettingsGuideSection,
  TutorialCard,
} from "./components";
import { getTutorials } from "./constants/helpData";
import { SectionType } from "./types";

import { createOptimizedLogger } from '../../utils/optimizedLogger';
const logger = createOptimizedLogger('HelpScreen');

export default function HelpScreen() {
  const navigation = useNavigation<any>();
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { scripts } = useScripts();
  const [activeSection, setActiveSection] = useState<SectionType>("tutorials");

  // Mémoriser les données pour éviter de les recréer à chaque rendu
  const tutorials = useMemo(
    () => getTutorials(t as TFunction, navigation, scripts),
    [t, navigation, scripts]
  );

  const renderContent = () => {
    switch (activeSection) {
      case "tutorials":
        return (
          <>
            <Text
              style={[
                tw`text-xl font-bold mb-4`,
                { color: currentTheme.colors.text },
              ]}
            >
              {t("help.tutorials.title", "🎓 Tutoriels interactifs")}
            </Text>
            {tutorials.map((tutorial, index) => (
              <TutorialCard
                key={tutorial.id}
                tutorial={tutorial}
                index={index}
              />
            ))}
          </>
        );

      case "documentation":
        return <HelpDocumentationSection />;

      case "quickhelp":
        return <QuickHelpSection />;

      case "settings":
        return <SettingsGuideSection />;

      case "planning":
        return <PlanningGuideSection />;

      case "aichat":
        return <AIChatGuideSection />;

      default:
        return null;
    }
  };

  return (
    <SafeAreaView
      style={[tw`flex-1`, { backgroundColor: currentTheme.colors.background }]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`pb-24`}
      >
        <HelpHeader />

        <SectionSelector
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />

        <View style={tw`px-4`}>{renderContent()}</View>
      </ScrollView>

      <UnifiedHomeFAB
        activeTab="scripts"
        scripts={scripts}
        onCreateScript={() => navigation.navigate("Editor", {})}
        onRecordVideo={(scriptId) => {
          // Vérifier que le script existe avant de naviguer
          const scriptExists = scripts.find((s) => s.id === scriptId);
          if (scriptExists) {
            navigation.navigate("Recording", { scriptId });
          } else {
            logger.debug(
              "🚫 Script introuvable depuis HelpScreen, navigation annulée:",
              scriptId
            );
          }
        }}
        onAIGenerate={() => navigation.navigate("AIGenerator")}
        onAIChat={() => navigation.navigate("AIChat")}
        onPlanning={() => navigation.navigate("Planning")}
      />
    </SafeAreaView>
  );
}
