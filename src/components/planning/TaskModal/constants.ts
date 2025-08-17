import { Task } from "../../../types/planning";

export const getPriorityOptions = (
  t: (key: string, fallback: string) => string
) => [
  {
    value: "low" as Task["priority"],
    label: t("planning.tasks.taskModal.priorities.low", "Faible"),
    color: "#10B981",
    icon: "🟢",
  },
  {
    value: "medium" as Task["priority"],
    label: t("planning.tasks.taskModal.priorities.medium", "Moyenne"),
    color: "#F59E0B",
    icon: "🟡",
  },
  {
    value: "high" as Task["priority"],
    label: t("planning.tasks.taskModal.priorities.high", "Élevée"),
    color: "#EF4444",
    icon: "🔴",
  },
  {
    value: "urgent" as Task["priority"],
    label: t("planning.tasks.taskModal.priorities.urgent", "Urgente"),
    color: "#DC2626",
    icon: "🚨",
  },
];

export const getTaskCategories = (
  t: (key: string, fallback: string) => string
) => [
  {
    id: "development",
    name: t(
      "planning.tasks.taskModal.categories.development.name",
      "Développement"
    ),
    icon: "💻",
    description: t(
      "planning.tasks.taskModal.categories.development.description",
      "Tâches de programmation et développement"
    ),
  },
  {
    id: "design",
    name: t("planning.tasks.taskModal.categories.design.name", "Design"),
    icon: "🎨",
    description: t(
      "planning.tasks.taskModal.categories.design.description",
      "Tâches de design et interface utilisateur"
    ),
  },
  {
    id: "content",
    name: t("planning.tasks.taskModal.categories.content.name", "Contenu"),
    icon: "📝",
    description: t(
      "planning.tasks.taskModal.categories.content.description",
      "Rédaction et création de contenu"
    ),
  },
  {
    id: "marketing",
    name: t("planning.tasks.taskModal.categories.marketing.name", "Marketing"),
    icon: "📢",
    description: t(
      "planning.tasks.taskModal.categories.marketing.description",
      "Promotion et marketing digital"
    ),
  },
  {
    id: "research",
    name: t("planning.tasks.taskModal.categories.research.name", "Recherche"),
    icon: "🔍",
    description: t(
      "planning.tasks.taskModal.categories.research.description",
      "Recherche et analyse de données"
    ),
  },
  {
    id: "meeting",
    name: t("planning.tasks.taskModal.categories.meeting.name", "Réunion"),
    icon: "👥",
    description: t(
      "planning.tasks.taskModal.categories.meeting.description",
      "Réunions et communications"
    ),
  },
  {
    id: "bug",
    name: t("planning.tasks.taskModal.categories.bug.name", "Bug"),
    icon: "🐛",
    description: t(
      "planning.tasks.taskModal.categories.bug.description",
      "Correction de bugs et problèmes"
    ),
  },
  {
    id: "testing",
    name: t("planning.tasks.taskModal.categories.testing.name", "Tests"),
    icon: "🧪",
    description: t(
      "planning.tasks.taskModal.categories.testing.description",
      "Tests et assurance qualité"
    ),
  },
  {
    id: "deployment",
    name: t(
      "planning.tasks.taskModal.categories.deployment.name",
      "Déploiement"
    ),
    icon: "🚀",
    description: t(
      "planning.tasks.taskModal.categories.deployment.description",
      "Mise en production et déploiement"
    ),
  },
  {
    id: "maintenance",
    name: t(
      "planning.tasks.taskModal.categories.maintenance.name",
      "Maintenance"
    ),
    icon: "🔧",
    description: t(
      "planning.tasks.taskModal.categories.maintenance.description",
      "Maintenance et optimisation"
    ),
  },
];

// Backward compatibility - keeping the old constants for components that haven't been updated yet
export const PRIORITY_OPTIONS: Array<{
  value: Task["priority"];
  label: string;
  color: string;
  icon: string;
}> = [
  {
    value: "low",
    label: "Faible",
    color: "#10B981",
    icon: "🟢",
  },
  {
    value: "medium",
    label: "Moyenne",
    color: "#F59E0B",
    icon: "🟡",
  },
  {
    value: "high",
    label: "Élevée",
    color: "#EF4444",
    icon: "🔴",
  },
  {
    value: "urgent",
    label: "Urgente",
    color: "#DC2626",
    icon: "🚨",
  },
];

export const TASK_CATEGORIES = [
  {
    id: "development",
    name: "Développement",
    icon: "💻",
    description: "Tâches de programmation et développement",
  },
  {
    id: "design",
    name: "Design",
    icon: "🎨",
    description: "Tâches de design et interface utilisateur",
  },
  {
    id: "content",
    name: "Contenu",
    icon: "📝",
    description: "Rédaction et création de contenu",
  },
  {
    id: "marketing",
    name: "Marketing",
    icon: "📢",
    description: "Promotion et marketing digital",
  },
  {
    id: "research",
    name: "Recherche",
    icon: "🔍",
    description: "Recherche et analyse de données",
  },
  {
    id: "meeting",
    name: "Réunion",
    icon: "👥",
    description: "Réunions et communications",
  },
  {
    id: "bug",
    name: "Bug",
    icon: "🐛",
    description: "Correction de bugs et problèmes",
  },
  {
    id: "testing",
    name: "Tests",
    icon: "🧪",
    description: "Tests et assurance qualité",
  },
  {
    id: "deployment",
    name: "Déploiement",
    icon: "🚀",
    description: "Mise en production et déploiement",
  },
  {
    id: "maintenance",
    name: "Maintenance",
    icon: "🔧",
    description: "Maintenance et optimisation",
  },
];

// Tags organisés par catégories pour une meilleure découverte
export const TAG_CATEGORIES = {
  // Design & UX/UI
  design: [
    "Design",
    "UI/UX",
    "Figma",
    "Sketch",
    "Adobe XD",
    "Photoshop",
    "Illustrator",
    "Wireframe",
    "Prototype",
    "Mockup",
    "Interface",
    "Expérience utilisateur",
    "Design System",
    "Branding",
    "Logo",
    "Iconographie",
    "Typographie",
    "Couleurs",
    "Layout",
    "Responsive",
    "Mobile First",
    "Accessibilité",
  ],

  // Développement
  development: [
    "Frontend",
    "Backend",
    "Full Stack",
    "React",
    "React Native",
    "Vue.js",
    "Angular",
    "Node.js",
    "Python",
    "JavaScript",
    "TypeScript",
    "HTML",
    "CSS",
    "SASS",
    "API",
    "REST",
    "GraphQL",
    "Database",
    "SQL",
    "MongoDB",
    "Firebase",
    "Git",
    "GitHub",
    "Deployment",
    "CI/CD",
    "Docker",
    "AWS",
    "Vercel",
  ],

  // Outils & Technologies
  tools: [
    "Figma",
    "Sketch",
    "Adobe Creative",
    "VS Code",
    "Notion",
    "Slack",
    "Trello",
    "Jira",
    "GitHub",
    "GitLab",
    "Postman",
    "Chrome DevTools",
    "Analytics",
    "Google Analytics",
    "Hotjar",
    "Mixpanel",
    "Zapier",
    "Airtable",
  ],

  // Marketing & Communication
  marketing: [
    "SEO",
    "SEM",
    "Google Ads",
    "Facebook Ads",
    "Content Marketing",
    "Social Media",
    "Email Marketing",
    "Newsletter",
    "Blog",
    "Copywriting",
    "Community Management",
    "Influenceurs",
    "Partenariats",
    "PR",
    "Analytics",
    "Conversion",
    "A/B Testing",
    "Landing Page",
    "Funnel",
    "Lead Generation",
    "CRM",
  ],

  // Projet & Gestion
  project: [
    "Planning",
    "Roadmap",
    "Sprint",
    "Scrum",
    "Kanban",
    "Agile",
    "Deadline",
    "Milestone",
    "Review",
    "Feedback",
    "Client",
    "Meeting",
    "Présentation",
    "Documentation",
    "Spécifications",
    "Requirements",
    "User Stories",
    "Testing",
    "QA",
    "Bug Fix",
    "Maintenance",
    "Support",
  ],

  // Priorité & Statut
  priority: [
    "Urgent",
    "Important",
    "Critique",
    "Bloquant",
    "Nice to have",
    "MVP",
    "V1",
    "V2",
    "Beta",
    "Alpha",
    "Production",
    "Staging",
    "Development",
    "Quick Win",
    "Long terme",
    "Expérimentation",
    "POC",
    "Proof of Concept",
  ],

  // Compétences & Formation
  learning: [
    "Formation",
    "Tutorial",
    "Documentation",
    "Learning",
    "Skill",
    "Certification",
    "Workshop",
    "Webinar",
    "Conference",
    "Best Practices",
    "Research",
    "Veille technologique",
    "Innovation",
    "Trend",
    "Case Study",
    "Benchmark",
  ],

  // Personnel & Bien-être
  personal: [
    "Personnel",
    "Santé",
    "Sport",
    "Méditation",
    "Pause",
    "Vacances",
    "Formation personnelle",
    "Hobby",
    "Side Project",
    "Networking",
    "Carrière",
    "CV",
    "Portfolio",
    "LinkedIn",
    "Développement personnel",
  ],
};

// Liste plate de tous les tags pour la recherche et suggestions
export const COMMON_TAGS = [
  // Tags les plus populaires en premier
  "Design",
  "UI/UX",
  "Figma",
  "React",
  "Frontend",
  "Backend",
  "API",
  "Mobile",
  "Web",
  "JavaScript",
  "TypeScript",
  "CSS",
  "HTML",
  "Node.js",
  "Database",

  // Tags de priorité et statut
  "Urgent",
  "Important",
  "Bug Fix",
  "Feature",
  "Enhancement",
  "Documentation",
  "Testing",
  "Review",
  "Client",
  "Internal",
  "MVP",
  "V1",
  "Beta",
  "Production",

  // Tags techniques
  "Performance",
  "SEO",
  "Security",
  "Accessibility",
  "Responsive",
  "Animation",
  "Integration",
  "Deployment",
  "CI/CD",
  "Git",
  "GitHub",
  "Firebase",
  "AWS",

  // Tags métier
  "Marketing",
  "Content",
  "Blog",
  "Social Media",
  "Email",
  "Analytics",
  "Conversion",
  "Landing Page",
  "User Research",
  "A/B Testing",
  "Metrics",

  // Tags de processus
  "Planning",
  "Sprint",
  "Scrum",
  "Agile",
  "Meeting",
  "Presentation",
  "Training",
  "Workshop",
  "Research",
  "Prototype",
  "Wireframe",
  "Mockup",
  "Specification",

  // Outils populaires
  "Sketch",
  "Adobe XD",
  "Photoshop",
  "Illustrator",
  "VS Code",
  "Notion",
  "Slack",
  "Trello",
  "Jira",
  "Postman",
  "Google Analytics",
  "Hotjar",

  // Tags créatifs
  "Branding",
  "Logo",
  "Iconography",
  "Typography",
  "Color Palette",
  "Design System",
  "Style Guide",
  "Component Library",
  "Pattern Library",
  "UI Kit",

  // Tags de développement avancés
  "React Native",
  "Vue.js",
  "Angular",
  "Python",
  "Java",
  "PHP",
  "Ruby",
  "MongoDB",
  "PostgreSQL",
  "Redis",
  "Docker",
  "Kubernetes",
  "Microservices",

  // Tags de contenu
  "Copywriting",
  "Content Strategy",
  "Editorial",
  "Video",
  "Podcast",
  "Webinar",
  "Tutorial",
  "Guide",
  "Case Study",
  "White Paper",
  "Newsletter",
  "Press Release",
];

// Tags suggérés selon la catégorie de tâche
export const CATEGORY_SUGGESTED_TAGS: Record<string, string[]> = {
  design: TAG_CATEGORIES.design.slice(0, 10),
  development: TAG_CATEGORIES.development.slice(0, 10),
  marketing: TAG_CATEGORIES.marketing.slice(0, 10),
  content: [
    "Blog",
    "Copywriting",
    "Editorial",
    "Content Strategy",
    "SEO",
    "Social Media",
  ],
  research: [
    "User Research",
    "Analytics",
    "Data",
    "Survey",
    "Interview",
    "Testing",
  ],
  meeting: ["Planning", "Review", "Client", "Team", "Presentation", "Decision"],
  bug: ["Bug Fix", "Critical", "Urgent", "Testing", "QA", "Hotfix"],
  testing: [
    "QA",
    "Testing",
    "Automation",
    "Manual",
    "Regression",
    "Performance",
  ],
  deployment: [
    "Production",
    "Staging",
    "CI/CD",
    "Release",
    "Deployment",
    "Monitoring",
  ],
  maintenance: [
    "Maintenance",
    "Update",
    "Security",
    "Performance",
    "Optimization",
    "Cleanup",
  ],
};

export const FORM_VALIDATION = {
  title: {
    required: true,
    minLength: 3,
    maxLength: 100,
  },
  description: {
    maxLength: 500,
  },
  estimatedHours: {
    min: 0.5,
    max: 100,
  },
} as const;

export const DEFAULT_FORM_DATA = {
  title: "",
  description: "",
  priority: "medium" as const,
  status: "todo" as const,
  dueDate: undefined,
  startDate: undefined,
  estimatedHours: undefined,
  tags: [],
  category: undefined,
  assignedTo: [],
  projectId: undefined,
  dependencies: [],
  customization: undefined,
  attachments: [],
  images: [],
  subtasks: [],
};
