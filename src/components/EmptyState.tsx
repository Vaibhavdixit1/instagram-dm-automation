import { Inbox } from "lucide-react";

export function EmptyState({ title }: { title: string }) {
  return (
    <div className="grid min-h-56 place-items-center border border-dashed border-line bg-white p-6 text-center">
      <div>
        <Inbox className="mx-auto text-muted" size={34} />
        <p className="mt-3 font-semibold text-ink">{title}</p>
      </div>
    </div>
  );
}
