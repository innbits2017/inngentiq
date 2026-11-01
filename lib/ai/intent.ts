export type UserIntent =
  | "knowledge"
  | "quote"
  | "pricing"
  | "contact"
  | "demo"
  | "callback"
  | "unknown";

const intentKeywords: Record<UserIntent, string[]> = {
  knowledge: [],

  quote: [
    "quote",
    "quotation",
    "estimate",
    "proposal",
  ],

  pricing: [
    "price",
    "pricing",
    "cost",
    "charges",
    "package",
    "packages",
    "plan",
    "plans",
  ],

  contact: [
    "contact",
    "phone",
    "email",
    "address",
  ],

  demo: [
    "demo",
    "meeting",
    "presentation",
  ],

  callback: [
    "call me",
    "callback",
    "call back",
    "talk to sales",
  ],

  unknown: [],
};

export function detectIntent(message: string): UserIntent {
  const text = message.toLowerCase();

  for (const [intent, keywords] of Object.entries(intentKeywords)) {
    if (keywords.some((k) => text.includes(k))) {
      return intent as UserIntent;
    }
  }

  return "knowledge";
}