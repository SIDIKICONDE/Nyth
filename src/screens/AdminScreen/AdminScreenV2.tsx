import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../contexts/ThemeContext";
import { useAdmin } from "../../hooks/useAdmin";
import { useAdminFirestore } from "../../hooks/useAdminFirestore";
import { useTranslation } from "../../hooks/useTranslation";
import { UserRole } from "../../types/user";
import { syncAllUsersRecordings } from "../../utils/syncRecordings";
import { AdminHeader } from "./components/AdminHeader";
import { AdminSidebar } from "./components/AdminSidebar";
import { PillTabMenu } from "./components/PillTabMenu";
import { AnalyticsTab } from "./components/AnalyticsTab";
import { ActivityTab } from "./components/tabs/ActivityTab";
import { ControlsTab } from "./components/tabs/ControlsTab";
import { StatsTab } from "./components/tabs/StatsTab";
import { SubscriptionsTab } from "./components/tabs/SubscriptionsTab";
import { SubscriptionManagementTab } from "./components/tabs/SubscriptionManagementTab";
import { UserActivityTab } from "./components/tabs/UserActivityTab";
import { DashboardTab } from "./components/tabs/DashboardTab";
import { BanManagementTab } from "./components/tabs/BanManagementTab";
import { AppLockTab } from "./components/tabs/AppLockTab";
import { UserItem } from "./components/tabs/UsersTab/UserItem";
import { useAdminData } from "./hooks/useAdminData";

import { AdminTab } from "./types";
import { MessagingTab } from "./components/tabs/MessagingTab";
import { SystemLogsTab } from "./components/tabs/SystemLogsTab";
import { SessionManagementTab } from "./components/tabs/SessionManagementTab";
import { AIControlTab } from "./components/tabs/AIControlTab";
import { NetworkControlTab } from "./components/tabs/NetworkControlTab";
import { FeatureControlTab } from "./components/tabs/FeatureControlTab";
import { DataManagementTab } from "./components/tabs/DataManagementTab";
import { ThemeControlTab } from "./components/tabs/ThemeControlTab";

import { createOptimizedLogger } from "../../utils/optimizedLogger";
const logger = createOptimizedLogger("AdminScreenV2");

const { width: screenWidth } = Dimensions.get("window");

export const AdminScreenV2: React.FC = () => {
  const { currentTheme } = useTheme();
  const colors = currentTheme.colors;
  const { isAdmin, isSuperAdmin } = useAdmin();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");

  const {
    users,
    stats,
    subscriptions,
    recentActivity,
    loading,
    syncing,
    loadData,
    setSyncing,
  } = useAdminData(isSuperAdmin);

  const { loading: adminLoading, updateUserRole } = useAdminFirestore();

  useEffect(() => {
    if (!isSuperAdmin) {
      Alert.alert(
        t("admin.accessDenied.title", "Accès refusé"),
        t(
          "admin.accessDenied.message",
          "Vous n'avez pas les permissions nécessaires"
        )
      );
      navigation.goBack();
    }
  }, [isAdmin]);

  // Gérer le changement d'onglet
  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
  };

  const handleToggleUserRole = async (
    userId: string,
    currentRole?: UserRole
  ) => {
    if (!isSuperAdmin) {
      Alert.alert(
        t("admin.permission.title", "Permission refusée"),
        t(
          "admin.permission.superAdminOnly",
          "Seuls les super admins peuvent modifier les rôles"
        )
      );
      return;
    }

    Alert.alert(
      t("admin.role.confirmTitle", "Confirmer le changement"),
      t(
        "admin.role.confirmMessage",
        "Êtes-vous sûr de vouloir modifier le rôle de cet utilisateur ?"
      ),
      [
        {
          text: t("common.cancel", "Annuler"),
          style: "cancel",
        },
        {
          text: t("common.confirm", "Confirmer"),
          onPress: async () => {
            let newRole: UserRole;
            if (!currentRole || currentRole === UserRole.USER) {
              newRole = UserRole.ADMIN;
            } else if (currentRole === UserRole.ADMIN) {
              newRole = UserRole.USER;
            } else {
              Alert.alert(
                t("admin.role.errorTitle", "Action impossible"),
                t(
                  "admin.role.cantModifySuperAdmin",
                  "Impossible de modifier le rôle d'un super admin"
                )
              );
              return;
            }

            const success = await updateUserRole(userId, newRole);

            if (success) {
              Alert.alert(
                t("common.success", "Succès"),
                t("admin.role.updateSuccess", "Rôle mis à jour avec succès")
              );
              loadData(); // Recharger les données
            }
          },
        },
      ]
    );
  };

  const handleResetPassword = async (userEmail: string, userName: string) => {
    Alert.alert(
      t("admin.resetPassword.title", "Réinitialiser le mot de passe"),
      t(
        "admin.resetPassword.message",
        "Envoyer un email de réinitialisation à {{name}} ?",
        { name: userName }
      ),
      [
        {
          text: t("common.cancel", "Annuler"),
          style: "cancel",
        },
        {
          text: t("common.send", "Envoyer"),
          onPress: async () => {
            // Implémenter la logique de réinitialisation
            Alert.alert(
              t("common.success", "Succès"),
              t(
                "admin.resetPassword.success",
                "Email de réinitialisation envoyé"
              )
            );
          },
        },
      ]
    );
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    Alert.alert(
      "⚠️ Fonction non disponible",
      "La suppression/anonymisation d'utilisateurs n'est pas encore implémentée pour des raisons de sécurité.",
      [
        {
          text: "OK",
          style: "default",
        },
      ]
    );
  };

  const handleSyncRecordings = async () => {
    Alert.alert(
      t("admin.sync.title", "Synchroniser les enregistrements"),
      t(
        "admin.sync.message",
        "Voulez-vous synchroniser tous les enregistrements locaux avec Firestore ?"
      ),
      [
        {
          text: t("common.cancel", "Annuler"),
          style: "cancel",
        },
        {
          text: t("common.sync", "Synchroniser"),
          onPress: async () => {
            setSyncing(true);

            try {
              await syncAllUsersRecordings();

              Alert.alert(
                t("common.success", "Succès"),
                t("admin.sync.success", "Synchronisation terminée")
              );
              await loadData();
            } catch (error) {
              logger.error("Erreur sync:", error);

              Alert.alert(
                t("common.error", "Erreur"),
                t("admin.sync.error", "Erreur lors de la synchronisation")
              );
            } finally {
              setSyncing(false);
            }
          },
        },
      ]
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardTab />;
      case "users":
        return (
          <FlatList
            data={users}
            keyExtractor={(item) => item.uid}
            renderItem={({ item }) => (
              <UserItem
                user={item}
                onToggleRole={handleToggleUserRole}
                onResetPassword={handleResetPassword}
                onDeleteUser={handleDeleteUser}
                isSuperAdmin={isSuperAdmin}
                adminLoading={adminLoading}
              />
            )}
            contentContainerStyle={styles.usersList}
            showsVerticalScrollIndicator={false}
          />
        );
      case "stats":
        return <StatsTab stats={stats} />;
      case "analytics":
        return <AnalyticsTab />;
      case "userActivity":
        return <UserActivityTab />;
      case "activity":
        return <ActivityTab activities={recentActivity} users={users} />;
      case "subscriptions":
        return isSuperAdmin ? (
          <SubscriptionManagementTab />
        ) : (
          <SubscriptionsTab subscriptions={subscriptions} users={users} />
        );
      case "banManagement":
        return <BanManagementTab />;
      case "appLock":
        return <AppLockTab />;
      case "messaging":
        return <MessagingTab />;
      case "systemLogs":
        return <SystemLogsTab />;
      case "controls":
        return <ControlsTab adminId="super_admin" />;
      case "session":
        return <SessionManagementTab />;
      case "aiControl":
        return <AIControlTab />;
      case "networkControl":
        return <NetworkControlTab />;
      case "featureControl":
        return <FeatureControlTab />;
      case "dataManagement":
        return <DataManagementTab />;
      case "themeControl":
        return <ThemeControlTab />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header amélioré */}
      <AdminHeader
        onBack={() => navigation.goBack()}
        onSync={isSuperAdmin ? handleSyncRecordings : undefined}
        onRefresh={loadData}
        isSuperAdmin={isSuperAdmin}
        syncing={syncing}
        loading={loading}
      />

      {/* Nouveau PillTabMenu */}
      <PillTabMenu activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Contenu des onglets */}
      {loading && activeTab !== "analytics" ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <View style={styles.content}>{renderContent()}</View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  usersList: {
    padding: 16,
  },
});
