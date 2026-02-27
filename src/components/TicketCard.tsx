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
    <section className="ui-card">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{ticket.title}</h2>
        <StatusBadge status={ticket.status} />
      </div>

      <p className="mb-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300">{ticket.description}</p>
      {ticket.imageUrl && (
        <img src={ticket.imageUrl} alt="Ticket attachment" className="mb-4 w-full max-w-md rounded-xl border border-slate-200 object-cover dark:border-slate-800" />
      )}

      <div className="grid gap-2 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">
        <p><span className="font-semibold text-slate-800 dark:text-slate-200">Created by:</span> {createdByName}</p>
        <p><span className="font-semibold text-slate-800 dark:text-slate-200">Assigned to:</span> {assignedToName}</p>
        <p><span className="font-semibold text-slate-800 dark:text-slate-200">Priority:</span> {ticket.priority}</p>
        <p><span className="font-semibold text-slate-800 dark:text-slate-200">Created at:</span> {new Date(ticket.createdAt).toLocaleDateString()}</p>
        {ticket.status === "CLOSED" && <p><span className="font-semibold text-slate-800 dark:text-slate-200">Closed at:</span> {new Date(ticket.updatedAt).toLocaleDateString()}</p>}
      </div>

      {canManage && (
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            onClick={onEdit}
            className="ui-btn-secondary"
          >
            Edit Ticket
          </button>
          <button
            onClick={onDelete}
            className="ui-btn-danger"
          >
            Delete Ticket
          </button>
        </div>
      )}
    </section>
  );
}
