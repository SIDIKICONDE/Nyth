import { Script } from "@/types";
import { NavigationProp } from "@react-navigation/native";
import { TFunction } from "i18next";
import { FeatureCard, Tip, TutorialCard } from "../types";

export const getTutorials = (
  t: TFunction,
  navigation: NavigationProp<any>,
  scripts: Script[]
): TutorialCard[] => [
  {
    id: "1",
    title: t(
      "help.tutorials.firstScript.title",
      "📝 Créer votre premier script"
    ),
    description: t(
      "help.tutorials.firstScript.desc",
      "Apprenez à créer et éditer un script pour votre téléprompter"
    ),
    icon: "script-text-outline",
    color: "#3B82F6",
    duration: "3 min",
    action: () => navigation.navigate("Editor", {}),
  },
  {
    id: "2",
    title: t("help.tutorials.recording.title", "🎥 Enregistrer une vidéo"),
    description: t(
      "help.tutorials.recording.desc",
      "Maîtrisez les paramètres d'enregistrement et le téléprompter"
    ),
    icon: "video-outline",
    color: "#EF4444",
    duration: "5 min",
    action: () => {
      if (scripts.length > 0) {
        // Vérifier que le script existe vraiment
        const firstScript = scripts.find((s) => s.id && s.content);
        if (firstScript) {
          navigation.navigate("Recording", { scriptId: firstScript.id });
        } else {
          navigation.navigate("Editor", {});
        }
      } else {
        navigation.navigate("Editor", {});
      }
    },
  },
  {
    id: "3",
    title: t("help.tutorials.ai.title", "🤖 Utiliser l'IA"),
    description: t(
      "help.tutorials.ai.desc",
      "Découvrez comment générer des scripts avec l'intelligence artificielle"
    ),
    icon: "robot-outline",
    color: "#8B5CF6",
    duration: "4 min",
    action: () => navigation.navigate("AIGenerator"),
  },
  {
    id: "4",
    title: t(
      "help.tutorials.teleprompter.title",
      "📜 Configurer le téléprompter"
    ),
    description: t(
      "help.tutorials.teleprompter.desc",
      "Personnalisez la vitesse, la taille et l'apparence du texte"
    ),
    icon: "speedometer",
    color: "#10B981",
    duration: "2 min",
    action: () => {
      const validScript = scripts.find((s) => s.id && s.content);
      navigation.navigate("Settings", { scriptId: validScript?.id || "" });
    },
  },
  {
    id: "5",
    title: t(
      "help.tutorials.planning.title",
      "📅 Organiser avec la planification"
    ),
    description: t(
      "help.tutorials.planning.desc",
      "Créez des événements, gérez vos objectifs et suivez votre progression"
    ),
    icon: "calendar-outline",
    color: "#F59E0B",
    duration: "6 min",
    action: () => navigation.navigate("Planning"),
  },
];

export const getFeatures = (t: TFunction): FeatureCard[] => [
  {
    id: "1",
    title: t("help.features.aiPower.title", "IA Puissante"),
    description: t(
      "help.features.aiPower.desc",
      "Génération de scripts intelligents avec plusieurs modèles"
    ),
    icon: "brain",
    gradient: ["#667eea", "#764ba2"],
  },
  {
    id: "2",
    title: t("help.features.proRecording.title", "Enregistrement Pro"),
    description: t(
      "help.features.proRecording.desc",
      "Qualité 4K, stabilisation et optimisation audio"
    ),
    icon: "camera-iris",
    gradient: ["#f093fb", "#f5576c"],
  },
  {
    id: "3",
    title: t(
      "help.features.smartTeleprompter.title",
      "Téléprompter Intelligent"
    ),
    description: t(
      "help.features.smartTeleprompter.desc",
      "5 modes de défilement adaptatifs"
    ),
    icon: "text-box-outline",
    gradient: ["#4facfe", "#00f2fe"],
  },
  {
    id: "4",
    title: t("help.features.socialShare.title", "Partage Social"),
    description: t(
      "help.features.socialShare.desc",
      "Export optimisé pour toutes les plateformes"
    ),
    icon: "share-variant",
    gradient: ["#fa709a", "#fee140"],
  },
];

export const getTips = (t: TFunction): Tip[] => [
  {
    id: "1",
    icon: "💡",
    text: t(
      "help.tips.doubleTap",
      "Double-tap sur le téléprompter pour mettre en pause"
    ),
  },
  {
    id: "2",
    icon: "🎯",
    text: t(
      "help.tips.swipeScript",
      "Glissez sur un script pour voir les options rapides"
    ),
  },
  {
    id: "3",
    icon: "⚡",
    text: t(
      "help.tips.voiceCommands",
      "Utilisez Ctrl+Space pour les commandes vocales"
    ),
  },
  {
    id: "4",
    icon: "🔒",
    text: t("help.tips.backup", "Vos scripts sont sauvegardés automatiquement"),
  },
];
