"use client";

import { useTheme } from "next-themes";
import { useId, useSyncExternalStore } from "react";

import { MonitorIcon, MoonIcon, SunIcon } from "./icons";

const options = [
  { value: "system", label: "System", Icon: MonitorIcon },
  { value: "light", label: "Light", Icon: SunIcon },
  { value: "dark", label: "Dark", Icon: MoonIcon },
] as const;

const subscribe = () => () => {};

/** False during server render and hydration, true once mounted. */
function useMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

/**
 * Three-state theme switch built on native radio buttons, so arrow keys and
 * screen readers work without extra code. The server cannot know the saved
 * choice, so until mount it renders the same controls with none selected
 * (same size, no layout shift, no hydration mismatch).
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  const name = useId();

  return (
    <fieldset
      className={`inline-flex shrink-0 rounded-button border border-border p-0.5 ${className}`}
      data-theme-toggle
      data-ready={mounted ? "" : undefined}
    >
      <legend className="sr-only">Color theme</legend>
      {options.map(({ value, label, Icon }) => (
        <label
          key={value}
          title={label}
          className="inline-flex size-11 cursor-pointer items-center justify-center rounded-md text-muted hover:text-text has-checked:bg-surface has-checked:text-text has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent-text has-disabled:cursor-default"
        >
          <input
            type="radio"
            name={name}
            value={value}
            checked={mounted && theme === value}
            disabled={!mounted}
            onChange={() => setTheme(value)}
            className="sr-only"
          />
          <Icon />
          <span className="sr-only">{label}</span>
        </label>
      ))}
    </fieldset>
  );
}
