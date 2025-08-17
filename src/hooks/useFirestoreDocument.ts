import { useState, useCallback } from "react";
import { getApp } from "@react-native-firebase/app";
import {
  getFirestore,
  collection as buildCollection,
  doc as buildDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch,
} from "@react-native-firebase/firestore";

import { useTranslation } from "./useTranslation";
import { Alert } from "react-native";

interface FirestoreDocumentOptions {
  collection: string;
  showErrorAlerts?: boolean;
}

interface DocumentData {
  [key: string]: any;
}

interface CreateOptions {
  readOnly?: boolean;
  customId?: string;
}

interface UpdateOptions {
  merge?: boolean;
}

export const useFirestoreDocument = ({
  collection,
  showErrorAlerts = true,
}: FirestoreDocumentOptions) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const showError = useCallback(
    (title: string, message: string) => {
      if (showErrorAlerts) {
        Alert.alert(title, message);
      }
    },
    [showErrorAlerts]
  );

  const getErrorMessage = useCallback(
    (error: any): string => {
      if (error.code) {
        switch (error.code) {
          case "firestore/permission-denied":
            return t(
              "firestore.errors.permissionDenied",
              "Permissions insuffisantes"
            );
          case "firestore/not-found":
            return t("firestore.errors.notFound", "Document non trouvé");
          case "firestore/already-exists":
            return t(
              "firestore.errors.alreadyExists",
              "Le document existe déjà"
            );
          case "firestore/resource-exhausted":
            return t("firestore.errors.quotaExceeded", "Quota dépassé");
          case "firestore/failed-precondition":
            return t(
              "firestore.errors.failedPrecondition",
              "Condition préalable échouée"
            );
          case "firestore/aborted":
            return t("firestore.errors.aborted", "Opération annulée");
          case "firestore/unavailable":
            return t(
              "firestore.errors.unavailable",
              "Service temporairement indisponible"
            );
          case "firestore/internal":
            return t("firestore.errors.internal", "Erreur interne du serveur");
          default:
            return (
              error.message || t("firestore.errors.unknown", "Erreur inconnue")
            );
        }
      }
      return error.message || t("firestore.errors.unknown", "Erreur inconnue");
    },
    [t]
  );

  const createDocument = useCallback(
    async (
      documentId: string,
      data: DocumentData,
      options?: CreateOptions
    ): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const db = getFirestore(getApp());
        const docRef = buildDoc(buildCollection(db, collection), documentId);
        const documentData = {
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          ...(options?.readOnly && { readOnly: true }),
        };

        await setDoc(docRef, documentData);
        return true;
      } catch (err) {
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        showError(
          t("firestore.errors.createTitle", "Erreur de création"),
          errorMessage
        );
        return false;
      } finally {
        setLoading(false);
      }
    },
    [collection, getErrorMessage, showError, t]
  );

  const updateDocument = useCallback(
    async (
      documentId: string,
      data: Partial<DocumentData>,
      options?: UpdateOptions
    ): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const db = getFirestore(getApp());
        const docRef = buildDoc(buildCollection(db, collection), documentId);
        const updateData = {
          ...data,
          updatedAt: serverTimestamp(),
        };

        if (options?.merge) {
          await setDoc(docRef, updateData, { merge: true });
        } else {
          await updateDoc(docRef, updateData);
        }

        return true;
      } catch (err) {
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        showError(
          t("firestore.errors.updateTitle", "Erreur de mise à jour"),
          errorMessage
        );
        return false;
      } finally {
        setLoading(false);
      }
    },
    [collection, getErrorMessage, showError, t]
  );

  const deleteDocument = useCallback(
    async (documentId: string): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const db = getFirestore(getApp());
        const docRef = buildDoc(buildCollection(db, collection), documentId);
        await deleteDoc(docRef);
        return true;
      } catch (err) {
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        showError(
          t("firestore.errors.deleteTitle", "Erreur de suppression"),
          errorMessage
        );
        return false;
      } finally {
        setLoading(false);
      }
    },
    [collection, getErrorMessage, showError, t]
  );

  const batchOperation = useCallback(
    async (
      operations: Array<{
        type: "create" | "update" | "delete";
        documentId: string;
        data?: DocumentData;
      }>
    ): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const db = getFirestore(getApp());
        const batch = writeBatch(db);

        operations.forEach(({ type, documentId, data }) => {
          const docRef = buildDoc(buildCollection(db, collection), documentId);

          switch (type) {
            case "create":
              if (data) {
                const createData = {
                  ...data,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                };
                batch.set(docRef, createData);
              }
              break;
            case "update":
              if (data) {
                const updateData = {
                  ...data,
                  updatedAt: serverTimestamp(),
                };
                batch.update(docRef, updateData);
              }
              break;
            case "delete":
              batch.delete(docRef);
              break;
          }
        });

        await batch.commit();
        return true;
      } catch (err) {
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        showError(
          t("firestore.errors.batchTitle", "Erreur d'opération groupée"),
          errorMessage
        );
        return false;
      } finally {
        setLoading(false);
      }
    },
    [collection, getErrorMessage, showError, t]
  );

  return {
    loading,
    error,
    createDocument,
    updateDocument,
    deleteDocument,
    batchOperation,
    setError,
  };
};
