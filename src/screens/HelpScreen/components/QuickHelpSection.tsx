import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "@/hooks/useTranslation";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React, { useState } from "react";
import {
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  LayoutAnimationConfig,
  LinearTransition,
} from "react-native-reanimated";
import tw from "twrnc";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: "general" | "technical" | "account" | "billing";
  icon: string;
  color: string;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  action: () => void;
}

export const QuickHelpSection: React.FC = () => {
  const { currentTheme } = useTheme();
  const {} = useTranslation();
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("general");

  const categories = [
    { id: "general", title: "Général", icon: "help-circle", color: "#3B82F6" },
    { id: "technical", title: "Technique", icon: "cog", color: "#8B5CF6" },
    { id: "account", title: "Compte", icon: "account", color: "#10B981" },
    {
      id: "billing",
      title: "Version Bêta",
      icon: "test-tube",
      color: "#F59E0B",
    },
  ];

  const faqItems: FAQItem[] = [
    // Général
    {
      id: "what-is-nyth",
      question: "Qu'est-ce que Nyth ?",
      answer:
        "Nyth est une application de téléprompteur intelligent qui combine enregistrement vidéo et intelligence artificielle. Elle vous aide à créer des scripts, les lire naturellement et enregistrer des vidéos professionnelles.",
      category: "general",
      icon: "information",
      color: "#3B82F6",
    },
    {
      id: "app-features",
      question: "Quelles sont les fonctionnalités disponibles ?",
      answer:
        "Nyth est actuellement en phase de test. Toutes les fonctionnalités sont disponibles gratuitement : éditeur de scripts, téléprompteur intelligent, enregistrement vidéo haute qualité, IA intégrée, thèmes personnalisés et synchronisation cloud.",
      category: "general",
      icon: "star",
      color: "#3B82F6",
    },
    {
      id: "getting-started",
      question: "Comment commencer avec l'application ?",
      answer:
        "1. Accordez les permissions nécessaires\n2. Créez votre premier script\n3. Testez le téléprompteur en mode basique\n4. Enregistrez votre première vidéo\n5. Explorez les fonctionnalités IA",
      category: "general",
      icon: "play-circle",
      color: "#3B82F6",
    },

    // Technique
    {
      id: "video-quality",
      question: "Comment améliorer la qualité vidéo ?",
      answer:
        "Utilisez un bon éclairage, stabilisez votre appareil, choisissez la résolution maximale supportée, activez la stabilisation et assurez-vous d'avoir suffisamment d'espace de stockage.",
      category: "technical",
      icon: "video",
      color: "#8B5CF6",
    },
    {
      id: "ai-not-working",
      question: "L'IA ne fonctionne pas, que faire ?",
      answer:
        "Vérifiez vos clés API dans Paramètres → IA, testez votre connexion internet, essayez un autre provider (Gemini/Cohere gratuits), et redémarrez l'application si nécessaire.",
      category: "technical",
      icon: "robot",
      color: "#8B5CF6",
    },
    {
      id: "storage-space",
      question: "L'app dit que je n'ai pas assez d'espace ?",
      answer:
        "Libérez au moins 2GB d'espace libre. Supprimez les vidéos anciennes, videz le cache des autres apps, ou transférez vos fichiers vers un stockage externe.",
      category: "technical",
      icon: "harddisk",
      color: "#8B5CF6",
    },
    {
      id: "app-crashes",
      question: "L'application plante souvent ?",
      answer:
        "Fermez les autres applications, redémarrez votre appareil, mettez à jour l'app, réduisez la qualité vidéo si votre appareil est ancien, et contactez le support si le problème persiste.",
      category: "technical",
      icon: "alert-circle",
      color: "#8B5CF6",
    },

    // Compte
    {
      id: "create-account",
      question: "Comment créer un compte ?",
      answer:
        "Appuyez sur 'Créer un compte' dans l'écran de connexion, saisissez votre email et mot de passe, confirmez votre email, et connectez-vous pour synchroniser vos données.",
      category: "account",
      icon: "account-plus",
      color: "#10B981",
    },
    {
      id: "forgot-password",
      question: "J'ai oublié mon mot de passe ?",
      answer:
        "Appuyez sur 'Mot de passe oublié' dans l'écran de connexion, saisissez votre email, vérifiez votre boîte mail (et spam), et suivez les instructions pour réinitialiser.",
      category: "account",
      icon: "key",
      color: "#10B981",
    },
    {
      id: "guest-mode",
      question: "Puis-je utiliser l'app sans compte ?",
      answer:
        "Oui, le mode invité permet d'utiliser toutes les fonctionnalités de base. Cependant, vos données ne seront pas sauvegardées dans le cloud et vous perdrez tout en désinstallant l'app.",
      category: "account",
      icon: "account-question",
      color: "#10B981",
    },

    // Phase de test
    {
      id: "test-phase",
      question: "L'application est-elle gratuite ?",
      answer:
        "Oui ! Nyth est actuellement en phase de test bêta. Toutes les fonctionnalités sont gratuites pendant cette période. Profitez-en pour explorer toutes les possibilités de l'application.",
      category: "billing",
      icon: "gift",
      color: "#F59E0B",
    },
    {
      id: "future-pricing",
      question: "Y aura-t-il des frais à l'avenir ?",
      answer:
        "Un système d'abonnement pourrait être introduit après la phase de test, mais les utilisateurs bêta bénéficieront d'avantages spéciaux. Vous serez informés à l'avance de tout changement.",
      category: "billing",
      icon: "information",
      color: "#F59E0B",
    },
  ];

  const quickActions: QuickAction[] = [
    {
      id: "contact-support",
      title: "Contacter le Support",
      description: "Besoin d'aide personnalisée ?",
      icon: "email",
      color: "#3B82F6",
      action: () => Linking.openURL("mailto:support.aicampromt@icloud.com"),
    },
    {
      id: "report-bug",
      title: "Signaler un Bug",
      description: "Aidez-nous à améliorer l'app",
      icon: "bug",
      color: "#EF4444",
      action: () => Linking.openURL("mailto:bugs.ai@icloud.com"),
    },
    {
      id: "feature-request",
      title: "Suggérer une Fonctionnalité",
      description: "Partagez vos idées",
      icon: "lightbulb",
      color: "#10B981",
      action: () => Linking.openURL("mailto:features.ai@icloud.com"),
    },
    {
      id: "community",
      title: "Rejoindre la Communauté",
      description: "Discord & réseaux sociaux",
      icon: "account-group",
      color: "#8B5CF6",
      action: () => Linking.openURL("https://discord.gg/nyth"),
    },
  ];

  const filteredFAQ = faqItems.filter(
    (item) => item.category === activeCategory
  );

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  return (
    <ScrollView
      style={tw`flex-1`}
      contentContainerStyle={tw`pb-6`}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(600)} style={tw`p-4`}>
        <Text
          style={[
            tw`text-xl font-bold mb-2`,
            { color: currentTheme.colors.text },
          ]}
        >
          🚀 Aide Rapide
        </Text>
        <Text
          style={[tw`text-sm`, { color: currentTheme.colors.textSecondary }]}
        >
          Solutions instantanées et réponses aux questions fréquentes
        </Text>
      </Animated.View>

      {/* Actions Rapides */}
      <Animated.View
        entering={FadeInDown.delay(200).duration(600)}
        style={tw`px-4 mb-6`}
      >
        <Text
          style={[
            tw`text-lg font-semibold mb-3`,
            { color: currentTheme.colors.text },
          ]}
        >
          Actions Rapides
        </Text>
        <View style={tw`flex-row flex-wrap justify-between`}>
          {quickActions.map((action, index) => (
            <Animated.View
              key={action.id}
              entering={FadeInUp.delay(index * 100).duration(600)}
              style={tw`w-[48%] mb-3`}
            >
              <TouchableOpacity
                onPress={action.action}
                style={[
                  tw`p-4 rounded-xl`,
                  { backgroundColor: currentTheme.colors.surface },
                ]}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    tw`w-10 h-10 rounded-full items-center justify-center mb-3`,
                    { backgroundColor: action.color + "20" },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={action.icon as any}
                    size={20}
                    color={action.color}
                  />
                </View>
                <Text
                  style={[
                    tw`text-sm font-semibold mb-1`,
                    { color: currentTheme.colors.text },
                  ]}
                >
                  {action.title}
                </Text>
                <Text
                  style={[
                    tw`text-xs`,
                    { color: currentTheme.colors.textSecondary },
                  ]}
                >
                  {action.description}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </Animated.View>

      {/* FAQ Section */}
      <View style={tw`px-4`}>
        <Text
          style={[
            tw`text-lg font-semibold mb-3`,
            { color: currentTheme.colors.text },
          ]}
        >
          Questions Fréquentes
        </Text>

        {/* Catégories FAQ */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={tw`mb-4`}
        >
          {categories.map((category, index) => (
            <Animated.View
              key={category.id}
              entering={FadeInDown.delay(index * 50).duration(400)}
            >
              <TouchableOpacity
                onPress={() => setActiveCategory(category.id)}
                style={[
                  tw`mr-3 px-4 py-2 rounded-full flex-row items-center`,
                  {
                    backgroundColor:
                      activeCategory === category.id
                        ? category.color + "20"
                        : currentTheme.colors.surface,
                    borderWidth: 1,
                    borderColor:
                      activeCategory === category.id
                        ? category.color
                        : currentTheme.colors.border,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={category.icon as any}
                  size={16}
                  color={
                    activeCategory === category.id
                      ? category.color
                      : currentTheme.colors.textSecondary
                  }
                  style={tw`mr-2`}
                />
                <Text
                  style={[
                    tw`text-sm font-medium`,
                    {
                      color:
                        activeCategory === category.id
                          ? category.color
                          : currentTheme.colors.text,
                    },
                  ]}
                >
                  {category.title}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </ScrollView>

        {/* Liste FAQ */}
        <LayoutAnimationConfig skipEntering>
          {filteredFAQ.map((faq, index) => (
            <Animated.View
              key={faq.id}
              entering={FadeInDown.delay(index * 100).duration(600)}
              layout={LinearTransition.springify()}
              style={[
                tw`mb-3 rounded-xl overflow-hidden`,
                { backgroundColor: currentTheme.colors.surface },
              ]}
            >
              <TouchableOpacity
                onPress={() => toggleFAQ(faq.id)}
                style={tw`p-4 flex-row items-center`}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    tw`w-8 h-8 rounded-full items-center justify-center mr-3`,
                    { backgroundColor: faq.color + "20" },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={faq.icon as any}
                    size={16}
                    color={faq.color}
                  />
                </View>
                <Text
                  style={[
                    tw`flex-1 text-sm font-medium`,
                    { color: currentTheme.colors.text },
                  ]}
                >
                  {faq.question}
                </Text>
                <MaterialCommunityIcons
                  name={expandedFAQ === faq.id ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={currentTheme.colors.textSecondary}
                />
              </TouchableOpacity>

              {expandedFAQ === faq.id && (
                <Animated.View
                  entering={FadeInDown.duration(300)}
                  style={[
                    tw`px-4 pb-4`,
                    {
                      borderTopWidth: 1,
                      borderTopColor: currentTheme.colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      tw`text-sm leading-6`,
                      { color: currentTheme.colors.textSecondary },
                    ]}
                  >
                    {faq.answer}
                  </Text>
                </Animated.View>
              )}
            </Animated.View>
          ))}
        </LayoutAnimationConfig>
      </View>

      {/* Contact Emergency */}
      <Animated.View
        entering={FadeInUp.delay(800).duration(600)}
        style={tw`mx-4 mt-6`}
      >
        <View
          style={[
            tw`p-4 rounded-xl flex-row items-center`,
            {
              backgroundColor: "#FEF3C7",
              borderLeftWidth: 4,
              borderLeftColor: "#F59E0B",
            },
          ]}
        >
          <MaterialCommunityIcons
            name="phone"
            size={24}
            color="#F59E0B"
            style={tw`mr-3`}
          />
          <View style={tw`flex-1`}>
            <Text
              style={[tw`text-sm font-semibold mb-1`, { color: "#92400E" }]}
            >
              Besoin d'aide urgente ?
            </Text>
            <Text style={[tw`text-xs`, { color: "#92400E" }]}>
              Contactez notre support : support@nyth.app
            </Text>
          </View>
        </View>
      </Animated.View>
    </ScrollView>
  );
};
