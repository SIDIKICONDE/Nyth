import { useEffect } from "react";
import { getAuth } from "@react-native-firebase/auth";
import { useAuth } from "../contexts/AuthContext";

export function useSessionCheck() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || user.isGuest) return;

    // Vérifier la session toutes les 30 minutes
    const checkSession = async () => {
      try {
        const currentUser = getAuth().currentUser;
        if (currentUser) {
          // Renouveler le token pour maintenir la session active
          await currentUser.getIdToken(true);
        }
      } catch (error) {}
    };

    // Vérifier immédiatement
    checkSession();

    // Puis vérifier toutes les 30 minutes
    const interval = setInterval(checkSession, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);
}
