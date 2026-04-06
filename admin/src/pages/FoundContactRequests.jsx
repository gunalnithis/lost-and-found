import { useEffect, useState } from "react";
import {
  Mail,
  Phone,
  User,
  Calendar,
  Hash,
  Check,
  X,
  Clock,
  Edit3,
  Trash2,
  BarChart3,
  PieChart,
  FileDown,
  FileSpreadsheet,
} from "lucide-react";

const API_BASE = "http://127.0.0.1:8000";

const FoundContactRequests = () => {
  const [requests, setRequests] = useState([]);
  const [reportItems, setReportItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [fromDate, setFromDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [editingRequest, setEditingRequest] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    itNumber: "",
    studyingYear: "",
    message: "",
    itemName: "",
  });

  const getStatusClasses = (status) => {
    if (status === "approved") return "bg-emerald-50 text-emerald-600";
    if (status === "rejected") return "bg-red-50 text-red-600";
    return "bg-amber-50 text-amber-600";
  };

  const isInDateRange = (value) => {
    if (!value) return false;
    const itemDate = new Date(value);
    if (Number.isNaN(itemDate.getTime())) return false;
    const start = fromDate ? new Date(`${fromDate}T00:00:00`) : null;
    const end = toDate ? new Date(`${toDate}T23:59:59.999`) : null;
    if (start && itemDate < start) return false;
    if (end && itemDate > end) return false;
    return true;
  };

  const filteredReportItems = reportItems.filter((item) =>
    isInDateRange(item.createdAt),
  );

  const totalFoundInRange = filteredReportItems.filter(
    (item) => item.category === "found",
  ).length;
  const totalLostInRange = filteredReportItems.filter(
    (item) => item.category === "lost",
  ).length;
  const totalClaimedInRange = filteredReportItems.filter(
    (item) => item.status === "approved",
  ).length;

  const summaryStats = {
    totalItems: filteredReportItems.length,
    pendingItems: filteredReportItems.filter(
      (item) => item.status === "pending",
    ).length,
    claimedItems: filteredReportItems.filter(
      (item) => item.status === "approved",
    ).length,
    expiredItems: filteredReportItems.filter((item) => {
      if (!item.createdAt) return false;
      const ageMs = Date.now() - new Date(item.createdAt).getTime();
      return ageMs > 1000 * 60 * 60 * 24 * 30 && item.status === "pending";
    }).length,
  };

  const categoryKeywords = {
    phones: ["phone", "mobile", "iphone", "android", "samsung"],
    bags: ["bag", "backpack", "pouch", "laptop bag"],
    wallets: ["wallet", "purse", "card holder"],
    keys: ["key", "keys", "keychain"],
  };

  const categoryWiseCounts = Object.entries(categoryKeywords).reduce(
    (acc, [categoryKey, keywords]) => {
      const count = filteredReportItems.filter((item) => {
        const text =
          `${item.itemName || ""} ${item.description || ""}`.toLowerCase();
        return keywords.some((keyword) => text.includes(keyword));
      }).length;
      acc[categoryKey] = count;
      return acc;
    },
    {},
  );

  const categoryChartRows = [
    {
      label: "Phones",
      value: categoryWiseCounts.phones || 0,
      color: "bg-cyan-500",
    },
    {
      label: "Bags",
      value: categoryWiseCounts.bags || 0,
      color: "bg-emerald-500",
    },
    {
      label: "Wallets",
      value: categoryWiseCounts.wallets || 0,
      color: "bg-violet-500",
    },
    {
      label: "Keys",
      value: categoryWiseCounts.keys || 0,
      color: "bg-amber-500",
    },
  ];

  const maxCategoryValue = Math.max(
    1,
    ...categoryChartRows.map((row) => row.value),
  );

  const pieMetrics = [
    { label: "Found", value: totalFoundInRange, color: "#06b6d4" },
    { label: "Lost", value: totalLostInRange, color: "#f59e0b" },
    { label: "Claimed", value: totalClaimedInRange, color: "#10b981" },
  ];

  const pieTotal = pieMetrics.reduce((sum, metric) => sum + metric.value, 0);
  const pieGradient = (() => {
    if (pieTotal === 0) {
      return "conic-gradient(#1f2937 0deg 360deg)";
    }
    let current = 0;
    const segments = pieMetrics.map((metric) => {
      const sweep = (metric.value / pieTotal) * 360;
      const start = current;
      const end = current + sweep;
      current = end;
      return `${metric.color} ${start}deg ${end}deg`;
    });
    return `conic-gradient(${segments.join(",")})`;
  })();

  const buildReportRows = () => {
    return [
      ["Report Type", "Found Contact Requests Dashboard"],
      ["From Date", fromDate || "N/A"],
      ["To Date", toDate || "N/A"],
      ["Total Found Items", String(totalFoundInRange)],
      ["Total Lost Items", String(totalLostInRange)],
      ["Total Claimed Items", String(totalClaimedInRange)],
      ["Summary Total Items", String(summaryStats.totalItems)],
      ["Summary Pending Items", String(summaryStats.pendingItems)],
      ["Summary Claimed Items", String(summaryStats.claimedItems)],
      ["Summary Expired Items", String(summaryStats.expiredItems)],
      ["Category Phones", String(categoryWiseCounts.phones || 0)],
      ["Category Bags", String(categoryWiseCounts.bags || 0)],
      ["Category Wallets", String(categoryWiseCounts.wallets || 0)],
      ["Category Keys", String(categoryWiseCounts.keys || 0)],
    ];
  };

  const filteredRequestRows = requests.filter((req) =>
    isInDateRange(req.createdAt),
  );

  const buildStudentDetailRows = () => {
    return filteredRequestRows.map((req, index) => [
      String(index + 1),
      req.name || "-",
      req.email || "-",
      req.phone || "-",
      req.itNumber || "-",
      req.studyingYear || "-",
      req.itemName || "-",
      req.itemOwnerEmail || "-",
      req.status || "pending",
      req.createdAt ? new Date(req.createdAt).toLocaleString() : "-",
      req.reviewedAt ? new Date(req.reviewedAt).toLocaleString() : "-",
      req.message || "-",
    ]);
  };

  const escapeHtml = (value) =>
    String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  const downloadBlob = (fileName, content, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const summaryRows = buildReportRows();
    const detailHeader = [
      "No",
      "Student Name",
      "Student Email",
      "Phone",
      "IT Number",
      "Studying Year",
      "Item Name",
      "Item Owner Email",
      "Request Status",
      "Requested At",
      "Reviewed At",
      "Message",
    ];
    const detailRows = buildStudentDetailRows();
    const rows = [
      ...summaryRows,
      [],
      ["Found Contact Student Details"],
      detailHeader,
      ...detailRows,
    ];
    const csv = rows
      .map((row) =>
        row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","),
      )
      .join("\n");
    downloadBlob(
      `found-contact-report-${Date.now()}.csv`,
      csv,
      "text/csv;charset=utf-8;",
    );
  };

  const exportExcel = () => {
    const summaryRows = buildReportRows();
    const detailHeader = [
      "No",
      "Student Name",
      "Student Email",
      "Phone",
      "IT Number",
      "Studying Year",
      "Item Name",
      "Item Owner Email",
      "Request Status",
      "Requested At",
      "Reviewed At",
      "Message",
    ];
    const detailRows = buildStudentDetailRows();
    const rows = [
      ...summaryRows,
      [],
      ["Found Contact Student Details"],
      detailHeader,
      ...detailRows,
    ];
    const tsv = rows.map((row) => row.join("\t")).join("\n");
    downloadBlob(
      `found-contact-report-${Date.now()}.xls`,
      tsv,
      "application/vnd.ms-excel",
    );
  };

  const exportPDF = () => {
    const reportWindow = window.open("", "_blank", "width=900,height=700");
    if (!reportWindow) {
      alert("Please allow popups to export PDF.");
      return;
    }

    const studentRows = buildStudentDetailRows();

    const html = `
      <html>
        <head>
          <title>Found Contact Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            h1 { margin-bottom: 8px; }
            h2 { margin-top: 24px; margin-bottom: 8px; }
            table { border-collapse: collapse; width: 100%; margin-top: 16px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f3f4f6; }
            .small { font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>Found Contact Report</h1>
          <p>From: ${fromDate || "N/A"} | To: ${toDate || "N/A"}</p>
          <table>
            <thead><tr><th>Metric</th><th>Value</th></tr></thead>
            <tbody>
              ${buildReportRows()
                .map(
                  (row) =>
                    `<tr><td>${escapeHtml(row[0])}</td><td>${escapeHtml(row[1])}</td></tr>`,
                )
                .join("")}
            </tbody>
          </table>

          <h2>Found Contact Student Details (${studentRows.length})</h2>
          <table class="small">
            <thead>
              <tr>
                <th>No</th>
                <th>Student Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>IT Number</th>
                <th>Studying Year</th>
                <th>Item</th>
                <th>Owner Email</th>
                <th>Status</th>
                <th>Requested At</th>
                <th>Reviewed At</th>
              </tr>
            </thead>
            <tbody>
              ${studentRows
                .map(
                  (row) =>
                    `<tr>
                      <td>${escapeHtml(row[0])}</td>
                      <td>${escapeHtml(row[1])}</td>
                      <td>${escapeHtml(row[2])}</td>
                      <td>${escapeHtml(row[3])}</td>
                      <td>${escapeHtml(row[4])}</td>
                      <td>${escapeHtml(row[5])}</td>
                      <td>${escapeHtml(row[6])}</td>
                      <td>${escapeHtml(row[7])}</td>
                      <td>${escapeHtml(row[8])}</td>
                      <td>${escapeHtml(row[9])}</td>
                      <td>${escapeHtml(row[10])}</td>
                    </tr>`,
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;

    reportWindow.document.open();
    reportWindow.document.write(html);
    reportWindow.document.close();
    reportWindow.focus();
    reportWindow.print();
  };

  const updateRequestStatus = async (requestId, status) => {
    try {
      setActionLoadingId(requestId);
      const response = await fetch(
        `${API_BASE}/api/contact/found-requests/${requestId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        },
      );

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Failed to update request status");
      }

      setRequests((prev) =>
        prev.map((req) =>
          req._id === requestId
            ? { ...req, status, reviewedAt: new Date().toISOString() }
            : req,
        ),
      );
    } catch (err) {
      alert(err.message || "Unable to update request status");
    } finally {
      setActionLoadingId("");
    }
  };

  const openEditModal = (req) => {
    setEditingRequest(req);
    setEditForm({
      name: req.name || "",
      email: req.email || "",
      phone: req.phone || "",
      itNumber: req.itNumber || "",
      studyingYear: req.studyingYear || "",
      message: req.message || "",
      itemName: req.itemName || "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingRequest) return;
    try {
      const response = await fetch(
        `${API_BASE}/api/contact/found-requests/${editingRequest._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editForm),
        },
      );

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update found contact request",
        );
      }

      setRequests((prev) =>
        prev.map((req) => (req._id === editingRequest._id ? data : req)),
      );
      setEditingRequest(null);
    } catch (err) {
      alert(err.message || "Unable to update request");
    }
  };

  const handleDeleteRequest = async (req) => {
    if (!window.confirm(`Delete contact request from ${req.name}?`)) return;

    try {
      const response = await fetch(
        `${API_BASE}/api/contact/found-requests/${req._id}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete found contact request",
        );
      }

      const refreshed = await fetch(
        `${API_BASE}/api/contact/found-requests?includeAll=true`,
      );
      const refreshedData = await refreshed.json().catch(() => []);
      if (!refreshed.ok) {
        throw new Error(
          "Deleted, but failed to refresh latest data from server",
        );
      }

      setRequests(Array.isArray(refreshedData) ? refreshedData : []);
    } catch (err) {
      alert(err.message || "Unable to delete request");
    }
  };

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        setError("");
        const [requestRes, itemsRes] = await Promise.all([
          fetch(`${API_BASE}/api/contact/found-requests?includeAll=true`),
          fetch(`${API_BASE}/api/items?limit=500&skip=0`),
        ]);

        if (!requestRes.ok) {
          const errorData = await requestRes.json().catch(() => ({}));
          throw new Error(
            errorData.message || "Failed to fetch found contact requests",
          );
        }
        if (!itemsRes.ok) {
          const errorData = await itemsRes.json().catch(() => ({}));
          throw new Error(
            errorData.message || "Failed to fetch report item data",
          );
        }

        const requestData = await requestRes.json();
        const itemsData = await itemsRes.json();
        setRequests(Array.isArray(requestData) ? requestData : []);
        setReportItems(Array.isArray(itemsData) ? itemsData : []);
      } catch (err) {
        setError(err.message || "Unable to load found contact requests");
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6 bg-red-50 rounded-3xl border border-red-100 text-center">
        <Mail className="text-red-500 mb-4" size={48} />
        <h3 className="text-xl font-bold text-red-800 mb-2">
          Found Contact Requests Error
        </h3>
        <p className="text-red-600 max-w-md">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Found Contact Requests
          </h2>
          <p className="text-gray-500">
            Submissions about found items (Contact Item Owner)
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-200">
          <Mail size={18} className="text-indigo-600" />
          <span className="font-bold text-gray-700">{requests.length}</span>
          <span className="text-gray-500 text-sm">Total Requests</span>
        </div>
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-800">
              Report Generation
            </h3>
            <p className="text-sm text-gray-500">
              Filter by date range and export report data for presentations and
              records.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={exportPDF}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <FileDown size={16} />
              Export PDF
            </button>
            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <FileDown size={16} />
              Export CSV
            </button>
            <button
              onClick={exportExcel}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <FileSpreadsheet size={16} />
              Export Excel
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
              From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
              To Date
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              In Selected Period
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs text-gray-500">Found</p>
                <p className="text-lg font-bold text-cyan-600">
                  {totalFoundInRange}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Lost</p>
                <p className="text-lg font-bold text-amber-600">
                  {totalLostInRange}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Claimed</p>
                <p className="text-lg font-bold text-emerald-600">
                  {totalClaimedInRange}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Total Items</p>
            <p className="text-2xl font-bold text-gray-800">
              {summaryStats.totalItems}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Pending Items</p>
            <p className="text-2xl font-bold text-amber-600">
              {summaryStats.pendingItems}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Claimed Items</p>
            <p className="text-2xl font-bold text-emerald-600">
              {summaryStats.claimedItems}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Expired Items</p>
            <p className="text-2xl font-bold text-rose-600">
              {summaryStats.expiredItems}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 p-4">
            <div className="mb-3 flex items-center gap-2">
              <BarChart3 size={18} className="text-indigo-500" />
              <h4 className="text-sm font-bold text-gray-800">
                Category-wise Report
              </h4>
            </div>
            <div className="space-y-3">
              {categoryChartRows.map((row) => (
                <div key={row.label}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-600">
                      {row.label}
                    </span>
                    <span className="font-bold text-gray-800">{row.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100">
                    <div
                      className={`h-2 rounded-full ${row.color}`}
                      style={{
                        width: `${(row.value / maxCategoryValue) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 p-4">
            <div className="mb-3 flex items-center gap-2">
              <PieChart size={18} className="text-indigo-500" />
              <h4 className="text-sm font-bold text-gray-800">
                Visual Summary
              </h4>
            </div>
            <div className="flex items-center gap-5">
              <div
                className="h-32 w-32 rounded-full border border-gray-200"
                style={{ background: pieGradient }}
              />
              <div className="space-y-2 text-xs">
                {pieMetrics.map((metric) => (
                  <div key={metric.label} className="flex items-center gap-2">
                    <span
                      className="inline-block h-3 w-3 rounded-full"
                      style={{ backgroundColor: metric.color }}
                    />
                    <span className="text-gray-600">{metric.label}</span>
                    <span className="font-bold text-gray-800">
                      {metric.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  IT Details
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.map((req) => (
                <tr
                  key={req._id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-800 font-semibold">
                      <User size={16} className="text-gray-400" />
                      {req.name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-indigo-400" />
                        {req.email}
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-emerald-400" />
                        {req.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Hash size={14} className="text-gray-400" />
                        {req.itNumber}
                      </div>
                      <div className="text-gray-500">{req.studyingYear}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {req.itemName || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-400" />
                      {req.createdAt
                        ? new Date(req.createdAt).toLocaleString()
                        : "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${getStatusClasses(req.status || "pending")}`}
                    >
                      {(req.status || "pending") === "approved" ? (
                        <Check size={12} />
                      ) : (req.status || "pending") === "rejected" ? (
                        <X size={12} />
                      ) : (
                        <Clock size={12} />
                      )}
                      {req.status || "pending"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {(req.status || "pending") === "pending" && (
                        <>
                          <button
                            onClick={() =>
                              updateRequestStatus(req._id, "approved")
                            }
                            disabled={actionLoadingId === req._id}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg disabled:opacity-50"
                            title="Approve"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() =>
                              updateRequestStatus(req._id, "rejected")
                            }
                            disabled={actionLoadingId === req._id}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                            title="Reject"
                          >
                            <X size={16} />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => openEditModal(req)}
                        className="p-2 text-cyan-400 hover:bg-slate-700 rounded-lg"
                        title="Edit"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteRequest(req)}
                        className="p-2 text-red-400 hover:bg-slate-700 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {requests.length === 0 && (
          <div className="py-10 text-center text-gray-500">
            No found contact requests submitted yet.
          </div>
        )}
      </div>

      {editingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 p-5">
            <h3 className="text-lg font-bold text-slate-100">
              Edit Found Contact Request
            </h3>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <input
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
                placeholder="Name"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, name: e.target.value }))
                }
              />
              <input
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
                placeholder="Email"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, email: e.target.value }))
                }
              />
              <input
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
                placeholder="Phone"
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, phone: e.target.value }))
                }
              />
              <input
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
                placeholder="IT Number"
                value={editForm.itNumber}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, itNumber: e.target.value }))
                }
              />
              <input
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
                placeholder="Studying Year"
                value={editForm.studyingYear}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, studyingYear: e.target.value }))
                }
              />
              <input
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
                placeholder="Item Name"
                value={editForm.itemName}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, itemName: e.target.value }))
                }
              />
            </div>

            <textarea
              className="mt-3 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
              rows={3}
              placeholder="Message"
              value={editForm.message}
              onChange={(e) =>
                setEditForm((p) => ({ ...p, message: e.target.value }))
              }
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setEditingRequest(null)}
                className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FoundContactRequests;
