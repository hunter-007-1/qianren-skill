import useSWR from "swr";

interface User {
  id: string;
  email: string;
  nickname: string | null;
  avatarUrl: string | null;
  isAdmin?: boolean;
}

const fetcher = (url: string) =>
  fetch(url).then((r) => (r.ok ? r.json() : null));

export function useUser() {
  return useSWR<User | null>("/api/auth/me", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });
}
