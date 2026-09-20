type ActivityStatusProps = {
  label: string | null;
};

/** Generic activity indicator from contract stream events only. */
export function ActivityStatus({ label }: ActivityStatusProps) {
  if (!label) return null;
  return (
    <div className="activity" role="status" aria-live="polite">
      {label}…
    </div>
  );
}
