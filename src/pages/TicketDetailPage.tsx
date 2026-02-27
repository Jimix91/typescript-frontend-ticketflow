import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { api } from "../api";
import { TicketCard } from "../components/TicketCard";
import { Comment, Ticket, User } from "../types";

type Props = {
  ticket: Ticket;
  authUser: User;
  users: User[];
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function TicketDetailPage({ ticket, authUser, users, onBack, onEdit, onDelete }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [commentImageUrl, setCommentImageUrl] = useState<string | null>(null);
  const [savingComment, setSavingComment] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canManage =
    authUser.role === "ADMIN" ||
    (authUser.role === "EMPLOYEE" && ticket.createdById === authUser.id) ||
    (authUser.role === "AGENT" && ticket.assignedToId === authUser.id);

  const canComment = canManage;

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
      setSavingComment(true);
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
      setSavingComment(false);
    }
  };

  return (
    <section className="ui-section-stack">
      <h2 className="ui-title">Ticket Detail</h2>
      <TicketCard ticket={ticket} users={users} onEdit={onEdit} onDelete={onDelete} canManage={canManage} />

      {canComment && (
        <section className="ui-card">
          <h3 className="mb-3 text-lg font-bold text-slate-900 dark:text-slate-100">Add Comment</h3>
          <form onSubmit={(event) => void handleAddComment(event)} className="grid gap-3">
            <textarea
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder="Write your update"
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
              <button type="submit" disabled={savingComment} className="ui-btn-primary">
                Add Comment
              </button>
              {commentImageUrl && (
                <button type="button" onClick={() => setCommentImageUrl(null)} disabled={savingComment} className="ui-btn-secondary">
                  Remove Image
                </button>
              )}
            </div>
          </form>
        </section>
      )}

      <section className="ui-card">
        <h3 className="mb-3 text-lg font-bold text-slate-900 dark:text-slate-100">Comments</h3>
        {loadingComments ? (
          <p className="text-sm text-slate-600 dark:text-slate-300">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-300">No comments yet.</p>
        ) : (
          <div className="grid gap-3">
          {comments.map((comment) => (
            <article key={comment.id} className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950/50">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                <strong>{comment.author?.name ?? "Unknown"}</strong> · {new Date(comment.createdAt).toLocaleString()}
              </p>
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

      <div>
        <button onClick={onBack} className="ui-btn-secondary">Back to Dashboard</button>
      </div>
    </section>
  );
}
