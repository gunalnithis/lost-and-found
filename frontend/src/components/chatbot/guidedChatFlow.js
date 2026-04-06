/** @typedef {'find_lost' | 'report_lost' | 'report_found'} UserIntent */

/** @typedef {'idle' | 'choose_action' | 'item_name' | 'color' | 'location' | 'searching' | 'complete'} FlowStep */

/**
 * @typedef {Object} SearchResultCard
 * @property {string} id
 * @property {string} itemName
 * @property {string} displayColor
 * @property {string} location
 * @property {string | null} image
 * @property {'lost'|'found'} category
 * @property {string} descriptionSnippet
 */

/**
 * @typedef {Object} ChatMessage
 * @property {string} id
 * @property {'user' | 'bot' | 'system'} sender
 * @property {'question' | 'answer' | 'system'} messageType
 * @property {string} text
 * @property {{ id: string, label: string }[]} [quickReplies]
 * @property {'searching' | 'idle'} [flowStatus]
 * @property {SearchResultCard[]} [searchResults]
 */

export const QUICK_ACTIONS = [
  { id: "find_lost", label: "1. Find a lost item" },
  { id: "post_lost_item", label: "2. Post a lost item" },
  { id: "post_found_item", label: "3. Post a found item" },
];

/** Shown after successful search (or refine / retry). */
export const POST_SEARCH_QUICK_REPLIES = [
  { id: "post_new", label: "Post New Item" },
  { id: "refine_search", label: "Refine Search" },
  { id: "restart", label: "Start Over" },
];

export const OPENING_MESSAGE =
  "1. Are you looking to find a lost item?\n2. Do you want to post a lost item?\n3. Do you want to post a found item?";

export const INITIAL_SESSION = {
  intent: /** @type {UserIntent | null} */ (null),
  itemName: "",
  color: "",
  location: "",
};

const COMMON_ITEM_FIXES = [
  [/\blap\s*carger\b/gi, "laptop charger"],
  [/\blap\s*charger\b/gi, "laptop charger"],
  [/\bcarger\b/gi, "charger"],
  [/\bear\s*pod(s)?\b/gi, "airpods"],
];

const COLOR_WORDS = [
  "black",
  "white",
  "blue",
  "red",
  "green",
  "yellow",
  "silver",
  "gray",
  "grey",
  "brown",
  "pink",
  "purple",
  "orange",
  "gold",
  "navy",
];

export function normalizeItemText(raw = "") {
  let text = String(raw || "").trim();
  for (const [pattern, replacement] of COMMON_ITEM_FIXES) {
    text = text.replace(pattern, replacement);
  }
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Lightweight extraction for first user message.
 * @param {string} raw
 * @returns {{ itemName: string, color: string, location: string }}
 */
export function extractChatDetails(raw = "") {
  const source = normalizeItemText(raw).toLowerCase();

  const locationMatch = source.match(/\b(?:near|at|in)\s+([a-z0-9\s-]{2,})$/i);
  const location = locationMatch ? String(locationMatch[1]).trim() : "";

  const color = COLOR_WORDS.find((c) => new RegExp(`\\b${c}\\b`, "i").test(source)) || "";

  let itemName = "";
  const intentChunk = source.match(/\b(?:lost|found)\b\s+(.*)$/i);
  if (intentChunk?.[1]) {
    itemName = intentChunk[1]
      .replace(/\b(?:near|at|in)\b\s+.*$/i, "")
      .replace(/\b(?:my|a|an|the|something|item)\b/gi, " ")
      .replace(/\b(?:is|was|just|hi|hello|hey|i)\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  return {
    itemName: normalizeItemText(itemName),
    color,
    location,
  };
}

/**
 * @param {UserIntent} intent
 * @param {{ itemName: string, color: string, location: string }} data
 */
export function buildSmartSearchLine(intent, data) {
  const { itemName, color, location } = data;
  const colorPart = color ? `${color} ` : "";
  const locPart = location ? ` in ${location}` : "";
  if (intent === "find_lost") {
    return `Searching for ${colorPart}${itemName}${locPart}…`;
  }
  if (intent === "report_lost") {
    return `Looking for found listings that match ${colorPart}${itemName}${locPart}…`;
  }
  return `Checking lost reports for ${colorPart}${itemName}${locPart}…`;
}

/**
 * @param {object} item — lean PostItem from API
 * @param {string} sessionColor — color the user typed in chat
 * @returns {SearchResultCard}
 */
export function mapPostItemToSearchCard(item, sessionColor) {
  const id = item._id != null ? String(item._id) : "";
  const desc = item.description ? String(item.description) : "";
  return {
    id,
    itemName: item.itemName || "Item",
    displayColor: sessionColor?.trim() || "—",
    location: item.location || "—",
    image: item.image ? String(item.image) : null,
    category: item.category === "found" ? "found" : "lost",
    descriptionSnippet:
      desc.length > 90 ? `${desc.slice(0, 90)}…` : desc || "—",
  };
}

/**
 * @param {UserIntent} intent
 */
export function resultsIntroMessage(intent) {
  if (intent === "find_lost") {
    return "Nice — I found a few possibilities. Take a look below.";
  }
  if (intent === "report_lost") {
    return "Here’s what might already be turned in. If nothing fits, you can post your lost item next.";
  }
  return "These lost listings look closest to what you described.";
}

/**
 * @param {UserIntent} intent
 */
export function emptyResultsMessage(intent) {
  if (intent === "find_lost") {
    return "No matching items found 😔\n\nWould you like to post this as a lost item? I can take you to the form.";
  }
  if (intent === "report_lost") {
    return "No close matches in found items yet 😔\n\nWant to file a lost report so others can keep an eye out?";
  }
  return "No matching lost listings yet 😔\n\nYou can still post what you found for the owner.";
}

/**
 * @param {UserIntent} intent
 */
export function emptyResultsQuickReplies(intent) {
  if (intent === "find_lost" || intent === "report_lost") {
    return [
      { id: "post_lost_item", label: "Post Lost Item" },
      { id: "refine_search", label: "Refine Search" },
      { id: "restart", label: "Start Over" },
    ];
  }
  return [
    { id: "post_found_item", label: "Post Found Item" },
    { id: "refine_search", label: "Refine Search" },
    { id: "restart", label: "Start Over" },
  ];
}

/**
 * @param {string} actionId
 * @returns {UserIntent | null}
 */
export function intentFromActionId(actionId) {
  if (
    actionId === "find_lost" ||
    actionId === "report_lost" ||
    actionId === "report_found"
  ) {
    return actionId;
  }
  return null;
}

/**
 * @param {string} raw
 * @returns {UserIntent | null}
 */
export function intentFromText(raw) {
  const t = raw.trim().toLowerCase();
  if (!t) return null;
  const reportFound =
    /\breport\b.*\bfound\b|\bfound\b.*\breport\b|\bi\s+found\b/.test(t);
  const reportLost =
    /\breport\b.*\blost\b|\blost\b.*\breport\b|\bi\s+lost\b|\blost\s+my\b/.test(
      t,
    );
  const findLike =
    /\b(find|search|look(ing)?\s+for)\b/.test(t) ||
    /\bhelp\b.*\blost\b/.test(t);

  if (reportFound) return "report_found";
  if (reportLost) return "report_lost";
  if (findLike) return "find_lost";
  if (/\blost\b/.test(t) && !/\bfound\b/.test(t)) return "find_lost";
  if (/\bfound\b/.test(t)) return "report_found";
  return null;
}

/**
 * @param {'item_name'|'color'|'location'} step
 * @param {UserIntent | null} intent
 */
export function nextQuestionForStep(step, intent) {
  if (step === "item_name") {
    return "What’s the item called?";
  }
  if (step === "color") {
    return "Got it 👍 What color is it? (e.g. black, navy, silver)";
  }
  if (step === "location") {
    if (intent === "find_lost") {
      return "Almost done! Where did you last see it? (building or area is perfect)";
    }
    if (intent === "report_lost") {
      return "Almost done! Where was it last seen?";
    }
    return "Almost done! Where did you find it?";
  }
  return "";
}

/** Short line before hitting the API (bot message, optional). */
export function preSearchAckMessage() {
  return "Let me check that for you…";
}
