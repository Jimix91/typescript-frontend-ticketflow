import { CreateTaskInput, Ticket, UpdateTaskInput, User } from "./types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5005/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
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
  getUsers: () => request<User[]>("/users"),
  createUser: (data: Pick<User, "name" | "email">) =>
    request<User>("/users", { method: "POST", body: JSON.stringify(data) }),
  getTasks: () => request<Ticket[]>("/tickets"),
  createTask: (data: CreateTaskInput) =>
    request<Ticket>("/tickets", { method: "POST", body: JSON.stringify(data) }),
  updateTask: (taskId: number, data: UpdateTaskInput) =>
    request<Ticket>(`/tickets/${taskId}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteTask: (taskId: number) =>
    request<void>(`/tickets/${taskId}`, { method: "DELETE" }),
};
