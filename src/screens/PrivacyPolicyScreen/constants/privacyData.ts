import { PrivacySection } from "../types";

export const createPrivacyData = (
  t: (key: string) => string
): PrivacySection[] => [
  {
    icon: "information",
    title: "À propos",
    content:
      "Nyth (« l'Application ») est éditée par Nyth, 221 route de Schirmeck, 67200 Strasbourg, France. Cette politique décrit comment sont collectées, utilisées, stockées et protégées les informations des utilisateurs lors de l'utilisation de l'Application native sur iOS et Android.",
  },
  {
    icon: "database",
    title: "Données collectées",
    content:
      "Données d'identité (nom, photo, e-mail), données d'abonnement (type de plan), contenu généré (scripts, vidéos, préférences), données techniques (appareil, système d'exploitation, permissions caméra/micro), métadonnées IA (prompts, réponses), données d'usage pour amélioration du service, et clés API personnelles stockées localement. Aucune donnée biométrique ou de géolocalisation n'est collectée.",
  },
  {
    icon: "target",
    title: "Finalités du traitement",
    content:
      "1. Fourniture des services principaux (génération de scripts IA, téléprompteur, enregistrement vidéo)\n2. Personnalisation de l'expérience utilisateur\n3. Sécurisation des clés API et données personnelles\n4. Amélioration continue de l'application\n5. Support technique et assistance utilisateur\n6. Respect des obligations légales applicables",
  },
  {
    icon: "gavel",
    title: "Bases légales (RGPD)",
    content:
      "• Exécution du contrat : fourniture des fonctionnalités essentielles de l'application\n• Intérêt légitime : sécurité, amélioration du produit, support technique\n• Consentement : accès caméra/micro pour enregistrement, notifications push\n• Obligation légale : facturation, conservation des données de transaction",
  },
  {
    icon: "share-variant",
    title: "Partage de données & prestataires",
    content:
      "• Firebase (Google) : Authentification utilisateur, stockage cloud sécurisé (USA/UE)\n• Services IA : OpenAI, Google Gemini, Mistral AI selon votre choix de fournisseur\n• Plateformes de paiement : pour les abonnements (données chiffrées)\n• Plateformes sociales : uniquement sur demande explicite de partage par l'utilisateur\n\nAucune donnée n'est vendue ou utilisée à des fins publicitaires. Tous les transferts sont sécurisés.",
  },
  {
    icon: "shield-lock",
    title: "Stockage & sécurité",
    content:
      "• Scripts & préférences : stockés localement sur votre appareil avec chiffrement AES-256\n• Clés API : stockées dans Keychain (iOS) / Keystore (Android) - jamais transmises à nos serveurs\n• Vidéos : stockées uniquement en local sur votre appareil\n• Comptes utilisateur : sauvegarde cloud optionnelle via Firebase (serveurs sécurisés)\n• Connexions : toutes les communications sont chiffrées via HTTPS/TLS\n• Audits de sécurité réguliers et conformité aux standards de l'industrie",
  },
  {
    icon: "clock",
    title: "Durées de conservation",
    content:
      "• Compte utilisateur : tant que le compte est actif + 12 mois après suppression\n• Données locales : conservées sur votre appareil jusqu'à désinstallation\n• Clés API : supprimées immédiatement lors de la révocation\n• Données de facturation : 10 ans (conformité légale française)\n• Logs techniques : 90 jours maximum, sous forme anonymisée",
  },
  {
    icon: "account-check",
    title: "Vos droits",
    content:
      "• Accès aux données : consultation et export de vos données via l'application\n• Rectification : modification de vos informations personnelles\n• Suppression : suppression complète de votre compte et données associées\n• Portabilité : export de vos scripts et préférences au format JSON\n• Opposition : désactivation des fonctionnalités optionnelles\n• Retrait du consentement : révocation des permissions à tout moment\n\nPour exercer vos droits : conde.sidiki@outlook.fr (réponse sous 48h ouvrées)",
  },
  {
    icon: "baby-face",
    title: "Utilisation par des mineurs",
    content:
      "L'application n'est pas destinée aux personnes de moins de 13 ans. Si nous découvrons qu'un mineur a créé un compte, celui-ci sera immédiatement supprimé. Les parents peuvent nous contacter pour toute demande concernant les données de leurs enfants.",
  },
  {
    icon: "cookie",
    title: "Cookies & identifiants",
    content:
      "En tant qu'application mobile native, Nyth n'utilise pas de cookies web. Des identifiants d'appareil anonymes peuvent être générés pour les statistiques d'usage (désactivables dans Paramètres > Confidentialité). Aucun tracking publicitaire n'est effectué.",
  },
  {
    icon: "update",
    title: "Modifications",
    content:
      "Cette politique peut être mise à jour pour refléter les évolutions de l'application ou des réglementations. Vous serez notifié des modifications importantes via l'application. La date de dernière mise à jour est indiquée en bas de cette politique.",
  },
  {
    icon: "email",
    title: "Contact",
    content:
      "Responsable du traitement des données : Nyth\nContact DPO : conde.sidiki@outlook.fr\nAdresse : 221 route de Schirmeck, 67200 Strasbourg, France\n\nDernière mise à jour : Janvier 2025\n© 2025 Nyth – Tous droits réservés.",
  },
];
