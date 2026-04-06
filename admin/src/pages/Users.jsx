import { useState, useEffect } from "react";
import {
  Users as UsersIcon,
  Mail,
  Phone,
  Calendar,
  UserCheck,
  Search,
  Trash2,
  Edit3,
  AlertCircle,
} from "lucide-react";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    itNumber: "",
    email: "",
    phone: "",
    userType: "others",
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://127.0.0.1:8000/api/users");
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to fetch users");
        }
        const data = await response.json();
        setUsers(data);
        setLoading(false);
      } catch (err) {
        setError(
          err.message === "Failed to fetch"
            ? "Unable to connect to the backend server. Please ensure node server.js is running on port 8000."
            : err.message,
        );
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.itNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.userType || "others")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
  );

  const openEdit = (user) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || "",
      itNumber: user.itNumber || "",
      email: user.email || "",
      phone: user.phone || "",
      userType: user.userType || "others",
    });
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/users/${editingUser._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editForm),
        },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Failed to update user");
      }
      setUsers((prev) =>
        prev.map((u) => (u._id === editingUser._id ? data : u)),
      );
      setEditingUser(null);
    } catch (err) {
      alert(err.message || "Unable to update user");
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Delete user ${user.name}?`)) return;
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/users/${user._id}`,
        {
          method: "DELETE",
        },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Failed to delete user");
      }
      setUsers((prev) => prev.filter((u) => u._id !== user._id));
    } catch (err) {
      alert(err.message || "Unable to delete user");
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );

  if (error)
    return (
      <div className="p-6 bg-red-50 text-red-600 rounded-3xl border border-red-100 flex items-center gap-3">
        <AlertCircle size={24} />
        <p className="font-medium">{error}</p>
      </div>
    );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
          <p className="text-gray-500">
            View and manage all registered campus users
          </p>
        </div>
        <div className="bg-white px-5 py-2.5 rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
            <UsersIcon size={20} className="text-indigo-600" />
          </div>
          <div>
            <span className="block font-black text-gray-800 text-lg leading-none">
              {users.length}
            </span>
            <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">
              Total Users
            </span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative group max-w-md">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors"
          size={20}
        />
        <input
          type="text"
          placeholder="Search by name, IT number or email..."
          className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-100 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all placeholder:text-gray-400"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 text-gray-400 text-xs font-black uppercase tracking-widest border-b border-gray-50">
              <tr>
                <th className="px-6 py-5">User Information</th>
                <th className="px-6 py-5">Identities</th>
                <th className="px-6 py-5">Account Status</th>
                <th className="px-6 py-5">Category</th>
                <th className="px-6 py-5 text-right">Registered</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.map((user) => (
                <tr
                  key={user._id}
                  className="hover:bg-gray-50/50 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-100">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="block font-bold text-gray-800">
                          {user.name}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
                          <Mail size={12} />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1.5">
                      <div className="inline-flex items-center gap-2 bg-gray-100 px-2 py-1 rounded-lg text-xs font-mono font-bold text-gray-600">
                        IT: {user.itNumber}
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Phone size={12} />
                          {user.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${
                        user.isAdmin
                          ? "bg-purple-50 text-purple-600"
                          : "bg-blue-50 text-blue-600"
                      }`}
                    >
                      <UserCheck size={12} />
                      {user.isAdmin ? "Administrator" : "Standard User"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase text-emerald-700">
                      {user.userType || "others"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5 text-gray-400 text-xs font-medium">
                      <Calendar size={12} />
                      {new Date(user.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(user)}
                        className="rounded-lg border border-indigo-200 p-2 text-indigo-600 transition hover:bg-indigo-50"
                        title="Edit user"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user)}
                        className="rounded-lg border border-red-200 p-2 text-red-600 transition hover:bg-red-50"
                        title="Delete user"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
          <div className="p-20 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={32} className="text-gray-300" />
            </div>
            <h3 className="text-gray-800 font-bold">No users found</h3>
            <p className="text-gray-400 text-sm mt-1">
              Try searching for a different name or IT number.
            </p>
          </div>
        )}
      </div>

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-800">Edit User</h3>
            <div className="mt-4 grid gap-3">
              <input
                className="w-full rounded-xl border border-gray-200 px-3 py-2"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Name"
              />
              <input
                className="w-full rounded-xl border border-gray-200 px-3 py-2"
                value={editForm.itNumber}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, itNumber: e.target.value }))
                }
                placeholder="IT Number"
              />
              <input
                className="w-full rounded-xl border border-gray-200 px-3 py-2"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, email: e.target.value }))
                }
                placeholder="Email"
              />
              <input
                className="w-full rounded-xl border border-gray-200 px-3 py-2"
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, phone: e.target.value }))
                }
                placeholder="Phone"
              />
              <select
                className="w-full rounded-xl border border-gray-200 px-3 py-2"
                value={editForm.userType}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, userType: e.target.value }))
                }
              >
                <option value="student">Student</option>
                <option value="lecture">Lecture</option>
                <option value="others">Others</option>
              </select>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setEditingUser(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateUser}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
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

export default Users;
