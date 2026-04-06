import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const PostItem = () => {
  const navigate = useNavigate();
  const routeLocation = useLocation();

  const queryParams = new URLSearchParams(routeLocation.search);
  const categoryFromQuery = queryParams.get("category");
  const categoryFromState = routeLocation.state?.defaultCategory;
  const normalizedDefaultCategory =
    categoryFromState === "found" || categoryFromState === "lost"
      ? categoryFromState
      : categoryFromQuery === "found" || categoryFromQuery === "lost"
        ? categoryFromQuery
        : "lost";

  const getTodayDate = () => {
    const now = new Date();
    const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return localNow.toISOString().slice(0, 10);
  };

  const getCurrentTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes(),
    ).padStart(2, "0")}`;
  };

  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState(normalizedDefaultCategory);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [itemDate, setItemDate] = useState(() => getTodayDate());
  const [itemTime, setItemTime] = useState(() => getCurrentTime());
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formErrors, setFormErrors] = useState({});

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = () => resolve(fileReader.result);
      fileReader.onerror = (error) => reject(error);
    });
  };

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

  // ✅ Validation Function
  const validateForm = () => {
    const errors = {};

    if (!itemName.trim()) {
      errors.itemName = "Item name is required";
    }

    if (!description.trim() || description.length < 10) {
      errors.description = "Description must be at least 10 characters";
    }

    if (!location.trim()) {
      errors.location = "Location is required";
    }

    if (!itemDate) {
      errors.itemDate = "Date is required";
    }

    if (!itemTime) {
      errors.itemTime = "Time is required";
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      errors.email = emailValidation.error;
    }

    const contactValidation = validateContactNumber(contactNumber);
    if (!contactValidation.isValid) {
      errors.contactNumber = contactValidation.error;
    }

    if (image && image.size > 2 * 1024 * 1024) {
      errors.image = "Image must be less than 2MB";
    }

    return errors;
  };

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    if (!userInfo) {
      navigate("/login", {
        state: { message: "Please login to post an item" },
      });
      return;
    }
    if (userInfo) {
      if (!email && userInfo.email)
        setEmail(userInfo.email.trim().toLowerCase());
      if (!contactNumber && (userInfo.phone || userInfo.contactNumber)) {
        setContactNumber(
          normalizeContactNumber(userInfo.phone || userInfo.contactNumber),
        );
      }
    }
  }, [navigate, email, contactNumber]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailValidation = validateEmail(email);
    if (emailValidation.normalizedEmail !== email) {
      setEmail(emailValidation.normalizedEmail);
    }

    const contactValidation = validateContactNumber(contactNumber);
    if (contactValidation.normalizedContactNumber !== contactNumber) {
      setContactNumber(contactValidation.normalizedContactNumber);
    }

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setLoading(true);
    setError("");
    setFormErrors({});

    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    if (!userInfo) {
      alert("Please login to post an item");
      navigate("/login", {
        state: { message: "Please login to post an item" },
      });
      setLoading(false);
      return;
    }

    let imageBase64 = "";
    if (image) {
      try {
        imageBase64 = await convertToBase64(image);
      } catch (err) {
        setError("Failed to process image");
        setLoading(false);
        return;
      }
    }

    const itemData = {
      itemName,
      category,
      description,
      location,
      itemDate,
      itemTime,
      email: emailValidation.normalizedEmail,
      contactNumber: contactValidation.normalizedContactNumber,
      image: imageBase64 || "https://via.placeholder.com/150",
    };

    try {
      const response = await fetch("http://localhost:8000/api/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userInfo.token}`,
        },
        body: JSON.stringify(itemData),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Item posted successfully!");
        setItemName("");
        setCategory("lost");
        setDescription("");
        setLocation("");
        setItemDate(getTodayDate());
        setItemTime(getCurrentTime());
        setEmail("");
        setContactNumber("");
        setImage(null);
        navigate(category === "lost" ? "/lost-items" : "/found-items");
      } else {
        setError(data.message || "Something went wrong");
      }
    } catch (err) {
      setError("Failed to connect to the server");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(
      normalizedDefaultCategory === "found" ? "/found-items" : "/lost-items",
    );
  };

  return (
    <div className="flex min-h-screen items-start justify-center bg-deep-bg px-4 pt-24">
      <div className="theme-card w-full max-w-lg p-8 shadow-xl shadow-black/30">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="bg-gradient-to-r from-sky-300 to-cyan-400 bg-clip-text text-2xl font-bold text-transparent">
            Post an Item
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-deep-border px-3 py-1.5 text-sm font-semibold text-slate-200 transition hover:border-red-400 hover:text-red-300"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <input
            type="text"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="Item Name"
            className="theme-input p-3"
          />
          {formErrors.itemName && (
            <p className="text-sm text-red-400">{formErrors.itemName}</p>
          )}

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="theme-input p-3"
          >
            <option value="lost">Lost</option>
            <option value="found">Found</option>
          </select>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            rows={4}
            className="theme-input p-3"
          />
          {formErrors.description && (
            <p className="text-sm text-red-400">{formErrors.description}</p>
          )}

          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location"
            className="theme-input p-3"
          />
          {formErrors.location && (
            <p className="text-sm text-red-400">{formErrors.location}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <input
                type="date"
                value={itemDate}
                onChange={(e) => setItemDate(e.target.value)}
                className="theme-input w-full p-3"
              />
              {formErrors.itemDate && (
                <p className="mt-1 text-sm text-red-400">
                  {formErrors.itemDate}
                </p>
              )}
            </div>
            <div>
              <input
                type="time"
                value={itemTime}
                onChange={(e) => setItemTime(e.target.value)}
                className="theme-input w-full p-3"
              />
              {formErrors.itemTime && (
                <p className="mt-1 text-sm text-red-400">
                  {formErrors.itemTime}
                </p>
              )}
            </div>
          </div>

          <input
            type="email"
            value={email}
            onChange={(e) => {
              const nextEmail = e.target.value.toLowerCase();
              setEmail(nextEmail);

              const emailValidation = validateEmail(nextEmail);
              setFormErrors((prev) => ({
                ...prev,
                email: emailValidation.isValid ? "" : emailValidation.error,
              }));
            }}
            onBlur={(e) => setEmail(e.target.value.trim().toLowerCase())}
            placeholder="Email"
            maxLength={60}
            required
            className="theme-input p-3"
          />
          {formErrors.email && (
            <p className="text-sm text-red-400">{formErrors.email}</p>
          )}

          <input
            type="tel"
            value={contactNumber}
            onChange={(e) => {
              const nextContact = e.target.value.replace(/[^\d+\s-]/g, "");
              setContactNumber(nextContact.slice(0, 15));

              const contactValidation = validateContactNumber(nextContact);
              setFormErrors((prev) => ({
                ...prev,
                contactNumber: contactValidation.isValid
                  ? ""
                  : contactValidation.error,
              }));
            }}
            onBlur={(e) =>
              setContactNumber(normalizeContactNumber(e.target.value))
            }
            placeholder="Contact Number"
            inputMode="numeric"
            required
            className="theme-input p-3"
          />
          {formErrors.contactNumber && (
            <p className="text-sm text-red-400">{formErrors.contactNumber}</p>
          )}

          <input
            type="file"
            onChange={(e) => setImage(e.target.files[0])}
            className="theme-input rounded-lg border border-dashed border-deep-border p-2 file:mr-3 file:rounded-md file:border-0 file:bg-sky-600 file:px-3 file:py-1.5 file:text-sm file:text-white hover:file:bg-sky-500"
          />
          {formErrors.image && (
            <p className="text-sm text-red-400">{formErrors.image}</p>
          )}

          <button
            type="submit"
            className="rounded-lg bg-gradient-accent py-3 font-semibold text-white transition hover:bg-gradient-accent-hover"
          >
            {loading ? "Posting..." : "Post Item"}
          </button>

          {error && <p className="text-center text-red-400">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default PostItem;
