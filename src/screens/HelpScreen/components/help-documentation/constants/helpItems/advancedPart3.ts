import { HelpItem } from "../../types";

export const advancedItemsPart3: HelpItem[] = [
  {
    id: "ai-generator-complete",
    title: "Générateur IA - Création automatique de scripts",
    description:
      "Guide complet du générateur IA avec tous ses paramètres avancés",
    icon: "auto-fix",
    color: "#8B5CF6",
    category: "advanced",
    content: [
      {
        type: "text",
        content:
          "Le Générateur IA de Nyth crée automatiquement des scripts personnalisés selon vos besoins. Il combine intelligence artificielle avancée, suggestions contextuelles et paramètres précis pour générer du contenu optimisé.",
      },
      {
        type: "list",
        title: "🎯 Fonctionnalités principales :",
        content: [
          "🤖 Génération automatique de scripts avec 5+ modèles IA",
          "📝 Saisie intelligente avec suggestions par catégories",
          "⚙️ Paramètres avancés : ton, plateforme, créativité, durée",
          "📊 Indicateur de statut IA en temps réel",
          "🎨 Interface adaptative avec animations fluides",
          "💡 Suggestions contextuelles par domaines d'expertise",
          "🔄 Multi-providers avec basculement automatique",
        ],
      },
      {
        type: "steps",
        title: "🚀 Processus de génération complet :",
        content: [
          "Saisissez votre sujet ou choisissez une suggestion",
          "Sélectionnez la catégorie (Business, Lifestyle, Tech, Créatif)",
          "Configurez les paramètres : ton, plateforme, créativité",
          "Ajustez la durée cible et le niveau de créativité",
          "Vérifiez le statut IA (providers disponibles)",
          "Lancez la génération et attendez le résultat",
          "Éditez le script généré si nécessaire",
        ],
      },
      {
        type: "list",
        title: "💡 Suggestions intelligentes par catégorie :",
        content: [
          "💼 Business : Productivité, leadership, négociation, économies",
          "🌱 Lifestyle : Recettes, exercices, routines, bien-être",
          "💻 Tech : Tendances IA, apps essentielles, sécurité digitale",
          "🎨 Créatif : Photo parfaite, montage vidéo, design graphique",
        ],
      },
      {
        type: "list",
        title: "⚙️ Paramètres de génération avancés :",
        content: [
          "🎭 Tons : Professionnel, décontracté, enthousiasmant, informatif, humoristique",
          "📱 Plateformes : TikTok, YouTube, Instagram, LinkedIn, Facebook",
          "🎨 Créativité : Slider 0-100% pour contrôler l'originalité",
          "⏱️ Durée : 15s à 10min avec ajustement précis",
          "📏 Caractères max : Limitation automatique selon plateforme",
        ],
      },
      {
        type: "list",
        title: "📊 Indicateur de statut IA :",
        content: [
          "✅ Vert : APIs configurées et opérationnelles",
          "❌ Rouge : Aucune API configurée",
          "🔄 Actualisation : Tap pour vérifier les providers",
          "📋 Détails : Affiche les APIs disponibles",
          "⚡ Temps réel : Vérification automatique des connexions",
        ],
      },
      {
        type: "steps",
        title: "🔧 Configuration des providers IA :",
        content: [
          "Accédez aux paramètres via le bouton 'Configurer'",
          "Activez vos providers préférés (OpenAI, Gemini, Mistral)",
          "Saisissez vos clés API personnelles",
          "Testez les connexions individuellement",
          "Configurez l'ordre de priorité des providers",
          "Retournez au générateur pour commencer",
        ],
      },
      {
        type: "warning",
        content:
          "Le générateur nécessite au moins un provider IA configuré. Sans configuration, seul le bouton 'Configurer' sera disponible. Vérifiez vos clés API si la génération échoue.",
      },
      {
        type: "tip",
        content:
          "Utilisez des sujets spécifiques pour de meilleurs résultats : 'Comment optimiser son workspace à domicile' plutôt que 'Productivité'. Ajustez la créativité selon vos besoins : 30% pour du contenu factuel, 80% pour du contenu original.",
      },
    ],
  },
  {
    id: "ai-content-length-controls",
    title: "Contrôles de longueur de contenu IA",
    description: "Maîtrisez les nouveaux paramètres de longueur précise",
    icon: "ruler-square",
    color: "#8B5CF6",
    category: "advanced",
    content: [
      {
        type: "text",
        content:
          "Nyth vous offre maintenant un contrôle précis sur la longueur de vos scripts générés avec trois types de paramètres : mots, caractères et paragraphes. Ces contrôles fonctionnent avec un système de priorité intelligent.",
      },
      {
        type: "list",
        title: "🎛️ 3 Types de contrôles disponibles :",
        content: [
          "📝 Nombre de mots : Contrôle précis (10-2000 mots)",
          "🔤 Nombre de caractères : Optimisé par plateforme (50-50000)",
          "📄 Nombre de paragraphes : Structure du contenu (1-50)",
          "⏱️ Durée du script : Estimation automatique (15s-10min)",
          "🧠 Système de priorité intelligent intégré",
        ],
      },
      {
        type: "list",
        title: "📝 Contrôle des mots - Presets rapides :",
        content: [
          "50 mots : Posts courts, descriptions produits",
          "100 mots : Stories Instagram, tweets longs",
          "200 mots : Scripts TikTok standards",
          "300 mots : Vidéos YouTube Shorts",
          "500 mots : Contenu LinkedIn, présentations",
          "1000 mots : Articles longs, formations",
        ],
      },
      {
        type: "list",
        title: "🔤 Contrôle des caractères - Optimisé plateformes :",
        content: [
          "280 (Twitter) : Tweets avec contraintes strictes",
          "500 (LinkedIn) : Posts professionnels optimaux",
          "1000 (Instagram) : Descriptions complètes",
          "2200 (TikTok) : Descriptions vidéo détaillées",
          "5000 (Facebook) : Posts longs avec engagement",
          "10000 (YouTube) : Descriptions complètes avec mots-clés",
        ],
      },
      {
        type: "list",
        title: "📄 Contrôle des paragraphes - Structure :",
        content: [
          "1 paragraphe : Contenu compact, messages directs",
          "3 paragraphes : Structure classique (intro-corps-conclusion)",
          "5 paragraphes : Développement détaillé",
          "7 paragraphes : Contenu long avec transitions",
          "10+ paragraphes : Articles complets, formations",
        ],
      },
      {
        type: "steps",
        title: "🧠 Système de priorité intelligent :",
        content: [
          "1️⃣ PRIORITÉ ABSOLUE : Nombre de mots (si défini)",
          "2️⃣ FALLBACK : Durée du curseur (si pas de mots)",
          "3️⃣ PAR DÉFAUT : Durée moyenne (~150-180 mots)",
          "➕ COMPLÉMENT : Caractères et paragraphes (si définis)",
          "🔄 Interface adaptative avec feedback visuel",
        ],
      },
      {
        type: "list",
        title: "💡 Interface avec feedback intelligent :",
        content: [
          "💡 'Le nombre de mots défini (300) a priorité sur la durée'",
          "ℹ️ 'La durée détermine automatiquement le nombre de mots'",
          "📊 Résumé des limites définies en temps réel",
          "🎯 Onglets organisés pour navigation facile",
          "✅ Validation en temps réel avec messages d'erreur",
        ],
      },
      {
        type: "steps",
        title: "🚀 Utilisation optimale :",
        content: [
          "Accédez à l'onglet 'Avancé' du générateur IA",
          "Ouvrez la section 'Longueur du contenu'",
          "Choisissez votre onglet : Mots, Caractères ou Paragraphes",
          "Saisissez une valeur ou utilisez les presets",
          "Observez le feedback visuel pour comprendre la priorité",
          "Combinez plusieurs types pour un contrôle précis",
          "Générez et ajustez selon le résultat",
        ],
      },
      {
        type: "list",
        title: "🎯 Scénarios d'usage pratiques :",
        content: [
          "📱 TikTok : 200 mots + 2200 caractères + 3 paragraphes",
          "💼 LinkedIn : 300 mots + 500 caractères + 5 paragraphes",
          "📺 YouTube : 500 mots + durée 3min + 7 paragraphes",
          "📖 Blog : 1000 mots + 10 paragraphes (sans limite caractères)",
          "🐦 Twitter : 280 caractères uniquement (ignore mots/paragraphes)",
        ],
      },
      {
        type: "warning",
        content:
          "Les contraintes multiples peuvent créer des conflits. L'IA privilégiera toujours le nombre de mots si défini, puis essaiera de respecter les autres limites dans la mesure du possible.",
      },
      {
        type: "tip",
        content:
          "Pour de meilleurs résultats, utilisez un seul type de contrainte principale (mots OU caractères) et ajoutez les paragraphes comme structure. Exemple : 300 mots + 5 paragraphes fonctionne mieux que 300 mots + 1000 caractères + 5 paragraphes.",
      },
    ],
  },
];
