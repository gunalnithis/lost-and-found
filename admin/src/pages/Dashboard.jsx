import { useState, useEffect } from "react";
import {
  Users,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  MapPin,
  Circle,
  CircleCheckBig,
} from "lucide-react";
import { Link } from "react-router-dom";

const API_BASE = "http://127.0.0.1:8000";

const TIMELINE_META = {
  found: { label: "Found", accent: "text-cyan-600", bg: "bg-cyan-100" },
  contacted: {
    label: "Contacted",
    accent: "text-sky-600",
    bg: "bg-sky-100",
  },
  claim_requested: {
    label: "Claim Requested",
    accent: "text-amber-600",
    bg: "bg-amber-100",
  },
  verifying: {
    label: "Verifying",
    accent: "text-indigo-600",
    bg: "bg-indigo-100",
  },
  returned: {
    label: "Returned",
    accent: "text-emerald-600",
    bg: "bg-emerald-100",
  },
};

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalItems: 0,
    pendingItems: 0,
    approvedItems: 0,
    lostCount: 0,
    foundCount: 0,
  });
  const [recentItems, setRecentItems] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [timelineOverview, setTimelineOverview] = useState({
    steps: [],
    statusCounts: {},
    items: [],
  });
  const [selectedTimelineItemId, setSelectedTimelineItemId] = useState("");
  const [timelineError, setTimelineError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [statsRes, itemsRes, usersRes] = await Promise.all([
          fetch(`${API_BASE}/api/items/stats/summary`),
          fetch(`${API_BASE}/api/items?limit=5&skip=0`),
          fetch(`${API_BASE}/api/users?limit=6&skip=0&includeTotal=true`),
        ]);

        if (!statsRes.ok) {
          const statsError = await statsRes.json().catch(() => ({}));
          throw new Error(
            statsError.message || `Stats Error: ${statsRes.status}`,
          );
        }
        if (!itemsRes.ok) {
          const itemError = await itemsRes.json().catch(() => ({}));
          throw new Error(
            itemError.message || `Items Error: ${itemsRes.status}`,
          );
        }
        if (!usersRes.ok) {
          const userError = await usersRes.json().catch(() => ({}));
          throw new Error(
            userError.message || `Users Error: ${usersRes.status}`,
          );
        }

        const statsData = await statsRes.json();
        const items = await itemsRes.json();
        const users = await usersRes.json();
        const totalUsers = parseInt(
          usersRes.headers.get("X-Total-Count") || "0",
          10,
        );

        const itemsArray = Array.isArray(items) ? items : [];
        const usersArray = Array.isArray(users) ? users : [];

        let timelinePayload = { steps: [], statusCounts: {}, items: [] };
        let timelineFetchError = "";

        try {
          const timelineRes = await fetch(
            `${API_BASE}/api/items/found/timeline-overview?limit=8`,
          );

          const timelineData = await timelineRes.json().catch(() => ({}));
          if (!timelineRes.ok) {
            throw new Error(
              timelineData.message || `Timeline Error: ${timelineRes.status}`,
            );
          }

          timelinePayload = {
            steps: Array.isArray(timelineData.steps) ? timelineData.steps : [],
            statusCounts: timelineData.statusCounts || {},
            items: Array.isArray(timelineData.items) ? timelineData.items : [],
          };
        } catch (timelineErr) {
          timelineFetchError =
            timelineErr.message || "Timeline data is temporarily unavailable.";
        }

        setStats({
          totalUsers,
          totalItems: statsData.totalItems || 0,
          pendingItems: statsData.pendingItems || 0,
          approvedItems: statsData.approvedItems || 0,
          lostCount: statsData.lostCount || 0,
          foundCount: statsData.foundCount || 0,
        });

        setRecentItems(itemsArray);
        setRecentUsers(usersArray);
        setTimelineOverview(timelinePayload);
        setSelectedTimelineItemId(
          (prev) => prev || timelinePayload.items[0]?._id || "",
        );
        setTimelineError(timelineFetchError);
        setLoading(false);
      } catch (err) {
        console.error("Dashboard Fetch Error:", err);
        setError(
          err.message === "Failed to fetch"
            ? "Unable to connect to the backend server. Please ensure node server.js is running on port 8000."
            : err.message,
        );
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const timelineSteps = timelineOverview.steps;
  const timelineItems = timelineOverview.items;
  const selectedTimelineItem =
    timelineItems.find((item) => item._id === selectedTimelineItemId) ||
    timelineItems[0] ||
    null;

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <p className="text-gray-500 font-medium animate-pulse">
          Loading system overview...
        </p>
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6 bg-red-50 rounded-3xl border border-red-100 text-center">
        <AlertCircle className="text-red-500 mb-4" size={48} />
        <h3 className="text-xl font-bold text-red-800 mb-2">
          Connection Error
        </h3>
        <p className="text-red-600 max-w-md mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            System Overview
          </h2>
          <p className="text-gray-500 mt-1 font-medium">
            Hello Admin, here's what's happening on campus today.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100">
          <TrendingUp className="text-indigo-600" size={20} />
          <span className="text-indigo-700 font-bold">Live Status</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<Users className="text-blue-600" />}
          title="Total Users"
          value={stats.totalUsers}
          color="bg-blue-50"
          textColor="text-blue-600"
        />
        <StatCard
          icon={<Package className="text-indigo-600" />}
          title="Total Reports"
          value={stats.totalItems}
          color="bg-indigo-50"
          textColor="text-indigo-600"
        />
        <StatCard
          icon={<Clock className="text-amber-600" />}
          title="Lost Reports"
          value={stats.lostCount}
          color="bg-amber-50"
          textColor="text-amber-600"
        />
        <StatCard
          icon={<CheckCircle2 className="text-emerald-600" />}
          title="Found Reports"
          value={stats.foundCount}
          color="bg-emerald-50"
          textColor="text-emerald-600"
        />
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 p-6 md:p-7">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-600">
              Timeline Tracking
            </p>
            <h3 className="mt-1 text-2xl font-black text-gray-900">
              Found Item Lifecycle Monitor
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Live backend timeline from found report to return verification.
            </p>
          </div>

          {selectedTimelineItem && (
            <div className="rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-cyan-700">
                Current Focus
              </p>
              <p className="mt-1 text-sm font-black text-cyan-900">
                {selectedTimelineItem.itemName}
              </p>
              <p className="text-xs text-cyan-700">
                {selectedTimelineItem.location || "Unknown location"}
              </p>
            </div>
          )}
        </div>

        {!!timelineSteps.length && (
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {timelineSteps.map((step) => {
              const key = step.key;
              const meta = TIMELINE_META[key] || {
                label: step.label,
                accent: "text-gray-600",
                bg: "bg-gray-100",
              };

              return (
                <div
                  key={key}
                  className={`rounded-xl border border-gray-100 px-3 py-2 ${meta.bg}`}
                >
                  <p
                    className={`text-[11px] font-black uppercase tracking-wide ${meta.accent}`}
                  >
                    {meta.label}
                  </p>
                  <p className="mt-1 text-lg font-black text-gray-900">
                    {timelineOverview.statusCounts?.[key] || 0}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {timelineItems.length > 0 ? (
          <>
            <div className="mt-5">
              <label className="text-xs font-bold uppercase tracking-wide text-gray-500">
                Select Found Item
              </label>
              <select
                value={selectedTimelineItem?._id || ""}
                onChange={(e) => setSelectedTimelineItemId(e.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-semibold text-gray-800 outline-none transition focus:border-cyan-400"
              >
                {timelineItems.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.itemName} -{" "}
                    {(
                      TIMELINE_META[item.currentStatus]?.label ||
                      item.currentStatus
                    ).toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {selectedTimelineItem && (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                      Progress
                    </p>
                    <p className="text-sm font-bold text-gray-700">
                      {TIMELINE_META[selectedTimelineItem.currentStatus]
                        ?.label || selectedTimelineItem.currentStatus}
                    </p>
                  </div>
                  <p className="text-sm font-black text-cyan-700">
                    {selectedTimelineItem.progressPercent || 0}%
                  </p>
                </div>

                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-emerald-500 transition-all duration-500"
                    style={{
                      width: `${selectedTimelineItem.progressPercent || 0}%`,
                    }}
                  />
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  {timelineSteps.map((step, index) => {
                    const currentIndex = timelineSteps.findIndex(
                      (s) => s.key === selectedTimelineItem.currentStatus,
                    );
                    const completed = index <= currentIndex;
                    const entry = (selectedTimelineItem.timeline || []).find(
                      (timelineEntry) => timelineEntry.status === step.key,
                    );

                    return (
                      <div
                        key={step.key}
                        className={`rounded-xl border px-3 py-3 ${completed ? "border-cyan-200 bg-cyan-50" : "border-gray-200 bg-white"}`}
                      >
                        <div className="flex items-center gap-2">
                          {completed ? (
                            <CircleCheckBig
                              size={16}
                              className="text-cyan-600"
                            />
                          ) : (
                            <Circle size={16} className="text-gray-300" />
                          )}
                          <p className="text-xs font-black uppercase tracking-wide text-gray-700">
                            {TIMELINE_META[step.key]?.label || step.label}
                          </p>
                        </div>
                        <p className="mt-2 text-[11px] text-gray-500">
                          {entry?.timestamp
                            ? new Date(entry.timestamp).toLocaleString()
                            : "Waiting for step"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5 text-sm text-gray-500">
            No found item timelines available yet.
          </div>
        )}

        {timelineError && (
          <p className="mt-4 text-xs font-bold text-rose-600">
            {timelineError}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Recent Items Table */}
        <div className="xl:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
              <h3 className="font-bold text-gray-800 text-lg">
                Recently Reported
              </h3>
              <Link
                to="/items"
                className="text-indigo-600 hover:text-indigo-700 font-bold text-sm flex items-center gap-1 group transition-all"
              >
                View All{" "}
                <ArrowRight
                  size={14}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Item</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentItems.map((item) => (
                    <tr
                      key={item._id}
                      className="hover:bg-gray-50/50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image || "https://via.placeholder.com/40"}
                            alt=""
                            loading="lazy"
                            className="w-10 h-10 rounded-xl object-cover ring-2 ring-gray-100 group-hover:ring-indigo-100 transition-all"
                          />
                          <div>
                            <p className="font-bold text-gray-800 text-sm">
                              {item.itemName}
                            </p>
                            <p
                              className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md inline-block mt-1 ${item.category === "lost" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}
                            >
                              {item.category}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`flex items-center gap-1.5 text-xs font-bold ${
                            item.status === "approved"
                              ? "text-emerald-600"
                              : item.status === "rejected"
                                ? "text-red-600"
                                : "text-amber-600"
                          }`}
                        >
                          {item.status === "approved" ? (
                            <CheckCircle2 size={12} />
                          ) : item.status === "rejected" ? (
                            <AlertCircle size={12} />
                          ) : (
                            <Clock size={12} />
                          )}
                          {item.status || "pending"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <MapPin size={12} className="text-gray-300" />
                          {item.location}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400 font-medium whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
              <h3 className="font-bold text-gray-800 text-lg">
                New User Activity
              </h3>
              <Link
                to="/users"
                className="text-indigo-600 hover:text-indigo-700 font-bold text-sm flex items-center gap-1"
              >
                Full Directory <ArrowRight size={14} />
              </Link>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentUsers.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center gap-4 bg-gray-50/50 p-4 rounded-2xl border border-transparent hover:border-indigo-100 hover:bg-white hover:shadow-lg hover:shadow-indigo-100/50 transition-all"
                >
                  <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-sm leading-none">
                      {user.name}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1 font-mono">
                      {user.itNumber}
                    </p>
                    <p className="text-[10px] text-indigo-500 font-bold mt-1 uppercase tracking-wider">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-3xl text-white shadow-xl shadow-indigo-200/50">
            <h4 className="font-bold text-xl mb-6">Report Distribution</h4>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-bold">
                  <span>Lost Items</span>
                  <span>
                    {Math.round(
                      (stats.lostCount / stats.totalItems) * 100 || 0,
                    )}
                    %
                  </span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-1000"
                    style={{
                      width: `${(stats.lostCount / stats.totalItems) * 100 || 0}%`,
                    }}
                  ></div>
                </div>
                <p className="text-indigo-100 text-xs">
                  {stats.lostCount} reports filed
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm font-bold">
                  <span>Found Items</span>
                  <span>
                    {Math.round(
                      (stats.foundCount / stats.totalItems) * 100 || 0,
                    )}
                    %
                  </span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-300 rounded-full transition-all duration-1000"
                    style={{
                      width: `${(stats.foundCount / stats.totalItems) * 100 || 0}%`,
                    }}
                  ></div>
                </div>
                <p className="text-indigo-100 text-xs">
                  {stats.foundCount} reports filed
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50">
            <h4 className="font-bold text-gray-800 mb-4">Quick Links</h4>
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/users"
                className="p-4 bg-gray-50 hover:bg-indigo-50 rounded-2xl transition-all group flex flex-col items-center gap-2"
              >
                <Users
                  className="text-gray-400 group-hover:text-indigo-600 transition-colors"
                  size={24}
                />
                <span className="text-sm font-bold text-gray-700 group-hover:text-indigo-700">
                  Users
                </span>
              </Link>
              <Link
                to="/items"
                className="p-4 bg-gray-50 hover:bg-emerald-50 rounded-2xl transition-all group flex flex-col items-center gap-2"
              >
                <Package
                  className="text-gray-400 group-hover:text-emerald-600 transition-colors"
                  size={24}
                />
                <span className="text-sm font-bold text-gray-700 group-hover:text-emerald-700">
                  Items
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, title, value, color, textColor }) => (
  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 flex flex-col gap-4">
    <div
      className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center`}
    >
      {icon}
    </div>
    <div>
      <p className="text-gray-500 font-bold text-xs uppercase tracking-wider">
        {title}
      </p>
      <h3 className={`text-3xl font-black mt-1 ${textColor}`}>{value}</h3>
    </div>
  </div>
);

export default Dashboard;
