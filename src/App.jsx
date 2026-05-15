import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';

// Public Pages
import ReviewPage from './pages/public/ReviewPage';
import ThankYouPage from './pages/public/ThankYouPage';
import ReviewRedirect from './pages/public/ReviewRedirect';
import PaymentSuccess from './pages/public/PaymentSuccess';

// Admin Auth Pages
import SignIn         from './layouts/SignIn';
import SignUp         from './layouts/SignUp';
import ForgotPassword from './layouts/ForgotPassword';

// Admin Pages
import DashboardPage from './pages/admin/DashboardPage';
import ReviewsPage  from './pages/admin/ReviewsPage';
import ResolvedPage from './pages/admin/ResolvedPage';
import SettingsPage from './pages/admin/SettingsPage';


function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        {/* ─── Root redirect ──────────────────────────────── */}
        <Route path="/" element={<Navigate to="/signin" replace />} />

        {/* ─── Public Routes (designs pending) ───────────── */}
        <Route element={<PublicLayout />}>
          <Route path="/review"            element={<ReviewPage />} />
          <Route path="/review/:serviceId" element={<ReviewPage />} />
          <Route path="/thank-you"         element={<ThankYouPage />} />
          <Route path="/r/:token"          element={<ReviewRedirect />} />
          <Route path="/payment-success"   element={<PaymentSuccess />} />
        </Route>

        {/* ─── Auth ───────────────────────────────────────── */}
        <Route path="/admin/login" element={<Navigate to="/signin" replace />} />
        <Route path="/signin"      element={<SignIn />} />
        <Route path="/signup"      element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* ─── Admin / Dashboard ──────────────────────────── */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index                element={<Navigate to="/admin/overview" replace />} />
          <Route path="overview"      element={<DashboardPage />} />
          <Route path="reviews"       element={<ReviewsPage />} />
          <Route path="resolved"      element={<ResolvedPage />} />

          <Route path="settings"      element={<SettingsPage />} />
        </Route>

        {/* ─── Catch-all ──────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/signin" replace />} />
      </Routes>
    </>
  );
}

export default App;
