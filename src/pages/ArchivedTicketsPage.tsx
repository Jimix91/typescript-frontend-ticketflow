import { StatusBadge } from "../components/StatusBadge";
import { formatRelativeDate } from "../time";
import { Ticket, User } from "../types";

type Props = {
  tickets: Ticket[];
  users: User[];
  loading: boolean;
  onBack: () => void;
  onRefresh: () => void;
  onView: (ticketId: number) => void;
};

export function ArchivedTicketsPage({ tickets, users, loading, onBack, onRefresh, onView }: Props) {
  const resolveName = (ticket: Ticket, userId: number | null, kind: "creator" | "assignee") => {
    if (kind === "creator") {
      return ticket.createdBy?.name ?? users.find((user) => user.id === userId)?.name ?? "Unknown";
    }

    if (userId === null) {
      return "Unassigned";
    }

    return ticket.assignedTo?.name ?? users.find((user) => user.id === userId)?.name ?? "Unassigned";
  };

  return (
    <section className="ui-section-stack ui-fade-in">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid gap-1">
          <h2 className="ui-title">Archived Tickets</h2>
          <p className="ui-page-subtitle">Closed tickets older than 5 days are moved here automatically.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="ui-btn-secondary ui-focusable px-4 py-2 text-sm" onClick={onRefresh}>
            Refresh
          </button>
          <button type="button" className="ui-btn-secondary ui-focusable px-4 py-2 text-sm" onClick={onBack}>
            Back to dashboard
          </button>
        </div>
      </header>

      <section className="rounded-2xl border border-sky-300 bg-white p-5 shadow-md dark:border-slate-700 dark:bg-slate-900">
        {loading ? (
          <div className="grid gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="ui-skeleton h-24" />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-300">
            No archived tickets yet.
          </p>
        ) : (
          <div className="ui-table-wrap">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="ui-th">Ticket</th>
                  <th className="ui-th">Status</th>
                  <th className="ui-th">Created by</th>
                  <th className="ui-th">Assigned to</th>
                  <th className="ui-th">Archived</th>
                  <th className="ui-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td className="ui-td text-slate-800 dark:text-slate-200">
                      {ticket.title}
                      <span className="ml-2 text-xs font-semibold text-slate-500 dark:text-slate-400">#{ticket.ticketCode ?? ticket.id}</span>
                    </td>
                    <td className="ui-td">
                      <StatusBadge status={ticket.status} inProgressSubStatus={ticket.inProgressSubStatus} />
                    </td>
                    <td className="ui-td">{resolveName(ticket, ticket.createdById, "creator")}</td>
                    <td className="ui-td">{resolveName(ticket, ticket.assignedToId, "assignee")}</td>
                    <td className="ui-td">{formatRelativeDate(ticket.updatedAt)}</td>
                    <td className="ui-td">
                      <button className="ui-btn-secondary px-3 py-1.5 text-xs" onClick={() => onView(ticket.id)}>
                        Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}
