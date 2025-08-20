import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { planningService } from "../services/firebase/planning";
import { Team, TeamSettings, WorkingHours } from "../types/planning";

interface UseTeamsReturn {
  teams: Team[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createQuickTeam: (name?: string, description?: string) => Promise<string>;
}

const buildDefaultWorkingHours = (): WorkingHours => ({
  monday: {
    isWorkingDay: true,
    startTime: "09:00",
    endTime: "17:00",
    breaks: [],
  },
  tuesday: {
    isWorkingDay: true,
    startTime: "09:00",
    endTime: "17:00",
    breaks: [],
  },
  wednesday: {
    isWorkingDay: true,
    startTime: "09:00",
    endTime: "17:00",
    breaks: [],
  },
  thursday: {
    isWorkingDay: true,
    startTime: "09:00",
    endTime: "17:00",
    breaks: [],
  },
  friday: {
    isWorkingDay: true,
    startTime: "09:00",
    endTime: "17:00",
    breaks: [],
  },
  saturday: {
    isWorkingDay: false,
    startTime: "09:00",
    endTime: "17:00",
    breaks: [],
  },
  sunday: {
    isWorkingDay: false,
    startTime: "09:00",
    endTime: "17:00",
    breaks: [],
  },
});

const buildDefaultSettings = (): TeamSettings => ({
  visibility: "private",
  allowMemberInvites: true,
  requireApprovalForEvents: false,
  defaultEventReminders: [],
  workingHours: buildDefaultWorkingHours(),
  timezone: "UTC",
});

export const useTeams = (): UseTeamsReturn => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState<boolean>(false);

  const load = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    setError(null);
    try {
      const data = await planningService.getUserTeams(user.uid);
      setTeams(data);
    } catch (e) {
      setError("Impossible de charger les équipes");
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  const createQuickTeam = useCallback(
    async (name?: string, description?: string): Promise<string> => {
      if (!user?.uid) throw new Error("Utilisateur non authentifié");
      const teamId = await planningService.createTeam({
        name: name || "Nouvelle équipe",
        description: description || "",
        ownerId: user.uid,
        settings: buildDefaultSettings(),
      } as Omit<Team, "id" | "createdAt" | "updatedAt" | "members" | "invitations" | "projects" | "memberIds">);
      await load();
      return teamId;
    },
    [user?.uid, load]
  );

  useEffect(() => {
    if (!hasLoadedOnce) {
      void load();
      setHasLoadedOnce(true);
    }
  }, [load, hasLoadedOnce]);

  return { teams, loading, error, refresh: load, createQuickTeam };
};
