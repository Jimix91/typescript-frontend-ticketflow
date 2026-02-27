import { Ticket } from "../types";
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
              <StatusBadge status={ticket.status} />
            </div>
            <div className="grid gap-1.5 text-xs text-slate-600 dark:text-slate-300">
              <span>{ticket.priority} priority</span>
              <span>Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
              <span>Closed: {ticket.status === "CLOSED" ? new Date(ticket.updatedAt).toLocaleDateString() : "-"}</span>
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
                <StatusBadge status={ticket.status} />
              </td>
              <td className="ui-td">
                <span
                  className={
                    ticket.priority === "HIGH"
                      ? "ui-priority border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800/60 dark:bg-rose-900/30 dark:text-rose-300"
                      : ticket.priority === "MEDIUM"
                        ? "ui-priority border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-900/30 dark:text-amber-300"
                        : "ui-priority border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-900/30 dark:text-emerald-300"
                  }
                >
                  <span className="ui-priority-dot bg-current" />
                  {ticket.priority}
                </span>
              </td>
              <td className="ui-td">{new Date(ticket.createdAt).toLocaleDateString()}</td>
              <td className="ui-td">{ticket.status === "CLOSED" ? new Date(ticket.updatedAt).toLocaleDateString() : "-"}</td>
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
