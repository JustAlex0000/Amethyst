"use client";

import { PERMISSIONS } from "@/lib/discord";

export function PermissionPicker({
  value,
  onChange,
}: {
  value: bigint;
  onChange: (v: bigint) => void;
}) {
  return (
    <div className="grid gap-x-4 sm:grid-cols-2 lg:grid-cols-3">
      {PERMISSIONS.map((p) => {
        const mask = 1n << BigInt(p.bit);
        const checked = (value & mask) !== 0n;
        return (
          <label
            key={p.bit}
            className="flex cursor-pointer items-center gap-2 border-b border-line/40 py-1.5 text-sm"
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => onChange(e.target.checked ? value | mask : value & ~mask)}
              className="accent-(--amethyst)"
            />
            <span className={checked ? "text-text" : "text-dim"}>{p.name}</span>
            <span className="ml-auto font-mono text-[10px] text-dim" data-numeric>
              {p.bit}
            </span>
          </label>
        );
      })}
    </div>
  );
}
