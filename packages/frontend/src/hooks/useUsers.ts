import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi, type User } from "@/lib/api";

// ─── Query keys ───────────────────────────────────────────────────────────────

export const userKeys = {
  all: ["users"] as const,
  detail: (id: string) => ["users", id] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useUsers() {
  return useQuery({
    queryKey: userKeys.all,
    queryFn: async () => {
      const res = await usersApi.list();
      return res.data.data;
    },
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: async () => {
      const res = await usersApi.get(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { email: string; name: string; avatarUrl?: string }) =>
      usersApi.create(body).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

export function useUpdateUser(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Pick<User, "name" | "avatarUrl" | "isActive">>) =>
      usersApi.update(id, body).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.delete(id).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}
