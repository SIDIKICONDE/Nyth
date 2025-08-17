import React from "react";
import { StyleSheet, View } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTheme } from "../../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../../hooks/useTranslation";
import { UIText } from "../../../../ui/Typography";
import { TipsSectionProps } from "../types";

export const TipsSection: React.FC<TipsSectionProps> = () => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  const tips = [
    {
      icon: "color-palette",
      title: t(
        "planning.tasks.kanban.column.tips.color.title",
        "Couleurs expressives"
      ),
      description: t(
        "planning.tasks.kanban.column.tips.color.description",
        "Utilisez des couleurs cohérentes pour identifier rapidement vos colonnes"
      ),
    },
    {
      icon: "list",
      title: t(
        "planning.tasks.kanban.column.tips.icon.title",
        "Icônes significatives"
      ),
      description: t(
        "planning.tasks.kanban.column.tips.icon.description",
        "Choisissez des icônes qui représentent clairement le rôle de la colonne"
      ),
    },
    {
      icon: "settings",
      title: t(
        "planning.tasks.kanban.column.tips.limits.title",
        "Limites intelligentes"
      ),
      description: t(
        "planning.tasks.kanban.column.tips.limits.description",
        "Définissez des limites de tâches pour éviter la surcharge"
      ),
    },
    {
      icon: "play-circle",
      title: t(
        "planning.tasks.kanban.column.tips.autoProgress.title",
        "Progression automatique"
      ),
      description: t(
        "planning.tasks.kanban.column.tips.autoProgress.description",
        "Activez la progression automatique pour fluidifier votre workflow"
      ),
    },
    {
      icon: "shield-checkmark",
      title: t(
        "planning.tasks.kanban.column.tips.validation.title",
        "Règles de validation"
      ),
      description: t(
        "planning.tasks.kanban.column.tips.validation.description",
        "Définissez des règles pour assurer la qualité des tâches"
      ),
    },
    {
      icon: "brush",
      title: t(
        "planning.tasks.kanban.column.tips.borderStyle.title",
        "Styles de bordure"
      ),
      description: t(
        "planning.tasks.kanban.column.tips.borderStyle.description",
        "Personnalisez l'apparence avec différents styles de bordure"
      ),
    },
  ];

  return (
    <View style={styles.container}>
      <UIText
        size="sm"
        weight="medium"
        color={currentTheme.colors.textSecondary}
        style={styles.sectionTitle}
      >
        {t("planning.tasks.kanban.column.tips.title", "Conseils d'utilisation")}
      </UIText>

      <View style={styles.tipsList}>
        {tips.map((tip, index) => (
          <View key={index} style={styles.tipItem}>
            <View
              style={[
                styles.tipIcon,
                { backgroundColor: currentTheme.colors.primary + "15" },
              ]}
            >
              <Ionicons
                name={tip.icon as any}
                size={16}
                color={currentTheme.colors.primary}
              />
            </View>
            <View style={styles.tipContent}>
              <UIText
                size="sm"
                weight="semibold"
                color={currentTheme.colors.text}
                style={styles.tipTitle}
              >
                {tip.title}
              </UIText>
              <UIText
                size="xs"
                color={currentTheme.colors.textSecondary}
                style={styles.tipDescription}
              >
                {tip.description}
              </UIText>
            </View>
          </View>
        ))}
      </View>

      {/* Section des exemples d'utilisation */}
      <View style={styles.examplesSection}>
        <UIText
          size="sm"
          weight="medium"
          color={currentTheme.colors.textSecondary}
          style={styles.examplesTitle}
        >
          {t(
            "planning.tasks.kanban.column.tips.examples.title",
            "Exemples d'utilisation"
          )}
        </UIText>

        <View style={styles.examplesList}>
          <View style={styles.exampleItem}>
            <UIText
              size="xs"
              weight="semibold"
              color={currentTheme.colors.primary}
            >
              📋 Workflow de développement
            </UIText>
            <UIText size="xs" color={currentTheme.colors.textSecondary}>
              Backlog → En cours → Test → Validation → Déployé
            </UIText>
          </View>

          <View style={styles.exampleItem}>
            <UIText
              size="xs"
              weight="semibold"
              color={currentTheme.colors.primary}
            >
              🎯 Gestion de projet
            </UIText>
            <UIText size="xs" color={currentTheme.colors.textSecondary}>
              À faire → En cours → En révision → Terminé
            </UIText>
          </View>

          <View style={styles.exampleItem}>
            <UIText
              size="xs"
              weight="semibold"
              color={currentTheme.colors.primary}
            >
              📝 Création de contenu
            </UIText>
            <UIText size="xs" color={currentTheme.colors.textSecondary}>
              Idée → Rédaction → Révision → Publication
            </UIText>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  tipIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  tipContent: {
    flex: 1,
    gap: 4,
  },
  tipTitle: {
    marginBottom: 2,
  },
  tipDescription: {
    lineHeight: 16,
  },
  examplesSection: {
    marginTop: 8,
    gap: 12,
  },
  examplesTitle: {
    marginBottom: 8,
  },
  examplesList: {
    gap: 8,
  },
  exampleItem: {
    gap: 2,
  },
});
