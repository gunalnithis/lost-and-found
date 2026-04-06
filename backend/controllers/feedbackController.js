const Feedback = require("../models/Feedback");

const normalizeStatus = (status) => {
  if (!status) return "pending";
  const normalized = String(status).trim().toLowerCase();
  return ["pending", "reviewed", "replied"].includes(normalized)
    ? normalized
    : "pending";
};

const normalizeCategory = (category) => {
  if (!category) return "general";
  const normalized = String(category).trim().toLowerCase();
  return ["bug", "suggestion", "general"].includes(normalized)
    ? normalized
    : "general";
};

const parseRating = (rating) => {
  const value = Number(rating);
  return Number.isFinite(value) ? value : null;
};

const buildFilters = (query = {}) => {
  const filters = {};

  if (query.search) {
    const searchRegex = new RegExp(String(query.search).trim(), "i");
    filters.$or = [
      { name: searchRegex },
      { email: searchRegex },
      { message: searchRegex },
      { "reply.message": searchRegex },
    ];
  }

  if (query.name) {
    filters.name = { $regex: new RegExp(String(query.name).trim(), "i") };
  }

  if (query.category) {
    const categories = String(query.category)
      .split(",")
      .map((item) => normalizeCategory(item))
      .filter(Boolean);
    if (categories.length > 0) {
      filters.category = { $in: [...new Set(categories)] };
    }
  }

  if (query.status) {
    const statuses = String(query.status)
      .split(",")
      .map((item) => normalizeStatus(item))
      .filter(Boolean);
    if (statuses.length > 0) {
      filters.status = { $in: [...new Set(statuses)] };
    }
  }

  if (query.rating) {
    const ratings = String(query.rating)
      .split(",")
      .map((item) => parseRating(item))
      .filter((value) => value && value >= 1 && value <= 5);
    if (ratings.length > 0) {
      filters.rating = { $in: [...new Set(ratings)] };
    }
  }

  const fromDate = query.fromDate ? new Date(query.fromDate) : null;
  const toDate = query.toDate ? new Date(query.toDate) : null;
  if ((fromDate && !Number.isNaN(fromDate.valueOf())) || (toDate && !Number.isNaN(toDate.valueOf()))) {
    filters.createdAt = {};
    if (fromDate && !Number.isNaN(fromDate.valueOf())) {
      filters.createdAt.$gte = fromDate;
    }
    if (toDate && !Number.isNaN(toDate.valueOf())) {
      toDate.setHours(23, 59, 59, 999);
      filters.createdAt.$lte = toDate;
    }
  }

  return filters;
};

const tokenize = (text = "") =>
  String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !["with", "that", "this", "from", "have", "your", "about", "would", "there", "please", "could", "should"].includes(w));

const createFeedback = async (req, res) => {
  try {
    const { name, email, message, rating, category } = req.body || {};
    const parsedRating = rating === undefined || rating === null ? 5 : parseRating(rating);

    if (!message || !String(message).trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    if (!parsedRating || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const feedback = await Feedback.create({
      name: name ? String(name).trim() : "Anonymous",
      email: email ? String(email).trim().toLowerCase() : "",
      message: String(message).trim(),
      rating: parsedRating,
      category: normalizeCategory(category),
      status: "pending",
    });

    return res.status(201).json(feedback);
  } catch (error) {
    return res.status(500).json({ message: "Failed to submit feedback", error: error.message });
  }
};

const getFeedbacks = async (req, res) => {
  try {
    const filters = buildFilters(req.query);
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const skip = Math.max(parseInt(req.query.skip, 10) || 0, 0);
    const feedbacks = await Feedback.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return res.status(200).json(feedbacks);
  } catch (error) {
    return res.status(500).json({ message: "Failed to load feedback", error: error.message });
  }
};

const deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Feedback.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    return res.status(200).json({ message: "Feedback deleted successfully", deletedId: deleted._id });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete feedback", error: error.message });
  }
};

const updateFeedbackStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    const normalizedStatus = normalizeStatus(status);

    const updated = await Feedback.findByIdAndUpdate(
      id,
      { status: normalizedStatus },
      { new: true },
    ).lean();

    if (!updated) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    return res.status(200).json(updated);
  } catch (error) {
    return res.status(500).json({ message: "Failed to update feedback status", error: error.message });
  }
};

const replyToFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, repliedBy } = req.body || {};

    if (!message || !String(message).trim()) {
      return res.status(400).json({ message: "Reply message is required" });
    }

    const updated = await Feedback.findByIdAndUpdate(
      id,
      {
        status: "replied",
        reply: {
          message: String(message).trim(),
          repliedAt: new Date(),
          repliedBy: repliedBy ? String(repliedBy).trim() : "admin",
        },
      },
      { new: true },
    ).lean();

    if (!updated) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    return res.status(200).json(updated);
  } catch (error) {
    return res.status(500).json({ message: "Failed to reply feedback", error: error.message });
  }
};

const getFeedbackSummary = async (req, res) => {
  try {
    const filters = buildFilters(req.query);
    const summaryAgg = await Feedback.aggregate([
      { $match: filters },
      {
        $group: {
          _id: null,
          totalFeedback: { $sum: 1 },
          averageRating: { $avg: "$rating" },
          positiveCount: {
            $sum: {
              $cond: [{ $gte: ["$rating", 4] }, 1, 0],
            },
          },
          neutralCount: {
            $sum: {
              $cond: [{ $eq: ["$rating", 3] }, 1, 0],
            },
          },
          negativeCount: {
            $sum: {
              $cond: [{ $lte: ["$rating", 2] }, 1, 0],
            },
          },
        },
      },
    ]);

    const summary = summaryAgg[0] || {
      totalFeedback: 0,
      averageRating: 0,
      positiveCount: 0,
      neutralCount: 0,
      negativeCount: 0,
    };

    return res.status(200).json({
      ...summary,
      averageRating: Number(summary.averageRating || 0).toFixed(2),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load feedback summary", error: error.message });
  }
};

const getFeedbackAnalytics = async (req, res) => {
  try {
    const filters = buildFilters(req.query);
    const all = await Feedback.find(filters).sort({ createdAt: -1 }).lean();

    const ratingDistribution = [1, 2, 3, 4, 5].map((star) => ({
      rating: star,
      count: all.filter((item) => item.rating === star).length,
    }));

    const categoryCounts = ["bug", "suggestion", "general"].map((category) => ({
      category,
      count: all.filter((item) => item.category === category).length,
    }));

    const monthlyTrendsMap = {};
    all.forEach((item) => {
      const date = new Date(item.createdAt);
      if (Number.isNaN(date.valueOf())) return;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      monthlyTrendsMap[key] = (monthlyTrendsMap[key] || 0) + 1;
    });
    const trend = Object.keys(monthlyTrendsMap)
      .sort()
      .slice(-6)
      .map((month) => ({ month, count: monthlyTrendsMap[month] }));

    const frequencyMap = {};
    all.forEach((item) => {
      tokenize(item.message).forEach((word) => {
        frequencyMap[word] = (frequencyMap[word] || 0) + 1;
      });
    });
    const commonIssues = Object.entries(frequencyMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([term, count]) => ({ term, count }));

    return res.status(200).json({
      ratingDistribution,
      categoryCounts,
      trend,
      commonIssues,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load feedback analytics", error: error.message });
  }
};

module.exports = {
  createFeedback,
  getFeedbacks,
  deleteFeedback,
  updateFeedbackStatus,
  replyToFeedback,
  getFeedbackSummary,
  getFeedbackAnalytics,
};
