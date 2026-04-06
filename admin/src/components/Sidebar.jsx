import { Link, useLocation } from "react-router-dom";
import {
  Users,
  LayoutDashboard,
  Package,
  Mail,
  MailOpen,
  MessageSquare,
  Megaphone,
  X,
} from "lucide-react";

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();

  const menuItems = [
    { title: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/" },
    { title: "Users", icon: <Users size={20} />, path: "/users" },
    { title: "Items", icon: <Package size={20} />, path: "/items" },
    {
      title: "Lost Contacts",
      icon: <Mail size={20} />,
      path: "/contacts/lost",
    },
    {
      title: "Found Contacts",
      icon: <MailOpen size={20} />,
      path: "/contacts/found",
    },
    {
      title: "Ad Requests",
      icon: <Megaphone size={20} />,
      path: "/advertisements/requests",
    },
    {
      title: "Feedbacks",
      icon: <MessageSquare size={20} />,
      path: "/feedbacks",
    },
  ];

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close menu overlay"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-dvh w-72 flex-col overflow-y-auto overscroll-contain border-r border-slate-700/50 bg-[#0b1424]/95 text-slate-200 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl transition-transform duration-300 md:static md:h-screen md:min-h-screen md:w-72 md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="flex items-start justify-between border-b border-slate-700/50 p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-300/75">
              Control Center
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
              LF Admin
            </h1>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-700/50 p-2 text-slate-300 md:hidden"
            aria-label="Close sidebar"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-4 pt-4">
          <p className="rounded-xl border border-cyan-700/30 bg-cyan-500/10 px-4 py-3 text-xs leading-5 text-cyan-100">
            Monitor users, moderation requests, and platform activity in one
            place.
          </p>
        </div>

        <nav className="space-y-2 px-4 py-6">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`group relative flex items-center gap-3 overflow-hidden rounded-xl px-4 py-3 transition-all duration-200 ${
                location.pathname === item.path
                  ? "bg-gradient-to-r from-cyan-400 to-teal-300 text-slate-950 shadow-lg shadow-cyan-900/40"
                  : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
              }`}
            >
              <span className="transition-transform duration-200 group-hover:scale-105">
                {item.icon}
              </span>
              <span className="font-medium tracking-wide">{item.title}</span>
            </Link>
          ))}
        </nav>

        <div className="border-t border-slate-700/50 p-4">
          <p className="text-center text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
            Lost & Found System
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
