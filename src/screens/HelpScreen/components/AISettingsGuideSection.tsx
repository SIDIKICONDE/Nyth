import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "@/hooks/useTranslation";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import tw from "twrnc";

interface AISettingsContent {
  type: "text" | "list" | "steps" | "warning" | "tip";
  content: string | string[];
  title?: string;
}

interface AISettingsGuideItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  content: AISettingsContent[];
}

export const AISettingsGuideSection: React.FC = () => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const [selectedItem, setSelectedItem] = useState<AISettingsGuideItem | null>(
    null
  );

  const aiSettingsGuides: AISettingsGuideItem[] = [
    {
      id: "ai-settings-overview",
      title: "Vue d'ensemble des paramètres IA",
      description:
        "Introduction complète aux réglages de l'intelligence artificielle",
      icon: "cog-outline",
      color: "#3B82F6",
      content: [
        {
          type: "text",
          content:
            "Les paramètres IA de Nyth centralisent toute la configuration de l'intelligence artificielle : providers, clés API, sécurité, ordre de priorité et mémoire IA. C'est votre centre de contrôle pour une expérience IA optimale.",
        },
        {
          type: "list",
          title: "🎯 Sections principales des paramètres :",
          content: [
            "🔑 Configuration des providers et clés API",
            "📊 Ordre de priorité des modèles IA",
            "🔒 Protection sécurisée avancée",
            "🧠 Gestion de la mémoire IA",
            "🛡️ Audit de sécurité des clés",
            "💾 Sauvegarde et synchronisation",
          ],
        },
        {
          type: "steps",
          title: "Accéder aux paramètres IA :",
          content: [
            "Depuis l'écran d'accueil, appuyez sur l'icône menu",
            "Sélectionnez 'Paramètres' dans le menu",
            "Choisissez la section 'IA' ou 'Intelligence Artificielle'",
            "Ou depuis le générateur/chat, utilisez le bouton 'Configurer'",
          ],
        },
        {
          type: "tip",
          content:
            "Configurez au moins 2-3 providers pour assurer une continuité de service. Les providers gratuits offrent des quotas généreux pour commencer.",
        },
      ],
    },
    {
      id: "provider-configuration",
      title: "Configuration des providers IA",
      description: "Activez et configurez les 5 modèles d'IA disponibles",
      icon: "server-network",
      color: "#10B981",
      content: [
        {
          type: "text",
          content:
            "Nyth supporte 5 providers d'intelligence artificielle, chacun avec ses spécialités. 4 offrent des quotas gratuits généreux, et OpenAI propose une qualité premium payante.",
        },
        {
          type: "list",
          title: "🆓 Providers gratuits disponibles :",
          content: [
            "🟢 Cohere : 5M tokens/mois - Analyse et classification",
            "🔵 Google Gemini : 5M tokens/mois - Polyvalent et rapide",
            "🔴 Mistral AI : Crédits gratuits - Créatif et original",
            "🟣 Hugging Face : Open source - Modèles variés",
          ],
        },
        {
          type: "steps",
          title: "Configurer un provider étape par étape :",
          content: [
            "Localisez le provider souhaité dans la liste",
            "Activez le toggle pour afficher le champ de clé API",
            "Obtenez votre clé API sur le site du provider",
            "Collez la clé dans le champ sécurisé",
            "Utilisez l'icône œil pour vérifier la clé",
            "Le statut 'Configuré' s'affiche automatiquement",
            "Sauvegardez avec le bouton en haut à droite",
          ],
        },
        {
          type: "list",
          title: "🔗 Obtenir vos clés API :",
          content: [
            "Cohere : cohere.ai → Dashboard → API Keys",
            "Gemini : makersuite.google.com → Get API Key",
            "Mistral : console.mistral.ai → API Keys",
            "HuggingFace : huggingface.co → Settings → Tokens",
            "OpenAI : platform.openai.com → API Keys",
            
          ],
        },
        {
          type: "warning",
          content:
            "Ne partagez JAMAIS vos clés API ! Chaque clé est personnelle et liée à votre compte. Activez la protection sécurisée pour plus de sécurité.",
        },
      ],
    },
    {
      id: "priority-order",
      title: "Ordre de priorité des providers",
      description: "Optimisez l'utilisation des modèles selon vos besoins",
      icon: "sort-numeric-variant",
      color: "#F59E0B",
      content: [
        {
          type: "text",
          content:
            "L'ordre de priorité détermine quel provider sera utilisé en premier. Si le premier échoue ou atteint sa limite, l'application bascule automatiquement vers le suivant.",
        },
        {
          type: "steps",
          title: "Modifier l'ordre de priorité :",
          content: [
            "Cliquez sur 'Modifier l'ordre' dans les paramètres IA",
            "Le modal de réorganisation s'ouvre",
            "Glissez-déposez les providers pour les réordonner",
            "Les providers actifs sont colorés, les inactifs grisés",
            "Confirmez le nouvel ordre",
            "L'ordre est sauvegardé automatiquement",
          ],
        },
        {
          type: "list",
          title: "🏆 Ordres recommandés selon l'usage :",
          content: [
            "Général : 1.Gemini 2.Cohere 3.Mistral",
            "Créatif : 1.Mistral 2.Gemini 3.OpenAI",
            "Technique : 1.Cohere 2.Gemini 3.HuggingFace",
            "Premium : 1.OpenAI 2.Gemini 3.Cohere",
            "Économique : 1.HuggingFace 2.Mistral 3.Cohere",
          ],
        },
        {
          type: "tip",
          content:
            "Placez vos providers préférés en premier, mais gardez toujours 2-3 providers de secours actifs pour éviter les interruptions.",
        },
      ],
    },
    // Bloc biométrie supprimé
    {
      id: "api-key-management",
      title: "Gestion des clés API",
      description: "Audit, suppression et sécurité de vos clés",
      icon: "key-variant",
      color: "#06B6D4",
      content: [
        {
          type: "text",
          content:
            "L'audit de sécurité vous permet de visualiser, gérer et supprimer vos clés API configurées. Système de suppression instantanée et interface sécurisée inclus.",
        },
        {
          type: "list",
          title: "🛡️ Fonctionnalités de l'audit :",
          content: [
            "Liste complète des clés configurées",
            "Statuts visuels par provider",
            "Suppression sélective instantanée",
            "Masquage/affichage sécurisé",
            "Actualisation en temps réel",
            "Indicateurs de sécurité",
          ],
        },
        {
          type: "steps",
          title: "Supprimer une clé API :",
          content: [
            "Accédez à la section 'Audit de sécurité'",
            "Localisez la clé à supprimer",
            "Appuyez sur l'icône corbeille",
            "Confirmez la suppression",
            "La clé est effacée instantanément",
            "Le provider devient inactif",
          ],
        },
        {
          type: "list",
          title: "💡 Bonnes pratiques :",
          content: [
            "Régénérez vos clés tous les 3-6 mois",
            "Supprimez les clés des providers inutilisés",
            "Ne stockez jamais les clés ailleurs",
            "Utilisez des clés différentes par application",
          ],
        },
        {
          type: "tip",
          content:
            "La suppression est instantanée et irréversible. Assurez-vous d'avoir une copie de sauvegarde avant de supprimer une clé active.",
        },
      ],
    },
    {
      id: "ai-memory-settings",
      title: "Paramètres de la mémoire IA",
      description: "Configurez et gérez la personnalisation intelligente",
      icon: "brain",
      color: "#EC4899",
      content: [
        {
          type: "text",
          content:
            "La mémoire IA analyse vos conversations pour personnaliser l'expérience. Vous gardez le contrôle total avec options d'activation, consultation et suppression des données.",
        },
        {
          type: "list",
          title: "🧠 Options de la mémoire IA :",
          content: [
            "Activation/désactivation globale",
            "Consultation des données mémorisées",
            "Suppression sélective d'informations",
            "Réinitialisation complète",
            "Export des données (à venir)",
            "Paramètres de confidentialité",
          ],
        },
        {
          type: "steps",
          title: "Gérer la mémoire IA :",
          content: [
            "Accédez à Paramètres → Mémoire IA",
            "Toggle ON/OFF pour activer/désactiver",
            "Cliquez 'Voir les données' pour consulter",
            "Sélectionnez des éléments pour suppression",
            "Ou utilisez 'Supprimer tout' pour réinitialiser",
            "Confirmez vos actions",
          ],
        },
        {
          type: "list",
          title: "📊 Données mémorisées :",
          content: [
            "Préférences créatives et styles favoris",
            "Habitudes de travail et processus",
            "Objectifs et métriques personnels",
            "Compétences et domaines d'expertise",
            "Instructions récurrentes",
            "Contexte professionnel",
          ],
        },
        {
          type: "warning",
          content:
            "La suppression des données de mémoire est irréversible. L'IA devra réapprendre vos préférences depuis zéro.",
        },
      ],
    },
    {
      id: "troubleshooting-settings",
      title: "Dépannage des paramètres IA",
      description: "Solutions aux problèmes de configuration courants",
      icon: "tools",
      color: "#EF4444",
      content: [
        {
          type: "text",
          content:
            "Résolvez rapidement les problèmes de configuration pour maintenir vos paramètres IA opérationnels.",
        },
        {
          type: "list",
          title: "❌ Problèmes fréquents :",
          content: [
            "Clé API non reconnue ou invalide",
            "Toggle qui ne s'active pas",
            "Ordre de priorité qui ne se sauvegarde pas",
            "Protection biométrique qui échoue",
            "Mémoire IA qui ne fonctionne pas",
          ],
        },
        {
          type: "steps",
          title: "Solutions pas à pas :",
          content: [
            "Vérifiez le format de la clé API (pas d'espaces)",
            "Assurez-vous d'avoir une connexion internet",
            "Redémarrez l'application après configuration",
            "Vérifiez les permissions de l'application",
            "Contactez le support si persistant",
          ],
        },
        {
          type: "list",
          title: "🔧 Solutions spécifiques :",
          content: [
            "Clé invalide → Vérifiez sur le site du provider",
            "Toggle bloqué → Au moins une clé doit être valide",
            "Ordre non sauvé → Attendez la confirmation",
            "Biométrie échoue → Reconfigurez Face ID/Touch ID",
            "Mémoire inactive → Activez d'abord un provider",
          ],
        },
        {
          type: "tip",
          content:
            "En cas de problème persistant, essayez de supprimer et reconfigurer le provider problématique depuis zéro.",
        },
      ],
    },
  ];

  const renderContent = (content: AISettingsContent) => {
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
        ⚙️ Guide des paramètres IA
      </Text>

      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`px-4 pb-4`}
        showsVerticalScrollIndicator={false}
      >
        {aiSettingsGuides.map((guide, index) => (
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
