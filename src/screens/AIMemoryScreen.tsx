import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React from "react";
import { SafeAreaView, StatusBar } from "react-native";
import tw from "twrnc";

import BackButton from "../components/common/BackButton";
import AIMemorySection from "../components/settings/AIMemorySection";
import { useTheme } from "../contexts/ThemeContext";
import { useTranslation } from "../hooks/useTranslation";
import { RootStackParamList } from "../types/navigation";

type AIMemoryScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const AIMemoryScreen: React.FC = () => {
  const navigation = useNavigation<AIMemoryScreenNavigationProp>();
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView
      style={[tw`flex-1`, { backgroundColor: currentTheme.colors.background }]}
    >
      <StatusBar
        barStyle={currentTheme.isDark ? "light-content" : "dark-content"}
        backgroundColor={currentTheme.colors.background}
      />

      {/* Header avec bouton retour */}
      <BackButton onPress={handleBack} />

      {/* Contenu principal */}
      <AIMemorySection />
    </SafeAreaView>
  );
};

export default AIMemoryScreen;
