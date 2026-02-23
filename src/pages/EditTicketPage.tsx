import { TicketForm } from "../components/TicketForm";
import { Ticket, TicketFormValues, User } from "../types";

type Props = {
  ticket: Ticket;
  users: User[];
  onSubmit: (values: TicketFormValues) => Promise<void> | void;
  onCancel: () => void;
};

export function EditTicketPage({ ticket, users, onSubmit, onCancel }: Props) {
  return (
    <section>
      <h2>Edit Ticket</h2>
      <TicketForm users={users} initialTicket={ticket} onSubmit={onSubmit} onCancel={onCancel} />
    </section>
  );
}
