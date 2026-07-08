export type InjectionRule = { re: RegExp; label: string; weight: number };

export const INJECTION_RULES: InjectionRule[] = [
  { re: /ignore\s+(all\s+|any\s+)?(previous|prior|above|earlier)\s+(instructions?|prompts?|rules?|context)/i, label: "Instruction override", weight: 5 },
  { re: /disregard\s+(all\s+|your\s+)?(previous|prior|system)\s+(instructions?|prompts?|rules?)/i, label: "Instruction override", weight: 5 },
  { re: /forget\s+(everything|all|your)\s+(you|instructions?|training|rules?)/i, label: "Memory reset attempt", weight: 4 },
  { re: /you\s+are\s+now\s+(a|an|in)\b/i, label: "Role reassignment", weight: 3 },
  { re: /\b(DAN|jailbreak|developer\s+mode|god\s+mode)\b/i, label: "Known jailbreak keyword", weight: 3 },
  { re: /system\s*prompt|initial\s+prompt|hidden\s+(instructions?|prompt)/i, label: "System-prompt probing", weight: 3 },
  { re: /(reveal|show|print|repeat|output)\s+(your|the)\s+(system\s+prompt|instructions?|rules?)/i, label: "Prompt extraction", weight: 5 },
  { re: /pretend\s+(you\s+are|to\s+be)\b/i, label: "Persona coercion", weight: 2 },
  { re: /do\s+not\s+(follow|obey|listen\s+to)\s+(the|your|any)/i, label: "Anti-instruction phrasing", weight: 3 },
  { re: /\bBEGIN\s+(NEW\s+)?(SYSTEM|ADMIN|ROOT)\b/i, label: "Fake system delimiter", weight: 3 },
  { re: /<\|?(im_start|im_end|system|endoftext)\|?>/i, label: "Model control tokens", weight: 5 },
  { re: /\[\s*(system|assistant|inst)\s*\]/i, label: "Chat-template markers", weight: 3 },
  { re: /override\s+(safety|security|content)\s+(policy|filter|guideline)/i, label: "Safety override", weight: 5 },
  { re: /base64|rot13|hex-?encoded/i, label: "Encoding mention (possible smuggling)", weight: 2 },
  { re: /respond\s+only\s+with|you\s+must\s+(always|never)\b/i, label: "Output coercion", weight: 2 },
];

export type InjectionHit = { rule: InjectionRule; match: string; index: number };

export function scanInjection(text: string): InjectionHit[] {
  const hits: InjectionHit[] = [];
  for (const rule of INJECTION_RULES) {
    const re = new RegExp(rule.re.source, rule.re.flags + "g");
    for (const m of text.matchAll(re)) {
      hits.push({ rule, match: m[0], index: m.index ?? 0 });
    }
  }
  return hits.sort((a, b) => a.index - b.index);
}

export function injectionScore(hits: InjectionHit[]): number {
  return Math.min(100, hits.reduce((s, h) => s + h.rule.weight * 8, 0));
}
