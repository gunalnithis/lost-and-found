import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../config/api";
import {
  QUICK_ACTIONS,
  POST_SEARCH_QUICK_REPLIES,
  OPENING_MESSAGE,
  INITIAL_SESSION,
  buildSmartSearchLine,
  extractChatDetails,
  mapPostItemToSearchCard,
  normalizeItemText,
  resultsIntroMessage,
  emptyResultsMessage,
  emptyResultsQuickReplies,
  intentFromActionId,
  intentFromText,
  nextQuestionForStep,
} from "./chatbot/guidedChatFlow";

let messageSeq = 0;
const uid = () => `m-${++messageSeq}-${Date.now()}`;

const TYPING_MS = 550;

function TypingBubble() {
  return (
    <div className="flex max-w-[80%] flex-col self-start rounded-xl bg-deep-elevated px-3 py-2 text-slate-400">
      <span className="text-[11px] font-medium text-sky-400/80">Typing…</span>
      <span className="mt-1 flex gap-1">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sky-400/80 [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sky-400/80 [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sky-400/80 [animation-delay:300ms]" />
      </span>
    </div>
  );
}

function ChatSearchResultCard({ card, onView, onClaim }) {
  const src =
    card.image && String(card.image).length > 10
      ? card.image
      : "https://via.placeholder.com/96?text=Item";

  return (
    <div className="mt-2 flex gap-2 rounded-lg border border-deep-border bg-deep-surface/95 p-2 text-left">
      <img
        src={src}
        alt=""
        className="h-16 w-16 shrink-0 rounded-md object-cover"
        loading="lazy"
      />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold leading-tight text-slate-100">
          {card.itemName}
        </p>
        <p className="mt-1 text-[11px] text-deep-muted">
          <span className="text-sky-400/90">Color (you said):</span>{" "}
          {card.displayColor}
        </p>
        <p className="text-[11px] text-deep-muted">
          <span className="text-sky-400/90">Location:</span> {card.location}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => onView(card)}
            className="rounded-md bg-sky-600/80 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-sky-500"
          >
            View
          </button>
          <button
            type="button"
            onClick={() => onClaim(card)}
            className="rounded-md border border-sky-500/50 px-2.5 py-1 text-[11px] font-semibold text-sky-200 hover:bg-sky-950/50"
          >
            Claim
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AIChatBox() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => [
    {
      id: uid(),
      sender: "bot",
      messageType: "question",
      text: OPENING_MESSAGE,
      quickReplies: QUICK_ACTIONS,
    },
  ]);
  const [session, setSession] = useState(() => ({ ...INITIAL_SESSION }));
  const [flowStep, setFlowStep] = useState("choose_action");
  const [input, setInput] = useState("");
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [flowStatus, setFlowStatus] = useState("idle");
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);

  const clearTypingTimer = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearTypingTimer();
  }, [clearTypingTimer]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isBotTyping, flowStatus, isSearching]);

  const pushBot = useCallback(
    (payload, { delay = TYPING_MS } = {}) => {
      clearTypingTimer();
      setIsBotTyping(true);
      typingTimeoutRef.current = setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            sender: "bot",
            messageType: payload.messageType || "question",
            text: payload.text,
            quickReplies: payload.quickReplies,
            searchResults: payload.searchResults,
            flowStatus: payload.flowStatus,
          },
        ]);
        setIsBotTyping(false);
        typingTimeoutRef.current = null;
      }, delay);
    },
    [clearTypingTimer],
  );

  const pushUser = useCallback((text) => {
    setMessages((prev) => [
      ...prev,
      {
        id: uid(),
        sender: "user",
        messageType: "answer",
        text,
      },
    ]);
  }, []);

  const pushSystem = useCallback((text, status = "idle") => {
    setMessages((prev) => [
      ...prev,
      {
        id: uid(),
        sender: "system",
        messageType: "system",
        text,
        flowStatus: status,
      },
    ]);
  }, []);

  const startNewSession = useCallback(() => {
    clearTypingTimer();
    setIsBotTyping(false);
    setIsSearching(false);
    setFlowStatus("idle");
    setSession({ ...INITIAL_SESSION });
    setFlowStep("choose_action");
    setInput("");
    setMessages([
      {
        id: uid(),
        sender: "bot",
        messageType: "question",
        text: OPENING_MESSAGE,
        quickReplies: QUICK_ACTIONS,
      },
    ]);
  }, [clearTypingTimer]);

  const openItemRoute = useCallback(
    (card) => {
      const path = card.category === "found" ? "/found-items" : "/lost-items";
      const itemId = encodeURIComponent(card.id);
      const nonce = Date.now();
      navigate(path, { replace: true });
      setTimeout(() => {
        navigate(`${path}?itemId=${itemId}&open=${nonce}`);
      }, 0);
    },
    [navigate],
  );

  const finishFlow = useCallback(
    async (intent, data) => {
      clearTypingTimer();
      setIsBotTyping(false);
      const line = buildSmartSearchLine(intent, data);
      setFlowStatus("searching");
      setIsSearching(true);
      pushSystem(line, "searching");

      try {
        const requestBody = {
          message: line,
          chatContext: {
            intent,
            itemName: data.itemName,
            color: data.color,
            location: data.location,
          },
          history: messages
            .slice(-8)
            .map((msg) => ({
              type: msg.sender === "bot" ? "ai" : "user",
              text: msg.text,
            }))
            .filter((h) => h.text),
        };

        const candidateBases = [
          API_BASE,
          "http://localhost:5000",
          "http://localhost:8000",
        ];
        const uniqueBases = [...new Set(candidateBases.filter(Boolean))];

        let res = null;
        let lastNetworkError = null;

        for (const base of uniqueBases) {
          const url = `${base}/api/ai/chat`;
          try {
            const attempt = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(requestBody),
            });
            console.log("Chatbot AI URL:", url, "status:", attempt.status);
            res = attempt;
            break;
          } catch (networkErr) {
            lastNetworkError = networkErr;
            console.error("Chatbot AI network error at", url, networkErr);
          }
        }

        if (!res) {
          console.error(
            "Chatbot AI failed on all candidate URLs",
            lastNetworkError,
          );
          throw new Error("Unable to fetch results. Please try again.");
        }

        console.log("Chatbot AI response status:", res.status, res.statusText);

        if (!res.ok) {
          const errorText = await res.text();
          console.error("Chatbot AI error response:", errorText);
          throw new Error("Unable to fetch results. Please try again.");
        }

        let payload;
        try {
          payload = await res.json();
        } catch (parseError) {
          console.error("Chatbot AI invalid JSON:", parseError);
          throw new Error("Unable to fetch results. Please try again.");
        }

        console.log("Chatbot AI payload:", payload);

        if (!payload || typeof payload !== "object") {
          throw new Error("Unable to fetch results. Please try again.");
        }

        const apiResults = Array.isArray(payload?.data?.results)
          ? payload.data.results
          : [];
        const cards = apiResults.map((item) =>
          mapPostItemToSearchCard(item, data.color),
        );
        const quickReplies = Array.isArray(payload?.data?.quickReplies)
          ? payload.data.quickReplies
          : undefined;
        const replyText =
          typeof payload?.reply === "string" && payload.reply.trim()
            ? payload.reply
            : apiResults.length
              ? resultsIntroMessage(intent)
              : emptyResultsMessage(intent);

        setIsSearching(false);
        setFlowStatus("idle");
        setFlowStep("complete");

        if (payload.action === "ask_followup") {
          setFlowStep("item_name");
          pushBot(
            {
              messageType: "question",
              text: replyText,
              quickReplies,
            },
            { delay: 420 },
          );
        } else if (cards.length === 0) {
          pushBot(
            {
              messageType: "answer",
              text: replyText,
              quickReplies: quickReplies || emptyResultsQuickReplies(intent),
            },
            { delay: 450 },
          );
        } else {
          pushBot(
            {
              messageType: "answer",
              text: replyText,
              searchResults: cards,
              quickReplies: quickReplies || POST_SEARCH_QUICK_REPLIES,
            },
            { delay: 450 },
          );
        }
      } catch (err) {
        setIsSearching(false);
        setFlowStatus("idle");
        setFlowStep("complete");
        console.error("Chatbot search failed:", err);
        pushBot(
          {
            messageType: "answer",
            text: "Unable to fetch results. Please try again.\n\nTap Start Over to try again.",
            quickReplies: [{ id: "restart", label: "Start Over" }],
          },
          { delay: 320 },
        );
      }
    },
    [clearTypingTimer, pushBot, pushSystem, messages],
  );

  const advanceAfterLocation = useCallback(
    (loc) => {
      const intent = session.intent;
      if (!intent) return;
      const data = {
        itemName: session.itemName.trim(),
        color: session.color.trim(),
        location: loc.trim(),
      };
      void finishFlow(intent, data);
    },
    [session, finishFlow],
  );

  const handleQuickAction = useCallback(
    (actionId, label) => {
      if (actionId === "restart") {
        startNewSession();
        return;
      }

      if (
        actionId === "post_new" ||
        actionId === "post_lost_item" ||
        actionId === "post_found_item"
      ) {
        pushUser(label);
        navigate("/post-item");
        setFlowStep("complete");
        return;
      }

      if (actionId === "refine_search") {
        pushUser(label);
        setSession((s) => ({
          ...INITIAL_SESSION,
          intent: s.intent,
        }));
        setFlowStep("item_name");
        setFlowStatus("idle");
        pushBot({
          messageType: "question",
          text: "Let’s refine that — what’s the item called?",
        });
        return;
      }

      const intent = intentFromActionId(actionId);
      if (!intent || flowStep === "complete") return;

      pushUser(label);
      setSession((s) => ({
        ...s,
        intent,
        color: "",
        location: "",
        itemName: "",
      }));
      setFlowStep("item_name");
      pushBot({
        messageType: "question",
        text:
          intent === "report_found"
            ? "What item did you find?"
            : "What item did you lose?",
      });
    },
    [flowStep, pushUser, pushBot, startNewSession, navigate],
  );

  const handleTextSend = useCallback(() => {
    const text = input.trim();
    if (!text || isBotTyping || flowStatus === "searching" || isSearching) {
      return;
    }

    if (flowStep === "choose_action") {
      const guessed = intentFromText(text);
      if (!guessed) {
        pushUser(text);
        pushBot({
          messageType: "question",
          text: "Hmm, I didn’t quite get that — try one of the buttons, or say something like “find my lost phone.”",
          quickReplies: QUICK_ACTIONS,
        });
        setInput("");
        return;
      }

      const extracted = extractChatDetails(text);
      const normalizedItemName = normalizeItemText(extracted.itemName || "");

      pushUser(text);

      if (normalizedItemName) {
        const merged = {
          itemName: normalizedItemName,
          color: extracted.color || "",
          location: extracted.location || "",
        };
        setSession((s) => ({ ...s, intent: guessed, ...merged }));
        setInput("");
        void finishFlow(guessed, merged);
        return;
      }

      setSession((s) => ({
        ...s,
        intent: guessed,
        color: extracted.color || "",
        location: extracted.location || "",
      }));
      setFlowStep("item_name");
      pushBot({
        messageType: "question",
        text:
          guessed === "report_found"
            ? "What item did you find?"
            : "What item did you lose?",
      });
      setInput("");
      return;
    }

    if (flowStep === "item_name") {
      pushUser(text);
      const parsed = extractChatDetails(text);
      const normalizedItemName = normalizeItemText(parsed.itemName || text);
      const merged = {
        itemName: normalizedItemName,
        color: parsed.color || session.color || "",
        location: parsed.location || session.location || "",
      };
      setSession((s) => ({ ...s, ...merged }));
      setInput("");
      if (session.intent) {
        void finishFlow(session.intent, merged);
      }
      return;
    }

    if (flowStep === "color") {
      pushUser(text);
      setSession((s) => ({ ...s, color: text }));
      setFlowStep("location");
      pushBot({
        messageType: "question",
        text: nextQuestionForStep("location", session.intent),
      });
      setInput("");
      return;
    }

    if (flowStep === "location") {
      pushUser(text);
      setInput("");
      advanceAfterLocation(text);
      return;
    }

    if (flowStep === "complete") {
      pushUser(text);
      pushBot({
        messageType: "question",
        text: "This turn is wrapped up — use the buttons below or Start Over.",
        quickReplies: [{ id: "restart", label: "Start Over" }],
      });
      setInput("");
    }
  }, [
    input,
    flowStep,
    session.intent,
    session.color,
    session.location,
    isBotTyping,
    flowStatus,
    isSearching,
    pushUser,
    pushBot,
    advanceAfterLocation,
    finishFlow,
  ]);

  const lastBotQuickId = useMemo(() => {
    const lastBot = [...messages].reverse().find((m) => m.sender === "bot");
    return lastBot?.quickReplies?.length ? lastBot.id : undefined;
  }, [messages]);

  const lastSystemMessageId = useMemo(() => {
    const sys = messages.filter((m) => m.sender === "system");
    return sys.length ? sys[sys.length - 1].id : undefined;
  }, [messages]);

  const inputLocked =
    isBotTyping ||
    flowStatus === "searching" ||
    isSearching ||
    flowStep === "complete";

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="relative flex w-[22rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-deep-border bg-deep-card shadow-2xl shadow-black/50 sm:w-96">
          <div className="relative bg-gradient-accent px-4 py-3 text-center font-semibold text-white">
            Guided Assistant
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-deep-card text-sky-300 shadow transition-shadow hover:bg-deep-elevated"
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          <div className="flex max-h-[min(26rem,58vh)] min-h-[220px] flex-col gap-2 overflow-y-auto bg-deep-surface p-3">
            {messages.map((msg) => {
              if (msg.sender === "system") {
                return (
                  <div
                    key={msg.id}
                    className="mx-auto max-w-[92%] rounded-lg border border-sky-500/25 bg-sky-950/30 px-3 py-2 text-center text-xs text-sky-200/90"
                  >
                    {isSearching &&
                      msg.flowStatus === "searching" &&
                      msg.id === lastSystemMessageId && (
                        <span className="mb-1 flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-sky-400/90">
                          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
                          Searching…
                        </span>
                      )}
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                );
              }

              const isUser = msg.sender === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex max-w-[88%] flex-col rounded-xl px-3 py-2 text-sm ${
                    isUser
                      ? "self-end bg-sky-600/35 text-slate-100"
                      : "self-start bg-deep-elevated text-slate-200"
                  }`}
                >
                  <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                    {isUser
                      ? "You"
                      : msg.messageType === "question"
                        ? "Assistant · Question"
                        : "Assistant · Answer"}
                  </span>
                  <p className="mt-0.5 whitespace-pre-wrap">{msg.text}</p>

                  {Array.isArray(msg.searchResults) &&
                    msg.searchResults.length > 0 && (
                      <div className="mt-2 border-t border-deep-border/80 pt-2">
                        <p className="mb-1 text-[10px] font-semibold uppercase text-sky-400/80">
                          Matches
                        </p>
                        {msg.searchResults.map((card) => (
                          <ChatSearchResultCard
                            key={card.id}
                            card={card}
                            onView={openItemRoute}
                            onClaim={openItemRoute}
                          />
                        ))}
                      </div>
                    )}

                  {!isUser &&
                    Array.isArray(msg.quickReplies) &&
                    msg.quickReplies.length > 0 &&
                    lastBotQuickId === msg.id &&
                    !isBotTyping &&
                    flowStatus !== "searching" &&
                    !isSearching && (
                      <div className="mt-2 flex flex-col gap-1.5">
                        {msg.quickReplies.map((qr) => (
                          <button
                            key={qr.id}
                            type="button"
                            onClick={() => handleQuickAction(qr.id, qr.label)}
                            className="rounded-lg border border-sky-500/35 bg-deep-surface px-2 py-1.5 text-left text-xs font-medium text-sky-200 transition hover:bg-sky-950/50"
                          >
                            {qr.label}
                          </button>
                        ))}
                      </div>
                    )}
                </div>
              );
            })}
            {isBotTyping && <TypingBubble />}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex border-t border-deep-border">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                flowStep === "complete"
                  ? "Use quick actions…"
                  : flowStep === "choose_action"
                    ? "Or describe what you need…"
                    : "Type your answer…"
              }
              className="flex-1 rounded-bl-xl bg-deep-surface px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none"
              onKeyDown={(e) => e.key === "Enter" && handleTextSend()}
              disabled={inputLocked}
            />
            <button
              type="button"
              onClick={handleTextSend}
              disabled={inputLocked}
              className="rounded-br-xl bg-gradient-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-gradient-accent-hover disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex h-14 w-14 transform items-center justify-center rounded-full bg-gradient-accent text-lg text-white shadow-xl shadow-blue-900/40 transition hover:scale-105 hover:bg-gradient-accent-hover"
          aria-label="Open chat"
        >
          💬
        </button>
      )}
    </div>
  );
}
