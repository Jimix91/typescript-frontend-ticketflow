import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { Ticket, TicketStatus, User } from "../types";

type Props = {
  authUser: User;
  tickets: Ticket[];
  onBack: () => void;
  onProfileUpdated: (user: User) => void;
};

const summarizeByStatus = (items: Ticket[]) => {
  const counts: Record<TicketStatus, number> = {
    OPEN: 0,
    IN_PROGRESS: 0,
    CLOSED: 0,
  };

  for (const item of items) {
    counts[item.status] += 1;
  }

  return counts;
};

export function ProfilePage({ authUser, tickets, onBack, onProfileUpdated }: Props) {
  const [displayName, setDisplayName] = useState(authUser.name);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(authUser.profileImageUrl ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(authUser.name);
    setProfileImageUrl(authUser.profileImageUrl ?? null);
  }, [authUser.name, authUser.profileImageUrl]);

  const createdByMe = useMemo(() => tickets.filter((ticket) => ticket.createdById === authUser.id), [tickets, authUser.id]);
  const assignedToMe = useMemo(() => tickets.filter((ticket) => ticket.assignedToId === authUser.id), [tickets, authUser.id]);

  const createdSummary = useMemo(() => summarizeByStatus(createdByMe), [createdByMe]);
  const assignedSummary = useMemo(() => summarizeByStatus(assignedToMe), [assignedToMe]);

  const agentSolved = useMemo(
    () => assignedToMe.filter((ticket) => ticket.status === "CLOSED"),
    [assignedToMe],
  );
  const agentOpenAssigned = useMemo(
    () => assignedToMe.filter((ticket) => ticket.status === "OPEN" || ticket.status === "IN_PROGRESS"),
    [assignedToMe],
  );

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    const encodedImage = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Could not read image"));
      reader.readAsDataURL(file);
    });

    setProfileImageUrl(encodedImage);
  };

  const handleSaveProfile = async () => {
    try {
      setBusy(true);
      const updated = await api.updateMyProfile({
        name: displayName.trim() || authUser.name,
        profileImageUrl,
      });
      onProfileUpdated(updated);
      setError(null);
      setSuccessMessage("Profile updated successfully");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not update profile");
      setSuccessMessage(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="ui-section-stack">
      <h2 className="ui-title">My Profile</h2>

      <section className="ui-card grid gap-3">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">User Area</h3>
        <p className="text-sm text-slate-700 dark:text-slate-300">Email: {authUser.email}</p>
        <p className="text-sm text-slate-700 dark:text-slate-300">Role: {authUser.role}</p>

        {profileImageUrl ? (
          <img src={profileImageUrl} alt="Profile" className="h-28 w-28 rounded-full border border-slate-200 object-cover dark:border-slate-700" />
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">No profile image yet.</p>
        )}

        <label className="grid gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
          Display name (shown in dashboard)
          <input
            value={displayName}
            onChange={(event) => {
              setDisplayName(event.target.value);
              setSuccessMessage(null);
            }}
            placeholder="Display name"
          />
        </label>
        <input type="file" accept="image/*" onChange={(event) => void handleImageChange(event)} />

        <div className="flex flex-wrap gap-3">
          <button onClick={() => void handleSaveProfile()} disabled={busy} className="ui-btn-primary">
            Save Profile
          </button>
          <button onClick={() => setProfileImageUrl(null)} disabled={busy} className="ui-btn-secondary">
            Remove Image
          </button>
        </div>
      </section>

      <section className="ui-card">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Created by Me</h3>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Open: {createdSummary.OPEN} · In progress: {createdSummary.IN_PROGRESS} · Closed: {createdSummary.CLOSED}</p>
        {createdByMe.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">No created tickets yet.</p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {createdByMe.map((ticket) => (
              <li key={ticket.id} className="grid gap-1 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950/50">
                <strong className="text-sm text-slate-900 dark:text-slate-100">{ticket.title}</strong>
                <span className="text-sm text-slate-600 dark:text-slate-300">Status: {ticket.status}</span>
                <span className="text-sm text-slate-600 dark:text-slate-300">Created at: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                {ticket.status === "CLOSED" && <span className="text-sm text-slate-600 dark:text-slate-300">Closed at: {new Date(ticket.updatedAt).toLocaleDateString()}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="ui-card">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Assigned to Me</h3>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Open: {assignedSummary.OPEN} · In progress: {assignedSummary.IN_PROGRESS} · Closed: {assignedSummary.CLOSED}</p>
        {assignedToMe.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">No assigned tickets yet.</p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {assignedToMe.map((ticket) => (
              <li key={ticket.id} className="grid gap-1 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950/50">
                <strong className="text-sm text-slate-900 dark:text-slate-100">{ticket.title}</strong>
                <span className="text-sm text-slate-600 dark:text-slate-300">Status: {ticket.status}</span>
                <span className="text-sm text-slate-600 dark:text-slate-300">Created at: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                {ticket.status === "CLOSED" && <span className="text-sm text-slate-600 dark:text-slate-300">Closed at: {new Date(ticket.updatedAt).toLocaleDateString()}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {authUser.role === "AGENT" && (
        <>
          <section className="ui-card">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">My Solved Tickets</h3>
            {agentSolved.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">No solved tickets yet.</p>
            ) : (
              <ul className="mt-3 grid gap-3">
                {agentSolved.map((ticket) => (
                  <li key={ticket.id} className="grid gap-1 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950/50">
                    <strong className="text-sm text-slate-900 dark:text-slate-100">{ticket.title}</strong>
                    <span className="text-sm text-slate-600 dark:text-slate-300">Closed at: {new Date(ticket.updatedAt).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="ui-card">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">My Open Assigned Tickets</h3>
            {agentOpenAssigned.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">No open assigned tickets.</p>
            ) : (
              <ul className="mt-3 grid gap-3">
                {agentOpenAssigned.map((ticket) => (
                  <li key={ticket.id} className="grid gap-1 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950/50">
                    <strong className="text-sm text-slate-900 dark:text-slate-100">{ticket.title}</strong>
                    <span className="text-sm text-slate-600 dark:text-slate-300">Status: {ticket.status}</span>
                    <span className="text-sm text-slate-600 dark:text-slate-300">Created at: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {error && <p className="ui-alert-error">{error}</p>}
      {successMessage && <p className="ui-alert-success">{successMessage}</p>}

      <div>
        <button onClick={onBack} className="ui-btn-secondary">Back to Dashboard</button>
      </div>
    </section>
  );
}
