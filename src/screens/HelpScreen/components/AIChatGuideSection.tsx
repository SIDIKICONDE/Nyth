import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "@/hooks/useTranslation";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import tw from "twrnc";

interface AIChatContent {
  type: "text" | "list" | "steps" | "warning" | "tip";
  content: string | string[];
  title?: string;
}

interface AIChatGuideItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  content: AIChatContent[];
}

export const AIChatGuideSection: React.FC = () => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const [selectedItem, setSelectedItem] = useState<AIChatGuideItem | null>(
    null
  );

  const aiChatGuides: AIChatGuideItem[] = [
    {
      id: "ai-chat-basics",
      title: "Débuter avec l'AI Chat",
      description: "Introduction à votre assistant IA conversationnel",
      icon: "robot-outline",
      color: "#3B82F6",
      content: [
        {
          type: "text",
          content:
            "L'AI Chat de CamPrompt AI est votre assistant intelligent personnel pour créer, améliorer et discuter de vos scripts. Il combine conversation naturelle, actions spécialisées et mémoire intelligente pour une expérience personnalisée.",
        },
        {
          type: "steps",
          title: "Premiers pas avec l'AI Chat :",
          content: [
            "Accédez au chat via l'icône 🤖 ou le menu principal",
            "Configurez au moins un provider IA dans les paramètres",
            "Commencez par une conversation simple pour tester",
            "Explorez les 4 actions rapides disponibles",
            "Activez la mémoire IA pour une expérience personnalisée",
            "Personnalisez l'interface selon vos préférences",
          ],
        },
        {
          type: "list",
          title: "🎯 Fonctionnalités principales :",
          content: [
            "💬 Conversation libre sur tous sujets",
            "📝 4 actions rapides spécialisées",
            "🧠 Mémoire IA intelligente et personnalisable",
            "📱 Interface adaptative avec 10 styles de bulles",
            "🔄 Multi-providers avec basculement automatique",
            "💾 Sauvegarde et gestion des conversations",
            "🎨 Personnalisation complète de l'interface",
          ],
        },
        {
          type: "tip",
          content:
            "Commencez par configurer vos providers IA gratuits (Gemini, Cohere) avant d'explorer les fonctionnalités avancées.",
        },
      ],
    },
    {
      id: "ai-providers",
      title: "Providers IA et configuration",
      description:
        "Configurez et optimisez vos modèles d'intelligence artificielle",
      icon: "cloud-outline",
      color: "#10B981",
      content: [
        {
          type: "text",
          content:
            "CamPrompt AI supporte 5 providers IA différents pour vous offrir flexibilité et redondance. Chaque provider a ses spécialités et quotas.",
        },
        {
          type: "list",
          title: "🆓 Providers gratuits disponibles :",
          content: [
            "🟢 Cohere : 5M tokens/mois - Excellent pour l'analyse",
            "🔵 Google Gemini : 5M tokens/mois - Polyvalent et rapide",
            "🔴 Mistral AI : Crédits gratuits - Créatif et original",
            "🟣 Hugging Face : Open source - Modèles variés",
            "🟠 OpenAI : Payant - GPT-4 premium (le plus avancé)",
          ],
        },
        {
          type: "steps",
          title: "Configuration des providers :",
          content: [
            "Allez dans Paramètres → IA depuis le menu",
            "Activez les toggles des providers souhaités",
            "Saisissez vos clés API personnelles",
            "Testez la connexion de chaque provider",
            "Configurez l'ordre de priorité selon vos préférences",
            "Activez la protection biométrique pour sécuriser",
          ],
        },
        {
          type: "list",
          title: "🎯 Spécialités par provider :",
          content: [
            "Gemini : Polyvalence, vitesse, intégration Google",
            "Cohere : Analyse de texte, classification, résumés",
            "Mistral : Créativité, originalité, style français",
            "OpenAI : Qualité premium, raisonnement complexe",
            "HuggingFace : Modèles spécialisés, open source",
          ],
        },
        {
          type: "warning",
          content:
            "Gardez vos clés API confidentielles ! Activez la protection biométrique et ne partagez jamais vos clés avec d'autres applications.",
        },
      ],
    },
    {
      id: "ai-memory",
      title: "Mémoire IA - Personnalisation intelligente",
      description:
        "Système qui apprend vos préférences pour une expérience sur mesure",
      icon: "brain",
      color: "#8B5CF6",
      content: [
        {
          type: "text",
          content:
            "La mémoire IA est une fonctionnalité révolutionnaire qui analyse vos conversations pour mémoriser vos préférences, habitudes et besoins. Elle permet à l'IA de vous offrir des réponses toujours plus pertinentes et personnalisées.",
        },
        {
          type: "list",
          title: "🧠 Comment fonctionne la mémoire IA :",
          content: [
            "Analyse automatique des conversations importantes",
            "Extraction intelligente des préférences utilisateur",
            "Stockage sélectif des informations pertinentes",
            "Personnalisation progressive des réponses",
            "Apprentissage continu de vos habitudes créatives",
          ],
        },
        {
          type: "steps",
          title: "Activer la mémoire IA :",
          content: [
            "Allez dans Paramètres → Mémoire IA",
            "Activez le toggle 'Mémoire IA activée'",
            "Confirmez l'activation dans la popup",
            "L'IA commencera à analyser vos futures conversations",
            "Soyez explicite sur vos préférences pour de meilleurs résultats",
          ],
        },
        {
          type: "list",
          title: "🗂️ Types d'informations mémorisées :",
          content: [
            "Préférences créatives : Styles, tons, formats favoris",
            "Habitudes de travail : Fréquence, processus, méthodes",
            "Objectifs personnels : Buts créatifs, métriques de succès",
            "Compétences : Niveaux de maîtrise, domaines d'expertise",
            "Contexte professionnel : Projets, environnement, audience",
            "Instructions récurrentes : Demandes fréquentes, templates",
          ],
        },
        {
          type: "steps",
          title: "Gérer vos données mémorisées :",
          content: [
            "Consultez : Paramètres → Mémoire IA → 'Voir les données'",
            "Pause temporaire : Désactivez le toggle (données préservées)",
            "Suppression sélective : Effacez seulement certaines données",
            "Réinitialisation complète : 'Supprimer toutes les données'",
            "Réactivation : Remettez le toggle ON pour recommencer",
          ],
        },
        {
          type: "tip",
          content:
            "Pour optimiser la mémoire IA, soyez explicite : 'Je préfère les scripts de 2 minutes pour TikTok avec un ton décontracté' plutôt que 'Quelque chose de court'.",
        },
        {
          type: "warning",
          content:
            "Vous gardez le contrôle total ! Vous pouvez désactiver, consulter ou supprimer vos données à tout moment. Ne partagez jamais d'informations sensibles (mots de passe, données financières).",
        },
      ],
    },
    {
      id: "quick-actions",
      title: "Actions rapides spécialisées",
      description: "Maîtrisez les 4 actions pour optimiser vos scripts",
      icon: "lightning-bolt",
      color: "#F59E0B",
      content: [
        {
          type: "text",
          content:
            "Les actions rapides sont des outils spécialisés qui permettent de traiter vos scripts avec des prompts optimisés. Chaque action a un objectif précis et des résultats prévisibles.",
        },
        {
          type: "list",
          title: "🚀 4 Actions disponibles :",
          content: [
            "📊 Analyser : Évalue ton, points forts, public cible et suggestions",
            "⭐ Améliorer : Optimise clarté, engagement et structure du texte",
            "✅ Corriger : Corrige orthographe, grammaire et ponctuation",
            "❓ Question personnalisée : Posez votre propre question sur le texte",
          ],
        },
        {
          type: "steps",
          title: "Utiliser les actions rapides :",
          content: [
            "Collez ou tapez votre script dans le chat",
            "Sélectionnez l'action souhaitée dans les boutons",
            "Attendez la réponse spécialisée de l'IA",
            "Double-tapez sur la réponse pour l'envoyer à l'éditeur",
            "Utilisez le résultat comme base pour votre script final",
          ],
        },
        {
          type: "list",
          title: "📊 Action 'Analyser' - Ce que vous obtenez :",
          content: [
            "Analyse du ton et du style (formel, décontracté, etc.)",
            "Identification des points forts du contenu",
            "Détermination du public cible probable",
            "Suggestions d'amélioration spécifiques",
            "Recommandations de plateformes adaptées",
          ],
        },
        {
          type: "list",
          title: "⭐ Action 'Améliorer' - Optimisations automatiques :",
          content: [
            "Reformulation pour plus de clarté",
            "Amélioration de l'engagement et du rythme",
            "Optimisation de la structure et des transitions",
            "Renforcement des appels à l'action",
            "Adaptation au format vidéo court",
          ],
        },
        {
          type: "list",
          title: "✅ Action 'Corriger' - Corrections incluses :",
          content: [
            "Orthographe et fautes de frappe",
            "Grammaire et conjugaison",
            "Ponctuation et syntaxe",
            "Cohérence des temps verbaux",
            "Fluidité de lecture",
          ],
        },
        {
          type: "tip",
          content:
            "Combinez les actions ! Commencez par 'Corriger', puis 'Améliorer', et enfin 'Analyser' pour un script parfaitement optimisé.",
        },
      ],
    },
    {
      id: "conversation-management",
      title: "Gestion des conversations",
      description: "Organisez et retrouvez facilement vos discussions",
      icon: "message-text",
      color: "#06B6D4",
      content: [
        {
          type: "text",
          content:
            "Le système de gestion des conversations vous permet de sauvegarder, organiser et retrouver toutes vos discussions avec l'IA. Parfait pour suivre l'évolution de vos projets et réutiliser des idées.",
        },
        {
          type: "list",
          title: "💾 Fonctionnalités de gestion :",
          content: [
            "Sauvegarde automatique de toutes les conversations",
            "Titres générés automatiquement ou personnalisables",
            "Recherche par titre ou contenu",
            "Organisation chronologique avec dates",
            "Actions rapides : Copier, Partager, Supprimer",
            "Synchronisation entre les sessions",
          ],
        },
        {
          type: "steps",
          title: "Accéder à vos conversations :",
          content: [
            "Ouvrez le menu latéral en glissant depuis la gauche",
            "Sélectionnez l'onglet 'Conversations'",
            "Parcourez la liste de vos discussions",
            "Tapez sur une conversation pour la rouvrir",
            "Utilisez la recherche pour trouver rapidement",
          ],
        },
        {
          type: "list",
          title: "🔍 Fonctions de recherche :",
          content: [
            "Recherche par titre de conversation",
            "Recherche dans le contenu des messages",
            "Filtrage par date de création",
            "Tri par récence ou alphabétique",
            "Accès rapide aux conversations favorites",
          ],
        },
        {
          type: "steps",
          title: "Transférer vers l'éditeur :",
          content: [
            "Trouvez la réponse IA que vous voulez utiliser",
            "Double-tapez sur le message de l'IA",
            "Le texte est automatiquement copié",
            "Naviguez vers l'éditeur de scripts",
            "Le contenu est prêt à être utilisé",
          ],
        },
        {
          type: "tip",
          content:
            "Renommez vos conversations importantes avec des titres descriptifs comme 'Script TikTok Cuisine' ou 'Idées YouTube Tech' pour les retrouver facilement.",
        },
      ],
    },
    {
      id: "interface-customization",
      title: "Personnalisation de l'interface",
      description: "Adaptez l'apparence du chat à vos préférences",
      icon: "palette",
      color: "#EC4899",
      content: [
        {
          type: "text",
          content:
            "L'interface du chat est entièrement personnalisable pour s'adapter à vos goûts et optimiser votre confort de lecture. Explorez les nombreuses options disponibles.",
        },
        {
          type: "list",
          title: "🎨 Options de personnalisation :",
          content: [
            "10 styles de bulles différents",
            "10 polices de caractères",
            "3 mises en page (Normal, Aéré, Compact)",
            "Adaptation automatique aux thèmes",
            "Tailles de texte ajustables",
            "Espacement personnalisable",
          ],
        },
        {
          type: "steps",
          title: "Personnaliser l'interface :",
          content: [
            "Ouvrez le menu latéral du chat",
            "Sélectionnez l'onglet 'Paramètres'",
            "Explorez les sections Style et Mise en page",
            "Testez différents styles de bulles",
            "Changez la police selon vos préférences",
            "Ajustez l'espacement pour votre confort",
          ],
        },
        {
          type: "list",
          title: "🎭 Styles de bulles disponibles :",
          content: [
            "Classique : Style traditionnel avec coins arrondis",
            "iOS : Imitation du style Messages d'Apple",
            "Élégant : Design moderne avec ombres subtiles",
            "Néon : Couleurs vives pour un look futuriste",
            "Minimaliste : Épuré avec bordures fines",
            "Rétro : Style vintage avec textures",
          ],
        },
        {
          type: "list",
          title: "🔤 Polices recommandées :",
          content: [
            "System : Police par défaut de votre système",
            "Roboto : Moderne et lisible (recommandée)",
            "Lato : Élégante et professionnelle",
            "Montserrat : Parfaite pour les titres",
            "Open Sans : Classique et polyvalente",
            "Nunito : Arrondie et amicale",
          ],
        },
        {
          type: "tip",
          content:
            "Essayez le style 'iOS' avec la police 'Roboto' et la mise en page 'Aéré' pour une expérience optimale de lecture.",
        },
      ],
    },
    {
      id: "advanced-features",
      title: "Fonctionnalités avancées",
      description: "Exploitez tout le potentiel de l'AI Chat",
      icon: "rocket",
      color: "#7C3AED",
      content: [
        {
          type: "text",
          content:
            "L'AI Chat offre des fonctionnalités avancées pour les utilisateurs expérimentés qui veulent maximiser leur productivité créative.",
        },
        {
          type: "list",
          title: "🔄 Basculement automatique des providers :",
          content: [
            "Tentative automatique avec le provider principal",
            "Basculement vers le provider secondaire en cas d'échec",
            "Indication du provider utilisé pour chaque réponse",
            "Gestion intelligente des quotas et limites",
            "Optimisation selon le type de requête",
          ],
        },
        {
          type: "list",
          title: "🎯 Contexte invisible et prompts système :",
          content: [
            "Contexte automatique selon la page d'origine",
            "Prompts système optimisés par fonctionnalité",
            "Personnalisation selon votre historique",
            "Adaptation au type de contenu créé",
            "Intégration avec la mémoire IA",
          ],
        },
        {
          type: "steps",
          title: "Optimiser vos prompts :",
          content: [
            "Soyez spécifique dans vos demandes",
            "Mentionnez le contexte et l'objectif",
            "Précisez le format de sortie souhaité",
            "Donnez des exemples si nécessaire",
            "Utilisez un langage clair et direct",
          ],
        },
        {
          type: "list",
          title: "💡 Conseils pour de meilleures réponses :",
          content: [
            "Incluez le public cible dans vos demandes",
            "Spécifiez la plateforme de diffusion",
            "Mentionnez la durée souhaitée",
            "Précisez le ton et le style voulus",
            "Donnez du contexte sur votre domaine",
          ],
        },
        {
          type: "warning",
          content:
            "Les fonctionnalités avancées consomment plus de tokens. Surveillez vos quotas si vous utilisez des providers gratuits.",
        },
      ],
    },
    {
      id: "troubleshooting",
      title: "Résolution de problèmes",
      description: "Solutions aux problèmes courants de l'AI Chat",
      icon: "tools",
      color: "#EF4444",
      content: [
        {
          type: "text",
          content:
            "Résolvez rapidement les problèmes les plus fréquents rencontrés avec l'AI Chat pour maintenir une expérience fluide.",
        },
        {
          type: "list",
          title: "❌ Problèmes fréquents :",
          content: [
            "L'IA ne répond pas ou donne des erreurs",
            "Réponses lentes ou timeouts",
            "Qualité des réponses décevante",
            "Problèmes de mémoire IA",
            "Interface qui ne se charge pas",
          ],
        },
        {
          type: "steps",
          title: "Diagnostic et solutions :",
          content: [
            "Vérifiez votre connexion internet",
            "Contrôlez la configuration de vos providers IA",
            "Testez avec un provider différent",
            "Redémarrez l'application si nécessaire",
            "Contactez le support si le problème persiste",
          ],
        },
        {
          type: "list",
          title: "🔧 Solutions spécifiques :",
          content: [
            "Pas de réponse → Vérifiez les clés API",
            "Erreur de quota → Changez de provider ou attendez",
            "Réponse lente → Vérifiez la connexion",
            "Mémoire IA inactive → Réactivez dans les paramètres",
            "Interface bloquée → Forcez la fermeture de l'app",
          ],
        },
        {
          type: "steps",
          title: "Réinitialisation complète :",
          content: [
            "Sauvegardez vos conversations importantes",
            "Allez dans Paramètres → IA → Réinitialiser",
            "Reconfigurez vos providers IA",
            "Réactivez la mémoire IA si souhaité",
            "Testez avec une conversation simple",
          ],
        },
        {
          type: "tip",
          content:
            "Gardez toujours au moins 2 providers configurés pour éviter les interruptions de service.",
        },
      ],
    },
  ];

  const renderContent = (content: AIChatContent) => {
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
        🤖 Guide AI Chat & Discussion
      </Text>

      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`px-4 pb-4`}
        showsVerticalScrollIndicator={false}
      >
        {aiChatGuides.map((guide, index) => (
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
