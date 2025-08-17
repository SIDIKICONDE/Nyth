import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React, { useState } from "react";
import { TouchableOpacity, View } from "react-native";
import tw from "twrnc";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuthStateListener } from "../../hooks/useAuthStateListener";
import { useCentralizedFont } from "../../hooks/useCentralizedFont";
import { UIText } from "../ui/Typography";

interface AuthStateIndicatorProps {
  showDetails?: boolean;
  position?: "top" | "bottom";
  onPress?: () => void;
}

export const AuthStateIndicator: React.FC<AuthStateIndicatorProps> = ({
  showDetails = false,
  position = "top",
  onPress,
}) => {
  const { currentTheme } = useTheme();
  const { ui } = useCentralizedFont();
  const { user, refreshAuthState } = useAuth();
  const [lastChangeReason, setLastChangeReason] = useState<string>("initial");
  const [changeCount, setChangeCount] = useState(0);

  // Écouter les changements d'état d'authentification
  const { isReady, forceRefresh } = useAuthStateListener((newUser, reason) => {
    setLastChangeReason(reason);
    setChangeCount((prev) => prev + 1);
  });

  const handlePress = async () => {
    if (onPress) {
      onPress();
    } else {
      // Par défaut, forcer un rafraîchissement
      await forceRefresh();
    }
  };

  const getStatusIcon = () => {
    if (!user) return "account-off";
    if (user.isGuest) return "account-question";
    return "account-check";
  };

  const getStatusColor = () => {
    if (!user) return "#ef4444"; // Rouge pour déconnecté
    if (user.isGuest) return "#f59e0b"; // Orange pour invité
    return "#10b981"; // Vert pour connecté
  };

  const getStatusText = () => {
    if (!user) return "Déconnecté";
    if (user.isGuest) return "Invité";
    return "Connecté";
  };

  const containerStyle = [
    tw`absolute left-4 right-4 rounded-lg border border-opacity-20`,
    {
      backgroundColor: currentTheme.colors.surface,
      borderColor: getStatusColor(),
      ...(position === "top" ? { top: 50 } : { bottom: 50 }),
    },
  ];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={tw`flex-row items-center p-3`}>
        <View
          style={[
            tw`w-3 h-3 rounded-full mr-3`,
            { backgroundColor: getStatusColor() },
          ]}
        />

        <View style={tw`flex-1`}>
          <View style={tw`flex-row items-center`}>
            <MaterialCommunityIcons
              name={getStatusIcon()}
              size={16}
              color={getStatusColor()}
              style={tw`mr-2`}
            />
            <UIText
              weight="medium"
              style={[ui, { color: currentTheme.colors.text }]}
            >
              {getStatusText()}
            </UIText>
            {user && (
              <UIText
                size="xs"
                weight="medium"
                style={[
                  ui,
                  tw`ml-2`,
                  { color: currentTheme.colors.textSecondary },
                ]}
              >
                {user.email || user.name || user.uid.substring(0, 8)}
              </UIText>
            )}
          </View>

          {showDetails && (
            <View style={tw`mt-1`}>
              <UIText
                size="xs"
                weight="medium"
                style={[ui, { color: currentTheme.colors.textSecondary }]}
              >
                Dernier changement: {lastChangeReason} (#{changeCount})
              </UIText>
              <UIText
                size="xs"
                weight="medium"
                style={[ui, { color: currentTheme.colors.textSecondary }]}
              >
                État prêt: {isReady ? "Oui" : "Non"} • UID:{" "}
                {user?.uid?.substring(0, 12) || "Aucun"}
              </UIText>
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={async () => await refreshAuthState()}
          style={[
            tw`p-2 rounded-full`,
            { backgroundColor: `${getStatusColor()}20` },
          ]}
        >
          <MaterialCommunityIcons
            name="refresh"
            size={16}
            color={getStatusColor()}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};
