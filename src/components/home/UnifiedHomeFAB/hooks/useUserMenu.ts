import { useAuth } from "@/contexts/AuthContext";
import { useLogout } from "@/hooks/useLogout";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";

export const useUserMenu = () => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigation = useNavigation();
  const { user } = useAuth();
  const { handleLogout } = useLogout();

  const handleUserButtonPress = () => {
    setShowUserMenu(!showUserMenu);
  };

  const handleCloseUserMenu = () => {
    setShowUserMenu(false);
  };

  const handleCreateAccount = () => {
    setShowUserMenu(false);
    // @ts-ignore
    navigation.navigate("RegisterScreen");
  };

  const handleSignIn = async () => {
    setShowUserMenu(false);
    if (user && (user.isGuest || !user.isGuest)) {
      // Si un utilisateur est connecté (invité ou normal), le déconnecter
      await handleLogout();
    } else {
      // @ts-ignore
      navigation.navigate("Login");
    }
  };

  const handleActionPress = async (route: string) => {
    setShowUserMenu(false);

    if (route === "Login") {
      // Gérer la déconnexion spécialement
      if (user) {
        await handleLogout();
      } else {
        // @ts-ignore
        navigation.navigate("Login");
      }
    } else {
      // @ts-ignore
      navigation.navigate(route);
    }
  };

  return {
    showUserMenu,
    handleUserButtonPress,
    handleCloseUserMenu,
    handleCreateAccount,
    handleSignIn,
    handleActionPress,
  };
};
