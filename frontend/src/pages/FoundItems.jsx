import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ContactForm from "../components/ContactForm";
import AIChatBox from "../components/AIChatBox";
import { API_BASE } from "../config/api";

const CATEGORIES = ["all", "ID Card", "Mobile", "Wallet", "Bag", "Other"];
const RAIL_VIEWS = [
  { id: "overview", label: "Overview", icon: "◉" },
  { id: "recent", label: "Recent", icon: "◷" },
  { id: "withImage", label: "With Image", icon: "▣" },
  { id: "location", label: "Location", icon: "⌖" },
];

const TIMELINE_STEPS = [
  { key: "found", label: "Found", icon: "📍" },
  { key: "contacted", label: "Contacted", icon: "✉" },
  { key: "claim_requested", label: "Claim Requested", icon: "📝" },
  { key: "verifying", label: "Verifying", icon: "🛡" },
  { key: "returned", label: "Returned", icon: "✓" },
];

const statusBadgeMap = {
  found: "bg-cyan-500/20 text-cyan-100 border-cyan-300/30",
  contacted: "bg-sky-500/20 text-sky-100 border-sky-300/30",
  claim_requested: "bg-amber-500/20 text-amber-100 border-amber-300/30",
  verifying: "bg-indigo-500/20 text-indigo-100 border-indigo-300/30",
  returned: "bg-emerald-500/20 text-emerald-100 border-emerald-300/30",
};

const FoundItems = () => {
  const [foundItems, setFoundItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("");
  const [activeView, setActiveView] = useState("overview");

  const [selectedItem, setSelectedItem] = useState(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [timelineData, setTimelineData] = useState(null);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineError, setTimelineError] = useState("");
  const [markReturnedLoading, setMarkReturnedLoading] = useState(false);
  const [markReturnedError, setMarkReturnedError] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  const clearItemQuery = () => {
    const params = new URLSearchParams(location.search);
    params.delete("itemId");
    params.delete("open");
    const next = params.toString();
    navigate(next ? `${location.pathname}?${next}` : location.pathname, {
      replace: true,
    });
  };

  const closeSelectedItem = () => {
    setShowContactForm(false);
    setSelectedItem(null);
    setTimelineData(null);
    setTimelineError("");
    setMarkReturnedError("");
    clearItemQuery();
  };

  // Fetch found items
  useEffect(() => {
    const fetchFoundItems = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/items/found?limit=24&skip=0`);
        const data = await res.json();

        if (res.ok) {
          setFoundItems(data);
        } else {
          setError(data.message || "Failed to fetch found items");
        }
      } catch (err) {
        setError("Server connection failed");
      } finally {
        setLoading(false);
      }
    };

    fetchFoundItems();
  }, []);

  useEffect(() => {
    const itemId = new URLSearchParams(location.search).get("itemId");
    if (!itemId || !foundItems.length) return;

    const matchedItem = foundItems.find(
      (item) => String(item._id) === String(itemId),
    );
    if (matchedItem) {
      setSelectedItem(matchedItem);
    }
  }, [location.search, foundItems]);

  useEffect(() => {
    const fetchTimeline = async () => {
      if (!selectedItem?._id) {
        setTimelineData(null);
        return;
      }

      setTimelineLoading(true);
      setTimelineError("");

      try {
        const res = await fetch(
          `${API_BASE}/api/items/${selectedItem._id}/timeline`,
        );
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to load timeline");
        }

        setTimelineData(data);
      } catch (err) {
        setTimelineError(err.message || "Failed to load timeline");
        setTimelineData(null);
      } finally {
        setTimelineLoading(false);
      }
    };

    fetchTimeline();
  }, [selectedItem?._id]);

  // Filter logic
  const filteredItems = foundItems.filter((item) => {
    const titleMatch = item.itemName
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());

    const categoryMatch =
      categoryFilter === "all" || item.category === categoryFilter;

    const locationMatch = locationFilter
      ? item.location?.toLowerCase().includes(locationFilter.toLowerCase())
      : true;

    return titleMatch && categoryMatch && locationMatch;
  });

  const recentItems = foundItems.filter((item) => {
    if (!item.createdAt) return false;
    const age = Date.now() - new Date(item.createdAt).getTime();
    return age < 1000 * 60 * 60 * 24 * 7;
  }).length;

  const withImageCount = foundItems.filter((item) =>
    Boolean(item.image),
  ).length;

  const displayedItems = filteredItems.filter((item) => {
    if (activeView === "overview") return true;
    if (activeView === "withImage") return Boolean(item.image);
    if (activeView === "location")
      return Boolean(item.location && String(item.location).trim());
    if (activeView === "recent") {
      if (!item.createdAt) return false;
      const age = Date.now() - new Date(item.createdAt).getTime();
      return age < 1000 * 60 * 60 * 24 * 7;
    }
    return true;
  });

  const recentPreviewItems = [...foundItems]
    .filter((item) => item.createdAt)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 4);

  const imagePreviewItems = foundItems
    .filter((item) => Boolean(item.image))
    .slice(0, 4);

  const locationStats = Object.entries(
    foundItems.reduce((acc, item) => {
      const key = item.location?.trim() || "Unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const formatItemDateTime = (item) => {
    if (item?.itemDate && item?.itemTime) {
      const parsedDate = new Date(item.itemDate);
      if (!Number.isNaN(parsedDate.getTime())) {
        return `${parsedDate.toLocaleDateString()} ${item.itemTime}`;
      }
      return `${item.itemDate} ${item.itemTime}`;
    }

    if (item?.createdAt) {
      const createdAtDate = new Date(item.createdAt);
      if (!Number.isNaN(createdAtDate.getTime())) {
        return createdAtDate.toLocaleString();
      }
    }

    return "Not available";
  };

  const shortDate = (value) => {
    if (!value) return "--";
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return "--";
    return dt.toLocaleDateString();
  };

  const formatTimelineTime = (value) => {
    if (!value) return "Pending";
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return "Pending";
    return dt.toLocaleString();
  };

  const fallbackTimeline = selectedItem
    ? [
        {
          status: "found",
          timestamp: selectedItem.createdAt || new Date().toISOString(),
          note: "Item posted as found.",
        },
      ]
    : [];

  const timelineEntries = (
    timelineData?.timeline ||
    selectedItem?.timeline ||
    fallbackTimeline
  ).reduce((acc, entry) => {
    if (!entry?.status || !entry?.timestamp) return acc;
    if (!acc.some((existing) => existing.status === entry.status)) {
      acc.push(entry);
    }
    return acc;
  }, []);

  const currentTrackingStatus =
    timelineData?.currentStatus ||
    selectedItem?.trackingStatus ||
    timelineEntries[timelineEntries.length - 1]?.status ||
    "found";

  const currentStatusIndex = Math.max(
    TIMELINE_STEPS.findIndex((step) => step.key === currentTrackingStatus),
    0,
  );
  const progressPercent =
    (currentStatusIndex / (TIMELINE_STEPS.length - 1)) * 100;

  const userInfo = (() => {
    try {
      return JSON.parse(localStorage.getItem("userInfo") || "null");
    } catch {
      return null;
    }
  })();

  const selectedOwnerId =
    typeof selectedItem?.userId === "object"
      ? selectedItem?.userId?._id
      : selectedItem?.userId;

  const canMarkReturned =
    !!selectedItem &&
    currentTrackingStatus !== "returned" &&
    !!userInfo?.token &&
    (userInfo?.isAdmin || String(userInfo?._id) === String(selectedOwnerId));

  const markAsReturned = async () => {
    if (!selectedItem?._id || !userInfo?.token) return;

    setMarkReturnedLoading(true);
    setMarkReturnedError("");

    try {
      const res = await fetch(
        `${API_BASE}/api/items/${selectedItem._id}/tracking-status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userInfo.token}`,
          },
          body: JSON.stringify({
            status: "returned",
            note: "Item marked as returned to the rightful owner.",
          }),
        },
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to mark as returned");
      }

      const updatedItem = data.item;
      setSelectedItem(updatedItem);
      setTimelineData((prev) => ({
        ...(prev || {}),
        itemId: updatedItem._id,
        itemName: updatedItem.itemName,
        currentStatus: updatedItem.trackingStatus,
        timeline: updatedItem.timeline,
      }));

      setFoundItems((prev) =>
        prev.map((item) =>
          String(item._id) === String(updatedItem._id)
            ? {
                ...item,
                trackingStatus: updatedItem.trackingStatus,
                timeline: updatedItem.timeline,
              }
            : item,
        ),
      );
    } catch (err) {
      setMarkReturnedError(err.message || "Failed to mark as returned");
    } finally {
      setMarkReturnedLoading(false);
    }
  };

  // Loading UI
  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-400 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_76%_20%,rgba(20,184,166,0.22),transparent_32%),radial-gradient(circle_at_2%_80%,rgba(6,182,212,0.14),transparent_36%)]" />

      <div className="relative mx-auto max-w-[1350px] px-4 pb-24 pt-14 md:px-6">
        <div className="flex gap-5 lg:h-[calc(100vh-7rem)] lg:overflow-hidden xl:gap-7">
          <aside className="sticky top-24 hidden h-fit w-[320px] shrink-0 rounded-3xl border border-slate-700/80 bg-slate-900/85 p-5 shadow-xl shadow-black/25 backdrop-blur lg:block lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto">
            <div className="rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 p-4 text-white">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-100">
                Found Management
              </p>
              <h2 className="mt-1 text-xl font-black">Found Hub</h2>
              <button
                type="button"
                onClick={() =>
                  navigate("/post-item", {
                    state: { defaultCategory: "found" },
                  })
                }
                className="mt-3 w-full rounded-xl bg-slate-950/25 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-950/40"
              >
                + Post Found Item
              </button>
            </div>

            <div className="mt-5 space-y-2">
              {RAIL_VIEWS.map((view) => (
                <button
                  key={view.id}
                  type="button"
                  onClick={() => setActiveView(view.id)}
                  title={view.label}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                    activeView === view.id
                      ? "bg-cyan-500 text-slate-950"
                      : "bg-slate-800/80 text-slate-200 hover:bg-slate-700"
                  }`}
                >
                  <span aria-hidden="true" className="text-base">
                    {view.icon}
                  </span>
                  <span>{view.label}</span>
                </button>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Sidebar Search
              </p>

              <div className="mt-3 space-y-3">
                <input
                  type="text"
                  placeholder="Search found item..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
                />

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat === "all" ? "All Categories" : cat}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Filter location..."
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
                />

                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setCategoryFilter("all");
                    setLocationFilter("");
                    setActiveView("overview");
                  }}
                  className="w-full rounded-xl border border-cyan-300/30 bg-cyan-500/10 px-3 py-2.5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/25"
                >
                  Reset Sidebar Filters
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs">
              <div className="rounded-xl border border-slate-700 bg-slate-800/70 px-2 py-3 text-slate-300">
                <p className="text-slate-400">Found</p>
                <p className="mt-1 text-lg font-bold text-cyan-100">
                  {foundItems.length}
                </p>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-800/70 px-2 py-3 text-slate-300">
                <p className="text-slate-400">Showing</p>
                <p className="mt-1 text-lg font-bold text-cyan-100">
                  {displayedItems.length}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {RAIL_VIEWS.find((x) => x.id === activeView)?.label} Panel
              </p>

              {activeView === "overview" && (
                <div className="mt-3 space-y-2 text-xs text-slate-300">
                  <div className="rounded-xl border border-slate-700 bg-slate-800/70 p-3">
                    <p className="text-slate-400">Current Mode</p>
                    <p className="mt-1 text-sm font-semibold text-cyan-100">
                      Overview
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-700 bg-slate-800/70 p-3">
                    <p className="text-slate-400">Top Location</p>
                    <p className="mt-1 text-sm font-semibold text-cyan-100">
                      {locationStats[0]?.[0] || "Not available"}
                    </p>
                  </div>
                </div>
              )}

              {activeView === "recent" && (
                <div className="mt-3 space-y-2">
                  {recentPreviewItems.length ? (
                    recentPreviewItems.map((item) => (
                      <button
                        key={item._id}
                        type="button"
                        onClick={() => setSelectedItem(item)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-800/70 p-2 text-left transition hover:border-cyan-400/40"
                      >
                        <p className="line-clamp-1 text-xs font-semibold text-slate-100">
                          {item.itemName}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          {shortDate(item.createdAt)}
                        </p>
                      </button>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400">No recent items.</p>
                  )}
                </div>
              )}

              {activeView === "withImage" && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {imagePreviewItems.length ? (
                    imagePreviewItems.map((item) => (
                      <button
                        key={item._id}
                        type="button"
                        onClick={() => setSelectedItem(item)}
                        className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800/70 text-left transition hover:border-cyan-400/40"
                      >
                        <img
                          src={item.image}
                          alt={item.itemName}
                          className="h-16 w-full object-cover"
                        />
                        <p className="line-clamp-1 px-2 py-1.5 text-[11px] font-semibold text-slate-100">
                          {item.itemName}
                        </p>
                      </button>
                    ))
                  ) : (
                    <p className="col-span-2 text-xs text-slate-400">
                      No image items found.
                    </p>
                  )}
                </div>
              )}

              {activeView === "location" && (
                <div className="mt-3 space-y-2">
                  {locationStats.length ? (
                    locationStats.map(([loc, count]) => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() =>
                          setLocationFilter(loc === "Unknown" ? "" : loc)
                        }
                        className="flex w-full items-center justify-between rounded-xl border border-slate-700 bg-slate-800/70 px-3 py-2 text-xs text-slate-200 transition hover:border-cyan-400/40"
                      >
                        <span className="truncate text-left">{loc}</span>
                        <span className="rounded-md bg-slate-700 px-2 py-0.5 text-[11px] text-cyan-100">
                          {count}
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400">
                      No location data found.
                    </p>
                  )}
                </div>
              )}
            </div>
          </aside>

          <main className="min-w-0 flex-1 lg:h-full lg:overflow-y-auto lg:pr-2">
            <section className="rounded-3xl border border-cyan-400/20 bg-slate-900/65 p-6 shadow-[0_22px_70px_rgba(0,0,0,0.42)] backdrop-blur-xl md:p-8">
              <div className="mb-4 flex flex-wrap gap-2 lg:hidden">
                {RAIL_VIEWS.map((view) => (
                  <button
                    key={view.id}
                    type="button"
                    onClick={() => setActiveView(view.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                      activeView === view.id
                        ? "bg-cyan-400 text-slate-950"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    {view.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    navigate("/post-item", {
                      state: { defaultCategory: "found" },
                    })
                  }
                  className="rounded-full bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-slate-950"
                >
                  + Post Found Item
                </button>
              </div>

              <div className="mb-4 rounded-2xl border border-slate-700 bg-slate-900/70 p-4 lg:hidden">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Search & Filter
                </p>
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <input
                    type="text"
                    placeholder="Search found item..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
                  />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat === "all" ? "All Categories" : cat}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Filter location..."
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-100">
                    Found Items Board
                  </p>
                  <h1 className="mt-3 text-3xl font-black tracking-tight text-cyan-50 md:text-5xl">
                    Track. Verify. Claim.
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm text-cyan-100/80 md:text-base">
                    A dedicated command center for recovered items with quick
                    views, smart filters, and direct claim actions.
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start md:self-auto">
                  <button
                    type="button"
                    onClick={() =>
                      navigate("/post-item", {
                        state: { defaultCategory: "found" },
                      })
                    }
                    className="rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 px-4 py-2 text-sm font-bold text-slate-950 transition hover:from-cyan-300 hover:to-teal-300"
                  >
                    + Post Found Item
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm("");
                      setCategoryFilter("all");
                      setLocationFilter("");
                      setActiveView("overview");
                    }}
                    className="rounded-xl border border-cyan-300/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/25"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-2xl border border-cyan-300/25 bg-black/25 px-4 py-3 text-cyan-50">
                  <p className="text-xs text-cyan-100/70">Total Found</p>
                  <p className="mt-1 text-2xl font-bold">{foundItems.length}</p>
                </div>
                <div className="rounded-2xl border border-cyan-300/25 bg-black/25 px-4 py-3 text-cyan-50">
                  <p className="text-xs text-cyan-100/70">This Week</p>
                  <p className="mt-1 text-2xl font-bold">{recentItems}</p>
                </div>
                <div className="rounded-2xl border border-cyan-300/25 bg-black/25 px-4 py-3 text-cyan-50">
                  <p className="text-xs text-cyan-100/70">With Photo</p>
                  <p className="mt-1 text-2xl font-bold">{withImageCount}</p>
                </div>
                <div className="rounded-2xl border border-cyan-300/25 bg-black/25 px-4 py-3 text-cyan-50">
                  <p className="text-xs text-cyan-100/70">Showing</p>
                  <p className="mt-1 text-2xl font-bold">
                    {displayedItems.length}
                  </p>
                </div>
              </div>

              {error && (
                <p className="mt-4 text-sm font-semibold text-rose-300">
                  {error}
                </p>
              )}
            </section>

            <div className="mt-5 flex items-center justify-between">
              <p className="text-xs text-slate-400 md:text-sm">
                Showing {displayedItems.length} of {foundItems.length} listings
              </p>
              <p className="rounded-lg border border-cyan-400/25 px-3 py-1.5 text-xs font-semibold text-cyan-100">
                View: {RAIL_VIEWS.find((x) => x.id === activeView)?.label}
              </p>
            </div>

            <section className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {displayedItems.length > 0 ? (
                displayedItems.map((item) => (
                  <article
                    key={item._id}
                    className="group overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-900/65 shadow-lg shadow-black/20 transition duration-300 hover:-translate-y-1 hover:border-cyan-400/50"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={
                          item.image ||
                          "https://via.placeholder.com/600x400?text=Found+Item"
                        }
                        alt={item.itemName}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                      <div className="absolute left-3 top-3 rounded-full border border-cyan-300/30 bg-cyan-500/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-cyan-100 backdrop-blur">
                        Found
                      </div>
                    </div>

                    <div className="p-5">
                      <h2 className="line-clamp-1 text-lg font-bold text-slate-100">
                        {item.itemName}
                      </h2>
                      <p className="mt-1 text-xs text-slate-400">
                        Logged {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                      <p className="mt-3 line-clamp-2 text-sm text-slate-300/90">
                        {item.description || "No description available."}
                      </p>
                      <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                        <span className="truncate">
                          {item.location || "Unknown location"}
                        </span>
                        <span className="rounded-md bg-slate-800 px-2 py-1 text-slate-300">
                          Verified Form
                        </span>
                      </div>

                      <button
                        onClick={() => setSelectedItem(item)}
                        className="mt-4 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 py-2.5 text-sm font-semibold text-white transition hover:from-cyan-400 hover:to-teal-400"
                      >
                        View Listing
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <div className="col-span-full rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 px-6 py-16 text-center">
                  <p className="text-slate-300">
                    No found items available for this filter.
                  </p>
                </div>
              )}
            </section>
          </main>
        </div>
      </div>

      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-3 py-4 backdrop-blur-sm sm:px-4">
          <div className="flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/40 max-h-[88vh]">
            <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3 sm:px-5">
              <h3 className="text-lg font-semibold text-cyan-100">
                Found Listing Details
              </h3>
              <button
                onClick={closeSelectedItem}
                className="text-slate-400 transition hover:text-rose-300"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 gap-5 overflow-y-auto p-4 text-sm sm:p-5 md:grid-cols-2">
              <img
                src={
                  selectedItem.image ||
                  "https://via.placeholder.com/800x500?text=Found+Item"
                }
                alt={selectedItem.itemName}
                className="h-52 w-full rounded-xl object-cover sm:h-60 md:h-full md:max-h-[620px]"
              />

              <div className="space-y-3">
                <h4 className="text-2xl font-bold text-cyan-50">
                  {selectedItem.itemName}
                </h4>

                <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                  <span className="text-slate-300">Status</span>
                  <span
                    className={`rounded-full border px-2 py-0.5 ${statusBadgeMap[currentTrackingStatus] || statusBadgeMap.found}`}
                  >
                    {TIMELINE_STEPS.find(
                      (step) => step.key === currentTrackingStatus,
                    )?.label || "Found"}
                  </span>
                </div>

                <p className="text-slate-300">
                  <span className="text-slate-400">Category:</span>{" "}
                  {selectedItem.category}
                </p>

                <p className="text-slate-300">
                  <span className="text-slate-400">Location:</span>{" "}
                  {selectedItem.location}
                </p>

                <p className="text-slate-300">
                  <span className="text-slate-400">Found Date:</span>{" "}
                  {formatItemDateTime(selectedItem)}
                </p>

                <div>
                  <p className="text-slate-400">Description:</p>
                  <p className="text-slate-300">{selectedItem.description}</p>
                </div>

                <div className="border-t border-slate-700 pt-3">
                  <p className="text-slate-400">
                    Owner contact details are hidden for privacy.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-700 bg-slate-950/50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Timeline Tracking
                    </p>
                    <p className="text-xs text-slate-400">
                      {Math.round(progressPercent)}% complete
                    </p>
                  </div>

                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400 transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  {timelineLoading ? (
                    <p className="mt-3 text-xs text-slate-400">
                      Loading timeline...
                    </p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {TIMELINE_STEPS.map((step, index) => {
                        const entry = timelineEntries.find(
                          (timelineEntry) => timelineEntry.status === step.key,
                        );
                        const isCompleted = index <= currentStatusIndex;
                        const isCurrent = step.key === currentTrackingStatus;

                        return (
                          <div
                            key={step.key}
                            className={`rounded-xl border px-3 py-2 transition ${
                              isCompleted
                                ? "border-cyan-400/35 bg-cyan-500/10"
                                : "border-slate-700 bg-slate-900/80"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <span className="text-base" aria-hidden="true">
                                  {step.icon}
                                </span>
                                <p className="text-sm font-semibold text-slate-100">
                                  {step.label}
                                  {isCurrent ? " (Current)" : ""}
                                </p>
                              </div>
                              <span className="text-xs text-slate-400">
                                {formatTimelineTime(entry?.timestamp)}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-400">
                              {entry?.note || "Waiting for this stage."}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {timelineError && (
                    <p className="mt-3 text-xs font-semibold text-rose-300">
                      {timelineError}
                    </p>
                  )}
                </div>

                {canMarkReturned && (
                  <button
                    type="button"
                    onClick={markAsReturned}
                    disabled={markReturnedLoading}
                    className="w-full rounded-xl border border-emerald-400/30 bg-emerald-500/15 px-4 py-2.5 font-semibold text-emerald-200 transition hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {markReturnedLoading ? "Updating..." : "Mark as Returned"}
                  </button>
                )}

                {markReturnedError && (
                  <p className="text-xs font-semibold text-rose-300">
                    {markReturnedError}
                  </p>
                )}

                <button
                  onClick={() => setShowContactForm(true)}
                  className="mt-4 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2.5 font-semibold text-white transition hover:from-cyan-400 hover:to-teal-400"
                >
                  Claim This Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showContactForm && selectedItem && (
        <ContactForm
          itemDetails={selectedItem}
          itemOwner={{
            email: selectedItem.email || selectedItem.userId?.email,
            _id: selectedItem.userId,
          }}
          onClose={() => {
            closeSelectedItem();
          }}
        />
      )}

      <AIChatBox />
    </div>
  );
};

export default FoundItems;
