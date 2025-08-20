import { HelpItem } from "../../types";

export const basicsItems: HelpItem[] = [
  {
    id: "first-steps",
    title: "Premiers pas avec Nyth",
    description: "Guide complet pour débuter avec l'application",
    icon: "play-circle",
    color: "#3B82F6",
    category: "basics",
    content: [
      {
        type: "text",
        content:
          "Bienvenue dans Nyth ! Cette application transforme votre appareil en un téléprompteur professionnel avec intelligence artificielle intégrée.",
      },
      {
        type: "steps",
        title: "Étapes pour commencer :",
        content: [
          "Accordez les permissions nécessaires (caméra, microphone, stockage)",
          "Créez votre premier script avec l'éditeur intégré",
          "Configurez les paramètres selon vos préférences",
          "Testez le téléprompteur en mode basique",
          "Enregistrez votre première vidéo",
        ],
      },
      {
        type: "tip",
        content:
          "Commencez par un script court pour vous familiariser avec l'interface avant de créer des contenus plus longs.",
      },
    ],
  },
  {
    id: "create-script",
    title: "Créer et éditer un script",
    description: "Maîtrisez l'éditeur de scripts et ses fonctionnalités",
    icon: "script-text",
    color: "#3B82F6",
    category: "basics",
    content: [
      {
        type: "text",
        content:
          "L'éditeur de Nyth offre une expérience d'écriture professionnelle avec interface adaptative, outils IA intégrés et statistiques en temps réel.",
      },
      {
        type: "steps",
        title: "Créer un nouveau script :",
        content: [
          "Appuyez sur le bouton '+' depuis l'écran d'accueil",
          "Saisissez un titre descriptif pour votre script",
          "Rédigez votre contenu dans l'éditeur principal",
          "Utilisez les 4 actions IA pour optimiser votre texte",
          "Sauvegardez et passez directement à l'enregistrement",
        ],
      },
      {
        type: "list",
        title: "🎯 4 Actions IA spécialisées :",
        content: [
          "✅ Corriger : Orthographe, grammaire et ponctuation automatiques",
          "⭐ Améliorer : Optimise clarté, engagement et structure",
          "📊 Analyser : Évalue ton, points forts et public cible",
          "🤖 Assistant IA : Ouvre le chat pour aide personnalisée",
        ],
      },
      {
        type: "list",
        title: "📊 Statistiques en temps réel :",
        content: [
          "📝 Compteur de mots avec mise à jour instantanée",
          "⏱️ Estimation de durée (basée sur 150 mots/minute)",
          "🔤 Nombre de caractères total",
          "📄 Compteur de paragraphes (mode paysage)",
          "💾 Indicateur de dernière sauvegarde",
        ],
      },
      {
        type: "list",
        title: "🔧 Fonctionnalités avancées :",
        content: [
          "💾 Sauvegarde automatique intelligente avec notifications",
          "📱 Interface adaptative : Portrait simple, Paysage 2 colonnes",
          "⌨️ Contrôle du clavier : Toggle activation/désactivation",
          "📄 Import de fichiers TXT avec préservation du formatage",
          "🎨 Nettoyage automatique des balises HTML/Markdown",
          "🔄 Intégration complète avec l'Assistant IA",
        ],
      },
      {
        type: "steps",
        title: "🚀 Workflow complet d'édition :",
        content: [
          "Créez ou importez votre script",
          "Utilisez les actions IA pour optimiser le contenu",
          "Surveillez les statistiques en temps réel",
          "Profitez de la sauvegarde automatique",
          "Cliquez 'Suivant' pour accéder au téléprompteur",
          "Choisissez 'Avec Caméra' pour enregistrer",
        ],
      },
      {
        type: "list",
        title: "📐 Modes d'affichage :",
        content: [
          "📱 Portrait : Éditeur pleine largeur, statistiques en en-tête",
          "💻 Paysage : 2 colonnes (éditeur + panneau statistiques)",
          "🔄 Adaptation automatique selon l'orientation",
          "📊 Panneau statistiques détaillé en mode paysage",
        ],
      },
      {
        type: "tip",
        content:
          "Utilisez le mode paysage sur tablette pour une expérience optimale avec statistiques détaillées et panneau de prévisualisation. Le bouton clavier flottant permet de masquer/afficher le clavier facilement.",
      },
      {
        type: "warning",
        content:
          "La sauvegarde automatique fonctionne en arrière-plan. Attendez la confirmation '💾' avant de quitter l'éditeur pour éviter toute perte de données.",
      },
    ],
  },
  {
    id: "recording-basics",
    title: "Enregistrement vidéo de base",
    description: "Apprenez à enregistrer vos premières vidéos",
    icon: "video",
    color: "#3B82F6",
    category: "basics",
    content: [
      {
        type: "text",
        content:
          "L'enregistrement vidéo avec téléprompteur est la fonctionnalité principale de Nyth.",
      },
      {
        type: "steps",
        title: "Processus d'enregistrement :",
        content: [
          "Sélectionnez ou créez un script",
          "Choisissez 'Avec Caméra' dans le modal",
          "Ajustez les paramètres de la caméra",
          "Configurez la vitesse du téléprompteur",
          "Lancez l'enregistrement et lisez votre script",
        ],
      },
      {
        type: "warning",
        content:
          "Assurez-vous d'avoir suffisamment d'espace de stockage avant de commencer un enregistrement long.",
      },
    ],
  },
];
