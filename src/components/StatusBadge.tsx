import { TicketStatus } from "../types";

type Props = {
  status: TicketStatus;
};

export function StatusBadge({ status }: Props) {
  const colorClassByStatus: Record<TicketStatus, string> = {
    OPEN: "bg-blue-100 text-blue-700",
    IN_PROGRESS: "bg-amber-100 text-amber-700",
    CLOSED: "bg-emerald-100 text-emerald-700",
  };

  const labelByStatus: Record<TicketStatus, string> = {
    OPEN: "Open",
    IN_PROGRESS: "In Progress",
    CLOSED: "Closed",
  };

  return (
    <span className={`ui-badge shrink-0 ${colorClassByStatus[status]}`}>
      {labelByStatus[status]}
    </span>
  );
}
