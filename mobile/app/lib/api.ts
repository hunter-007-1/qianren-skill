import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE = "https://qianren-skill.up.railway.app";
const SESSION_KEY = "qianren-session";

export async function getSession(): Promise<string | null> {
  return AsyncStorage.getItem(SESSION_KEY);
}

export async function setSession(token: string): Promise<void> {
  await AsyncStorage.setItem(SESSION_KEY, token);
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_KEY);
}

export async function apiFetch(
  endpoint: string,
  options?: RequestInit & { skipAuth?: boolean }
): Promise<Response> {
  const token = await getSession();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };

  if (!options?.skipAuth && token) {
    headers.Cookie = `${SESSION_KEY}=${token}`;
  }

  return fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });
}

export async function apiGet(endpoint: string, skipAuth?: boolean) {
  return apiFetch(endpoint, { method: "GET", skipAuth });
}

export async function apiPost(endpoint: string, body?: unknown, skipAuth?: boolean) {
  return apiFetch(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
    skipAuth,
  });
}

export async function apiDelete(endpoint: string, skipAuth?: boolean) {
  return apiFetch(endpoint, { method: "DELETE", skipAuth });
}