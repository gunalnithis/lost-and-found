import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Calendar,
  Download,
  Filter,
  Mail,
  MessageSquare,
  Reply,
  Search,
  Star,
  Tag,
  Trash2,
  User,
} from "lucide-react";

const API_BASE = "http://127.0.0.1:8000";

const STATUS_OPTIONS = ["pending", "reviewed", "replied"];
const CATEGORY_OPTIONS = ["all", "general", "bug", "suggestion"];

const Feedbacks = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [summary, setSummary] = useState({
    totalFeedback: 0,
    averageRating: "0.00",
    positiveCount: 0,
    neutralCount: 0,
    negativeCount: 0,
  });
  const [analytics, setAnalytics] = useState({
    ratingDistribution: [],
    categoryCounts: [],
    trend: [],
    commonIssues: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedRating, setSelectedRating] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [replyDrafts, setReplyDrafts] = useState({});

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();
    params.set("limit", "200");
    params.set("skip", "0");
    if (searchTerm.trim()) params.set("search", searchTerm.trim());
    if (selectedCategory !== "all") params.set("category", selectedCategory);
    if (selectedStatus !== "all") params.set("status", selectedStatus);
    if (selectedRating !== "all") params.set("rating", selectedRating);
    return params.toString();
  }, [searchTerm, selectedCategory, selectedRating, selectedStatus]);

  const fetchSummary = async (queryString) => {
    const response = await fetch(
      `${API_BASE}/api/feedback/summary?${queryString}`,
    );
    if (!response.ok) {
      throw new Error("Failed to load summary");
    }
    const data = await response.json();
    setSummary(data || {});
  };

  const fetchAnalytics = async (queryString) => {
    const response = await fetch(
      `${API_BASE}/api/feedback/analytics?${queryString}`,
    );
    if (!response.ok) {
      throw new Error("Failed to load analytics");
    }
    const data = await response.json();
    setAnalytics(data || {});
  };

  const fetchFeedbacks = useCallback(async () => {
    try {
      setLoading(true);
      const queryString = buildQuery();
      const response = await fetch(`${API_BASE}/api/feedback?${queryString}`);
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to fetch feedbacks");
      }
      const data = await response.json();
      setFeedbacks(Array.isArray(data) ? data : []);
      await Promise.all([
        fetchSummary(queryString),
        fetchAnalytics(queryString),
      ]);
      setError("");
    } catch (err) {
      setError(err.message || "Unable to load feedbacks");
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  const exportCsv = () => {
    const header = [
      "Name",
      "Email",
      "Rating",
      "Category",
      "Status",
      "Message",
      "Reply",
      "CreatedAt",
    ];
    const rows = feedbacks.map((fb) => [
      fb.name || "Anonymous",
      fb.email || "",
      fb.rating || "",
      fb.category || "general",
      fb.status || "pending",
      (fb.message || "").replace(/\n/g, " "),
      (fb.reply?.message || "").replace(/\n/g, " "),
      fb.createdAt ? new Date(fb.createdAt).toISOString() : "",
    ]);
    const csv = [header, ...rows]
      .map((row) =>
        row.map((col) => `"${String(col).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "feedback-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    const header = [
      "Name",
      "Email",
      "Rating",
      "Category",
      "Status",
      "Message",
      "Reply",
      "CreatedAt",
    ];
    const rows = feedbacks.map((fb) => [
      fb.name || "Anonymous",
      fb.email || "",
      fb.rating || "",
      fb.category || "general",
      fb.status || "pending",
      fb.message || "",
      fb.reply?.message || "",
      fb.createdAt ? new Date(fb.createdAt).toLocaleString() : "",
    ]);
    const tsv = [header, ...rows].map((row) => row.join("\t")).join("\n");
    const blob = new Blob([tsv], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "feedback-report.xls";
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    window.print();
  };

  const handleStatusChange = async (feedback, status) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/feedback/${feedback._id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(data.message || "Failed to update status");
      setFeedbacks((prev) =>
        prev.map((item) => (item._id === data._id ? data : item)),
      );
      fetchSummary(buildQuery());
      fetchAnalytics(buildQuery());
    } catch (err) {
      alert(err.message || "Unable to update status");
    }
  };

  const handleReply = async (feedback) => {
    const replyMessage = (replyDrafts[feedback._id] || "").trim();
    if (!replyMessage) return;

    try {
      const response = await fetch(
        `${API_BASE}/api/feedback/${feedback._id}/reply`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: replyMessage, repliedBy: "admin" }),
        },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Failed to send reply");
      setFeedbacks((prev) =>
        prev.map((item) => (item._id === data._id ? data : item)),
      );
      setReplyDrafts((prev) => ({ ...prev, [feedback._id]: "" }));
      fetchSummary(buildQuery());
      fetchAnalytics(buildQuery());
    } catch (err) {
      alert(err.message || "Unable to send reply");
    }
  };

  const handleDelete = async (feedback) => {
    if (
      !window.confirm(`Delete feedback from ${feedback.name || "Anonymous"}?`)
    )
      return;

    try {
      const response = await fetch(`${API_BASE}/api/feedback/${feedback._id}`, {
        method: "DELETE",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Failed to delete feedback");
      }
      setFeedbacks((prev) => prev.filter((item) => item._id !== feedback._id));
      fetchSummary(buildQuery());
      fetchAnalytics(buildQuery());
    } catch (err) {
      alert(err.message || "Unable to delete feedback");
    }
  };

  const ratingMax = Math.max(
    1,
    ...(analytics.ratingDistribution || []).map((item) => item.count || 0),
  );

  const trendMax = Math.max(
    1,
    ...(analytics.trend || []).map((item) => item.count || 0),
  );

  const categoryCounts = analytics.categoryCounts || [];
  const categoryTotal = categoryCounts.reduce(
    (sum, item) => sum + (item.count || 0),
    0,
  );
  const categoryColorMap = {
    bug: "#ef4444",
    suggestion: "#22c55e",
    general: "#06b6d4",
  };
  let accumulated = 0;
  const categorySegments = categoryCounts.map((item) => {
    const portion = categoryTotal > 0 ? (item.count || 0) / categoryTotal : 0;
    const start = accumulated;
    accumulated += portion * 360;
    return `${categoryColorMap[item.category] || "#94a3b8"} ${start}deg ${accumulated}deg`;
  });
  const categoryPieStyle = {
    background:
      categorySegments.length > 0
        ? `conic-gradient(${categorySegments.join(", ")})`
        : "#e2e8f0",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[320px]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-950/40 p-5 text-red-300">
        <div className="flex items-center gap-2">
          <AlertCircle size={18} />
          <p className="font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Feedback Management
          </h2>
          <p className="text-gray-500">
            Review and handle all user feedback submissions
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700"
          >
            <Download size={14} /> CSV
          </button>
          <button
            onClick={exportExcel}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700"
          >
            <Download size={14} /> Excel
          </button>
          <button
            onClick={exportPdf}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700"
          >
            <Download size={14} /> PDF
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
          <p className="text-xs font-semibold uppercase text-cyan-700">
            Total Feedback
          </p>
          <p className="mt-1 text-3xl font-black text-cyan-900">
            {summary.totalFeedback || 0}
          </p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-semibold uppercase text-amber-700">
            Average Rating
          </p>
          <p className="mt-1 text-3xl font-black text-amber-900">
            {summary.averageRating || "0.00"}
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-semibold uppercase text-emerald-700">
            Positive
          </p>
          <p className="mt-1 text-3xl font-black text-emerald-900">
            {summary.positiveCount || 0}
          </p>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-xs font-semibold uppercase text-rose-700">
            Negative
          </p>
          <p className="mt-1 text-3xl font-black text-rose-900">
            {summary.negativeCount || 0}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="mb-4 text-sm font-bold text-gray-700">
            Rating Distribution
          </p>
          <div className="space-y-3">
            {(analytics.ratingDistribution || []).map((entry) => (
              <div key={entry.rating} className="flex items-center gap-3">
                <p className="w-12 text-xs font-semibold text-gray-600">
                  {entry.rating}★
                </p>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                    style={{
                      width: `${((entry.count || 0) / ratingMax) * 100}%`,
                    }}
                  />
                </div>
                <p className="w-10 text-right text-xs font-semibold text-gray-600">
                  {entry.count || 0}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="mb-4 text-sm font-bold text-gray-700">
            Feedback Trend (Last 6 Months)
          </p>
          <div className="flex h-36 items-end gap-2">
            {(analytics.trend || []).map((entry) => (
              <div
                key={entry.month}
                className="flex flex-1 flex-col items-center gap-2"
              >
                <div
                  className="w-full rounded-t bg-gradient-to-t from-cyan-600 to-sky-400"
                  style={{
                    height: `${Math.max(8, ((entry.count || 0) / trendMax) * 100)}%`,
                  }}
                />
                <p className="text-[10px] text-gray-500">
                  {entry.month.slice(5)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="mb-4 text-sm font-bold text-gray-700">Category Split</p>
          <div className="flex items-center gap-4">
            <div
              className="relative h-28 w-28 rounded-full"
              style={categoryPieStyle}
            >
              <div className="absolute inset-[22%] rounded-full bg-white" />
            </div>
            <div className="space-y-2">
              {categoryCounts.map((item) => (
                <div
                  key={item.category}
                  className="flex items-center gap-2 text-xs text-gray-700"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor:
                        categoryColorMap[item.category] || "#94a3b8",
                    }}
                  />
                  <span className="font-semibold capitalize">
                    {item.category}
                  </span>
                  <span>({item.count || 0})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="mb-3 text-sm font-bold text-gray-700">Common Topics</p>
        <div className="flex flex-wrap gap-2">
          {(analytics.commonIssues || []).length > 0 ? (
            analytics.commonIssues.map((issue) => (
              <span
                key={issue.term}
                className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700"
              >
                {issue.term} ({issue.count})
              </span>
            ))
          ) : (
            <p className="text-sm text-gray-500">
              No common terms available yet.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Filter size={14} /> Filters
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name/message"
              className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === "all" ? "All Categories" : option}
              </option>
            ))}
          </select>

          <select
            value={selectedRating}
            onChange={(e) => setSelectedRating(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
          >
            <option value="all">All Ratings</option>
            {[1, 2, 3, 4, 5].map((rating) => (
              <option key={rating} value={rating}>
                {rating} Star
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
          >
            <option value="all">All Status</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                  User
                </th>
                <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                  Message
                </th>
                <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                  Meta
                </th>
                <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                  Date
                </th>
                <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {feedbacks.map((feedback) => (
                <tr key={feedback._id} className="hover:bg-gray-50/60">
                  <td className="px-5 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                        <User size={14} className="text-gray-400" />
                        {feedback.name || "Anonymous"}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Mail size={12} className="text-gray-400" />
                        {feedback.email || "No email"}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-start gap-2 text-sm text-gray-700">
                      <MessageSquare
                        size={14}
                        className="mt-0.5 text-gray-400"
                      />
                      <p className="line-clamp-2 max-w-lg">
                        {feedback.message}
                      </p>
                    </div>
                    <div className="mt-2 space-y-2">
                      <textarea
                        value={replyDrafts[feedback._id] || ""}
                        onChange={(e) =>
                          setReplyDrafts((prev) => ({
                            ...prev,
                            [feedback._id]: e.target.value,
                          }))
                        }
                        placeholder="Write admin reply..."
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs"
                        rows={2}
                      />
                      <button
                        onClick={() => handleReply(feedback)}
                        className="inline-flex items-center gap-1 rounded-lg border border-cyan-200 bg-cyan-50 px-2.5 py-1.5 text-xs font-semibold text-cyan-700"
                      >
                        <Reply size={12} /> Reply
                      </button>
                      {feedback.reply?.message && (
                        <p className="rounded-lg border border-emerald-100 bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
                          Admin reply: {feedback.reply.message}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="space-y-2 text-xs">
                      <p className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 font-semibold text-amber-700">
                        <Star size={12} /> {feedback.rating || 0}
                      </p>
                      <p className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-1 font-semibold text-sky-700">
                        <Tag size={12} /> {feedback.category || "general"}
                      </p>
                      <select
                        value={feedback.status || "pending"}
                        onChange={(e) =>
                          handleStatusChange(feedback, e.target.value)
                        }
                        className="w-full rounded-md border border-gray-200 bg-white px-2 py-1"
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                      <Calendar size={12} className="text-gray-400" />
                      {feedback.createdAt
                        ? new Date(feedback.createdAt).toLocaleString()
                        : "-"}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => handleDelete(feedback)}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={13} />
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {feedbacks.length === 0 && (
          <div className="py-10 text-center text-gray-500">
            No feedback records found.
          </div>
        )}
      </div>
    </div>
  );
};

export default Feedbacks;
