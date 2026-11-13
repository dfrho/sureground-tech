/** Step counter in mono with a bar. The text carries the meaning; the bar is decoration. */
export function Progress({ step, total, label }: { step: number; total: number; label: string }) {
  const percent = Math.round((step / total) * 100);
  return (
    <div className="flex flex-col gap-2" data-testid="scorecard-progress">
      <p className="font-mono text-label text-muted uppercase">{label}</p>
      <div aria-hidden="true" className="h-2 w-full overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-accent-fill transition-[width] motion-reduce:transition-none"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
