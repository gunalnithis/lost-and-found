import { useMemo, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { PanelLeft, Search, BellDot } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Items from './pages/Items';
import LostContactRequests from './pages/LostContactRequests';
import FoundContactRequests from './pages/FoundContactRequests';
import Feedbacks from './pages/Feedbacks';
import AdvertisementRequests from './pages/AdvertisementRequests';

const routeTitles = {
  '/': 'Overview Dashboard',
  '/users': 'User Management',
  '/items': 'Item Moderation',
  '/contacts/lost': 'Lost Item Requests',
  '/contacts/found': 'Found Item Requests',
  '/advertisements/requests': 'Advertisement Requests',
  '/feedbacks': 'Feedback Inbox',
};

const AdminShell = () => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const pageTitle = useMemo(
    () => routeTitles[location.pathname] || 'Overview Dashboard',
    [location.pathname],
  );

  const today = useMemo(
    () => new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    [],
  );

  return (
    <div className="admin-ui min-h-screen text-slate-100">
      <div className="admin-bg-orb admin-bg-orb-one" aria-hidden="true" />
      <div className="admin-bg-orb admin-bg-orb-two" aria-hidden="true" />

      <div className="relative flex min-h-screen">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <header className="admin-topbar mb-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsSidebarOpen((prev) => !prev)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700/60 bg-slate-900/70 text-slate-100 md:hidden"
                aria-label="Toggle sidebar"
              >
                <PanelLeft size={18} />
              </button>

              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">Admin Workspace</p>
                <h1 className="text-lg font-semibold text-slate-100 md:text-2xl">{pageTitle}</h1>
              </div>
            </div>

            <div className="hidden items-center gap-3 md:flex">
              <div className="admin-search-box">
                <Search size={16} className="text-cyan-300/80" />
                <span className="text-sm text-slate-400">{today}</span>
              </div>
              <button type="button" className="admin-icon-btn" aria-label="Notifications">
                <BellDot size={16} />
              </button>
            </div>
          </header>

          <section className="max-w-7xl">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/users" element={<Users />} />
              <Route path="/items" element={<Items />} />
              <Route path="/contacts/lost" element={<LostContactRequests />} />
              <Route path="/contacts/found" element={<FoundContactRequests />} />
              <Route path="/advertisements/requests" element={<AdvertisementRequests />} />
              <Route path="/feedbacks" element={<Feedbacks />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </section>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AdminShell />
    </Router>
  );
}

export default App;
