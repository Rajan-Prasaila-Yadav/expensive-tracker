import { BrowserRouter, Route, Routes } from "react-router-dom";
import { DefaultProviders } from "./components/providers/default.tsx";
import { ProtectedRoute, PublicOnlyRoute } from "./components/protected-route.tsx";
import AuthCallback from "./pages/auth/Callback.tsx";
import NotFound from "./pages/NotFound.tsx";
import SignIn from "./pages/auth/SignIn.tsx";
import SignUp from "./pages/auth/SignUp.tsx";
import ForgotPassword from "./pages/auth/ForgotPassword.tsx";
import ResetPassword from "./pages/auth/ResetPassword.tsx";
import VerifyOTP from "./pages/auth/VerifyOTP.tsx";
import HomePage from "./pages/home/page.tsx";
import TransactionsPage from "./pages/transactions/page.tsx";
import IncomePage from "./pages/income/page.tsx";
import ExpensesPage from "./pages/expenses/page.tsx";
import TransfersPage from "./pages/transfers/page.tsx";
import BudgetPage from "./pages/budget/page.tsx";
import CategoriesPage from "./pages/categories/page.tsx";
import AnalyticsPage from "./pages/analytics/page.tsx";
import ReportsPage from "./pages/reports/page.tsx";
import ProfilePage from "./pages/profile/page.tsx";
import SettingsPage from "./pages/settings/page.tsx";
import AuditLogsPage from "./pages/audit-logs/page.tsx";
import NotificationsPage from "./pages/notifications/page.tsx";

export default function App() {
  return (
    <DefaultProviders>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes (Redirect to / if already logged in) */}
          <Route path="/sign-in" element={<PublicOnlyRoute><SignIn /></PublicOnlyRoute>} />
          <Route path="/sign-up" element={<PublicOnlyRoute><SignUp /></PublicOnlyRoute>} />
          <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPassword /></PublicOnlyRoute>} />
          <Route path="/reset-password" element={<PublicOnlyRoute><ResetPassword /></PublicOnlyRoute>} />
          <Route path="/verify-otp" element={<PublicOnlyRoute><VerifyOTP /></PublicOnlyRoute>} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Protected App Routes (Redirect to /sign-in if not authenticated) */}
          <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/transactions" element={<ProtectedRoute><TransactionsPage /></ProtectedRoute>} />
          <Route path="/income" element={<ProtectedRoute><IncomePage /></ProtectedRoute>} />
          <Route path="/expenses" element={<ProtectedRoute><ExpensesPage /></ProtectedRoute>} />
          <Route path="/transfers" element={<ProtectedRoute><TransfersPage /></ProtectedRoute>} />
          <Route path="/budget" element={<ProtectedRoute><BudgetPage /></ProtectedRoute>} />
          <Route path="/categories" element={<ProtectedRoute><CategoriesPage /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/audit-logs" element={<ProtectedRoute><AuditLogsPage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </DefaultProviders>
  );
}
