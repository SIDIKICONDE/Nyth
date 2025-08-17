import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Alert } from "react-native";
import { useAuth } from "../../../contexts/AuthContext";
import { useTranslation } from "../../../hooks/useTranslation";
import { RootStackParamList } from "../../../types";
import { createLogger } from "../../../utils/optimizedLogger";
import { RegisterFormData } from "../types";

const logger = createLogger("RegisterSubmit");

type RegisterScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Register"
>;

export function useRegisterSubmit() {
  const { t } = useTranslation();
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { signUp, error: authError } = useAuth();

  const handleSubmit = async (
    formData: RegisterFormData,
    setIsLoading: (loading: boolean) => void
  ) => {
    try {
      setIsLoading(true);
      logger.info("Firebase registration attempt", { email: formData.email });

      // Extraire le nom de l'email si pas de champ nom
      const name = formData.email.split("@")[0];

      // Inscription Firebase
      const success = await signUp(formData.email, formData.password, name);

      if (success) {
        logger.info("Firebase registration successful");

        // Navigation directe vers VerifyEmail sans alerte
        navigation.reset({
          index: 0,
          routes: [{ name: "VerifyEmail" }],
        });
      } else {
        // L'erreur est gérée par AuthContext
        Alert.alert(
          t("auth.register.error.title"),
          authError || t("auth.register.error.message")
        );
      }
    } catch (error) {
      logger.error("Registration error", error);
      Alert.alert(
        t("auth.register.error.title"),
        t("auth.register.error.message")
      );
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleSubmit,
  };
}
