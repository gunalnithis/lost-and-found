import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("userInfo");
    if (user) {
      setUserInfo(JSON.parse(user));
    }

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!userInfo?.token) {
        setNotifications([]);
        return;
      }

      try {
        const response = await fetch(
          "http://127.0.0.1:8000/api/contact/notifications",
          {
            headers: {
              Authorization: `Bearer ${userInfo.token}`,
            },
          },
        );

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        setNotifications(Array.isArray(data) ? data : []);
      } catch (error) {
        // keep navbar stable even if notifications fail
      }
    };

    fetchNotifications();
  }, [userInfo]);

  const dismissNotification = async (note) => {
    if (!userInfo?.token || !note?._id || !note?.category) return;

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/contact/notifications/${note.category}/${note._id}/dismiss`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        },
      );

      if (!response.ok) return;

      setNotifications((prev) => prev.filter((item) => item._id !== note._id));
    } catch (error) {
      // keep navbar stable
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userInfo");
    setUserInfo(null);
    setNotifications([]);
    window.location.reload();
  };

  return (
    <nav
      className={`fixed top-0 w-full z-50 border-b border-deep-border/60 transition-all duration-300 ${
        scrolled
          ? "bg-deep-card/90 backdrop-blur-lg shadow-lg shadow-black/30"
          : "bg-deep-surface/80 backdrop-blur-md"
      }`}
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-accent flex items-center justify-center shadow-lg shadow-blue-900/40">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-sky-300 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
            Lost & Found
          </h1>
        </div>

        {/* Desktop Menu */}
        <ul className="hidden md:flex gap-8 font-medium text-slate-300">
          <li className="relative group">
            <Link to="/" className="transition-colors hover:text-sky-400">
              Home
            </Link>
          </li>
          <li className="relative group">
            <Link
              to="/lost-items"
              className="transition-colors hover:text-sky-400"
            >
              Lost Items
            </Link>
          </li>
          <li className="relative group">
            <Link
              to="/found-items"
              className="transition-colors hover:text-sky-400"
            >
              Found Items
            </Link>
          </li>
          <li className="relative group">
            <Link
              to="/advertisement-request"
              className="transition-colors hover:text-sky-400"
            >
              Request Ad
            </Link>
          </li>
          <li className="relative group">
            <Link to="/about" className="transition-colors hover:text-sky-400">
              About
            </Link>
          </li>
          <li className="relative group">
            <Link
              to="/contact"
              className="transition-colors hover:text-sky-400"
            >
              Feedback
            </Link>
          </li>
        </ul>

        {/* Desktop Login/Register or Profile Button */}
        {userInfo ? (
          <div className="hidden md:flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen((prev) => !prev)}
                className="relative rounded-xl border border-deep-border bg-deep-card p-2 transition-colors hover:bg-deep-elevated"
                title="Notifications"
              >
                <svg
                  className="h-5 w-5 text-slate-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                    {notifications.length > 9 ? "9+" : notifications.length}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-deep-border bg-deep-card shadow-xl shadow-black/40">
                  <div className="flex items-center justify-between border-b border-deep-border px-4 py-3">
                    <p className="font-semibold text-slate-100">
                      Notifications
                    </p>
                    <button
                      type="button"
                      onClick={() => setNotificationsOpen(false)}
                      className="rounded-md border border-deep-border bg-deep-surface px-2 py-1 text-xs text-slate-300 transition hover:bg-deep-elevated"
                      aria-label="Close notifications"
                    >
                      X
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="px-4 py-6 text-center text-sm text-deep-muted">
                        No approval updates yet.
                      </p>
                    ) : (
                      notifications.map((note) => (
                        <div
                          key={note._id}
                          className="border-b border-deep-border/80 px-4 py-3 last:border-b-0"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm text-slate-200">
                                Your request for{" "}
                                <span className="font-semibold">
                                  {note.itemName || "item"}
                                </span>{" "}
                                was
                                <span
                                  className={`ml-1 font-bold ${note.status === "approved" ? "text-emerald-600" : "text-red-600"}`}
                                >
                                  {note.status}
                                </span>
                              </p>
                              <p className="mt-1 text-xs text-deep-muted">
                                {new Date(
                                  note.reviewedAt || note.createdAt,
                                ).toLocaleString()}
                              </p>
                            </div>
                            <button
                              onClick={() => dismissNotification(note)}
                              className="rounded-md border border-deep-border bg-deep-surface px-2 py-1 text-xs text-slate-400 transition hover:bg-deep-elevated"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <Link
              to="/profile"
              className="flex items-center gap-2 rounded-xl border border-deep-border bg-deep-card px-4 py-2 shadow-sm transition-colors hover:bg-deep-elevated"
            >
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gradient-accent font-bold text-white">
                {userInfo.profilePic ? (
                  <img
                    src={userInfo.profilePic}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  userInfo.name.charAt(0).toUpperCase()
                )}
              </div>
              <span className="font-semibold text-slate-200">
                {userInfo.name}
              </span>
            </Link>

            <button
              onClick={handleLogout}
              className="rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-2 font-semibold text-red-400 transition-colors hover:bg-red-950/60"
            >
              Logout
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="group relative hidden transform overflow-hidden rounded-xl bg-gradient-accent px-6 py-2.5 font-semibold text-white shadow-lg shadow-blue-900/40 transition-all duration-300 hover:-translate-y-0.5 hover:bg-gradient-accent-hover hover:shadow-xl md:inline-block"
          >
            <span className="relative z-10">Login / Register</span>
          </Link>
        )}

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-lg p-2 transition-colors hover:bg-deep-elevated md:hidden"
        >
          <svg
            className="h-6 w-6 text-slate-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {mobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-deep-border bg-deep-card/95 backdrop-blur-lg md:hidden">
          <ul className="flex flex-col gap-1 p-4 text-slate-200">
            <li>
              <Link
                to="/"
                className="block rounded-lg px-4 py-3 hover:bg-deep-elevated"
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                to="/lost-items"
                className="block rounded-lg px-4 py-3 hover:bg-deep-elevated"
              >
                Lost Items
              </Link>
            </li>
            <li>
              <Link
                to="/found-items"
                className="block rounded-lg px-4 py-3 hover:bg-deep-elevated"
              >
                Found Items
              </Link>
            </li>
            <li>
              <Link
                to="/advertisement-request"
                className="block rounded-lg px-4 py-3 hover:bg-deep-elevated"
              >
                Request Ad
              </Link>
            </li>
            <li>
              <Link
                to="/about"
                className="block rounded-lg px-4 py-3 hover:bg-deep-elevated"
              >
                About
              </Link>
            </li>
            <li>
              <Link
                to="/contact"
                className="block rounded-lg px-4 py-3 hover:bg-deep-elevated"
              >
                Contact
              </Link>
            </li>
            {userInfo ? (
              <>
                <li className="px-4 py-2">
                  <p className="mb-2 text-xs uppercase tracking-wide text-deep-muted">
                    Notifications
                  </p>
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-deep-border">
                    {notifications.length === 0 ? (
                      <p className="p-3 text-sm text-deep-muted">
                        No approval updates yet.
                      </p>
                    ) : (
                      notifications.map((note) => (
                        <div
                          key={note._id}
                          className="border-b border-deep-border/80 p-3 last:border-b-0"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm text-slate-300">
                              Request for{" "}
                              <span className="font-semibold">
                                {note.itemName || "item"}
                              </span>
                              :
                              <span
                                className={`ml-1 font-bold ${note.status === "approved" ? "text-emerald-600" : "text-red-600"}`}
                              >
                                {note.status}
                              </span>
                            </p>
                            <button
                              onClick={() => dismissNotification(note)}
                              className="rounded-md border border-deep-border bg-deep-surface px-2 py-1 text-xs text-slate-400 transition hover:bg-deep-elevated"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </li>

                <Link
                  to="/profile"
                  className="flex items-center gap-3 rounded-lg bg-deep-surface px-4 py-3 transition-colors hover:bg-deep-elevated"
                >
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-accent font-bold text-white">
                    {userInfo.profilePic ? (
                      <img
                        src={userInfo.profilePic}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      userInfo.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-100">
                      {userInfo.name}
                    </span>
                    <span className="text-xs text-deep-muted">
                      {userInfo.email}
                    </span>
                  </div>
                </Link>

                <li>
                  <button
                    onClick={handleLogout}
                    className="w-full rounded-lg px-4 py-3 text-left font-semibold text-red-400 hover:bg-red-950/40"
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <li className="mt-2">
                <Link
                  to="/login"
                  className="block w-full rounded-xl bg-gradient-accent px-6 py-3 text-center font-semibold text-white shadow-lg shadow-blue-900/40"
                >
                  Login / Register
                </Link>
              </li>
            )}
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
