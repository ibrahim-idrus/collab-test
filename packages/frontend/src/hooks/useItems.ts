import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { itemsApi, type Item } from "@/lib/api";

// ─── Query keys ───────────────────────────────────────────────────────────────

export const itemKeys = {
  all: ["items"] as const,
  detail: (id: string) => ["items", id] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useItems() {
  return useQuery({
    queryKey: itemKeys.all,
    queryFn: async () => {
      const res = await itemsApi.list();
      return res.data.data;
    },
  });
}

export function useItem(id: string) {
  return useQuery({
    queryKey: itemKeys.detail(id),
    queryFn: async () => {
      const res = await itemsApi.get(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { title: string; description?: string; authorId: string }) =>
      itemsApi.create(body).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.all });
    },
  });
}

export function useUpdateItem(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Pick<Item, "title" | "description">>) =>
      itemsApi.update(id, body).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.all });
      queryClient.invalidateQueries({ queryKey: itemKeys.detail(id) });
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => itemsApi.delete(id).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.all });
    },
  });
}

export function useUploadItemFile(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => itemsApi.uploadFile(id, file).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.detail(id) });
    },
  });
}
