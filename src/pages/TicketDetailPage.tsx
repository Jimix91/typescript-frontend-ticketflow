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
    <section>
      <h2>Ticket Detail</h2>
      <TicketCard ticket={ticket} users={users} onEdit={onEdit} onDelete={onDelete} canManage={canManage} />

      {canComment && (
        <section className="card">
          <h3>Add Comment</h3>
          <form onSubmit={(event) => void handleAddComment(event)} className="grid-form">
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
                style={{ maxWidth: "260px", borderRadius: "8px" }}
              />
            )}
            <div className="actions">
              <button type="submit" disabled={savingComment}>
                Add Comment
              </button>
              {commentImageUrl && (
                <button type="button" onClick={() => setCommentImageUrl(null)} disabled={savingComment}>
                  Remove Image
                </button>
              )}
            </div>
          </form>
        </section>
      )}

      <section className="card">
        <h3>Comments</h3>
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
