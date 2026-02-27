import { ChangeEvent, FormEvent, useState } from "react";
import { Ticket, TicketFormValues, TicketPriority, TicketStatus, User } from "../types";

type Props = {
  users: User[];
  initialTicket?: Ticket;
  canEditStatus?: boolean;
  onSubmit: (values: TicketFormValues) => Promise<void> | void;
  onCancel: () => void;
};

export function TicketForm({ users, initialTicket, canEditStatus = true, onSubmit, onCancel }: Props) {
  const agentUsers = users.filter((user) => user.role === "AGENT");

  const [title, setTitle] = useState(initialTicket?.title ?? "");
  const [description, setDescription] = useState(initialTicket?.description ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(initialTicket?.imageUrl ?? null);
  const [status, setStatus] = useState<TicketStatus>(initialTicket?.status ?? "OPEN");
  const [priority, setPriority] = useState<TicketPriority>(initialTicket?.priority ?? "MEDIUM");
  const [assignedToId, setAssignedToId] = useState<number | null>(initialTicket?.assignedToId ?? null);

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setImageUrl(null);
      return;
    }

    const reader = new FileReader();
    const encodedImage = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Could not read image"));
      reader.readAsDataURL(file);
    });

    setImageUrl(encodedImage);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !description.trim()) {
      return;
    }

    const effectiveStatus = canEditStatus ? status : initialTicket?.status ?? "OPEN";

    await onSubmit({
      title: title.trim(),
      description: description.trim(),
      imageUrl,
      status: effectiveStatus,
      priority,
      assignedToId,
    });
  };

  return (
    <section className="ui-card">
      <form onSubmit={handleSubmit} className="grid gap-4">
        <div className="grid gap-1.5">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Title</label>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ticket title"
          />
        </div>

        <div className="grid gap-1.5">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Description</label>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Ticket description"
            rows={4}
          />
        </div>

        <div className="grid gap-1.5">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Attachment image</label>
          <input type="file" accept="image/*" onChange={(event) => void handleImageChange(event)} />
        </div>

        {imageUrl && (
          <div className="grid gap-3">
            <img src={imageUrl} alt="Ticket attachment preview" className="w-full max-w-xs rounded-xl border border-slate-200 object-cover dark:border-slate-700" />
            <button
              type="button"
              onClick={() => setImageUrl(null)}
              className="ui-btn-secondary w-fit px-3 py-2"
            >
              Remove Image
            </button>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {canEditStatus && (
            <div className="grid gap-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Status</label>
              <select value={status} onChange={(event) => setStatus(event.target.value as TicketStatus)}>
                <option value="OPEN">OPEN</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>
          )}

          <div className="grid gap-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Priority</label>
            <select value={priority} onChange={(event) => setPriority(event.target.value as TicketPriority)}>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
            </select>
          </div>
        </div>

        <div className="grid gap-1.5">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Assign to agent</label>
          <select
            value={assignedToId ?? ""}
            onChange={(event) => setAssignedToId(event.target.value ? Number(event.target.value) : null)}
          >
            <option value="">Unassigned</option>
            {agentUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
        </div>

        <div className="mt-1 flex flex-wrap gap-3">
          <button type="submit" className="ui-btn-primary">
            Save Ticket
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="ui-btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
