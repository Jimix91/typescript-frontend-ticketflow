import { Ticket } from "../types";
import { formatRelativeDate } from "../time";
import { StatusBadge } from "./StatusBadge";

type Props = {
  tickets: Ticket[];
  onView: (ticketId: number) => void;
  onEdit: (ticketId: number) => void;
  onDelete: (ticketId: number) => void;
};

export function TicketTable({ tickets, onView, onEdit, onDelete }: Props) {
  if (tickets.length === 0) {
    return <p className="ui-card text-sm text-slate-600 dark:text-slate-300">No tickets yet.</p>;
  }

  return (
    <section className="ui-card">
      <h2 className="ui-title mb-4">Tickets</h2>
      <div className="grid gap-3 md:hidden">
        {tickets.map((ticket) => (
          <article key={ticket.id} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-2 flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{ticket.title}</h3>
              <StatusBadge status={ticket.status} inProgressSubStatus={ticket.inProgressSubStatus} />
            </div>
            <div className="grid gap-1.5 text-xs text-slate-600 dark:text-slate-300">
              <span>{ticket.priority} priority</span>
              <span>Created: {formatRelativeDate(ticket.createdAt)}</span>
              <span>Closed: {ticket.status === "CLOSED" ? formatRelativeDate(ticket.updatedAt) : "-"}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="ui-btn-secondary px-3 py-1.5 text-xs" onClick={() => onView(ticket.id)}>Detail</button>
              <button className="ui-btn-secondary px-3 py-1.5 text-xs" onClick={() => onEdit(ticket.id)}>Edit</button>
              <button className="ui-btn-danger px-3 py-1.5 text-xs" onClick={() => onDelete(ticket.id)}>Delete</button>
            </div>
          </article>
        ))}
      </div>

      <div className="ui-table-wrap hidden md:block">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="ui-th">Title</th>
            <th className="ui-th">Status</th>
            <th className="ui-th">Priority</th>
            <th className="ui-th">Created at</th>
            <th className="ui-th">Closed at</th>
            <th className="ui-th">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr key={ticket.id}>
              <td className="ui-td text-slate-800 dark:text-slate-200">{ticket.title}</td>
              <td className="ui-td">
                <StatusBadge status={ticket.status} inProgressSubStatus={ticket.inProgressSubStatus} />
              </td>
              <td className="ui-td">
                <span
                  className={
                    ticket.priority === "HIGH"
                      ? "ui-priority bg-rose-100 text-rose-700"
                      : ticket.priority === "MEDIUM"
                        ? "ui-priority bg-amber-100 text-amber-700"
                        : "ui-priority bg-emerald-100 text-emerald-700"
                  }
                >
                  {ticket.priority}
                </span>
              </td>
              <td className="ui-td">{formatRelativeDate(ticket.createdAt)}</td>
              <td className="ui-td">{ticket.status === "CLOSED" ? formatRelativeDate(ticket.updatedAt) : "-"}</td>
              <td className="ui-td">
                <div className="flex flex-wrap gap-2">
                  <button className="ui-btn-secondary px-3 py-1.5 text-xs" onClick={() => onView(ticket.id)}>Detail</button>
                  <button className="ui-btn-secondary px-3 py-1.5 text-xs" onClick={() => onEdit(ticket.id)}>Edit</button>
                  <button className="ui-btn-danger px-3 py-1.5 text-xs" onClick={() => onDelete(ticket.id)}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </section>
  );
}
