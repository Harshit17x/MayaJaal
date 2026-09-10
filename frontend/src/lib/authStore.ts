"use client";

import { useState, useEffect, useCallback } from "react";

export interface OperatorUser {
  id: string;
  name: string;
  rank: string;
  badgeNumber: string;
  sector: string;
  role: "Shift Commander" | "Tactical Operator" | "Intelligence Analyst";
  clearanceLevel: string;
  serviceBranch: string;
  avatarInitials: string;
  authenticatedAt: string;
}

export const DEMO_OPERATORS: OperatorUser[] = [
  {
    id: "op-rathore",
    name: "Insp. K. Rathore",
    rank: "Inspector / General Duty",
    badgeNumber: "BSF-9482-KR",
    sector: "Sector-04 (BOP Alpha)",
    role: "Shift Commander",
    clearanceLevel: "Level 4 (Top Secret / Restricted)",
    serviceBranch: "Border Security Force (BSF)",
    avatarInitials: "KR",
    authenticatedAt: "2026-09-09T08:00:00Z",
  },
  {
    id: "op-sharma",
    name: "Sub-Insp. A. Sharma",
    rank: "Sub-Inspector / Surveillance",
    badgeNumber: "ITBP-4108-AS",
    sector: "Sector-05 (Sikkim Northern LAC)",
    role: "Tactical Operator",
    clearanceLevel: "Level 3 (Tactical Secret)",
    serviceBranch: "Indo-Tibetan Border Police (ITBP)",
    avatarInitials: "AS",
    authenticatedAt: "2026-09-09T08:30:00Z",
  },
  {
    id: "op-verma",
    name: "Capt. R. Verma",
    rank: "Operations Officer",
    badgeNumber: "RAW-7721-RV",
    sector: "Sector-01 (Punjab Western IB)",
    role: "Intelligence Analyst",
    clearanceLevel: "Level 4 (Quantum Grid Crypt)",
    serviceBranch: "Integrated Border Command (IBC)",
    avatarInitials: "RV",
    authenticatedAt: "2026-09-09T09:00:00Z",
  },
];

const AUTH_STORAGE_KEY = "maatrix_operator_session_v1";
const LEGACY_AUTH_STORAGE_KEY = "mayajaal_operator_session_v1";

export function getStoredOperator(): OperatorUser | null {
  if (typeof window === "undefined") return null;
  try {
    let raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      // Migrate from legacy session key if available
      raw = localStorage.getItem(LEGACY_AUTH_STORAGE_KEY);
      if (raw) {
        localStorage.setItem(AUTH_STORAGE_KEY, raw);
      }
    }
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function useAuth() {
  const [operator, setOperator] = useState<OperatorUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync state from localStorage on mount & storage events
  useEffect(() => {
    const syncState = () => {
      const stored = getStoredOperator();
      setOperator(stored);
      setIsLoading(false);
    };

    syncState();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === AUTH_STORAGE_KEY) {
        syncState();
      }
    };

    const handleCustomAuthChange = () => {
      syncState();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("maatrix_auth_change", handleCustomAuthChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("maatrix_auth_change", handleCustomAuthChange);
    };
  }, []);

  const login = useCallback((user: OperatorUser) => {
    const sessionUser = {
      ...user,
      authenticatedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionUser));
      setOperator(sessionUser);
      window.dispatchEvent(new Event("maatrix_auth_change"));
    } catch (e) {
      console.error("Failed to store auth session:", e);
    }
  }, []);

  const quickLogin = useCallback((demoId: string) => {
    const match = DEMO_OPERATORS.find((o) => o.id === demoId) || DEMO_OPERATORS[0];
    login(match);
    return match;
  }, [login]);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      setOperator(null);
      window.dispatchEvent(new Event("maatrix_auth_change"));
    } catch (e) {
      console.error("Failed to clear auth session:", e);
    }
  }, []);

  return {
    operator,
    isAuthenticated: Boolean(operator),
    isLoading,
    login,
    quickLogin,
    logout,
  };
}
