/**
 * **Sure**Ground: "Sure" in the text color, "Ground" in the accent text
 * color, Space Grotesk 700 with -2% tracking. Never split across two lines.
 */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display font-bold tracking-[-0.02em] whitespace-nowrap ${className}`}>
      <span className="text-text">Sure</span>
      <span className="text-accent-text">Ground</span>
    </span>
  );
}
