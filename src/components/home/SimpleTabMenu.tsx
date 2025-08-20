import React, { useState } from "react";
import { View } from "react-native";
import tw from "twrnc";
import { useTheme } from "../../contexts/ThemeContext";
import { useCentralizedFont } from "../../hooks/useCentralizedFont";
import { TabItem, TabMenu } from "../ui";
import { HeadingText, UIText } from "../ui/Typography";

interface SimpleTabMenuProps {
  variant?: "default" | "pills" | "underline" | "segment";
  showBadges?: boolean;
}

const SimpleTabMenu: React.FC<SimpleTabMenuProps> = ({
  variant = "pills",
  showBadges = false,
}) => {
  const { currentTheme } = useTheme();
  const { ui, heading } = useCentralizedFont();
  const [activeTab, setActiveTab] = useState(0);

  const tabs: TabItem[] = [
    {
      id: "all",
      label: "Tous",
      icon: "view-grid",
      badge: showBadges ? 24 : undefined,
    },
    {
      id: "favorites",
      label: "Favoris",
      icon: "heart",
      badge: showBadges ? 8 : undefined,
    },
    {
      id: "recent",
      label: "Récents",
      icon: "clock",
      badge: showBadges ? 5 : undefined,
    },
    {
      id: "archived",
      label: "Archivés",
      icon: "archive",
      disabled: true,
    },
  ];

  const content = [
    "Contenu de tous les éléments",
    "Contenu des favoris",
    "Contenu des éléments récents",
    "Contenu archivé",
  ];

  return (
    <View style={tw`p-4`}>
      <TabMenu
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        variant={variant}
        containerStyle={tw`mb-6`}
      />

      {/* Contenu de démonstration */}
      <View
        style={[
          tw`p-4 rounded-lg`,
          { backgroundColor: currentTheme.colors.surface },
        ]}
      >
        <HeadingText
          size="lg"
          weight="medium"
          style={[heading, { color: currentTheme.colors.text }]}
        >
          {tabs[activeTab]?.label}
        </HeadingText>
        <UIText
          size="base"
          weight="medium"
          style={[ui, tw`mt-2`, { color: currentTheme.colors.textSecondary }]}
        >
          {content[activeTab]}
        </UIText>
      </View>
    </View>
  );
};

export default SimpleTabMenu;
