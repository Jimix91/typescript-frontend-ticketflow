import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { api } from "../api";
import { Comment, Ticket, TicketStatus, User } from "../types";
import { StatusBadge } from "../components/StatusBadge";

type Props = {
  ticket: Ticket;
  authUser: User;
  onBack: () => void;
  onTicketUpdate: (ticket: Ticket) => void;
};

export function TicketResolutionPage({ ticket, authUser, onBack, onTicketUpdate }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [commentImageUrl, setCommentImageUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<TicketStatus>(ticket.status);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStatus(ticket.status);
  }, [ticket.status]);

  useEffect(() => {
    const loadComments = async () => {
      try {
        setLoadingComments(true);
        const payload = await api.getTaskComments(ticket.id);
        setComments(payload);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Could not load comments");
      } finally {
        setLoadingComments(false);
      }
    };

    void loadComments();
  }, [ticket.id]);

  const handleCommentImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setCommentImageUrl(null);
      return;
    }

    const reader = new FileReader();
    const encodedImage = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Could not read image"));
      reader.readAsDataURL(file);
    });

    setCommentImageUrl(encodedImage);
  };

  const handleAddComment = async (event: FormEvent) => {
    event.preventDefault();
    if (!commentText.trim() && !commentImageUrl) {
      return;
    }

    try {
      setBusy(true);
      const created = await api.createTaskComment(ticket.id, {
        content: commentText.trim() || "Image update",
        imageUrl: commentImageUrl,
      });
      setComments((prev) => [...prev, created]);
      setCommentText("");
      setCommentImageUrl(null);
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not add comment");
    } finally {
      setBusy(false);
    }
  };

  const handleStatusChange = async () => {
    if (status === ticket.status) {
      return;
    }

    try {
      setBusy(true);
      const updated = await api.updateTask(ticket.id, { status });
      onTicketUpdate(updated);
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not update status");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section>
      <h2>Ticket Resolution</h2>
      <section className="card">
        <h3>{ticket.title}</h3>
        <p>{ticket.description}</p>
        {ticket.imageUrl && (
          <img src={ticket.imageUrl} alt="Incident attachment" style={{ maxWidth: "320px", borderRadius: "8px" }} />
        )}
        <p>
          Assigned agent: {ticket.assignedTo?.name ?? authUser.name} · <StatusBadge status={ticket.status} />
        </p>
        <p>Created at: {new Date(ticket.createdAt).toLocaleDateString()}</p>
        {ticket.status === "CLOSED" && <p>Closed at: {new Date(ticket.updatedAt).toLocaleDateString()}</p>}
        <div className="actions">
          <select value={status} onChange={(event) => setStatus(event.target.value as TicketStatus)} disabled={busy}>
            <option value="OPEN">OPEN</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="CLOSED">CLOSED</option>
          </select>
          <button onClick={() => void handleStatusChange()} disabled={busy || status === ticket.status}>
            Save Status
          </button>
        </div>
      </section>

      <section className="card">
        <h3>Add Resolution Comment</h3>
        <form onSubmit={(event) => void handleAddComment(event)} className="grid-form">
          <textarea
            value={commentText}
            onChange={(event) => setCommentText(event.target.value)}
            placeholder="Write your resolution steps or update"
            rows={3}
          />
          <input type="file" accept="image/*" onChange={(event) => void handleCommentImageChange(event)} />
          {commentImageUrl && (
            <img
              src={commentImageUrl}
              alt="Comment attachment preview"
              style={{ maxWidth: "260px", borderRadius: "8px" }}
            />
          )}
          <div className="actions">
            <button type="submit" disabled={busy}>
              Add Comment
            </button>
            {commentImageUrl && (
              <button type="button" onClick={() => setCommentImageUrl(null)} disabled={busy}>
                Remove Image
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="card">
        <h3>Resolution Timeline</h3>
        {loadingComments ? (
          <p>Loading comments...</p>
        ) : comments.length === 0 ? (
          <p>No comments yet.</p>
        ) : (
          comments.map((comment) => (
            <article key={comment.id} className="task-item">
              <p>
                <strong>{comment.author?.name ?? "Unknown"}</strong> · {new Date(comment.createdAt).toLocaleString()}
              </p>
              <p>{comment.content}</p>
              {comment.imageUrl && (
                <img src={comment.imageUrl} alt="Comment attachment" style={{ maxWidth: "260px", borderRadius: "8px" }} />
              )}
            </article>
          ))
        )}
      </section>

      {error && <p className="error">{error}</p>}

      <button onClick={onBack}>Back to Dashboard</button>
    </section>
  );
}
