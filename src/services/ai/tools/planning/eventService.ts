import { getApp } from "@react-native-firebase/app";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  Timestamp,
  serverTimestamp,
} from "@react-native-firebase/firestore";

import { processDate } from "./dateUtils";
import {
  determineEventPriority,
  determineEventType,
  generateEventTags,
} from "./eventAnalyzer";
import { t } from "./messages";
import { CreateEventArgs, DeleteEventArgs, UpdateEventArgs } from "./types";

/**
 * Recherche un événement selon les critères donnés
 */
export const searchEvent = async (searchCriteria: string, userId: string) => {
  try {
    // Recherche par titre (contient le critère)
    const db = getFirestore(getApp());
    const titleQuery = query(
      collection(db, "planningEvents"),
      where("userId", "==", userId),
      orderBy("startDate", "desc"),
      limit(10)
    );
    const titleSnapshot = await getDocs(titleQuery);

    const events = titleSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...(doc.data() as {
        title?: string;
        description?: string;
        location?: string;
        startDate: any;
        endDate: any;
        userId: string;
        createdAt: any;
        updatedAt: any;
      }),
    }));

    // Filtrage côté client pour une recherche plus flexible
    const searchLower = searchCriteria.toLowerCase();
    const matchingEvents = events.filter((event: any) => {
      const titleMatch = event.title?.toLowerCase().includes(searchLower);
      const descriptionMatch = event.description
        ?.toLowerCase()
        .includes(searchLower);
      const locationMatch = event.location?.toLowerCase().includes(searchLower);

      return titleMatch || descriptionMatch || locationMatch;
    });

    return matchingEvents.length > 0 ? matchingEvents[0] : null;
  } catch (error) {
    return null;
  }
};

/**
 * Crée un nouvel événement dans Firestore
 */
export const processCreateEvent = async (
  args: CreateEventArgs,
  userId: string,
  lang: string = "fr"
): Promise<{ success: boolean; message: string; eventId?: string }> => {
  try {
    // Traiter les dates avec validation intelligente
    const startDate = processDate(args.startDate);
    let endDate = processDate(args.endDate);

    // S'assurer que la date de fin n'est pas antérieure à la date de début
    if (endDate < startDate) {
      // Si endDate est avant startDate, créer une nouvelle date 1 heure après startDate
      endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // +1 heure
    }

    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);

    // Utiliser les valeurs fournies par l'IA en priorité, sinon détection automatique
    const eventType =
      args.type || determineEventType(args.title, args.description);
    const eventPriority =
      args.priority || determineEventPriority(args.title, args.description);
    const eventTags =
      args.tags && args.tags.length > 0
        ? args.tags
        : generateEventTags(args.title, eventType, args.description);

    const eventData = {
      title: args.title,
      startDate: startTimestamp,
      endDate: endTimestamp,
      location: args.location || "",
      description: args.description || "",
      type: eventType,
      status: "planned",
      priority: eventPriority,
      tags: eventTags,
      reminders: [],
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const db = getFirestore(getApp());
    const docRef = await addDoc(collection(db, "planningEvents"), {
      ...eventData,
      startDate: startTimestamp,
      endDate: endTimestamp,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return {
      success: true,
      message: t("EVENT_CREATED", lang, { title: args.title }),
      eventId: docRef.id,
    };
  } catch (error) {
    return {
      success: false,
      message: t("ERROR_GENERIC", lang),
    };
  }
};

/**
 * Modifie un événement existant
 */
export const processUpdateEvent = async (
  args: UpdateEventArgs,
  userId: string,
  lang: string = "fr"
): Promise<{ success: boolean; message: string }> => {
  try {
    // Rechercher l'événement
    const event = await searchEvent(args.searchCriteria, userId);

    if (!event) {
      return {
        success: false,
        message: t("EVENT_NOT_FOUND", lang, {
          criteria: args.searchCriteria,
        }),
      };
    }

    // Préparer les mises à jour
    const updates: any = {
      updatedAt: Timestamp.now(),
    };

    if (args.updates.title) updates.title = args.updates.title;
    if (args.updates.startDate) {
      const processedStartDate = processDate(args.updates.startDate);
      updates.startDate = Timestamp.fromDate(processedStartDate);
    }
    if (args.updates.endDate) {
      const processedEndDate = processDate(args.updates.endDate);
      updates.endDate = Timestamp.fromDate(processedEndDate);
    }
    if (args.updates.location !== undefined)
      updates.location = args.updates.location;
    if (args.updates.description !== undefined)
      updates.description = args.updates.description;

    // Mettre à jour l'événement
    const db = getFirestore(getApp());
    await updateDoc(
      doc(collection(db, "planningEvents"), event.id),
      updates as any
    );

    return {
      success: true,
      message: t("EVENT_UPDATED", lang, { title: String(event.title) }),
    };
  } catch (error) {
    return {
      success: false,
      message: t("ERROR_GENERIC", lang),
    };
  }
};

/**
 * Supprime un événement existant
 */
export const processDeleteEvent = async (
  args: DeleteEventArgs,
  userId: string,
  lang: string = "fr"
): Promise<{ success: boolean; message: string }> => {
  try {
    // Rechercher l'événement
    const event = await searchEvent(args.searchCriteria, userId);

    if (!event) {
      return {
        success: false,
        message: t("EVENT_NOT_FOUND", lang, {
          criteria: args.searchCriteria,
        }),
      };
    }

    // Supprimer l'événement
    const db = getFirestore(getApp());
    await deleteDoc(doc(collection(db, "planningEvents"), event.id));

    return {
      success: true,
      message: t("EVENT_DELETED", lang, { title: String(event.title) }),
    };
  } catch (error) {
    return {
      success: false,
      message: t("ERROR_GENERIC", lang),
    };
  }
};
