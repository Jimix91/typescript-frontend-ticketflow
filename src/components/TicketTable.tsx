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
    return <p className="card">No tickets yet.</p>;
  }

  return (
    <section className="card">
      <h2>Tickets</h2>
      <table className="ticket-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Created at</th>
            <th>Closed at</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr key={ticket.id}>
              <td>{ticket.title}</td>
              <td>
                <StatusBadge status={ticket.status} />
              </td>
              <td>{ticket.priority}</td>
              <td>{new Date(ticket.createdAt).toLocaleDateString()}</td>
              <td>{ticket.status === "CLOSED" ? new Date(ticket.updatedAt).toLocaleDateString() : "-"}</td>
              <td className="actions">
                <button onClick={() => onView(ticket.id)}>Detail</button>
                <button onClick={() => onEdit(ticket.id)}>Edit</button>
                <button onClick={() => onDelete(ticket.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
