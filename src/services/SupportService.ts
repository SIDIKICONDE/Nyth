import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  Unsubscribe,
  writeBatch,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db as firestore } from "../config/firebase";
import {
  SupportThread,
  SupportMessage,
  CreateThreadInput,
  SendMessageInput,
} from "../types/support";
import { pushNotificationService } from "./PushNotificationService";
import { systemLog } from "./SystemLogService";

class SupportService {
  private readonly THREADS_COLLECTION = "support_threads";
  private readonly MESSAGES_SUBCOLLECTION = "messages";
  private listeners: Map<string, Unsubscribe> = new Map();

  /**
   * Crée ou récupère le thread de support pour un utilisateur
   */
  async getOrCreateThread(
    userId: string,
    firstMessage?: string
  ): Promise<SupportThread> {
    try {
      const threadId = userId; // threadId = userId pour un thread unique par user
      const threadRef = doc(firestore, this.THREADS_COLLECTION, threadId);
      const threadDoc = await getDoc(threadRef);

      if (threadDoc.exists()) {
        return { id: threadDoc.id, ...threadDoc.data() } as SupportThread;
      }

      // Créer un nouveau thread
      const newThread: Omit<SupportThread, "id"> = {
        userId,
        status: "open",
        lastMessageAt: serverTimestamp() as Timestamp,
        lastMessageText: firstMessage || "",
        unreadForUser: false,
        unreadForAdmin: true,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
      };

      await setDoc(threadRef, newThread);

      // Si un premier message est fourni, l'ajouter
      if (firstMessage) {
        await this.sendMessage({
          threadId,
          text: firstMessage,
          sender: "user",
        });
      }

      systemLog.info("support", "Thread créé", { userId, threadId });
      return { id: threadId, ...newThread };
    } catch (error) {
      console.error("Erreur création thread:", error);
      systemLog.error("support", "Erreur création thread", error as Error, {
        userId,
      });
      throw error;
    }
  }

  /**
   * Récupère un thread par son ID
   */
  async getThread(threadId: string): Promise<SupportThread | null> {
    try {
      const threadDoc = await getDoc(
        doc(firestore, this.THREADS_COLLECTION, threadId)
      );

      if (!threadDoc.exists()) {
        return null;
      }

      return { id: threadDoc.id, ...threadDoc.data() } as SupportThread;
    } catch (error) {
      console.error("Erreur récupération thread:", error);
      throw error;
    }
  }

  /**
   * Récupère tous les threads (pour l'admin)
   */
  async getAllThreads(filter?: {
    status?: "open" | "closed";
  }): Promise<SupportThread[]> {
    try {
      let q = query(
        collection(firestore, this.THREADS_COLLECTION),
        orderBy("lastMessageAt", "desc")
      );

      if (filter?.status) {
        q = query(q, where("status", "==", filter.status));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
        id: doc.id,
        ...doc.data(),
      })) as SupportThread[];
    } catch (error) {
      console.error("Erreur récupération threads:", error);
      throw error;
    }
  }

  /**
   * Envoie un message dans un thread
   */
  async sendMessage(input: SendMessageInput): Promise<SupportMessage> {
    try {
      const { threadId, text, sender, attachments } = input;

      // Vérifier que le thread existe
      const thread = await this.getThread(threadId);
      if (!thread) {
        throw new Error("Thread non trouvé");
      }

      // Créer le message
      const messagesRef = collection(
        firestore,
        this.THREADS_COLLECTION,
        threadId,
        this.MESSAGES_SUBCOLLECTION
      );

      const messageData = {
        sender,
        text,
        createdAt: serverTimestamp(),
        attachments: attachments || [],
        read: false,
      };

      const messageDoc = await addDoc(messagesRef, messageData);

      // Mettre à jour le thread
      const threadUpdateData: Partial<SupportThread> = {
        lastMessageAt: serverTimestamp() as Timestamp,
        lastMessageText: text,
        updatedAt: serverTimestamp() as Timestamp,
      };

      // Gérer les statuts de lecture
      if (sender === "user") {
        threadUpdateData.unreadForAdmin = true;
        threadUpdateData.unreadForUser = false;
      } else {
        threadUpdateData.unreadForUser = true;
        threadUpdateData.unreadForAdmin = false;
      }

      // Si le thread était fermé et l'utilisateur envoie un message, le rouvrir
      if (thread.status === "closed" && sender === "user") {
        threadUpdateData.status = "open";
      }

      await updateDoc(
        doc(firestore, this.THREADS_COLLECTION, threadId),
        threadUpdateData
      );

      // Envoyer une notification push
      if (sender === "admin") {
        // Notification à l'utilisateur
        await this.sendSupportNotification(thread.userId, text);
      } else {
        // Notification aux admins (à implémenter si nécessaire)
        await this.notifyAdmins(threadId, text);
      }

      systemLog.info("support", "Message envoyé", {
        threadId,
        sender,
        messageId: messageDoc.id,
      });

      return {
        id: messageDoc.id,
        threadId,
        ...messageData,
        createdAt: Timestamp.now(), // Temporaire jusqu'à ce que serverTimestamp soit résolu
      } as SupportMessage;
    } catch (error) {
      console.error("Erreur envoi message:", error);
      systemLog.error("support", "Erreur envoi message", error as Error);
      throw error;
    }
  }

  /**
   * Récupère les messages d'un thread
   */
  async getMessages(
    threadId: string,
    limitCount = 50
  ): Promise<SupportMessage[]> {
    try {
      const messagesQuery = query(
        collection(
          firestore,
          this.THREADS_COLLECTION,
          threadId,
          this.MESSAGES_SUBCOLLECTION
        ),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );

      const snapshot = await getDocs(messagesQuery);

      const messages = snapshot.docs.map(
        (doc: QueryDocumentSnapshot<DocumentData>) => ({
          id: doc.id,
          threadId,
          ...doc.data(),
        })
      ) as SupportMessage[];

      // Retourner dans l'ordre chronologique
      return messages.reverse();
    } catch (error) {
      console.error("Erreur récupération messages:", error);
      throw error;
    }
  }

  /**
   * Écoute les changements sur un thread (temps réel)
   */
  subscribeToThread(
    threadId: string,
    callback: (thread: SupportThread) => void
  ): Unsubscribe {
    const unsubscribe = onSnapshot(
      doc(firestore, this.THREADS_COLLECTION, threadId),
      (doc) => {
        if (doc.exists()) {
          callback({ id: doc.id, ...doc.data() } as SupportThread);
        }
      },
      (error) => {
        console.error("Erreur listener thread:", error);
      }
    );

    this.listeners.set(`thread_${threadId}`, unsubscribe);
    return unsubscribe;
  }

  /**
   * Écoute les nouveaux messages d'un thread (temps réel)
   */
  subscribeToMessages(
    threadId: string,
    callback: (messages: SupportMessage[]) => void
  ): Unsubscribe {
    const messagesQuery = query(
      collection(
        firestore,
        this.THREADS_COLLECTION,
        threadId,
        this.MESSAGES_SUBCOLLECTION
      ),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const messages = snapshot.docs.map(
          (doc: QueryDocumentSnapshot<DocumentData>) => ({
            id: doc.id,
            threadId,
            ...doc.data(),
          })
        ) as SupportMessage[];

        callback(messages);
      },
      (error) => {
        console.error("Erreur listener messages:", error);
      }
    );

    this.listeners.set(`messages_${threadId}`, unsubscribe);
    return unsubscribe;
  }

  /**
   * Écoute tous les threads (pour l'admin)
   */
  subscribeToAllThreads(
    callback: (threads: SupportThread[]) => void
  ): Unsubscribe {
    const threadsQuery = query(
      collection(firestore, this.THREADS_COLLECTION),
      orderBy("lastMessageAt", "desc")
    );

    const unsubscribe = onSnapshot(
      threadsQuery,
      (snapshot) => {
        const threads = snapshot.docs.map(
          (doc: QueryDocumentSnapshot<DocumentData>) => ({
            id: doc.id,
            ...doc.data(),
          })
        ) as SupportThread[];

        callback(threads);
      },
      (error) => {
        console.error("Erreur listener threads:", error);
      }
    );

    this.listeners.set("all_threads", unsubscribe);
    return unsubscribe;
  }

  /**
   * Marque les messages comme lus
   */
  async markMessagesAsRead(
    threadId: string,
    sender: "user" | "admin"
  ): Promise<void> {
    try {
      const batch = writeBatch(firestore);

      // Mettre à jour le statut de lecture du thread
      const threadRef = doc(firestore, this.THREADS_COLLECTION, threadId);
      const updateData: Partial<SupportThread> = {};

      if (sender === "user") {
        updateData.unreadForUser = false;
      } else {
        updateData.unreadForAdmin = false;
      }

      batch.update(threadRef, updateData);

      // Optionnel : marquer les messages individuels comme lus
      const messagesQuery = query(
        collection(
          firestore,
          this.THREADS_COLLECTION,
          threadId,
          this.MESSAGES_SUBCOLLECTION
        ),
        where("sender", "!=", sender),
        where("read", "==", false)
      );

      const snapshot = await getDocs(messagesQuery);
      snapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        batch.update(doc.ref, { read: true });
      });

      await batch.commit();
    } catch (error) {
      console.error("Erreur marquage messages lus:", error);
      throw error;
    }
  }

  /**
   * Ferme un thread
   */
  async closeThread(threadId: string): Promise<void> {
    try {
      await updateDoc(doc(firestore, this.THREADS_COLLECTION, threadId), {
        status: "closed",
        updatedAt: serverTimestamp(),
      });

      systemLog.info("support", "Thread fermé", { threadId });
    } catch (error) {
      console.error("Erreur fermeture thread:", error);
      throw error;
    }
  }

  /**
   * Rouvre un thread
   */
  async reopenThread(threadId: string): Promise<void> {
    try {
      await updateDoc(doc(firestore, this.THREADS_COLLECTION, threadId), {
        status: "open",
        updatedAt: serverTimestamp(),
      });

      systemLog.info("support", "Thread rouvert", { threadId });
    } catch (error) {
      console.error("Erreur réouverture thread:", error);
      throw error;
    }
  }

  /**
   * Envoie une notification push à l'utilisateur
   */
  private async sendSupportNotification(
    userId: string,
    messageText: string
  ): Promise<void> {
    try {
      await pushNotificationService.sendToUser(userId, {
        title: "Nouveau message du support",
        body:
          messageText.substring(0, 100) +
          (messageText.length > 100 ? "..." : ""),
        data: {
          deeplink: "app://support",
          type: "support_message",
        },
        category: "message",
        priority: "high",
      });
    } catch (error) {
      console.error("Erreur envoi notification support:", error);
    }
  }

  /**
   * Notifie les admins d'un nouveau message
   */
  private async notifyAdmins(
    threadId: string,
    messageText: string
  ): Promise<void> {
    try {
      // Récupérer les admins
      const adminsQuery = query(
        collection(firestore, "users"),
        where("role", "==", "admin")
      );

      const adminsSnapshot = await getDocs(adminsQuery);
      const adminIds = adminsSnapshot.docs.map(
        (doc: QueryDocumentSnapshot<DocumentData>) => doc.id
      );

      // Envoyer une notification à chaque admin
      for (const adminId of adminIds) {
        await pushNotificationService.sendToUser(adminId, {
          title: "Nouveau message support",
          body: `Thread ${threadId}: ${messageText.substring(0, 50)}...`,
          data: {
            deeplink: `app://admin/support/${threadId}`,
            type: "support_admin_notification",
          },
          category: "message",
          priority: "high",
        });
      }
    } catch (error) {
      console.error("Erreur notification admins:", error);
    }
  }

  /**
   * Obtient le nombre de threads non lus pour l'admin
   */
  async getUnreadThreadsCount(): Promise<number> {
    try {
      const q = query(
        collection(firestore, this.THREADS_COLLECTION),
        where("unreadForAdmin", "==", true),
        where("status", "==", "open")
      );

      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error("Erreur comptage threads non lus:", error);
      return 0;
    }
  }

  /**
   * Vérifie si l'utilisateur a des messages non lus
   */
  async hasUnreadMessages(userId: string): Promise<boolean> {
    try {
      const threadDoc = await getDoc(
        doc(firestore, this.THREADS_COLLECTION, userId)
      );

      if (!threadDoc.exists()) {
        return false;
      }

      return threadDoc.data()?.unreadForUser || false;
    } catch (error) {
      console.error("Erreur vérification messages non lus:", error);
      return false;
    }
  }

  /**
   * Nettoie tous les listeners
   */
  unsubscribeAll(): void {
    this.listeners.forEach((unsubscribe) => unsubscribe());
    this.listeners.clear();
  }
}

// Export d'une instance unique
export const supportService = new SupportService();
export default SupportService;
