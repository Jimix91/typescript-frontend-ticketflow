export type User = {
  id: string;
  name: string;
  email: string;
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  dueDate: string | null;
  userId: string;
};

export type CreateTaskInput = {
  title: string;
  description?: string;
  dueDate?: string;
  userId: string;
};

export type UpdateTaskInput = {
  title?: string;
  description?: string | null;
  completed?: boolean;
  dueDate?: string | null;
};
