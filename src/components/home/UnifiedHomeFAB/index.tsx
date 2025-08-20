import React, { useState, useCallback } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { useTheme } from "../../../contexts/ThemeContext";
import { useTranslation } from "react-i18next";
// import { FABMenu } from "./components/FABMenu";
// import { FABButton } from "./components/FABButton";
import { useMenuHandlers } from "./hooks/useMenuHandlers";
import { useFABDesign } from "./hooks/useFABDesign";
// import { useMenuAnimation } from "./hooks/useMenuAnimation";
import { UserIcon } from "./components/UserIcon";
// import { AIRealisticBrainIcon } from "./components/AIRealisticBrainIcon";
// import { AIFriendlyIcon } from "./components/AIFriendlyIcon";
import { useAuth } from "../../../contexts/AuthContext";
import { useUserProfile } from "../../../contexts/UserProfileContext";
import { FABAction, FABDesignType } from "./types";
import { Script } from "@/types";
import { UserMenu } from "./components/UserMenu";
import { useUserMenu } from "./hooks/useUserMenu";
import { WelcomeBubble } from "./components/WelcomeBubble";
import { useWelcomeBubble } from "./hooks/useWelcomeBubble";
import { getUserLabelLastName } from "@/utils/nameUtils";

// Import des designs
import { OrbitalDesign } from "./designs/OrbitalDesign";
import { StackedCardsDesign } from "./designs/StackedCardsDesign";
import { HamburgerMenu } from "./designs/HamburgerMenu";

export type { FABAction, FABDesignType };

interface UnifiedHomeFABProps {
  activeTab: string;
  scripts: Script[];
  onCreateScript: () => void;
  onRecordVideo: (scriptId: string) => void;
  onAIGenerate: () => void;
  onAIChat: () => void;
  onPlanning: () => void;
  onNotes?: () => void;
  onPreview?: () => void;
}

export const UnifiedHomeFAB: React.FC<UnifiedHomeFABProps> = ({
  activeTab,
  scripts,
  onCreateScript,
  onRecordVideo,
  onAIGenerate,
  onAIChat,
  onPlanning,
  onNotes,
  onPreview,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [showExpandedMenu, setShowExpandedMenu] = useState(false);

  // Hook pour gérer le design du FAB
  const { fabDesign, isLoading } = useFABDesign();

  const { handleUserButtonPress, handleActionPress } = useMenuHandlers(
    scripts,
    onCreateScript,
    onRecordVideo,
    onAIGenerate
  );

  // Bulle de bienvenue intelligente
  const {
    showWelcomeBubble,
    welcomeMessage,
    welcomeBubbleAnim,
    welcomeBubbleScale,
    hideWelcomeBubble,
    handleWelcomeChatPress,
    isGeneratingMessage,
  } = useWelcomeBubble();

  // Gestion du menu utilisateur (overlay contextuel)
  const {
    showUserMenu,
    handleUserButtonPress: toggleUserMenu,
    handleCloseUserMenu,
    handleCreateAccount,
    handleSignIn,
    handleActionPress: handleUserMenuActionPress,
  } = useUserMenu();

  // const { scaleAnim, rotateAnim } = useMenuAnimation(showExpandedMenu);

  const handleFABPress = useCallback(() => {
    setShowExpandedMenu(!showExpandedMenu);
  }, [showExpandedMenu]);

  const handleMenuClose = useCallback(() => {
    setShowExpandedMenu(false);
  }, []);

  // Fonction pour obtenir le label de l'utilisateur
  const getUserLabel = () => {
    if (!user) return t("fab.user.guest", "Invité");
    if (user.isGuest) return t("fab.user.guest", "Invité");
    const tt = (key: string, def?: string) =>
      def !== undefined
        ? (t as any)(key, { defaultValue: def })
        : (t as any)(key);
    return getUserLabelLastName(profile, user, tt);
  };

  // Actions communes pour tous les designs
  const fabActions: FABAction[] = [
    {
      id: "user",
      label: getUserLabel(),
      iconComponent: <UserIcon size={41} />,
      color: "#6B7280",
      onPress: toggleUserMenu,
    },
    // Icône paramètres uniquement pour les utilisateurs invités
    ...(!user || user.isGuest
      ? [
          {
            id: "settings",
            label: "Paramètres",
            icon: "cog-outline",
            color: "#6366F1",
            onPress: () => handleActionPress("Settings"),
          },
        ]
      : []),

    {
      id: "preview",
      label: "Prévisualisation",
      icon: "eye-outline",
      color: "#8B5CF6",
      onPress: onPreview || (() => {}),
    },

    {
      id: "planning",
      label: "Planning",
      icon: "calendar-outline",
      color: "#3B82F6",
      onPress: onPlanning,
    },

    // Node Editor supprimé

    {
      id: "create",
      label: "Créer",
      icon: "plus-circle-outline",
      color: "#10B981",
      onPress: onCreateScript,
    },
    {
      id: "ai-generate",
      label: "Générer IA",
      iconComponent: (
        <View
          style={{
            width: 41,
            height: 41,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* <AIRealisticBrainIcon size={41} /> */}
        </View>
      ),
      color: "#F59E0B",
      onPress: onAIGenerate,
    },
    {
      id: "ai-chat",
      label: "Chat IA",
      iconComponent: (
        <View
          style={{
            width: 41,
            height: 41,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* <AIFriendlyIcon
            size={41}
            primaryColor={currentTheme.colors.primary}
            secondaryColor={currentTheme.colors.primary}
            animated={true}
          /> */}
        </View>
      ),
      color: currentTheme.colors.primary,
      onPress: onAIChat,
    },
  ];

  // Fonction pour rendre le design approprié
  const renderFABDesign = () => {
    if (isLoading) {
      return null; // ou un spinner de chargement
    }

    switch (fabDesign) {
      case "orbital":
        return <OrbitalDesign actions={fabActions} />;
      case "stacked":
        return <StackedCardsDesign actions={fabActions} />;
      case "hamburger":
        return <HamburgerMenu actions={fabActions} />;
      default:
        return <OrbitalDesign actions={fabActions} />;
    }
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.fabWrapper} pointerEvents="box-none">
        {renderFABDesign()}
      </View>

      {/* Menu utilisateur contextuel (overlay global) */}
      <UserMenu
        showUserMenu={showUserMenu}
        onClose={handleCloseUserMenu}
        onCreateAccount={handleCreateAccount}
        onSignIn={handleSignIn}
        onActionPress={handleUserMenuActionPress}
      />

      {/* Bulle de bienvenue (overlay) */}
      <WelcomeBubble
        showWelcomeBubble={showWelcomeBubble}
        welcomeMessage={welcomeMessage}
        welcomeBubbleAnim={welcomeBubbleAnim}
        welcomeBubbleScale={welcomeBubbleScale}
        onPress={handleWelcomeChatPress}
        onClose={hideWelcomeBubble}
        isGenerating={isGeneratingMessage}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  fabWrapper: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 1000,
  },
});
