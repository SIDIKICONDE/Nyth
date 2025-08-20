import { getApp } from "@react-native-firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  doc,
  getDoc,
  updateDoc,
  runTransaction,
  serverTimestamp,
} from "@react-native-firebase/firestore";
import { createLogger } from "../../../utils/optimizedLogger";
import { Team, TeamInvitation, TeamMember } from "./types";

const logger = createLogger("TeamsService");

export class TeamsService {
  /**
   * Créer une nouvelle équipe
   */
  async createTeam(
    teamData: Omit<
      Team,
      | "id"
      | "createdAt"
      | "updatedAt"
      | "members"
      | "invitations"
      | "projects"
      | "memberIds"
    >
  ): Promise<string> {
    try {
      const now = new Date().toISOString();
      const team: Omit<Team, "id"> = {
        ...teamData,
        members: [
          {
            userId: teamData.ownerId,
            role: "owner",
            permissions: [
              {
                resource: "events",
                actions: ["create", "read", "update", "delete"],
              },
              {
                resource: "goals",
                actions: ["create", "read", "update", "delete"],
              },
              {
                resource: "projects",
                actions: ["create", "read", "update", "delete"],
              },
              {
                resource: "members",
                actions: ["create", "read", "update", "delete"],
              },
              {
                resource: "settings",
                actions: ["create", "read", "update", "delete"],
              },
            ],
            joinedAt: now,
          },
        ],
        memberIds: [teamData.ownerId],
        invitations: [],
        projects: [],
        createdAt: now,
        updatedAt: now,
      };

      const db = getFirestore(getApp());
      const docRef = await addDoc(collection(db, "teams"), {
        ...team,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      logger.info("Équipe créée", { teamId: docRef.id });
      return docRef.id;
    } catch (error) {
      logger.error("Erreur lors de la création de l'équipe:", error);
      throw error;
    }
  }

  /**
   * Récupérer les équipes d'un utilisateur
   */
  async getUserTeams(userId: string): Promise<Team[]> {
    try {
      const db = getFirestore(getApp());
      const teamsCol = collection(db, "teams");
      // Charger d'abord le propriétaire (souvent 1-2 docs), plus rapide
      const byOwner = await getDocs(
        query(
          teamsCol,
          where("ownerId", "==", userId),
          orderBy("createdAt", "desc"),
          limit(20)
        )
      );

      // Requête principale par appartenance
      const byMember = await getDocs(
        query(
          teamsCol,
          where("memberIds", "array-contains", userId),
          orderBy("createdAt", "desc"),
          limit(20)
        )
      );

      if (byMember.docs.length === 0 && byOwner.docs.length === 0) {
        return [] as Team[];
      }
      const merged: Record<string, Team> = {};
      const normalize = (v: unknown): string => {
        if (
          v !== null &&
          typeof v === "object" &&
          "toDate" in (v as { toDate: () => Date }) &&
          typeof (v as { toDate: () => Date }).toDate === "function"
        ) {
          return (v as { toDate: () => Date }).toDate().toISOString();
        }
        if (v instanceof Date) {
          return v.toISOString();
        }
        if (typeof v === "string") {
          return v;
        }
        return new Date(0).toISOString();
      };

      for (const snap of [...byOwner.docs, ...byMember.docs]) {
        const d = snap.data() as Record<string, unknown>;
        const { id: _id, createdAt: ca, updatedAt: ua, ...rest } = d;
        const createdAt = normalize(ca);
        const updatedAt = normalize(ua);
        merged[snap.id] = {
          ...(rest as unknown as Omit<Team, "id" | "createdAt" | "updatedAt">),
          id: snap.id,
          createdAt,
          updatedAt,
        };
      }
      return Object.values(merged).sort((a, b) => {
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      });
    } catch (error) {
      logger.error("Erreur récupération équipes", error);
      throw error;
    }
  }

  /**
   * Récupérer une équipe par ID
   */
  async getTeamById(teamId: string): Promise<Team | null> {
    try {
      const db = getFirestore(getApp());
      const teamSnap = await getDoc(doc(collection(db, "teams"), teamId));

      if (!teamSnap.exists) {
        return null;
      }

      const data = teamSnap.data() as Record<string, unknown>;
      const toIso = (v: unknown): string => {
        if (
          v !== null &&
          typeof v === "object" &&
          "toDate" in (v as { toDate: () => Date }) &&
          typeof (v as { toDate: () => Date }).toDate === "function"
        ) {
          return (v as { toDate: () => Date }).toDate().toISOString();
        }
        if (v instanceof Date) {
          return v.toISOString();
        }
        if (typeof v === "string") {
          return v;
        }
        return new Date(0).toISOString();
      };

      const { id: _id, createdAt: ca, updatedAt: ua, ...rest } = data;
      return {
        ...(rest as unknown as Omit<Team, "id" | "createdAt" | "updatedAt">),
        id: teamSnap.id,
        createdAt: toIso(ca),
        updatedAt: toIso(ua),
      };
    } catch (error) {
      logger.error("Erreur récupération équipe", error);
      throw error;
    }
  }

  /**
   * Mettre à jour une équipe
   */
  async updateTeam(teamId: string, updates: Partial<Team>): Promise<void> {
    try {
      const db = getFirestore(getApp());
      await updateDoc(doc(collection(db, "teams"), teamId), {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      logger.info("Équipe mise à jour", { teamId });
    } catch (error) {
      logger.error("Erreur mise à jour équipe", error);
      throw error;
    }
  }

  /**
   * Ajouter un membre à une équipe
   */
  async addTeamMember(teamId: string, member: TeamMember): Promise<void> {
    try {
      const db = getFirestore(getApp());
      const teamRef = doc(collection(db, "teams"), teamId);

      await runTransaction(db, async (transaction) => {
        const teamDoc = await transaction.get(teamRef);

        if (!teamDoc.exists) {
          throw new Error("Équipe non trouvée");
        }

        const team = teamDoc.data() as Team & { memberIds?: string[] };
        const updatedMembers = [...team.members, member];
        const currentMemberIds = Array.isArray(team.memberIds)
          ? team.memberIds
          : team.members.map((m) => m.userId);
        const updatedMemberIds = currentMemberIds.includes(member.userId)
          ? currentMemberIds
          : [...currentMemberIds, member.userId];

        transaction.update(teamRef, {
          members: updatedMembers,
          memberIds: updatedMemberIds,
          updatedAt: serverTimestamp(),
        });
      });

      logger.info("Membre ajouté à l'équipe", {
        teamId,
        userId: member.userId,
      });
    } catch (error) {
      logger.error("Erreur ajout membre équipe", error);
      throw error;
    }
  }

  /**
   * Supprimer un membre d'une équipe
   */
  async removeTeamMember(teamId: string, userId: string): Promise<void> {
    try {
      const db = getFirestore(getApp());
      const teamRef = doc(collection(db, "teams"), teamId);

      await runTransaction(db, async (transaction) => {
        const teamDoc = await transaction.get(teamRef);

        if (!teamDoc.exists) {
          throw new Error("Équipe non trouvée");
        }

        const team = teamDoc.data() as Team & { memberIds?: string[] };
        const updatedMembers = team.members.filter((m) => m.userId !== userId);
        const currentMemberIds = Array.isArray(team.memberIds)
          ? team.memberIds
          : team.members.map((m) => m.userId);
        const updatedMemberIds = currentMemberIds.filter((id) => id !== userId);

        transaction.update(teamRef, {
          members: updatedMembers,
          memberIds: updatedMemberIds,
          updatedAt: serverTimestamp(),
        });
      });

      logger.info("Membre retiré de l'équipe", { teamId, userId });
    } catch (error) {
      logger.error("Erreur suppression membre équipe", error);
      throw error;
    }
  }
}

export const teamsService = new TeamsService();
