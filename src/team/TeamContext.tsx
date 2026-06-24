import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { userClient } from "../lib/clients";
import { getItem, setItem, SELECTED_TEAM_KEY } from "../lib/transport";
import { useAuth } from "../auth/AuthContext";
import type { TeamAccessItem } from "../gen/user_iface/v2/v2_user_pb";

interface TeamState {
  teams: TeamAccessItem[];
  currentTeam: TeamAccessItem | null;
  selectTeam: (teamId: bigint) => void;
  loading: boolean;
  noAccess: boolean;
}

const TeamCtx = createContext<TeamState | null>(null);

function safeBigInt(v: string): bigint | null {
  try {
    return BigInt(v);
  } catch {
    return null;
  }
}

export function TeamProvider({ children }: { children: ReactNode }) {
  const { token, userId } = useAuth();
  const [teams, setTeams] = useState<TeamAccessItem[]>([]);
  const [selectedId, setSelectedId] = useState<bigint | null>(null);
  const [loading, setLoading] = useState(false);

  // Load the user's teams whenever they sign in; clear when they sign out.
  useEffect(() => {
    if (!token || userId === null) {
      setTeams([]);
      setSelectedId(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    userClient
      .teamAccessList({ userId })
      .then((res) => {
        if (cancelled) return;
        const list = res.access;
        setTeams(list);
        // Keep the stored selection if it's still valid, else default to the first team.
        const stored = getItem(SELECTED_TEAM_KEY);
        const storedId = stored ? safeBigInt(stored) : null;
        const match = storedId != null && list.some((t) => t.teamId === storedId);
        const next = match ? storedId : (list[0]?.teamId ?? null);
        setSelectedId(next);
        if (next != null) setItem(SELECTED_TEAM_KEY, next.toString(), true);
      })
      .catch(() => {
        if (!cancelled) setTeams([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token, userId]);

  const selectTeam = (teamId: bigint) => {
    setSelectedId(teamId);
    setItem(SELECTED_TEAM_KEY, teamId.toString(), true);
  };

  const currentTeam = teams.find((t) => t.teamId === selectedId) ?? null;
  const noAccess = !loading && !!token && teams.length === 0;

  return (
    <TeamCtx.Provider value={{ teams, currentTeam, selectTeam, loading, noAccess }}>
      {children}
    </TeamCtx.Provider>
  );
}

export function useTeam(): TeamState {
  const ctx = useContext(TeamCtx);
  if (!ctx) throw new Error("useTeam must be used within TeamProvider");
  return ctx;
}
