import { Ticket, User } from "../types";
import { StatusBadge } from "./StatusBadge";

type Props = {
  ticket: Ticket;
  users: User[];
  onEdit: () => void;
  onDelete: () => void;
};

export function TicketCard({ ticket, users, onEdit, onDelete }: Props) {
  const createdByName =
    ticket.createdBy?.name ?? users.find((user) => user.id === ticket.createdById)?.name ?? "Unknown";
  const assignedToName =
    ticket.assignedTo?.name ??
    users.find((user) => user.id === ticket.assignedToId)?.name ??
    "Unassigned";

  return (
    <section className="card">
      <h2>{ticket.title}</h2>
      <p>{ticket.description}</p>
      <p>Created by: {createdByName}</p>
      <p>Assigned to: {assignedToName}</p>
      <p>Priority: {ticket.priority}</p>
      <StatusBadge status={ticket.status} />
      <div className="actions">
        <button onClick={onEdit}>Edit Ticket</button>
        <button onClick={onDelete}>Delete Ticket</button>
      </div>
    </section>
  );
}
