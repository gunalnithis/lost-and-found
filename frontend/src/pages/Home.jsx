import { useState, useEffect } from "react";
import Footer from "../components/Footer";
import ItemCard from "../components/ItemCard";
import AIChatBox from "../components/AIChatBox";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE } from "../config/api";

const Home = () => {
  const [items, setItems] = useState([]);
  const [advertisements, setAdvertisements] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [quickFeedback, setQuickFeedback] = useState({
    name: "",
    email: "",
    rating: 5,
    category: "general",
    message: "",
  });
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSubmitMessage, setFeedbackSubmitMessage] = useState("");
  const [feedbackSubmitError, setFeedbackSubmitError] = useState("");
  const navigate = useNavigate();

  const renderStars = (rating = 0) => {
    const safeRating = Math.max(1, Math.min(5, Number(rating) || 0));
    return "★★★★★".split("").map((star, idx) => (
      <span
        key={`${safeRating}-${idx}`}
        className={idx < safeRating ? "text-yellow-300" : "text-slate-600"}
      >
        {star}
      </span>
    ));
  };

  const handleLatestItemView = (item) => {
    if (!item?._id) return;
    const targetPath =
      item.category === "found" ? "/found-items" : "/lost-items";
    navigate(`${targetPath}?itemId=${item._id}`);
  };

  useEffect(() => {
    const fetchLatestItems = async () => {
      try {
        const [itemsRes, adsRes, feedbackRes] = await Promise.all([
          fetch(`${API_BASE}/api/items?limit=6&skip=0`),
          fetch(`${API_BASE}/api/advertisements?limit=40&skip=0`),
          fetch(
            `${API_BASE}/api/feedback?limit=12&skip=0&status=pending,reviewed,replied`,
          ),
        ]);

        const itemsData = await itemsRes.json().catch(() => []);
        const adsData = await adsRes.json().catch(() => []);
        const feedbackData = await feedbackRes.json().catch(() => []);

        if (itemsRes.ok) {
          setItems(Array.isArray(itemsData) ? itemsData : []);
        }
        if (adsRes.ok) {
          setAdvertisements(Array.isArray(adsData) ? adsData : []);
        }
        if (feedbackRes.ok) {
          setFeedbacks(Array.isArray(feedbackData) ? feedbackData : []);
        }
      } catch (err) {
        console.error("Failed to fetch latest items");
      } finally {
        setLoading(false);
      }
    };

    fetchLatestItems();
  }, []);

  const submitQuickFeedback = async (e) => {
    e.preventDefault();
    if (!quickFeedback.message.trim()) {
      setFeedbackSubmitError("Please write your feedback message.");
      return;
    }

    try {
      setIsSubmittingFeedback(true);
      setFeedbackSubmitError("");
      setFeedbackSubmitMessage("");

      const response = await fetch(`${API_BASE}/api/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(quickFeedback),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Failed to submit feedback");
      }

      setQuickFeedback({
        name: "",
        email: "",
        rating: 5,
        category: "general",
        message: "",
      });
      setFeedbackSubmitMessage("Thanks! Your feedback was submitted.");

      const refresh = await fetch(
        `${API_BASE}/api/feedback?limit=12&skip=0&status=pending,reviewed,replied`,
      );
      const refreshData = await refresh.json().catch(() => []);
      if (refresh.ok) {
        setFeedbacks(Array.isArray(refreshData) ? refreshData : []);
      }
    } catch (err) {
      setFeedbackSubmitError(
        err.message || "Could not submit feedback right now.",
      );
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const latestFoundCount = items.filter(
    (item) => item.category === "found",
  ).length;
  const latestLostCount = items.filter(
    (item) => item.category === "lost",
  ).length;

  const orderedAdvertisements = [
    ...advertisements.filter((ad) => ad.featured),
    ...advertisements.filter((ad) => !ad.featured),
  ];

  useEffect(() => {
    if (orderedAdvertisements.length <= 1) return undefined;

    const intervalId = window.setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % orderedAdvertisements.length);
    }, 2600);

    return () => window.clearInterval(intervalId);
  }, [orderedAdvertisements.length]);

  const rotatingAdvertisements =
    orderedAdvertisements.length <= 3
      ? orderedAdvertisements
      : [0, 1, 2].map(
          (offset) =>
            orderedAdvertisements[
              (currentAdIndex + offset) % orderedAdvertisements.length
            ],
        );

  const featureCards = [
    {
      title: "One-Step Reporting",
      description: "Post lost or found details quickly with image support.",
      tone: "from-rose-500/20 to-orange-500/10 border-rose-400/30",
      icon: "🧾",
    },
    {
      title: "Campus Smart Match",
      description:
        "Use chatbot-assisted matching by name, color, and location.",
      tone: "from-cyan-500/20 to-sky-500/10 border-cyan-400/30",
      icon: "🤖",
    },
    {
      title: "Verified Contact Flow",
      description: "Admin review keeps owner details private and secure.",
      tone: "from-emerald-500/20 to-teal-500/10 border-emerald-400/30",
      icon: "🛡️",
    },
  ];

  return (
    <>
      <section className="relative overflow-hidden border-b border-deep-border bg-gradient-hero pb-20 pt-28">
        <div className="pointer-events-none absolute -left-20 top-10 h-56 w-56 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-4 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[1.25fr_0.95fr] lg:items-center">
          <div>
            <span className="inline-flex rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-300">
              Campus Lost & Found Network
            </span>
            <h1 className="mt-6 text-5xl font-black leading-tight md:text-7xl">
              <span className="bg-gradient-to-r from-sky-300 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
                Find Faster.
              </span>
              <br />
              <span className="text-slate-100">Return Safer.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-slate-400">
              A focused system for students and staff to report missing items,
              connect with finders, and recover belongings through verified
              workflows.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/advertisement-request?category=lost"
                className="rounded-xl bg-gradient-to-r from-rose-600 to-orange-500 px-7 py-3 text-center font-bold text-white shadow-xl shadow-rose-900/25 transition hover:-translate-y-0.5"
              >
                Report Lost Item
              </Link>
              <Link
                to="/advertisement-request?category=found"
                className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-7 py-3 text-center font-bold text-white shadow-xl shadow-emerald-900/25 transition hover:-translate-y-0.5"
              >
                Report Found Item
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-3 text-sm">
              <Link
                to="/found-items"
                className="rounded-full border border-cyan-500/30 px-4 py-1.5 text-cyan-300 hover:bg-cyan-500/10"
              >
                Explore Found Items
              </Link>
              <Link
                to="/lost-items"
                className="rounded-full border border-sky-500/30 px-4 py-1.5 text-sky-300 hover:bg-sky-500/10"
              >
                Browse Lost Reports
              </Link>
              <Link
                to="/contact"
                className="rounded-full border border-blue-500/30 px-4 py-1.5 text-blue-300 hover:bg-blue-500/10"
              >
                Share Feedback
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-deep-border bg-deep-card/80 p-6 shadow-2xl shadow-black/30 backdrop-blur-lg">
            <p className="text-sm font-semibold uppercase tracking-wider text-sky-300">
              Live Board
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4">
                <p className="text-xs text-cyan-200/80">Latest Found</p>
                <p className="mt-1 text-3xl font-black text-cyan-200">
                  {latestFoundCount}
                </p>
              </div>
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
                <p className="text-xs text-rose-200/80">Latest Lost</p>
                <p className="mt-1 text-3xl font-black text-rose-200">
                  {latestLostCount}
                </p>
              </div>
              <div className="col-span-2 rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4">
                <p className="text-xs text-sky-200/80">Recent Activity</p>
                <p className="mt-1 text-xl font-bold text-slate-100">
                  {loading
                    ? "Loading latest reports..."
                    : `${items.length} fresh posts tracked`}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-deep-border bg-deep-surface/70 p-4">
              <p className="text-xs uppercase tracking-wider text-deep-muted">
                Need help finding matches?
              </p>
              <p className="mt-1 text-sm text-slate-300">
                Use the AI assistant at the bottom-right to search by item name,
                color, and location.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-deep-border bg-deep-surface/45 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-4xl font-bold md:text-5xl">
                <span className="bg-gradient-to-r from-sky-300 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
                  Built For Campus Recovery
                </span>
              </h2>
              <p className="mt-2 text-slate-400">
                Everything needed for fast and secure return flow.
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {featureCards.map((card) => (
              <article
                key={card.title}
                className={`rounded-2xl border bg-gradient-to-br p-6 ${card.tone}`}
              >
                <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-black/20 text-2xl">
                  {card.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-100">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm text-slate-300">
                  {card.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-deep-border bg-deep-bg py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-4xl font-bold md:text-5xl">
                <span className="bg-gradient-to-r from-cyan-300 via-sky-300 to-teal-300 bg-clip-text text-transparent">
                  Approved Advertisements
                </span>
              </h2>
              <p className="mt-2 text-slate-400">
                Moderated item advertisements published after admin approval.
              </p>
            </div>
            <Link
              to="/advertisement-request"
              className="w-fit rounded-xl border border-cyan-500/30 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/10"
            >
              Request Advertisement
            </Link>
          </div>

          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300/80">
            Rotating Live Advertisements
          </p>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rotatingAdvertisements.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-dashed border-deep-border bg-deep-card/40 px-6 py-12 text-center text-deep-muted">
                No approved advertisements available right now.
              </div>
            ) : (
              rotatingAdvertisements.map((ad) => (
                <article
                  key={ad._id}
                  className="overflow-hidden rounded-2xl border border-deep-border bg-deep-card/70 shadow-lg shadow-black/20 transition-all duration-700"
                >
                  <img
                    src={
                      ad.image ||
                      "https://via.placeholder.com/640x360?text=Advertisement"
                    }
                    alt={ad.itemName}
                    className="h-44 w-full object-cover"
                  />
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="line-clamp-1 text-lg font-bold text-slate-100">
                        {ad.itemName}
                      </h3>
                      <div className="flex items-center gap-2">
                        {ad.featured && (
                          <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-300">
                            Featured
                          </span>
                        )}
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${
                            ad.category === "lost"
                              ? "bg-rose-500/20 text-rose-300"
                              : "bg-emerald-500/20 text-emerald-300"
                          }`}
                        >
                          {ad.category}
                        </span>
                      </div>
                    </div>
                    <p className="mt-2 line-clamp-3 text-sm text-slate-300">
                      {ad.description}
                    </p>
                    <p className="mt-3 text-xs text-slate-400">{ad.location}</p>
                    <div className="mt-3 rounded-lg border border-deep-border bg-deep-surface/70 px-3 py-2 text-xs text-slate-300">
                      Contact: {ad.contactName} | {ad.contactNumber}
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="border-t border-deep-border bg-deep-bg py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-4xl font-bold md:text-5xl">
                <span className="bg-gradient-to-r from-sky-300 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
                  Latest Item Feed
                </span>
              </h2>
              <p className="mt-2 text-slate-400">
                Most recent lost and found posts from the community.
              </p>
            </div>
            <Link
              to="/found-items"
              className="w-fit rounded-xl border border-cyan-500/30 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/10"
            >
              View Full Listings
            </Link>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <div className="col-span-full flex justify-center py-16">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
              </div>
            ) : (
              items.map((item) => (
                <ItemCard
                  key={item._id || item.id}
                  item={item}
                  onView={() => handleLatestItemView(item)}
                />
              ))
            )}
          </div>
        </div>
      </section>

      <section className="border-t border-deep-border bg-deep-surface/40 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-4xl font-bold md:text-5xl">
                <span className="bg-gradient-to-r from-sky-300 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
                  Student Feedback
                </span>
              </h2>
              <p className="mt-2 text-slate-400">
                Real comments from users who used the Lost & Found system.
              </p>
            </div>
            <Link
              to="/contact"
              className="rounded-xl border border-sky-500/40 px-4 py-2 text-sm font-semibold text-sky-300 transition hover:bg-sky-500/10"
            >
              Open Full Feedback Page
            </Link>
          </div>

          <div className="mb-6 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-5">
              <p className="text-xs uppercase tracking-wider text-cyan-200/80">
                Why Feedback Matters
              </p>
              <p className="mt-2 text-sm text-slate-300">
                Your ratings and comments help us improve matching accuracy,
                response time, and overall campus safety.
              </p>
            </div>
            <form
              onSubmit={submitQuickFeedback}
              className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-5"
            >
              <p className="text-xs uppercase tracking-wider text-sky-200/80">
                Add Feedback
              </p>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <input
                  type="text"
                  placeholder="Name (optional)"
                  value={quickFeedback.name}
                  onChange={(e) =>
                    setQuickFeedback((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  className="rounded-lg border border-sky-500/30 bg-deep-bg/70 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500"
                />
                <input
                  type="email"
                  placeholder="Email (optional)"
                  value={quickFeedback.email}
                  onChange={(e) =>
                    setQuickFeedback((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  className="rounded-lg border border-sky-500/30 bg-deep-bg/70 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500"
                />
                <select
                  value={quickFeedback.category}
                  onChange={(e) =>
                    setQuickFeedback((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  className="rounded-lg border border-sky-500/30 bg-deep-bg/70 px-3 py-2 text-sm text-slate-200"
                >
                  <option value="general">General</option>
                  <option value="bug">Bug</option>
                  <option value="suggestion">Suggestion</option>
                </select>
                <select
                  value={quickFeedback.rating}
                  onChange={(e) =>
                    setQuickFeedback((prev) => ({
                      ...prev,
                      rating: Number(e.target.value),
                    }))
                  }
                  className="rounded-lg border border-sky-500/30 bg-deep-bg/70 px-3 py-2 text-sm text-slate-200"
                >
                  {[5, 4, 3, 2, 1].map((star) => (
                    <option key={star} value={star}>
                      {star} Star
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                value={quickFeedback.message}
                onChange={(e) =>
                  setQuickFeedback((prev) => ({
                    ...prev,
                    message: e.target.value,
                  }))
                }
                placeholder="Write your feedback"
                rows={3}
                className="mt-2 w-full rounded-lg border border-sky-500/30 bg-deep-bg/70 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500"
              />
              {feedbackSubmitMessage && (
                <p className="mt-2 text-xs text-emerald-300">
                  {feedbackSubmitMessage}
                </p>
              )}
              {feedbackSubmitError && (
                <p className="mt-2 text-xs text-rose-300">
                  {feedbackSubmitError}
                </p>
              )}
              <button
                type="submit"
                disabled={isSubmittingFeedback}
                className="mt-3 inline-flex rounded-lg bg-gradient-to-r from-sky-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-white"
              >
                {isSubmittingFeedback ? "Submitting..." : "Submit Feedback"}
              </button>
            </form>
          </div>

          <div className="-mx-2 flex gap-4 overflow-x-auto px-2 pb-2 [scrollbar-width:thin]">
            {feedbacks.length > 0 ? (
              feedbacks.map((fb) => (
                <article
                  key={fb._id}
                  className="theme-card relative min-w-[290px] max-w-[360px] shrink-0 snap-start overflow-hidden p-6 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-sky-950/20"
                >
                  <div className="absolute -right-3 -top-3 h-14 w-14 rounded-full bg-cyan-500/15 blur-xl" />
                  <p className="mb-2 text-sm">{renderStars(fb.rating)}</p>
                  <p className="mb-2 inline-flex rounded-full border border-sky-500/30 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-sky-300">
                    {fb.category || "general"}
                  </p>
                  <p className="text-sm leading-relaxed text-slate-300">
                    "{fb.message}"
                  </p>
                  <div className="mt-4 border-t border-deep-border pt-3">
                    <p className="text-sm font-semibold text-slate-100">
                      {fb.name || "Anonymous"}
                    </p>
                    <p className="text-xs text-deep-muted">
                      {fb.email || "No email provided"}
                    </p>
                  </div>
                </article>
              ))
            ) : (
              <div className="w-full rounded-2xl border border-dashed border-deep-border bg-deep-card/40 px-6 py-10 text-center text-deep-muted">
                No feedback yet. Be the first to share your experience.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* AI ChatBox */}
      <AIChatBox />

      {/* Footer */}
      <Footer />
    </>
  );
};

export default Home;
