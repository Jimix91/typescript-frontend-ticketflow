import { useMemo, useState, type DragEvent } from "react";
import { StatusBadge } from "../components/StatusBadge";
import { formatRelativeDate } from "../time";
import { Ticket, TicketPriority, TicketStatus, User } from "../types";

type Props = {
  authUser: User;
  tickets: Ticket[];
  users: User[];
  isSyncing?: boolean;
  movingTicketId?: number | null;
  onView: (ticketId: number) => void;
  onEdit: (ticketId: number) => void;
  onDelete: (ticketId: number) => void;
  onMoveStatus: (ticketId: number, status: TicketStatus) => void;
  onViewArchived: () => void;
};

export function DashboardPage({ authUser, tickets, users, isSyncing = false, movingTicketId = null, onView, onEdit, onDelete, onMoveStatus, onViewArchived }: Props) {
  const [omnibox, setOmnibox] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | TicketStatus>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<"ALL" | TicketPriority>("ALL");
  const [assignedToFilter, setAssignedToFilter] = useState<"ALL" | "UNASSIGNED" | number>("ALL");
  const [createdByFilter, setCreatedByFilter] = useState<"ALL" | number>("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const resetFilters = () => {
    setOmnibox("");
    setStatusFilter("ALL");
    setPriorityFilter("ALL");
    setAssignedToFilter("ALL");
    setCreatedByFilter("ALL");
    setFromDate("");
    setToDate("");
  };

  const hasActiveFilters =
    omnibox.trim().length > 0 ||
    statusFilter !== "ALL" ||
    priorityFilter !== "ALL" ||
    assignedToFilter !== "ALL" ||
    createdByFilter !== "ALL" ||
    fromDate !== "" ||
    toDate !== "";

  const filteredTickets = useMemo(() => {
    const term = omnibox.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const searchable = [
        ticket.title,
        ticket.description,
        String(ticket.id),
        ticket.ticketCode ?? "",
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

  const priorityRank: Record<TicketPriority, number> = {
    HIGH: 0,
    MEDIUM: 1,
    LOW: 2,
  };

  const sortByPriority = (statusTickets: Ticket[]) => {
    return [...statusTickets].sort((left, right) => priorityRank[left.priority] - priorityRank[right.priority]);
  };

  const openTickets = sortByPriority(filteredTickets.filter((ticket) => ticket.status === "OPEN"));
  const inProgressTickets = sortByPriority(filteredTickets.filter((ticket) => ticket.status === "IN_PROGRESS"));
  const closedTickets = sortByPriority(filteredTickets.filter((ticket) => ticket.status === "CLOSED"));

  const getPriorityBreakdown = (statusTickets: Ticket[]) => {
    return statusTickets.reduce(
      (acc, ticket) => {
        if (ticket.priority === "HIGH") {
          acc.high += 1;
        } else if (ticket.priority === "MEDIUM") {
          acc.medium += 1;
        } else {
          acc.low += 1;
        }

        return acc;
      },
      { high: 0, medium: 0, low: 0 },
    );
  };

  const openPriorityBreakdown = getPriorityBreakdown(openTickets);
  const inProgressPriorityBreakdown = getPriorityBreakdown(inProgressTickets);

  const dragGuidance =
    authUser.role === "ADMIN"
      ? "Tip: You can drag and drop any ticket between columns to change its status."
      : authUser.role === "AGENT"
        ? "Tip: You can drag and drop only tickets assigned to you between columns."
        : "Tip: Drag and drop is available for agents/admins. Use ticket actions to continue managing your requests.";

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

  const priorityBadgeClass = (priority: TicketPriority) => {
    if (priority === "HIGH") {
      return "ui-priority bg-rose-100 text-rose-700";
    }
    if (priority === "MEDIUM") {
      return "ui-priority bg-amber-100 text-amber-700";
    }
    return "ui-priority bg-emerald-100 text-emerald-700";
  };

  const renderColumn = (title: string, status: TicketStatus, columnTickets: Ticket[]) => (
    <div
      className="min-h-[560px] rounded-2xl border border-sky-300 bg-white p-4 shadow-md dark:border-slate-700 dark:bg-slate-900"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => handleDrop(event, status)}
    >
      <div className="mb-2 flex items-center justify-between border-b border-sky-200 pb-2 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <h3 className={`text-sm font-semibold ${
            status === "OPEN" ? "text-blue-700" : status === "IN_PROGRESS" ? "text-amber-700" : "text-emerald-700"
          }`}>
            {title}
          </h3>
          {status === "CLOSED" && (
            <button
              type="button"
              className="ui-btn-secondary ui-focusable px-2.5 py-1 text-[0.68rem]"
              onClick={onViewArchived}
            >
              Archived
            </button>
          )}
        </div>
        <span className={`rounded-full px-2 py-1 text-xs font-medium text-white ${
          status === "OPEN" ? "bg-blue-600" : status === "IN_PROGRESS" ? "bg-amber-500" : "bg-emerald-600"
        }`}>
          {columnTickets.length}
        </span>
      </div>

      <div className="ui-scrollbar mt-3 max-h-[470px] overflow-y-auto pr-1">
        {isSyncing && tickets.length === 0 && (
          <div className="grid gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={`${status}-${index}`} className="ui-skeleton h-48" />
            ))}
          </div>
        )}

        {!isSyncing && columnTickets.length === 0 && (
          <div className="rounded-2xl border border-slate-200 px-3 py-8 text-center text-xs font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-400">
            No tickets in this column.
          </div>
        )}

        {columnTickets.map((ticket) => (
          (() => {
          const canManage =
            authUser.role === "ADMIN" ||
            (authUser.role === "EMPLOYEE" && ticket.createdById === authUser.id) ||
            (authUser.role === "AGENT" && ticket.assignedToId === authUser.id);
          const canDelete = canManage && authUser.role !== "EMPLOYEE";

          const canDrag = canDragTicket(ticket);
          const assignedName = ticket.assignedTo?.name ?? users.find((user) => user.id === ticket.assignedToId)?.name ?? "Unassigned";
          const createdName = ticket.createdBy?.name ?? users.find((user) => user.id === ticket.createdById)?.name ?? "Unknown";
          const overdueDays = Math.floor((Date.now() - new Date(ticket.createdAt).getTime()) / (1000 * 60 * 60 * 24));
          const isOverdue = ticket.status !== "CLOSED" && overdueDays >= 7;

          return (
        <article
          key={ticket.id}
          className={`ui-kanban-card ui-fade-in mb-3 flex min-h-[220px] flex-col gap-3.5 p-4 ${
            ticket.status === "OPEN"
              ? "bg-blue-100 border-blue-300 dark:bg-slate-800/70 dark:border-blue-900/60"
              : ticket.status === "IN_PROGRESS"
                ? "bg-amber-100 border-amber-300 dark:bg-slate-800/70 dark:border-amber-900/60"
                : "bg-emerald-100 border-emerald-300 dark:bg-slate-800/70 dark:border-emerald-900/60"
          } ${
            canDrag ? "ui-draggable" : "cursor-default"
          } ${
            movingTicketId === ticket.id ? "scale-[0.99] opacity-80" : ""
          }`}
          draggable={canDrag}
          onDragStart={(event) => {
            if (!canDrag) {
              event.preventDefault();
              return;
            }

            handleDragStart(event, ticket.id);
          }}
        >
          <div className="grid gap-2">
            <strong className="break-words text-base font-semibold leading-6 text-slate-900 dark:text-slate-100">
              {ticket.title}
              <span className="ml-2 text-xs font-semibold text-slate-500 dark:text-slate-400">#{ticket.ticketCode ?? ticket.id}</span>
            </strong>
            <div className="flex justify-start">
              <StatusBadge status={ticket.status} inProgressSubStatus={ticket.inProgressSubStatus} />
            </div>
          </div>

          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{ticket.description}</p>

          <div className="grid gap-2 text-xs text-slate-500 dark:text-slate-400">
            <small className="flex items-center gap-2">
              <span className={priorityBadgeClass(ticket.priority)}>
                Priority {ticket.priority}
              </span>
              {isOverdue && <span className="ui-overdue">Overdue {overdueDays}d</span>}
            </small>
            <small>Created: {formatRelativeDate(ticket.createdAt)} · by {createdName}</small>
            {ticket.status === "CLOSED" && (
              <small>Closed: {formatRelativeDate(ticket.updatedAt)}</small>
            )}
            <small className="inline-flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[0.62rem] font-bold text-white dark:bg-slate-100 dark:text-slate-900">
                {assignedName.charAt(0).toUpperCase()}
              </span>
              Assigned to {assignedName}
            </small>
            {canDrag && <small className="text-xs font-medium text-indigo-600 dark:text-indigo-300">Drag to move</small>}
          </div>

          <div className="mt-auto flex flex-wrap gap-2 pt-1">
            <button className="ui-btn-secondary ui-focusable px-3.5 py-2 text-xs" onClick={() => onView(ticket.id)}>Detail</button>
            {canManage && <button className="ui-btn-secondary ui-focusable px-3.5 py-2 text-xs" onClick={() => onEdit(ticket.id)}>Edit</button>}
            {canDelete && <button className="ui-btn-danger ui-focusable px-3.5 py-2 text-xs" onClick={() => onDelete(ticket.id)}>Delete</button>}
          </div>
        </article>
          );
        })()
        ))}
      </div>
    </div>
  );

  const unresolvedCount = filteredTickets.filter((ticket) => ticket.status !== "CLOSED").length;
  const overdueCount = filteredTickets.filter((ticket) => {
    if (ticket.status === "CLOSED") {
      return false;
    }

    const ageDays = Math.floor((Date.now() - new Date(ticket.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    return ageDays >= 7;
  }).length;

  return (
    <section className="ui-section-stack ui-fade-in">
      <div className="grid gap-2">
        <h2 className="ui-title">Dashboard</h2>
        <p className="ui-page-subtitle">Monitor, prioritize, and move tickets with a productivity-first workflow.</p>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-sky-300 bg-white p-5 text-center shadow-md transition-all duration-200 ease-in-out hover:-translate-y-px hover:shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">Open</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-blue-600">{openTickets.length}</p>
          <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
            High {openPriorityBreakdown.high} · Medium {openPriorityBreakdown.medium} · Low {openPriorityBreakdown.low}
          </p>
        </article>
        <article className="rounded-2xl border border-sky-300 bg-white p-5 text-center shadow-md transition-all duration-200 ease-in-out hover:-translate-y-px hover:shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">In Progress</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-amber-600">{inProgressTickets.length}</p>
          <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
            High {inProgressPriorityBreakdown.high} · Medium {inProgressPriorityBreakdown.medium} · Low {inProgressPriorityBreakdown.low}
          </p>
        </article>
        <article className="rounded-2xl border border-sky-300 bg-white p-5 text-center shadow-md transition-all duration-200 ease-in-out hover:-translate-y-px hover:shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">Closed</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-emerald-600">{closedTickets.length}</p>
        </article>
        <article className="rounded-2xl border border-sky-300 bg-white p-5 text-center shadow-md transition-all duration-200 ease-in-out hover:-translate-y-px hover:shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">SLA Watch</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-rose-600">{overdueCount}</p>
          <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{unresolvedCount} unresolved</p>
        </article>
      </section>

      <section className="rounded-2xl border border-sky-300 bg-white p-5 shadow-md dark:border-slate-700 dark:bg-slate-900">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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

        <div className="flex items-end justify-end">
          <button
            type="button"
            className="ui-btn-secondary ui-focusable px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            onClick={resetFilters}
            disabled={!hasActiveFilters}
          >
            Clear filters
          </button>
        </div>
        </div>
      </section>

      <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">{dragGuidance}</p>

      <section className="grid grid-cols-1 gap-6 2xl:grid-cols-3">
        {renderColumn("Open", "OPEN", openTickets)}
        {renderColumn("In Progress", "IN_PROGRESS", inProgressTickets)}
        {renderColumn("Closed", "CLOSED", closedTickets)}
      </section>
    </section>
  );
}
