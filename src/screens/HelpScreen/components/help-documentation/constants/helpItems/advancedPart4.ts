import { HelpItem } from "../../types";

export const advancedItemsPart4: HelpItem[] = [
  {
    id: "ai-chat-complete",
    title: "Chat IA - Assistant conversationnel",
    description: "Guide complet du chat IA avec toutes ses fonctionnalités",
    icon: "robot-outline",
    color: "#8B5CF6",
    category: "advanced",
    content: [
      {
        type: "text",
        content:
          "Le chat IA de Nyth est votre assistant intelligent polyvalent pour créer, améliorer et discuter de vos scripts. Il combine conversation libre et actions spécialisées dans une interface riche et personnalisable.",
      },
      {
        type: "list",
        title: "🎯 Fonctionnalités principales :",
        content: [
          "💬 Conversation libre sur tous sujets",
          "📝 Actions rapides contextuelles (4 types)",
          "🧠 Mémoire IA pour personnalisation",
          "📱 Interface adaptative avec 10 styles de bulles",
          "🔄 Multi-providers IA avec basculement automatique",
          "💾 Sauvegarde et gestion des conversations",
          "🎨 Personnalisation complète (polices, couleurs, mise en page)",
        ],
      },
      {
        type: "list",
        title: "🚀 4 Actions rapides disponibles :",
        content: [
          "📊 Analyser : Analyse ton, points forts, suggestions, public cible",
          "⭐ Améliorer : Optimise clarté, engagement et structure",
          "✅ Corriger : Corrige orthographe, grammaire et ponctuation",
          "❓ Question personnalisée : Posez votre propre question",
        ],
      },
      {
        type: "list",
        title: "🎨 Interface et personnalisation :",
        content: [
          "📱 Menu latéral : Conversations + Paramètres dans 2 onglets",
          "🎭 10 styles de bulles : Classique, iOS, Élégant, Néon, etc.",
          "🔤 10 polices : System, Roboto, Lato, Montserrat, etc.",
          "📐 3 mises en page : Normal, Aéré, Compact",
          "🌈 Adaptation thématique automatique",
        ],
      },
      {
        type: "steps",
        title: "🔄 Workflow d'utilisation :",
        content: [
          "Accédez au chat depuis l'icône 🤖 ou menu",
          "Tapez votre question ou collez un script",
          "Utilisez les actions rapides pour traitement spécialisé",
          "Double-tapez sur une réponse IA pour l'envoyer à l'éditeur",
          "Sauvegardez les réponses utiles comme scripts",
          "Gérez vos conversations dans le menu latéral",
          "Personnalisez l'interface selon vos préférences",
        ],
      },
      {
        type: "list",
        title: "⚙️ Gestion des conversations :",
        content: [
          "💾 Sauvegarde automatique de toutes les conversations",
          "🔍 Recherche par titre ou contenu",
          "📋 Actions : Copier, Partager, Supprimer",
          "🆕 Nouvelle conversation à tout moment",
          "📱 Synchronisation entre sessions",
          "👆 Double-tap sur réponse IA → Envoi direct vers l'éditeur",
        ],
      },
      {
        type: "list",
        title: "🤖 Multi-providers IA :",
        content: [
          "🔄 Basculement automatique si un provider échoue",
          "⚡ OpenAI (GPT-4), Gemini, Mistral, Cohere, HuggingFace",
          "🔧 Configuration dans Paramètres → IA",
          "💡 Fallback intelligent selon disponibilité",
          "📊 Indicateur du provider utilisé",
        ],
      },
      {
        type: "warning",
        content:
          "Le chat IA nécessite une connexion internet et au moins une clé API configurée. Vérifiez vos paramètres IA si l'assistant ne répond pas.",
      },
      {
        type: "tip",
        content:
          "Utilisez les actions rapides pour traiter vos scripts efficacement : collez votre texte, choisissez l'action, et obtenez des résultats optimisés instantanément ! Double-tapez sur toute réponse IA pour la transférer directement dans l'éditeur.",
      },
    ],
  },
];
