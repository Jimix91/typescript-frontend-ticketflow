import { TicketCard } from "../components/TicketCard";
import { Ticket, User } from "../types";

type Props = {
  ticket: Ticket;
  users: User[];
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function TicketDetailPage({ ticket, users, onBack, onEdit, onDelete }: Props) {
  return (
    <section>
      <h2>Ticket Detail</h2>
      <TicketCard ticket={ticket} users={users} onEdit={onEdit} onDelete={onDelete} />
      <button onClick={onBack}>Back to Dashboard</button>
    </section>
  );
}
