import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ContactForm from "../components/ContactForm";
import AIChatBox from "../components/AIChatBox";
import { API_BASE } from "../config/api";

const CATEGORIES = ["all", "ID Card", "Mobile", "Wallet", "Bag", "Other"];

const LostItems = () => {
  const [lostItems, setLostItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("");

  const [selectedItem, setSelectedItem] = useState(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
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
    clearItemQuery();
  };

  // Fetch lost items
  useEffect(() => {
    const user = localStorage.getItem("userInfo");
    if (user) {
      setUserInfo(JSON.parse(user));
    }
  }, []);

  useEffect(() => {
    const fetchLostItems = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/items/lost?limit=24&skip=0`);
        const data = await res.json();

        if (res.ok) {
          setLostItems(data);
        } else {
          setError(data.message || "Failed to fetch lost items");
        }
      } catch (err) {
        setError("Server connection failed");
      } finally {
        setLoading(false);
      }
    };

    fetchLostItems();
  }, []);

  useEffect(() => {
    const itemId = new URLSearchParams(location.search).get("itemId");
    if (!itemId || !lostItems.length) return;

    const matchedItem = lostItems.find(
      (item) => String(item._id) === String(itemId),
    );
    if (matchedItem) {
      setSelectedItem(matchedItem);
    }
  }, [location.search, lostItems]);

  // Filter logic
  const filteredItems = lostItems.filter((item) => {
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

  const withImageCount = lostItems.filter((item) => Boolean(item.image)).length;

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

  // Loading UI
  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(251,146,60,0.16),transparent_35%),radial-gradient(circle_at_85%_10%,rgba(248,113,113,0.16),transparent_28%)]" />

      <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-20">
        <section className="rounded-3xl border border-orange-500/20 bg-slate-900/60 p-8 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl md:p-10">
          <p className="inline-flex rounded-full border border-orange-400/30 bg-orange-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-200">
            Lost Desk
          </p>
          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-orange-50 md:text-5xl">
                Trace Lost Belongings
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-orange-100/80 md:text-base">
                Search through reports of missing items and quickly open a
                secure contact request when you find a match.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs md:text-sm">
              <button
                type="button"
                onClick={() =>
                  navigate("/post-item", {
                    state: { defaultCategory: "lost" },
                  })
                }
                className="col-span-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-lg shadow-orange-900/30 transition hover:from-orange-400 hover:to-red-400"
              >
                + Create Lost Item Post
              </button>
              <div className="rounded-xl border border-orange-400/25 bg-black/30 px-4 py-3 text-orange-50">
                <p className="text-orange-200/80">Total Report</p>
                <p className="mt-1 text-xl font-bold">{lostItems.length}</p>
              </div>
              <div className="rounded-xl border border-orange-400/25 bg-black/30 px-4 py-3 text-orange-50">
                <p className="text-orange-200/80">With Images</p>
                <p className="mt-1 text-xl font-bold">{withImageCount}</p>
              </div>
            </div>
          </div>
          {error && (
            <p className="mt-4 text-sm font-semibold text-rose-300">{error}</p>
          )}
        </section>

        <section className="mt-8 rounded-2xl border border-slate-700/60 bg-slate-900/70 p-5 backdrop-blur md:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Search Item
              </span>
              <input
                type="text"
                placeholder="Bag, wallet, id card..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-orange-400"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Category
              </span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-orange-400"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === "all" ? "All Categories" : cat}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Location
              </span>
              <input
                type="text"
                placeholder="Library, canteen, lecture hall..."
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-orange-400"
              />
            </label>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-slate-400 md:text-sm">
              Showing {filteredItems.length} of {lostItems.length} reports
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setCategoryFilter("all");
                setLocationFilter("");
              }}
              className="rounded-lg border border-orange-400/30 px-3 py-1.5 text-xs font-semibold text-orange-200 transition hover:bg-orange-500/15"
            >
              Reset Filters
            </button>
          </div>
        </section>

        <section className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <article
                key={item._id}
                className="group overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-900/65 shadow-lg shadow-black/20 transition duration-300 hover:-translate-y-1 hover:border-orange-400/50"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={
                      item.image ||
                      "https://via.placeholder.com/600x400?text=Lost+Item"
                    }
                    alt={item.itemName}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute left-3 top-3 rounded-full border border-orange-300/30 bg-orange-500/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-orange-100 backdrop-blur">
                    Lost
                  </div>
                </div>

                <div className="p-5">
                  <h2 className="line-clamp-1 text-lg font-bold text-slate-100">
                    {item.itemName}
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Reported {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                  <p className="mt-3 line-clamp-2 text-sm text-slate-300/90">
                    {item.description || "No description available."}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                    <span className="truncate">
                      {item.location || "Unknown location"}
                    </span>
                    <span className="rounded-md bg-slate-800 px-2 py-1 text-slate-300">
                      Private Contact
                    </span>
                  </div>

                  <button
                    onClick={() => setSelectedItem(item)}
                    className="mt-4 w-full rounded-xl bg-gradient-to-r from-orange-500 to-red-500 py-2.5 text-sm font-semibold text-white transition hover:from-orange-400 hover:to-red-400"
                  >
                    View Report
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 px-6 py-16 text-center">
              <p className="text-slate-300">
                No lost items found for this filter.
              </p>
            </div>
          )}
        </section>
      </div>

      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4">
              <h3 className="text-lg font-semibold text-orange-100">
                Lost Report Details
              </h3>
              <button
                onClick={closeSelectedItem}
                className="text-slate-400 transition hover:text-rose-300"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6 p-6 text-sm md:grid-cols-2">
              <img
                src={
                  selectedItem.image ||
                  "https://via.placeholder.com/800x500?text=Lost+Item"
                }
                alt={selectedItem.itemName}
                className="h-72 w-full rounded-xl object-cover"
              />

              <div className="space-y-3">
                <h4 className="text-2xl font-bold text-orange-50">
                  {selectedItem.itemName}
                </h4>

                <p className="text-slate-300">
                  <span className="text-slate-400">Category:</span>{" "}
                  {selectedItem.category}
                </p>

                <p className="text-slate-300">
                  <span className="text-slate-400">Location:</span>{" "}
                  {selectedItem.location}
                </p>

                <p className="text-slate-300">
                  <span className="text-slate-400">Lost Date:</span>{" "}
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

                {(() => {
                  const ownerId =
                    selectedItem.userId?._id || selectedItem.userId;
                  const isOwner =
                    userInfo?._id &&
                    ownerId &&
                    String(ownerId) === String(userInfo._id);

                  if (isOwner) {
                    return (
                      <div className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-center font-semibold text-slate-400">
                        You cannot contact your own item
                      </div>
                    );
                  }

                  return (
                    <button
                      onClick={() => setShowContactForm(true)}
                      className="mt-4 w-full rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2.5 font-semibold text-white transition hover:from-orange-400 hover:to-red-400"
                    >
                      Contact Finder
                    </button>
                  );
                })()}
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

export default LostItems;
