import { TicketForm } from "../components/TicketForm";
import { TicketFormValues, User } from "../types";

type Props = {
  users: User[];
  onSubmit: (values: TicketFormValues) => Promise<void> | void;
  onCancel: () => void;
};

export function CreateTicketPage({ users, onSubmit, onCancel }: Props) {
  return (
    <section>
      <h2>Create Ticket</h2>
      <TicketForm users={users} onSubmit={onSubmit} onCancel={onCancel} />
    </section>
  );
}
