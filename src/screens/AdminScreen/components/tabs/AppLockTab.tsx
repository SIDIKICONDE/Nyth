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
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import DateTimePicker from "@react-native-community/datetimepicker";
import tw from "twrnc";
import { useTheme } from "../../../../contexts/ThemeContext";
import AppLockService, {
  appLockService,
  AppLockConfig,
} from "../../../../services/AppLockService";
import { getAuth } from "@react-native-firebase/auth";
import { Timestamp } from "@react-native-firebase/firestore";

export const AppLockTab: React.FC = () => {
  const { currentTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<AppLockConfig | null>(
    null
  );
  const [editMode, setEditMode] = useState(false);

  // États du formulaire
  const [isLocked, setIsLocked] = useState(false);
  const [lockType, setLockType] =
    useState<AppLockConfig["lockType"]>("test_ended");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [showCountdown, setShowCountdown] = useState(false);
  const [unlockDate, setUnlockDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [showContactSupport, setShowContactSupport] = useState(false);
  const [customButtonText, setCustomButtonText] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("#1e40af");
  const [textColor, setTextColor] = useState("#ffffff");
  const [allowedRoles, setAllowedRoles] = useState<string[]>([
    "super_admin",
    "admin",
  ]);

  useEffect(() => {
    loadCurrentConfig();
  }, []);

  const loadCurrentConfig = async () => {
    setLoading(true);
    try {
      const config = await appLockService.checkLockStatus();
      if (config) {
        setCurrentConfig(config);
        populateForm(config);
      }
    } catch (error) {
      console.error("Erreur chargement configuration:", error);
      Alert.alert("Erreur", "Impossible de charger la configuration");
    } finally {
      setLoading(false);
    }
  };

  const populateForm = (config: AppLockConfig) => {
    setIsLocked(config.isLocked);
    setLockType(config.lockType);
    setTitle(config.title);
    setMessage(config.message);
    setShowCountdown(config.showCountdown || false);
    setUnlockDate(config.unlockDate ? config.unlockDate.toDate() : null);
    setContactEmail(config.contactEmail || "");
    setContactPhone(config.contactPhone || "");
    setShowContactSupport(config.showContactSupport || false);
    setCustomButtonText(config.customButtonText || "");
    setBackgroundColor(config.backgroundColor || "#1e40af");
    setTextColor(config.textColor || "#ffffff");
    setAllowedRoles(config.allowedRoles || ["super_admin", "admin"]);
  };

  const loadPreset = (
    presetKey: keyof ReturnType<typeof AppLockService.getPresetConfigs>
  ) => {
    const presets = AppLockService.getPresetConfigs();
    const preset = presets[presetKey];

    setLockType(preset.lockType);
    setTitle(preset.title);
    setMessage(preset.message);
    setShowCountdown(
      "showCountdown" in preset ? !!(preset as any).showCountdown : false
    );
    setShowContactSupport(
      "showContactSupport" in preset
        ? !!(preset as any).showContactSupport
        : false
    );
    setCustomButtonText(
      "customButtonText" in preset ? (preset as any).customButtonText || "" : ""
    );
    setBackgroundColor(preset.backgroundColor || "#1e40af");
    setTextColor(preset.textColor || "#ffffff");
    setContactEmail(
      "contactEmail" in preset
        ? (preset as any).contactEmail || contactEmail
        : contactEmail
    );

    setEditMode(true);
  };

  const handleSave = async () => {
    if (!title || !message) {
      Alert.alert("Erreur", "Le titre et le message sont obligatoires");
      return;
    }

    Alert.alert(
      isLocked
        ? "⚠️ Verrouiller l'application"
        : "🔓 Déverrouiller l'application",
      isLocked
        ? "Êtes-vous sûr de vouloir verrouiller l'application pour tous les utilisateurs (sauf admins) ?"
        : "Êtes-vous sûr de vouloir déverrouiller l'application ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Confirmer",
          style: isLocked ? "destructive" : "default",
          onPress: async () => {
            setSaving(true);
            try {
              const adminId = getAuth().currentUser?.uid || "unknown";

              if (isLocked) {
                const config: Omit<
                  AppLockConfig,
                  "lastUpdatedAt" | "lastUpdatedBy"
                > = {
                  isLocked: true,
                  lockType,
                  title,
                  message,
                  showCountdown,
                  unlockDate: unlockDate
                    ? Timestamp.fromDate(unlockDate)
                    : undefined,
                  allowedRoles,
                  contactEmail: contactEmail || undefined,
                  contactPhone: contactPhone || undefined,
                  showContactSupport,
                  customButtonText: customButtonText || undefined,
                  customButtonAction: customButtonText
                    ? "custom_action"
                    : undefined,
                  backgroundColor,
                  textColor,
                  iconName: getIconForLockType(lockType),
                };

                await appLockService.lockApp(config, adminId);
                Alert.alert("✅ Succès", "L'application a été verrouillée");
              } else {
                await appLockService.unlockApp(adminId);
                Alert.alert("✅ Succès", "L'application a été déverrouillée");
              }

              await loadCurrentConfig();
              setEditMode(false);
            } catch (error) {
              console.error("Erreur sauvegarde:", error);
              Alert.alert(
                "Erreur",
                "Impossible de sauvegarder la configuration"
              );
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const getIconForLockType = (type: AppLockConfig["lockType"]): string => {
    switch (type) {
      case "test_ended":
        return "check-circle";
      case "maintenance":
        return "wrench";
      case "subscription_required":
        return "credit-card";
      case "violation":
        return "alert-triangle";
      default:
        return "lock";
    }
  };

  const PresetButton = ({
    preset,
    label,
    icon,
    color,
  }: {
    preset: keyof ReturnType<typeof AppLockService.getPresetConfigs>;
    label: string;
    icon: string;
    color: string;
  }) => (
    <TouchableOpacity
      style={[
        tw`p-4 rounded-lg mb-3 flex-row items-center`,
        { backgroundColor: color + "20" },
      ]}
      onPress={() => loadPreset(preset)}
    >
      <MaterialCommunityIcons name={icon} size={24} color={color} />
      <Text style={[tw`ml-3 font-medium`, { color: currentTheme.colors.text }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={tw`flex-1 justify-center items-center`}>
        <ActivityIndicator size="large" color={currentTheme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
      <View style={tw`p-4`}>
        {/* Header */}
        <View style={tw`flex-row items-center mb-6`}>
          <MaterialCommunityIcons
            name="lock-alert"
            size={28}
            color={currentTheme.colors.primary}
          />
          <Text
            style={[
              tw`text-xl font-bold ml-3`,
              { color: currentTheme.colors.text },
            ]}
          >
            Verrouillage d'Application
          </Text>
        </View>

        {/* État actuel */}
        <View
          style={[
            tw`p-4 rounded-lg mb-4`,
            {
              backgroundColor: isLocked
                ? currentTheme.colors.error + "20"
                : currentTheme.colors.success + "20",
            },
          ]}
        >
          <View style={tw`flex-row items-center justify-between`}>
            <View style={tw`flex-row items-center`}>
              <MaterialCommunityIcons
                name={isLocked ? "lock" : "lock-open"}
                size={24}
                color={
                  isLocked
                    ? currentTheme.colors.error
                    : currentTheme.colors.success
                }
              />
              <Text
                style={[
                  tw`ml-2 font-medium`,
                  { color: currentTheme.colors.text },
                ]}
              >
                Application {isLocked ? "Verrouillée" : "Déverrouillée"}
              </Text>
            </View>
            <Switch
              value={isLocked}
              onValueChange={(value) => {
                setIsLocked(value);
                if (value && !editMode) {
                  setEditMode(true);
                }
              }}
              trackColor={{
                false: currentTheme.colors.border,
                true: currentTheme.colors.primary,
              }}
              thumbColor="#FFFFFF"
            />
          </View>
          {currentConfig?.isLocked && (
            <Text
              style={[
                tw`text-sm mt-2`,
                { color: currentTheme.colors.textSecondary },
              ]}
            >
              Type: {currentConfig.lockType} • Dernière mise à jour:{" "}
              {currentConfig.lastUpdatedAt?.toDate().toLocaleDateString()}
            </Text>
          )}
        </View>

        {/* Configurations prédéfinies */}
        {!editMode && (
          <View style={tw`mb-4`}>
            <Text
              style={[
                tw`text-lg font-bold mb-3`,
                { color: currentTheme.colors.text },
              ]}
            >
              Configurations Rapides
            </Text>

            <PresetButton
              preset="testEnded"
              label="Fin de période de test"
              icon="check-circle"
              color="#1e40af"
            />

            <PresetButton
              preset="maintenance"
              label="Maintenance"
              icon="wrench"
              color="#ea580c"
            />
            <TouchableOpacity
              style={[
                tw`p-4 rounded-lg mb-3 flex-row items-center border-2 border-dashed`,
                { borderColor: currentTheme.colors.border },
              ]}
              onPress={() => {
                setEditMode(true);
                setLockType("custom");
              }}
            >
              <MaterialCommunityIcons
                name="pencil"
                size={24}
                color={currentTheme.colors.primary}
              />
              <Text
                style={[
                  tw`ml-3 font-medium`,
                  { color: currentTheme.colors.text },
                ]}
              >
                Configuration personnalisée
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Formulaire de configuration */}
        {editMode && (
          <View
            style={[
              tw`p-4 rounded-lg mb-4`,
              { backgroundColor: currentTheme.colors.surface },
            ]}
          >
            <Text
              style={[
                tw`text-lg font-bold mb-4`,
                { color: currentTheme.colors.text },
              ]}
            >
              Configuration du Verrouillage
            </Text>

            {/* Type de verrouillage */}
            <View style={tw`mb-4`}>
              <Text
                style={[
                  tw`text-sm mb-2`,
                  { color: currentTheme.colors.textSecondary },
                ]}
              >
                Type de verrouillage
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {(["test_ended", "maintenance", "custom"] as const).map(
                  (type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        tw`px-3 py-2 rounded-full mr-2`,
                        {
                          backgroundColor:
                            lockType === type
                              ? currentTheme.colors.primary
                              : currentTheme.colors.surface,
                          borderWidth: 1,
                          borderColor: currentTheme.colors.border,
                        },
                      ]}
                      onPress={() => setLockType(type)}
                    >
                      <Text
                        style={{
                          color:
                            lockType === type
                              ? "#FFFFFF"
                              : currentTheme.colors.text,
                        }}
                      >
                        {type === "test_ended"
                          ? "Test terminé"
                          : type === "maintenance"
                          ? "Maintenance"
                          : "Personnalisé"}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </ScrollView>
            </View>

            {/* Titre */}
            <View style={tw`mb-4`}>
              <Text
                style={[
                  tw`text-sm mb-2`,
                  { color: currentTheme.colors.textSecondary },
                ]}
              >
                Titre *
              </Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Ex: Période de test terminée"
                placeholderTextColor={currentTheme.colors.textSecondary}
                style={[
                  tw`p-3 rounded-lg`,
                  {
                    backgroundColor: currentTheme.colors.background,
                    color: currentTheme.colors.text,
                    borderWidth: 1,
                    borderColor: currentTheme.colors.border,
                  },
                ]}
              />
            </View>

            {/* Message */}
            <View style={tw`mb-4`}>
              <Text
                style={[
                  tw`text-sm mb-2`,
                  { color: currentTheme.colors.textSecondary },
                ]}
              >
                Message *
              </Text>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Message à afficher aux utilisateurs..."
                placeholderTextColor={currentTheme.colors.textSecondary}
                multiline
                numberOfLines={4}
                style={[
                  tw`p-3 rounded-lg`,
                  {
                    backgroundColor: currentTheme.colors.background,
                    color: currentTheme.colors.text,
                    borderWidth: 1,
                    borderColor: currentTheme.colors.border,
                    minHeight: 100,
                    textAlignVertical: "top",
                  },
                ]}
              />
            </View>

            {/* Options supplémentaires */}
            <View style={tw`mb-4`}>
              <Text
                style={[
                  tw`text-sm mb-3`,
                  { color: currentTheme.colors.textSecondary },
                ]}
              >
                Options
              </Text>

              {/* Compte à rebours */}
              <View style={tw`flex-row items-center justify-between mb-3`}>
                <Text
                  style={[tw`text-sm`, { color: currentTheme.colors.text }]}
                >
                  Afficher un compte à rebours
                </Text>
                <Switch
                  value={showCountdown}
                  onValueChange={setShowCountdown}
                  trackColor={{
                    false: currentTheme.colors.border,
                    true: currentTheme.colors.primary,
                  }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {/* Date de déverrouillage */}
              {showCountdown && (
                <TouchableOpacity
                  style={[
                    tw`p-3 rounded-lg mb-3`,
                    {
                      backgroundColor: currentTheme.colors.background,
                      borderWidth: 1,
                      borderColor: currentTheme.colors.border,
                    },
                  ]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text
                    style={[
                      tw`text-sm`,
                      { color: currentTheme.colors.textSecondary },
                    ]}
                  >
                    Date de déverrouillage
                  </Text>
                  <Text
                    style={[
                      tw`text-base mt-1`,
                      { color: currentTheme.colors.text },
                    ]}
                  >
                    {unlockDate
                      ? unlockDate.toLocaleString()
                      : "Sélectionner une date"}
                  </Text>
                </TouchableOpacity>
              )}

              {showDatePicker && (
                <DateTimePicker
                  value={unlockDate || new Date()}
                  mode="datetime"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      setUnlockDate(selectedDate);
                    }
                  }}
                  minimumDate={new Date()}
                />
              )}

              {/* Support contact */}
              <View style={tw`flex-row items-center justify-between mb-3`}>
                <Text
                  style={[tw`text-sm`, { color: currentTheme.colors.text }]}
                >
                  Afficher contact support
                </Text>
                <Switch
                  value={showContactSupport}
                  onValueChange={setShowContactSupport}
                  trackColor={{
                    false: currentTheme.colors.border,
                    true: currentTheme.colors.primary,
                  }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {showContactSupport && (
                <>
                  <TextInput
                    value={contactEmail}
                    onChangeText={setContactEmail}
                    placeholder="Email de contact"
                    placeholderTextColor={currentTheme.colors.textSecondary}
                    keyboardType="email-address"
                    style={[
                      tw`p-3 rounded-lg mb-3`,
                      {
                        backgroundColor: currentTheme.colors.background,
                        color: currentTheme.colors.text,
                        borderWidth: 1,
                        borderColor: currentTheme.colors.border,
                      },
                    ]}
                  />

                  <TextInput
                    value={contactPhone}
                    onChangeText={setContactPhone}
                    placeholder="Téléphone de contact (optionnel)"
                    placeholderTextColor={currentTheme.colors.textSecondary}
                    keyboardType="phone-pad"
                    style={[
                      tw`p-3 rounded-lg mb-3`,
                      {
                        backgroundColor: currentTheme.colors.background,
                        color: currentTheme.colors.text,
                        borderWidth: 1,
                        borderColor: currentTheme.colors.border,
                      },
                    ]}
                  />
                </>
              )}

              {/* Bouton personnalisé */}
              <TextInput
                value={customButtonText}
                onChangeText={setCustomButtonText}
                placeholder="Texte du bouton personnalisé (optionnel)"
                placeholderTextColor={currentTheme.colors.textSecondary}
                style={[
                  tw`p-3 rounded-lg mb-3`,
                  {
                    backgroundColor: currentTheme.colors.background,
                    color: currentTheme.colors.text,
                    borderWidth: 1,
                    borderColor: currentTheme.colors.border,
                  },
                ]}
              />
            </View>

            {/* Personnalisation visuelle */}
            <View style={tw`mb-4`}>
              <Text
                style={[
                  tw`text-sm mb-3`,
                  { color: currentTheme.colors.textSecondary },
                ]}
              >
                Personnalisation
              </Text>

              <View style={tw`flex-row mb-3`}>
                <View style={tw`flex-1 mr-2`}>
                  <Text
                    style={[
                      tw`text-xs mb-1`,
                      { color: currentTheme.colors.textSecondary },
                    ]}
                  >
                    Couleur de fond
                  </Text>
                  <TextInput
                    value={backgroundColor}
                    onChangeText={setBackgroundColor}
                    placeholder="#1e40af"
                    placeholderTextColor={currentTheme.colors.textSecondary}
                    style={[
                      tw`p-2 rounded-lg`,
                      {
                        backgroundColor: currentTheme.colors.background,
                        color: currentTheme.colors.text,
                        borderWidth: 1,
                        borderColor: currentTheme.colors.border,
                      },
                    ]}
                  />
                </View>

                <View style={tw`flex-1 ml-2`}>
                  <Text
                    style={[
                      tw`text-xs mb-1`,
                      { color: currentTheme.colors.textSecondary },
                    ]}
                  >
                    Couleur du texte
                  </Text>
                  <TextInput
                    value={textColor}
                    onChangeText={setTextColor}
                    placeholder="#ffffff"
                    placeholderTextColor={currentTheme.colors.textSecondary}
                    style={[
                      tw`p-2 rounded-lg`,
                      {
                        backgroundColor: currentTheme.colors.background,
                        color: currentTheme.colors.text,
                        borderWidth: 1,
                        borderColor: currentTheme.colors.border,
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Aperçu */}
              <View style={[tw`p-4 rounded-lg`, { backgroundColor }]}>
                <Text
                  style={[tw`text-lg font-bold mb-2`, { color: textColor }]}
                >
                  {title || "Aperçu du titre"}
                </Text>
                <Text style={[tw`text-sm`, { color: textColor, opacity: 0.9 }]}>
                  {message || "Aperçu du message..."}
                </Text>
              </View>
            </View>

            {/* Boutons d'action */}
            <View style={tw`flex-row`}>
              <TouchableOpacity
                style={[
                  tw`flex-1 p-3 rounded-lg mr-2`,
                  { backgroundColor: currentTheme.colors.border },
                ]}
                onPress={() => {
                  setEditMode(false);
                  loadCurrentConfig();
                }}
              >
                <Text
                  style={[
                    tw`text-center font-medium`,
                    { color: currentTheme.colors.text },
                  ]}
                >
                  Annuler
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  tw`flex-1 p-3 rounded-lg ml-2`,
                  {
                    backgroundColor: isLocked
                      ? currentTheme.colors.error
                      : currentTheme.colors.success,
                    opacity: saving ? 0.5 : 1,
                  },
                ]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={tw`text-center font-medium text-white`}>
                    {isLocked ? "Verrouiller" : "Déverrouiller"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Informations */}
        <View
          style={[
            tw`p-4 rounded-lg`,
            { backgroundColor: currentTheme.colors.surface },
          ]}
        >
          <View style={tw`flex-row items-center mb-2`}>
            <MaterialCommunityIcons
              name="information"
              size={20}
              color={currentTheme.colors.primary}
            />
            <Text
              style={[
                tw`ml-2 font-medium`,
                { color: currentTheme.colors.text },
              ]}
            >
              Informations importantes
            </Text>
          </View>

          <Text
            style={[
              tw`text-sm mb-2`,
              { color: currentTheme.colors.textSecondary },
            ]}
          >
            • Les administrateurs et super-administrateurs peuvent toujours
            accéder à l'application
          </Text>
          <Text
            style={[
              tw`text-sm mb-2`,
              { color: currentTheme.colors.textSecondary },
            ]}
          >
            • Le verrouillage est appliqué en temps réel à tous les utilisateurs
            connectés
          </Text>
          <Text
            style={[
              tw`text-sm mb-2`,
              { color: currentTheme.colors.textSecondary },
            ]}
          >
            • Une notification push est envoyée lors du verrouillage pour "Test
            terminé"
          </Text>
          <Text
            style={[tw`text-sm`, { color: currentTheme.colors.textSecondary }]}
          >
            • Les utilisateurs verront l'écran de verrouillage au prochain
            lancement
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};
