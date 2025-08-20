import { HelpItem } from "../../types";

export const advancedItems: HelpItem[] = [
  {
    id: "ai-features",
    title: "Utilisation avancée de l'IA",
    description:
      "Exploitez toute la puissance de l'intelligence artificielle",
    icon: "robot",
    color: "#8B5CF6",
    category: "advanced",
    content: [
      {
        type: "text",
        content:
          "Nyth intègre plusieurs modèles d'IA pour vous assister dans la création de contenu.",
      },
      {
        type: "list",
        title: "Providers IA supportés :",
        content: [
          "OpenAI (GPT-4, GPT-3.5) - Payant",
          "Google Gemini - 5M tokens/mois gratuits",
          "Mistral AI - Crédits gratuits",
          "Cohere - 5M tokens/mois gratuits",
          "Hugging Face - Modèles open source",
        ],
      },
      {
        type: "steps",
        title: "Configuration des clés API :",
        content: [
          "Allez dans Paramètres → IA",
          "Activez les providers souhaités",
          "Saisissez vos clés API",
          "Testez la connexion",
          "Configurez l'ordre de priorité",
        ],
      },
      {
        type: "tip",
        content:
          "Commencez avec Gemini ou Cohere qui offrent des quotas gratuits généreux pour tester les fonctionnalités IA.",
      },
    ],
  },
  {
    id: "video-quality",
    title: "Optimisation de la qualité vidéo",
    description: "Paramètres avancés pour des vidéos professionnelles",
    icon: "camera-iris",
    color: "#8B5CF6",
    category: "advanced",
    content: [
      {
        type: "text",
        content:
          "Nyth offre des contrôles avancés pour optimiser la qualité de vos enregistrements.",
      },
      {
        type: "list",
        title: "Paramètres de qualité :",
        content: [
          "📹 Résolution : 720p, 1080p, 4K (selon l'appareil)",
          "🎞️ Codec : H.264, H.265/HEVC",
          "📊 Débit : Automatique ou manuel",
          "🎯 Stabilisation : Optique/Électronique",
          "🎨 Format : 16:9, 9:16, 1:1, 4:3",
        ],
      },
      {
        type: "warning",
        content:
          "Les résolutions élevées (4K) consomment beaucoup d'espace de stockage et de batterie. Utilisez-les seulement si nécessaire.",
      },
      {
        type: "tip",
        content:
          "Pour les réseaux sociaux, 1080p est généralement suffisant et offre le meilleur compromis qualité/taille.",
      },
    ],
  },
  {
    id: "ai-memory",
    title: "Mémoire IA - Personnalisation intelligente",
    description:
      "Système intelligent qui apprend vos préférences pour une expérience personnalisée",
    icon: "brain",
    color: "#8B5CF6",
    category: "advanced",
    content: [
      {
        type: "text",
        content:
          "La mémoire IA de Nyth analyse intelligemment vos conversations pour se souvenir de vos préférences, habitudes et besoins. Cette fonctionnalité révolutionnaire permet à l'IA d'offrir des suggestions toujours plus pertinentes.",
      },
      {
        type: "list",
        title: "🧠 Fonctionnalités principales :",
        content: [
          "Analyse automatique des conversations importantes",
          "Stockage sélectif des préférences utilisateur",
          "Personnalisation des réponses futures",
          "Apprentissage continu de vos habitudes",
          "Contrôle total avec toggle ON/OFF",
        ],
      },
      {
        type: "steps",
        title: "Activation de la mémoire IA :",
        content: [
          "Allez dans Paramètres → Mémoire IA",
          "Activez le toggle 'Mémoire IA'",
          "Confirmez l'activation",
          "L'IA commencera à apprendre de vos interactions",
          "Vous pouvez désactiver à tout moment",
        ],
      },
      {
        type: "steps",
        title: "🔴 Désactiver la mémoire IA :",
        content: [
          "Allez dans Paramètres → Mémoire IA",
          "Désactivez le toggle 'Mémoire IA'",
          "Confirmez la désactivation",
          "L'IA arrêtera d'analyser vos conversations",
          "Les données existantes sont préservées",
        ],
      },
      {
        type: "steps",
        title: "🗑️ Supprimer toutes les données mémorisées :",
        content: [
          "Allez dans Paramètres → Mémoire IA",
          "Appuyez sur 'Supprimer les données'",
          "Confirmez la suppression définitive",
          "Toutes les informations mémorisées seront effacées",
          "Cette action est irréversible",
        ],
      },
      {
        type: "list",
        title: "🗂️ Types d'informations mémorisées :",
        content: [
          "Préférences : Styles d'écriture, tons favoris",
          "Habitudes : Fréquence de création, processus créatifs",
          "Objectifs : Buts créatifs, métriques de succès",
          "Compétences : Niveaux de maîtrise, expertises",
          "Contexte : Projets en cours, environnement de travail",
          "Instructions : Demandes récurrentes, formats préférés",
        ],
      },
      {
        type: "warning",
        content:
          "La mémoire IA est entièrement sous votre contrôle. Vous pouvez l'activer, la désactiver ou supprimer toutes les données à tout moment dans les paramètres.",
      },
      {
        type: "tip",
        content:
          "Pour de meilleurs résultats, soyez explicite dans vos préférences : 'Je préfère les scripts de 2 minutes pour TikTok' plutôt que 'Quelque chose de court'.",
      },
    ],
  },
]; 