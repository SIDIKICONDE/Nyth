import { useState, useEffect } from "react";
import { appLockService, AppLockConfig } from "../services/AppLockService";
import { getAuth, getIdTokenResult } from "@react-native-firebase/auth";
import { useNavigation } from "@react-navigation/native";

interface UseAppLockReturn {
  isLocked: boolean;
  lockConfig: AppLockConfig | null;
  isChecking: boolean;
  checkLockStatus: () => Promise<void>;
}

export const useAppLock = (): UseAppLockReturn => {
  const [isLocked, setIsLocked] = useState(false);
  const [lockConfig, setLockConfig] = useState<AppLockConfig | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    // Initialiser le service de verrouillage
    initializeAppLock();

    // S'abonner aux changements de verrouillage
    const unsubscribe = appLockService.onLockChange((config) => {
      handleLockChange(config);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const initializeAppLock = async () => {
    try {
      await appLockService.initialize();
      await checkLockStatus();
    } catch (error) {
      console.error("Erreur initialisation verrouillage:", error);
      setIsChecking(false);
    }
  };

  const checkLockStatus = async () => {
    setIsChecking(true);
    try {
      const config = await appLockService.checkLockStatus();
      handleLockChange(config);
    } catch (error) {
      console.error("Erreur vérification verrouillage:", error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleLockChange = (config: AppLockConfig | null) => {
    if (!config) {
      setIsLocked(false);
      setLockConfig(null);
      return;
    }

    const user = getAuth().currentUser;
    const userId = user?.uid;

    // Récupérer le rôle de l'utilisateur depuis ses custom claims
    user
      ?.getIdTokenResult()
      .then((tokenResult) => {
        const userRole = tokenResult.claims.role as string | undefined;

        // Vérifier si l'app est verrouillée pour cet utilisateur
        const locked = appLockService.isAppLocked(userId, userRole);

        setIsLocked(locked);
        setLockConfig(config);

        // Si l'app est verrouillée et l'utilisateur n'est pas autorisé
        if (locked && config.isLocked) {
          // Naviguer vers l'écran de verrouillage
          navigation.reset({
            index: 0,
            routes: [
              {
                name: "AppLock" as never,
                params: { lockConfig: config } as never,
              },
            ],
          });
        }
      })
      .catch((error) => {
        console.error("Erreur récupération rôle utilisateur:", error);
        // Par défaut, considérer l'app comme verrouillée si on ne peut pas vérifier
        setIsLocked(config.isLocked);
        setLockConfig(config);
      });
  };

  return {
    isLocked,
    lockConfig,
    isChecking,
    checkLockStatus,
  };
};
