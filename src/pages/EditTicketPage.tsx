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
      <header className="ui-card relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-brand-50/80 to-transparent dark:from-brand-900/20" />
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="ui-title">Edit Ticket</h2>
            <p className="ui-page-subtitle">Update ticket details, priorities and assignment while preserving status clarity.</p>
          </div>
          <button onClick={onCancel} className="ui-btn-secondary">Back to Dashboard</button>
        </div>
      </header>
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
