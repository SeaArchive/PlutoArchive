import { blockTypes, type Block } from "../types";
export function validateBlocks(value: unknown): value is Block[] {
  return (
    Array.isArray(value) &&
    value.length <= 100 &&
    value.every(
      (b) =>
        b &&
        typeof b.id === "string" &&
        blockTypes.includes(b.type) &&
        b.schemaVersion === 1 &&
        Number.isInteger(b.position) &&
        b.data &&
        typeof b.data === "object" &&
        !Array.isArray(b.data) &&
        b.settings &&
        typeof b.settings === "object" &&
        !Array.isArray(b.settings),
    )
  );
}
export function newBlock(type: Block["type"], position: number): Block {
  return {
    id: crypto.randomUUID(),
    type,
    schemaVersion: 1,
    data: { text: "" },
    settings: {},
    position,
  };
}
export function safeUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return;
  try {
    const url = new URL(value);
    if (url.protocol === "https:") return url.href;
  } catch {}
}
