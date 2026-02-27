import { TicketStatus } from "../types";

type Props = {
  status: TicketStatus;
};

export function StatusBadge({ status }: Props) {
  const colorClassByStatus: Record<TicketStatus, string> = {
    OPEN: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800/60 dark:bg-sky-900/30 dark:text-sky-300",
    IN_PROGRESS: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-900/30 dark:text-amber-300",
    CLOSED: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-900/30 dark:text-emerald-300",
  };

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold tracking-wide ${colorClassByStatus[status]}`}>
      {status}
    </span>
  );
}
