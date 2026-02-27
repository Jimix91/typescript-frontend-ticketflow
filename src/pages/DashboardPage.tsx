import { useMemo, useState, type DragEvent } from "react";
import { StatusBadge } from "../components/StatusBadge";
import { Ticket, TicketPriority, TicketStatus, User } from "../types";

type Props = {
  authUser: User;
  tickets: Ticket[];
  users: User[];
  onView: (ticketId: number) => void;
  onEdit: (ticketId: number) => void;
  onDelete: (ticketId: number) => void;
  onMoveStatus: (ticketId: number, status: TicketStatus) => void;
};

export function DashboardPage({ authUser, tickets, users, onView, onEdit, onDelete, onMoveStatus }: Props) {
  const [omnibox, setOmnibox] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | TicketStatus>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<"ALL" | TicketPriority>("ALL");
  const [assignedToFilter, setAssignedToFilter] = useState<"ALL" | "UNASSIGNED" | number>("ALL");
  const [createdByFilter, setCreatedByFilter] = useState<"ALL" | number>("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const filteredTickets = useMemo(() => {
    const term = omnibox.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const searchable = [
        ticket.title,
        ticket.description,
        String(ticket.id),
        ticket.createdBy?.name ?? "",
        ticket.assignedTo?.name ?? "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesOmnibox = !term || searchable.includes(term);
      const matchesStatus = statusFilter === "ALL" || ticket.status === statusFilter;
      const matchesPriority = priorityFilter === "ALL" || ticket.priority === priorityFilter;

      const matchesAssigned =
        assignedToFilter === "ALL"
          ? true
          : assignedToFilter === "UNASSIGNED"
            ? ticket.assignedToId === null
            : ticket.assignedToId === assignedToFilter;

      const matchesCreator = createdByFilter === "ALL" || ticket.createdById === createdByFilter;

      const createdDate = new Date(ticket.createdAt);
      const closedDate = ticket.status === "CLOSED" ? new Date(ticket.updatedAt) : null;
      const afterFrom = !fromDate || createdDate >= new Date(`${fromDate}T00:00:00`);
      const beforeTo = !toDate || (closedDate !== null && closedDate <= new Date(`${toDate}T23:59:59`));

      return (
        matchesOmnibox &&
        matchesStatus &&
        matchesPriority &&
        matchesAssigned &&
        matchesCreator &&
        afterFrom &&
        beforeTo
      );
    });
  }, [tickets, omnibox, statusFilter, priorityFilter, assignedToFilter, createdByFilter, fromDate, toDate]);

  const openTickets = filteredTickets.filter((ticket) => ticket.status === "OPEN");
  const inProgressTickets = filteredTickets.filter((ticket) => ticket.status === "IN_PROGRESS");
  const closedTickets = filteredTickets.filter((ticket) => ticket.status === "CLOSED");

  const canDragTicket = (ticket: Ticket) => {
    if (authUser.role === "ADMIN") {
      return true;
    }

    return authUser.role === "AGENT" && ticket.assignedToId === authUser.id;
  };

  const handleDragStart = (event: DragEvent<HTMLElement>, ticketId: number) => {
    event.dataTransfer.setData("ticketId", String(ticketId));
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>, status: TicketStatus) => {
    event.preventDefault();
    const ticketId = Number(event.dataTransfer.getData("ticketId"));
    if (!Number.isInteger(ticketId)) {
      return;
    }
    onMoveStatus(ticketId, status);
  };

  const renderColumn = (title: string, status: TicketStatus, columnTickets: Ticket[]) => (
    <div
      className="ui-card min-h-[380px] border-dashed bg-surface-1/80 dark:bg-surface-dark-1"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => handleDrop(event, status)}
    >
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200">
        {title} ({columnTickets.length})
      </h3>
      {columnTickets.map((ticket) => (
        (() => {
          const canManage =
            authUser.role === "ADMIN" ||
            (authUser.role === "EMPLOYEE" && ticket.createdById === authUser.id) ||
            (authUser.role === "AGENT" && ticket.assignedToId === authUser.id);

          const canDrag = canDragTicket(ticket);

          return (
        <article
          key={ticket.id}
          className="mb-3 grid gap-2 rounded-xl border border-slate-200 bg-surface-0 p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-panel dark:border-slate-700 dark:bg-surface-dark-1"
          draggable={canDrag}
          onDragStart={(event) => {
            if (!canDrag) {
              event.preventDefault();
              return;
            }

            handleDragStart(event, ticket.id);
          }}
        >
          <strong className="text-sm font-bold text-slate-900 dark:text-slate-100">{ticket.title}</strong>
          <p className="text-sm text-slate-600 dark:text-slate-300">{ticket.description}</p>
          <StatusBadge status={ticket.status} />
          <small className="text-xs font-medium text-slate-600 dark:text-slate-300">Priority: {ticket.priority}</small>
          <small className="text-xs text-slate-500 dark:text-slate-400">Created at: {new Date(ticket.createdAt).toLocaleDateString()}</small>
          {ticket.status === "CLOSED" && (
            <small className="text-xs text-slate-500 dark:text-slate-400">Closed at: {new Date(ticket.updatedAt).toLocaleDateString()}</small>
          )}
          <div className="mt-1 flex flex-wrap gap-2">
            <button className="ui-btn-secondary px-3 py-1.5 text-xs" onClick={() => onView(ticket.id)}>Detail</button>
            {canManage && <button className="ui-btn-secondary px-3 py-1.5 text-xs" onClick={() => onEdit(ticket.id)}>Edit</button>}
            {canManage && <button className="ui-btn-danger px-3 py-1.5 text-xs" onClick={() => onDelete(ticket.id)}>Delete</button>}
          </div>
        </article>
          );
        })()
      ))}
    </div>
  );

  return (
    <section className="ui-section-stack">
      <div className="grid gap-2">
        <h2 className="ui-title">Dashboard</h2>
        <p className="ui-page-subtitle">Monitor, prioritize, and move tickets with a productivity-first workflow.</p>
      </div>

      <section className="ui-card grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <input
          value={omnibox}
          onChange={(event) => setOmnibox(event.target.value)}
          placeholder="Search by title, description, id, creator or assignee"
        />

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as "ALL" | TicketStatus)}
        >
          <option value="ALL">All Status</option>
          <option value="OPEN">OPEN</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="CLOSED">CLOSED</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(event) => setPriorityFilter(event.target.value as "ALL" | TicketPriority)}
        >
          <option value="ALL">All Priority</option>
          <option value="LOW">LOW</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="HIGH">HIGH</option>
        </select>

        <select
          value={createdByFilter}
          onChange={(event) =>
            setCreatedByFilter(event.target.value === "ALL" ? "ALL" : Number(event.target.value))
          }
        >
          <option value="ALL">All Creators</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>

        <select
          value={assignedToFilter === "ALL" || assignedToFilter === "UNASSIGNED" ? assignedToFilter : String(assignedToFilter)}
          onChange={(event) => {
            const value = event.target.value;
            if (value === "ALL" || value === "UNASSIGNED") {
              setAssignedToFilter(value);
              return;
            }
            setAssignedToFilter(Number(value));
          }}
        >
          <option value="ALL">All Assignees</option>
          <option value="UNASSIGNED">Unassigned</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>

        <label className="grid gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
          Created from
          <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
        </label>

        <label className="grid gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
          Closed to
          <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
        </label>
      </section>

      <section className="grid grid-cols-1 gap-4 2xl:grid-cols-3">
        {renderColumn("Open", "OPEN", openTickets)}
        {renderColumn("In Progress", "IN_PROGRESS", inProgressTickets)}
        {renderColumn("Closed", "CLOSED", closedTickets)}
      </section>
    </section>
  );
}
