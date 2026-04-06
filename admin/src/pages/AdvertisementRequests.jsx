import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  Pencil,
  Trash2,
  Star,
} from "lucide-react";

const API_BASE = "http://127.0.0.1:8000";

const initialTemplate = {
  itemName: "",
  description: "",
  category: "found",
  location: "",
  image: "",
  contactName: "",
  contactEmail: "",
  contactNumber: "",
  featured: false,
};

const AdvertisementRequests = () => {
  const [requests, setRequests] = useState([]);
  const [advertisements, setAdvertisements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adsLoading, setAdsLoading] = useState(true);
  const [error, setError] = useState("");
  const [adsError, setAdsError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [templateForm, setTemplateForm] = useState(initialTemplate);
  const [templateMessage, setTemplateMessage] = useState("");
  const [editingAd, setEditingAd] = useState(null);
  const [editAdForm, setEditAdForm] = useState(initialTemplate);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(
        `${API_BASE}/api/advertisement-requests?includeAll=true`,
      );
      const data = await res.json().catch(() => []);
      if (!res.ok) {
        throw new Error(
          data.message || "Failed to load advertisement requests.",
        );
      }
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unable to load advertisement requests.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAdvertisements = async () => {
    try {
      setAdsLoading(true);
      setAdsError("");
      const res = await fetch(
        `${API_BASE}/api/advertisements?includeAll=true&includeInactive=true`,
      );
      const data = await res.json().catch(() => []);
      if (!res.ok) {
        throw new Error(data.message || "Failed to load advertisements.");
      }
      setAdvertisements(Array.isArray(data) ? data : []);
    } catch (err) {
      setAdsError(err.message || "Unable to load advertisements.");
    } finally {
      setAdsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchAdvertisements();
  }, []);

  const filteredRequests = useMemo(() => {
    if (statusFilter === "all") return requests;
    return requests.filter((request) => request.status === statusFilter);
  }, [requests, statusFilter]);

  const changeRequestStatus = async (request, status) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/advertisement-requests/${request._id}/status`,
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
        throw new Error(data.message || "Failed to update request status.");
      }

      setRequests((prev) =>
        prev.map((item) =>
          item._id === request._id
            ? { ...item, status, reviewedAt: new Date().toISOString() }
            : item,
        ),
      );
      fetchAdvertisements();
    } catch (err) {
      alert(err.message || "Unable to update request.");
    }
  };

  const submitTemplateAd = async (e) => {
    e.preventDefault();
    setTemplateMessage("");

    try {
      const response = await fetch(`${API_BASE}/api/advertisements/template`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(templateForm),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create advertisement template.",
        );
      }

      setTemplateMessage("Template advertisement published successfully.");
      setTemplateForm(initialTemplate);
      fetchAdvertisements();
    } catch (err) {
      setTemplateMessage(err.message || "Template creation failed.");
    }
  };

  const openEditAd = (advertisement) => {
    setEditingAd(advertisement);
    setEditAdForm({
      itemName: advertisement.itemName || "",
      description: advertisement.description || "",
      category: advertisement.category || "found",
      location: advertisement.location || "",
      image: advertisement.image || "",
      contactName: advertisement.contactName || "",
      contactEmail: advertisement.contactEmail || "",
      contactNumber: advertisement.contactNumber || "",
      featured: !!advertisement.featured,
      isActive: advertisement.isActive !== false,
    });
  };

  const saveAdEdit = async () => {
    if (!editingAd?._id) return;

    try {
      const response = await fetch(
        `${API_BASE}/api/advertisements/${editingAd._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editAdForm),
        },
      );

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Failed to update advertisement.");
      }

      setAdvertisements((prev) =>
        prev.map((ad) =>
          ad._id === editingAd._id ? data.advertisement || ad : ad,
        ),
      );
      setEditingAd(null);
    } catch (err) {
      alert(err.message || "Unable to update advertisement.");
    }
  };

  const deleteAd = async (advertisement) => {
    if (!advertisement?._id) return;
    if (
      !window.confirm(`Delete advertisement for ${advertisement.itemName}?`)
    ) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/api/advertisements/${advertisement._id}`,
        {
          method: "DELETE",
        },
      );

      const contentType = response.headers.get("content-type") || "";
      const data = contentType.includes("application/json")
        ? await response.json().catch(() => ({}))
        : { message: await response.text().catch(() => "") };

      if (!response.ok) {
        // Fallback 1: try POST-based delete endpoint for environments where DELETE is blocked.
        const postDeleteRes = await fetch(
          `${API_BASE}/api/advertisements/${advertisement._id}/delete`,
          {
            method: "POST",
          },
        );
        const postDeleteType = postDeleteRes.headers.get("content-type") || "";
        const postDeleteData = postDeleteType.includes("application/json")
          ? await postDeleteRes.json().catch(() => ({}))
          : { message: await postDeleteRes.text().catch(() => "") };

        if (postDeleteRes.ok) {
          setAdvertisements((prev) =>
            prev.filter((ad) => ad._id !== advertisement._id),
          );
          return;
        }

        // Fallback 2: if hard delete still fails, deactivate advertisement instead.
        const deactivateRes = await fetch(
          `${API_BASE}/api/advertisements/${advertisement._id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ isActive: false }),
          },
        );
        const deactivateType = deactivateRes.headers.get("content-type") || "";
        const deactivateData = deactivateType.includes("application/json")
          ? await deactivateRes.json().catch(() => ({}))
          : { message: await deactivateRes.text().catch(() => "") };

        if (!deactivateRes.ok) {
          throw new Error(
            data.message ||
              postDeleteData.message ||
              deactivateData.message ||
              "Failed to delete advertisement.",
          );
        }

        setAdvertisements((prev) =>
          prev.map((ad) =>
            ad._id === advertisement._id
              ? {
                  ...ad,
                  isActive: false,
                }
              : ad,
          ),
        );
        return;
      }

      setAdvertisements((prev) =>
        prev.filter((ad) => ad._id !== advertisement._id),
      );
    } catch (err) {
      alert(err.message || "Unable to delete advertisement.");
    }
  };

  const toggleAdFeatured = async (advertisement) => {
    if (!advertisement?._id) return;
    try {
      const response = await fetch(
        `${API_BASE}/api/advertisements/${advertisement._id}/feature`,
        {
          method: "PATCH",
        },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Failed to update featured status.");
      }

      setAdvertisements((prev) =>
        prev.map((ad) =>
          ad._id === advertisement._id ? data.advertisement || ad : ad,
        ),
      );
    } catch (err) {
      alert(err.message || "Unable to update featured status.");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">
            Advertisement Requests
          </h2>
          <p className="text-sm text-gray-500">
            Review user advertisement requests and publish approved ads.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <button
            type="button"
            onClick={fetchRequests}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-5 py-3">Item</th>
                <th className="px-5 py-3">Student</th>
                <th className="px-5 py-3">Location</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRequests.map((request) => (
                <tr key={request._id} className="hover:bg-gray-50/60">
                  <td className="px-5 py-4">
                    <p className="font-bold text-gray-800">
                      {request.itemName}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                      {request.description}
                    </p>
                    <p className="mt-1 text-[11px] font-semibold uppercase text-cyan-600">
                      {request.category}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">
                    <p>{request.contactName}</p>
                    <p className="text-xs text-gray-500">
                      {request.contactEmail}
                    </p>
                    <p className="text-xs text-gray-500">
                      {request.contactNumber}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">
                    {request.location}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                        request.status === "approved"
                          ? "bg-emerald-100 text-emerald-700"
                          : request.status === "rejected"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {request.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => changeRequestStatus(request, "approved")}
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                      >
                        <CheckCircle2 size={14} /> Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => changeRequestStatus(request, "rejected")}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100"
                      >
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRequests.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-8 text-center text-sm text-gray-500"
                  >
                    No advertisement requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles size={18} className="text-cyan-500" />
          <h3 className="text-lg font-bold text-gray-800">
            Quick Template Advertisement
          </h3>
        </div>

        <form onSubmit={submitTemplateAd} className="grid gap-3 md:grid-cols-2">
          <input
            required
            placeholder="Item name"
            value={templateForm.itemName}
            onChange={(e) =>
              setTemplateForm((prev) => ({ ...prev, itemName: e.target.value }))
            }
            className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm"
          />
          <select
            value={templateForm.category}
            onChange={(e) =>
              setTemplateForm((prev) => ({ ...prev, category: e.target.value }))
            }
            className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm"
          >
            <option value="found">Found</option>
            <option value="lost">Lost</option>
          </select>
          <input
            required
            placeholder="Location"
            value={templateForm.location}
            onChange={(e) =>
              setTemplateForm((prev) => ({ ...prev, location: e.target.value }))
            }
            className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm"
          />
          <input
            placeholder="Image URL"
            value={templateForm.image}
            onChange={(e) =>
              setTemplateForm((prev) => ({ ...prev, image: e.target.value }))
            }
            className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm"
          />
          <input
            required
            placeholder="Contact name"
            value={templateForm.contactName}
            onChange={(e) =>
              setTemplateForm((prev) => ({
                ...prev,
                contactName: e.target.value,
              }))
            }
            className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm"
          />
          <input
            required
            type="email"
            placeholder="Contact email"
            value={templateForm.contactEmail}
            onChange={(e) =>
              setTemplateForm((prev) => ({
                ...prev,
                contactEmail: e.target.value,
              }))
            }
            className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm"
          />
          <input
            required
            placeholder="Contact number"
            value={templateForm.contactNumber}
            onChange={(e) =>
              setTemplateForm((prev) => ({
                ...prev,
                contactNumber: e.target.value,
              }))
            }
            className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm"
          />
          <label className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-semibold text-gray-700">
            <input
              type="checkbox"
              checked={templateForm.featured}
              onChange={(e) =>
                setTemplateForm((prev) => ({
                  ...prev,
                  featured: e.target.checked,
                }))
              }
            />
            Featured advertisement
          </label>

          <textarea
            required
            rows={4}
            placeholder="Description"
            value={templateForm.description}
            onChange={(e) =>
              setTemplateForm((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            className="md:col-span-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm"
          />

          {templateMessage && (
            <p className="md:col-span-2 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm text-cyan-700">
              {templateMessage}
            </p>
          )}

          <button
            type="submit"
            className="md:col-span-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2.5 font-bold text-white hover:from-cyan-400 hover:to-teal-400"
          >
            Publish Template Advertisement
          </button>
        </form>
      </div>

      <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="text-lg font-bold text-gray-800">
            Published Advertisements
          </h3>
          <button
            type="button"
            onClick={fetchAdvertisements}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            Refresh Ads
          </button>
        </div>

        {adsError && (
          <div className="border-b border-rose-100 bg-rose-50 px-5 py-3 text-sm text-rose-700">
            {adsError}
          </div>
        )}

        {adsLoading ? (
          <div className="px-5 py-8 text-center text-sm text-gray-500">
            Loading advertisements...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-5 py-3">Item</th>
                  <th className="px-5 py-3">Contact</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {advertisements.map((ad) => (
                  <tr key={ad._id} className="hover:bg-gray-50/60">
                    <td className="px-5 py-4">
                      <p className="font-bold text-gray-800">{ad.itemName}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {ad.location}
                      </p>
                      <p className="mt-1 text-[11px] font-semibold uppercase text-cyan-600">
                        {ad.category}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">
                      <p>{ad.contactName}</p>
                      <p className="text-xs text-gray-500">{ad.contactEmail}</p>
                      <p className="text-xs text-gray-500">
                        {ad.contactNumber}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${
                            ad.isActive
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {ad.isActive ? "Active" : "Inactive"}
                        </span>
                        {ad.featured && (
                          <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                            Featured
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => toggleAdFeatured(ad)}
                          className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100"
                        >
                          <Star size={13} />{" "}
                          {ad.featured ? "Unfeature" : "Feature"}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditAd(ad)}
                          className="inline-flex items-center gap-1 rounded-lg border border-cyan-200 bg-cyan-50 px-2.5 py-1.5 text-xs font-bold text-cyan-700 hover:bg-cyan-100"
                        >
                          <Pencil size={13} /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteAd(ad)}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100"
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!advertisements.length && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-8 text-center text-sm text-gray-500"
                    >
                      No published advertisements found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-5">
            <h4 className="text-lg font-bold text-gray-800">
              Edit Advertisement
            </h4>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input
                value={editAdForm.itemName}
                onChange={(e) =>
                  setEditAdForm((prev) => ({
                    ...prev,
                    itemName: e.target.value,
                  }))
                }
                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm"
                placeholder="Item name"
              />
              <select
                value={editAdForm.category}
                onChange={(e) =>
                  setEditAdForm((prev) => ({
                    ...prev,
                    category: e.target.value,
                  }))
                }
                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm"
              >
                <option value="found">Found</option>
                <option value="lost">Lost</option>
              </select>
              <input
                value={editAdForm.location}
                onChange={(e) =>
                  setEditAdForm((prev) => ({
                    ...prev,
                    location: e.target.value,
                  }))
                }
                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm"
                placeholder="Location"
              />
              <input
                value={editAdForm.image}
                onChange={(e) =>
                  setEditAdForm((prev) => ({ ...prev, image: e.target.value }))
                }
                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm"
                placeholder="Image URL"
              />
              <input
                value={editAdForm.contactName}
                onChange={(e) =>
                  setEditAdForm((prev) => ({
                    ...prev,
                    contactName: e.target.value,
                  }))
                }
                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm"
                placeholder="Contact name"
              />
              <input
                value={editAdForm.contactEmail}
                onChange={(e) =>
                  setEditAdForm((prev) => ({
                    ...prev,
                    contactEmail: e.target.value,
                  }))
                }
                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm"
                placeholder="Contact email"
              />
              <input
                value={editAdForm.contactNumber}
                onChange={(e) =>
                  setEditAdForm((prev) => ({
                    ...prev,
                    contactNumber: e.target.value,
                  }))
                }
                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm"
                placeholder="Contact number"
              />
              <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-semibold text-gray-700">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editAdForm.featured}
                    onChange={(e) =>
                      setEditAdForm((prev) => ({
                        ...prev,
                        featured: e.target.checked,
                      }))
                    }
                  />
                  Featured
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editAdForm.isActive}
                    onChange={(e) =>
                      setEditAdForm((prev) => ({
                        ...prev,
                        isActive: e.target.checked,
                      }))
                    }
                  />
                  Active
                </label>
              </div>
              <textarea
                rows={4}
                value={editAdForm.description}
                onChange={(e) =>
                  setEditAdForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="md:col-span-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm"
                placeholder="Description"
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingAd(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveAdEdit}
                className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-400"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvertisementRequests;
