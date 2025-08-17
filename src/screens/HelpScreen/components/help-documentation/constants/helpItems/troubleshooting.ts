import { HelpItem } from "../../types";

export const troubleshootingItems: HelpItem[] = [
  {
    id: "common-issues",
    title: "Problèmes courants et solutions",
    description: "Résolvez rapidement les problèmes fréquents",
    icon: "alert-circle",
    color: "#EF4444",
    category: "troubleshooting",
    content: [
      {
        type: "text",
        content:
          "Voici les solutions aux problèmes les plus fréquemment rencontrés.",
      },
      {
        type: "list",
        title: "🎥 Problèmes d'enregistrement :",
        content: [
          "Caméra noire → Vérifiez les permissions",
          "Pas de son → Activez le microphone",
          "Vidéo saccadée → Réduisez la qualité",
          "Arrêt inattendu → Libérez l'espace de stockage",
          "Fichier corrompu → Redémarrez l'application",
        ],
      },
      {
        type: "list",
        title: "🤖 Problèmes IA :",
        content: [
          "Pas de réponse → Vérifiez les clés API",
          "Erreur de quota → Changez de provider",
          "Réponse lente → Vérifiez la connexion",
          "Contenu inapproprié → Modifiez le prompt",
          "Erreur de format → Mettez à jour l'app",
        ],
      },
      {
        type: "list",
        title: "📱 Problèmes généraux :",
        content: [
          "App qui plante → Redémarrez l'appareil",
          "Sync échouée → Vérifiez internet",
          "Paramètres perdus → Restaurez la sauvegarde",
          "Performance lente → Fermez autres apps",
          "Erreur inconnue → Contactez le support",
        ],
      },
    ],
  },
  {
    id: "performance-optimization",
    title: "Optimisation des performances",
    description: "Améliorez les performances de l'application",
    icon: "speedometer-slow",
    color: "#EF4444",
    category: "troubleshooting",
    content: [
      {
        type: "text",
        content:
          "Optimisez CamPrompt AI pour une expérience fluide sur votre appareil.",
      },
      {
        type: "steps",
        title: "Optimisations recommandées :",
        content: [
          "Fermez les applications en arrière-plan",
          "Libérez au moins 2GB d'espace de stockage",
          "Activez le mode économie d'énergie si nécessaire",
          "Utilisez une résolution adaptée à votre appareil",
          "Nettoyez le cache de l'application régulièrement",
        ],
      },
      {
        type: "warning",
        content:
          "Sur les appareils anciens (< 3GB RAM), limitez-vous à 1080p et fermez toutes les autres applications.",
      },
    ],
  },
  {
    id: "ai-memory-troubleshooting",
    title: "Problèmes de mémoire IA",
    description: "Solutions aux problèmes courants de la mémoire IA",
    icon: "brain",
    color: "#EF4444",
    category: "troubleshooting",
    content: [
      {
        type: "text",
        content:
          "Résolvez rapidement les problèmes liés au système de mémoire IA.",
      },
      {
        type: "list",
        title: "❌ Problèmes fréquents :",
        content: [
          "L'IA ne se souvient pas de mes préférences",
          "La mémoire IA ne s'active pas",
          "Erreurs lors de l'analyse des conversations",
          "Les suggestions ne sont pas pertinentes",
          "Impossible de désactiver la mémoire",
        ],
      },
      {
        type: "steps",
        title: "Solutions étape par étape :",
        content: [
          "Vérifiez que la mémoire IA est activée dans Paramètres",
          "Assurez-vous d'avoir une connexion internet stable",
          "Vérifiez la configuration de vos clés API",
          "Redémarrez l'application si nécessaire",
          "Contactez le support si le problème persiste",
        ],
      },
      {
        type: "steps",
        title: "🔧 Gestion complète des données :",
        content: [
          "Pour voir les données stockées : Paramètres → Mémoire IA → Voir les données",
          "Pour désactiver temporairement : Toggle OFF (données préservées)",
          "Pour supprimer partiellement : Sélectionnez les éléments à effacer",
          "Pour réinitialisation complète : 'Supprimer toutes les données'",
          "Pour réactiver : Toggle ON (recommence l'apprentissage)",
        ],
      },
      {
        type: "warning",
        content:
          "Si vous rencontrez des erreurs persistantes, vous pouvez réinitialiser la mémoire IA dans les paramètres. Cela effacera toutes les données mémorisées.",
      },
      {
        type: "tip",
        content:
          "La mémoire IA nécessite quelques interactions pour commencer à être efficace. Soyez patient et continuez à utiliser l'IA normalement.",
      },
    ],
  },
];
