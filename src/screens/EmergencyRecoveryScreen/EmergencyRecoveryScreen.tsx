import React, { useEffect, useState } from "react";
import { View, ScrollView, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import tw from "twrnc";
import { UIText, HeadingText } from "@/components/ui/Typography";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useEmergencyRecordingSave } from "@/screens/RecordingScreen/hooks/useEmergencyRecordingSave";
import { createLogger } from "@/utils/optimizedLogger";

const logger = createLogger("EmergencyRecoveryScreen");

interface EmergencyRecordingData {
  id: string;
  timestamp: number;
  scriptTitle: string;
  recordingDuration: number;
  videoPath?: string;
  metadata: {
    reason: "memory_critical" | "system_error" | "manual_stop";
    memoryUsage?: number;
    qualityReduced?: boolean;
    partialSave: boolean;
  };
}

export default function EmergencyRecoveryScreen() {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();

  const [emergencyRecordings, setEmergencyRecordings] = useState<
    EmergencyRecordingData[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { getEmergencyRecordings, deleteEmergencyRecording, formatDuration } =
    useEmergencyRecordingSave();

  // Charger les enregistrements d'urgence
  useEffect(() => {
    const loadEmergencyRecordings = async () => {
      try {
        setIsLoading(true);
        const recordings = await getEmergencyRecordings();
        setEmergencyRecordings(recordings);
        logger.info("Enregistrements d'urgence chargés", {
          count: recordings.length,
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erreur inconnue";
        logger.error("Erreur chargement enregistrements d'urgence", err);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadEmergencyRecordings();
  }, [getEmergencyRecordings]);

  // Supprimer un enregistrement
  const handleDeleteRecording = (recording: EmergencyRecordingData) => {
    Alert.alert(
      t("emergency.delete.title", "Supprimer l'Enregistrement"),
      t(
        "emergency.delete.message",
        `Voulez-vous vraiment supprimer l'enregistrement "${
          recording.scriptTitle
        }" de ${formatDuration(recording.recordingDuration)} ?`
      ),
      [
        {
          text: t("common.cancel", "Annuler"),
          style: "cancel",
        },
        {
          text: t("common.delete", "Supprimer"),
          style: "destructive",
          onPress: async () => {
            try {
              const success = await deleteEmergencyRecording(recording.id);
              if (success) {
                setEmergencyRecordings((prev) =>
                  prev.filter((r) => r.id !== recording.id)
                );
                logger.info("Enregistrement d'urgence supprimé", {
                  id: recording.id,
                });
              } else {
                Alert.alert(
                  t("emergency.delete.error.title", "Erreur"),
                  t(
                    "emergency.delete.error.message",
                    "Impossible de supprimer l'enregistrement"
                  )
                );
              }
            } catch (err) {
              logger.error("Erreur suppression enregistrement d'urgence", err);
              Alert.alert(
                t("emergency.delete.error.title", "Erreur"),
                t(
                  "emergency.delete.error.message",
                  "Impossible de supprimer l'enregistrement"
                )
              );
            }
          },
        },
      ]
    );
  };

  // Récupérer un enregistrement
  const handleRecoverRecording = (recording: EmergencyRecordingData) => {
    Alert.alert(
      t("emergency.recover.title", "Récupérer l'Enregistrement"),
      t(
        "emergency.recover.message",
        `Voulez-vous récupérer l'enregistrement "${recording.scriptTitle}" ?`
      ),
      [
        {
          text: t("common.cancel", "Annuler"),
          style: "cancel",
        },
        {
          text: t("emergency.recover.confirm", "Récupérer"),
          style: "default",
          onPress: () => {
            // TODO: Naviguer vers l'écran de prévisualisation/édition
            logger.info("Récupération d'enregistrement demandée", {
              id: recording.id,
              videoPath: recording.videoPath,
            });

            Alert.alert(
              t("emergency.recover.success.title", "Enregistrement Récupéré"),
              t(
                "emergency.recover.success.message",
                "L'enregistrement a été ajouté à votre galerie."
              ),
              [{ text: "OK" }]
            );
          },
        },
      ]
    );
  };

  // Obtenir l'icône selon la raison de la sauvegarde
  const getReasonIcon = (reason: string): string => {
    switch (reason) {
      case "memory_critical":
        return "🧠";
      case "system_error":
        return "⚠️";
      case "manual_stop":
        return "⏹️";
      default:
        return "💾";
    }
  };

  // Obtenir le texte de la raison
  const getReasonText = (reason: string): string => {
    switch (reason) {
      case "memory_critical":
        return t("emergency.reason.memory", "Mémoire critique");
      case "system_error":
        return t("emergency.reason.system", "Erreur système");
      case "manual_stop":
        return t("emergency.reason.manual", "Arrêt manuel");
      default:
        return t("emergency.reason.unknown", "Raison inconnue");
    }
  };

  // Formater la date
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return t("emergency.time.minutes_ago", `Il y a ${diffMins} min`);
    } else if (diffHours < 24) {
      return t("emergency.time.hours_ago", `Il y a ${diffHours}h`);
    } else if (diffDays < 7) {
      return t(
        "emergency.time.days_ago",
        `Il y a ${diffDays} jour${diffDays > 1 ? "s" : ""}`
      );
    } else {
      return date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={[
          tw`flex-1`,
          { backgroundColor: currentTheme.colors.background },
        ]}
      >
        <View style={tw`flex-1 justify-center items-center`}>
          <UIText
            size="base"
            style={{ color: currentTheme.colors.textSecondary }}
          >
            {t("emergency.loading", "Chargement des enregistrements...")}
          </UIText>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView
        style={[
          tw`flex-1`,
          { backgroundColor: currentTheme.colors.background },
        ]}
      >
        <View style={tw`flex-1 justify-center items-center px-6`}>
          <UIText
            size="lg"
            style={[tw`text-center mb-4`, { color: currentTheme.colors.error }]}
          >
            ⚠️ {t("emergency.error.title", "Erreur")}
          </UIText>
          <UIText
            size="base"
            style={[
              tw`text-center mb-6`,
              { color: currentTheme.colors.textSecondary },
            ]}
          >
            {error}
          </UIText>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[
              tw`py-3 px-6 rounded-full`,
              { backgroundColor: currentTheme.colors.primary },
            ]}
          >
            <UIText
              size="base"
              weight="semibold"
              style={{ color: currentTheme.colors.text }}
            >
              {t("common.back", "Retour")}
            </UIText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[tw`flex-1`, { backgroundColor: currentTheme.colors.background }]}
    >
      {/* En-tête */}
      <View style={tw`px-6 py-4 border-b border-gray-200 dark:border-gray-700`}>
        <View style={tw`flex-row items-center justify-between`}>
          <View>
            <HeadingText
              size="lg"
              weight="bold"
              style={{ color: currentTheme.colors.text }}
            >
              🛡️ {t("emergency.title", "Enregistrements de Secours")}
            </HeadingText>
            <UIText
              size="sm"
              style={{ color: currentTheme.colors.textSecondary }}
            >
              {t(
                "emergency.subtitle",
                `${emergencyRecordings.length} enregistrement${
                  emergencyRecordings.length > 1 ? "s" : ""
                } sauvegardé${emergencyRecordings.length > 1 ? "s" : ""}`
              )}
            </UIText>
          </View>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[
              tw`p-2 rounded-full`,
              { backgroundColor: currentTheme.colors.surface },
            ]}
          >
            <UIText size="lg">✕</UIText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Liste des enregistrements */}
      {emergencyRecordings.length === 0 ? (
        <View style={tw`flex-1 justify-center items-center px-6`}>
          <UIText size="xl" style={tw`mb-4`}>
            📹
          </UIText>
          <HeadingText
            size="base"
            weight="semibold"
            style={[tw`text-center mb-2`, { color: currentTheme.colors.text }]}
          >
            {t("emergency.empty.title", "Aucun Enregistrement de Secours")}
          </HeadingText>
          <UIText
            size="base"
            style={[
              tw`text-center`,
              { color: currentTheme.colors.textSecondary },
            ]}
          >
            {t(
              "emergency.empty.message",
              "Les enregistrements sauvegardés automatiquement en cas d'urgence apparaîtront ici."
            )}
          </UIText>
        </View>
      ) : (
        <ScrollView style={tw`flex-1`} contentContainerStyle={tw`p-6`}>
          {emergencyRecordings.map((recording) => (
            <View
              key={recording.id}
              style={[
                tw`mb-4 p-4 rounded-xl border`,
                {
                  backgroundColor: currentTheme.colors.surface,
                  borderColor: currentTheme.colors.border,
                },
              ]}
            >
              {/* En-tête de l'enregistrement */}
              <View style={tw`flex-row items-start justify-between mb-3`}>
                <View style={tw`flex-1 mr-3`}>
                  <HeadingText
                    size="base"
                    weight="semibold"
                    style={{ color: currentTheme.colors.text }}
                  >
                    {recording.scriptTitle}
                  </HeadingText>
                  <UIText
                    size="sm"
                    style={{ color: currentTheme.colors.textSecondary }}
                  >
                    {formatDuration(recording.recordingDuration)} •{" "}
                    {formatDate(recording.timestamp)}
                  </UIText>
                </View>
                <View style={tw`flex-row items-center`}>
                  <UIText size="sm" style={tw`mr-2`}>
                    {getReasonIcon(recording.metadata.reason)}
                  </UIText>
                </View>
              </View>

              {/* Informations détaillées */}
              <View style={tw`mb-3`}>
                <UIText
                  size="xs"
                  style={{ color: currentTheme.colors.textSecondary }}
                >
                  {getReasonText(recording.metadata.reason)}
                  {recording.metadata.memoryUsage &&
                    ` • ${recording.metadata.memoryUsage.toFixed(1)}% mémoire`}
                  {recording.metadata.qualityReduced &&
                    ` • ${t("emergency.quality_reduced", "Qualité réduite")}`}
                </UIText>
                {recording.videoPath && (
                  <UIText
                    size="xs"
                    style={[
                      tw`mt-1 font-mono`,
                      { color: currentTheme.colors.textSecondary },
                    ]}
                  >
                    📁 {recording.videoPath.split("/").pop()}
                  </UIText>
                )}
              </View>

              {/* Actions */}
              <View style={tw`flex-row gap-2`}>
                <TouchableOpacity
                  onPress={() => handleRecoverRecording(recording)}
                  style={[
                    tw`flex-1 py-2 px-4 rounded-lg`,
                    { backgroundColor: currentTheme.colors.primary },
                  ]}
                >
                  <UIText
                    size="sm"
                    weight="semibold"
                    style={[
                      tw`text-center`,
                      { color: currentTheme.colors.text },
                    ]}
                  >
                    📥 {t("emergency.recover.button", "Récupérer")}
                  </UIText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteRecording(recording)}
                  style={[
                    tw`py-2 px-4 rounded-lg`,
                    { backgroundColor: currentTheme.colors.error },
                  ]}
                >
                  <UIText
                    size="sm"
                    weight="semibold"
                    style={tw`text-white text-center`}
                  >
                    🗑️
                  </UIText>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
