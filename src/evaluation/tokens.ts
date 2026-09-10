const STOP = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "into",
  "class",
  "system",
  "using",
  "data",
  "type",
  "just",
  "have",
  "will",
]);

export function tokenize(text: string): Set<string> {
  const splitCamel = text.replace(/([a-z])([A-Z])/g, "$1 $2");
  const words = splitCamel.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  return new Set(words.filter((word) => word.length > 2 && !STOP.has(word)));
}

export function signalHits(tokens: Set<string>, signal: string): boolean {
  const parts = signal.toLowerCase().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return false;
  if (parts.length === 1) {
    const key = parts[0];
    if (tokens.has(key)) return true;
    for (const token of tokens) {
      if (token.startsWith(key) && token.length <= key.length + 5) return true;
      if (key.startsWith(token) && key.length <= token.length + 3 && token.length > 3) return true;
    }
    return false;
  }
  return parts.every((part) => signalHits(tokens, part));
}

export function matchingSignals(tokens: Set<string>, signals: string[]): string[] {
  const hits: string[] = [];
  for (const signal of signals) {
    if (signalHits(tokens, signal) && !hits.includes(signal)) hits.push(signal);
  }
  return hits;
}
