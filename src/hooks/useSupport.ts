import { useState, useEffect, useCallback } from "react";
import { getAuth } from "@react-native-firebase/auth";
import { supportService } from "../services/SupportService";
import {
  SupportThread,
  SupportMessage,
  SendMessageInput,
} from "../types/support";
import { Unsubscribe } from "firebase/firestore";

/**
 * Hook pour gérer le thread de support de l'utilisateur actuel
 */
export const useUserSupportThread = () => {
  const [thread, setThread] = useState<SupportThread | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let unsubscribeThread: Unsubscribe | null = null;
    let unsubscribeMessages: Unsubscribe | null = null;

    const initializeThread = async () => {
      try {
        setLoading(true);
        const user = getAuth().currentUser;

        if (!user) {
          setError("Utilisateur non connecté");
          return;
        }

        // Récupérer ou créer le thread
        const userThread = await supportService.getOrCreateThread(user.uid);
        setThread(userThread);

        // S'abonner aux changements du thread
        unsubscribeThread = supportService.subscribeToThread(
          user.uid,
          (updatedThread) => {
            setThread(updatedThread);
          }
        );

        // S'abonner aux messages
        unsubscribeMessages = supportService.subscribeToMessages(
          user.uid,
          (updatedMessages) => {
            setMessages(updatedMessages);
          }
        );

        // Marquer les messages comme lus
        await supportService.markMessagesAsRead(user.uid, "user");
      } catch (err) {
        console.error("Erreur initialisation thread:", err);
        setError("Erreur lors du chargement du support");
      } finally {
        setLoading(false);
      }
    };

    initializeThread();

    // Cleanup
    return () => {
      unsubscribeThread?.();
      unsubscribeMessages?.();
    };
  }, []);

  const sendMessage = useCallback(
    async (text: string, attachments?: string[]) => {
      if (!thread || sending) return;

      try {
        setSending(true);
        await supportService.sendMessage({
          threadId: thread.id,
          text,
          sender: "user",
          attachments,
        });
      } catch (err) {
        console.error("Erreur envoi message:", err);
        throw err;
      } finally {
        setSending(false);
      }
    },
    [thread, sending]
  );

  const markAsRead = useCallback(async () => {
    if (!thread) return;

    try {
      await supportService.markMessagesAsRead(thread.id, "user");
    } catch (err) {
      console.error("Erreur marquage lu:", err);
    }
  }, [thread]);

  return {
    thread,
    messages,
    loading,
    error,
    sending,
    sendMessage,
    markAsRead,
    hasUnread: thread?.unreadForUser || false,
  };
};

/**
 * Hook pour gérer tous les threads (admin)
 */
export const useAdminSupport = () => {
  const [threads, setThreads] = useState<SupportThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<SupportThread | null>(
    null
  );
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<"all" | "open" | "closed">("all");

  useEffect(() => {
    let unsubscribeThreads: Unsubscribe | null = null;

    const loadThreads = async () => {
      try {
        setLoading(true);

        // S'abonner à tous les threads
        unsubscribeThreads = supportService.subscribeToAllThreads(
          (allThreads) => {
            // Filtrer selon le statut
            const filteredThreads =
              filter === "all"
                ? allThreads
                : allThreads.filter((t) =>
                    filter === "open"
                      ? t.status === "open"
                      : t.status === "closed"
                  );

            setThreads(filteredThreads);
          }
        );
      } catch (err) {
        console.error("Erreur chargement threads:", err);
        setError("Erreur lors du chargement des threads");
      } finally {
        setLoading(false);
      }
    };

    loadThreads();

    return () => {
      unsubscribeThreads?.();
    };
  }, [filter]);

  // Gérer la sélection d'un thread
  useEffect(() => {
    let unsubscribeMessages: Unsubscribe | null = null;

    if (selectedThread) {
      // S'abonner aux messages du thread sélectionné
      unsubscribeMessages = supportService.subscribeToMessages(
        selectedThread.id,
        (updatedMessages) => {
          setMessages(updatedMessages);
        }
      );

      // Marquer comme lu
      supportService.markMessagesAsRead(selectedThread.id, "admin");
    } else {
      setMessages([]);
    }

    return () => {
      unsubscribeMessages?.();
    };
  }, [selectedThread]);

  const selectThread = useCallback((thread: SupportThread) => {
    setSelectedThread(thread);
  }, []);

  const sendMessage = useCallback(
    async (text: string, attachments?: string[]) => {
      if (!selectedThread || sending) return;

      try {
        setSending(true);
        await supportService.sendMessage({
          threadId: selectedThread.id,
          text,
          sender: "admin",
          attachments,
        });
      } catch (err) {
        console.error("Erreur envoi message:", err);
        throw err;
      } finally {
        setSending(false);
      }
    },
    [selectedThread, sending]
  );

  const closeThread = useCallback(async (threadId: string) => {
    try {
      await supportService.closeThread(threadId);
    } catch (err) {
      console.error("Erreur fermeture thread:", err);
      throw err;
    }
  }, []);

  const reopenThread = useCallback(async (threadId: string) => {
    try {
      await supportService.reopenThread(threadId);
    } catch (err) {
      console.error("Erreur réouverture thread:", err);
      throw err;
    }
  }, []);

  const getUnreadCount = useCallback(() => {
    return threads.filter((t) => t.unreadForAdmin && t.status === "open")
      .length;
  }, [threads]);

  return {
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
    unreadCount: getUnreadCount(),
  };
};

/**
 * Hook pour vérifier les messages non lus
 */
export const useSupportBadge = () => {
  const [hasUnread, setHasUnread] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: Unsubscribe | null = null;

    const checkUnread = async () => {
      try {
        const user = getAuth().currentUser;
        if (!user) {
          setHasUnread(false);
          return;
        }

        // S'abonner au thread de l'utilisateur
        unsubscribe = supportService.subscribeToThread(user.uid, (thread) => {
          setHasUnread(thread.unreadForUser);
        });
      } catch (err) {
        console.error("Erreur vérification badge:", err);
      } finally {
        setLoading(false);
      }
    };

    checkUnread();

    return () => {
      unsubscribe?.();
    };
  }, []);

  return { hasUnread, loading };
};

/**
 * Hook pour gérer un thread spécifique (admin)
 */
export const useSupportThread = (threadId: string) => {
  const [thread, setThread] = useState<SupportThread | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let unsubscribeThread: Unsubscribe | null = null;
    let unsubscribeMessages: Unsubscribe | null = null;

    const loadThread = async () => {
      try {
        setLoading(true);

        // Récupérer le thread
        const threadData = await supportService.getThread(threadId);
        if (!threadData) {
          setError("Thread non trouvé");
          return;
        }

        setThread(threadData);

        // S'abonner aux changements du thread
        unsubscribeThread = supportService.subscribeToThread(
          threadId,
          (updatedThread) => {
            setThread(updatedThread);
          }
        );

        // S'abonner aux messages
        unsubscribeMessages = supportService.subscribeToMessages(
          threadId,
          (updatedMessages) => {
            setMessages(updatedMessages);
          }
        );

        // Marquer comme lu pour l'admin
        await supportService.markMessagesAsRead(threadId, "admin");
      } catch (err) {
        console.error("Erreur chargement thread:", err);
        setError("Erreur lors du chargement du thread");
      } finally {
        setLoading(false);
      }
    };

    loadThread();

    return () => {
      unsubscribeThread?.();
      unsubscribeMessages?.();
    };
  }, [threadId]);

  const sendMessage = useCallback(
    async (text: string, attachments?: string[]) => {
      if (!thread || sending) return;

      try {
        setSending(true);
        await supportService.sendMessage({
          threadId: thread.id,
          text,
          sender: "admin",
          attachments,
        });
      } catch (err) {
        console.error("Erreur envoi message:", err);
        throw err;
      } finally {
        setSending(false);
      }
    },
    [thread, sending]
  );

  const closeThread = useCallback(async () => {
    if (!thread) return;

    try {
      await supportService.closeThread(thread.id);
    } catch (err) {
      console.error("Erreur fermeture thread:", err);
      throw err;
    }
  }, [thread]);

  const reopenThread = useCallback(async () => {
    if (!thread) return;

    try {
      await supportService.reopenThread(thread.id);
    } catch (err) {
      console.error("Erreur réouverture thread:", err);
      throw err;
    }
  }, [thread]);

  return {
    thread,
    messages,
    loading,
    error,
    sending,
    sendMessage,
    closeThread,
    reopenThread,
  };
};
