import { FormEvent, useState } from "react";
import { Ticket, TicketFormValues, TicketPriority, TicketStatus, User } from "../types";

type Props = {
  users: User[];
  initialTicket?: Ticket;
  onSubmit: (values: TicketFormValues) => Promise<void> | void;
  onCancel: () => void;
};

export function TicketForm({ users, initialTicket, onSubmit, onCancel }: Props) {
  const firstUserId = users[0]?.id ?? 0;

  const [title, setTitle] = useState(initialTicket?.title ?? "");
  const [description, setDescription] = useState(initialTicket?.description ?? "");
  const [status, setStatus] = useState<TicketStatus>(initialTicket?.status ?? "OPEN");
  const [priority, setPriority] = useState<TicketPriority>(initialTicket?.priority ?? "MEDIUM");
  const [createdById, setCreatedById] = useState<number>(initialTicket?.createdById ?? firstUserId);
  const [assignedToId, setAssignedToId] = useState<number | null>(initialTicket?.assignedToId ?? null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !description.trim() || !createdById) {
      return;
    }

    await onSubmit({
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      createdById,
      assignedToId,
    });
  };

  return (
    <section className="card">
      <form onSubmit={handleSubmit} className="grid-form">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Ticket title"
        />

        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Ticket description"
          rows={4}
        />

        <select value={status} onChange={(event) => setStatus(event.target.value as TicketStatus)}>
          <option value="OPEN">OPEN</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="CLOSED">CLOSED</option>
        </select>

        <select value={priority} onChange={(event) => setPriority(event.target.value as TicketPriority)}>
          <option value="LOW">LOW</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="HIGH">HIGH</option>
        </select>

        <select
          value={createdById}
          onChange={(event) => setCreatedById(Number(event.target.value))}
          disabled={Boolean(initialTicket)}
        >
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.email})
            </option>
          ))}
        </select>

        <select
          value={assignedToId ?? ""}
          onChange={(event) => setAssignedToId(event.target.value ? Number(event.target.value) : null)}
        >
          <option value="">Unassigned</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.email})
            </option>
          ))}
        </select>

        <div className="actions">
          <button type="submit">Save Ticket</button>
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
