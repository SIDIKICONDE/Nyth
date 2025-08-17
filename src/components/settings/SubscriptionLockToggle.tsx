import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import tw from "twrnc";
import { useTheme } from "../../contexts/ThemeContext";
import { UIText } from "../ui/Typography";
import { useSubscriptionLock } from "./SubscriptionLockManager";

interface SubscriptionLockToggleProps {
  isVisible?: boolean;
  adminId?: string; // ID de l'admin qui fait la modification
}

export const SubscriptionLockToggle: React.FC<SubscriptionLockToggleProps> = ({
  isVisible = true,
  adminId = "admin",
}) => {
  const { currentTheme } = useTheme();
  const {
    isLocked,
    reason,
    lockedBy,
    lockedAt,
    loading,
    toggleLock,
    setLockReason,
    forceUnlock,
  } = useSubscriptionLock();

  const [showReasonModal, setShowReasonModal] = useState(false);
  const [tempReason, setTempReason] = useState(reason || "");

  if (!isVisible || loading) {
    return null;
  }

  const handleToggleLock = async () => {
    if (!isLocked) {
      // Si on veut verrouiller, demander une raison
      setTempReason(
        reason || "Section temporairement désactivée pour maintenance."
      );
      setShowReasonModal(true);
    } else {
      // Si on veut déverrouiller, demander confirmation
      Alert.alert(
        "Déverrouiller la page d'abonnement",
        "Êtes-vous sûr de vouloir réactiver l'accès à la page d'abonnement pour tous les utilisateurs ?",
        [
          { text: "Annuler", style: "cancel" },
          {
            text: "Déverrouiller",
            style: "default",
            onPress: () => toggleLock(adminId),
          },
        ]
      );
    }
  };

  const handleSaveReason = async () => {
    if (tempReason.trim()) {
      await setLockReason(tempReason.trim());
      await toggleLock(adminId);
      setShowReasonModal(false);
    } else {
      Alert.alert("Erreur", "Veuillez saisir une raison pour le verrouillage.");
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <View
        style={[
          tw`rounded-xl p-4 mb-4 border`,
          {
            backgroundColor: currentTheme.colors.surface,
            borderColor: isLocked
              ? currentTheme.colors.error + "50"
              : currentTheme.colors.success + "50",
          },
        ]}
      >
        <View style={tw`flex-row items-center justify-between mb-3`}>
          <View style={tw`flex-row items-center`}>
            <MaterialCommunityIcons
              name={isLocked ? "lock" : "lock-open"}
              size={20}
              color={
                isLocked
                  ? currentTheme.colors.error
                  : currentTheme.colors.success
              }
            />
            <UIText
              weight="semibold"
              style={[tw`ml-2`, { color: currentTheme.colors.text }]}
            >
              Page d'Abonnement
            </UIText>
          </View>
          <View
            style={[
              tw`px-3 py-1 rounded-full`,
              {
                backgroundColor: isLocked
                  ? currentTheme.colors.error + "20"
                  : currentTheme.colors.success + "20",
              },
            ]}
          >
            <UIText
              size="xs"
              weight="medium"
              style={[
                {
                  color: isLocked
                    ? currentTheme.colors.error
                    : currentTheme.colors.success,
                },
              ]}
            >
              {isLocked ? "DÉSACTIVÉE" : "ACTIVE"}
            </UIText>
          </View>
        </View>

        <View style={tw`flex-row items-center justify-between mb-3`}>
          <UIText size="sm" style={[{ color: currentTheme.colors.text }]}>
            Autoriser l'accès à la page d'abonnement
          </UIText>
          <Switch
            value={!isLocked}
            onValueChange={handleToggleLock}
            trackColor={{
              false: currentTheme.colors.error + "30",
              true: currentTheme.colors.success + "30",
            }}
            thumbColor={
              !isLocked
                ? currentTheme.colors.success
                : currentTheme.colors.error
            }
          />
        </View>

        {isLocked && reason && (
          <View
            style={[
              tw`p-3 rounded-lg mb-3`,
              { backgroundColor: currentTheme.colors.warning + "20" },
            ]}
          >
            <UIText
              size="xs"
              weight="medium"
              style={[tw`mb-1`, { color: currentTheme.colors.warning }]}
            >
              Raison du verrouillage :
            </UIText>
            <UIText size="xs" style={[{ color: currentTheme.colors.warning }]}>
              {reason}
            </UIText>
          </View>
        )}

        {isLocked && lockedBy && lockedAt && (
          <View
            style={[
              tw`p-2 rounded-lg mb-3`,
              { backgroundColor: currentTheme.colors.textSecondary + "10" },
            ]}
          >
            <UIText
              size="xs"
              style={[{ color: currentTheme.colors.textSecondary }]}
            >
              Verrouillé par : {lockedBy}
            </UIText>
            <UIText
              size="xs"
              style={[{ color: currentTheme.colors.textSecondary }]}
            >
              Le : {formatDate(lockedAt)}
            </UIText>
          </View>
        )}

        <View style={tw`flex-row gap-2`}>
          {isLocked && (
            <TouchableOpacity
              onPress={() => {
                setTempReason(reason || "");
                setShowReasonModal(true);
              }}
              style={[
                tw`flex-1 py-2 px-3 rounded-lg flex-row items-center justify-center`,
                { backgroundColor: currentTheme.colors.primary + "20" },
              ]}
            >
              <MaterialCommunityIcons
                name="pencil"
                size={14}
                color={currentTheme.colors.primary}
              />
              <UIText
                size="xs"
                weight="medium"
                style={[tw`ml-1`, { color: currentTheme.colors.primary }]}
              >
                Modifier raison
              </UIText>
            </TouchableOpacity>
          )}

          {isLocked && (
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  "Déverrouillage forcé",
                  "Ceci va immédiatement réactiver l'accès à la page d'abonnement. Continuer ?",
                  [
                    { text: "Annuler", style: "cancel" },
                    {
                      text: "Forcer",
                      style: "destructive",
                      onPress: forceUnlock,
                    },
                  ]
                );
              }}
              style={[
                tw`flex-1 py-2 px-3 rounded-lg flex-row items-center justify-center`,
                { backgroundColor: currentTheme.colors.error + "20" },
              ]}
            >
              <MaterialCommunityIcons
                name="lock-open-variant"
                size={14}
                color={currentTheme.colors.error}
              />
              <UIText
                size="xs"
                weight="medium"
                style={[tw`ml-1`, { color: currentTheme.colors.error }]}
              >
                Forcer
              </UIText>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Modal pour saisir la raison */}
      <Modal
        visible={showReasonModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowReasonModal(false)}
      >
        <View
          style={[
            tw`flex-1 justify-center items-center`,
            { backgroundColor: "rgba(0,0,0,0.5)" },
          ]}
        >
          <View
            style={[
              tw`m-4 p-6 rounded-xl w-80`,
              { backgroundColor: currentTheme.colors.surface },
            ]}
          >
            <UIText
              size="lg"
              weight="bold"
              style={[tw`mb-4`, { color: currentTheme.colors.text }]}
            >
              Raison du verrouillage
            </UIText>

            <TextInput
              style={[
                tw`border rounded-lg p-3 mb-4 text-sm`,
                {
                  borderColor: currentTheme.colors.border,
                  backgroundColor: currentTheme.colors.background,
                  color: currentTheme.colors.text,
                  minHeight: 80,
                },
              ]}
              placeholder="Expliquez pourquoi la page d'abonnement est désactivée..."
              placeholderTextColor={currentTheme.colors.textSecondary}
              value={tempReason}
              onChangeText={setTempReason}
              multiline
              textAlignVertical="top"
            />

            <View style={tw`flex-row gap-3`}>
              <TouchableOpacity
                onPress={() => setShowReasonModal(false)}
                style={[
                  tw`flex-1 py-3 rounded-lg`,
                  { backgroundColor: currentTheme.colors.textSecondary + "20" },
                ]}
              >
                <UIText
                  weight="medium"
                  style={[
                    tw`text-center`,
                    { color: currentTheme.colors.textSecondary },
                  ]}
                >
                  Annuler
                </UIText>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSaveReason}
                style={[
                  tw`flex-1 py-3 rounded-lg`,
                  { backgroundColor: currentTheme.colors.error },
                ]}
              >
                <UIText weight="medium" style={[tw`text-center text-white`]}>
                  Verrouiller
                </UIText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};
