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
    <section>
      <h2>My Profile</h2>

      <section className="card grid-form">
        <h3>User Area</h3>
        <p>Email: {authUser.email}</p>
        <p>Role: {authUser.role}</p>

        {profileImageUrl ? (
          <img src={profileImageUrl} alt="Profile" style={{ width: "120px", height: "120px", borderRadius: "50%", objectFit: "cover" }} />
        ) : (
          <p>No profile image yet.</p>
        )}

        <label className="date-filter">
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

        <div className="actions">
          <button onClick={() => void handleSaveProfile()} disabled={busy}>
            Save Profile
          </button>
          <button onClick={() => setProfileImageUrl(null)} disabled={busy}>
            Remove Image
          </button>
        </div>
      </section>

      <section className="card">
        <h3>Created by Me</h3>
        <p>Open: {createdSummary.OPEN} · In progress: {createdSummary.IN_PROGRESS} · Closed: {createdSummary.CLOSED}</p>
        {createdByMe.length === 0 ? (
          <p>No created tickets yet.</p>
        ) : (
          <ul className="task-list">
            {createdByMe.map((ticket) => (
              <li key={ticket.id} className="task-item">
                <strong>{ticket.title}</strong>
                <span>Status: {ticket.status}</span>
                <span>Created at: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                {ticket.status === "CLOSED" && <span>Closed at: {new Date(ticket.updatedAt).toLocaleDateString()}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h3>Assigned to Me</h3>
        <p>Open: {assignedSummary.OPEN} · In progress: {assignedSummary.IN_PROGRESS} · Closed: {assignedSummary.CLOSED}</p>
        {assignedToMe.length === 0 ? (
          <p>No assigned tickets yet.</p>
        ) : (
          <ul className="task-list">
            {assignedToMe.map((ticket) => (
              <li key={ticket.id} className="task-item">
                <strong>{ticket.title}</strong>
                <span>Status: {ticket.status}</span>
                <span>Created at: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                {ticket.status === "CLOSED" && <span>Closed at: {new Date(ticket.updatedAt).toLocaleDateString()}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {authUser.role === "AGENT" && (
        <>
          <section className="card">
            <h3>My Solved Tickets</h3>
            {agentSolved.length === 0 ? (
              <p>No solved tickets yet.</p>
            ) : (
              <ul className="task-list">
                {agentSolved.map((ticket) => (
                  <li key={ticket.id} className="task-item">
                    <strong>{ticket.title}</strong>
                    <span>Closed at: {new Date(ticket.updatedAt).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card">
            <h3>My Open Assigned Tickets</h3>
            {agentOpenAssigned.length === 0 ? (
              <p>No open assigned tickets.</p>
            ) : (
              <ul className="task-list">
                {agentOpenAssigned.map((ticket) => (
                  <li key={ticket.id} className="task-item">
                    <strong>{ticket.title}</strong>
                    <span>Status: {ticket.status}</span>
                    <span>Created at: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {error && <p className="error">{error}</p>}
      {successMessage && <p>{successMessage}</p>}

      <button onClick={onBack}>Back to Dashboard</button>
    </section>
  );
}
