import { TicketForm } from "../components/TicketForm";
import { Ticket, TicketFormValues, User } from "../types";

type Props = {
  ticket: Ticket;
  users: User[];
  canEditStatus: boolean;
  onSubmit: (values: TicketFormValues) => Promise<void> | void;
  onCancel: () => void;
};

export function EditTicketPage({ ticket, users, canEditStatus, onSubmit, onCancel }: Props) {
  return (
    <section className="ui-section-stack">
      <h2 className="ui-title">Edit Ticket</h2>
      <TicketForm
        users={users}
        initialTicket={ticket}
        canEditStatus={canEditStatus}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    </section>
  );
}
