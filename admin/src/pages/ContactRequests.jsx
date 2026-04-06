import { useEffect, useState } from "react";
import { Mail, Phone, User, Calendar, Hash } from "lucide-react";

const ContactRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await fetch(
          "http://127.0.0.1:8000/api/contact/requests",
        );
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || "Failed to fetch contact requests",
          );
        }
        const data = await response.json();
        setRequests(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Unable to load contact requests");
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6 bg-red-50 rounded-3xl border border-red-100 text-center">
        <Mail className="text-red-500 mb-4" size={48} />
        <h3 className="text-xl font-bold text-red-800 mb-2">
          Contact Requests Error
        </h3>
        <p className="text-red-600 max-w-md">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Contact Requests</h2>
          <p className="text-gray-500">
            Submissions from the Contact Item Owner form
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-200">
          <Mail size={18} className="text-indigo-600" />
          <span className="font-bold text-gray-700">{requests.length}</span>
          <span className="text-gray-500 text-sm">Total Requests</span>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  IT Details
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.map((req) => (
                <tr
                  key={req._id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-800 font-semibold">
                      <User size={16} className="text-gray-400" />
                      {req.name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-indigo-400" />
                        {req.email}
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-emerald-400" />
                        {req.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Hash size={14} className="text-gray-400" />
                        {req.itNumber}
                      </div>
                      <div className="text-gray-500">{req.studyingYear}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {req.itemName || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-400" />
                      {req.createdAt
                        ? new Date(req.createdAt).toLocaleString()
                        : "-"}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {requests.length === 0 && (
          <div className="py-10 text-center text-gray-500">
            No contact requests submitted yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactRequests;
