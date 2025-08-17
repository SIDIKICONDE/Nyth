// Types pour la fonctionnalité de planification
export interface EventFilter {
  startDate?: Date;
  endDate?: Date;
  status?: string[];
  type?: string[];
  userId?: string;
}

export interface PlanningEvent {
  id: string;
  userId: string;
  title: string;
  description?: string;
  type:
    | "script_creation"
    | "recording"
    | "editing"
    | "review"
    | "meeting"
    | "deadline";
  startDate: Date;
  endDate: Date;
  status: "planned" | "in_progress" | "completed" | "cancelled" | "postponed";
  priority: "low" | "medium" | "high" | "urgent";

  // Liens avec le contenu existant
  scriptId?: string;
  recordingId?: string;
  projectId?: string;

  // Rappels et notifications
  reminders: Reminder[];
  calendarEventId?: string;

  // Métadonnées
  location?: string;
  tags: string[];
  color?: string;
  estimatedDuration?: number; // en minutes
  actualDuration?: number; // en minutes

  // Collaboration
  assignedTo?: string[];
  teamId?: string;

  // Récurrence
  recurring?: RecurringPattern;

  createdAt: string;
  updatedAt: string;
}

export interface Reminder {
  id: string;
  type: "notification" | "email" | "sms";
  triggerBefore: number; // minutes avant l'événement
  message?: string;
  sent: boolean;
  sentAt?: string;
}

export interface RecurringPattern {
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  interval: number; // tous les X jours/semaines/mois
  daysOfWeek?: number[]; // 0-6, pour weekly
  endDate?: Date;
  maxOccurrences?: number;
}

// Système d'objectifs
export interface Goal {
  id: string;
  userId: string;
  teamId?: string;
  title: string;
  description: string;

  // Type et métriques
  type:
    | "scripts"
    | "recordings"
    | "duration"
    | "quality"
    | "consistency"
    | "collaboration";
  target: number;
  current: number;
  unit: string; // 'scripts', 'minutes', 'hours', 'videos', etc.

  // Période
  period: "daily" | "weekly" | "monthly" | "quarterly" | "yearly" | "custom";
  startDate: Date;
  endDate: Date;

  // Statut et progression
  status: "active" | "completed" | "paused" | "cancelled" | "overdue";
  progress: number; // 0-100

  // Récompenses et motivation
  rewards?: Achievement[];
  milestones: Milestone[];

  // Métadonnées
  category: string;
  tags: string[];
  priority: "low" | "medium" | "high";

  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  targetValue: number;
  achieved: boolean;
  achievedAt?: string;
  reward?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  unlockedAt?: string;
}

// Types pour les pièces jointes
export interface TaskAttachment {
  id: string;
  taskId: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  thumbnailUrl?: string; // Pour les images
  uploadedAt: string;
  uploadedBy: string;
  type: "image" | "document" | "video" | "audio" | "other";
  fileHash?: string; // Hash du contenu pour détecter les doublons
}

export interface TaskImage {
  id: string;
  taskId: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  uploadedAt: string;
  uploadedBy: string;
  fileHash?: string; // Hash du contenu pour détecter les doublons
}

// Système de tâches
export interface Task {
  id: string;
  userId: string;
  projectId?: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "review" | "completed" | "blocked";
  priority: "low" | "medium" | "high" | "urgent";

  // Assignation
  assignedTo?: string[];

  // Dates
  dueDate?: Date;
  startDate?: Date;
  completedAt?: string;

  // Liens
  eventId?: string;
  scriptId?: string;
  recordingId?: string;
  goalId?: string;

  // Dépendances
  dependencies: string[]; // IDs d'autres tâches
  blockedBy: string[];

  // Estimation
  estimatedHours?: number;
  actualHours?: number;

  // Métadonnées
  tags: string[];
  category?: string;
  color?: string;

  // Pièces jointes
  attachments?: TaskAttachment[];
  images?: TaskImage[];

  // Personnalisation
  customization?: TaskCustomization;

  // Sous-tâches
  subtasks?: Subtask[];

  createdAt: string;
  updatedAt: string;
}

// Interface pour les sous-tâches
export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  order: number;
  estimatedHours?: number;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Interface pour la personnalisation des cartes de tâches
export interface TaskCustomization {
  cardColor?: string;
  cardIcon?: string;
  cardStyle?:
    | "default"
    | "minimal"
    | "detailed"
    | "creative"
    | "compact"
    | "modern"
    | "kanban"
    | "timeline"
    | "priority"
    | "progress"
    | "team"
    | "glass";
  showEstimatedTime?: boolean;
  showProgress?: boolean;
  showAttachments?: boolean;
  showSubtasks?: boolean;
}

// Types pour les formulaires de tâches
export interface TaskFormData {
  title: string;
  description: string;
  priority: Task["priority"];
  status: Task["status"];
  dueDate?: Date;
  startDate?: Date;
  estimatedHours?: number;
  tags: string[];
  category?: string;
  assignedTo?: string[];
  projectId?: string;
  dependencies?: string[];
  customization?: TaskCustomization;
  attachments?: TaskAttachment[];
  images?: TaskImage[];
  subtasks?: Subtask[];
}

// Types pour Kanban Board
export interface KanbanColumn {
  id: Task["status"];
  title: string;
  color: string;
  tasks: Task[];
  maxTasks?: number;
}

export interface KanbanBoardProps {
  tasks: Task[];
  onTaskMove: (taskId: string, newStatus: Task["status"]) => void;
  onTaskPress: (task: Task) => void;
  onTaskCreate: (status: Task["status"]) => void;
  onTaskEdit: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
}

export interface TaskCardProps {
  task: Task;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isDragging?: boolean;
}

// Équipes et collaboration
export interface Team {
  id: string;
  name: string;
  description: string;
  ownerId: string;

  // Membres
  members: TeamMember[];
  invitations: TeamInvitation[];
  memberIds: string[];

  // Projets et planification
  projects: string[]; // IDs des projets

  // Configuration
  settings: TeamSettings;

  // Métadonnées
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface TeamMember {
  userId: string;
  role: "owner" | "admin" | "editor" | "viewer";
  permissions: TeamPermission[];
  joinedAt: string;
  lastActiveAt?: string;
}

export interface TeamInvitation {
  id: string;
  email: string;
  role: TeamMember["role"];
  invitedBy: string;
  invitedAt: string;
  expiresAt: string;
  status: "pending" | "accepted" | "declined" | "expired";
}

export interface TeamPermission {
  resource: "events" | "goals" | "projects" | "members" | "settings";
  actions: ("create" | "read" | "update" | "delete")[];
}

export interface TeamSettings {
  visibility: "private" | "public";
  allowMemberInvites: boolean;
  requireApprovalForEvents: boolean;
  defaultEventReminders: Reminder[];
  workingHours: WorkingHours;
  timezone: string;
}

export interface WorkingHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface DaySchedule {
  isWorkingDay: boolean;
  startTime: string; // "09:00"
  endTime: string; // "17:00"
  breaks: TimeSlot[];
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  title?: string;
}

// Projets
export interface Project {
  id: string;
  teamId?: string;
  userId: string; // propriétaire

  name: string;
  description: string;
  status:
    | "planning"
    | "active"
    | "on_hold"
    | "review"
    | "completed"
    | "cancelled";

  // Timeline
  startDate: Date;
  endDate: Date;
  estimatedDuration: number; // en jours

  // Contenu
  tasks: string[]; // IDs des tâches liées
  events: string[]; // IDs des événements liés
  goals: string[]; // IDs des objectifs liés

  // Équipe
  assignedMembers: string[];

  // Progression
  progress: number; // 0-100

  // Budget (optionnel)
  budget?: ProjectBudget;

  // Métadonnées
  tags: string[];
  priority: "low" | "medium" | "high" | "critical";
  category: string;

  createdAt: string;
  updatedAt: string;
}

export interface ProjectBudget {
  total: number;
  spent: number;
  currency: string;
  items: BudgetItem[];
}

export interface BudgetItem {
  id: string;
  name: string;
  category: string;
  budgeted: number;
  actual: number;
  date: string;
}

// Dashboard et analytics
export interface PlanningAnalytics {
  userId: string;
  teamId?: string;
  period: "week" | "month" | "quarter" | "year";

  // Événements
  eventsCompleted: number;
  eventsPlanned: number;
  completionRate: number;

  // Objectifs
  goalsActive: number;
  goalsCompleted: number;
  goalCompletionRate: number;

  // Tâches
  tasksCompleted: number;
  tasksActive: number;
  taskCompletionRate: number;
  averageTaskDuration: number;

  // Productivité
  plannedHours: number;
  actualHours: number;
  efficiencyRate: number;

  // Tendances
  trends: AnalyticsTrend[];

  // Insights
  insights: PlanningInsight[];

  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsTrend {
  metric: string;
  period: string;
  value: number;
  change: number; // pourcentage
  direction: "up" | "down" | "stable";
}

export interface PlanningInsight {
  type: "suggestion" | "warning" | "achievement" | "trend";
  title: string;
  description: string;
  actionable: boolean;
  action?: string;
  priority: "low" | "medium" | "high";
}

// Préférences utilisateur pour la planification
export interface PlanningPreferences {
  userId: string;

  // Vue par défaut
  defaultView: "calendar" | "timeline" | "kanban" | "list";
  calendarStartDay: 0 | 1; // 0 = dimanche, 1 = lundi

  // Notifications
  enableNotifications: boolean;
  defaultReminders: Reminder[];
  notificationSound: boolean;

  // Heures de travail
  workingHours: WorkingHours;
  timezone: string;

  // Apparence
  theme: "light" | "dark" | "auto";
  accentColor: string;
  showWeekends: boolean;

  // Intégrations
  syncWithCalendar: boolean;
  calendarProvider?: "google" | "outlook" | "apple";

  // Objectifs
  showGoalProgress: boolean;
  goalNotifications: boolean;

  // Tâches
  showTaskProgress: boolean;
  taskNotifications: boolean;
  kanbanColumns: KanbanColumn[];

  updatedAt: string;
}

// Types pour les vues et l'interface
export interface CalendarViewProps {
  events: PlanningEvent[];
  goals: Goal[];
  onEventSelect: (event: PlanningEvent) => void;
  onEventCreate: (date: Date) => void;
  viewMode: "month" | "week" | "day";
}

export interface EventFormData {
  title: string;
  description: string;
  type: PlanningEvent["type"];
  startDate: Date;
  endDate: Date;
  priority: PlanningEvent["priority"];
  reminders: Reminder[];
  tags: string[];
  scriptId?: string;
  assignedTo?: string[];
}

export interface GoalFormData {
  title: string;
  description: string;
  type: Goal["type"];
  target: number;
  unit: string;
  period: Goal["period"];
  startDate: Date;
  endDate: Date;
  category: string;
  priority: Goal["priority"];
}

// Types pour Kanban Board avec colonnes dynamiques
export interface DynamicKanbanColumn {
  id: string;
  title: string;
  color: string;
  description?: string;
  maxTasks?: number;
  order: number;
  isDefault?: boolean;
  icon?: string;
  borderStyle?: "solid" | "dashed" | "gradient";
  autoProgress?: boolean;
  validationRules?: string;
  validationOptions?: ValidationOptions;
  template?: string;
  workflowRules?: WorkflowRule[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowRule {
  id: string;
  type: "auto_move" | "validation" | "notification" | "time_limit";
  condition: string;
  action: string;
  enabled: boolean;
}

export interface ValidationOptions {
  requireAssignee?: boolean;
  requireDueDate?: boolean;
  requireAttachments?: boolean;
  requireSubtasks?: boolean;
  requireDescription?: boolean;
  requireTags?: boolean;
  minPriority?: "none" | "medium" | "high" | "urgent";
}

// Types pour Kanban Board (garde la compatibilité)
export interface KanbanColumn {
  id: Task["status"];
  title: string;
  color: string;
  tasks: Task[];
  maxTasks?: number;
}

// Mise à jour du type Task pour supporter les colonnes dynamiques
export interface TaskWithDynamicStatus extends Omit<Task, "status"> {
  status: string; // ID de la colonne au lieu des statuts fixes
  columnId: string; // Référence explicite à la colonne
}

// Types pour les formulaires de colonnes dynamiques
export interface ColumnFormData {
  title: string;
  description?: string;
  color: string;
  maxTasks?: number;
  icon?: string;
  borderStyle?: "solid" | "dashed" | "gradient";
  autoProgress?: boolean;
  validationRules?: string;
  validationOptions?: ValidationOptions;
  template?: string;
  workflowRules?: WorkflowRule[];
}
