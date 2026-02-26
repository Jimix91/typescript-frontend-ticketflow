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

      const ticketDate = new Date(ticket.createdAt);
      const afterFrom = !fromDate || ticketDate >= new Date(`${fromDate}T00:00:00`);
      const beforeTo = !toDate || ticketDate <= new Date(`${toDate}T23:59:59`);

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
      className="kanban-column"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => handleDrop(event, status)}
    >
      <h3>
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
          className="kanban-card"
          draggable={canDrag}
          onDragStart={(event) => {
            if (!canDrag) {
              event.preventDefault();
              return;
            }

            handleDragStart(event, ticket.id);
          }}
        >
          <strong>{ticket.title}</strong>
          <p>{ticket.description}</p>
          <StatusBadge status={ticket.status} />
          <small>Priority: {ticket.priority}</small>
          <div className="actions">
            <button onClick={() => onView(ticket.id)}>Detail</button>
            {canManage && <button onClick={() => onEdit(ticket.id)}>Edit</button>}
            {canManage && <button onClick={() => onDelete(ticket.id)}>Delete</button>}
          </div>
        </article>
          );
        })()
      ))}
    </div>
  );

  return (
    <section>
      <h2>Dashboard</h2>

      <section className="card filter-grid">
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

        <label className="date-filter">
          Created from
          <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
        </label>

        <label className="date-filter">
          Created to
          <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
        </label>
      </section>

      <section className="kanban-board">
        {renderColumn("Open", "OPEN", openTickets)}
        {renderColumn("In Progress", "IN_PROGRESS", inProgressTickets)}
        {renderColumn("Closed", "CLOSED", closedTickets)}
      </section>
    </section>
  );
}
