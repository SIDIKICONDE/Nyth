import Ionicons from "react-native-vector-icons/Ionicons";
import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import OptimizedAvatar from "../../../../../components/ui/OptimizedAvatar";
import { useTheme } from "../../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../../hooks/useTranslation";
import { UserProfile, UserRole } from "../../../../../types/user";
import { formatDate } from "../../../utils/dateUtils";

interface UserItemProps {
  user: UserProfile;
  onToggleRole: (userId: string, currentRole?: UserRole) => void;
  onResetPassword: (email: string, name: string) => void;
  onDeleteUser?: (userId: string, userName: string) => void;
  isSuperAdmin: boolean;
  adminLoading: boolean;
}

export const UserItem: React.FC<UserItemProps> = React.memo(
  ({
    user,
    onToggleRole,
    onResetPassword,
    onDeleteUser,
    isSuperAdmin,
    adminLoading,
  }) => {
    const { currentTheme } = useTheme();
    const colors = currentTheme.colors;
    const { t } = useTranslation();

    // Mémoriser les calculs de style et les données dérivées
    const userDisplayInfo = useMemo(
      () => ({
        displayName:
          user.displayName ||
          user.email ||
          t("admin.user.anonymous", "Utilisateur anonyme"),
        email: user.email || t("admin.user.noEmail", "Pas d'email"),
        registrationDate: formatDate(user.createdAt),
        lastLoginDate: formatDate(user.lastLoginAt),
      }),
      [user.displayName, user.email, user.createdAt, user.lastLoginAt, t]
    );

    const roleInfo = useMemo(() => {
      const isAdmin =
        user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;
      const isSuperAdminUser = user.role === UserRole.SUPER_ADMIN;

      return {
        isAdmin,
        isSuperAdminUser,
        roleText: isSuperAdminUser
          ? t("admin.role.superAdmin", "Super Admin")
          : user.role === UserRole.ADMIN
          ? t("admin.role.admin", "Admin")
          : t("admin.role.user", "Utilisateur"),
        canModifyRole: isSuperAdmin && !isSuperAdminUser,
      };
    }, [user.role, isSuperAdmin, t]);

    const roleButtonStyle = useMemo(
      () => [
        styles.roleButton,
        {
          backgroundColor: roleInfo.isAdmin ? colors.primary : colors.surface,
          borderColor: colors.border,
        },
      ],
      [roleInfo.isAdmin, colors.primary, colors.surface, colors.border]
    );

    const roleTextStyle = useMemo(
      () => [
        styles.roleText,
        {
          color: roleInfo.isAdmin ? colors.background : colors.text,
        },
      ],
      [roleInfo.isAdmin, colors.background, colors.text]
    );

    return (
      <View style={[styles.userItem, { backgroundColor: colors.surface }]}>
        <View style={styles.userInfo}>
          <View style={styles.userHeader}>
            <OptimizedAvatar
              userId={user.uid}
              photoURL={user.photoURL}
              displayName={userDisplayInfo.displayName}
              size="medium"
              style={styles.avatar}
            />
            <View style={styles.userDetails}>
              <Text style={[styles.userName, { color: colors.text }]}>
                {userDisplayInfo.displayName}
              </Text>
              <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
                {userDisplayInfo.email}
              </Text>
            </View>
          </View>
          <Text style={[styles.userMeta, { color: colors.textSecondary }]}>
            {t("admin.user.registeredOn", "Inscrit le")}:{" "}
            {userDisplayInfo.registrationDate}
          </Text>
          <Text style={[styles.userMeta, { color: colors.textSecondary }]}>
            {t("admin.user.lastLogin", "Dernière connexion")}:{" "}
            {userDisplayInfo.lastLoginDate}
          </Text>
        </View>
        <View style={styles.userActions}>
          <TouchableOpacity
            style={roleButtonStyle}
            onPress={() => onToggleRole(user.uid, user.role)}
            disabled={!roleInfo.canModifyRole || adminLoading}
          >
            <Text style={roleTextStyle}>{roleInfo.roleText}</Text>
          </TouchableOpacity>

          {isSuperAdmin && user.email && !roleInfo.isSuperAdminUser && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() =>
                onResetPassword(user.email!, userDisplayInfo.displayName)
              }
              disabled={adminLoading}
            >
              <Ionicons name="key-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          )}

          {isSuperAdmin && !roleInfo.isSuperAdminUser && onDeleteUser && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() =>
                onDeleteUser(user.uid, userDisplayInfo.displayName)
              }
              disabled={adminLoading}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }
);

UserItem.displayName = "UserItem";

const styles = StyleSheet.create({
  userItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 2,
  },
  userMeta: {
    fontSize: 12,
  },
  userActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  roleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  roleText: {
    fontSize: 14,
    fontWeight: "500",
  },
  actionButton: {
    padding: 8,
  },
});
