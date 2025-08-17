import { useAuth } from "@/contexts/AuthContext";
import { useScripts } from "@/contexts/ScriptsContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useWelcomeBubblePreferences } from "@/hooks/useWelcomeBubblePreferences";
import { ContextualMessageGenerator } from "@/utils/contextualMessages";
import { getDeviceLanguage } from "@/utils/languageDetector";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { PlanningEvent, Goal } from "@/types/planning";
import type { Recording } from "@/types";
import { useNavigation } from "@react-navigation/native";
import { getLocales } from "react-native-localize";
import { useEffect, useRef, useState } from "react";
import { Animated } from "react-native";
import { BUBBLE_DISPLAY_DURATIONS } from "../constants";
import {
  getTimeGreeting,
  detectSystemLanguage,
} from "@/utils/contextual-messages/utils/MessageUtils";

export const useWelcomeBubble = () => {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { scripts } = useScripts();
  const navigation = useNavigation<any>();
  const { shouldShowWelcome, markAsShown, isLoaded } =
    useWelcomeBubblePreferences();

  const [showWelcomeBubble, setShowWelcomeBubble] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [isGeneratingMessage, setIsGeneratingMessage] = useState(false);
  const welcomeBubbleAnim = useRef(new Animated.Value(0)).current;
  const welcomeBubbleScale = useRef(new Animated.Value(0.8)).current;
  const hasShownBubbleRef = useRef(false);

  const displayName = profile?.displayName || user?.name;

  const buildPlanningSuffix = async (isGuest: boolean): Promise<string> => {
    try {
      if (!user?.uid || isGuest) return "";
      const { default: eventsService } = await import(
        "@/services/firebase/planning/eventsService"
      );
      const { goalsService } = await import(
        "@/services/firebase/planning/goalsService"
      );
      const events = (await eventsService.getUserEvents(
        user.uid
      )) as PlanningEvent[];
      const goals = (await goalsService.getUserGoals(user.uid)) as Goal[];
      const now = new Date();
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      const nextDay = new Date(startOfDay);
      nextDay.setDate(nextDay.getDate() + 1);
      const todayEvents = events.filter((e) => {
        const d = new Date(e.startDate);
        return d >= startOfDay && d < nextDay;
      }).length;
      const overdue = events.filter(
        (e) =>
          e.status !== "completed" &&
          e.status !== "cancelled" &&
          new Date(e.endDate) < now
      ).length;
      const activeGoals = goals.filter((g) => g.status === "active").length;
      const systemLanguage = (await detectSystemLanguage()) || "fr";
      const t = (
        fr: string,
        en: string,
        es: string,
        de: string,
        it: string,
        pt: string
      ) => {
        switch (systemLanguage) {
          case "en":
            return en;
          case "es":
            return es;
          case "de":
            return de;
          case "it":
            return it;
          case "pt":
            return pt;
          case "fr":
          default:
            return fr;
        }
      };
      const partToday = `${t(
        "Aujourd'hui",
        "Today",
        "Hoy",
        "Heute",
        "Oggi",
        "Hoje"
      )}: ${todayEvents}`;
      const partOverdue = `${t(
        "en retard",
        "overdue",
        "atrasados",
        "überfällig",
        "in ritardo",
        "atrasados"
      )}: ${overdue}`;
      const partGoals = `${t(
        "objectifs actifs",
        "active goals",
        "objetivos activos",
        "aktive Ziele",
        "obiettivi attivi",
        "objetivos ativos"
      )}: ${activeGoals}`;
      return ` • ${partToday} · ${partOverdue} · ${partGoals}`;
    } catch {
      return "";
    }
  };

  // Fonction pour générer un message contextuel intelligent avec l'IA
  const generateIntelligentWelcomeMessage = async (
    userName: string,
    isGuest: boolean
  ) => {
    try {
      setIsGeneratingMessage(true);

      // Vérifier si on a un service AI disponible
      const { SecureApiKeyManager } = await import(
        "../../../../services/ai/SecureApiKeyManager"
      );
      const hasOpenAI = await SecureApiKeyManager.hasValidKey("openai");
      const hasGemini = await SecureApiKeyManager.hasValidKey("gemini");
      const hasMistral = await SecureApiKeyManager.hasValidKey("mistral");
      const hasCohere = await SecureApiKeyManager.hasValidKey("cohere");
      const hasClaude = await SecureApiKeyManager.hasValidKey("claude");
      const hasPerplexity = await SecureApiKeyManager.hasValidKey("perplexity");
      const hasTogether = await SecureApiKeyManager.hasValidKey("together");
      const hasGroq = await SecureApiKeyManager.hasValidKey("groq");
      const hasFireworks = await SecureApiKeyManager.hasValidKey("fireworks");

      if (
        !hasOpenAI &&
        !hasGemini &&
        !hasMistral &&
        !hasCohere &&
        !hasClaude &&
        !hasPerplexity &&
        !hasTogether &&
        !hasGroq &&
        !hasFireworks
      ) {
        // Fallback aux messages prédéfinis si aucune IA n'est configurée
        return await getFallbackMessage(userName, isGuest);
      }

      // Utiliser le générateur de messages contextuels avancé
      const recordings: Recording[] = [];

      const context = await ContextualMessageGenerator.buildUserContext(
        user,
        scripts,
        recordings,
        false // Pas première connexion
      );

      // Générer le message avec l'IA contextuelle
      const aiGeneratedMessage =
        await ContextualMessageGenerator.generateContextualWelcomeMessage(
          context
        );

      if (aiGeneratedMessage && aiGeneratedMessage.trim()) {
        const planningSuffix = await buildPlanningSuffix(isGuest);
        return `${aiGeneratedMessage.trim()}${planningSuffix}`;
      } else {
        return await getFallbackMessage(userName, isGuest);
      }
    } catch (error) {
      // Fallback vers le générateur de base
      try {
        const recordings: Recording[] = [];
        const context = await ContextualMessageGenerator.buildUserContext(
          user,
          scripts,
          recordings,
          false
        );

        const fallbackMessage =
          await ContextualMessageGenerator.generateWelcomeMessage(context);
        return fallbackMessage.message;
      } catch (fallbackError) {
        return await getFallbackMessage(userName, isGuest);
      }
    } finally {
      setIsGeneratingMessage(false);
    }
  };

  // Messages de fallback si l'IA n'est pas disponible
  const getFallbackMessage = async (userName: string, isGuest: boolean) => {
    // Essayer plusieurs clés possibles
    // Essayer plusieurs clés possibles avec fallback sécurisé
    let systemLanguage =
      (await AsyncStorage.getItem("userLanguage")) ||
      (await AsyncStorage.getItem("@language_preference")) ||
      (await AsyncStorage.getItem("app_language"));

    // Si pas de langue stockée, essayer react-native-localize avec fallback
    if (!systemLanguage) {
      try {
        const locales = getLocales();
        if (locales && locales.length > 0 && locales[0]?.languageCode) {
          systemLanguage = locales[0].languageCode;
        } else {
          systemLanguage = getDeviceLanguage();
        }
      } catch (error) {
        systemLanguage = getDeviceLanguage();
      }
    }

    // S'assurer qu'on a toujours une langue valide
    systemLanguage = systemLanguage || "en";

    const buildPlanningSuffixLocal = async (): Promise<string> => {
      return buildPlanningSuffix(isGuest);
    };

    const hour = new Date().getHours();

    // Obtenir la salutation selon l'heure et la langue
    const getGreetingByLanguage = () => {
      const greetings: {
        [key: string]: {
          morning: string;
          afternoon: string;
          evening: string;
          night: string;
        };
      } = {
        fr: {
          morning: "Bonjour",
          afternoon: "Bon après-midi",
          evening: "Bonsoir",
          night: "Bonne nuit",
        },
        en: {
          morning: "Good morning",
          afternoon: "Good afternoon",
          evening: "Good evening",
          night: "Good night",
        },
        es: {
          morning: "Buenos días",
          afternoon: "Buenas tardes",
          evening: "Buenas tardes",
          night: "Buenas noches",
        },
        ja: {
          morning: "おはようございます",
          afternoon: "こんにちは",
          evening: "こんばんは",
          night: "おやすみなさい",
        },
        de: {
          morning: "Guten Morgen",
          afternoon: "Guten Tag",
          evening: "Guten Abend",
          night: "Gute Nacht",
        },
        it: {
          morning: "Buongiorno",
          afternoon: "Buon pomeriggio",
          evening: "Buonasera",
          night: "Buonanotte",
        },
        pt: {
          morning: "Bom dia",
          afternoon: "Boa tarde",
          evening: "Boa noite",
          night: "Boa noite",
        },
        ru: {
          morning: "Доброе утро",
          afternoon: "Добрый день",
          evening: "Добрый вечер",
          night: "Спокойной ночи",
        },
        ko: {
          morning: "좋은 아침",
          afternoon: "안녕하세요",
          evening: "좋은 저녁",
          night: "안녕히 주무세요",
        },
        zh: {
          morning: "早上好",
          afternoon: "下午好",
          evening: "晚上好",
          night: "晚安",
        },
        ar: {
          morning: "صباح الخير",
          afternoon: "مساء الخير",
          evening: "مساء الخير",
          night: "تصبح على خير",
        },
        hi: {
          morning: "सुप्रभात",
          afternoon: "नमस्ते",
          evening: "शुभ संध्या",
          night: "शुभ रात्रि",
        },
      };

      const langGreetings = greetings[systemLanguage || "en"] || greetings.en;

      if (hour >= 5 && hour < 12) return langGreetings.morning;
      else if (hour >= 12 && hour < 18) return langGreetings.afternoon;
      else if (hour >= 18 && hour < 22) return langGreetings.evening;
      else return langGreetings.night;
    };

    const greeting = await getTimeGreeting(undefined, systemLanguage as string);

    // Messages selon la langue avec plus de contexte
    const planningSuffix = await buildPlanningSuffixLocal();
    if (systemLanguage === "ja") {
      if (isGuest) {
        return `${greeting}！👋 私はあなたのAIアシスタントです。すべての機能を探索して、アカウントを作成して作品を保存してください！${planningSuffix}`;
      }
      const messages = [
        `${greeting} ${userName}さん！🌟 スクリプトの作成やご質問にお答えします。`,
        `${greeting} ${userName}さん！🎬 今日も素晴らしいコンテンツを作成しましょう！`,
        `${greeting} ${userName}さん！✨ クリエイティブなプロジェクトでお手伝いできることはありますか？`,
      ];
      return `${
        messages[Math.floor(Math.random() * messages.length)]
      }${planningSuffix}`;
    }

    // Messages adaptés à la langue détectée
    const scriptsCount = scripts.length;
    let contextualMessages = [];

    // Messages pour les invités
    if (isGuest) {
      if (systemLanguage === "en") {
        return `${greeting}! 👋 I'm your AI assistant. Explore all features and create an account to save your creations!${planningSuffix}`;
      } else if (systemLanguage === "es") {
        return `¡${greeting}! 👋 Soy tu asistente de IA. ¡Explora todas las funciones y crea una cuenta para guardar tus creaciones!${planningSuffix}`;
      } else if (systemLanguage === "de") {
        return `${greeting}! 👋 Ich bin Ihr KI-Assistent. Erkunden Sie alle Funktionen und erstellen Sie ein Konto, um Ihre Kreationen zu speichern!${planningSuffix}`;
      } else if (systemLanguage === "it") {
        return `${greeting}! 👋 Sono il tuo assistente AI. Esplora tutte le funzionalità e crea un account per salvare le tue creazioni!${planningSuffix}`;
      } else if (systemLanguage === "pt") {
        return `${greeting}! 👋 Sou seu assistente de IA. Explore todos os recursos e crie uma conta para salvar suas criações!${planningSuffix}`;
      } else {
        // Fallback français
        return `${greeting} ! 👋 Je suis votre assistant AI. Explorez toutes les fonctionnalités et créez un compte pour sauvegarder vos créations !${planningSuffix}`;
      }
    }

    // Messages pour utilisateurs connectés selon la langue
    if (systemLanguage === "en") {
      if (scriptsCount === 0) {
        contextualMessages = [
          `${greeting} ${userName}! 🌟 Ready to create your first script with AI help?`,
          `${greeting} ${userName}! ✨ Let's start by creating a captivating script together!`,
          `${greeting} ${userName}! 🎬 How about creating your first content today?`,
        ];
      } else if (scriptsCount < 5) {
        contextualMessages = [
          `${greeting} ${userName}! 🚀 You have ${scriptsCount} script${
            scriptsCount > 1 ? "s" : ""
          }. Let's keep creating!`,
          `${greeting} ${userName}! ✨ Your creativity is growing! New project in sight?`,
          `${greeting} ${userName}! 🎯 How can I help you with your projects today?`,
        ];
      } else {
        contextualMessages = [
          `${greeting} ${userName}! 🏆 ${scriptsCount} scripts created! You're productive!`,
          `${greeting} ${userName}! 🌟 Your library is growing well. What will be the next masterpiece?`,
          `${greeting} ${userName}! 🎬 Experienced creator! How can I assist you?`,
        ];
      }
    } else if (systemLanguage === "es") {
      if (scriptsCount === 0) {
        contextualMessages = [
          `¡${greeting} ${userName}! 🌟 ¿Listo para crear tu primer guión con ayuda de la IA?`,
          `¡${greeting} ${userName}! ✨ ¡Comencemos creando un guión cautivador juntos!`,
          `¡${greeting} ${userName}! 🎬 ¿Qué tal si creamos tu primer contenido hoy?`,
        ];
      } else if (scriptsCount < 5) {
        contextualMessages = [
          `¡${greeting} ${userName}! 🚀 Tienes ${scriptsCount} guión${
            scriptsCount > 1 ? "es" : ""
          }. ¡Sigamos creando!`,
          `¡${greeting} ${userName}! ✨ ¡Tu creatividad está creciendo! ¿Nuevo proyecto a la vista?`,
          `¡${greeting} ${userName}! 🎯 ¿Cómo puedo ayudarte con tus proyectos hoy?`,
        ];
      } else {
        contextualMessages = [
          `¡${greeting} ${userName}! 🏆 ¡${scriptsCount} guiones creados! ¡Eres productivo!`,
          `¡${greeting} ${userName}! 🌟 Tu biblioteca está creciendo bien. ¿Cuál será la próxima obra maestra?`,
          `¡${greeting} ${userName}! 🎬 ¡Creador experimentado! ¿Cómo puedo asistirte?`,
        ];
      }
    } else {
      // Fallback français pour les autres langues
      if (scriptsCount === 0) {
        contextualMessages = [
          `${greeting} ${userName} ! 🌟 Prêt à créer votre premier script avec l'aide de l'IA ?`,
          `${greeting} ${userName} ! ✨ Commençons par créer un script captivant ensemble !`,
          `${greeting} ${userName} ! 🎬 Que diriez-vous de créer votre premier contenu aujourd'hui ?`,
        ];
      } else if (scriptsCount < 5) {
        contextualMessages = [
          `${greeting} ${userName} ! 🚀 Vous avez ${scriptsCount} script${
            scriptsCount > 1 ? "s" : ""
          }. Continuons à créer !`,
          `${greeting} ${userName} ! ✨ Votre créativité grandit ! Nouveau projet en vue ?`,
          `${greeting} ${userName} ! 🎯 Comment puis-je vous aider avec vos projets aujourd'hui ?`,
        ];
      } else {
        contextualMessages = [
          `${greeting} ${userName} ! 🏆 ${scriptsCount} scripts créés ! Vous êtes productif !`,
          `${greeting} ${userName} ! 🌟 Votre bibliothèque grandit bien. Quel sera le prochain chef-d'œuvre ?`,
          `${greeting} ${userName} ! 🎬 Créateur expérimenté ! Comment puis-je vous assister ?`,
        ];
      }
    }

    return `${
      contextualMessages[Math.floor(Math.random() * contextualMessages.length)]
    }${planningSuffix}`;
  };

  useEffect(() => {
    const checkAndShowWelcome = async () => {
      // Attendre que les préférences soient chargées
      if (!isLoaded) {
        hasShownBubbleRef.current = false;
        return;
      }

      // Éviter d'afficher la bulle plusieurs fois dans la même session
      if (hasShownBubbleRef.current) {
        return;
      }

      // Vérifier si l'utilisateur veut voir les messages
      const shouldShow = await shouldShowWelcome();
      if (!shouldShow) {
        return;
      }

      if (user && !user.isGuest) {
        const userName =
          displayName || user.email?.split("@")[0] || "cher utilisateur";

        // Générer le message intelligent avec l'IA contextuelle
        const intelligentMessage = await generateIntelligentWelcomeMessage(
          userName,
          false
        );
        setWelcomeMessage(intelligentMessage);
        setShowWelcomeBubble(true);
        hasShownBubbleRef.current = true;

        // Animer l'apparition
        Animated.parallel([
          Animated.timing(welcomeBubbleAnim, {
            toValue: 1,
            duration: BUBBLE_DISPLAY_DURATIONS.animation,
            useNativeDriver: true,
          }),
          Animated.spring(welcomeBubbleScale, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
        ]).start();

        // Marquer comme affiché
        await markAsShown();

        // Masquer après 20 secondes
        setTimeout(() => {
          hideWelcomeBubble();
        }, BUBBLE_DISPLAY_DURATIONS.user);
      } else if (user && user.isGuest) {
        const intelligentMessage = await generateIntelligentWelcomeMessage(
          "invité",
          true
        );
        setWelcomeMessage(intelligentMessage);
        setShowWelcomeBubble(true);
        hasShownBubbleRef.current = true;

        Animated.parallel([
          Animated.timing(welcomeBubbleAnim, {
            toValue: 1,
            duration: BUBBLE_DISPLAY_DURATIONS.animation,
            useNativeDriver: true,
          }),
          Animated.spring(welcomeBubbleScale, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
        ]).start();

        // Marquer comme affiché
        await markAsShown();

        // Masquer après 25 secondes
        setTimeout(() => {
          hideWelcomeBubble();
        }, BUBBLE_DISPLAY_DURATIONS.guest);
      }
    };

    const timer = setTimeout(() => {
      checkAndShowWelcome();
    }, 1500);

    return () => clearTimeout(timer);
  }, [user, displayName, scripts, isLoaded, shouldShowWelcome, markAsShown]);

  // Reset le flag quand l'utilisateur change
  useEffect(() => {
    hasShownBubbleRef.current = false;
  }, [user?.uid]);

  const hideWelcomeBubble = () => {
    Animated.parallel([
      Animated.timing(welcomeBubbleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(welcomeBubbleScale, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowWelcomeBubble(false);
    });
  };

  const handleWelcomeChatPress = () => {
    hideWelcomeBubble();

    navigation.navigate("AIChat", {
      // Passer le message de bienvenue complet comme contexte invisible
      invisibleContext: welcomeMessage,
      returnScreen: "Home",
      isWelcomeMessage: true,
    });
  };

  return {
    showWelcomeBubble,
    welcomeMessage,
    welcomeBubbleAnim,
    welcomeBubbleScale,
    hideWelcomeBubble,
    handleWelcomeChatPress,
    isGeneratingMessage,
  };
};
