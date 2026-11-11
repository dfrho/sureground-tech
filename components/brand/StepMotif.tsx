/**
 * The stepped motif from the logo, drawn large beside the hero copy. Three
 * steps rise once on load when motion is allowed (globals.css `.step-motif`);
 * with reduced motion they are simply there. Decorative only.
 */
export function StepMotif({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 240"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className={`step-motif ${className}`.trim()}
    >
      <line x1="0" y1="232" x2="320" y2="232" className="stroke-border" strokeWidth="2" />
      <rect
        x="24"
        y="168"
        width="88"
        height="64"
        rx="4"
        className="step fill-surface stroke-border"
        strokeWidth="2"
      />
      <rect
        x="116"
        y="112"
        width="88"
        height="120"
        rx="4"
        className="step fill-surface stroke-border"
        strokeWidth="2"
      />
      <rect x="208" y="56" width="88" height="176" rx="4" className="step fill-accent-fill" />
      <circle cx="252" cy="32" r="12" className="step-node fill-highlight" />
      <text x="36" y="200" className="fill-muted font-mono" fontSize="13">
        01
      </text>
      <text x="128" y="144" className="fill-muted font-mono" fontSize="13">
        02
      </text>
      <text x="220" y="88" className="fill-on-accent font-mono" fontSize="13">
        03
      </text>
    </svg>
  );
}
