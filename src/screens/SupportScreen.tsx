import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useUserSupportThread } from "../hooks/useSupport";
import { SupportMessage } from "../types/support";
import { Timestamp } from "firebase/firestore";

const SupportScreen: React.FC = () => {
  const {
    thread,
    messages,
    loading,
    error,
    sending,
    sendMessage,
    markAsRead,
    hasUnread,
  } = useUserSupportThread();

  const [inputText, setInputText] = useState("");
  const flatListRef = useRef<FlatList>(null);

  // Marquer comme lu quand l'écran est visible
  useEffect(() => {
    if (hasUnread) {
      markAsRead();
    }
  }, [hasUnread, markAsRead]);

  // Scroll automatique vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const messageText = inputText.trim();
    setInputText("");

    try {
      await sendMessage(messageText);
    } catch (err) {
      Alert.alert("Erreur", "Impossible d'envoyer le message");
      setInputText(messageText); // Restaurer le texte en cas d'erreur
    }
  };

  const formatMessageTime = (timestamp: Timestamp | Date) => {
    try {
      const date =
        timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
      const now = new Date();
      const messageDate = new Date(date);

      // Si c'est aujourd'hui, afficher seulement l'heure
      if (messageDate.toDateString() === now.toDateString()) {
        return format(messageDate, "HH:mm");
      }

      // Si c'est cette année, afficher jour et mois
      if (messageDate.getFullYear() === now.getFullYear()) {
        return messageDate.toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        });
      }

      // Sinon afficher la date complète
      return messageDate.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const renderMessage = ({ item }: { item: SupportMessage }) => {
    const isUser = item.sender === "user";

    return (
      <View
        style={[
          styles.messageContainer,
          isUser ? styles.userMessage : styles.adminMessage,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.adminBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isUser ? styles.userText : styles.adminText,
            ]}
          >
            {item.text}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isUser ? styles.userTime : styles.adminTime,
            ]}
          >
            {formatMessageTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  const renderHeader = () => {
    if (messages.length === 0 && !loading) {
      return (
        <View style={styles.welcomeContainer}>
          <Ionicons name="chatbubbles-outline" size={60} color="#666" />
          <Text style={styles.welcomeTitle}>Bienvenue au support</Text>
          <Text style={styles.welcomeText}>
            Comment pouvons-nous vous aider aujourd'hui ?
          </Text>
          <Text style={styles.welcomeSubtext}>
            Posez votre question et notre équipe vous répondra dans les plus
            brefs délais.
          </Text>
        </View>
      );
    }
    return null;
  };

  if (loading && messages.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={60} color="#FF3B30" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Ionicons name="headset" size={24} color="#007AFF" />
            <Text style={styles.headerTitle}>Support</Text>
            {thread?.status === "closed" && (
              <View style={styles.closedBadge}>
                <Text style={styles.closedBadgeText}>Fermé</Text>
              </View>
            )}
          </View>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          ListHeaderComponent={renderHeader}
          inverted={false}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
        />

        {/* Input */}
        {thread?.status === "open" ? (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Écrivez votre message..."
              placeholderTextColor="#999"
              multiline
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                !inputText.trim() && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!inputText.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Ionicons
                  name="send"
                  size={20}
                  color={inputText.trim() ? "#FFF" : "#999"}
                />
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.closedContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" />
            <Text style={styles.closedText}>
              Ce ticket de support est fermé. Créez un nouveau message pour
              rouvrir.
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: "#FF3B30",
    textAlign: "center",
  },
  header: {
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
    flex: 1,
  },
  closedBadge: {
    backgroundColor: "#FF3B30",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  closedBadgeText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  welcomeContainer: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  welcomeSubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  messageContainer: {
    marginVertical: 4,
  },
  userMessage: {
    alignItems: "flex-end",
  },
  adminMessage: {
    alignItems: "flex-start",
  },
  messageBubble: {
    maxWidth: "80%",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: "#007AFF",
    borderBottomRightRadius: 4,
  },
  adminBubble: {
    backgroundColor: "#FFF",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userText: {
    color: "#FFF",
  },
  adminText: {
    color: "#333",
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  userTime: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  adminTime: {
    color: "#999",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
    alignItems: "flex-end",
  },
  textInput: {
    flex: 1,
    minHeight: 36,
    maxHeight: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#F2F2F7",
    borderRadius: 20,
    fontSize: 16,
    marginRight: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#C7C7CC",
  },
  closedContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
  },
  closedText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666",
  },
});

export default SupportScreen;
