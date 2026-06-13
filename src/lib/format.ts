export function formatDate(value: string | null) {
  if (!value) {
    return "Never";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function countToday(items: { createdAt: string }[]) {
  const today = new Date().toDateString();
  return items.filter((item) => new Date(item.createdAt).toDateString() === today).length;
}
