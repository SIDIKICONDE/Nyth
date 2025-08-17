import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../contexts/AuthContext";
import { useGlobalPreferences } from "./useGlobalPreferences";
import { tasksService } from "../services/firebase/planning/tasksService";
import { Task, TaskFormData } from "../types/planning";
import { taskNotificationService } from "../services/notifications/TaskNotificationService";

// Tâches de démonstration pour les nouveaux utilisateurs (utilisant les démos existantes)
const DEMO_TASKS: Omit<Task, "id" | "userId" | "createdAt" | "updatedAt">[] = [
  {
    title: "Créer maquettes Figma",
    description:
      "Concevoir les écrans principaux de l'application mobile avec une interface moderne et intuitive. Inclure les wireframes, prototypes interactifs et guide de style.",
    status: "todo",
    priority: "high",
    category: "design",
    tags: [
      "Design",
      "UI/UX",
      "Figma",
      "Mobile",
      "Prototype",
      "Wireframes",
      "Style Guide",
    ],
    estimatedHours: 6,
    actualHours: 0,
    dependencies: [],
    blockedBy: [],
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    startDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    assignedTo: [],
    color: "#8B5CF6",
    customization: {
      cardColor: "#8B5CF6",
      cardIcon: "🎨",
      cardStyle: "detailed",
      showEstimatedTime: true,
      showProgress: true,
      showAttachments: true,
      showSubtasks: false,
    },
    attachments: [
      {
        id: "demo-attachment-1",
        taskId: "demo-task-1",
        fileName: "design-brief.pdf",
        originalName: "Design Brief - Mobile App.pdf",
        fileSize: 2048576,
        mimeType: "application/pdf",
        url: "https://example.com/design-brief.pdf",
        uploadedAt: new Date().toISOString(),
        uploadedBy: "demo-user",
        type: "document",
      },
    ],
    images: [
      {
        id: "demo-image-1",
        taskId: "demo-task-1",
        fileName: "wireframe-screenshot.png",
        originalName: "Wireframe Screenshot.png",
        fileSize: 512000,
        url: "https://example.com/wireframe.png",
        thumbnailUrl: "https://example.com/wireframe-thumb.png",
        width: 1920,
        height: 1080,
        uploadedAt: new Date().toISOString(),
        uploadedBy: "demo-user",
      },
    ],
  },
  {
    title: "Développer API REST",
    description:
      "Implémenter les endpoints pour la gestion des utilisateurs avec authentification JWT, validation des données et documentation Swagger complète.",
    status: "in_progress",
    priority: "medium",
    category: "development",
    tags: [
      "Backend",
      "API",
      "Node.js",
      "Database",
      "Authentication",
      "JWT",
      "Swagger",
      "REST",
    ],
    estimatedHours: 12,
    actualHours: 4,
    dependencies: ["demo-task-1"], // Dépend de la maquette Figma
    blockedBy: [],
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    assignedTo: ["dev-team"],
    color: "#3B82F6",
    customization: {
      cardColor: "#3B82F6",
      cardIcon: "⚙️",
      cardStyle: "modern",
      showEstimatedTime: true,
      showProgress: true,
      showAttachments: true,
      showSubtasks: false,
    },
    attachments: [
      {
        id: "demo-attachment-2",
        taskId: "demo-task-2",
        fileName: "api-specification.yaml",
        originalName: "API Specification.yaml",
        fileSize: 1536000,
        mimeType: "application/x-yaml",
        url: "https://example.com/api-spec.yaml",
        uploadedAt: new Date().toISOString(),
        uploadedBy: "demo-user",
        type: "document",
      },
    ],
  },
  {
    title: "Campagne réseaux sociaux",
    description:
      "Planifier et créer du contenu pour Instagram et LinkedIn avec calendrier éditorial, visuels personnalisés et stratégie d'engagement.",
    status: "review",
    priority: "medium",
    category: "marketing",
    tags: [
      "Social Media",
      "Content",
      "Instagram",
      "LinkedIn",
      "Planning",
      "Engagement",
      "Visuals",
    ],
    estimatedHours: 4,
    actualHours: 3.5,
    dependencies: [],
    blockedBy: [],
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    assignedTo: ["marketing-team"],
    color: "#F59E0B",
    customization: {
      cardColor: "#F59E0B",
      cardIcon: "📱",
      cardStyle: "creative",
      showEstimatedTime: true,
      showProgress: true,
      showAttachments: false,
      showSubtasks: false,
    },
    images: [
      {
        id: "demo-image-2",
        taskId: "demo-task-3",
        fileName: "social-content-preview.jpg",
        originalName: "Social Content Preview.jpg",
        fileSize: 1024000,
        url: "https://example.com/social-content.jpg",
        thumbnailUrl: "https://example.com/social-content-thumb.jpg",
        width: 1080,
        height: 1080,
        uploadedAt: new Date().toISOString(),
        uploadedBy: "demo-user",
      },
    ],
  },
  {
    title: "Créer une présentation marketing",
    description:
      "Préparer les slides pour le lancement produit avec storytelling captivant, données de marché et call-to-action clairs.",
    status: "todo",
    priority: "high",
    category: "work",
    tags: [
      "Marketing",
      "Design",
      "Présentation",
      "Storytelling",
      "Launch",
      "Pitch",
    ],
    estimatedHours: 4,
    actualHours: 0,
    dependencies: ["demo-task-3"], // Dépend de la campagne réseaux sociaux
    blockedBy: [],
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    startDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    assignedTo: ["marketing-team"],
    color: "#EF4444",
    customization: {
      cardColor: "#EF4444",
      cardIcon: "📊",
      cardStyle: "priority",
      showEstimatedTime: true,
      showProgress: false,
      showAttachments: true,
      showSubtasks: false,
    },
    attachments: [
      {
        id: "demo-attachment-4",
        taskId: "demo-task-4",
        fileName: "market-research.pdf",
        originalName: "Market Research Data.pdf",
        fileSize: 3072000,
        mimeType: "application/pdf",
        url: "https://example.com/market-research.pdf",
        uploadedAt: new Date().toISOString(),
        uploadedBy: "demo-user",
        type: "document",
      },
    ],
  },
  {
    title: "Apprendre React Native",
    description:
      "Suivre le tutoriel officiel et faire des exercices pratiques pour maîtriser le développement mobile cross-platform.",
    status: "in_progress",
    priority: "medium",
    category: "learning",
    tags: [
      "Développement",
      "Formation",
      "React Native",
      "Mobile",
      "Cross-platform",
      "JavaScript",
    ],
    estimatedHours: 8,
    actualHours: 5,
    dependencies: [],
    blockedBy: [],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    assignedTo: ["dev-team"],
    color: "#10B981",
    customization: {
      cardColor: "#10B981",
      cardIcon: "📚",
      cardStyle: "progress",
      showEstimatedTime: true,
      showProgress: true,
      showAttachments: true,
      showSubtasks: false,
    },
    attachments: [
      {
        id: "demo-attachment-5",
        taskId: "demo-task-5",
        fileName: "react-native-notes.md",
        originalName: "React Native Learning Notes.md",
        fileSize: 51200,
        mimeType: "text/markdown",
        url: "https://example.com/learning-notes.md",
        uploadedAt: new Date().toISOString(),
        uploadedBy: "demo-user",
        type: "document",
      },
    ],
  },
  {
    title: "Bug fix - Login page",
    description:
      "Corriger le problème d'authentification sur la page de connexion qui empêche certains utilisateurs de se connecter.",
    status: "blocked",
    priority: "urgent",
    category: "development",
    tags: [
      "Bug Fix",
      "Authentication",
      "Login",
      "Critical",
      "Frontend",
      "Debug",
    ],
    estimatedHours: 2,
    actualHours: 0,
    dependencies: ["demo-task-2"], // Dépend de l'API REST
    blockedBy: ["demo-task-2"],
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    startDate: new Date(Date.now()),
    assignedTo: ["dev-team"],
    color: "#DC2626",
    customization: {
      cardColor: "#DC2626",
      cardIcon: "🚨",
      cardStyle: "compact",
      showEstimatedTime: true,
      showProgress: false,
      showAttachments: false,
      showSubtasks: false,
    },
  },
  {
    title: "Réunion équipe hebdomadaire",
    description:
      "Point sur l'avancement des projets, partage des difficultés et planification de la semaine suivante.",
    status: "completed",
    priority: "low",
    category: "meeting",
    tags: ["Meeting", "Team", "Planning", "Review", "Collaboration"],
    estimatedHours: 1,
    actualHours: 1,
    dependencies: [],
    blockedBy: [],
    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    assignedTo: ["all-team"],
    color: "#6B7280",
    customization: {
      cardColor: "#6B7280",
      cardIcon: "👥",
      cardStyle: "team",
      showEstimatedTime: true,
      showProgress: false,
      showAttachments: false,
      showSubtasks: false,
    },
  },
  {
    title: "Faire les courses",
    description: "Acheter les ingrédients pour la semaine",
    status: "todo",
    priority: "low",
    category: "personal",
    tags: ["Courses", "Maison", "Organisation"],
    estimatedHours: 1,
    actualHours: 0,
    dependencies: [],
    blockedBy: [],
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    startDate: new Date(Date.now()),
    assignedTo: [],
    color: "#14B8A6",
    customization: {
      cardColor: "#14B8A6",
      cardIcon: "🛒",
      cardStyle: "minimal",
      showEstimatedTime: true,
      showProgress: false,
      showAttachments: false,
      showSubtasks: false,
    },
  },
  {
    title: "Planifier le sprint",
    description:
      "Organiser les tâches pour le prochain sprint de développement",
    status: "in_progress",
    priority: "medium",
    category: "planning",
    tags: ["Sprint", "Planning", "Agile", "Scrum"],
    estimatedHours: 3,
    actualHours: 1.5,
    dependencies: [],
    blockedBy: [],
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    assignedTo: ["dev-team"],
    color: "#6366F1",
    customization: {
      cardColor: "#6366F1",
      cardIcon: "📅",
      cardStyle: "timeline",
      showEstimatedTime: true,
      showProgress: true,
      showAttachments: false,
      showSubtasks: false,
    },
  },
  {
    title: "Tests d'intégration",
    description: "Exécuter la suite de tests d'intégration complète",
    status: "review",
    priority: "high",
    category: "testing",
    tags: ["Tests", "QA", "Intégration", "Automation"],
    estimatedHours: 4,
    actualHours: 3,
    dependencies: ["demo-task-2"], // Dépend de l'API REST
    blockedBy: [],
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    assignedTo: ["qa-team"],
    color: "#EC4899",
    customization: {
      cardColor: "#EC4899",
      cardIcon: "🧪",
      cardStyle: "kanban",
      showEstimatedTime: true,
      showProgress: true,
      showAttachments: false,
      showSubtasks: false,
    },
  },
  {
    title: "Design system",
    description: "Créer un système de design cohérent pour l'application",
    status: "todo",
    priority: "medium",
    category: "design",
    tags: ["Design System", "UI", "Components", "Style Guide"],
    estimatedHours: 8,
    actualHours: 0,
    dependencies: [],
    blockedBy: [],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    assignedTo: ["design-team"],
    color: "#8B5CF6",
    customization: {
      cardColor: "#8B5CF6",
      cardIcon: "🎨",
      cardStyle: "glass",
      showEstimatedTime: true,
      showProgress: false,
      showAttachments: false,
      showSubtasks: false,
    },
  },
  {
    title: "Documentation API",
    description: "Rédiger la documentation complète de l'API",
    status: "todo",
    priority: "medium",
    category: "documentation",
    tags: ["Documentation", "API", "Swagger", "Markdown"],
    estimatedHours: 6,
    actualHours: 0,
    dependencies: ["demo-task-2"], // Dépend de l'API REST
    blockedBy: [],
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    startDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    assignedTo: ["dev-team"],
    color: "#3B82F6",
    customization: {
      cardColor: "#3B82F6",
      cardIcon: "📖",
      cardStyle: "default",
      showEstimatedTime: true,
      showProgress: true,
      showAttachments: true,
      showSubtasks: false,
    },
    attachments: [
      {
        id: "demo-attachment-6",
        taskId: "demo-task-12",
        fileName: "api-docs-template.md",
        originalName: "API Documentation Template.md",
        fileSize: 256000,
        mimeType: "text/markdown",
        url: "https://example.com/api-docs-template.md",
        uploadedAt: new Date().toISOString(),
        uploadedBy: "demo-user",
        type: "document",
      },
    ],
  },
];

export const useTasks = () => {
  const { user } = useAuth();
  const { planningPreferences } = useGlobalPreferences();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Vérifier si l'utilisateur est authentifié (Firebase ou invité)
  const isAuthenticatedUser = user && user.uid && !user.isGuest;
  const isGuestUser = user && user.uid && user.isGuest;
  const hasValidUser = isAuthenticatedUser || isGuestUser;

  // Créer des tâches d'exemple locales en cas de problème Firebase
  const createLocalDemoTasks = useCallback((userId: string): Task[] => {
    return DEMO_TASKS.map((demoTask, index) => ({
      ...demoTask,
      id: `demo-task-${index + 1}`,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  // Créer des tâches de démonstration pour les nouveaux utilisateurs
  const createDemoTasks = useCallback(
    async (userId: string) => {
      if (!isAuthenticatedUser) {
        return [];
      }

      try {
        const demoTaskPromises = DEMO_TASKS.map(async (demoTask) => {
          const taskData = {
            ...demoTask,
            status: demoTask.status,
            dependencies: demoTask.dependencies,
            tags: demoTask.tags,
            blockedBy: demoTask.blockedBy,
          };

          return await tasksService.createTask({
            ...taskData,
            userId,
          });
        });

        const taskIds = await Promise.all(demoTaskPromises);

        // Marquer comme créées pour cet utilisateur
        await AsyncStorage.setItem(`@demo_tasks_created_${userId}`, "true");

        return taskIds;
      } catch (error) {
        return [];
      }
    },
    [isAuthenticatedUser]
  );

  // Charger les tâches au montage
  useEffect(() => {
    if (!hasValidUser) {
      setLoading(false);
      setTasks([]);
      setError(null);
      return;
    }

    const loadTasks = async () => {
      try {
        setLoading(true);
        setError(null);

        // Pour les utilisateurs invités, toujours charger les tâches d'exemple locales
        if (isGuestUser) {
          const localDemoTasks = createLocalDemoTasks(user.uid);
          setTasks(localDemoTasks);
          return;
        }

        // Pour les utilisateurs authentifiés, essayer Firebase d'abord
        // Vérifier si les tâches de démo ont déjà été créées
        const demoTasksCreated = await AsyncStorage.getItem(
          `@demo_tasks_created_${user.uid}`
        );

        // Charger les tâches existantes
        const userTasks = await tasksService.getTasksByUser(user.uid);

        // Si l'utilisateur n'a pas de tâches et que les démos n'ont pas été créées, créer les démos
        if (userTasks.length === 0 && demoTasksCreated !== "true") {
          await createDemoTasks(user.uid);

          // Recharger les tâches après création des démos
          const updatedTasks = await tasksService.getTasksByUser(user.uid);
          setTasks(updatedTasks);
        } else {
          setTasks(userTasks);
        }
      } catch (err: any) {
        // Gérer les erreurs de permissions spécifiquement
        if (err?.code === "permission-denied") {
          setError(null); // Ne pas afficher l'erreur à l'utilisateur

          // Créer des tâches d'exemple locales
          const localDemoTasks = createLocalDemoTasks(user.uid);
          setTasks(localDemoTasks);
        } else if (err?.code === "unauthenticated") {
          setError("Vous devez être connecté pour accéder aux tâches");
        } else {
          const localDemoTasks = createLocalDemoTasks(user.uid);
          setTasks(localDemoTasks);
          setError(null); // Ne pas afficher l'erreur car on a un fallback
        }
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [
    user?.uid,
    hasValidUser,
    isGuestUser,
    createDemoTasks,
    createLocalDemoTasks,
  ]);

  // Écouter les changements en temps réel
  useEffect(() => {
    // Les utilisateurs invités n'ont pas besoin d'abonnement temps réel
    if (isGuestUser) {
      return;
    }

    if (!isAuthenticatedUser) {
      return;
    }

    let unsubscribe: (() => void) | null = null;

    try {
      unsubscribe = tasksService.subscribeToUserTasks(
        user.uid,
        (updatedTasks) => {
          setTasks(updatedTasks);
          setLoading(false);
        }
      );
    } catch (err: any) {
      if (err?.code === "permission-denied") {
        // Charger les tâches locales si pas déjà fait
        if (tasks.length === 0) {
          const localDemoTasks = createLocalDemoTasks(user.uid);
          setTasks(localDemoTasks);
        }
      } else {}
      // Continuer sans abonnement temps réel en cas d'erreur de permissions
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user?.uid, isAuthenticatedUser]);

  // Créer une nouvelle tâche
  const createTask = useCallback(
    async (taskData: TaskFormData): Promise<string | null> => {
      if (!hasValidUser) {
        Alert.alert("Erreur", "Vous devez être connecté pour créer une tâche");
        return null;
      }

      // Pour les utilisateurs invités, créer la tâche localement
      if (isGuestUser) {
        const newLocalTask: Task = {
          ...taskData,
          id: `local-task-${Date.now()}`,
          userId: user.uid,
          status: taskData.status || "todo",
          dependencies: taskData.dependencies || [],
          blockedBy: [],
          tags: taskData.tags || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setTasks((prevTasks) => [...prevTasks, newLocalTask]);
        Alert.alert("Succès", "Tâche créée avec succès (mode invité)");

        try {
          const enabled =
            planningPreferences?.notificationSettings?.taskReminders
              ?.enabled === true;
          if (enabled) {
            await taskNotificationService.scheduleAutoReminders(newLocalTask);
          }
        } catch (e) {}
        return newLocalTask.id;
      }

      // Préparer les données de la tâche
      const newTask = {
        ...taskData,
        userId: user.uid,
        status: taskData.status || "todo",
        dependencies: taskData.dependencies || [],
        blockedBy: [],
        tags: taskData.tags || [],
      };

      try {
        const taskId = await tasksService.createTask(newTask);

        // Vérifier que l'ID est valide
        if (!taskId || taskId.length === 0) {
          throw new Error("Service de tâches n'a pas retourné d'ID valide");
        }

        // Forcer un rechargement des tâches après création
        setTimeout(async () => {
          try {
            const updatedTasks = await tasksService.getTasksByUser(user.uid);
            setTasks(updatedTasks);
          } catch (error: any) {
            if (error?.code === "permission-denied") {} else {}
          }
        }, 500);

        Alert.alert("Succès", "Tâche créée avec succès");

        try {
          const enabled =
            planningPreferences?.notificationSettings?.taskReminders
              ?.enabled === true;
          if (enabled) {
            const createdTask: Task = {
              ...newTask,
              id: taskId,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await taskNotificationService.scheduleAutoReminders(createdTask);
          }
        } catch (e) {}
        return taskId;
      } catch (error: any) {
        // Gestion spécifique des erreurs Firebase
        if (error?.code === "permission-denied") {
          // Créer une tâche locale temporaire
          const localTaskId = `local_task_${Date.now()}`;
          const localTask: Task = {
            id: localTaskId,
            ...newTask,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          // Ajouter à la liste locale
          setTasks((prevTasks) => [...prevTasks, localTask]);

          Alert.alert(
            "Info",
            "Tâche créée en mode local (configuration Firebase en cours)"
          );
          return localTaskId;
        } else {
          Alert.alert("Erreur", "Impossible de créer la tâche");
          return null;
        }
      }
    },
    [isAuthenticatedUser, user?.uid]
  );

  // Mettre à jour une tâche
  const updateTask = useCallback(
    async (taskId: string, updates: Partial<Task>): Promise<boolean> => {
      if (!hasValidUser) {
        Alert.alert(
          "Erreur",
          "Vous devez être connecté pour mettre à jour une tâche"
        );
        return false;
      }

      // Pour les utilisateurs invités, mettre à jour localement
      if (isGuestUser) {
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === taskId
              ? { ...task, ...updates, updatedAt: new Date().toISOString() }
              : task
          )
        );
        return true;
      }

      try {
        await tasksService.updateTask(taskId, updates);
        try {
          const enabled =
            planningPreferences?.notificationSettings?.taskReminders
              ?.enabled === true;
          if (enabled) {
            const current = tasks.find((t) => t.id === taskId);
            if (current) {
              const merged: Task = {
                ...current,
                ...updates,
                updatedAt: new Date().toISOString(),
              } as Task;
              await taskNotificationService.scheduleAutoReminders(merged);
            }
          }
        } catch (e) {}
        return true;
      } catch (error) {
        Alert.alert("Erreur", "Impossible de mettre à jour la tâche");
        return false;
      }
    },
    [hasValidUser, isGuestUser]
  );

  // Changer le statut d'une tâche
  const updateTaskStatus = useCallback(
    async (taskId: string, status: Task["status"]): Promise<boolean> => {
      if (!hasValidUser) {
        Alert.alert(
          "Erreur",
          "Vous devez être connecté pour changer le statut d'une tâche"
        );
        return false;
      }

      // Pour les utilisateurs invités, mettre à jour localement
      if (isGuestUser) {
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === taskId
              ? { ...task, status, updatedAt: new Date().toISOString() }
              : task
          )
        );
        return true;
      }

      try {
        await tasksService.updateTask(taskId, { status });
        return true;
      } catch (error) {
        Alert.alert("Erreur", "Impossible de changer le statut de la tâche");
        return false;
      }
    },
    [hasValidUser, isGuestUser]
  );

  // Supprimer une tâche
  const deleteTask = useCallback(
    async (taskId: string): Promise<boolean> => {
      if (!hasValidUser) {
        Alert.alert(
          "Erreur",
          "Vous devez être connecté pour supprimer une tâche"
        );
        return false;
      }

      // Pour les utilisateurs invités, supprimer localement
      if (isGuestUser) {
        setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
        Alert.alert("Succès", "Tâche supprimée avec succès (mode invité)");
        return true;
      }

      try {
        await tasksService.deleteTask(taskId);
        try {
          // Annuler toutes les notifications (pas d'API filtre par tâche dans RNPN)
          await taskNotificationService.cancelTaskNotifications(taskId);
        } catch (e) {}
        Alert.alert("Succès", "Tâche supprimée avec succès");
        return true;
      } catch (error) {
        Alert.alert("Erreur", "Impossible de supprimer la tâche");
        return false;
      }
    },
    [isAuthenticatedUser]
  );

  // Assigner une tâche
  const assignTask = useCallback(
    async (taskId: string, assignedTo: string[]): Promise<boolean> => {
      if (!isAuthenticatedUser) {
        Alert.alert(
          "Erreur",
          "Vous devez être connecté pour assigner une tâche"
        );
        return false;
      }
      try {
        await tasksService.updateTask(taskId, { assignedTo });
        return true;
      } catch (error) {
        Alert.alert("Erreur", "Impossible d'assigner la tâche");
        return false;
      }
    },
    [isAuthenticatedUser]
  );

  // Obtenir les tâches par statut (pour Kanban)
  const getTasksByStatus = useCallback((): Record<Task["status"], Task[]> => {
    const tasksByStatus: Record<Task["status"], Task[]> = {
      todo: [],
      in_progress: [],
      review: [],
      completed: [],
      blocked: [],
    };

    tasks.forEach((task) => {
      tasksByStatus[task.status].push(task);
    });

    return tasksByStatus;
  }, [tasks]);

  // Obtenir les tâches par priorité
  const getTasksByPriority = useCallback(
    (priority: Task["priority"]): Task[] => {
      return tasks.filter((task) => task.priority === priority);
    },
    [tasks]
  );

  // Obtenir les tâches en retard
  const getOverdueTasks = useCallback((): Task[] => {
    const now = new Date();
    return tasks.filter((task) => {
      if (!task.dueDate || task.status === "completed") return false;
      return new Date(task.dueDate) < now;
    });
  }, [tasks]);

  // Obtenir les tâches d'aujourd'hui
  const getTodayTasks = useCallback((): Task[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return tasks.filter((task) => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate >= today && dueDate < tomorrow;
    });
  }, [tasks]);

  // Statistiques des tâches
  const getTaskStats = useCallback(() => {
    const total = tasks.length;
    const completed = tasks.filter(
      (task) => task.status === "completed"
    ).length;
    const inProgress = tasks.filter(
      (task) => task.status === "in_progress"
    ).length;
    const todo = tasks.filter((task) => task.status === "todo").length;
    const blocked = tasks.filter((task) => task.status === "blocked").length;
    const overdue = getOverdueTasks().length;

    return {
      total,
      completed,
      inProgress,
      todo,
      blocked,
      overdue,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [tasks, getOverdueTasks]);

  // Supprimer toutes les tâches
  const deleteAllTasks = useCallback(async (): Promise<void> => {
    if (!hasValidUser) {
      return;
    }

    try {
      if (isGuestUser) {
        // Pour les utilisateurs invités, vider la liste locale
        setTasks([]);
      } else {
        // Pour les utilisateurs authentifiés, supprimer via Firebase
        const userTasks = await tasksService.getTasksByUser(user.uid);
        for (const task of userTasks) {
          await tasksService.deleteTask(task.id);
        }
        setTasks([]);
      }
    } catch (error) {
      throw error;
    }
  }, [hasValidUser, user?.uid, isGuestUser]);

  // Recréer les tâches d'exemple
  const recreateDemoTasks = useCallback(async (): Promise<void> => {
    if (!hasValidUser) {
      return;
    }

    try {
      // Supprimer d'abord toutes les tâches existantes
      await deleteAllTasks();

      // Puis créer les nouvelles tâches d'exemple
      if (isGuestUser) {
        const localDemoTasks = createLocalDemoTasks(user.uid);
        setTasks(localDemoTasks);
      } else {
        await createDemoTasks(user.uid);
        // Recharger les tâches après création
        const updatedTasks = await tasksService.getTasksByUser(user.uid);
        setTasks(updatedTasks);
      }
    } catch (error) {
      throw error;
    }
  }, [
    hasValidUser,
    user?.uid,
    isGuestUser,
    deleteAllTasks,
    createDemoTasks,
    createLocalDemoTasks,
  ]);

  return {
    // État
    tasks,
    loading,
    error,

    // Actions
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
    assignTask,
    deleteAllTasks,
    createDemoTasks: recreateDemoTasks,

    // Utilitaires
    getTasksByStatus,
    getTasksByPriority,
    getOverdueTasks,
    getTodayTasks,
    getTaskStats,

    // Recharger
    refetch: () => {
      if (isGuestUser) {
        // Pour les invités, recharger les tâches d'exemple locales
        const localDemoTasks = createLocalDemoTasks(user.uid);
        setTasks(localDemoTasks);
      } else if (isAuthenticatedUser) {
        tasksService.getTasksByUser(user.uid).then(setTasks);
      }
    },
  };
};
