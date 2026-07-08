import type { ModuleMeta } from "@/lib/registry";

const meta: ModuleMeta = {
  id: "jwt-decoder",
  section: "data-tools",
  name: "JWT Decoder",
  description: "Decode JWT header and payload. Flags expired tokens. Does not verify signatures.",
  keywords: ["jwt", "token", "decode", "auth", "claims"],
};

export default meta;
