/**
 * The SureGround mark: three solid steps in a rounded tile with a Volt node
 * on the top step (docs/brand-guide.md section 4). The tile and steps follow
 * the theme: Signal Blue tile and Carbon steps in dark mode, Carbon tile and
 * Bone steps in light mode. The node is always Volt. Minimum size is 24px.
 */
export function Logo({
  size = 32,
  title,
  className,
}: {
  size?: number;
  /** Accessible name. Omit when the logo sits next to visible text. */
  title?: string;
  className?: string;
}) {
  const decorative = !title;
  return (
    <svg
      width={Math.max(size, 24)}
      height={Math.max(size, 24)}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? true : undefined}
      focusable="false"
      className={className}
    >
      {title ? <title>{title}</title> : null}
      <rect width="64" height="64" rx="12" className="fill-logo-tile" />
      <path d="M12 50 V44 H24 V37 H36 V30 H50 V50 Z" className="fill-logo-steps" />
      <circle cx="43" cy="21" r="5" fill="#C6F36B" stroke="#0E1116" strokeWidth="2" />
    </svg>
  );
}
