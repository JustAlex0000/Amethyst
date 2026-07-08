export type Lean = "flag" | "neutral" | "varied";

export type StyleSignal = {
  name: string;
  value: string;
  note: string;
  lean: Lean;
};

export type TellHit = { phrase: string; index: number; length: number };

const TELLS: RegExp[] = [
  /\bdelve(?:s|d)?\b/gi,
  /\btapestr(?:y|ies)\b/gi,
  /\bit(?:'|’)s important to note\b/gi,
  /\bit is important to note\b/gi,
  /\bin today(?:'|’)s .{0,20}(?:landscape|world|environment)\b/gi,
  /\bnavigat(?:e|ing) the .{0,20}landscape\b/gi,
  /\bin conclusion\b/gi,
  /\bmoreover\b/gi,
  /\bfurthermore\b/gi,
  /\badditionally\b/gi,
  /\bgame.?changer\b/gi,
  /\bunlock(?:s|ing)? the (?:power|potential)\b/gi,
  /\bdive (?:deep(?:er)? )?into\b/gi,
  /\bseamless(?:ly)?\b/gi,
  /\bleverag(?:e|ing)\b/gi,
  /\bela?vate\b/gi,
  /\bnot (?:just|only) \w[\w\s]{0,30}?,? but (?:also )?\w/gi,
];

export function findTells(text: string): TellHit[] {
  const hits: TellHit[] = [];
  for (const re of TELLS) {
    re.lastIndex = 0;
    for (const m of text.matchAll(re)) {
      hits.push({ phrase: m[0], index: m.index ?? 0, length: m[0].length });
    }
  }
  return hits.sort((a, b) => a.index - b.index);
}

function cv(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (mean === 0) return 0;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance) / mean;
}

export function analyzeStyle(text: string): { signals: StyleSignal[]; tells: TellHit[] } | null {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (sentences.length < 5 || words.length < 80) return null;

  const signals: StyleSignal[] = [];

  const sentLens = sentences.map((s) => s.split(/\s+/).length);
  const sentCv = cv(sentLens);
  signals.push({
    name: "Sentence-length variation",
    value: `CV ${sentCv.toFixed(2)} over ${sentences.length} sentences`,
    note:
      sentCv < 0.35
        ? "Unusually uniform sentence lengths — low burstiness."
        : sentCv > 0.55
          ? "High variation, typical of human drafting."
          : "Middling variation.",
    lean: sentCv < 0.35 ? "flag" : sentCv > 0.55 ? "varied" : "neutral",
  });

  const cleaned = words.map((w) => w.replace(/[^\p{L}’']/gu, "")).filter(Boolean);
  const wordCv = cv(cleaned.map((w) => w.length));
  signals.push({
    name: "Word-length variation",
    value: `CV ${wordCv.toFixed(2)}`,
    note: wordCv < 0.4 ? "Narrow word-length spread." : "Normal word-length spread.",
    lean: wordCv < 0.4 ? "flag" : "neutral",
  });

  const lower = cleaned.map((w) => w.toLowerCase());
  const ttr = new Set(lower).size / lower.length;
  signals.push({
    name: "Vocabulary diversity",
    value: `${(ttr * 100).toFixed(1)}% unique words`,
    note: ttr < 0.38 ? "Heavy repetition of the same words." : "Reasonable lexical spread.",
    lean: ttr < 0.38 ? "flag" : "neutral",
  });

  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length >= 3) {
    const paraCv = cv(paragraphs.map((p) => p.split(/\s+/).length));
    signals.push({
      name: "Paragraph uniformity",
      value: `CV ${paraCv.toFixed(2)} over ${paragraphs.length} paragraphs`,
      note: paraCv < 0.3 ? "Paragraphs are near-identical in length." : "Paragraph lengths vary naturally.",
      lean: paraCv < 0.3 ? "flag" : "neutral",
    });
  }

  const openers = sentences.map((s) => s.split(/\s+/).slice(0, 2).join(" ").toLowerCase());
  const counts = new Map<string, number>();
  for (const o of openers) counts.set(o, (counts.get(o) ?? 0) + 1);
  const repeatedOpeners = [...counts.entries()].filter(([, c]) => c >= 3);
  signals.push({
    name: "Sentence openers",
    value: repeatedOpeners.length
      ? repeatedOpeners.map(([o, c]) => `“${o}” ×${c}`).join(", ")
      : "no opener repeats 3+ times",
    note: repeatedOpeners.length ? "Repeated opening patterns." : "Varied sentence starts.",
    lean: repeatedOpeners.length ? "flag" : "neutral",
  });

  const emDashes = (text.match(/—/g) ?? []).length;
  const dashRate = (emDashes / words.length) * 1000;
  signals.push({
    name: "Em-dash use",
    value: `${emDashes} (${dashRate.toFixed(1)} per 1000 words)`,
    note: dashRate > 8 ? "Heavier than typical prose." : "Within normal range.",
    lean: dashRate > 8 ? "flag" : "neutral",
  });

  return { signals, tells: findTells(text) };
}
