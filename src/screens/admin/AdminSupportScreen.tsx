import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useAdminSupport } from "../../hooks/useSupport";
import { SupportThread, SupportMessage } from "../../types/support";
import { Timestamp } from "firebase/firestore";

const AdminSupportScreen: React.FC = () => {
  const {
    threads,
    selectedThread,
    messages,
    loading,
    error,
    sending,
    filter,
    setFilter,
    selectThread,
    sendMessage,
    closeThread,
    reopenThread,
    unreadCount,
  } = useAdminSupport();

  const [inputText, setInputText] = useState("");
  const [showThreadDetails, setShowThreadDetails] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Scroll automatique vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    if (messages.length > 0 && showThreadDetails) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, showThreadDetails]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !selectedThread) return;

    const messageText = inputText.trim();
    setInputText("");

    try {
      await sendMessage(messageText);
    } catch (err) {
      Alert.alert("Erreur", "Impossible d'envoyer le message");
      setInputText(messageText);
    }
  };

  const handleCloseThread = async () => {
    if (!selectedThread) return;

    Alert.alert(
      "Fermer le ticket",
      "Êtes-vous sûr de vouloir fermer ce ticket de support ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Fermer",
          style: "destructive",
          onPress: async () => {
            try {
              await closeThread(selectedThread.id);
              setShowThreadDetails(false);
            } catch (err) {
              Alert.alert("Erreur", "Impossible de fermer le ticket");
            }
          },
        },
      ]
    );
  };

  const handleReopenThread = async () => {
    if (!selectedThread) return;

    try {
      await reopenThread(selectedThread.id);
    } catch (err) {
      Alert.alert("Erreur", "Impossible de rouvrir le ticket");
    }
  };

  const formatTime = (timestamp: Timestamp) => {
    try {
      const date = timestamp.toDate();
      const now = new Date();

      if (date.toDateString() === now.toDateString()) {
        return format(date, "HH:mm");
      }

      if (date.getFullYear() === now.getFullYear()) {
        return date.toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
        });
      }

      return date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  const renderThreadItem = ({ item }: { item: SupportThread }) => {
    const isSelected = selectedThread?.id === item.id;
    const hasUnread = item.unreadForAdmin && item.status === "open";

    return (
      <TouchableOpacity
        style={[styles.threadItem, isSelected && styles.threadItemSelected]}
        onPress={() => {
          selectThread(item);
          setShowThreadDetails(true);
        }}
      >
        <View style={styles.threadHeader}>
          <View style={styles.threadInfo}>
            <Text style={styles.threadUserId} numberOfLines={1}>
              User: {item.userId.substring(0, 8)}...
            </Text>
            {hasUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>Nouveau</Text>
              </View>
            )}
          </View>
          <Text style={styles.threadTime}>
            {formatTime(item.lastMessageAt)}
          </Text>
        </View>

        <Text style={styles.threadMessage} numberOfLines={2}>
          {item.lastMessageText}
        </Text>

        <View style={styles.threadFooter}>
          <View
            style={[
              styles.statusBadge,
              item.status === "open" ? styles.openBadge : styles.closedBadge,
            ]}
          >
            <Text style={styles.statusText}>
              {item.status === "open" ? "Ouvert" : "Fermé"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderMessage = ({ item }: { item: SupportMessage }) => {
    const isAdmin = item.sender === "admin";

    return (
      <View
        style={[
          styles.messageContainer,
          isAdmin ? styles.adminMessage : styles.userMessage,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isAdmin ? styles.adminBubble : styles.userBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isAdmin ? styles.adminText : styles.userText,
            ]}
          >
            {item.text}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isAdmin ? styles.adminTime : styles.userTime,
            ]}
          >
            {format(item.createdAt.toDate(), "HH:mm")}
          </Text>
        </View>
      </View>
    );
  };

  const ThreadDetailModal = () => (
    <Modal
      visible={showThreadDetails && !!selectedThread}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowThreadDetails(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setShowThreadDetails(false)}
          >
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>

          <View style={styles.modalHeaderInfo}>
            <Text style={styles.modalTitle}>
              Support - {selectedThread?.userId.substring(0, 8)}...
            </Text>
            <View
              style={[
                styles.statusBadge,
                selectedThread?.status === "open"
                  ? styles.openBadge
                  : styles.closedBadge,
              ]}
            >
              <Text style={styles.statusText}>
                {selectedThread?.status === "open" ? "Ouvert" : "Fermé"}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={
              selectedThread?.status === "open"
                ? handleCloseThread
                : handleReopenThread
            }
          >
            <Ionicons
              name={
                selectedThread?.status === "open"
                  ? "close-circle-outline"
                  : "refresh-outline"
              }
              size={24}
              color={selectedThread?.status === "open" ? "#FF3B30" : "#34C759"}
            />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={styles.chatContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            inverted={false}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
          />

          {selectedThread?.status === "open" ? (
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Répondre au client..."
                placeholderTextColor="#999"
                multiline
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  !inputText.trim() && styles.sendButtonDisabled,
                ]}
                onPress={handleSendMessage}
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
              <Text style={styles.closedText}>Ce ticket est fermé</Text>
              <TouchableOpacity
                style={styles.reopenButton}
                onPress={handleReopenThread}
              >
                <Text style={styles.reopenButtonText}>Rouvrir le ticket</Text>
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );

  if (loading && threads.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Chargement des tickets...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header avec filtres */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Support Client</Text>
        {unreadCount > 0 && (
          <View style={styles.unreadCountBadge}>
            <Text style={styles.unreadCountText}>{unreadCount}</Text>
          </View>
        )}
      </View>

      {/* Filtres */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === "all" && styles.filterButtonActive,
          ]}
          onPress={() => setFilter("all")}
        >
          <Text
            style={[
              styles.filterText,
              filter === "all" && styles.filterTextActive,
            ]}
          >
            Tous
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === "open" && styles.filterButtonActive,
          ]}
          onPress={() => setFilter("open")}
        >
          <Text
            style={[
              styles.filterText,
              filter === "open" && styles.filterTextActive,
            ]}
          >
            Ouverts
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === "closed" && styles.filterButtonActive,
          ]}
          onPress={() => setFilter("closed")}
        >
          <Text
            style={[
              styles.filterText,
              filter === "closed" && styles.filterTextActive,
            ]}
          >
            Fermés
          </Text>
        </TouchableOpacity>
      </View>

      {/* Liste des threads */}
      {threads.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={60} color="#C7C7CC" />
          <Text style={styles.emptyText}>Aucun ticket de support</Text>
        </View>
      ) : (
        <FlatList
          data={threads}
          renderItem={renderThreadItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.threadsList}
        />
      )}

      {/* Modal de détail du thread */}
      <ThreadDetailModal />
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
  },
  unreadCountBadge: {
    backgroundColor: "#FF3B30",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: "center",
  },
  unreadCountText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: "#F2F2F7",
  },
  filterButtonActive: {
    backgroundColor: "#007AFF",
  },
  filterText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  filterTextActive: {
    color: "#FFF",
  },
  threadsList: {
    padding: 16,
  },
  threadItem: {
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  threadItemSelected: {
    borderColor: "#007AFF",
    borderWidth: 2,
  },
  threadHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  threadInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  threadUserId: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  unreadBadge: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  unreadBadgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "600",
  },
  threadTime: {
    fontSize: 12,
    color: "#999",
  },
  threadMessage: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  threadFooter: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  openBadge: {
    backgroundColor: "#E8F7EA",
  },
  closedBadge: {
    backgroundColor: "#FFE5E5",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#333",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#999",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  backButton: {
    padding: 4,
  },
  modalHeaderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  actionButton: {
    padding: 4,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    marginVertical: 4,
  },
  userMessage: {
    alignItems: "flex-start",
  },
  adminMessage: {
    alignItems: "flex-end",
  },
  messageBubble: {
    maxWidth: "80%",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: "#FFF",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  adminBubble: {
    backgroundColor: "#007AFF",
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userText: {
    color: "#333",
  },
  adminText: {
    color: "#FFF",
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  userTime: {
    color: "#999",
  },
  adminTime: {
    color: "rgba(255, 255, 255, 0.7)",
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
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
  },
  closedText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  reopenButton: {
    backgroundColor: "#34C759",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  reopenButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default AdminSupportScreen;
