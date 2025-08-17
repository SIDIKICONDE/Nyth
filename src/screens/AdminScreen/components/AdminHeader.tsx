import Ionicons from "react-native-vector-icons/Ionicons";
import React from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../../contexts/ThemeContext";
import { useTranslation } from "../../../hooks/useTranslation";

interface AdminHeaderProps {
  onBack: () => void;
  onSync?: () => void;
  onRefresh: () => void;
  isSuperAdmin: boolean;
  syncing: boolean;
  loading: boolean;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  onBack,
  onSync,
  onRefresh,
  isSuperAdmin,
  syncing,
  loading,
}) => {
  const { currentTheme } = useTheme();
  const colors = currentTheme.colors;
  const { t } = useTranslation();

  const rotateAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (loading || syncing) {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      rotateAnim.setValue(0);
    }
  }, [loading, syncing]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={[styles.header, { backgroundColor: colors.background }]}>
      <View style={[styles.headerContent, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          onPress={onBack}
          style={[styles.backButton, { backgroundColor: colors.background }]}
          activeOpacity={0.7}
          accessibilityLabel={t("common.back", "Retour")}
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={15} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <View
            style={[
              styles.titleBadge,
              { backgroundColor: colors.primary + "15" },
            ]}
          >
            <Ionicons
              name="shield-checkmark"
              size={16}
              color={colors.primary}
            />
          </View>
          {isSuperAdmin ? (
            <View
              style={[
                styles.superAdminBadge,
                {
                  backgroundColor: colors.warning,
                  borderWidth: 1,
                  borderColor: colors.warning,
                },
              ]}
            >
              <Text
                style={[styles.superAdminText, { color: colors.background }]}
              >
                CONDE SIDIKI
              </Text>
            </View>
          ) : (
            <View
              style={[
                styles.adminBadge,
                {
                  backgroundColor: colors.primary,
                  borderWidth: 1,
                  borderColor: colors.primary,
                },
              ]}
            >
              <Text style={[styles.adminText, { color: colors.background }]}>
                SUPER ADMIN
              </Text>
            </View>
          )}
        </View>

        <View style={styles.headerActions}>
          {isSuperAdmin && onSync && (
            <TouchableOpacity
              onPress={onSync}
              style={[
                styles.actionButton,
                {
                  backgroundColor: syncing
                    ? colors.primary + "15"
                    : colors.background,
                },
              ]}
              disabled={syncing}
              activeOpacity={0.7}
              accessibilityLabel={t("admin.sync.button", "Synchroniser")}
              accessibilityRole="button"
              accessibilityState={{ disabled: syncing }}
            >
              <Animated.View
                style={syncing ? { transform: [{ rotate: spin }] } : {}}
              >
                <Ionicons
                  name="cloud-upload"
                  size={16}
                  color={syncing ? colors.primary : colors.text}
                />
              </Animated.View>
              {syncing && (
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: colors.primary },
                  ]}
                />
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={onRefresh}
            style={[
              styles.actionButton,
              {
                backgroundColor: loading
                  ? colors.primary + "15"
                  : colors.background,
              },
            ]}
            disabled={loading || syncing}
            activeOpacity={0.7}
            accessibilityLabel={t("common.refresh", "Actualiser")}
            accessibilityRole="button"
            accessibilityState={{ disabled: loading || syncing }}
          >
            <Animated.View
              style={loading ? { transform: [{ rotate: spin }] } : {}}
            >
              <Ionicons
                name="refresh"
                size={16}
                color={loading || syncing ? colors.primary : colors.text}
              />
            </Animated.View>
            {loading && (
              <View
                style={[styles.statusDot, { backgroundColor: colors.primary }]}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: Platform.OS === "ios" ? 0 : 6,
    paddingBottom: 6,
    paddingHorizontal: 10,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    justifyContent: "center",
  },
  titleBadge: {
    width: 28,
    height: 28,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  superAdminBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    // Ajouter un fin contour pour améliorer le contraste
    borderWidth: Platform.OS === "android" ? 0 : 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  superAdminText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
  adminBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  adminText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  statusDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
});
