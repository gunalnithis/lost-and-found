import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { API_BASE } from "../config/api";

const INITIAL_FORM = {
  itemName: "",
  description: "",
  category: "lost",
  location: "",
  image: "",
  contactName: "",
  contactEmail: "",
  contactNumber: "",
};

const AdvertisementRequest = () => {
  const location = useLocation();
  const defaultCategory = useMemo(() => {
    const value = new URLSearchParams(location.search).get("category");
    return value === "found" || value === "lost" ? value : "lost";
  }, [location.search]);

  const [formData, setFormData] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      category: defaultCategory,
    }));
  }, [defaultCategory]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const submitRequest = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/api/advertisement-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          data.message || "Failed to submit advertisement request.",
        );
      }

      setSuccess(
        "Your advertisement request has been submitted. Admin will review it soon.",
      );
      setFormData({ ...INITIAL_FORM, category: defaultCategory });
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="relative overflow-hidden py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_10%,rgba(6,182,212,0.18),transparent_32%),radial-gradient(circle_at_10%_90%,rgba(14,165,233,0.16),transparent_38%)]" />
      <div className="relative mx-auto max-w-3xl px-6">
        <div className="rounded-3xl border border-deep-border bg-deep-card/90 p-6 shadow-2xl shadow-black/30 md:p-8">
          <p className="inline-flex rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300">
            Advertisement Request
          </p>
          <h1 className="mt-3 text-3xl font-black text-slate-100 md:text-4xl">
            Request Item Advertisement
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Submit lost/found details for admin review. Approved requests are
            published on the homepage.
          </p>

          <form
            onSubmit={submitRequest}
            className="mt-6 grid gap-4 md:grid-cols-2"
          >
            <div className="md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Item Name
              </label>
              <input
                name="itemName"
                value={formData.itemName}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-xl border border-deep-border bg-deep-surface px-3 py-2.5 text-slate-200"
                placeholder="Black wallet with student card"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-xl border border-deep-border bg-deep-surface px-3 py-2.5 text-slate-200"
              >
                <option value="lost">Lost</option>
                <option value="found">Found</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Location
              </label>
              <input
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-xl border border-deep-border bg-deep-surface px-3 py-2.5 text-slate-200"
                placeholder="Library 2nd floor"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Descriptions
              </label>
              <textarea
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-xl border border-deep-border bg-deep-surface px-3 py-2.5 text-slate-200"
                placeholder="Add identifying details, date/time, and special marks."
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Image URL (optional)
              </label>
              <input
                name="image"
                value={formData.image}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-deep-border bg-deep-surface px-3 py-2.5 text-slate-200"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Contact Name
              </label>
              <input
                name="contactName"
                value={formData.contactName}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-xl border border-deep-border bg-deep-surface px-3 py-2.5 text-slate-200"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Contact Email
              </label>
              <input
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-xl border border-deep-border bg-deep-surface px-3 py-2.5 text-slate-200"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Contact Number
              </label>
              <input
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-xl border border-deep-border bg-deep-surface px-3 py-2.5 text-slate-200"
              />
            </div>

            {error && (
              <p className="md:col-span-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                {error}
              </p>
            )}
            {success && (
              <p className="md:col-span-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="md:col-span-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-5 py-3 font-bold text-white transition hover:from-cyan-400 hover:to-teal-400 disabled:opacity-70"
            >
              {submitting ? "Submitting..." : "Submit Advertisement Request"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default AdvertisementRequest;
