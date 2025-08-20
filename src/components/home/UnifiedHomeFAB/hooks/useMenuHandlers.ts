import { useCustomAlert } from "@/components/ui/CustomAlert";
import { useAuth } from "@/contexts/AuthContext";
import { useLogout } from "@/hooks/useLogout";
import { useTranslation } from "@/hooks/useTranslation";
import { Script } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";

export const useMenuHandlers = (
  scripts: Script[],
  onCreateScript: () => void,
  onRecordVideo: (scriptId: string) => void,
  onAIGenerate: () => void
) => {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const { handleLogout } = useLogout();
  const { showAlert, AlertComponent } = useCustomAlert();
  const [showExpandedMenu, setShowExpandedMenu] = useState(false);

  const handleUserButtonPress = () => {
    setShowExpandedMenu(!showExpandedMenu);
  };

  // Fonction pour sauvegarder l'activité
  const saveUserActivity = async (activity: string) => {
    if (user && !user.isGuest) {
      const lastActivityKey = `@last_activity_${user.uid}`;
      await AsyncStorage.setItem(lastActivityKey, activity);
    }
  };

  const handleCreateAccount = () => {
    navigation.navigate("RegisterScreen" as never);
    setShowExpandedMenu(false);
    saveUserActivity("création de compte");
  };

  const handleSignIn = async () => {
    if (user && user.isGuest) {
      await handleLogout();
    } else if (user && !user.isGuest) {
      await handleLogout();
    } else {
      navigation.navigate("Login" as never);
      setShowExpandedMenu(false);
    }
  };

  const handleActionPress = async (route: string) => {
    setShowExpandedMenu(false);

    // Sauvegarder l'activité
    const activities: { [key: string]: string } = {
      Help: "consultation aide",
      Settings: "accès paramètres",
      Profile: "consultation profil",
      Login: "déconnexion",
    };

    if (activities[route]) {
      await saveUserActivity(activities[route]);
    }

    if (route === "Login") {
      if (user) {
        await handleLogout();
      } else {
        navigation.navigate("Login" as never);
      }
    } else {
      navigation.navigate(route as never);
    }
  };

  const handleRecordPress = () => {
    if (scripts.length > 0) {
      // Vérifier que le premier script existe vraiment
      const firstScript = scripts.find((s) => s.id && s.content);
      if (firstScript) {
        onRecordVideo(firstScript.id);
      } else {
        onCreateScript();
      }
    } else {
      showAlert({
        type: "warning",
        title: t("home.noScript.title"),
        message: t("home.noScript.message"),
        buttons: [
          {
            text: t("home.noScript.createScript"),
            onPress: onCreateScript,
          },
          {
            text: t("home.noScript.generateWithAI"),
            onPress: onAIGenerate,
          },
        ],
      });
    }
  };

  return {
    showExpandedMenu,
    setShowExpandedMenu,
    handleUserButtonPress,
    handleCreateAccount,
    handleSignIn,
    handleActionPress,
    handleRecordPress,

    AlertComponent,
  };
};
