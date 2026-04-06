import { useState } from "react";
import { Mail, Loader } from "lucide-react";

const ContactForm = ({ itemDetails, itemOwner, onClose }) => {
  const founderEmail = itemOwner?.email || itemDetails?.email || "";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    itNumber: "",
    studyingYear: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [warning, setWarning] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const validateEmail = (value) => {
    const normalizedEmail = value.trim().toLowerCase();

    if (!normalizedEmail) {
      return { isValid: false, normalizedEmail, error: "Email is required" };
    }

    if (!/^[a-z0-9._%+-]+@gmail\.com$/.test(normalizedEmail)) {
      return {
        isValid: false,
        normalizedEmail,
        error: "Only Gmail addresses are allowed (example@gmail.com)",
      };
    }

    const [username] = normalizedEmail.split("@");
    if (
      username.startsWith(".") ||
      username.endsWith(".") ||
      username.includes("..")
    ) {
      return {
        isValid: false,
        normalizedEmail,
        error: "Enter a valid Gmail address",
      };
    }

    return { isValid: true, normalizedEmail, error: "" };
  };

  const normalizeContactNumber = (value) => {
    const cleaned = value.replace(/[\s-]/g, "").trim();

    if (cleaned.startsWith("+94") && cleaned.length === 12) {
      return `0${cleaned.slice(3)}`;
    }

    if (cleaned.startsWith("94") && cleaned.length === 11) {
      return `0${cleaned.slice(2)}`;
    }

    if (cleaned.startsWith("7") && cleaned.length === 9) {
      return `0${cleaned}`;
    }

    return cleaned;
  };

  const validateContactNumber = (value) => {
    if (!value.trim()) {
      return {
        isValid: false,
        normalizedContactNumber: "",
        error: "Contact number is required",
      };
    }

    const normalizedContactNumber = normalizeContactNumber(value);

    if (!/^\d+$/.test(normalizedContactNumber)) {
      return {
        isValid: false,
        normalizedContactNumber,
        error: "Contact number must contain only digits",
      };
    }

    if (!/^07\d{8}$/.test(normalizedContactNumber)) {
      return {
        isValid: false,
        normalizedContactNumber,
        error:
          "Enter a valid Sri Lankan mobile number (07XXXXXXXX or +947XXXXXXXX)",
      };
    }

    return { isValid: true, normalizedContactNumber, error: "" };
  };

  const validateForm = (values) => {
    const errors = {};

    const emailValidation = validateEmail(values.email);
    if (!emailValidation.isValid) {
      errors.email = emailValidation.error;
    }

    const contactValidation = validateContactNumber(values.phone);
    if (!contactValidation.isValid) {
      errors.phone = contactValidation.error;
    }

    return {
      errors,
      normalizedEmail: emailValidation.normalizedEmail,
      normalizedPhone: contactValidation.normalizedContactNumber,
    };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "email") {
      const nextEmail = value.toLowerCase();
      setFormData((prev) => ({
        ...prev,
        email: nextEmail,
      }));

      const emailValidation = validateEmail(nextEmail);
      setFormErrors((prev) => ({
        ...prev,
        email: emailValidation.isValid ? "" : emailValidation.error,
      }));
      return;
    }

    if (name === "phone") {
      const nextPhone = value.replace(/[^\d+\s-]/g, "").slice(0, 15);
      setFormData((prev) => ({
        ...prev,
        phone: nextPhone,
      }));

      const contactValidation = validateContactNumber(nextPhone);
      setFormErrors((prev) => ({
        ...prev,
        phone: contactValidation.isValid ? "" : contactValidation.error,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setFormErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setWarning("");
    setFormErrors({});

    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    if (!userInfo?.token) {
      setError("Please login to contact the item founder");
      return;
    }

    const { errors, normalizedEmail, normalizedPhone } = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const normalizedFormData = {
      ...formData,
      email: normalizedEmail,
      phone: normalizedPhone,
    };
    setFormData(normalizedFormData);
    setLoading(true);

    try {
      if (!itemDetails?._id) {
        throw new Error("Item information is missing. Please try again.");
      }

      const response = await fetch(
        "http://localhost:8000/api/contact/send-message",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userInfo.token}`,
          },
          body: JSON.stringify({
            ...normalizedFormData,
            itemId: itemDetails._id,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send message");
      }

      if (data.emailSent === false) {
        setWarning(
          data.message ||
            "Request saved, but email notification could not be sent.",
        );
        return;
      }

      setSuccessMessage(
        data.message ||
          "Your request has been submitted and is waiting for admin approval.",
      );
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.message || "An error occurred while sending the message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-deep-border bg-deep-card shadow-xl shadow-black/40">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-deep-border bg-deep-surface px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-100">
              Contact Item Founder
            </h3>
            <p className="mt-1 text-xs text-deep-muted">
              Item: {itemDetails.itemName}
            </p>
            {founderEmail && (
              <p className="mt-1 text-xs text-slate-400">
                Founder Email: {founderEmail}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-2xl text-deep-muted transition hover:text-red-400"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        {success ? (
          <div className="p-6 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
              <Mail className="text-emerald-400" size={32} />
            </div>
            <h4 className="mb-2 text-lg font-semibold text-emerald-400">
              Contact Request Submitted!
            </h4>
            <p className="text-slate-400">{successMessage}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 p-6">
            {error && (
              <div className="rounded-lg border border-red-500/40 bg-red-950/40 p-4 text-sm text-red-400">
                {error}
              </div>
            )}

            {warning && (
              <div className="rounded-lg border border-amber-500/40 bg-amber-950/40 p-4 text-sm text-amber-300">
                {warning}
              </div>
            )}

            {/* Name */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Your Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="theme-input"
                placeholder="Enter your full name"
              />
            </div>

            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Your Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    email: e.target.value.trim().toLowerCase(),
                  }))
                }
                required
                maxLength={60}
                className="theme-input"
                placeholder="founder@email.com"
              />
              {formErrors.email && (
                <p className="mt-1 text-sm text-red-400">{formErrors.email}</p>
              )}
            </div>

            {/* Phone & IT Number */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-300">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      phone: normalizeContactNumber(e.target.value),
                    }))
                  }
                  required
                  inputMode="numeric"
                  className="theme-input"
                  placeholder="07XXXXXXXX or +947XXXXXXXX"
                />
                {formErrors.phone && (
                  <p className="mt-1 text-sm text-red-400">
                    {formErrors.phone}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-300">
                  IT Number
                </label>
                <input
                  type="text"
                  name="itNumber"
                  value={formData.itNumber}
                  onChange={handleChange}
                  required
                  className="theme-input"
                  placeholder="IT-001234"
                />
              </div>
            </div>

            {/* Studying Year */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Current Studying Year
              </label>
              <select
                name="studyingYear"
                value={formData.studyingYear}
                onChange={handleChange}
                required
                className="theme-input"
              >
                <option value="">Select Year</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="Alumni">Alumni</option>
              </select>
            </div>

            {/* Message */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Message (Optional)
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                className="theme-input resize-none"
                rows="3"
                placeholder="Add any additional message..."
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-deep-border px-4 py-2 font-semibold text-slate-300 transition hover:bg-deep-elevated"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-accent px-4 py-2 font-semibold text-white transition hover:bg-gradient-accent-hover hover:shadow-lg disabled:opacity-50"
              >
                {loading && <Loader size={18} className="animate-spin" />}
                {loading ? "Sending..." : "Send Message"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ContactForm;
