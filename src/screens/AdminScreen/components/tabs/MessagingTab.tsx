import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Platform,
  ScrollView,
  Modal,
  ActivityIndicator,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useAdmin } from "../../../../hooks/useAdmin";
import { pushNotificationService } from "../../../../services/PushNotificationService";

// Types pour les présets
interface MessagePreset {
  id: string;
  category: string;
  icon: string;
  iconColor: string;
  title: string;
  body: string;
  deeplink?: string;
  variables?: string[];
  description: string;
}

// Catégories de présets
const PRESET_CATEGORIES = [
  { id: "welcome", label: "Bienvenue", icon: "hand-wave", color: "#4CAF50" },
  { id: "feature", label: "Fonctionnalités", icon: "sparkles", color: "#2196F3" },
  { id: "promotion", label: "Promotions", icon: "tag", color: "#FF9800" },
  { id: "reminder", label: "Rappels", icon: "bell", color: "#9C27B0" },
  { id: "update", label: "Mises à jour", icon: "refresh", color: "#00BCD4" },
  { id: "support", label: "Support", icon: "help-circle", color: "#607D8B" },
];

// Présets de messages
const MESSAGE_PRESETS: MessagePreset[] = [
  // Bienvenue
  {
    id: "welcome_new",
    category: "welcome",
    icon: "hand-wave",
    iconColor: "#4CAF50",
    title: "Bienvenue sur {{appName}} ! 🎉",
    body: "Nous sommes ravis de vous accueillir ! Découvrez toutes nos fonctionnalités pour optimiser votre expérience.",
    deeplink: "app://onboarding",
    variables: ["appName"],
    description: "Message de bienvenue pour les nouveaux utilisateurs",
  },
  {
    id: "welcome_back",
    category: "welcome",
    icon: "heart",
    iconColor: "#E91E63",
    title: "Content de vous revoir {{userName}} ! 👋",
    body: "Vous nous avez manqué ! Découvrez les nouveautés depuis votre dernière visite.",
    deeplink: "app://home",
    variables: ["userName"],
    description: "Message de retour pour les utilisateurs inactifs",
  },

  // Fonctionnalités
  {
    id: "feature_ai",
    category: "feature",
    icon: "robot",
    iconColor: "#2196F3",
    title: "🤖 Découvrez notre IA améliorée",
    body: "Notre assistant IA est maintenant 2x plus rapide et plus intelligent. Essayez-le dès maintenant !",
    deeplink: "app://ai-assistant",
    description: "Présentation de l'IA améliorée",
  },
  {
    id: "feature_recording",
    category: "feature",
    icon: "microphone",
    iconColor: "#FF5722",
    title: "🎙️ Nouveauté : Enregistrement HD",
    body: "Profitez d'une qualité audio exceptionnelle avec notre nouveau mode HD. Vos enregistrements n'ont jamais été aussi clairs !",
    deeplink: "app://recording",
    description: "Nouvelle fonctionnalité d'enregistrement",
  },

  // Promotions
  {
    id: "promo_discount",
    category: "promotion",
    icon: "sale",
    iconColor: "#FF9800",
    title: "🎁 Offre exclusive : {{discount}}% de réduction !",
    body: "Profitez de {{discount}}% de réduction sur l'abonnement Premium. Offre limitée jusqu'au {{date}} !",
    deeplink: "app://subscriptions",
    variables: ["discount", "date"],
    description: "Promotion avec réduction personnalisable",
  },
  {
    id: "promo_trial",
    category: "promotion",
    icon: "gift",
    iconColor: "#4CAF50",
    title: "🎁 Essai gratuit Premium",
    body: "Débloquez toutes les fonctionnalités Premium gratuitement pendant {{days}} jours. Aucune carte requise !",
    deeplink: "app://subscriptions",
    variables: ["days"],
    description: "Offre d'essai gratuit",
  },

  // Rappels
  {
    id: "reminder_incomplete",
    category: "reminder",
    icon: "clock-alert",
    iconColor: "#9C27B0",
    title: "⏰ N'oubliez pas votre session !",
    body: "Vous avez une session en cours. Reprenez là où vous vous êtes arrêté !",
    deeplink: "app://continue",
    description: "Rappel de session incomplète",
  },
  {
    id: "reminder_subscription",
    category: "reminder",
    icon: "credit-card",
    iconColor: "#F44336",
    title: "💳 Votre abonnement expire bientôt",
    body: "Votre abonnement Premium expire dans {{days}} jours. Renouvelez maintenant pour ne pas perdre vos avantages !",
    deeplink: "app://subscriptions",
    variables: ["days"],
    description: "Rappel d'expiration d'abonnement",
  },

  // Mises à jour
  {
    id: "update_app",
    category: "update",
    icon: "download",
    iconColor: "#00BCD4",
    title: "🚀 Nouvelle version disponible !",
    body: "La version {{version}} est disponible avec de nombreuses améliorations. Mettez à jour maintenant !",
    deeplink: "app://update",
    variables: ["version"],
    description: "Notification de mise à jour",
  },
  {
    id: "update_maintenance",
    category: "update",
    icon: "wrench",
    iconColor: "#FF9800",
    title: "🔧 Maintenance programmée",
    body: "Une maintenance est prévue le {{date}} de {{startTime}} à {{endTime}}. Merci de votre compréhension.",
    variables: ["date", "startTime", "endTime"],
    description: "Annonce de maintenance",
  },

  // Support
  {
    id: "support_feedback",
    category: "support",
    icon: "message-star",
    iconColor: "#607D8B",
    title: "💬 Votre avis compte !",
    body: "Comment trouvez-vous {{appName}} ? Partagez votre expérience et aidez-nous à nous améliorer !",
    deeplink: "app://feedback",
    variables: ["appName"],
    description: "Demande de feedback",
  },
  {
    id: "support_help",
    category: "support",
    icon: "lifebuoy",
    iconColor: "#3F51B5",
    title: "🆘 Besoin d'aide ?",
    body: "Notre équipe support est là pour vous ! Consultez notre FAQ ou contactez-nous directement.",
    deeplink: "app://support",
    description: "Offre d'assistance",
  },
];

export const MessagingTab: React.FC = () => {
  const { currentTheme } = useTheme();
  const colors = currentTheme.colors;
  const { isSuperAdmin } = useAdmin();

  const [targetType, setTargetType] = useState<"user" | "segment">("segment");
  const [userId, setUserId] = useState("");
  const [segment, setSegment] = useState<"all" | "free" | "paid" | "inactive">("all");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [deeplink, setDeeplink] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [variables, setVariables] = useState<Record<string, string>>({});

  // Filtrer les présets par catégorie
  const filteredPresets = useMemo(() => {
    if (!selectedCategory) return MESSAGE_PRESETS;
    return MESSAGE_PRESETS.filter(preset => preset.category === selectedCategory);
  }, [selectedCategory]);

  // Remplacer les variables dans le texte
  const replaceVariables = (text: string, vars: Record<string, string>) => {
    let result = text;
    Object.entries(vars).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    // Remplacer les variables par défaut
    result = result.replace(/{{appName}}/g, 'VocalNote');
    result = result.replace(/{{userName}}/g, 'Utilisateur');
    return result;
  };

  // Prévisualisation du message
  const previewTitle = useMemo(() => replaceVariables(title, variables), [title, variables]);
  const previewBody = useMemo(() => replaceVariables(body, variables), [body, variables]);

  const canSend = useMemo(() => {
    if (!title.trim() || !body.trim()) return false;
    if (targetType === "user" && !userId.trim()) return false;
    return true;
  }, [targetType, title, body, userId]);

  const handleSelectPreset = (preset: MessagePreset) => {
    setTitle(preset.title);
    setBody(preset.body);
    setDeeplink(preset.deeplink || "");
    
    // Initialiser les variables
    if (preset.variables) {
      const newVars: Record<string, string> = {};
      preset.variables.forEach(v => {
        newVars[v] = "";
      });
      setVariables(newVars);
    } else {
      setVariables({});
    }
    
    setShowPresets(false);
  };

  const handleSend = async () => {
    if (!isSuperAdmin) {
      Alert.alert("Accès refusé", "Réservé aux Super Admins");
      return;
    }
    if (!canSend) return;

    Alert.alert(
      "Confirmer l'envoi",
      `Envoyer ce message à ${targetType === 'user' ? 'l\'utilisateur' : `tous les utilisateurs ${segment}`} ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Envoyer",
          onPress: async () => {
            try {
              setSending(true);
              const finalTitle = replaceVariables(title, variables);
              const finalBody = replaceVariables(body, variables);
              const payload = { 
                title: finalTitle, 
                body: finalBody, 
                data: { type: "custom", deeplink } 
              };
              
              if (targetType === "user") {
                const ok = await pushNotificationService.sendNotification(
                  userId.trim(),
                  payload as any
                );
                if (!ok) throw new Error("sendNotification failed");
              } else {
                await pushNotificationService.sendSegmentNotification(
                  segment,
                  payload as any
                );
              }
              
              Alert.alert("Succès", "Message envoyé avec succès !");
              // Réinitialiser le formulaire
              setTitle("");
              setBody("");
              setDeeplink("");
              setVariables({});
            } catch (e) {
              Alert.alert("Erreur", "Impossible d'envoyer le message");
            } finally {
              setSending(false);
            }
          }
        }
      ]
    );
  };

  // Extraire les variables du texte actuel
  const currentVariables = useMemo(() => {
    const regex = /{{(\w+)}}/g;
    const foundVars = new Set<string>();
    let match;
    
    while ((match = regex.exec(title)) !== null) {
      if (match[1] !== 'appName' && match[1] !== 'userName') {
        foundVars.add(match[1]);
      }
    }
    
    regex.lastIndex = 0;
    while ((match = regex.exec(body)) !== null) {
      if (match[1] !== 'appName' && match[1] !== 'userName') {
        foundVars.add(match[1]);
      }
    }
    
    return Array.from(foundVars);
  }, [title, body]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header avec boutons d'action */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Centre de Messagerie
        </Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.primary + '20' }]}
            onPress={() => setShowPresets(true)}
          >
            <MaterialCommunityIcons name="message-text" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.success + '20' }]}
            onPress={() => setShowPreview(true)}
            disabled={!title && !body}
          >
            <Ionicons name="eye" size={20} color={colors.success} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sélection de la cible */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          <Ionicons name="people" size={16} color={colors.primary} /> Destinataires
        </Text>
        <View style={styles.targetSelector}>
          <TouchableOpacity
            style={[
              styles.targetOption,
              targetType === "segment" && { 
                backgroundColor: colors.primary,
                borderColor: colors.primary 
              },
              { borderColor: colors.border }
            ]}
            onPress={() => setTargetType("segment")}
          >
            <MaterialCommunityIcons 
              name="account-group" 
              size={18} 
              color={targetType === "segment" ? "#FFF" : colors.textSecondary} 
            />
            <Text
              style={{
                color: targetType === "segment" ? "#FFF" : colors.textSecondary,
                marginLeft: 6,
                fontWeight: "600"
              }}
            >
              Segment
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.targetOption,
              targetType === "user" && { 
                backgroundColor: colors.primary,
                borderColor: colors.primary 
              },
              { borderColor: colors.border }
            ]}
            onPress={() => setTargetType("user")}
          >
            <MaterialCommunityIcons 
              name="account" 
              size={18} 
              color={targetType === "user" ? "#FFF" : colors.textSecondary} 
            />
            <Text
              style={{
                color: targetType === "user" ? "#FFF" : colors.textSecondary,
                marginLeft: 6,
                fontWeight: "600"
              }}
            >
              Utilisateur
            </Text>
          </TouchableOpacity>
        </View>

        {targetType === "user" ? (
          <TextInput
            placeholder="Entrez l'UID de l'utilisateur"
            placeholderTextColor={colors.textSecondary}
            value={userId}
            onChangeText={setUserId}
            style={[
              styles.input,
              { 
                color: colors.text, 
                backgroundColor: colors.background,
                borderColor: colors.border 
              },
            ]}
          />
        ) : (
          <View style={styles.segmentSelector}>
            {(["all", "free", "paid", "inactive"] as const).map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.segmentPill,
                  segment === s && { backgroundColor: colors.primary },
                  { borderColor: colors.border }
                ]}
                onPress={() => setSegment(s)}
              >
                <Text
                  style={{
                    color: segment === s ? "#FFF" : colors.textSecondary,
                    fontWeight: "600",
                    fontSize: 13,
                  }}
                >
                  {s === "all" ? "Tous" : 
                   s === "free" ? "Gratuits" :
                   s === "paid" ? "Premium" : "Inactifs"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Composition du message */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          <Ionicons name="create" size={16} color={colors.primary} /> Message
        </Text>
        
        <TextInput
          placeholder="Titre de la notification"
          placeholderTextColor={colors.textSecondary}
          value={title}
          onChangeText={setTitle}
          style={[
            styles.input,
            { 
              color: colors.text, 
              backgroundColor: colors.background,
              borderColor: colors.border 
            },
          ]}
        />
        
        <TextInput
          placeholder="Corps du message"
          placeholderTextColor={colors.textSecondary}
          value={body}
          onChangeText={setBody}
          style={[
            styles.textarea,
            { 
              color: colors.text, 
              backgroundColor: colors.background,
              borderColor: colors.border 
            },
          ]}
          multiline
          numberOfLines={4}
        />
        
        <TextInput
          placeholder="Deeplink (optionnel) ex: app://subscriptions"
          placeholderTextColor={colors.textSecondary}
          value={deeplink}
          onChangeText={setDeeplink}
          style={[
            styles.input,
            { 
              color: colors.text, 
              backgroundColor: colors.background,
              borderColor: colors.border 
            },
          ]}
        />

        {/* Variables dynamiques */}
        {currentVariables.length > 0 && (
          <View style={styles.variablesSection}>
            <Text style={[styles.variablesTitle, { color: colors.text }]}>
              <MaterialCommunityIcons name="variable" size={16} color={colors.warning} /> Variables dynamiques
            </Text>
            {currentVariables.map(varName => (
              <View key={varName} style={styles.variableRow}>
                <Text style={[styles.variableLabel, { color: colors.textSecondary }]}>
                  {varName}:
                </Text>
                <TextInput
                  placeholder={`Valeur pour ${varName}`}
                  placeholderTextColor={colors.textSecondary}
                  value={variables[varName] || ""}
                  onChangeText={(text) => setVariables(prev => ({ ...prev, [varName]: text }))}
                  style={[
                    styles.variableInput,
                    { 
                      color: colors.text, 
                      backgroundColor: colors.background,
                      borderColor: colors.border 
                    },
                  ]}
                />
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Bouton d'envoi */}
      <TouchableOpacity
        onPress={handleSend}
        disabled={!canSend || sending}
        style={[
          styles.sendButton,
          { 
            backgroundColor: canSend ? colors.primary : colors.border,
            opacity: sending ? 0.7 : 1
          },
        ]}
      >
        {sending ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <>
            <Ionicons name="send" size={20} color="#FFF" />
            <Text style={styles.sendButtonText}>Envoyer le message</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Modal des présets */}
      <Modal
        visible={showPresets}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPresets(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Choisir un modèle
              </Text>
              <TouchableOpacity onPress={() => setShowPresets(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Catégories */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
              <TouchableOpacity
                style={[
                  styles.categoryChip,
                  !selectedCategory && { backgroundColor: colors.primary },
                  { borderColor: colors.border }
                ]}
                onPress={() => setSelectedCategory(null)}
              >
                <Text style={{ color: !selectedCategory ? "#FFF" : colors.text }}>
                  Tous
                </Text>
              </TouchableOpacity>
              {PRESET_CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    selectedCategory === cat.id && { backgroundColor: cat.color },
                    { borderColor: colors.border }
                  ]}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <MaterialCommunityIcons 
                    name={cat.icon as any} 
                    size={16} 
                    color={selectedCategory === cat.id ? "#FFF" : cat.color} 
                  />
                  <Text style={{ 
                    color: selectedCategory === cat.id ? "#FFF" : colors.text,
                    marginLeft: 4
                  }}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Liste des présets */}
            <ScrollView style={styles.presetsList}>
              {filteredPresets.map(preset => (
                <TouchableOpacity
                  key={preset.id}
                  style={[styles.presetCard, { backgroundColor: colors.surface }]}
                  onPress={() => handleSelectPreset(preset)}
                >
                  <View style={styles.presetHeader}>
                    <View style={[styles.presetIcon, { backgroundColor: preset.iconColor + '20' }]}>
                      <MaterialCommunityIcons 
                        name={preset.icon as any} 
                        size={20} 
                        color={preset.iconColor} 
                      />
                    </View>
                    <View style={styles.presetContent}>
                      <Text style={[styles.presetTitle, { color: colors.text }]}>
                        {preset.title.replace(/{{.*?}}/g, '...')}
                      </Text>
                      <Text style={[styles.presetDescription, { color: colors.textSecondary }]}>
                        {preset.description}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.presetBody, { color: colors.textSecondary }]} numberOfLines={2}>
                    {preset.body.replace(/{{.*?}}/g, '...')}
                  </Text>
                  {preset.variables && preset.variables.length > 0 && (
                    <View style={styles.presetVariables}>
                      <MaterialCommunityIcons name="variable" size={14} color={colors.warning} />
                      <Text style={[styles.presetVariablesText, { color: colors.warning }]}>
                        Variables: {preset.variables.join(', ')}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de prévisualisation */}
      <Modal
        visible={showPreview}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowPreview(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.previewModal, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Aperçu de la notification
              </Text>
              <TouchableOpacity onPress={() => setShowPreview(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Simulation de notification */}
            <View style={[styles.notificationPreview, { backgroundColor: colors.surface }]}>
              <View style={styles.notificationHeader}>
                <View style={[styles.appIcon, { backgroundColor: colors.primary }]}>
                  <Ionicons name="notifications" size={20} color="#FFF" />
                </View>
                <View style={styles.notificationMeta}>
                  <Text style={[styles.appName, { color: colors.text }]}>VocalNote</Text>
                  <Text style={[styles.notificationTime, { color: colors.textSecondary }]}>
                    Maintenant
                  </Text>
                </View>
              </View>
              <Text style={[styles.notificationTitle, { color: colors.text }]}>
                {previewTitle || "Titre de la notification"}
              </Text>
              <Text style={[styles.notificationBody, { color: colors.textSecondary }]}>
                {previewBody || "Corps du message"}
              </Text>
              {deeplink && (
                <View style={styles.deeplinkPreview}>
                  <Ionicons name="link" size={14} color={colors.primary} />
                  <Text style={[styles.deeplinkText, { color: colors.primary }]}>
                    {deeplink}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.previewInfo}>
              <View style={styles.previewInfoRow}>
                <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>
                  Cible:
                </Text>
                <Text style={[styles.previewValue, { color: colors.text }]}>
                  {targetType === 'user' ? `Utilisateur ${userId || '...'}` : `Segment ${segment}`}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  title: { 
    fontSize: 24, 
    fontWeight: "700",
  },
  headerButtons: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    padding: 10,
    borderRadius: 10,
  },
  section: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
    }),
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  targetSelector: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  targetOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  segmentSelector: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  segmentPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    fontSize: 15,
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    height: 100,
    textAlignVertical: "top",
    fontSize: 15,
  },
  variablesSection: {
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,193,7,0.1)',
  },
  variablesTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
  },
  variableRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  variableLabel: {
    width: 100,
    fontSize: 14,
  },
  variableInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
  },
  sendButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  sendButtonText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 60,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  presetsList: {
    paddingHorizontal: 16,
  },
  presetCard: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  presetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  presetIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  presetContent: {
    flex: 1,
  },
  presetTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  presetDescription: {
    fontSize: 12,
  },
  presetBody: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  presetVariables: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 4,
  },
  presetVariablesText: {
    fontSize: 12,
  },
  previewModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  notificationPreview: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  appIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  notificationMeta: {
    flex: 1,
  },
  appName: {
    fontSize: 14,
    fontWeight: "600",
  },
  notificationTime: {
    fontSize: 12,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  deeplinkPreview: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 4,
  },
  deeplinkText: {
    fontSize: 12,
  },
  previewInfo: {
    paddingHorizontal: 16,
  },
  previewInfoRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  previewLabel: {
    fontSize: 14,
    marginRight: 8,
  },
  previewValue: {
    fontSize: 14,
    fontWeight: "500",
  },
});
