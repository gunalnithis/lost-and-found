import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import ItemCard from "../components/ItemCard";

const Profile = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [userItems, setUserItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({
    itemName: "",
    category: "lost",
    description: "",
    location: "",
    email: "",
    contactNumber: "",
    image: "",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    itNumber: "",
    password: "",
    confirmPassword: "",
    profilePic: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem("userInfo");
    if (user) {
      const parsedUser = JSON.parse(user);
      setUserInfo(parsedUser);
      setFormData({
        name: parsedUser.name || "",
        itNumber: parsedUser.itNumber || "",
        profilePic: parsedUser.profilePic || "",
        password: "",
        confirmPassword: "",
      });
    } else {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    const fetchUserItems = async () => {
      if (!userInfo?._id) return;
      try {
        setItemsLoading(true);
        setItemsError(null);
        const url = `http://127.0.0.1:8000/api/items/user/${userInfo._id}`;
        console.log("Fetching user items from:", url);
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Error response:", errorData);
          throw new Error(
            errorData.message ||
              `HTTP ${response.status}: Failed to fetch your items`,
          );
        }
        const data = await response.json();
        console.log("Fetched items:", data);
        setUserItems(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Fetch error:", err);
        setItemsError(err.message || "Unable to load your items");
      } finally {
        setItemsLoading(false);
      }
    };

    fetchUserItems();
  }, [userInfo]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = () => resolve(fileReader.result);
      fileReader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const base64 = await convertToBase64(file);
        setFormData({ ...formData, profilePic: base64 });
      } catch (err) {
        setError("Failed to process image");
      }
    }
  };

  const handleEditFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const base64 = await convertToBase64(file);
      setEditForm((prev) => ({ ...prev, image: base64 }));
    } catch (err) {
      setEditError("Failed to process image");
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const openEditModal = (item) => {
    setEditError(null);
    setEditingItem(item);
    setEditForm({
      itemName: item.itemName || "",
      category: item.category || "lost",
      description: item.description || "",
      location: item.location || "",
      email: item.email || "",
      contactNumber: item.contactNumber || "",
      image: item.image || "",
    });
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    if (!editingItem || !userInfo?.token) return;
    setEditLoading(true);
    setEditError(null);

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/items/${editingItem._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userInfo.token}`,
          },
          body: JSON.stringify(editForm),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update item");
      }

      setUserItems((prev) =>
        prev.map((item) => (item._id === data._id ? data : item)),
      );
      setEditingItem(null);
    } catch (err) {
      setEditError(err.message || "Failed to update item");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!userInfo?.token) return;
    const confirmed = window.confirm(
      "Are you sure you want to delete this item?",
    );
    if (!confirmed) return;

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/items/${itemId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete item");
      }

      setUserItems((prev) => prev.filter((item) => item._id !== itemId));
    } catch (err) {
      setItemsError(err.message || "Failed to delete item");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (formData.password && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userInfo.token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          itNumber: formData.itNumber,
          password: formData.password,
          profilePic: formData.profilePic,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("userInfo", JSON.stringify(data));
        setUserInfo(data);
        setFormData({
          name: data.name || "",
          itNumber: data.itNumber || "",
          profilePic: data.profilePic || "",
          password: "",
          confirmPassword: "",
        });
        setMessage("Profile updated successfully!");
        setIsEditing(false); // Switch back to view mode after save
      } else {
        setError(data.message || "Something went wrong");
      }
    } catch (err) {
      setError("Failed to connect to the server");
    } finally {
      setLoading(false);
    }
  };

  if (!userInfo) return null;

  return (
    <div className="flex min-h-screen flex-col bg-deep-bg">
      <main className="flex-1 px-6 pb-16 pt-12">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col overflow-hidden rounded-3xl border border-deep-border bg-deep-card shadow-xl shadow-black/40 md:flex-row">
            {/* Sidebar Profile Info */}
            <div className="flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 via-slate-900 to-cyan-950 p-10 text-white md:w-1/3">
              <div className="relative group">
                <div className="w-40 h-40 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center overflow-hidden border-4 border-white/30 shadow-2xl mb-6">
                  {formData.profilePic ? (
                    <img
                      src={formData.profilePic}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-6xl font-bold">
                      {userInfo.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                {isEditing && (
                  <label className="absolute bottom-6 right-0 cursor-pointer rounded-full bg-deep-card p-2 text-sky-400 shadow-lg transition-transform hover:scale-110 animate-bounce">
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      accept="image/*"
                    />
                    📷
                  </label>
                )}
              </div>

              <h2 className="text-2xl font-bold text-center mb-1">
                {userInfo.name}
              </h2>
              <p className="text-white/80 font-medium mb-6 uppercase tracking-wider text-sm">
                {userInfo.itNumber}
              </p>

              <div className="w-full h-px bg-white/20 mb-6"></div>

              <div className="w-full space-y-4">
                <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl border border-white/10">
                  <span className="text-xl">📧</span>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase text-white/60 font-bold tracking-widest">
                      Gmail
                    </span>
                    <span className="text-sm font-medium">
                      {userInfo.email}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="p-10 md:w-2/3 md:p-14">
              <div className="mb-10 flex items-start justify-between">
                <div>
                  <h1 className="mb-2 text-3xl font-bold text-slate-100">
                    {isEditing ? "Edit Profile" : "My Profile"}
                  </h1>
                  <p className="text-deep-muted">
                    {isEditing
                      ? "Update your information below"
                      : "Review your account details"}
                  </p>
                </div>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 rounded-xl border border-sky-500/40 bg-sky-950/40 px-6 py-2 font-bold text-sky-400 transition-colors hover:bg-sky-950/60"
                  >
                    <span>Edit Profile</span>
                    <span>✏️</span>
                  </button>
                )}
              </div>

              {message && (
                <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-emerald-400 animate-fade-in">
                  <span className="text-xl">✅</span>
                  <span className="font-medium">{message}</span>
                </div>
              )}

              {error && (
                <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-red-400 animate-fade-in">
                  <span className="text-xl">❌</span>
                  <span className="font-medium">{error}</span>
                </div>
              )}

              {isEditing ? (
                <form
                  onSubmit={handleSubmit}
                  className="space-y-6 animate-fade-in"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="ml-1 text-xs font-bold uppercase tracking-widest text-deep-muted">
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-deep-border bg-deep-surface px-5 py-4 font-medium text-slate-200 outline-none transition-all focus:border-sky-500/50 focus:ring-4 focus:ring-sky-500/15"
                        placeholder="Your Name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="ml-1 text-xs font-bold uppercase tracking-widest text-deep-muted">
                        IT Number
                      </label>
                      <input
                        type="text"
                        name="itNumber"
                        value={formData.itNumber}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-deep-border bg-deep-surface px-5 py-4 font-medium text-slate-200 outline-none transition-all focus:border-sky-500/50 focus:ring-4 focus:ring-sky-500/15"
                        placeholder="IT21xxxxxx"
                        required
                      />
                    </div>
                  </div>

                  <div className="my-8 h-px bg-deep-border"></div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="ml-1 text-xs font-bold uppercase tracking-widest text-deep-muted">
                        New Password
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-deep-border bg-deep-surface px-5 py-4 font-medium text-slate-200 outline-none transition-all focus:border-sky-500/50 focus:ring-4 focus:ring-sky-500/15"
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="ml-1 text-xs font-bold uppercase tracking-widest text-deep-muted">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-deep-border bg-deep-surface px-5 py-4 font-medium text-slate-200 outline-none transition-all focus:border-sky-500/50 focus:ring-4 focus:ring-sky-500/15"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 mt-8">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex transform items-center justify-center gap-3 rounded-2xl bg-gradient-accent px-10 py-4 font-bold text-white shadow-lg shadow-blue-900/40 transition-all duration-300 hover:scale-[1.02] hover:bg-gradient-accent-hover hover:shadow-xl active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100"
                    >
                      {loading && (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      )}
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          ...formData,
                          name: userInfo.name,
                          itNumber: userInfo.itNumber,
                          profilePic: userInfo.profilePic || "",
                          password: "",
                          confirmPassword: "",
                        });
                      }}
                      className="rounded-2xl border border-deep-border bg-deep-surface px-10 py-4 font-bold text-slate-300 transition-all hover:bg-deep-elevated"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-8 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div>
                      <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-deep-muted">
                        Display Name
                      </h4>
                      <p className="text-xl font-semibold text-slate-100">
                        {userInfo.name}
                      </p>
                    </div>
                    <div>
                      <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-deep-muted">
                        IT Number
                      </h4>
                      <p className="font-mono text-xl font-semibold tracking-tighter text-slate-100">
                        {userInfo.itNumber}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-sky-500/30 bg-sky-950/30 p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-deep-card text-2xl shadow-sm">
                        🛡️
                      </div>
                      <div>
                        <h4 className="font-bold text-sky-200">
                          Account Verified
                        </h4>
                        <p className="text-sm text-sky-400/90">
                          Your profile is currently secure and active.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mx-auto mt-12 max-w-6xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-100">
                My Posted Items
              </h2>
              <p className="text-deep-muted">Your lost and found submissions</p>
            </div>
          </div>

          {itemsLoading && (
            <div className="flex min-h-[200px] items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-sky-500"></div>
            </div>
          )}

          {itemsError && !itemsLoading && (
            <div className="rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-red-400">
              {itemsError}
            </div>
          )}

          {!itemsLoading && !itemsError && userItems.length === 0 && (
            <div className="rounded-2xl border border-deep-border bg-deep-card p-6 text-deep-muted">
              You have not posted any items yet.
            </div>
          )}

          {!itemsLoading && !itemsError && userItems.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {userItems.map((item) => (
                <ItemCard
                  key={item._id}
                  item={item}
                  onEdit={() => openEditModal(item)}
                  onDelete={() => handleDeleteItem(item._id)}
                />
              ))}
            </div>
          )}
        </div>

        {editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-deep-border bg-deep-card shadow-xl shadow-black/40">
              <div className="flex items-center justify-between border-b border-deep-border px-6 py-4">
                <h3 className="text-lg font-semibold text-slate-100">
                  Edit Item
                </h3>
                <button
                  onClick={() => setEditingItem(null)}
                  className="text-deep-muted hover:text-red-400"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdateItem} className="space-y-4 p-6">
                {editError && (
                  <div className="rounded-xl border border-red-500/40 bg-red-950/40 p-4 text-red-400">
                    {editError}
                  </div>
                )}

                <input
                  type="text"
                  name="itemName"
                  value={editForm.itemName}
                  onChange={handleEditChange}
                  className="theme-input"
                  placeholder="Item Name"
                  required
                />

                <select
                  name="category"
                  value={editForm.category}
                  onChange={handleEditChange}
                  className="theme-input"
                >
                  <option value="lost">Lost</option>
                  <option value="found">Found</option>
                </select>

                <textarea
                  name="description"
                  value={editForm.description}
                  onChange={handleEditChange}
                  className="theme-input"
                  rows="3"
                  placeholder="Description"
                  required
                />

                <input
                  type="text"
                  name="location"
                  value={editForm.location}
                  onChange={handleEditChange}
                  className="theme-input"
                  placeholder="Location"
                  required
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <input
                    type="email"
                    name="email"
                    value={editForm.email}
                    onChange={handleEditChange}
                    className="theme-input"
                    placeholder="Email"
                    required
                  />

                  <input
                    type="tel"
                    name="contactNumber"
                    value={editForm.contactNumber}
                    onChange={handleEditChange}
                    className="theme-input"
                    placeholder="Contact Number"
                    required
                  />
                </div>

                <input
                  type="file"
                  onChange={handleEditFileChange}
                  className="theme-input"
                />

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="flex-1 rounded-lg border border-deep-border px-4 py-2 text-slate-300 hover:bg-deep-elevated"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="flex-1 rounded-lg bg-gradient-accent px-4 py-2 text-white hover:bg-gradient-accent-hover disabled:opacity-70"
                  >
                    {editLoading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
