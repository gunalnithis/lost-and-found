import { useState, useEffect } from "react";
import {
  Package,
  Search,
  MapPin,
  Calendar,
  Edit2,
  Trash2,
  Check,
  X,
  Clock,
} from "lucide-react";

const API_BASE = "http://127.0.0.1:8000";

const Items = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [editingItem, setEditingItem] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/api/items`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to fetch items");
        }
        const data = await response.json();
        setItems(data);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch items:", err.message);
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  const filteredItems = items.filter((item) => {
    const matchesCategory = filter === "all" || item.category === filter;
    const matchesStatus =
      statusFilter === "all" || (item.status || "pending") === statusFilter;
    const matchesSearch =
      item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesStatus && matchesSearch;
  });

  const handleStatusUpdate = async (itemId, newStatus) => {
    try {
      const response = await fetch(`${API_BASE}/api/items/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to update status");

      setItems((prev) =>
        prev.map((item) =>
          item._id === itemId ? { ...item, status: newStatus } : item,
        ),
      );
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm("Are you sure you want to delete this report?")) return;
    try {
      const response = await fetch(`${API_BASE}/api/items/${itemId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete item");
      }

      setItems((prev) => prev.filter((item) => item._id !== itemId));
    } catch (err) {
      alert(err.message);
    }
  };

  const openEditModal = (item) => {
    setEditingItem({ ...item });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/api/items/${editingItem._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingItem),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update item");
      }

      const updatedItem = await response.json();
      setItems((prev) =>
        prev.map((item) => (item._id === updatedItem._id ? updatedItem : item)),
      );
      setIsEditModalOpen(false);
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Reported Items</h2>
          <p className="text-gray-500">
            Manage all lost and found reports from across campus
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-200">
          <Package size={18} className="text-indigo-600" />
          <span className="font-bold text-gray-700">{items.length}</span>
          <span className="text-gray-500 text-sm">Total Items</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search by item name or location..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex bg-white p-1 rounded-xl border border-gray-200">
            {["all", "lost", "found"].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                  filter === cat
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex bg-white p-1 rounded-xl border border-gray-200">
            {["all", "pending", "approved"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  statusFilter === status
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Item Information
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Location & Date
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Reporter
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItems.map((item) => (
                <tr
                  key={item._id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={item.image || "https://via.placeholder.com/50"}
                        alt=""
                        className="w-14 h-14 rounded-2xl object-cover ring-2 ring-gray-100"
                      />
                      <div>
                        <p className="font-bold text-gray-800">
                          {item.itemName}
                        </p>
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${item.category === "lost" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}
                        >
                          {item.category}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        item.status === "approved"
                          ? "bg-emerald-50 text-emerald-600"
                          : item.status === "rejected"
                            ? "bg-red-50 text-red-600"
                            : "bg-amber-50 text-amber-600"
                      }`}
                    >
                      {item.status === "approved" ? (
                        <Check size={12} />
                      ) : item.status === "rejected" ? (
                        <X size={12} />
                      ) : (
                        <Clock size={12} />
                      )}
                      {item.status || "pending"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <MapPin size={14} className="text-gray-400" />
                        {item.location}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                        <Calendar size={14} />
                        {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-700 font-medium">{item.email}</p>
                      <p className="text-gray-400 text-xs">
                        {item.contactNumber}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {item.status !== "approved" && (
                        <button
                          onClick={() =>
                            handleStatusUpdate(item._id, "approved")
                          }
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                          title="Approve"
                        >
                          <Check size={18} />
                        </button>
                      )}
                      {item.status !== "rejected" && (
                        <button
                          onClick={() =>
                            handleStatusUpdate(item._id, "rejected")
                          }
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Reject"
                        >
                          <X size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                        title="Edit"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-indigo-600 text-white">
              <h3 className="text-xl font-bold">Edit Report</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="hover:bg-white/20 p-1.5 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase px-1">
                    Item Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-indigo-500 outline-none transition-all"
                    value={editingItem.itemName}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        itemName: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase px-1">
                    Category
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-indigo-500 outline-none transition-all"
                    value={editingItem.category}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        category: e.target.value,
                      })
                    }
                  >
                    <option value="lost">Lost</option>
                    <option value="found">Found</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase px-1">
                  Location
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-indigo-500 outline-none transition-all"
                  value={editingItem.location}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, location: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase px-1">
                  Description
                </label>
                <textarea
                  className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-indigo-500 outline-none transition-all h-24 resize-none"
                  value={editingItem.description}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      description: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Items;
