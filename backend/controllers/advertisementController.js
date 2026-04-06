const mongoose = require("mongoose");
const Advertisement = require("../models/Advertisement");
const AdvertisementRequest = require("../models/AdvertisementRequest");

const parseLimit = (value, fallback = 50, max = 300) =>
  Math.min(Math.max(parseInt(value, 10) || fallback, 1), max);

const parseSkip = (value) => Math.max(parseInt(value, 10) || 0, 0);

const createAdvertisementRequest = async (req, res) => {
  try {
    const {
      itemName,
      description,
      category,
      location,
      image,
      contactName,
      contactEmail,
      contactNumber,
    } = req.body || {};

    if (
      !itemName ||
      !description ||
      !category ||
      !location ||
      !contactName ||
      !contactEmail ||
      !contactNumber
    ) {
      return res.status(400).json({
        message: "Please provide all required request fields.",
      });
    }

    if (!["lost", "found"].includes(category)) {
      return res.status(400).json({
        message: "Category must be either lost or found.",
      });
    }

    const request = await AdvertisementRequest.create({
      itemName,
      description,
      category,
      location,
      image: image || "",
      contactName,
      contactEmail,
      contactNumber,
      requestedByUserId: req.user?._id,
      status: "pending",
    });

    return res.status(201).json({
      message: "Advertisement request submitted. Waiting for admin review.",
      request,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getAdvertisementRequests = async (req, res) => {
  try {
    const status = req.query.status;
    const includeAll = req.query.includeAll === "true";

    const filter = {};
    if (["pending", "approved", "rejected"].includes(status)) {
      filter.status = status;
    }

    const query = AdvertisementRequest.find(filter).sort({ createdAt: -1 });

    if (!includeAll) {
      query.skip(parseSkip(req.query.skip)).limit(parseLimit(req.query.limit));
    }

    const requests = await query.lean();
    return res.status(200).json(requests);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateAdvertisementRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote, featured } = req.body || {};

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        message: "Status must be approved or rejected.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid request id." });
    }

    const request = await AdvertisementRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: "Request not found." });
    }

    request.status = status;
    request.reviewedAt = new Date();
    request.reviewedBy = req.user?._id;
    if (adminNote !== undefined) {
      request.adminNote = String(adminNote || "").trim();
    }
    await request.save();

    let advertisement = null;
    if (status === "approved") {
      advertisement = await Advertisement.findOne({ requestId: request._id });

      if (!advertisement) {
        advertisement = await Advertisement.create({
          requestId: request._id,
          itemName: request.itemName,
          description: request.description,
          category: request.category,
          location: request.location,
          image: request.image,
          contactName: request.contactName,
          contactEmail: request.contactEmail,
          contactNumber: request.contactNumber,
          source: "request",
          featured: featured === true,
          isActive: true,
          createdBy: req.user?._id,
        });
      } else {
        advertisement.itemName = request.itemName;
        advertisement.description = request.description;
        advertisement.category = request.category;
        advertisement.location = request.location;
        advertisement.image = request.image;
        advertisement.contactName = request.contactName;
        advertisement.contactEmail = request.contactEmail;
        advertisement.contactNumber = request.contactNumber;
        if (featured !== undefined) {
          advertisement.featured = featured === true;
        }
        advertisement.isActive = true;
        await advertisement.save();
      }
    }

    if (status === "rejected") {
      await Advertisement.updateOne(
        { requestId: request._id },
        { $set: { isActive: false } },
      );
    }

    return res.status(200).json({
      message: `Request ${status} successfully.`,
      request,
      advertisement,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const createAdvertisementTemplate = async (req, res) => {
  try {
    const {
      itemName,
      description,
      category,
      location,
      image,
      contactName,
      contactEmail,
      contactNumber,
      featured,
    } = req.body || {};

    if (
      !itemName ||
      !description ||
      !category ||
      !location ||
      !contactName ||
      !contactEmail ||
      !contactNumber
    ) {
      return res.status(400).json({
        message: "Please provide all required advertisement fields.",
      });
    }

    if (!["lost", "found"].includes(category)) {
      return res.status(400).json({
        message: "Category must be either lost or found.",
      });
    }

    const advertisement = await Advertisement.create({
      itemName,
      description,
      category,
      location,
      image: image || "",
      contactName,
      contactEmail,
      contactNumber,
      source: "template",
      featured: featured === true,
      isActive: true,
      createdBy: req.user?._id,
    });

    return res.status(201).json({
      message: "Advertisement created from template.",
      advertisement,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getAdvertisements = async (req, res) => {
  try {
    const category = req.query.category;
    const location = req.query.location;
    const featured = req.query.featured;
    const includeInactive = req.query.includeInactive === "true";
    const includeAll = req.query.includeAll === "true";

    const filter = {};
    if (!includeInactive) {
      filter.isActive = true;
    }
    if (["lost", "found"].includes(category)) {
      filter.category = category;
    }
    if (featured === "true" || featured === "false") {
      filter.featured = featured === "true";
    }
    if (location) {
      filter.location = { $regex: String(location), $options: "i" };
    }

    const query = Advertisement.find(filter).sort({ featured: -1, createdAt: -1 });
    if (!includeAll) {
      query.skip(parseSkip(req.query.skip)).limit(parseLimit(req.query.limit));
    }

    const advertisements = await query.lean();
    return res.status(200).json(advertisements);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const toggleAdvertisementFeatured = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid advertisement id." });
    }

    const advertisement = await Advertisement.findById(id);
    if (!advertisement) {
      return res.status(404).json({ message: "Advertisement not found." });
    }

    advertisement.featured = !advertisement.featured;
    await advertisement.save();

    return res.status(200).json({
      message: "Advertisement featured status updated.",
      advertisement,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateAdvertisement = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid advertisement id." });
    }

    const advertisement = await Advertisement.findById(id);
    if (!advertisement) {
      return res.status(404).json({ message: "Advertisement not found." });
    }

    const editableFields = [
      "itemName",
      "description",
      "category",
      "location",
      "image",
      "contactName",
      "contactEmail",
      "contactNumber",
      "featured",
      "isActive",
    ];

    editableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        advertisement[field] = req.body[field];
      }
    });

    if (!["lost", "found"].includes(advertisement.category)) {
      return res.status(400).json({
        message: "Category must be either lost or found.",
      });
    }

    await advertisement.save();
    return res.status(200).json({
      message: "Advertisement updated successfully.",
      advertisement,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteAdvertisement = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid advertisement id." });
    }

    const advertisement = await Advertisement.findById(id);
    if (!advertisement) {
      return res.status(404).json({ message: "Advertisement not found." });
    }

    await advertisement.deleteOne();

    return res.status(200).json({
      message: "Advertisement deleted successfully.",
      deletedId: id,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createAdvertisementRequest,
  getAdvertisementRequests,
  updateAdvertisementRequestStatus,
  createAdvertisementTemplate,
  getAdvertisements,
  toggleAdvertisementFeatured,
  updateAdvertisement,
  deleteAdvertisement,
};
