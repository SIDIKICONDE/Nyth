import { SubscriptionPlan } from "../types/subscription";

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  free: {
    id: "free",
    name: "free",
    displayName: "Gratuit",
    price: 0,
    currency: "EUR",
    period: "month",
    limits: {
      dailyGenerations: 5,
      apis: ["gemini"],
      models: ["gemini-pro"],
      features: [
        "Génération de scripts basique",
        "Export standard",
        "Téléprompteur",
        "Enregistrement HD",
      ],
    },
    description: "Parfait pour découvrir l'application",
    color: "#6B7280",
  },
  starter: {
    id: "starter",
    name: "starter",
    displayName: "Starter",
    price: 4.99,
    currency: "EUR",
    period: "month",
    limits: {
      monthlyGenerations: 100,
      apis: ["gemini", "mistral"],
      models: ["gemini-pro", "mistral-tiny"],
      features: [
        "Tout du plan Gratuit",
        "100 générations/mois",
        "Sans publicité",
        "Support par email",
        "Export 4K",
      ],
    },
    description: "Pour les créateurs réguliers",
    color: "#3B82F6",
  },
  pro: {
    id: "pro",
    name: "pro",
    displayName: "Pro",
    price: 14.99,
    currency: "EUR",
    period: "month",
    popular: true,
    limits: {
      apis: ["gemini", "mistral", "openai", "claude"],
      models: ["gpt-4", "claude-3", "gemini-pro", "mistral-medium"],
      features: [
        "Générations illimitées",
        "Tous les modèles IA",
        "Support prioritaire",
        "API avancées (GPT-4)",
        "Export 4K/60fps",
        "Branding personnalisé",
        "Analytics détaillés",
      ],
    },
    description: "Pour les professionnels exigeants",
    color: "#8B5CF6",
  },
  enterprise: {
    id: "enterprise",
    name: "enterprise",
    displayName: "Enterprise",
    price: 49.99,
    currency: "EUR",
    period: "month",
    limits: {
      apis: ["all"],
      models: ["all"],
      features: [
        "Tout du plan Pro",
        "API dédiée",
        "SLA garanti",
        "Support téléphonique",
        "Formation équipe",
        "Facturation personnalisée",
        "Multi-utilisateurs",
      ],
    },
    description: "Solutions sur mesure pour les équipes",
    color: "#DC2626",
  },
};

// Configuration des APIs managées par plan
export const MANAGED_API_CONFIG = {
  free: {
    gemini: {
      model: "gemini-pro",
      maxTokens: 2048,
      temperature: 0.7,
    },
  },
  starter: {
    gemini: {
      model: "gemini-pro",
      maxTokens: 4096,
      temperature: 0.7,
    },
    mistral: {
      model: "mistral-tiny",
      maxTokens: 2048,
      temperature: 0.7,
    },
  },
  pro: {
    gemini: {
      model: "gemini-pro",
      maxTokens: 8192,
      temperature: 0.8,
    },
    openai: {
      model: "gpt-4-turbo-preview",
      maxTokens: 4096,
      temperature: 0.8,
    },
    claude: {
      model: "claude-3-sonnet",
      maxTokens: 4096,
      temperature: 0.8,
    },
  },
  enterprise: {
    // Configuration personnalisée par client
  },
};

// Limites de rate limiting par plan
export const RATE_LIMITS = {
  free: {
    requestsPerMinute: 5,
    requestsPerHour: 20,
    requestsPerDay: 5,
  },
  starter: {
    requestsPerMinute: 10,
    requestsPerHour: 100,
    requestsPerDay: 200,
  },
  pro: {
    requestsPerMinute: 30,
    requestsPerHour: 500,
    requestsPerDay: 5000,
  },
  enterprise: {
    requestsPerMinute: 100,
    requestsPerHour: 5000,
    requestsPerDay: 50000,
  },
};
