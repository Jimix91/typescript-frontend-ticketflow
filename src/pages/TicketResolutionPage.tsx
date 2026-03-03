import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { api } from "../api";
import { formatRelativeDate } from "../time";
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
    <section className="ui-section-stack">
      <header className="ui-card relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-sky-100/70 to-transparent dark:from-slate-800/40" />
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="ui-title">Ticket Resolution</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">Resolve, document outcomes, and close the feedback loop with clear updates.</p>
          </div>
          <StatusBadge status={ticket.status} />
        </div>
      </header>

      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section className="ui-card">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{ticket.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{ticket.description}</p>
          {ticket.imageUrl && (
            <img src={ticket.imageUrl} alt="Incident attachment" className="mt-4 w-full max-w-md rounded-xl border border-slate-200 object-cover dark:border-slate-800" />
          )}

          <div className="mt-4 grid gap-2 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">
            <p><span className="font-semibold text-slate-800 dark:text-slate-200">Assigned agent:</span> {ticket.assignedTo?.name ?? authUser.name}</p>
            <p><span className="font-semibold text-slate-800 dark:text-slate-200">Created:</span> {formatRelativeDate(ticket.createdAt)}</p>
            {ticket.status === "CLOSED" && <p><span className="font-semibold text-slate-800 dark:text-slate-200">Closed:</span> {formatRelativeDate(ticket.updatedAt)}</p>}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <select value={status} onChange={(event) => setStatus(event.target.value as TicketStatus)} disabled={busy}>
              <option value="OPEN">OPEN</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="CLOSED">CLOSED</option>
            </select>
            <button onClick={() => void handleStatusChange()} disabled={busy || status === ticket.status} className="ui-btn-primary">
              Save Status
            </button>
          </div>
        </section>

        <aside className="ui-card grid gap-4 self-start">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Resolution Snapshot</h3>
          <div className="grid gap-3 text-sm">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/60">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Created</p>
              <p className="mt-1 font-semibold text-slate-800 dark:text-slate-100">{formatRelativeDate(ticket.createdAt)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/60">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Last update</p>
              <p className="mt-1 font-semibold text-slate-800 dark:text-slate-100">{formatRelativeDate(ticket.updatedAt)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/60">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Activity</p>
              <p className="mt-1 font-semibold text-slate-800 dark:text-slate-100">{comments.length} comment{comments.length === 1 ? "" : "s"}</p>
            </div>
          </div>
        </aside>
      </section>

      <section className="ui-card">
        <h3 className="mb-1 text-lg font-bold text-slate-900 dark:text-slate-100">Add Resolution Comment</h3>
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">Document actions taken and add proof to keep the resolution history transparent.</p>
        <form onSubmit={(event) => void handleAddComment(event)} className="grid gap-3">
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
              className="w-full max-w-xs rounded-xl border border-slate-200 object-cover dark:border-slate-700"
            />
          )}
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={busy} className="ui-btn-primary">
              Add Comment
            </button>
            {commentImageUrl && (
              <button type="button" onClick={() => setCommentImageUrl(null)} disabled={busy} className="ui-btn-secondary">
                Remove Image
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="ui-card">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Resolution Timeline</h3>
          <span className="ui-chip">{comments.length} total</span>
        </div>
        {loadingComments ? (
          <p className="text-sm text-slate-600 dark:text-slate-300">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-300">No comments yet.</p>
        ) : (
          <div className="grid gap-3">
          {comments.map((comment) => (
            <article key={comment.id} className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950/50">
              <div className="flex items-center justify-between gap-3">
                <p className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-[0.65rem] font-bold text-white dark:bg-slate-200 dark:text-slate-900">
                    {(comment.author?.name ?? "U").charAt(0).toUpperCase()}
                  </span>
                  <strong className="text-slate-700 dark:text-slate-200">{comment.author?.name ?? "Unknown"}</strong>
                </p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{formatRelativeDate(comment.createdAt)}</p>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300">{comment.content}</p>
              {comment.imageUrl && (
                <img src={comment.imageUrl} alt="Comment attachment" className="w-full max-w-xs rounded-xl border border-slate-200 object-cover dark:border-slate-700" />
              )}
            </article>
          ))}
          </div>
        )}
      </section>

      {error && <p className="ui-alert-error">{error}</p>}

      <div className="pt-1">
        <button onClick={onBack} className="ui-btn-secondary">Back to Dashboard</button>
      </div>
    </section>
  );
}
