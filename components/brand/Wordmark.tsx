/**
 * **Sure**Ground Tech: "Sure" and "Tech" in the text color, "Ground" in the
 * accent text color, Space Grotesk 700 with -2% tracking. Never split across
 * two lines. (Name changed to SureGround Tech by David, 2026-11-14.)
 */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display font-bold tracking-[-0.02em] whitespace-nowrap ${className}`}>
      <span className="text-text">Sure</span>
      <span className="text-accent-text">Ground</span>
      <span className="text-text"> Tech</span>
    </span>
  );
}
