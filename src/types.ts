export type User = {
  id: number;
  name: string;
  email: string;
  role?: "ADMIN" | "AGENT" | "EMPLOYEE";
};

export type TicketStatus = "OPEN" | "IN_PROGRESS" | "CLOSED";
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH";

export type Ticket = {
  id: number;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
  createdById: number;
  assignedToId: number | null;
  createdBy?: User;
  assignedTo?: User | null;
};

export type CreateTaskInput = {
  title: string;
  description: string;
  createdById: number;
  assignedToId?: number | null;
  status?: TicketStatus;
  priority?: TicketPriority;
};

export type UpdateTaskInput = {
  title?: string;
  description?: string | null;
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedToId?: number | null;
};

export type TicketFormValues = {
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdById: number;
  assignedToId: number | null;
};
