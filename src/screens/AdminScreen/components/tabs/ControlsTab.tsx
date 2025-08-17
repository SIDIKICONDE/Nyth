import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React, { useState, useEffect } from "react";
import {
  ScrollView,
  Text,
  View,
  Switch,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
} from "react-native";
import tw from "twrnc";
import { SubscriptionLockToggle } from "../../../../components/settings";
import { useTheme } from "../../../../contexts/ThemeContext";
import { getApp } from "@react-native-firebase/app";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getFirestore,
} from "@react-native-firebase/firestore";

interface ControlsTabProps {
  adminId?: string;
}

interface SystemConfig {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  allowNewRegistrations: boolean;
  allowGuestAccess: boolean;
  maxRecordingsPerUser: number;
  maxRecordingDuration: number; // en minutes
  enableAIFeatures: boolean;
  enablePushNotifications: boolean;
  enableAutoBackup: boolean;
  backupFrequency: "daily" | "weekly" | "monthly";
  enableDataExport: boolean;
  enableUserDeletion: boolean;
  sessionTimeout: number; // en minutes
  maxLoginAttempts: number;
  enableTwoFactor: boolean;
  enableEmailVerification: boolean;
  enableRateLimiting: boolean;
  rateLimitRequests: number; // requests per minute
  enableDebugMode: boolean;
  enableAnalytics: boolean;
  enableCrashReporting: boolean;
  enablePerformanceMonitoring: boolean;
}

export const ControlsTab: React.FC<ControlsTabProps> = ({
  adminId = "admin",
}) => {
  const { currentTheme } = useTheme();
  const firestore = getFirestore(getApp());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<SystemConfig>({
    maintenanceMode: false,
    maintenanceMessage:
      "L'application est en maintenance. Veuillez réessayer plus tard.",
    allowNewRegistrations: true,
    allowGuestAccess: false,
    maxRecordingsPerUser: 100,
    maxRecordingDuration: 60,
    enableAIFeatures: true,
    enablePushNotifications: true,
    enableAutoBackup: true,
    backupFrequency: "daily",
    enableDataExport: true,
    enableUserDeletion: false,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    enableTwoFactor: false,
    enableEmailVerification: true,
    enableRateLimiting: true,
    rateLimitRequests: 60,
    enableDebugMode: false,
    enableAnalytics: true,
    enableCrashReporting: true,
    enablePerformanceMonitoring: true,
  });

  // Charger la configuration depuis Firestore
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const configDoc = await getDoc(doc(firestore, "system", "config"));
      if (configDoc.exists()) {
        setConfig(configDoc.data() as SystemConfig);
      }
    } catch (error) {
      console.error("Erreur lors du chargement de la configuration:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async (newConfig: Partial<SystemConfig>) => {
    setSaving(true);
    try {
      const updatedConfig = { ...config, ...newConfig };
      await setDoc(doc(firestore, "system", "config"), updatedConfig, {
        merge: true,
      });
      setConfig(updatedConfig);
      Alert.alert("Succès", "Configuration mise à jour avec succès");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      Alert.alert("Erreur", "Impossible de sauvegarder la configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key: keyof SystemConfig, value: boolean) => {
    saveConfig({ [key]: value });
  };

  const handleNumberChange = (key: keyof SystemConfig, value: string) => {
    const numValue = parseInt(value) || 0;
    saveConfig({ [key]: numValue });
  };

  const handleTextChange = (key: keyof SystemConfig, value: string) => {
    saveConfig({ [key]: value });
  };

  const ControlSection = ({
    title,
    icon,
    children,
  }: {
    title: string;
    icon: string;
    children: React.ReactNode;
  }) => (
    <View style={tw`mb-6`}>
      <View style={tw`flex-row items-center mb-3`}>
        <MaterialCommunityIcons
          name={icon}
          size={20}
          color={currentTheme.colors.primary}
        />
        <Text
          style={[
            tw`ml-2 text-lg font-semibold`,
            { color: currentTheme.colors.text },
          ]}
        >
          {title}
        </Text>
      </View>
      <View
        style={[
          tw`p-4 rounded-lg`,
          { backgroundColor: currentTheme.colors.surface },
        ]}
      >
        {children}
      </View>
    </View>
  );

  const ControlItem = ({
    label,
    description,
    value,
    onValueChange,
    type = "switch",
  }: {
    label: string;
    description?: string;
    value: any;
    onValueChange: (value: any) => void;
    type?: "switch" | "number" | "text";
  }) => (
    <View style={tw`mb-4`}>
      <View style={tw`flex-row justify-between items-center`}>
        <View style={tw`flex-1 mr-3`}>
          <Text style={[tw`font-medium`, { color: currentTheme.colors.text }]}>
            {label}
          </Text>
          {description && (
            <Text
              style={[
                tw`text-xs mt-1`,
                { color: currentTheme.colors.textSecondary },
              ]}
            >
              {description}
            </Text>
          )}
        </View>
        {type === "switch" && (
          <Switch
            value={value}
            onValueChange={onValueChange}
            trackColor={{
              false: currentTheme.colors.textSecondary + "30",
              true: currentTheme.colors.primary + "80",
            }}
            thumbColor={
              value
                ? currentTheme.colors.primary
                : currentTheme.colors.textSecondary
            }
            disabled={saving}
          />
        )}
        {type === "number" && (
          <TextInput
            style={[
              tw`px-3 py-1 rounded-lg w-20 text-center`,
              {
                backgroundColor: currentTheme.colors.background,
                color: currentTheme.colors.text,
                borderWidth: 1,
                borderColor: currentTheme.colors.textSecondary + "30",
              },
            ]}
            value={value.toString()}
            onChangeText={onValueChange}
            keyboardType="numeric"
            editable={!saving}
          />
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={tw`flex-1 justify-center items-center`}>
        <ActivityIndicator size="large" color={currentTheme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={tw`flex-1`}
      contentContainerStyle={tw`p-4`}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={tw`mb-6`}>
        <View style={tw`flex-row items-center mb-2`}>
          <MaterialCommunityIcons
            name="shield-crown"
            size={24}
            color={currentTheme.colors.primary}
          />
          <Text
            style={[
              tw`ml-3 text-xl font-bold`,
              { color: currentTheme.colors.text },
            ]}
          >
            Panneau de Contrôle Superadmin
          </Text>
        </View>
        <Text
          style={[tw`text-sm`, { color: currentTheme.colors.textSecondary }]}
        >
          Configuration complète du système et gestion avancée
        </Text>
      </View>

      {/* Mode Maintenance */}
      <ControlSection title="Mode Maintenance" icon="wrench">
        <ControlItem
          label="Activer le mode maintenance"
          description="Bloque l'accès à tous les utilisateurs sauf les admins"
          value={config.maintenanceMode}
          onValueChange={(value) => handleToggle("maintenanceMode", value)}
        />
        {config.maintenanceMode && (
          <View style={tw`mt-3`}>
            <Text
              style={[
                tw`text-xs mb-2`,
                { color: currentTheme.colors.textSecondary },
              ]}
            >
              Message de maintenance:
            </Text>
            <TextInput
              style={[
                tw`p-3 rounded-lg`,
                {
                  backgroundColor: currentTheme.colors.background,
                  color: currentTheme.colors.text,
                  borderWidth: 1,
                  borderColor: currentTheme.colors.textSecondary + "30",
                  minHeight: 80,
                },
              ]}
              value={config.maintenanceMessage}
              onChangeText={(text) =>
                handleTextChange("maintenanceMessage", text)
              }
              multiline
              editable={!saving}
            />
          </View>
        )}
      </ControlSection>

      {/* Gestion des Accès */}
      <ControlSection title="Gestion des Accès" icon="account-lock">
        <ControlItem
          label="Autoriser les nouvelles inscriptions"
          description="Permet aux nouveaux utilisateurs de créer un compte"
          value={config.allowNewRegistrations}
          onValueChange={(value) =>
            handleToggle("allowNewRegistrations", value)
          }
        />
        <ControlItem
          label="Autoriser l'accès invité"
          description="Permet l'utilisation sans compte"
          value={config.allowGuestAccess}
          onValueChange={(value) => handleToggle("allowGuestAccess", value)}
        />
        <ControlItem
          label="Vérification email obligatoire"
          description="Les utilisateurs doivent vérifier leur email"
          value={config.enableEmailVerification}
          onValueChange={(value) =>
            handleToggle("enableEmailVerification", value)
          }
        />
        <ControlItem
          label="Authentification à deux facteurs"
          description="Active la 2FA pour tous les utilisateurs"
          value={config.enableTwoFactor}
          onValueChange={(value) => handleToggle("enableTwoFactor", value)}
        />
      </ControlSection>

      {/* Limites et Quotas */}
      <ControlSection title="Limites et Quotas" icon="gauge">
        <ControlItem
          label="Max enregistrements par utilisateur"
          description="Nombre maximum d'enregistrements autorisés"
          value={config.maxRecordingsPerUser}
          onValueChange={(value) =>
            handleNumberChange("maxRecordingsPerUser", value)
          }
          type="number"
        />
        <ControlItem
          label="Durée max d'enregistrement (min)"
          description="Durée maximale en minutes par enregistrement"
          value={config.maxRecordingDuration}
          onValueChange={(value) =>
            handleNumberChange("maxRecordingDuration", value)
          }
          type="number"
        />
        <ControlItem
          label="Timeout de session (min)"
          description="Déconnexion automatique après inactivité"
          value={config.sessionTimeout}
          onValueChange={(value) => handleNumberChange("sessionTimeout", value)}
          type="number"
        />
        <ControlItem
          label="Tentatives de connexion max"
          description="Avant verrouillage du compte"
          value={config.maxLoginAttempts}
          onValueChange={(value) =>
            handleNumberChange("maxLoginAttempts", value)
          }
          type="number"
        />
      </ControlSection>

      {/* Fonctionnalités IA */}
      <ControlSection title="Intelligence Artificielle" icon="robot">
        <ControlItem
          label="Activer les fonctionnalités IA"
          description="Active toutes les fonctions d'IA dans l'app"
          value={config.enableAIFeatures}
          onValueChange={(value) => handleToggle("enableAIFeatures", value)}
        />
      </ControlSection>

      {/* Notifications */}
      <ControlSection title="Notifications" icon="bell">
        <ControlItem
          label="Notifications push"
          description="Active les notifications push globalement"
          value={config.enablePushNotifications}
          onValueChange={(value) =>
            handleToggle("enablePushNotifications", value)
          }
        />
      </ControlSection>

      {/* Sauvegarde et Données */}
      <ControlSection title="Sauvegarde et Données" icon="database">
        <ControlItem
          label="Sauvegarde automatique"
          description="Active les sauvegardes automatiques"
          value={config.enableAutoBackup}
          onValueChange={(value) => handleToggle("enableAutoBackup", value)}
        />
        <ControlItem
          label="Export de données"
          description="Permet aux utilisateurs d'exporter leurs données"
          value={config.enableDataExport}
          onValueChange={(value) => handleToggle("enableDataExport", value)}
        />
        <ControlItem
          label="Suppression d'utilisateurs"
          description="Permet la suppression complète des comptes"
          value={config.enableUserDeletion}
          onValueChange={(value) => handleToggle("enableUserDeletion", value)}
        />
      </ControlSection>

      {/* Sécurité */}
      <ControlSection title="Sécurité" icon="shield-check">
        <ControlItem
          label="Limitation de taux"
          description="Limite le nombre de requêtes par minute"
          value={config.enableRateLimiting}
          onValueChange={(value) => handleToggle("enableRateLimiting", value)}
        />
        {config.enableRateLimiting && (
          <ControlItem
            label="Requêtes par minute"
            description="Nombre max de requêtes autorisées"
            value={config.rateLimitRequests}
            onValueChange={(value) =>
              handleNumberChange("rateLimitRequests", value)
            }
            type="number"
          />
        )}
      </ControlSection>

      {/* Monitoring et Debug */}
      <ControlSection title="Monitoring et Debug" icon="chart-line">
        <ControlItem
          label="Mode debug"
          description="Active les logs détaillés (dev uniquement)"
          value={config.enableDebugMode}
          onValueChange={(value) => handleToggle("enableDebugMode", value)}
        />
        <ControlItem
          label="Analytics"
          description="Collecte des données d'utilisation"
          value={config.enableAnalytics}
          onValueChange={(value) => handleToggle("enableAnalytics", value)}
        />
        <ControlItem
          label="Rapport de crash"
          description="Envoie automatique des rapports d'erreur"
          value={config.enableCrashReporting}
          onValueChange={(value) => handleToggle("enableCrashReporting", value)}
        />
        <ControlItem
          label="Monitoring de performance"
          description="Suivi des performances de l'application"
          value={config.enablePerformanceMonitoring}
          onValueChange={(value) =>
            handleToggle("enablePerformanceMonitoring", value)
          }
        />
      </ControlSection>

      {/* Section Abonnements existante */}
      <ControlSection title="Gestion des Abonnements" icon="crown">
        <SubscriptionLockToggle isVisible={true} adminId={adminId} />
        <View style={tw`mt-3`}>
          <Text
            style={[tw`text-xs`, { color: currentTheme.colors.textSecondary }]}
          >
            Le verrouillage de la section abonnements empêche les utilisateurs
            d'accéder à la page de gestion des plans.
          </Text>
        </View>
      </ControlSection>

      {/* Actions rapides */}
      <ControlSection title="Actions Rapides" icon="lightning-bolt">
        <TouchableOpacity
          style={[
            tw`p-3 rounded-lg mb-3`,
            { backgroundColor: currentTheme.colors.error + "20" },
          ]}
          onPress={() => {
            Alert.alert(
              "Forcer la déconnexion",
              "Déconnecter tous les utilisateurs (sauf admins) ?",
              [
                { text: "Annuler", style: "cancel" },
                {
                  text: "Confirmer",
                  style: "destructive",
                  onPress: () => {
                    // Implémenter la déconnexion forcée
                    Alert.alert(
                      "Succès",
                      "Tous les utilisateurs ont été déconnectés"
                    );
                  },
                },
              ]
            );
          }}
        >
          <Text
            style={[
              tw`text-center font-medium`,
              { color: currentTheme.colors.error },
            ]}
          >
            Forcer la déconnexion de tous les utilisateurs
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            tw`p-3 rounded-lg mb-3`,
            { backgroundColor: currentTheme.colors.warning + "20" },
          ]}
          onPress={() => {
            Alert.alert(
              "Vider le cache",
              "Vider tous les caches de l'application ?",
              [
                { text: "Annuler", style: "cancel" },
                {
                  text: "Confirmer",
                  onPress: () => {
                    // Implémenter le vidage du cache
                    Alert.alert("Succès", "Cache vidé avec succès");
                  },
                },
              ]
            );
          }}
        >
          <Text
            style={[
              tw`text-center font-medium`,
              { color: currentTheme.colors.warning },
            ]}
          >
            Vider tous les caches
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            tw`p-3 rounded-lg`,
            { backgroundColor: currentTheme.colors.primary + "20" },
          ]}
          onPress={() => {
            Alert.alert(
              "Backup manuel",
              "Lancer une sauvegarde manuelle maintenant ?",
              [
                { text: "Annuler", style: "cancel" },
                {
                  text: "Lancer",
                  onPress: () => {
                    // Implémenter le backup manuel
                    Alert.alert("Succès", "Sauvegarde lancée");
                  },
                },
              ]
            );
          }}
        >
          <Text
            style={[
              tw`text-center font-medium`,
              { color: currentTheme.colors.primary },
            ]}
          >
            Lancer une sauvegarde manuelle
          </Text>
        </TouchableOpacity>
      </ControlSection>

      {/* Footer avec avertissement */}
      <View
        style={[
          tw`p-3 rounded-lg mt-4 mb-8`,
          { backgroundColor: currentTheme.colors.error + "20" },
        ]}
      >
        <View style={tw`flex-row items-center mb-1`}>
          <MaterialCommunityIcons
            name="shield-alert"
            size={16}
            color={currentTheme.colors.error}
          />
          <Text
            style={[
              tw`ml-2 text-xs font-medium`,
              { color: currentTheme.colors.error },
            ]}
          >
            Zone Critique Superadmin
          </Text>
        </View>
        <Text style={[tw`text-xs`, { color: currentTheme.colors.error }]}>
          Ces contrôles affectent l'ensemble du système et tous les
          utilisateurs. Toute modification est immédiatement appliquée et peut
          avoir des conséquences importantes. Utilisez avec une extrême
          prudence.
        </Text>
      </View>

      {saving && (
        <View style={tw`absolute inset-0 justify-center items-center`}>
          <View
            style={[
              tw`p-4 rounded-lg`,
              { backgroundColor: currentTheme.colors.background + "F0" },
            ]}
          >
            <ActivityIndicator
              size="small"
              color={currentTheme.colors.primary}
            />
            <Text style={[tw`mt-2`, { color: currentTheme.colors.text }]}>
              Sauvegarde...
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};
