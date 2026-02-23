import { TicketStatus } from "../types";

type Props = {
  status: TicketStatus;
};

export function StatusBadge({ status }: Props) {
  const className = `status-badge status-${status.toLowerCase()}`;
  return <span className={className}>{status}</span>;
}
