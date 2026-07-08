import Link from "next/link";

function Mark({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect x="1" y="1" width="8" height="8" rx="1.5" className="stroke-[var(--line)]" strokeWidth="1.5" />
      <rect x="11" y="1" width="8" height="8" rx="1.5" className="stroke-[var(--line)]" strokeWidth="1.5" />
      <rect x="1" y="11" width="8" height="8" rx="1.5" className="stroke-[var(--line)]" strokeWidth="1.5" />
      <rect x="11" y="11" width="8" height="8" rx="1.5" className="fill-[var(--amethyst)]" />
    </svg>
  );
}

export function Wordmark({ size = "sm" }: { size?: "sm" | "lg" }) {
  const text = (
    <span
      className={`font-display font-semibold tracking-[-0.03em] text-text ${
        size === "lg" ? "text-[2.75rem] leading-none" : "text-[1.35rem] leading-none"
      }`}
      style={{ fontVariationSettings: '"SOFT" 70' }}
    >
      Amethyst
    </span>
  );

  if (size === "lg") {
    return (
      <span className="flex items-center gap-3">
        <Mark size={26} />
        {text}
      </span>
    );
  }

  return (
    <Link href="/" className="flex items-center gap-2" aria-label="Amethyst home">
      <Mark size={16} />
      {text}
    </Link>
  );
}
