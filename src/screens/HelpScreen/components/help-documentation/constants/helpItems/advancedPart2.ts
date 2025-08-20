import { HelpItem } from "../../types";

export const advancedItemsPart2: HelpItem[] = [
  {
    id: "recording-screen-complete",
    title: "Écran d'enregistrement complet",
    description:
      "Guide détaillé de toutes les fonctionnalités d'enregistrement",
    icon: "video-outline",
    color: "#8B5CF6",
    category: "advanced",
    content: [
      {
        type: "text",
        content:
          "L'écran d'enregistrement de Nyth combine enregistrement vidéo professionnel et téléprompteur intelligent avec plus de 25 fonctionnalités avancées.",
      },
      {
        type: "list",
        title: "🎬 Contrôles d'enregistrement principaux :",
        content: [
          "▶️ Démarrer : Lance compte à rebours puis enregistrement",
          "⏸️ Pause/Reprendre : Contrôle combiné intelligent",
          "⏹️ Arrêter : Avec confirmation de sécurité",
          "👁️ Toggle outils : Affiche/masque barre personnalisation",
        ],
      },
      {
        type: "list",
        title: "🎛️ 7 Outils de caméra disponibles :",
        content: [
          "📸 Basculer caméra : Avant/arrière avec recommandations IA",
          "🎨 Couleur texte : 8 couleurs avec aperçu temps réel",
          "🎨 Opacité de l'arrière plan : 0-100% + sélecteur couleur",
          "📏 Taille texte : 16px à 48px avec slider précis",
          "📐 Marges : 0% à 20% pour largeur du texte",
          "💧 Opacité fond : 0-100% + sélecteur couleur",
          "👁️ Indicateurs : Masquer poignées redimensionnement",
          "⚡ Vitesse : 10-100% ajustement temps réel",
        ],
      },
      {
        type: "list",
        title: "🎥 Paramètres vidéo avancés :",
        content: [
          "📹 Qualités : 480p, 720p, 1080p, 4K selon appareil",
          "🎞️ Codecs : H.264 (universel), H.265 (iOS)",
          "📐 Stabilisation : Auto, Standard, Cinématique, Désactivée",
          "📱 Formats : MP4 (Android), MOV (iOS)",
        ],
      },
      {
        type: "list",
        title: "📱 Interface adaptative :",
        content: [
          "📱 Mode Portrait : Contrôles centralisés, téléprompteur pleine largeur",
          "💻 Mode Paysage : Layout 2 colonnes, caméra + téléprompteur séparés",
          "🔄 Adaptation auto : Redimensionnement intelligent des éléments",
          "🎨 Thèmes : 6 thèmes avec couleurs dynamiques",
        ],
      },
      {
        type: "steps",
        title: "🚀 Workflow d'enregistrement complet :",
        content: [
          "Sélectionnez votre script depuis l'accueil",
          "Configurez qualité vidéo et paramètres caméra",
          "Personnalisez téléprompteur (couleur, taille, vitesse)",
          "Testez position et éclairage avec aperçu",
          "Lancez enregistrement avec compte à rebours",
          "Utilisez contrôles pause/reprendre si nécessaire",
          "Arrêtez et prévisualisez votre vidéo",
        ],
      },
      {
        type: "list",
        title: "⏱️ 6 États et transitions :",
        content: [
          "🔄 Chargement : Script en cours de chargement",
          "✅ Prêt : Tous contrôles disponibles",
          "⏰ Compte à rebours : 3-2-1 avec animation",
          "🔴 Enregistrement : Point rouge, téléprompteur actif",
          "⏸️ Pause : Icône orange, défilement arrêté",
          "📹 Prévisualisation : Transition vers écran aperçu",
        ],
      },
      {
        type: "warning",
        content:
          "L'écran d'enregistrement nécessite les permissions caméra et microphone. Assurez-vous d'avoir suffisamment d'espace de stockage avant les enregistrements longs.",
      },
      {
        type: "tip",
        content:
          "Utilisez la caméra avant pour le téléprompteur (contact visuel naturel) et explorez tous les outils de personnalisation pour optimiser votre setup.",
      },
    ],
  },
  {
    id: "ai-settings-complete",
    title: "Paramètres IA - Configuration complète",
    description: "Guide détaillé de tous les paramètres et fonctionnalités IA",
    icon: "cog-outline",
    color: "#8B5CF6",
    category: "advanced",
    content: [
      {
        type: "text",
        content:
          "L'écran Paramètres IA de Nyth centralise toute la configuration des providers d'intelligence artificielle, la gestion des clés API, la sécurité et l'ordre de priorité pour une expérience IA optimisée.",
      },
      {
        type: "list",
        title: "🎯 Fonctionnalités principales :",
        content: [
          "🔧 Configuration de 4 providers IA gratuits + OpenAI premium",
          "🔑 Gestion sécurisée des clés API avec masquage/affichage",
          "📊 Ordre de priorité personnalisable des providers",
          "🔒 Protection sécurisée avancée",
          "⚡ Suppression instantanée et sauvegarde automatique",
          "🛡️ Audit de sécurité des clés avec statuts détaillés",
          "🎨 Interface adaptative avec animations fluides",
        ],
      },
      {
        type: "list",
        title: "🆓 4 Providers IA gratuits disponibles :",
        content: [
          "🟢 Cohere : 5M tokens/mois - Lightning bolt - Vert",
          "🔵 Google Gemini : 5M tokens/mois - Google - Bleu",
          "🔴 Mistral AI : Crédits gratuits - Weather windy - Rouge",
          "🟣 Hugging Face : Open source - Face recognition - Violet",
        ],
      },
      {
        type: "steps",
        title: "🚀 Configuration d'un provider étape par étape :",
        content: [
          "Activez le toggle du provider souhaité",
          "Saisissez votre clé API dans le champ qui apparaît",
          "Utilisez l'œil pour masquer/afficher la clé",
          "Le statut 'Configuré' s'affiche automatiquement",
          "Configurez l'ordre de priorité si plusieurs providers",
          "Sauvegardez avec le bouton en haut à droite",
        ],
      },
      {
        type: "list",
        title: "📊 Gestion de l'ordre de priorité :",
        content: [
          "🔢 Ordre numéroté : 1er, 2ème, 3ème provider utilisé",
          "⚙️ Bouton 'Modifier' : Accès au modal de réorganisation",
          "🔄 Drag & drop : Réorganisez par glisser-déposer",
          "✅ Providers actifs : Colorés selon leur statut",
          "❌ Providers inactifs : Grisés mais dans l'ordre",
          "💾 Sauvegarde automatique des modifications",
        ],
      },
      {
        type: "list",
        title: "🔒 Sécurité biométrique avancée :",
        content: [
          "🔐 Protection globale : Toggle principal ON/OFF",
          "🔑 Protection clés API : Authentification pour accès",
          "⚙️ Protection paramètres : Sécurise modifications",
          "📱 Face ID/Touch ID : Support natif iOS/Android",
          "⏱️ Session 5min : Authentification valide temporairement",
          "🛡️ Données locales : Biométrie jamais partagée",
        ],
      },
      {
        type: "steps",
        title: "🔧 Activation de la protection biométrique :",
        content: [
          "Configurez au moins une clé API (prérequis)",
          "Vérifiez que Face ID/Touch ID est configuré sur l'appareil",
          "Activez le toggle 'Protection biométrique'",
          "Authentifiez-vous pour confirmer l'activation",
          "Choisissez les protections spécifiques (clés/paramètres)",
          "Testez l'authentification si nécessaire",
        ],
      },
      {
        type: "list",
        title: "🛡️ Audit de sécurité des clés API :",
        content: [
          "📋 Liste complète : Toutes les clés configurées",
          "🔍 Détails expandables : Tap pour voir les informations",
          "🗑️ Suppression sélective : Supprimez clés individuellement",
          "📊 Statuts visuels : Indicateurs colorés par provider",
          "🔄 Actualisation temps réel : Vérification automatique",
          "⚠️ Alertes sécurité : Notifications des problèmes",
        ],
      },
      {
        type: "list",
        title: "⚡ Fonctionnalités avancées :",
        content: [
          "💾 Sauvegarde instantanée : Suppression immédiate des clés vides",
          "🎨 Animations fluides : Transitions et feedback visuels",
          "📱 Interface adaptative : Optimisée pour tous les écrans",
          "🔄 Rechargement auto : Mise à jour après modifications",
          "🎯 Validation temps réel : Vérification des clés saisies",
          "🌐 Support multilingue : Interface traduite",
        ],
      },
      {
        type: "warning",
        content:
          "La protection biométrique nécessite au moins une clé API configurée et Face ID/Touch ID activé sur votre appareil. Les clés API sont stockées de manière sécurisée et peuvent être supprimées instantanément.",
      },
      {
        type: "tip",
        content:
          "Commencez avec Gemini ou Cohere pour leurs quotas gratuits généreux. Configurez l'ordre de priorité selon vos préférences : Gemini pour la polyvalence, Mistral pour la créativité, Cohere pour l'analyse. Activez la protection biométrique pour une sécurité maximale.",
      },
    ],
  },
];
