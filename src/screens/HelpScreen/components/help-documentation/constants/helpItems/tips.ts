import { HelpItem } from "../../types";

export const tipsItems: HelpItem[] = [
  {
    id: "productivity-tips",
    title: "Astuces de productivité",
    description: "Techniques pour optimiser votre workflow",
    icon: "lightning-bolt-circle",
    color: "#10B981",
    category: "tips",
    content: [
      {
        type: "text",
        content: "Maximisez votre efficacité avec ces astuces de productivité.",
      },
      {
        type: "list",
        title: "⚡ Raccourcis et gestes :",
        content: [
          "Double-tap sur le téléprompteur pour pause",
          "Swipe sur un script pour les options rapides",
          "Appui long pour sélectionner plusieurs éléments",
          "Pinch pour zoomer dans l'éditeur",
          "Shake pour annuler la dernière action",
        ],
      },
      {
        type: "list",
        title: "📝 Astuces d'écriture :",
        content: [
          "Utilisez des phrases courtes pour faciliter la lecture",
          "Ajoutez des pauses avec '...' ou '---'",
          "Structurez avec des paragraphes courts",
          "Testez la prononciation des mots difficiles",
          "Préparez plusieurs versions pour différentes durées",
        ],
      },
      {
        type: "list",
        title: "🎛️ Contrôles de longueur IA :",
        content: [
          "Définissez des presets personnels : TikTok = 200 mots",
          "Utilisez les boutons rapides pour gagner du temps",
          "Combinez durée + mots pour double contrôle",
          "Sauvegardez vos configurations optimales",
          "Testez différentes longueurs pour votre audience",
        ],
      },
      {
        type: "tip",
        content:
          "Créez des modèles de scripts pour vos types de contenus récurrents (intro, outro, transitions). Utilisez les nouveaux contrôles de longueur pour standardiser vos formats selon les plateformes.",
      },
    ],
  },
  {
    id: "ai-memory-optimization",
    title: "Optimiser la mémoire IA",
    description: "Conseils pour maximiser l'efficacité de la mémoire IA",
    icon: "brain",
    color: "#10B981",
    category: "tips",
    content: [
      {
        type: "text",
        content:
          "Maximisez l'efficacité de la mémoire IA avec ces conseils pratiques pour une expérience personnalisée optimale.",
      },
      {
        type: "list",
        title: "🎯 Pour de meilleurs résultats :",
        content: [
          "Soyez explicite : 'Je préfère les scripts de 2 minutes pour TikTok'",
          "Mentionnez vos préférences : 'Mon style c'est décontracté mais professionnel'",
          "Décrivez vos problèmes : 'J'ai du mal avec les transitions entre paragraphes'",
          "Partagez vos objectifs : 'Je veux atteindre 10K followers sur Instagram'",
          "Indiquez votre équipement : 'J'utilise un iPhone 14 Pro'",
        ],
      },
      {
        type: "list",
        title: "🔒 Pour la confidentialité :",
        content: [
          "Activez seulement si vous faites confiance au système",
          "Vérifiez régulièrement ce qui est stocké",
          "Désactivez pour les conversations sensibles",
          "Supprimez l'historique si nécessaire",
          "Évitez de partager des informations personnelles sensibles",
        ],
      },
      {
        type: "steps",
        title: "🗂️ Gestion intelligente des données :",
        content: [
          "Consultez périodiquement : Paramètres → Mémoire IA → Données stockées",
          "Nettoyage sélectif : Supprimez seulement les données obsolètes",
          "Pause temporaire : Désactivez pendant les conversations privées",
          "Sauvegarde avant suppression : Exportez si vous voulez garder une trace",
          "Redémarrage propre : Suppression totale + réactivation pour repartir à zéro",
        ],
      },
      {
        type: "warning",
        content:
          "Ne mentionnez jamais de mots de passe, informations financières ou données personnelles sensibles dans vos conversations avec l'IA.",
      },
      {
        type: "tip",
        content:
          "La mémoire IA devient plus efficace avec le temps. Plus vous l'utilisez en étant précis sur vos préférences, meilleures seront les suggestions.",
      },
    ],
  },
  {
    id: "content-length-mastery",
    title: "Maîtriser les contrôles de longueur",
    description: "Optimisez vos scripts avec les contrôles de longueur précis",
    icon: "ruler-square-compass",
    color: "#10B981",
    category: "tips",
    content: [
      {
        type: "text",
        content:
          "Maximisez l'efficacité des nouveaux contrôles de longueur pour créer des scripts parfaitement adaptés à chaque plateforme et usage.",
      },
      {
        type: "list",
        title: "🎯 Stratégies par plateforme :",
        content: [
          "📱 TikTok : 150-250 mots, 3 paragraphes max, rythme rapide",
          "📺 YouTube Shorts : 200-400 mots, 5 paragraphes, plus détaillé",
          "💼 LinkedIn : 300-500 mots, structure professionnelle",
          "📸 Instagram : 100-300 mots selon format (post/story/reel)",
          "🐦 Twitter : 280 caractères, impact maximum en minimum d'espace",
        ],
      },
      {
        type: "list",
        title: "⚡ Presets efficaces à retenir :",
        content: [
          "Teaser produit : 50 mots, 1 paragraphe, punch immédiat",
          "Tutoriel express : 200 mots, 5 paragraphes (étapes)",
          "Présentation perso : 300 mots, 3 paragraphes (qui/quoi/pourquoi)",
          "Review détaillée : 500 mots, 7 paragraphes (structure complète)",
          "Formation courte : 1000 mots, 10 paragraphes (développement)",
        ],
      },
      {
        type: "list",
        title: "🧠 Logique de priorité - Cas pratiques :",
        content: [
          "Mots seuls : Contrôle précis, laisse l'IA structurer",
          "Caractères seuls : Idéal réseaux sociaux avec limites strictes",
          "Durée seule : Estimation naturelle, bon pour débuter",
          "Mots + Paragraphes : Contrôle contenu ET structure",
          "Évitez : Mots + Caractères contradictoires",
        ],
      },
      {
        type: "steps",
        title: "🔄 Workflow d'optimisation :",
        content: [
          "Identifiez votre plateforme cible principale",
          "Choisissez le contrôle principal (mots OU caractères)",
          "Ajoutez structure avec paragraphes si nécessaire",
          "Générez une première version",
          "Ajustez selon le résultat (plus/moins de contenu)",
          "Sauvegardez la configuration qui fonctionne",
          "Réutilisez pour contenus similaires",
        ],
      },
      {
        type: "list",
        title: "📊 Indicateurs de qualité :",
        content: [
          "Feedback visuel : Observez les messages d'information",
          "Cohérence : Vérifiez que durée ≈ nombre de mots",
          "Lisibilité : Testez avec votre vitesse de lecture",
          "Engagement : Plus court = plus d'impact généralement",
          "Complétude : Assurez-vous que le message passe entièrement",
        ],
      },
      {
        type: "list",
        title: "🚫 Erreurs à éviter :",
        content: [
          "Contraintes contradictoires : 50 mots + 2000 caractères",
          "Trop de paragraphes pour peu de mots : 100 mots en 10 §",
          "Ignorer le feedback visuel de l'interface",
          "Copier-coller aveuglément les presets sans tester",
          "Oublier d'adapter selon votre vitesse de lecture",
        ],
      },
      {
        type: "warning",
        content:
          "Les contrôles de longueur sont des guides, pas des règles absolues. L'IA peut légèrement dépasser pour préserver la cohérence du contenu. Testez toujours le résultat avec votre vitesse de lecture réelle.",
      },
      {
        type: "tip",
        content:
          "Créez vos 'recettes' personnelles : notez les combinaisons qui marchent pour vos types de contenus. Exemple : 'Présentation produit = 180 mots + 4 paragraphes + ton énergique'.",
      },
    ],
  },
];
