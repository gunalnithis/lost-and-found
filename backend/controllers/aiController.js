const GEMINI_MODEL = "gemini-2.5-flash";
const { searchItemsByCriteria } = require("./itemController");

const getStructuredWelcome = () => ({
  type: "welcome_menu",
  title: "Hi there! Welcome to the campus Lost & Found",
  message: "How can I help you today?",
  options: [
    {
      id: "report_lost",
      label: "Report a lost item",
      description: "Create a new lost-item report with details and location.",
    },
    {
      id: "report_found",
      label: "Report a found item",
      description: "Submit a found-item report so the owner can locate it.",
    },
    {
      id: "search_item",
      label: "Search for an item",
      description: "Browse listings and filter by keywords or location.",
    },
    {
      id: "general_question",
      label: "Ask a general question",
      description: "Get help with process, safety, and platform usage.",
    },
  ],
  prompt: "Please choose one option to continue.",
});

const isGreetingMessage = (text = "") => {
  const normalized = text.trim().toLowerCase();
  return ["hi", "hello", "hey", "start", "help", "menu"].includes(normalized);
};

const buildHistoryContent = (history = []) => {
  if (!Array.isArray(history)) return [];

  return history
    .filter((entry) => entry && typeof entry.text === "string" && entry.text.trim())
    .slice(-10)
    .map((entry) => ({
      role: entry.type === "ai" ? "model" : "user",
      parts: [{ text: entry.text.trim() }],
    }));
};

const safeJsonParse = (raw) => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const extractTextFromGemini = (data) =>
  data?.candidates?.[0]?.content?.parts
    ?.map((part) => part?.text || "")
    .join("\n")
    .trim() || "";

const intentFromTextHeuristic = (raw = "") => {
  const t = raw.trim().toLowerCase();
  if (/\breport\b.*\bfound\b|\bfound\b.*\breport\b|\bi\s+found\b/.test(t)) {
    return "report_found";
  }
  if (/\breport\b.*\blost\b|\blost\b.*\breport\b|\bi\s+lost\b|\blost\s+my\b/.test(t)) {
    return "report_lost";
  }
  if (/\b(find|search|look(ing)?\s+for)\b/.test(t) || /\blost\b/.test(t)) {
    return "find_lost";
  }
  return "general_question";
};

const normalizeLooseItemName = (raw = "") =>
  String(raw || "")
    .replace(/\blap\s*carger\b/gi, "laptop charger")
    .replace(/\blap\s*charger\b/gi, "laptop charger")
    .replace(/\bcarger\b/gi, "charger")
    .replace(/\s+/g, " ")
    .trim();

const extractItemNameHeuristic = (raw = "") => {
  const t = normalizeLooseItemName(raw).toLowerCase();
  const match = t.match(/\b(?:lost|found)\b\s+(.*)$/i);
  if (!match?.[1]) return "";
  return normalizeLooseItemName(
    match[1]
      .replace(/\b(?:near|at|in)\b\s+.*$/i, "")
      .replace(/\b(?:my|a|an|the|something|item|hi|hello|hey|i|just|was|is)\b/gi, " ")
      .replace(/\s+/g, " "),
  );
};

const buildSearchReply = (intent, resultsCount) => {
  if (resultsCount === 0) {
    if (intent === "report_found") {
      return "I could not find matching lost reports yet. You can post the found item so the owner can identify it.";
    }
    return "I could not find close matches right now. You can post your lost item so others can help.";
  }
  if (intent === "report_found") {
    return `I found ${resultsCount} similar lost report(s). Please review these matches.`;
  }
  return `I found ${resultsCount} matching found item(s). Please check these results.`;
};

const quickRepliesForSearch = (intent, hasResults) => {
  if (hasResults) {
    return [
      { id: "post_new", label: "Post New Item" },
      { id: "refine_search", label: "Refine Search" },
      { id: "restart", label: "Start Over" },
    ];
  }
  if (intent === "report_found") {
    return [
      { id: "post_found_item", label: "Post Found Item" },
      { id: "refine_search", label: "Refine Search" },
      { id: "restart", label: "Start Over" },
    ];
  }
  return [
    { id: "post_lost_item", label: "Post Lost Item" },
    { id: "refine_search", label: "Refine Search" },
    { id: "restart", label: "Start Over" },
  ];
};

const extractPlanWithGemini = async ({ apiKey, message, history = [], chatContext = {} }) => {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const plannerResponse = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        ...buildHistoryContent(history),
        {
          role: "user",
          parts: [
            {
              text: [
                `User message: ${message.trim()}`,
                `Existing collected context: ${JSON.stringify(chatContext || {})}`,
                "Return ONLY strict JSON without markdown.",
              ].join("\n"),
            },
          ],
        },
      ],
      systemInstruction: {
        parts: [
          {
            text: [
              "You are the intent and tool planner for a campus Lost & Found app.",
              "Available tool: search_items(itemName, color, location, intent).",
              "Valid intent values: find_lost, report_lost, report_found, general_question.",
              "Output JSON schema:",
              "{",
              '  "intent": "find_lost|report_lost|report_found|general_question",',
              '  "tool": "search_items|navigate_post_item|none",',
              '  "itemName": "string",',
              '  "color": "string",',
              '  "location": "string",',
              '  "needsMoreInfo": true|false,',
              '  "followUpQuestion": "string",',
              '  "reply": "short assistant reply"',
              "}",
              "Choose search_items when user is trying to find/report matching item records.",
              "For search_items, itemName is required.",
              "Color and location are optional refiners and must not block search.",
              "If itemName is missing, set needsMoreInfo=true with a concise follow-up question.",
            ].join("\n"),
          },
        ],
      },
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 300,
      },
    }),
  });

  if (!plannerResponse.ok) {
    const data = await plannerResponse.json();
    throw new Error(data?.error?.message || "Planner request failed");
  }

  const plannerData = await plannerResponse.json();
  const raw = extractTextFromGemini(plannerData);
  return safeJsonParse(raw);
};

const chatWithGemini = async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const { message, history, chatContext } = req.body;

    if (!apiKey) {
      return res.status(500).json({
        message: "Gemini API key is not configured on the server.",
      });
    }

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        message: "Message is required",
      });
    }

    if (isGreetingMessage(message)) {
      const structured = getStructuredWelcome();
      const reply = `${structured.title}\n${structured.message}\n${structured.prompt}`;
      return res.status(200).json({ reply, structured, action: "welcome" });
    }

    let plan = await extractPlanWithGemini({
      apiKey,
      message,
      history,
      chatContext,
    });

    if (!plan || typeof plan !== "object") {
      plan = {
        intent: intentFromTextHeuristic(message),
        tool: "none",
        itemName: chatContext?.itemName || "",
        color: chatContext?.color || "",
        location: chatContext?.location || "",
        needsMoreInfo: false,
        followUpQuestion: "",
        reply: "Let me help with that.",
      };
    }

    const intent =
      ["find_lost", "report_lost", "report_found", "general_question"].includes(plan.intent)
        ? plan.intent
        : intentFromTextHeuristic(message);

    const criteria = {
      itemName: normalizeLooseItemName(
        String(plan.itemName || chatContext?.itemName || extractItemNameHeuristic(message) || ""),
      ),
      color: String(plan.color || chatContext?.color || "").trim(),
      location: String(plan.location || chatContext?.location || "").trim(),
      intent,
    };

    if (plan.tool === "search_items" || intent !== "general_question") {
      const hasItemName = Boolean(criteria.itemName);

      if (!hasItemName || plan.needsMoreInfo) {
        return res.status(200).json({
          action: "ask_followup",
          reply:
            plan.followUpQuestion || "What item did you lose or find?",
          data: {
            intent,
            quickReplies: [
              { id: "restart", label: "Start Over" },
              { id: "post_new", label: "Post New Item" },
            ],
          },
        });
      }

      const results = await searchItemsByCriteria(criteria);
      const hasResults = Array.isArray(results) && results.length > 0;

      return res.status(200).json({
        action: "show_results",
        reply: buildSearchReply(intent, results.length),
        data: {
          intent,
          criteria,
          results,
          quickReplies: quickRepliesForSearch(intent, hasResults),
        },
      });
    }

    return res.status(200).json({
      action: "answer",
      reply:
        plan.reply ||
        "I can help you find, report, or post lost/found items. Tell me item name, color, and location.",
      data: {
        intent,
        quickReplies: [
          { id: "find_lost", label: "Find Lost Item" },
          { id: "report_lost", label: "Report Lost Item" },
          { id: "report_found", label: "Report Found Item" },
        ],
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "AI chat request failed",
      error: error.message,
    });
  }
};

const getAiStatus = async (req, res) => {
  return res.status(200).json({
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    model: GEMINI_MODEL,
  });
};

module.exports = {
  chatWithGemini,
  getAiStatus,
};
