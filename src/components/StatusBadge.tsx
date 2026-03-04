import { InProgressSubStatus, TicketStatus } from "../types";

type Props = {
  status: TicketStatus;
  inProgressSubStatus?: InProgressSubStatus | null;
};

export function StatusBadge({ status, inProgressSubStatus = null }: Props) {
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

  const inProgressDetailLabel: Record<InProgressSubStatus, string> = {
    PENDING_AGENT: "Pending Agent",
    PENDING_EMPLOYEE: "Pending Employee",
  };

  const detailLabel =
    status === "IN_PROGRESS" && inProgressSubStatus
      ? ` · ${inProgressDetailLabel[inProgressSubStatus]}`
      : "";

  return (
    <span className={`ui-badge shrink-0 px-2 py-0.5 text-[0.7rem] ${colorClassByStatus[status]}`}>
      {labelByStatus[status]}{detailLabel}
    </span>
  );
}
