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

const statusLabel: Record<TicketStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  CLOSED: "Closed",
};

const statusTone: Record<TicketStatus, string> = {
  OPEN: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300",
  IN_PROGRESS: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300",
  CLOSED: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300",
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

  const renderTicketList = (items: Ticket[], emptyText: string, mode: "created" | "assigned") => {
    if (items.length === 0) {
      return <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">{emptyText}</p>;
    }

    return (
      <ul className="mt-4 grid gap-3">
        {items.map((ticket) => (
          <li
            key={ticket.id}
            className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-950/40"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <strong className="text-sm text-slate-900 dark:text-slate-100">{ticket.title}</strong>
              <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone[ticket.status]}`}>
                {statusLabel[ticket.status]}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-300">
              <span>Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
              {ticket.status === "CLOSED" && <span>Closed: {new Date(ticket.updatedAt).toLocaleDateString()}</span>}
              {mode === "assigned" && ticket.assignedToId && <span>Ticket #{ticket.id}</span>}
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <section className="ui-section-stack">
      <header className="ui-card relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-brand-50/80 to-transparent dark:from-brand-900/20" />
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="ui-title">My Profile</h2>
            <p className="ui-page-subtitle">Manage your identity and monitor your ticket activity.</p>
          </div>
          <button onClick={onBack} className="ui-btn-secondary">Back to Dashboard</button>
        </div>
      </header>

      <section className="grid gap-5 lg:grid-cols-[1.05fr_1.65fr]">
        <article className="ui-card grid gap-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">User Area</h3>
          <div className="flex items-center gap-4">
            {profileImageUrl ? (
              <img
                src={profileImageUrl}
                alt="Profile"
                className="h-24 w-24 rounded-2xl border border-slate-200 object-cover shadow-sm dark:border-slate-700"
              />
            ) : (
              <div className="grid h-24 w-24 place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-2xl font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
                {displayName.slice(0, 1).toUpperCase() || "U"}
              </div>
            )}
            <div className="grid gap-1 text-sm">
              <p className="font-semibold text-slate-900 dark:text-slate-100">{displayName || authUser.name}</p>
              <p className="text-slate-600 dark:text-slate-300">{authUser.email}</p>
              <span className="w-fit rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 dark:border-brand-700/70 dark:bg-brand-900/30 dark:text-brand-200">
                {authUser.role}
              </span>
            </div>
          </div>
          {!profileImageUrl && <p className="text-sm text-slate-500 dark:text-slate-400">No profile image yet.</p>}
        </article>

        <article className="ui-card grid gap-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Profile Settings</h3>
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
          <label className="grid gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
            Profile image
            <input type="file" accept="image/*" onChange={(event) => void handleImageChange(event)} />
          </label>
          <div className="flex flex-wrap gap-3 pt-1">
            <button onClick={() => void handleSaveProfile()} disabled={busy} className="ui-btn-primary min-w-[10rem]">
              {busy ? "Saving..." : "Save Profile"}
            </button>
            <button onClick={() => setProfileImageUrl(null)} disabled={busy} className="ui-btn-secondary min-w-[10rem]">
              Remove Image
            </button>
          </div>
        </article>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        <article className="ui-card">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Created by Me</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="ui-chip">Open: {createdSummary.OPEN}</span>
            <span className="ui-chip">In progress: {createdSummary.IN_PROGRESS}</span>
            <span className="ui-chip">Closed: {createdSummary.CLOSED}</span>
          </div>
          {renderTicketList(createdByMe, "No created tickets yet.", "created")}
        </article>

        <article className="ui-card">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Assigned to Me</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="ui-chip">Open: {assignedSummary.OPEN}</span>
            <span className="ui-chip">In progress: {assignedSummary.IN_PROGRESS}</span>
            <span className="ui-chip">Closed: {assignedSummary.CLOSED}</span>
          </div>
          {renderTicketList(assignedToMe, "No assigned tickets yet.", "assigned")}
        </article>
      </section>

      {authUser.role === "AGENT" && (
        <section className="grid gap-5 md:grid-cols-2">
          <article className="ui-card">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">My Solved Tickets</h3>
            {renderTicketList(agentSolved, "No solved tickets yet.", "assigned")}
          </article>

          <article className="ui-card">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">My Open Assigned Tickets</h3>
            {renderTicketList(agentOpenAssigned, "No open assigned tickets.", "assigned")}
          </article>
        </section>
      )}

      {error && <p className="ui-alert-error">{error}</p>}
      {successMessage && <p className="ui-alert-success">{successMessage}</p>}
    </section>
  );
}
