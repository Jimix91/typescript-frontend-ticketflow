import { useEffect, useState } from "react";
import { api } from "../api";
import { TicketCard } from "../components/TicketCard";
import { Comment, Ticket, User } from "../types";

type Props = {
  ticket: Ticket;
  users: User[];
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function TicketDetailPage({ ticket, users, onBack, onEdit, onDelete }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);

  useEffect(() => {
    const loadComments = async () => {
      try {
        setLoadingComments(true);
        const payload = await api.getTaskComments(ticket.id);
        setComments(payload);
      } catch (_error) {
      } finally {
        setLoadingComments(false);
      }
    };

    void loadComments();
  }, [ticket.id]);

  return (
    <section>
      <h2>Ticket Detail</h2>
      <TicketCard ticket={ticket} users={users} onEdit={onEdit} onDelete={onDelete} />

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

      <button onClick={onBack}>Back to Dashboard</button>
    </section>
  );
}
