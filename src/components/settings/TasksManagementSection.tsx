import React, { useState } from "react";
import { Alert, Pressable, View } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";

import { UIText } from "@/components/ui/Typography";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useTasks } from "@/hooks/useTasks";

import { createOptimizedLogger } from '../../utils/optimizedLogger';
const logger = createOptimizedLogger('TasksManagementSection');

export default function TasksManagementSection() {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { tasks, deleteAllTasks, createDemoTasks } = useTasks();
  const [isManagingTasks, setIsManagingTasks] = useState(false);

  // Compter les tâches d'exemple (celles qui commencent par "demo-task-")
  const demoTasksCount = tasks.filter((task) =>
    task.id.startsWith("demo-task-")
  ).length;
  const hasDemoTasks = demoTasksCount > 0;

  const handleDeleteDemoTasks = () => {
    Alert.alert(
      t("settings.tasks.deleteDemo.title", "Supprimer les tâches d'exemple"),
      t(
        "settings.tasks.deleteDemo.message",
        "Êtes-vous sûr de vouloir supprimer toutes les tâches d'exemple ? Cette action est irréversible."
      ),
      [
        {
          text: t("common.cancel", "Annuler"),
          style: "cancel",
        },
        {
          text: t("settings.tasks.deleteDemo.confirm", "Supprimer"),
          style: "destructive",
          onPress: async () => {
            try {
              setIsManagingTasks(true);
              await deleteAllTasks();
              logger.debug("✅ Tâches d'exemple supprimées avec succès");
            } catch (error) {
              logger.error(
                "❌ Erreur lors de la suppression des tâches:",
                error
              );
              Alert.alert(
                t("common.error", "Erreur"),
                t(
                  "settings.tasks.deleteDemo.error",
                  "Erreur lors de la suppression des tâches d'exemple"
                )
              );
            } finally {
              setIsManagingTasks(false);
            }
          },
        },
      ]
    );
  };

  const handleRecreateDemoTasks = () => {
    Alert.alert(
      t("settings.tasks.recreateDemo.title", "Recréer les tâches d'exemple"),
      t(
        "settings.tasks.recreateDemo.message",
        "Voulez-vous recréer les tâches d'exemple ? Cela remplacera les tâches d'exemple existantes."
      ),
      [
        {
          text: t("common.cancel", "Annuler"),
          style: "cancel",
        },
        {
          text: t("settings.tasks.recreateDemo.confirm", "Recréer"),
          onPress: async () => {
            try {
              setIsManagingTasks(true);
              // Supprimer d'abord les tâches existantes
              await deleteAllTasks();
              // Puis recréer les tâches d'exemple
              await createDemoTasks();
              logger.debug("✅ Tâches d'exemple recréées avec succès");
            } catch (error) {
              logger.error(
                "❌ Erreur lors de la recréation des tâches:",
                error
              );
              Alert.alert(
                t("common.error", "Erreur"),
                t(
                  "settings.tasks.recreateDemo.error",
                  "Erreur lors de la recréation des tâches d'exemple"
                )
              );
            } finally {
              setIsManagingTasks(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={tw`mb-4`}>
      {/* En-tête */}
      <View style={tw`flex-row items-center justify-between mb-4`}>
        <View style={tw`flex-row items-center flex-1`}>
          <View
            style={[
              tw`p-2 rounded-full mr-3`,
              { backgroundColor: "#8B5CF620" },
            ]}
          >
            <MaterialCommunityIcons
              name="format-list-checks"
              size={20}
              color="#8B5CF6"
            />
          </View>
          <View style={tw`flex-1`}>
            <UIText
              size="lg"
              weight="semibold"
              color={currentTheme.colors.text}
            >
              {t("settings.tasks.title", "Gestion des Tâches")}
            </UIText>
            <UIText size="sm" color={currentTheme.colors.textSecondary}>
              {hasDemoTasks
                ? t(
                    "settings.tasks.demoTasksCount",
                    "{{count}} tâches d'exemple",
                    { count: demoTasksCount }
                  )
                : t("settings.tasks.noDemoTasks", "Aucune tâche d'exemple")}
            </UIText>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={tw`gap-3`}>
        {/* Bouton Supprimer les tâches d'exemple */}
        {hasDemoTasks && (
          <Pressable
            onPress={handleDeleteDemoTasks}
            disabled={isManagingTasks}
            style={[
              tw`p-3 rounded-lg flex-row items-center justify-center`,
              { backgroundColor: "#EF444415" },
            ]}
          >
            {isManagingTasks ? (
              <>
                <MaterialCommunityIcons
                  name="loading"
                  size={18}
                  color="#EF4444"
                  style={tw`mr-2`}
                />
                <UIText size="sm" weight="medium" color="#EF4444">
                  {t("ui.loading", "Chargement...")}
                </UIText>
              </>
            ) : (
              <>
                <MaterialCommunityIcons
                  name="delete-sweep"
                  size={18}
                  color="#EF4444"
                  style={tw`mr-2`}
                />
                <UIText size="sm" weight="medium" color="#EF4444">
                  {t(
                    "settings.tasks.deleteDemo.button",
                    "Supprimer les tâches d'exemple"
                  )}
                </UIText>
              </>
            )}
          </Pressable>
        )}

        {/* Bouton Recréer les tâches d'exemple */}
        <Pressable
          onPress={handleRecreateDemoTasks}
          disabled={isManagingTasks}
          style={[
            tw`p-3 rounded-lg flex-row items-center justify-center`,
            { backgroundColor: "#8B5CF615" },
          ]}
        >
          {isManagingTasks ? (
            <>
              <MaterialCommunityIcons
                name="loading"
                size={18}
                color="#8B5CF6"
                style={tw`mr-2`}
              />
              <UIText size="sm" weight="medium" color="#8B5CF6">
                {t("ui.loading", "Chargement...")}
              </UIText>
            </>
          ) : (
            <>
              <MaterialCommunityIcons
                name="refresh"
                size={18}
                color="#8B5CF6"
                style={tw`mr-2`}
              />
              <UIText size="sm" weight="medium" color="#8B5CF6">
                {t(
                  "settings.tasks.recreateDemo.button",
                  "Recréer les tâches d'exemple"
                )}
              </UIText>
            </>
          )}
        </Pressable>

        {/* Message d'information */}
        <View style={tw`mt-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20`}>
          <UIText
            size="xs"
            color={currentTheme.colors.textSecondary}
            align="center"
          >
            {t(
              "settings.tasks.info",
              "Les tâches d'exemple vous permettent de découvrir toutes les fonctionnalités de l'application. Vous pouvez les supprimer ou les recréer à tout moment."
            )}
          </UIText>
        </View>
      </View>
    </View>
  );
}
