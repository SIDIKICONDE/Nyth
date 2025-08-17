import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "@/hooks/useTranslation";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import tw from "twrnc";

interface PlanningContent {
  type: "text" | "list" | "steps" | "warning" | "tip";
  content: string | string[];
  title?: string;
}

interface PlanningGuideItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  content: PlanningContent[];
}

export const PlanningGuideSection: React.FC = () => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const [selectedItem, setSelectedItem] = useState<PlanningGuideItem | null>(
    null
  );

  const planningGuides: PlanningGuideItem[] = [
    {
      id: "planning-basics",
      title: "Débuter avec la planification",
      description: "Guide complet pour commencer à utiliser la planification",
      icon: "calendar-star",
      color: "#3B82F6",
      content: [
        {
          type: "text",
          content:
            "La planification dans CamPrompt AI vous aide à organiser vos projets vidéo, gérer vos objectifs créatifs et suivre votre progression. C'est votre centre de contrôle pour une création de contenu structurée et efficace.",
        },
        {
          type: "steps",
          title: "Premiers pas avec la planification :",
          content: [
            "Accédez à la planification depuis l'écran d'accueil",
            "Explorez les 4 onglets : Timeline, Tâches, Calendrier, Analytics",
            "Créez votre premier événement ou objectif",
            "Configurez vos préférences dans les paramètres",
            "Commencez à suivre votre progression",
          ],
        },
        {
          type: "list",
          title: "🎯 4 Sections principales :",
          content: [
            "📅 Timeline : Vue chronologique de vos événements et objectifs",
            "✅ Tâches : Gestion des tâches avec statuts (À faire, En cours, Terminé)",
            "📊 Calendrier : Vue mensuelle/hebdomadaire de vos plannings",
            "📈 Analytics : Statistiques et analyses de votre productivité",
          ],
        },
        {
          type: "tip",
          content:
            "Commencez par créer quelques événements simples pour vous familiariser avec l'interface avant de configurer des objectifs complexes.",
        },
      ],
    },
    {
      id: "create-events",
      title: "Créer et gérer des événements",
      description:
        "Maîtrisez la création d'événements pour organiser vos projets",
      icon: "calendar-plus",
      color: "#10B981",
      content: [
        {
          type: "text",
          content:
            "Les événements sont la base de votre planification. Ils représentent vos sessions de tournage, deadlines, rendez-vous clients, ou tout autre élément temporel de vos projets.",
        },
        {
          type: "steps",
          title: "Créer un nouvel événement :",
          content: [
            "Cliquez sur le bouton '+' dans le header de planification",
            "Sélectionnez 'Nouvel événement' dans le modal",
            "Remplissez le titre et la description",
            "Choisissez la date et l'heure",
            "Sélectionnez une catégorie (Tournage, Réunion, Deadline, etc.)",
            "Définissez la priorité (Faible, Normale, Élevée, Urgente)",
            "Ajoutez des notes si nécessaire",
            "Sauvegardez votre événement",
          ],
        },
        {
          type: "list",
          title: "🏷️ Types d'événements disponibles :",
          content: [
            "🎬 Tournage : Sessions d'enregistrement vidéo",
            "🤝 Réunion : Rendez-vous clients, équipe, partenaires",
            "📅 Deadline : Échéances importantes à respecter",
            "✏️ Écriture : Sessions de création de scripts",
            "📊 Analyse : Révision des performances, analytics",
            "🎯 Autre : Événements personnalisés",
          ],
        },
        {
          type: "list",
          title: "⚡ Statuts et actions :",
          content: [
            "📋 Planifié : Événement créé, en attente",
            "🔄 En cours : Événement en cours d'exécution",
            "✅ Terminé : Événement accompli avec succès",
            "❌ Annulé : Événement annulé ou reporté",
            "⏰ En retard : Événement dépassé non terminé",
          ],
        },
        {
          type: "warning",
          content:
            "Les événements en retard apparaissent avec un indicateur rouge. Mettez à jour leur statut régulièrement pour maintenir une planification précise.",
        },
      ],
    },
    {
      id: "manage-goals",
      title: "Définir et suivre des objectifs",
      description: "Créez des objectifs mesurables et suivez votre progression",
      icon: "target",
      color: "#F59E0B",
      content: [
        {
          type: "text",
          content:
            "Les objectifs vous permettent de définir des buts à long terme avec suivi de progression. Parfait pour vos objectifs de création de contenu, croissance d'audience, ou projets personnels.",
        },
        {
          type: "steps",
          title: "Créer un objectif :",
          content: [
            "Accédez à l'onglet Timeline → sous-onglet Objectifs",
            "Cliquez sur l'icône drapeau dans le header",
            "Définissez un titre clair et motivant",
            "Rédigez une description détaillée",
            "Choisissez le type d'objectif (Numérique, Oui/Non, Personnalisé)",
            "Fixez la valeur cible et l'unité de mesure",
            "Définissez la date d'échéance",
            "Sélectionnez la priorité et la catégorie",
            "Sauvegardez votre objectif",
          ],
        },
        {
          type: "list",
          title: "🎯 Types d'objectifs :",
          content: [
            "📊 Numérique : Objectifs chiffrés (1000 abonnés, 50 vidéos)",
            "✅ Oui/Non : Objectifs binaires (Lancer chaîne YouTube)",
            "🎨 Personnalisé : Objectifs complexes avec critères multiples",
          ],
        },
        {
          type: "list",
          title: "📈 Suivi de progression :",
          content: [
            "Mise à jour manuelle via l'interface",
            "Progression en pourcentage automatique",
            "Indicateurs visuels colorés selon avancement",
            "Notifications d'échéances approchantes",
            "Historique des mises à jour",
          ],
        },
        {
          type: "steps",
          title: "Mettre à jour la progression :",
          content: [
            "Trouvez votre objectif dans la timeline",
            "Tapez sur l'objectif pour ouvrir les détails",
            "Utilisez le slider ou saisissez la valeur actuelle",
            "Ajoutez une note sur les progrès (optionnel)",
            "Sauvegardez la mise à jour",
            "Consultez le graphique de progression",
          ],
        },
        {
          type: "tip",
          content:
            "Définissez des objectifs SMART : Spécifiques, Mesurables, Atteignables, Réalistes, Temporellement définis. Exemple : 'Atteindre 5000 abonnés YouTube d'ici 6 mois' plutôt que 'Avoir plus d'abonnés'.",
        },
      ],
    },
    {
      id: "task-management",
      title: "Gestion des tâches",
      description: "Organisez vos tâches avec un système de statuts avancé",
      icon: "clipboard-check",
      color: "#8B5CF6",
      content: [
        {
          type: "text",
          content:
            "Le système de tâches vous permet de décomposer vos projets en actions concrètes avec suivi détaillé. Idéal pour gérer les étapes de production vidéo, les tâches administratives, ou les actions de promotion.",
        },
        {
          type: "steps",
          title: "Créer une nouvelle tâche :",
          content: [
            "Accédez à l'onglet 'Tâches' de la planification",
            "Cliquez sur le bouton '+' pour créer une tâche",
            "Saisissez le titre de la tâche",
            "Ajoutez une description détaillée",
            "Choisissez le statut initial (À faire, En cours, Terminé)",
            "Définissez la priorité et la catégorie",
            "Fixez une date d'échéance si nécessaire",
            "Sauvegardez votre tâche",
          ],
        },
        {
          type: "list",
          title: "📋 Statuts des tâches :",
          content: [
            "📝 À faire : Tâches planifiées, pas encore commencées",
            "🔄 En cours : Tâches en cours d'exécution",
            "✅ Terminé : Tâches accomplies avec succès",
            "⏸️ En pause : Tâches temporairement suspendues",
            "❌ Annulé : Tâches annulées ou abandonnées",
          ],
        },
        {
          type: "list",
          title: "🏷️ Catégories de tâches :",
          content: [
            "🎬 Production : Tournage, montage, post-production",
            "✏️ Écriture : Scripts, descriptions, titres",
            "📢 Promotion : Partage, engagement, marketing",
            "📊 Analyse : Métriques, performances, optimisation",
            "🔧 Technique : Configuration, maintenance, tests",
            "📋 Admin : Gestion, organisation, planification",
          ],
        },
        {
          type: "list",
          title: "⚡ Fonctionnalités avancées :",
          content: [
            "Filtrage par statut, priorité, catégorie",
            "Tri par date, priorité, statut",
            "Recherche textuelle dans les tâches",
            "Archivage des tâches terminées",
            "Statistiques de productivité",
            "Notifications d'échéances",
          ],
        },
        {
          type: "warning",
          content:
            "Les tâches en retard sont mises en évidence. Révisez régulièrement vos échéances et ajustez les dates si nécessaire pour maintenir un planning réaliste.",
        },
      ],
    },
    {
      id: "calendar-view",
      title: "Vue calendrier",
      description: "Visualisez vos plannings dans une interface calendrier",
      icon: "calendar-month",
      color: "#EF4444",
      content: [
        {
          type: "text",
          content:
            "La vue calendrier offre une perspective mensuelle et hebdomadaire de tous vos événements, objectifs et tâches. Parfaite pour avoir une vision globale de votre planning et identifier les périodes chargées.",
        },
        {
          type: "list",
          title: "📅 Modes d'affichage :",
          content: [
            "📆 Vue mensuelle : Aperçu global du mois avec événements",
            "📋 Vue hebdomadaire : Détails semaine par semaine",
            "📊 Vue agenda : Liste chronologique des événements",
            "🎯 Vue objectifs : Focus sur les échéances d'objectifs",
          ],
        },
        {
          type: "list",
          title: "🎨 Codes couleur :",
          content: [
            "🔵 Bleu : Événements planifiés",
            "🟢 Vert : Événements terminés",
            "🟡 Jaune : Événements en cours",
            "🔴 Rouge : Événements en retard",
            "🟣 Violet : Objectifs et jalons",
            "🟠 Orange : Tâches importantes",
          ],
        },
        {
          type: "steps",
          title: "Navigation dans le calendrier :",
          content: [
            "Glissez horizontalement pour changer de mois",
            "Tapez sur une date pour voir les détails",
            "Utilisez les flèches pour naviguer mois par mois",
            "Pinch pour zoomer sur une semaine spécifique",
            "Tapez sur un événement pour l'éditer",
            "Appui long pour créer un nouvel événement",
          ],
        },
        {
          type: "tip",
          content:
            "Utilisez la vue calendrier pour identifier les conflits d'horaires et optimiser la répartition de votre charge de travail sur le mois.",
        },
      ],
    },
    {
      id: "analytics-insights",
      title: "Analytics et insights",
      description: "Analysez votre productivité et optimisez votre planning",
      icon: "chart-line",
      color: "#06B6D4",
      content: [
        {
          type: "text",
          content:
            "L'onglet Analytics vous fournit des données détaillées sur votre productivité, l'avancement de vos objectifs, et des insights pour optimiser votre organisation.",
        },
        {
          type: "list",
          title: "📊 Métriques disponibles :",
          content: [
            "📈 Taux de completion des tâches",
            "🎯 Progression des objectifs",
            "⏱️ Temps moyen par type d'événement",
            "📅 Répartition des activités par catégorie",
            "🔥 Streaks de productivité",
            "📉 Analyse des tendances mensuelles",
          ],
        },
        {
          type: "list",
          title: "🎯 Insights intelligents :",
          content: [
            "Identification des créneaux les plus productifs",
            "Recommandations d'optimisation du planning",
            "Alertes sur les objectifs en retard",
            "Suggestions d'amélioration des workflows",
            "Analyse des patterns de procrastination",
          ],
        },
        {
          type: "steps",
          title: "Utiliser les analytics :",
          content: [
            "Accédez à l'onglet Analytics",
            "Consultez le tableau de bord principal",
            "Explorez les graphiques détaillés",
            "Lisez les insights et recommandations",
            "Ajustez votre planning selon les données",
            "Suivez l'évolution de vos métriques",
          ],
        },
        {
          type: "warning",
          content:
            "Les analytics nécessitent au moins 2 semaines de données pour fournir des insights précis. Soyez patient et continuez à utiliser la planification régulièrement.",
        },
      ],
    },
    {
      id: "planning-settings",
      title: "Paramètres et personnalisation",
      description: "Configurez la planification selon vos préférences",
      icon: "cog",
      color: "#64748B",
      content: [
        {
          type: "text",
          content:
            "Personnalisez votre expérience de planification avec de nombreux paramètres pour adapter l'interface et les fonctionnalités à votre workflow.",
        },
        {
          type: "list",
          title: "⚙️ Paramètres disponibles :",
          content: [
            "🎨 Thème et couleurs personnalisés",
            "📅 Format de date et heure",
            "🔔 Notifications et rappels",
            "📊 Préférences d'affichage des analytics",
            "🎯 Paramètres par défaut pour nouveaux éléments",
            "🔄 Synchronisation et sauvegarde",
          ],
        },
        {
          type: "steps",
          title: "Accéder aux paramètres :",
          content: [
            "Cliquez sur l'icône '⋯' dans le header de planification",
            "Sélectionnez 'Paramètres' dans le menu",
            "Explorez les différentes sections",
            "Modifiez les paramètres selon vos besoins",
            "Sauvegardez vos préférences",
            "Testez les modifications dans l'interface",
          ],
        },
        {
          type: "tip",
          content:
            "Configurez les notifications pour recevoir des rappels avant vos événements importants et des alertes pour les objectifs approchant de leur échéance.",
        },
      ],
    },
    {
      id: "planning-tips",
      title: "Conseils et bonnes pratiques",
      description: "Optimisez votre usage de la planification",
      icon: "lightbulb",
      color: "#F59E0B",
      content: [
        {
          type: "text",
          content:
            "Maximisez l'efficacité de votre planification avec ces conseils pratiques issus de l'expérience des créateurs de contenu les plus organisés.",
        },
        {
          type: "list",
          title: "🎯 Bonnes pratiques :",
          content: [
            "Planifiez vos sessions de création en blocs de temps",
            "Définissez des objectifs mesurables et réalistes",
            "Utilisez les catégories pour organiser vos activités",
            "Révisez votre planning chaque semaine",
            "Ajustez les échéances selon vos capacités réelles",
            "Célébrez vos accomplissements",
          ],
        },
        {
          type: "list",
          title: "⚡ Astuces de productivité :",
          content: [
            "Groupez les tâches similaires (batch processing)",
            "Planifiez vos créneaux de créativité aux meilleures heures",
            "Laissez du temps tampon entre les événements",
            "Préparez vos scripts la veille des tournages",
            "Utilisez les templates pour les événements récurrents",
          ],
        },
        {
          type: "warning",
          content:
            "Évitez de surcharger votre planning. Mieux vaut sous-estimer votre capacité et être en avance que de créer du stress inutile.",
        },
        {
          type: "tip",
          content:
            "Commencez petit : créez 2-3 événements par semaine et 1-2 objectifs par mois. Augmentez progressivement selon votre confort avec l'outil.",
        },
      ],
    },
  ];

  const renderContent = (content: PlanningContent) => {
    switch (content.type) {
      case "text":
        return (
          <Text
            style={[
              tw`text-base leading-6 mb-4`,
              { color: currentTheme.colors.text },
            ]}
          >
            {content.content}
          </Text>
        );

      case "list":
        return (
          <View style={tw`mb-4`}>
            {content.title && (
              <Text
                style={[
                  tw`text-lg font-semibold mb-2`,
                  { color: currentTheme.colors.text },
                ]}
              >
                {content.title}
              </Text>
            )}
            {Array.isArray(content.content) &&
              content.content.map((item, index) => (
                <View key={index} style={tw`flex-row items-start mb-2`}>
                  <Text
                    style={[
                      tw`text-base mr-2`,
                      { color: currentTheme.colors.textSecondary },
                    ]}
                  >
                    •
                  </Text>
                  <Text
                    style={[
                      tw`text-base flex-1 leading-6`,
                      { color: currentTheme.colors.text },
                    ]}
                  >
                    {item}
                  </Text>
                </View>
              ))}
          </View>
        );

      case "steps":
        return (
          <View style={tw`mb-4`}>
            {content.title && (
              <Text
                style={[
                  tw`text-lg font-semibold mb-2`,
                  { color: currentTheme.colors.text },
                ]}
              >
                {content.title}
              </Text>
            )}
            {Array.isArray(content.content) &&
              content.content.map((step, index) => (
                <View key={index} style={tw`flex-row items-start mb-2`}>
                  <View
                    style={[
                      tw`w-6 h-6 rounded-full items-center justify-center mr-3 mt-0.5`,
                      { backgroundColor: currentTheme.colors.primary },
                    ]}
                  >
                    <Text
                      style={[
                        tw`text-sm font-bold`,
                        { color: currentTheme.colors.background },
                      ]}
                    >
                      {index + 1}
                    </Text>
                  </View>
                  <Text
                    style={[
                      tw`text-base flex-1 leading-6`,
                      { color: currentTheme.colors.text },
                    ]}
                  >
                    {step}
                  </Text>
                </View>
              ))}
          </View>
        );

      case "warning":
        return (
          <View
            style={[
              tw`p-4 rounded-lg mb-4 border-l-4`,
              {
                backgroundColor: currentTheme.colors.error + "10",
                borderLeftColor: currentTheme.colors.error,
              },
            ]}
          >
            <View style={tw`flex-row items-center mb-2`}>
              <MaterialCommunityIcons
                name="alert"
                size={20}
                color={currentTheme.colors.error}
              />
              <Text
                style={[
                  tw`text-base font-semibold ml-2`,
                  { color: currentTheme.colors.error },
                ]}
              >
                Attention
              </Text>
            </View>
            <Text
              style={[
                tw`text-base leading-6`,
                { color: currentTheme.colors.text },
              ]}
            >
              {content.content}
            </Text>
          </View>
        );

      case "tip":
        return (
          <View
            style={[
              tw`p-4 rounded-lg mb-4 border-l-4`,
              {
                backgroundColor: currentTheme.colors.success + "10",
                borderLeftColor: currentTheme.colors.success,
              },
            ]}
          >
            <View style={tw`flex-row items-center mb-2`}>
              <MaterialCommunityIcons
                name="lightbulb"
                size={20}
                color={currentTheme.colors.success}
              />
              <Text
                style={[
                  tw`text-base font-semibold ml-2`,
                  { color: currentTheme.colors.success },
                ]}
              >
                Conseil
              </Text>
            </View>
            <Text
              style={[
                tw`text-base leading-6`,
                { color: currentTheme.colors.text },
              ]}
            >
              {content.content}
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  if (selectedItem) {
    return (
      <View style={tw`flex-1`}>
        {/* Header avec bouton retour */}
        <View
          style={[
            tw`flex-row items-center p-4 border-b`,
            { borderBottomColor: currentTheme.colors.border },
          ]}
        >
          <TouchableOpacity
            onPress={() => setSelectedItem(null)}
            style={[
              tw`w-10 h-10 rounded-full items-center justify-center mr-3`,
              { backgroundColor: currentTheme.colors.surface },
            ]}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={currentTheme.colors.text}
            />
          </TouchableOpacity>
          <View style={tw`flex-1`}>
            <Text
              style={[
                tw`text-xl font-bold`,
                { color: currentTheme.colors.text },
              ]}
            >
              {selectedItem.title}
            </Text>
            <Text
              style={[
                tw`text-sm mt-1`,
                { color: currentTheme.colors.textSecondary },
              ]}
            >
              {selectedItem.description}
            </Text>
          </View>
        </View>

        {/* Contenu détaillé */}
        <ScrollView
          style={tw`flex-1`}
          contentContainerStyle={tw`p-4`}
          showsVerticalScrollIndicator={false}
        >
          {selectedItem.content.map((content, index) => (
            <Animated.View key={index} entering={FadeInDown.delay(index * 100)}>
              {renderContent(content)}
            </Animated.View>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={tw`flex-1`}>
      <Text
        style={[
          tw`text-xl font-bold mb-4 px-4`,
          { color: currentTheme.colors.text },
        ]}
      >
        📅 Guide de la planification
      </Text>

      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`px-4 pb-4`}
        showsVerticalScrollIndicator={false}
      >
        {planningGuides.map((guide, index) => (
          <Animated.View
            key={guide.id}
            entering={FadeInDown.delay(index * 100)}
          >
            <TouchableOpacity
              style={[
                tw`p-4 rounded-xl mb-3 border`,
                {
                  backgroundColor: currentTheme.colors.surface,
                  borderColor: currentTheme.colors.border,
                },
              ]}
              onPress={() => setSelectedItem(guide)}
            >
              <View style={tw`flex-row items-center`}>
                <View
                  style={[
                    tw`w-12 h-12 rounded-xl items-center justify-center mr-4`,
                    { backgroundColor: guide.color + "15" },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={guide.icon as any}
                    size={24}
                    color={guide.color}
                  />
                </View>
                <View style={tw`flex-1`}>
                  <Text
                    style={[
                      tw`text-lg font-semibold mb-1`,
                      { color: currentTheme.colors.text },
                    ]}
                  >
                    {guide.title}
                  </Text>
                  <Text
                    style={[
                      tw`text-sm leading-5`,
                      { color: currentTheme.colors.textSecondary },
                    ]}
                  >
                    {guide.description}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={currentTheme.colors.textSecondary}
                />
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
};
