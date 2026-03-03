export type User = {
  id: number;
  name: string;
  email: string;
  role?: "ADMIN" | "AGENT" | "EMPLOYEE";
  profileImageUrl?: string | null;
};

export type TicketStatus = "OPEN" | "IN_PROGRESS" | "CLOSED";
export type InProgressSubStatus = "PENDING_AGENT" | "PENDING_EMPLOYEE";
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH";

export type Ticket = {
  id: number;
  title: string;
  description: string;
  imageUrl?: string | null;
  status: TicketStatus;
  inProgressSubStatus: InProgressSubStatus | null;
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
  imageUrl?: string | null;
  assignedToId?: number | null;
  status?: TicketStatus;
  inProgressSubStatus?: InProgressSubStatus | null;
  priority?: TicketPriority;
};

export type UpdateTaskInput = {
  title?: string;
  description?: string | null;
  imageUrl?: string | null;
  status?: TicketStatus;
  inProgressSubStatus?: InProgressSubStatus | null;
  priority?: TicketPriority;
  assignedToId?: number | null;
};

export type Comment = {
  id: number;
  content: string;
  imageUrl?: string | null;
  ticketId: number;
  authorId: number;
  createdAt: string;
  author: User;
};

export type CreateCommentInput = {
  content: string;
  imageUrl?: string | null;
};

export type UpdateCommentInput = {
  content: string;
};

export type TicketFormValues = {
  title: string;
  description: string;
  imageUrl?: string | null;
  status: TicketStatus;
  inProgressSubStatus: InProgressSubStatus | null;
  priority: TicketPriority;
  assignedToId: number | null;
};
