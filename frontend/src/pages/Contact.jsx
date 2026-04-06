import React, { useEffect, useState } from "react";
import { API_BASE } from "../config/api";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    rating: 5,
    category: "general",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [feedbacks, setFeedbacks] = useState([]);
  const [isLoadingFeedbacks, setIsLoadingFeedbacks] = useState(true);

  const loadFeedbacks = async () => {
    try {
      setIsLoadingFeedbacks(true);
      const response = await fetch(
        `${API_BASE}/api/feedback?limit=8&skip=0&status=pending,reviewed,replied`,
      );
      const data = await response.json().catch(() => []);
      if (response.ok) {
        setFeedbacks(Array.isArray(data) ? data : []);
      }
    } catch {
      setFeedbacks([]);
    } finally {
      setIsLoadingFeedbacks(false);
    }
  };

  useEffect(() => {
    loadFeedbacks();
  }, []);

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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setSuccessMessage("");
    setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setSuccessMessage("");
      setErrorMessage("");

      const endpoints = [
        `${API_BASE}/api/feedback`,
        `${API_BASE}/api/contact/feedback`,
      ];
      let submitted = false;
      let lastError = "";

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
          });

          if (response.ok) {
            submitted = true;
            break;
          }

          const raw = await response.text().catch(() => "");
          let data = {};
          try {
            data = raw ? JSON.parse(raw) : {};
          } catch {
            data = {};
          }
          lastError =
            data.message ||
            (response.status === 404
              ? "Feedback API route not found. Please restart backend server."
              : raw || "Failed to submit feedback");
        } catch (networkErr) {
          lastError = networkErr.message || "Unable to connect to server";
        }
      }

      if (!submitted) {
        throw new Error(lastError || "Failed to submit feedback");
      }

      setFormData({
        name: "",
        email: "",
        rating: 5,
        category: "general",
        message: "",
      });
      setSuccessMessage("Feedback submitted successfully. Thank you!");
      loadFeedbacks();
    } catch (error) {
      setErrorMessage(error.message || "Unable to submit feedback right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="mb-8 bg-gradient-to-r from-sky-300 to-cyan-400 bg-clip-text text-center text-3xl font-bold text-transparent">
        Feedback
      </h1>
      <p className="mb-10 text-center text-slate-400">
        Share your experience, report bugs, or suggest improvements.
      </p>

      {successMessage && (
        <p className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-950/40 py-2 text-center text-sm font-medium text-emerald-300">
          {successMessage}
        </p>
      )}

      {errorMessage && (
        <p className="mb-4 rounded-lg border border-red-500/40 bg-red-950/40 py-2 text-center text-sm font-medium text-red-300">
          {errorMessage}
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <form onSubmit={handleSubmit} className="theme-card space-y-6 p-8">
          <div>
            <label className="mb-2 block font-medium text-slate-300">
              Name (Optional)
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your Name"
              className="theme-input"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium text-slate-300">
              Email (Optional)
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Your Email"
              className="theme-input"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block font-medium text-slate-300">
                Rating
              </label>
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-deep-border bg-deep-surface/70 p-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, rating: star }))
                    }
                    className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${
                      formData.rating >= star
                        ? "bg-yellow-400/25 text-yellow-300"
                        : "bg-deep-card text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {star} ★
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block font-medium text-slate-300">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="theme-input"
              >
                <option value="general">General Feedback</option>
                <option value="bug">Bug Report</option>
                <option value="suggestion">Suggestion</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block font-medium text-slate-300">
              Message
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Your Message"
              className="theme-input min-h-[120px] resize-y"
              rows="5"
              required
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-gradient-accent py-3 font-semibold text-white transition hover:bg-gradient-accent-hover hover:shadow-lg"
          >
            {isSubmitting ? "Sending..." : "Send Message"}
          </button>
        </form>

        <section className="theme-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-100">
              Recent User Feedback
            </h2>
            <button
              type="button"
              onClick={loadFeedbacks}
              className="rounded-md border border-sky-500/30 px-3 py-1 text-xs font-semibold text-sky-300"
            >
              Refresh
            </button>
          </div>

          <div className="max-h-[560px] space-y-3 overflow-y-auto pr-1">
            {isLoadingFeedbacks ? (
              <p className="text-sm text-slate-400">Loading feedback...</p>
            ) : feedbacks.length > 0 ? (
              feedbacks.map((fb) => (
                <article
                  key={fb._id}
                  className="rounded-xl border border-deep-border bg-deep-surface/60 p-4"
                >
                  <div className="mb-1 text-sm">{renderStars(fb.rating)}</div>
                  <p className="mb-2 inline-flex rounded-full border border-sky-500/30 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-sky-300">
                    {fb.category || "general"}
                  </p>
                  <p className="text-sm text-slate-300">"{fb.message}"</p>
                  <div className="mt-3 border-t border-deep-border pt-2 text-xs text-deep-muted">
                    <span className="font-semibold text-slate-200">
                      {fb.name || "Anonymous"}
                    </span>
                  </div>
                </article>
              ))
            ) : (
              <p className="text-sm text-slate-400">No public feedback yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Contact;
