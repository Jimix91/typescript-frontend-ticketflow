export function formatRelativeDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  const now = new Date();

  const startOfNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((startOfNow.getTime() - startOfDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return "today";
  }

  if (diffDays === 1) {
    return "1 day ago";
  }

  return `${diffDays} days ago`;
}
