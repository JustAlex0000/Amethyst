"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

function loading() {
  return <div className="p-6 font-mono text-sm text-dim">Loading…</div>;
}

export const MODULE_COMPONENTS: Record<string, ComponentType> = {
  "text-editor/text-editor": dynamic(() => import("@/sections/text-editor"), { loading }),
  "converter/converter": dynamic(() => import("@/sections/converter"), { loading }),
  "data-tools/jwt-decoder": dynamic(() => import("@/sections/data-tools/jwt-decoder"), { loading }),
  "data-tools/hash-generator": dynamic(() => import("@/sections/data-tools/hash-generator"), { loading }),
  "security/password-strength-checker": dynamic(() => import("@/sections/security/password-strength-checker"), { loading }),
  "discord/embed-builder": dynamic(() => import("@/sections/discord/embed-builder"), { loading }),
  "discord/timestamp-generator": dynamic(() => import("@/sections/discord/timestamp-generator"), { loading }),
  "discord/webhook-manager": dynamic(() => import("@/sections/discord/webhook-manager"), { loading }),
  "discord/permission-calculator": dynamic(() => import("@/sections/discord/permission-calculator"), { loading }),
  "discord/snowflake-decoder": dynamic(() => import("@/sections/discord/snowflake-decoder"), { loading }),
  "dev-utilities/timestamp-converter": dynamic(() => import("@/sections/dev-utilities/timestamp-converter"), { loading }),
};
