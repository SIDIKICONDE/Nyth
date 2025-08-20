import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";
import { useTheme } from "../../../../contexts/ThemeContext";
import { getApp } from "@react-native-firebase/app";
import {
  getFirestore,
  collection,
  query,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  where,
  orderBy,
  Timestamp,
  limit,
  FirebaseFirestoreTypes,
} from "@react-native-firebase/firestore";

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: "monthly" | "yearly" | "lifetime";
  features: string[];
  limits: {
    maxRecordings?: number;
    maxRecordingDuration?: number;
    maxStorage?: number;
    aiCredits?: number;
    exportFormats?: string[];
  };
  isActive: boolean;
  isPopular?: boolean;
  discount?: number;
  trialDays?: number;
  stripeProductId?: string;
  stripePriceId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface UserSubscription {
  id: string;
  userId: string;
  userEmail: string;
  planId: string;
  planName: string;
  status: "active" | "cancelled" | "expired" | "trial" | "paused";
  startDate: Timestamp;
  endDate?: Timestamp;
  cancelledAt?: Timestamp;
  amount: number;
  currency: string;
  paymentMethod?: string;
  stripeSubscriptionId?: string;
  autoRenew: boolean;
}

interface SubscriptionStats {
  totalSubscribers: number;
  activeSubscriptions: number;
  trialUsers: number;
  cancelledThisMonth: number;
  revenue: {
    monthly: number;
    yearly: number;
    total: number;
  };
  popularPlans: { planId: string; count: number }[];
  churnRate: number;
  averageLifetimeValue: number;
}

export const SubscriptionManagementTab: React.FC = () => {
  const { currentTheme } = useTheme();
  const db = getFirestore(getApp());
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<
    "plans" | "users" | "stats" | "settings"
  >("plans");

  // Plans
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);

  // Subscriptions
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "cancelled" | "expired" | "trial"
  >("all");

  // Stats
  const [stats, setStats] = useState<SubscriptionStats>({
    totalSubscribers: 0,
    activeSubscriptions: 0,
    trialUsers: 0,
    cancelledThisMonth: 0,
    revenue: { monthly: 0, yearly: 0, total: 0 },
    popularPlans: [],
    churnRate: 0,
    averageLifetimeValue: 0,
  });

  // Settings
  const [settings, setSettings] = useState({
    enableSubscriptions: true,
    requirePaymentMethod: true,
    allowTrials: true,
    defaultTrialDays: 7,
    autoRenew: true,
    sendExpiryReminders: true,
    reminderDaysBefore: 3,
    allowPlanDowngrade: true,
    allowPlanUpgrade: true,
    refundPolicy: "no_refund", // no_refund, prorated, full
    gracePeriodDays: 3,
    suspendOnFailedPayment: true,
    maxPaymentRetries: 3,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadPlans(),
        loadSubscriptions(),
        loadStats(),
        loadSettings(),
      ]);
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadPlans = async () => {
    const plansQuery = query(
      collection(db, "subscription_plans"),
      orderBy("price", "asc")
    );
    const snapshot = await getDocs(plansQuery);
    const plansData: SubscriptionPlan[] = [];
    snapshot.forEach((doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
      plansData.push({ id: doc.id, ...doc.data() } as SubscriptionPlan);
    });
    setPlans(plansData);
  };

  const loadSubscriptions = async () => {
    const subsQuery = query(
      collection(db, "user_subscriptions"),
      orderBy("startDate", "desc")
    );
    const snapshot = await getDocs(subsQuery);
    const subsData: UserSubscription[] = [];
    snapshot.forEach((doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
      subsData.push({ id: doc.id, ...doc.data() } as UserSubscription);
    });
    setSubscriptions(subsData);
  };

  const loadStats = async () => {
    // Calculer les statistiques depuis les données
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const activeCount = subscriptions.filter(
      (s) => s.status === "active"
    ).length;
    const trialCount = subscriptions.filter((s) => s.status === "trial").length;
    const cancelledThisMonth = subscriptions.filter(
      (s) => s.cancelledAt && s.cancelledAt.toDate() >= startOfMonth
    ).length;

    // Calculer les revenus
    const monthlyRevenue = subscriptions
      .filter((s) => s.status === "active")
      .reduce((sum, s) => sum + (s.amount || 0), 0);

    setStats({
      totalSubscribers: subscriptions.length,
      activeSubscriptions: activeCount,
      trialUsers: trialCount,
      cancelledThisMonth,
      revenue: {
        monthly: monthlyRevenue,
        yearly: monthlyRevenue * 12,
        total: subscriptions.reduce((sum, s) => sum + (s.amount || 0), 0),
      },
      popularPlans: [],
      churnRate: (cancelledThisMonth / (activeCount || 1)) * 100,
      averageLifetimeValue: monthlyRevenue * 24, // Estimation 24 mois
    });
  };

  const loadSettings = async () => {
    try {
      const settingsSnap = await getDoc(
        doc(db, "system", "subscription_settings")
      );
      if (settingsSnap.exists()) {
        setSettings(settingsSnap.data() as typeof settings);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des paramètres:", error);
    }
  };

  const savePlan = async () => {
    if (!editingPlan) return;

    try {
      const planData = {
        ...editingPlan,
        updatedAt: Timestamp.now(),
      };

      if (editingPlan.id) {
        await updateDoc(
          doc(db, "subscription_plans", editingPlan.id),
          planData
        );
      } else {
        const newPlan = {
          ...planData,
          id: undefined,
          createdAt: Timestamp.now(),
        };
        await setDoc(doc(collection(db, "subscription_plans")), newPlan);
      }

      Alert.alert("Succès", "Plan sauvegardé avec succès");
      setShowPlanModal(false);
      setEditingPlan(null);
      loadPlans();
    } catch (error) {
      Alert.alert("Erreur", "Impossible de sauvegarder le plan");
    }
  };

  const deletePlan = async (planId: string) => {
    Alert.alert(
      "Supprimer le plan",
      "Êtes-vous sûr de vouloir supprimer ce plan ? Les abonnements existants ne seront pas affectés.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "subscription_plans", planId));
              Alert.alert("Succès", "Plan supprimé");
              loadPlans();
            } catch (error) {
              Alert.alert("Erreur", "Impossible de supprimer le plan");
            }
          },
        },
      ]
    );
  };

  const cancelSubscription = async (subscriptionId: string) => {
    Alert.alert(
      "Annuler l'abonnement",
      "Voulez-vous annuler cet abonnement ?",
      [
        { text: "Non", style: "cancel" },
        {
          text: "Oui, annuler",
          style: "destructive",
          onPress: async () => {
            try {
              await updateDoc(doc(db, "user_subscriptions", subscriptionId), {
                status: "cancelled",
                cancelledAt: Timestamp.now(),
                autoRenew: false,
              });
              Alert.alert("Succès", "Abonnement annulé");
              loadSubscriptions();
            } catch (error) {
              Alert.alert("Erreur", "Impossible d'annuler l'abonnement");
            }
          },
        },
      ]
    );
  };

  const extendSubscription = async (subscriptionId: string, days: number) => {
    try {
      const sub = subscriptions.find((s) => s.id === subscriptionId);
      if (!sub || !sub.endDate) return;

      const newEndDate = new Date(sub.endDate.toDate());
      newEndDate.setDate(newEndDate.getDate() + days);

      await updateDoc(doc(db, "user_subscriptions", subscriptionId), {
        endDate: Timestamp.fromDate(newEndDate),
      });

      Alert.alert("Succès", `Abonnement prolongé de ${days} jours`);
      loadSubscriptions();
    } catch (error) {
      Alert.alert("Erreur", "Impossible de prolonger l'abonnement");
    }
  };

  const saveSettings = async () => {
    try {
      await setDoc(doc(db, "system", "subscription_settings"), settings);
      Alert.alert("Succès", "Paramètres sauvegardés");
    } catch (error) {
      Alert.alert("Erreur", "Impossible de sauvegarder les paramètres");
    }
  };

  const renderPlanCard = (plan: SubscriptionPlan) => (
    <TouchableOpacity
      key={plan.id}
      style={[
        tw`p-4 rounded-lg mb-3`,
        { backgroundColor: currentTheme.colors.surface },
      ]}
      onPress={() => {
        setEditingPlan(plan);
        setShowPlanModal(true);
      }}
    >
      <View style={tw`flex-row justify-between items-start mb-2`}>
        <View style={tw`flex-1`}>
          <View style={tw`flex-row items-center`}>
            <Text
              style={[
                tw`text-lg font-bold`,
                { color: currentTheme.colors.text },
              ]}
            >
              {plan.name}
            </Text>
            {plan.isPopular && (
              <View
                style={[
                  tw`ml-2 px-2 py-1 rounded-full`,
                  { backgroundColor: currentTheme.colors.primary + "20" },
                ]}
              >
                <Text
                  style={[tw`text-xs`, { color: currentTheme.colors.primary }]}
                >
                  Populaire
                </Text>
              </View>
            )}
          </View>
          <Text
            style={[
              tw`text-sm mt-1`,
              { color: currentTheme.colors.textSecondary },
            ]}
          >
            {plan.description}
          </Text>
        </View>
        <View style={tw`items-end`}>
          <Text
            style={[
              tw`text-xl font-bold`,
              { color: currentTheme.colors.primary },
            ]}
          >
            {plan.currency} {plan.price}
          </Text>
          <Text
            style={[tw`text-xs`, { color: currentTheme.colors.textSecondary }]}
          >
            /
            {plan.interval === "monthly"
              ? "mois"
              : plan.interval === "yearly"
              ? "an"
              : "vie"}
          </Text>
        </View>
      </View>

      <View style={tw`flex-row items-center justify-between mt-3`}>
        <View style={tw`flex-row items-center`}>
          <Switch
            value={plan.isActive}
            onValueChange={async (value) => {
              await updateDoc(doc(db, "subscription_plans", plan.id), {
                isActive: value,
              });
              loadPlans();
            }}
            trackColor={{
              false: currentTheme.colors.textSecondary + "30",
              true: currentTheme.colors.primary + "80",
            }}
            thumbColor={
              plan.isActive
                ? currentTheme.colors.primary
                : currentTheme.colors.textSecondary
            }
          />
          <Text style={[tw`ml-2 text-sm`, { color: currentTheme.colors.text }]}>
            {plan.isActive ? "Actif" : "Inactif"}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            tw`p-2 rounded-lg`,
            { backgroundColor: currentTheme.colors.error + "20" },
          ]}
          onPress={() => deletePlan(plan.id)}
        >
          <MaterialCommunityIcons
            name="delete"
            size={20}
            color={currentTheme.colors.error}
          />
        </TouchableOpacity>
      </View>

      {plan.features && plan.features.length > 0 && (
        <View style={tw`mt-3 pt-3 border-t border-gray-200`}>
          {plan.features.slice(0, 3).map((feature, index) => (
            <View key={index} style={tw`flex-row items-center mt-1`}>
              <MaterialCommunityIcons
                name="check"
                size={16}
                color={currentTheme.colors.primary}
              />
              <Text
                style={[tw`ml-2 text-xs`, { color: currentTheme.colors.text }]}
              >
                {feature}
              </Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );

  const renderSubscriptionItem = (subscription: UserSubscription) => {
    const filteredSubs = subscriptions.filter(
      (s) =>
        (filterStatus === "all" || s.status === filterStatus) &&
        (searchQuery === "" ||
          s.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.planName.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return filteredSubs.map((sub) => (
      <View
        key={sub.id}
        style={[
          tw`p-3 rounded-lg mb-2`,
          { backgroundColor: currentTheme.colors.surface },
        ]}
      >
        <View style={tw`flex-row justify-between items-start`}>
          <View style={tw`flex-1`}>
            <Text
              style={[tw`font-medium`, { color: currentTheme.colors.text }]}
            >
              {sub.userEmail}
            </Text>
            <Text
              style={[
                tw`text-sm mt-1`,
                { color: currentTheme.colors.textSecondary },
              ]}
            >
              Plan: {sub.planName}
            </Text>
            <View style={tw`flex-row items-center mt-2`}>
              <View
                style={[
                  tw`px-2 py-1 rounded-full`,
                  {
                    backgroundColor:
                      sub.status === "active"
                        ? currentTheme.colors.success + "20"
                        : sub.status === "trial"
                        ? currentTheme.colors.warning + "20"
                        : currentTheme.colors.error + "20",
                  },
                ]}
              >
                <Text
                  style={[
                    tw`text-xs`,
                    {
                      color:
                        sub.status === "active"
                          ? currentTheme.colors.success
                          : sub.status === "trial"
                          ? currentTheme.colors.warning
                          : currentTheme.colors.error,
                    },
                  ]}
                >
                  {sub.status === "active"
                    ? "Actif"
                    : sub.status === "trial"
                    ? "Essai"
                    : sub.status === "cancelled"
                    ? "Annulé"
                    : sub.status === "expired"
                    ? "Expiré"
                    : "Pausé"}
                </Text>
              </View>
              <Text
                style={[
                  tw`ml-2 text-xs`,
                  { color: currentTheme.colors.textSecondary },
                ]}
              >
                Depuis: {sub.startDate.toDate().toLocaleDateString()}
              </Text>
            </View>
          </View>

          <View style={tw`flex-row`}>
            <TouchableOpacity
              style={tw`p-2`}
              onPress={() => extendSubscription(sub.id, 30)}
            >
              <MaterialCommunityIcons
                name="calendar-plus"
                size={20}
                color={currentTheme.colors.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={tw`p-2`}
              onPress={() => cancelSubscription(sub.id)}
            >
              <MaterialCommunityIcons
                name="cancel"
                size={20}
                color={currentTheme.colors.error}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    ));
  };

  const renderStats = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Cartes de statistiques principales */}
      <View style={tw`flex-row flex-wrap -mx-1`}>
        <View style={tw`w-1/2 px-1 mb-2`}>
          <View
            style={[
              tw`p-4 rounded-lg`,
              { backgroundColor: currentTheme.colors.primary + "20" },
            ]}
          >
            <MaterialCommunityIcons
              name="account-group"
              size={24}
              color={currentTheme.colors.primary}
            />
            <Text
              style={[
                tw`text-2xl font-bold mt-2`,
                { color: currentTheme.colors.primary },
              ]}
            >
              {stats.totalSubscribers}
            </Text>
            <Text
              style={[
                tw`text-xs`,
                { color: currentTheme.colors.textSecondary },
              ]}
            >
              Total abonnés
            </Text>
          </View>
        </View>

        <View style={tw`w-1/2 px-1 mb-2`}>
          <View
            style={[
              tw`p-4 rounded-lg`,
              { backgroundColor: currentTheme.colors.success + "20" },
            ]}
          >
            <MaterialCommunityIcons
              name="check-circle"
              size={24}
              color={currentTheme.colors.success}
            />
            <Text
              style={[
                tw`text-2xl font-bold mt-2`,
                { color: currentTheme.colors.success },
              ]}
            >
              {stats.activeSubscriptions}
            </Text>
            <Text
              style={[
                tw`text-xs`,
                { color: currentTheme.colors.textSecondary },
              ]}
            >
              Actifs
            </Text>
          </View>
        </View>

        <View style={tw`w-1/2 px-1 mb-2`}>
          <View
            style={[
              tw`p-4 rounded-lg`,
              { backgroundColor: currentTheme.colors.warning + "20" },
            ]}
          >
            <MaterialCommunityIcons
              name="clock-outline"
              size={24}
              color={currentTheme.colors.warning}
            />
            <Text
              style={[
                tw`text-2xl font-bold mt-2`,
                { color: currentTheme.colors.warning },
              ]}
            >
              {stats.trialUsers}
            </Text>
            <Text
              style={[
                tw`text-xs`,
                { color: currentTheme.colors.textSecondary },
              ]}
            >
              En essai
            </Text>
          </View>
        </View>

        <View style={tw`w-1/2 px-1 mb-2`}>
          <View
            style={[
              tw`p-4 rounded-lg`,
              { backgroundColor: currentTheme.colors.error + "20" },
            ]}
          >
            <MaterialCommunityIcons
              name="cancel"
              size={24}
              color={currentTheme.colors.error}
            />
            <Text
              style={[
                tw`text-2xl font-bold mt-2`,
                { color: currentTheme.colors.error },
              ]}
            >
              {stats.cancelledThisMonth}
            </Text>
            <Text
              style={[
                tw`text-xs`,
                { color: currentTheme.colors.textSecondary },
              ]}
            >
              Annulés ce mois
            </Text>
          </View>
        </View>
      </View>

      {/* Revenus */}
      <View
        style={[
          tw`p-4 rounded-lg mt-4`,
          { backgroundColor: currentTheme.colors.surface },
        ]}
      >
        <Text
          style={[
            tw`text-lg font-bold mb-3`,
            { color: currentTheme.colors.text },
          ]}
        >
          Revenus
        </Text>
        <View style={tw`mb-2`}>
          <Text
            style={[tw`text-sm`, { color: currentTheme.colors.textSecondary }]}
          >
            Mensuel
          </Text>
          <Text
            style={[
              tw`text-xl font-bold`,
              { color: currentTheme.colors.primary },
            ]}
          >
            € {stats.revenue.monthly.toFixed(2)}
          </Text>
        </View>
        <View style={tw`mb-2`}>
          <Text
            style={[tw`text-sm`, { color: currentTheme.colors.textSecondary }]}
          >
            Annuel estimé
          </Text>
          <Text
            style={[
              tw`text-xl font-bold`,
              { color: currentTheme.colors.primary },
            ]}
          >
            € {stats.revenue.yearly.toFixed(2)}
          </Text>
        </View>
        <View>
          <Text
            style={[tw`text-sm`, { color: currentTheme.colors.textSecondary }]}
          >
            Total historique
          </Text>
          <Text
            style={[
              tw`text-xl font-bold`,
              { color: currentTheme.colors.primary },
            ]}
          >
            € {stats.revenue.total.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Métriques */}
      <View
        style={[
          tw`p-4 rounded-lg mt-4`,
          { backgroundColor: currentTheme.colors.surface },
        ]}
      >
        <Text
          style={[
            tw`text-lg font-bold mb-3`,
            { color: currentTheme.colors.text },
          ]}
        >
          Métriques clés
        </Text>
        <View style={tw`mb-2`}>
          <Text
            style={[tw`text-sm`, { color: currentTheme.colors.textSecondary }]}
          >
            Taux de désabonnement
          </Text>
          <Text
            style={[tw`text-lg font-bold`, { color: currentTheme.colors.text }]}
          >
            {stats.churnRate.toFixed(1)}%
          </Text>
        </View>
        <View>
          <Text
            style={[tw`text-sm`, { color: currentTheme.colors.textSecondary }]}
          >
            Valeur vie client moyenne
          </Text>
          <Text
            style={[tw`text-lg font-bold`, { color: currentTheme.colors.text }]}
          >
            € {stats.averageLifetimeValue.toFixed(2)}
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderSettings = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View
        style={[
          tw`p-4 rounded-lg`,
          { backgroundColor: currentTheme.colors.surface },
        ]}
      >
        <Text
          style={[
            tw`text-lg font-bold mb-4`,
            { color: currentTheme.colors.text },
          ]}
        >
          Paramètres des abonnements
        </Text>

        {Object.entries({
          enableSubscriptions: "Activer les abonnements",
          requirePaymentMethod: "Méthode de paiement obligatoire",
          allowTrials: "Autoriser les périodes d'essai",
          autoRenew: "Renouvellement automatique par défaut",
          sendExpiryReminders: "Envoyer des rappels d'expiration",
          allowPlanDowngrade: "Autoriser le downgrade",
          allowPlanUpgrade: "Autoriser l'upgrade",
          suspendOnFailedPayment: "Suspendre si paiement échoué",
        }).map(([key, label]) => (
          <View
            key={key}
            style={tw`flex-row justify-between items-center mb-3`}
          >
            <Text style={[tw`flex-1`, { color: currentTheme.colors.text }]}>
              {label}
            </Text>
            <Switch
              value={settings[key as keyof typeof settings] as boolean}
              onValueChange={(value) =>
                setSettings({ ...settings, [key]: value })
              }
              trackColor={{
                false: currentTheme.colors.textSecondary + "30",
                true: currentTheme.colors.primary + "80",
              }}
              thumbColor={
                settings[key as keyof typeof settings]
                  ? currentTheme.colors.primary
                  : currentTheme.colors.textSecondary
              }
            />
          </View>
        ))}

        <View style={tw`mt-4 pt-4 border-t border-gray-200`}>
          <Text style={[tw`text-sm mb-2`, { color: currentTheme.colors.text }]}>
            Jours d'essai par défaut
          </Text>
          <TextInput
            style={[
              tw`p-2 rounded-lg`,
              {
                backgroundColor: currentTheme.colors.background,
                color: currentTheme.colors.text,
                borderWidth: 1,
                borderColor: currentTheme.colors.textSecondary + "30",
              },
            ]}
            value={settings.defaultTrialDays.toString()}
            onChangeText={(text) =>
              setSettings({
                ...settings,
                defaultTrialDays: parseInt(text) || 0,
              })
            }
            keyboardType="numeric"
          />
        </View>

        <TouchableOpacity
          style={[
            tw`mt-4 p-3 rounded-lg`,
            { backgroundColor: currentTheme.colors.primary },
          ]}
          onPress={saveSettings}
        >
          <Text style={[tw`text-center font-medium`, { color: "#FFFFFF" }]}>
            Sauvegarder les paramètres
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  if (loading) {
    return (
      <View style={tw`flex-1 justify-center items-center`}>
        <ActivityIndicator size="large" color={currentTheme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={tw`flex-1`}>
      {/* Tabs */}
      <View style={tw`flex-row p-2`}>
        {["plans", "users", "stats", "settings"].map((section) => (
          <TouchableOpacity
            key={section}
            style={[
              tw`flex-1 py-2 rounded-lg mx-1`,
              {
                backgroundColor:
                  activeSection === section
                    ? currentTheme.colors.primary
                    : currentTheme.colors.surface,
              },
            ]}
            onPress={() => setActiveSection(section as any)}
          >
            <Text
              style={[
                tw`text-center font-medium`,
                {
                  color:
                    activeSection === section
                      ? "#FFFFFF"
                      : currentTheme.colors.text,
                },
              ]}
            >
              {section === "plans"
                ? "Plans"
                : section === "users"
                ? "Abonnés"
                : section === "stats"
                ? "Stats"
                : "Paramètres"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={tw`flex-1 p-4`}>
        {activeSection === "plans" && (
          <>
            <TouchableOpacity
              style={[
                tw`p-3 rounded-lg mb-4`,
                { backgroundColor: currentTheme.colors.primary },
              ]}
              onPress={() => {
                setEditingPlan({
                  id: "",
                  name: "",
                  description: "",
                  price: 0,
                  currency: "EUR",
                  interval: "monthly",
                  features: [],
                  limits: {},
                  isActive: true,
                  createdAt: Timestamp.now(),
                  updatedAt: Timestamp.now(),
                });
                setShowPlanModal(true);
              }}
            >
              <Text style={[tw`text-center font-medium`, { color: "#FFFFFF" }]}>
                + Créer un nouveau plan
              </Text>
            </TouchableOpacity>
            <ScrollView showsVerticalScrollIndicator={false}>
              {plans.map(renderPlanCard)}
            </ScrollView>
          </>
        )}

        {activeSection === "users" && (
          <>
            <View style={tw`mb-4`}>
              <TextInput
                style={[
                  tw`p-3 rounded-lg mb-2`,
                  {
                    backgroundColor: currentTheme.colors.surface,
                    color: currentTheme.colors.text,
                  },
                ]}
                placeholder="Rechercher par email ou plan..."
                placeholderTextColor={currentTheme.colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {["all", "active", "trial", "cancelled", "expired"].map(
                  (status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        tw`px-3 py-2 rounded-full mr-2`,
                        {
                          backgroundColor:
                            filterStatus === status
                              ? currentTheme.colors.primary
                              : currentTheme.colors.surface,
                        },
                      ]}
                      onPress={() => setFilterStatus(status as any)}
                    >
                      <Text
                        style={{
                          color:
                            filterStatus === status
                              ? "#FFFFFF"
                              : currentTheme.colors.text,
                        }}
                      >
                        {status === "all"
                          ? "Tous"
                          : status === "active"
                          ? "Actifs"
                          : status === "trial"
                          ? "Essai"
                          : status === "cancelled"
                          ? "Annulés"
                          : "Expirés"}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </ScrollView>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {renderSubscriptionItem(subscriptions[0])}
            </ScrollView>
          </>
        )}

        {activeSection === "stats" && renderStats()}
        {activeSection === "settings" && renderSettings()}
      </View>

      {/* Modal pour éditer un plan */}
      <Modal
        visible={showPlanModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPlanModal(false)}
      >
        <View style={tw`flex-1 justify-end`}>
          <View
            style={[
              tw`p-6 rounded-t-3xl`,
              { backgroundColor: currentTheme.colors.background },
            ]}
          >
            <Text
              style={[
                tw`text-xl font-bold mb-4`,
                { color: currentTheme.colors.text },
              ]}
            >
              {editingPlan?.id ? "Modifier le plan" : "Créer un plan"}
            </Text>

            <ScrollView style={{ maxHeight: 400 }}>
              <TextInput
                style={[
                  tw`p-3 rounded-lg mb-3`,
                  {
                    backgroundColor: currentTheme.colors.surface,
                    color: currentTheme.colors.text,
                  },
                ]}
                placeholder="Nom du plan"
                placeholderTextColor={currentTheme.colors.textSecondary}
                value={editingPlan?.name}
                onChangeText={(text) =>
                  setEditingPlan({ ...editingPlan!, name: text })
                }
              />

              <TextInput
                style={[
                  tw`p-3 rounded-lg mb-3`,
                  {
                    backgroundColor: currentTheme.colors.surface,
                    color: currentTheme.colors.text,
                  },
                ]}
                placeholder="Description"
                placeholderTextColor={currentTheme.colors.textSecondary}
                value={editingPlan?.description}
                onChangeText={(text) =>
                  setEditingPlan({ ...editingPlan!, description: text })
                }
                multiline
              />

              <View style={tw`flex-row mb-3`}>
                <TextInput
                  style={[
                    tw`p-3 rounded-lg flex-1 mr-2`,
                    {
                      backgroundColor: currentTheme.colors.surface,
                      color: currentTheme.colors.text,
                    },
                  ]}
                  placeholder="Prix"
                  placeholderTextColor={currentTheme.colors.textSecondary}
                  value={editingPlan?.price.toString()}
                  onChangeText={(text) =>
                    setEditingPlan({
                      ...editingPlan!,
                      price: parseFloat(text) || 0,
                    })
                  }
                  keyboardType="numeric"
                />

                <TouchableOpacity
                  style={[
                    tw`p-3 rounded-lg`,
                    { backgroundColor: currentTheme.colors.surface },
                  ]}
                  onPress={() => {
                    // Toggle interval
                    const intervals = ["monthly", "yearly", "lifetime"];
                    const currentIndex = intervals.indexOf(
                      editingPlan?.interval || "monthly"
                    );
                    const nextInterval = intervals[
                      (currentIndex + 1) % intervals.length
                    ] as any;
                    setEditingPlan({ ...editingPlan!, interval: nextInterval });
                  }}
                >
                  <Text style={{ color: currentTheme.colors.text }}>
                    {editingPlan?.interval === "monthly"
                      ? "Mensuel"
                      : editingPlan?.interval === "yearly"
                      ? "Annuel"
                      : "À vie"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={tw`flex-row mt-4`}>
              <TouchableOpacity
                style={[
                  tw`flex-1 p-3 rounded-lg mr-2`,
                  { backgroundColor: currentTheme.colors.surface },
                ]}
                onPress={() => {
                  setShowPlanModal(false);
                  setEditingPlan(null);
                }}
              >
                <Text
                  style={[tw`text-center`, { color: currentTheme.colors.text }]}
                >
                  Annuler
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  tw`flex-1 p-3 rounded-lg`,
                  { backgroundColor: currentTheme.colors.primary },
                ]}
                onPress={savePlan}
              >
                <Text
                  style={[tw`text-center font-medium`, { color: "#FFFFFF" }]}
                >
                  Sauvegarder
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};
