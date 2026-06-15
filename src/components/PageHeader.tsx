export function PageHeader({
  title,
  eyebrow,
  action,
}: {
  title: string;
  eyebrow?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        {eyebrow ? <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand">{eyebrow}</p> : null}
        <h1 className="mt-1 text-2xl font-bold text-ink sm:text-[2rem]">{title}</h1>
      </div>
      {action}
    </div>
  );
}
