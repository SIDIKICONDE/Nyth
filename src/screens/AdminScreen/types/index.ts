import { UserProfile } from "../../../types/user";

export interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

export interface AdminStats {
  totalUsers: number;
  totalAdmins: number;
  activeToday: number;
  totalScripts: number;
  totalRecordings: number;
  activeSubscriptions: number;
  premiumUsers: number;
  monthlyRevenue: number;
}

export interface ActivityItem {
  id: string;
  type: "script" | "recording";
  title?: string;
  userId?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface SubscriptionItem {
  id: string;
  userId: string;
  plan: string;
  status: string;
  endDate: string;
  [key: string]: any;
}

export type AdminTab =
  | "dashboard"
  | "users"
  | "stats"
  | "subscriptions"
  | "activity"
  | "analytics"
  | "controls"
  | "userActivity"
  | "banManagement"
  | "appLock"
  | "messaging"
  | "systemLogs";

export interface AdminDataState {
  users: UserProfile[];
  stats: AdminStats | null;
  subscriptions: SubscriptionItem[];
  recentActivity: ActivityItem[];
  loading: boolean;
  syncing: boolean;
}
