import { create } from "zustand";
import { apiGet, setSession, clearSession } from "./api";

export interface User {
  id: string;
  email: string;
  nickname: string | null;
  isAdmin?: boolean;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, nickname?: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  login: async (email: string, password: string) => {
    const res = await fetch("https://qianren-skill.up.railway.app/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const setCookie = res.headers.get("set-cookie");
    const token = setCookie?.match(/qianren-session=([^;]+)/)?.[1];

    if (!token) {
      const data = await res.json();
      throw new Error(data.error || "登录失败");
    }

    await setSession(token);
    await checkAuthInternal(set);
  },

  register: async (email: string, password: string, nickname?: string) => {
    const res = await fetch("https://qianren-skill.up.railway.app/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, nickname }),
    });

    const setCookie = res.headers.get("set-cookie");
    const token = setCookie?.match(/qianren-session=([^;]+)/)?.[1];

    if (!token) {
      const data = await res.json();
      throw new Error(data.error || "注册失败");
    }

    await setSession(token);
    await checkAuthInternal(set);
  },

  logout: async () => {
    await fetch("https://qianren-skill.up.railway.app/api/auth/logout", {
      method: "POST",
    });
    await clearSession();
    set({ user: null });
  },

  checkAuth: async () => {
    await checkAuthInternal(set);
  },
}));

async function checkAuthInternal(set: any) {
  try {
    const res = await apiGet("/api/auth/me");
    if (res.ok) {
      const user = await res.json();
      set({ user, loading: false });
    } else {
      set({ user: null, loading: false });
    }
  } catch {
    set({ user: null, loading: false });
  }
}