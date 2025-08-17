import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { RootStackParamList } from "../types";

type NavigationProp = StackNavigationProp<RootStackParamList>;

export const useLogout = () => {
  const { logout, user } = useAuth();

  // Toujours appeler useNavigation (règle des hooks)
  const navigation = useNavigation<NavigationProp>();

  const handleLogout = useCallback(async () => {
    try {
      // Marquer dans AsyncStorage qu'on vient de se déconnecter volontairement
      await AsyncStorage.setItem("@logout_initiated", "true");
      await logout();

      // Attendre un peu pour que l'état se mette à jour
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Naviguer vers l'écran de connexion après la déconnexion
      if (navigation && typeof navigation.navigate === "function") {
        navigation.navigate("Login");
      } else {}

      return true;
    } catch (error) {
      // En cas d'erreur, naviguer quand même vers Login si possible
      if (navigation && typeof navigation.navigate === "function") {
        navigation.navigate("Login");
      }
      return false;
    }
  }, [logout, navigation, user]);

  return { handleLogout };
};
