import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';

// Public Pages (designs pending)
import ReviewPage from './pages/public/ReviewPage';
import ThankYouPage from './pages/public/ThankYouPage';

// Admin Pages
import LoginPage    from './pages/admin/LoginPage';
import DashboardPage from './pages/admin/DashboardPage';
import ReviewsPage  from './pages/admin/ReviewsPage';
import ResolvedPage from './pages/admin/ResolvedPage';
import SettingsPage from './pages/admin/SettingsPage';

function App() {
  return (
    <Routes>
      {/* ─── Root redirect ──────────────────────────────── */}
      <Route path="/" element={<Navigate to="/admin/login" replace />} />

      {/* ─── Public Routes (designs pending) ───────────── */}
      <Route element={<PublicLayout />}>
        <Route path="/review"            element={<ReviewPage />} />
        <Route path="/review/:serviceId" element={<ReviewPage />} />
        <Route path="/thank-you"         element={<ThankYouPage />} />
      </Route>

      {/* ─── Auth ───────────────────────────────────────── */}
      <Route path="/admin/login" element={<LoginPage />} />

      {/* ─── Admin / Dashboard ──────────────────────────── */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index                element={<Navigate to="/admin/overview" replace />} />
        <Route path="overview"      element={<DashboardPage />} />
        <Route path="reviews"       element={<ReviewsPage />} />
        <Route path="resolved"      element={<ResolvedPage />} />
        <Route path="settings"      element={<SettingsPage />} />
      </Route>

      {/* ─── Catch-all ──────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/admin/login" replace />} />
    </Routes>
  );
}

export default App;
