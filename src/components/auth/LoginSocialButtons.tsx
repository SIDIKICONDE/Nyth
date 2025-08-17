import Ionicons from "react-native-vector-icons/Ionicons";
import React, { useState } from "react";
import { Alert, Platform, TouchableOpacity, View, Text } from "react-native";
import twrnc from "twrnc";
import { useAuth } from "../../hooks/useAuth";

import { createOptimizedLogger } from "../../utils/optimizedLogger";
const logger = createOptimizedLogger("LoginSocialButtons");

interface LoginSocialButtonsProps {
  onLoginSuccess?: () => void;
  isDisabled?: boolean;
}

export default function LoginSocialButtons({
  onLoginSuccess,
  isDisabled,
}: LoginSocialButtonsProps) {
  const { signInWithGoogle, signInWithApple, loading } = useAuth();
  const [socialLoading, setSocialLoading] = useState<"google" | "apple" | null>(
    null
  );

  const handleGoogleSignIn = async () => {
    try {
      setSocialLoading("google");
      const success = await signInWithGoogle();

      if (success) {
        onLoginSuccess?.();
      }
    } catch (error) {
      logger.error("Erreur Google Sign In:", error);
      Alert.alert("Erreur", "Impossible de se connecter avec Google");
    } finally {
      setSocialLoading(null);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setSocialLoading("apple");
      const success = await signInWithApple();

      if (success) {
        onLoginSuccess?.();
      } else {
        Alert.alert(
          "Erreur Apple Sign In",
          "Impossible de se connecter avec Apple. Vérifiez votre configuration iCloud et réessayez."
        );
      }
    } catch (error) {
      logger.error("Erreur Apple Sign In:", error);
      Alert.alert(
        "Erreur Apple Sign In",
        "Une erreur inattendue s'est produite. Vérifiez que vous êtes connecté à iCloud et réessayez."
      );
    } finally {
      setSocialLoading(null);
    }
  };

  const isLoading = loading || socialLoading !== null;
  const trulyDisabled = isLoading || isDisabled;

  return (
    <View style={twrnc`mt-2 flex-row justify-center items-center gap-3`}>
      {/* Bouton Google */}
      <TouchableOpacity
        style={[
          twrnc`w-12 h-12 bg-white rounded-full items-center justify-center ${
            trulyDisabled ? "opacity-50" : ""
          }`,
          {
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: 0.1,
            shadowRadius: 3.84,
            elevation: 5,
            borderWidth: 1,
            borderColor: "#E5E7EB",
          },
        ]}
        onPress={handleGoogleSignIn}
        disabled={trulyDisabled}
      >
        <Ionicons
          name={socialLoading === "google" ? "refresh" : "logo-google"}
          size={22}
          color="#4285f4"
        />
      </TouchableOpacity>

      {/* Bouton Apple - Seulement sur iOS */}
      {Platform.OS === "ios" && (
        <TouchableOpacity
          style={[
            twrnc`w-12 h-12 bg-black rounded-full items-center justify-center ${
              trulyDisabled ? "opacity-50" : ""
            }`,
            {
              shadowColor: "#000",
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            },
          ]}
          onPress={handleAppleSignIn}
          disabled={trulyDisabled}
        >
          <Ionicons
            name={socialLoading === "apple" ? "refresh" : "logo-apple"}
            size={22}
            color="#ffffff"
          />
        </TouchableOpacity>
      )}
    </View>
  );
}
