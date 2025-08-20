export interface SubscriptionPlan {
  id: "free" | "starter" | "pro" | "enterprise";
  name: string;
  displayName: string;
  price: number;
  currency: string;
  period: "month" | "year";
  limits: {
    dailyGenerations?: number;
    monthlyGenerations?: number;
    totalGenerations?: number;
    apis: string[];
    models: string[];
    features: string[];
  };
  popular?: boolean;
  description: string;
  color: string;
}

export interface Subscription {
  planId: string;
  status: "active" | "cancelled" | "expired" | "trial";
  startDate: string;
  endDate?: string;
  planLimits?: {
    [key: string]: number;
  };
  paymentMethod?: {
    type: "card" | "paypal" | "apple" | "google";
    last4?: string;
  };
}

export interface SubscriptionUsage {
  userId: string;
  usage: {
    [key: string]: number;
  };
  lastResetDate?: string;
  updatedAt?: string;
}

export interface UserSubscription {
  planId: string;
  status: "active" | "cancelled" | "expired" | "trial";
  startDate: string;
  endDate?: string;
  usage: {
    daily: number;
    monthly: number;
    total: number;
    lastReset: string;
  };
  paymentMethod?: {
    type: "card" | "paypal" | "apple" | "google";
    last4?: string;
  };
}

export interface UsageStats {
  generations: {
    today: number;
    thisMonth: number;
    total: number;
  };
  limits: {
    daily?: number;
    monthly?: number;
  };
  resetDate: string;
}

export interface ManagedAPIConfig {
  provider: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export type PaymentProvider = "stripe" | "revenuecat" | "paddle";

export interface PaymentResult {
  success: boolean;
  subscriptionId?: string;
  error?: string;
  checkoutUrl?: string;
}
