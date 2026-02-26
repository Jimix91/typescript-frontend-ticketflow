import { Comment, CreateCommentInput, CreateTaskInput, Ticket, UpdateTaskInput, User } from "./types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5005/api";
let authToken: string | null = null;

type AuthResponse = {
  token: string;
  user: User;
};

export const setApiToken = (token: string | null) => {
  authToken = token;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };

  const tokenFromStorage = localStorage.getItem("ticketflow-token");
  const token = authToken ?? tokenFromStorage;

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    headers,
    ...init,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(payload.message ?? "Request failed");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  login: (data: { email: string; password: string }) =>
    request<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  register: (data: { name: string; email: string; password: string; role?: User["role"] }) =>
    request<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  me: () => request<User>("/auth/me"),
  getUsers: () => request<User[]>("/users"),
  updateMyProfile: (data: { name?: string; profileImageUrl?: string | null }) =>
    request<User>("/users/me", { method: "PATCH", body: JSON.stringify(data) }),
  createUser: (data: { name: string; email: string; password: string; role?: User["role"] }) =>
    request<User>("/users", { method: "POST", body: JSON.stringify(data) }),
  getTasks: () => request<Ticket[]>("/tickets"),
  getTaskById: (taskId: number) => request<Ticket>(`/tickets/${taskId}`),
  createTask: (data: CreateTaskInput) =>
    request<Ticket>("/tickets", { method: "POST", body: JSON.stringify(data) }),
  updateTask: (taskId: number, data: UpdateTaskInput) =>
    request<Ticket>(`/tickets/${taskId}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteTask: (taskId: number) =>
    request<void>(`/tickets/${taskId}`, { method: "DELETE" }),
  getTaskComments: (taskId: number) => request<Comment[]>(`/tickets/${taskId}/comments`),
  createTaskComment: (taskId: number, data: CreateCommentInput) =>
    request<Comment>(`/tickets/${taskId}/comments`, { method: "POST", body: JSON.stringify(data) }),
};
