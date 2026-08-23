import { getTranslations } from "next-intl/server";

const MESSAGE_KEYS = [
  "plan.noDoubleProgression",
  "plan.reconcileDone",
  "heat.effortOnly",
  "heat.caution",
  "heat.mild",
  "heat.ok",
  "pain.deload",
  "pain.stop",
  "pain.none",
  "detrain.rebaseline",
  "detrain.severe",
  "detrain.mild",
  "detrain.none",
] as const;

export type MessageKey = (typeof MESSAGE_KEYS)[number];

export function isMessageKey(key: string): key is MessageKey {
  return (MESSAGE_KEYS as readonly string[]).includes(key);
}

export async function translateMessageKey(key: string): Promise<string> {
  if (!isMessageKey(key)) return key;
  const t = await getTranslations();
  return t(key);
}
