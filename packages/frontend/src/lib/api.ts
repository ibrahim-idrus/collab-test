/**
 * Axios-based API client pre-configured to talk to the Hono backend.
 * The Vite dev-server proxies /api → http://localhost:8787 so no
 * base-URL change is needed between dev and prod.
 */
import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// ─── Typed helpers ────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Item {
  id: string;
  title: string;
  description?: string;
  storageKey?: string;
  authorId: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  author?: User;
}

// ─── Users ───────────────────────────────────────────────────────────────────

export const usersApi = {
  list: () => api.get<{ data: User[] }>("/users"),
  get: (id: string) => api.get<{ data: User & { items: Item[] } }>(`/users/${id}`),
  create: (body: { email: string; name: string; avatarUrl?: string }) =>
    api.post<{ data: User }>("/users", body),
  update: (id: string, body: Partial<Pick<User, "name" | "avatarUrl" | "isActive">>) =>
    api.patch<{ data: User }>(`/users/${id}`, body),
  delete: (id: string) => api.delete<{ data: User }>(`/users/${id}`),
};

// ─── Items ────────────────────────────────────────────────────────────────────

export const itemsApi = {
  list: () => api.get<{ data: Item[] }>("/items"),
  get: (id: string) => api.get<{ data: Item }>(`/items/${id}`),
  create: (body: { title: string; description?: string; authorId: string }) =>
    api.post<{ data: Item }>("/items", body),
  update: (id: string, body: Partial<Pick<Item, "title" | "description">>) =>
    api.patch<{ data: Item }>(`/items/${id}`, body),
  delete: (id: string) => api.delete<{ data: { id: string } }>(`/items/${id}`),
  uploadFile: (id: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post<{ data: Item }>(`/items/${id}/upload`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};
