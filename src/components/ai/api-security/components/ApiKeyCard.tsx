import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import tw from "twrnc";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../hooks/useTranslation";
import { Caption, H5, UIText } from "../../../ui/Typography";
import { ApiKey } from "../types";
import {
  getExpiryStatus,
  getProviderIcon,
} from "../utils";

interface ApiKeyCardProps {
  apiKey: ApiKey;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onDelete: (provider: string) => void;
  defaultGradient: [string, string];
}

export const ApiKeyCard: React.FC<ApiKeyCardProps> = ({
  apiKey,
  isExpanded,
  onToggleExpand,
  onDelete,
  defaultGradient,
}) => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();
  const expiryStatus = getExpiryStatus(apiKey.daysUntilExpiry);
  const icon = getProviderIcon(apiKey.provider);

  return (
    <TouchableOpacity onPress={onToggleExpand} activeOpacity={0.8}>
      <View
        style={[
          tw`p-4 rounded-xl`,
          { backgroundColor: currentTheme.colors.primary }
        ]}
      >
        <View style={tw`flex-row items-center justify-between`}>
          <View style={tw`flex-row items-center flex-1`}>
            <View style={tw`p-2 rounded-full bg-white/20`}>
              <MaterialCommunityIcons name={icon} size={24} color="white" />
            </View>
            <View style={tw`ml-3 flex-1`}>
              <H5 style={[tw`capitalize`, { color: "white" }]}>
                {apiKey.provider}
              </H5>
              <View style={tw`flex-row items-center mt-1`}>
                <MaterialCommunityIcons
                  name={expiryStatus.icon}
                  size={14}
                  color="white"
                />
                <Caption style={[tw`ml-1`, { color: "rgba(255,255,255,0.8)" }]}>
                  {apiKey.isExpired
                    ? t("security.keys.expired", "Expirée")
                    : `${apiKey.daysUntilExpiry}j restants`}
                </Caption>
              </View>
            </View>
            <MaterialCommunityIcons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={24}
              color="white"
            />
          </View>
        </View>

        {/* Détails étendus */}
        {isExpanded && (
          <Animated.View
            entering={FadeIn}
            style={tw`mt-4 p-3 bg-white/10 rounded-xl`}
          >
            <View style={tw`flex-row justify-between items-center mb-2`}>
              <Caption style={{ color: "rgba(255,255,255,0.7)" }}>
                {t("security.encryption", "Chiffrement")}
              </Caption>
              <View style={tw`flex-row items-center`}>
                <MaterialCommunityIcons
                  name={apiKey.encryptionType === "AES" ? "lock" : "lock-open"}
                  size={14}
                  color="white"
                />
                <UIText
                  size={12}
                  weight="500"
                  style={[tw`ml-1`, { color: "white" }]}
                >
                  {apiKey.encryptionType || "Base64"}
                </UIText>
              </View>
            </View>

            <View style={tw`flex-row justify-between items-center`}>
              <Caption style={{ color: "rgba(255,255,255,0.7)" }}>
                {t("security.created", "Créée le")}
              </Caption>
              <Caption style={{ color: "white" }}>
                {new Date(apiKey.createdAt).toLocaleDateString()}
              </Caption>
            </View>

            <TouchableOpacity
              onPress={() => onDelete(apiKey.provider)}
              style={[
                tw`mt-3 rounded-lg p-2 flex-row items-center justify-center`,
                { backgroundColor: currentTheme.colors.error || '#ef4444' }
              ]}
            >
              <MaterialCommunityIcons name="delete" size={16} color="white" />
              <UIText
                size={14}
                weight="500"
                style={[tw`ml-1`, { color: "white" }]}
              >
                {t("security.deleteButton", "Supprimer")}
              </UIText>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </TouchableOpacity>
  );
};
