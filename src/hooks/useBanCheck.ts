import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { getAuth, FirebaseAuthTypes } from "@react-native-firebase/auth";
import { banService } from "../services/BanService";
import { useNavigation } from "@react-navigation/native";
import { signOut } from "firebase/auth";

interface BanStatus {
  isBanned: boolean;
  reason?: string;
  severity?: string;
  expiresAt?: Date;
  canAppeal?: boolean;
}

export const useBanCheck = () => {
  const [banStatus, setBanStatus] = useState<BanStatus>({
    isBanned: false,
  });
  const [checking, setChecking] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    // Initialiser le service de ban au démarrage
    initializeBanService();
  }, []);

  useEffect(() => {
    // Vérifier le ban à chaque changement d'authentification
    const unsubscribe = getAuth().onAuthStateChanged(
      async (user: FirebaseAuthTypes.User | null) => {
        if (user) {
          await checkBanStatus();
        }
      }
    );

    return unsubscribe;
  }, []);

  const initializeBanService = async () => {
    try {
      await banService.initialize();

      // Enregistrer le device si un utilisateur est connecté
      if (getAuth().currentUser) {
        await banService.registerUserDevice();
      }
    } catch (error) {
      console.error("Erreur lors de l'initialisation du BanService:", error);
    }
  };

  const checkBanStatus = async () => {
    setChecking(true);
    try {
      const isBanned = await banService.isDeviceBanned();

      if (isBanned) {
        // Récupérer les détails du ban
        const bannedDevices = await banService.getBannedDevices();
        const deviceId = banService.getCurrentDeviceId();
        const currentBan = bannedDevices.find(
          (ban) => ban.deviceId === deviceId
        );

        if (currentBan) {
          setBanStatus({
            isBanned: true,
            reason: currentBan.reason,
            severity: currentBan.severity,
            expiresAt: currentBan.expiresAt?.toDate(),
            canAppeal: currentBan.appealStatus !== "rejected",
          });

          // Afficher l'alerte de bannissement
          showBanAlert(currentBan);

          // Déconnecter l'utilisateur
          await handleBannedUser();
        }
      } else {
        setBanStatus({ isBanned: false });
      }
    } catch (error) {
      console.error("Erreur lors de la vérification du ban:", error);
    } finally {
      setChecking(false);
    }
  };

  const showBanAlert = (ban: any) => {
    let message = `Votre appareil a été banni.\n\nRaison: ${ban.reason}`;

    if (ban.severity === "temporary" && ban.expiresAt) {
      const expiresAt = ban.expiresAt.toDate();
      message += `\n\nCe ban expirera le: ${expiresAt.toLocaleDateString()}`;
    } else if (ban.severity === "permanent") {
      message += `\n\nCe ban est permanent.`;
    }

    if (ban.notes) {
      message += `\n\nDétails: ${ban.notes}`;
    }

    const buttons: any[] = [
      {
        text: "OK",
        onPress: () => handleBannedUser(),
      },
    ];

    if (ban.appealStatus !== "rejected" && ban.severity !== "warning") {
      buttons.unshift({
        text: "Faire appel",
        onPress: () => showAppealDialog(),
      });
    }

    Alert.alert("Accès Refusé", message, buttons, { cancelable: false });
  };

  const showAppealDialog = () => {
    Alert.prompt(
      "Faire appel",
      "Expliquez pourquoi vous pensez que ce ban devrait être levé:",
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Envoyer",
          onPress: (message?: string) => {
            const handleAppeal = async () => {
              if (message && message.trim()) {
                const success = await banService.appealBan(message);
                if (success) {
                  Alert.alert(
                    "Appel envoyé",
                    "Votre appel a été soumis et sera examiné par un administrateur."
                  );
                } else {
                  Alert.alert(
                    "Erreur",
                    "Impossible d'envoyer votre appel. Veuillez réessayer plus tard."
                  );
                }
              }
            };
            handleAppeal().catch(console.error);
          },
        },
      ],
      "plain-text"
    );
  };

  const handleBannedUser = async () => {
    try {
      // Déconnecter l'utilisateur
      await getAuth().signOut();

      // Rediriger vers l'écran de connexion
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" as never }],
      });
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  const registerDevice = async () => {
    try {
      if (getAuth().currentUser) {
        await banService.registerUserDevice();
      }
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du device:", error);
    }
  };

  return {
    banStatus,
    checking,
    checkBanStatus,
    registerDevice,
  };
};
