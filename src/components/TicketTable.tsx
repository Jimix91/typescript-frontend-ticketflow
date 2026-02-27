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
              <td className="border-b border-slate-100 px-3 py-3 text-slate-700 dark:border-slate-800/70 dark:text-slate-300">{ticket.priority}</td>
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
