export function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function bandLabel(band: string | null): string {
  if (band === "interview-ready") return "Interview-ready";
  if (band === "solid") return "Solid";
  if (band === "developing") return "Developing";
  if (band === "fragile") return "Fragile";
  return "Unscored";
}

export function difficultyLabel(value: string): string {
  return value;
}
