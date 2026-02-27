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
      <div className="ui-table-wrap">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border-b border-slate-200 px-3 py-2 text-left font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-300">Title</th>
            <th className="border-b border-slate-200 px-3 py-2 text-left font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-300">Status</th>
            <th className="border-b border-slate-200 px-3 py-2 text-left font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-300">Priority</th>
            <th className="border-b border-slate-200 px-3 py-2 text-left font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-300">Created at</th>
            <th className="border-b border-slate-200 px-3 py-2 text-left font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-300">Closed at</th>
            <th className="border-b border-slate-200 px-3 py-2 text-left font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-300">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr key={ticket.id}>
              <td className="border-b border-slate-100 px-3 py-3 text-slate-800 dark:border-slate-800/70 dark:text-slate-200">{ticket.title}</td>
              <td className="border-b border-slate-100 px-3 py-3 dark:border-slate-800/70">
                <StatusBadge status={ticket.status} />
              </td>
              <td className="border-b border-slate-100 px-3 py-3 dark:border-slate-800/70">
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
              <td className="border-b border-slate-100 px-3 py-3 text-slate-700 dark:border-slate-800/70 dark:text-slate-300">{new Date(ticket.createdAt).toLocaleDateString()}</td>
              <td className="border-b border-slate-100 px-3 py-3 text-slate-700 dark:border-slate-800/70 dark:text-slate-300">{ticket.status === "CLOSED" ? new Date(ticket.updatedAt).toLocaleDateString() : "-"}</td>
              <td className="border-b border-slate-100 px-3 py-3 dark:border-slate-800/70">
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
