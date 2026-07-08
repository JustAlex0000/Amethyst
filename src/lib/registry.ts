export type SectionId =
  | "text-editor"
  | "converter"
  | "data-tools"
  | "security"
  | "discord"
  | "dev-utilities";

export type ModuleMeta = {
  id: string;
  section: SectionId;
  name: string;
  description: string;
  keywords: string[];
};

export const SECTIONS: { id: SectionId; label: string }[] = [
  { id: "text-editor", label: "Text Editor" },
  { id: "converter", label: "Converter" },
  { id: "data-tools", label: "Data Tools" },
  { id: "security", label: "Security" },
  { id: "discord", label: "Discord" },
  { id: "dev-utilities", label: "Dev Utilities" },
];

import textEditor from "@/sections/text-editor/meta";
import converter from "@/sections/converter/meta";
import jwtDecoder from "@/sections/data-tools/jwt-decoder/meta";
import hashGenerator from "@/sections/data-tools/hash-generator/meta";
import passwordStrengthChecker from "@/sections/security/password-strength-checker/meta";
import embedBuilder from "@/sections/discord/embed-builder/meta";
import timestampGenerator from "@/sections/discord/timestamp-generator/meta";
import webhookManager from "@/sections/discord/webhook-manager/meta";
import permissionCalculator from "@/sections/discord/permission-calculator/meta";
import snowflakeDecoder from "@/sections/discord/snowflake-decoder/meta";
import timestampConverter from "@/sections/dev-utilities/timestamp-converter/meta";

export const MODULES: ModuleMeta[] = [
  textEditor,
  converter,
  jwtDecoder,
  hashGenerator,
  passwordStrengthChecker,
  embedBuilder,
  timestampGenerator,
  webhookManager,
  permissionCalculator,
  snowflakeDecoder,
  timestampConverter,
];

export function modulesBySection(section: SectionId): ModuleMeta[] {
  return MODULES.filter((m) => m.section === section);
}

export function getModule(section: string, id: string): ModuleMeta | undefined {
  return MODULES.find((m) => m.section === section && m.id === id);
}

export function modulePath(m: ModuleMeta): string {
  return `/tools/${m.section}/${m.id}`;
}
