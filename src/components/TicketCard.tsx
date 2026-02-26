import { Ticket, User } from "../types";
import { StatusBadge } from "./StatusBadge";

type Props = {
  ticket: Ticket;
  users: User[];
  onEdit: () => void;
  onDelete: () => void;
  canManage: boolean;
};

export function TicketCard({ ticket, users, onEdit, onDelete, canManage }: Props) {
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
      {ticket.imageUrl && (
        <img src={ticket.imageUrl} alt="Ticket attachment" style={{ maxWidth: "320px", borderRadius: "8px" }} />
      )}
      <p>Created by: {createdByName}</p>
      <p>Assigned to: {assignedToName}</p>
      <p>Priority: {ticket.priority}</p>
      <p>Created at: {new Date(ticket.createdAt).toLocaleDateString()}</p>
      {ticket.status === "CLOSED" && <p>Closed at: {new Date(ticket.updatedAt).toLocaleDateString()}</p>}
      <StatusBadge status={ticket.status} />
      {canManage && (
        <div className="actions">
          <button onClick={onEdit}>Edit Ticket</button>
          <button onClick={onDelete}>Delete Ticket</button>
        </div>
      )}
    </section>
  );
}
