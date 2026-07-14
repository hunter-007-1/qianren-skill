import useSWR from "swr";

export type AdminUser = {
  id: string;
  email: string;
  nickname: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
};

const fetcher = (url: string) =>
  fetch(url).then((r) => (r.ok ? r.json() : null));

export function useAdminUser() {
  return useSWR<AdminUser | null>("/api/admin/me", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });
}
