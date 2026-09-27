import React, { Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppLayout } from './components/layout/AppLayout';

// Lightweight fallback loader
const PageFallback: React.FC = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 p-6">
    <div className="w-9 h-9 border-3 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin" />
    <span className="text-xs font-semibold text-slate-500 animate-pulse">লোড হচ্ছে...</span>
  </div>
);

// Lazy Loaded Auth Pages
const LoginPage = React.lazy(() =>
  import('./pages/auth/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const RegisterPage = React.lazy(() =>
  import('./pages/auth/RegisterPage').then((m) => ({ default: m.RegisterPage }))
);
const OtpVerifyPage = React.lazy(() =>
  import('./pages/auth/OtpVerifyPage').then((m) => ({ default: m.OtpVerifyPage }))
);
const BusinessSetupPage = React.lazy(() =>
  import('./pages/auth/BusinessSetupPage').then((m) => ({ default: m.BusinessSetupPage }))
);

// Lazy Loaded Main App Pages
const DashboardPage = React.lazy(() =>
  import('./pages/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const PosPage = React.lazy(() =>
  import('./pages/pos/PosPage').then((m) => ({ default: m.PosPage }))
);
const SalesListPage = React.lazy(() =>
  import('./pages/sales/SalesListPage').then((m) => ({ default: m.SalesListPage }))
);
const ProductsPage = React.lazy(() =>
  import('./pages/products/ProductsPage').then((m) => ({ default: m.ProductsPage }))
);
const OrdersPage = React.lazy(() =>
  import('./pages/orders/OrdersPage').then((m) => ({ default: m.OrdersPage }))
);
const IncompleteOrdersPage = React.lazy(() =>
  import('./pages/orders/IncompleteOrdersPage').then((m) => ({ default: m.IncompleteOrdersPage }))
);
const InventoryPage = React.lazy(() =>
  import('./pages/inventory/InventoryPage').then((m) => ({ default: m.InventoryPage }))
);
const CustomersPage = React.lazy(() =>
  import('./pages/customers/CustomersPage').then((m) => ({ default: m.CustomersPage }))
);
const SuppliersPage = React.lazy(() =>
  import('./pages/suppliers/SuppliersPage').then((m) => ({ default: m.SuppliersPage }))
);
const PurchasesPage = React.lazy(() =>
  import('./pages/purchases/PurchasesPage').then((m) => ({ default: m.PurchasesPage }))
);
const PaymentsPage = React.lazy(() =>
  import('./pages/payments/PaymentsPage').then((m) => ({ default: m.PaymentsPage }))
);
const DuePage = React.lazy(() =>
  import('./pages/due/DuePage').then((m) => ({ default: m.DuePage }))
);
const OnlineStorePage = React.lazy(() =>
  import('./pages/store/OnlineStorePage').then((m) => ({ default: m.OnlineStorePage }))
);
const LandingPagesPage = React.lazy(() =>
  import('./pages/landing/LandingPagesPage').then((m) => ({ default: m.LandingPagesPage }))
);
const CourierPage = React.lazy(() =>
  import('./pages/courier/CourierPage').then((m) => ({ default: m.CourierPage }))
);
const CustomerRiskPage = React.lazy(() =>
  import('./pages/risk/CustomerRiskPage').then((m) => ({ default: m.CustomerRiskPage }))
);
const ExpensesPage = React.lazy(() =>
  import('./pages/expenses/ExpensesPage').then((m) => ({ default: m.ExpensesPage }))
);
const ReportsPage = React.lazy(() =>
  import('./pages/reports/ReportsPage').then((m) => ({ default: m.ReportsPage }))
);
const SmsPage = React.lazy(() =>
  import('./pages/sms/SmsPage').then((m) => ({ default: m.SmsPage }))
);
const SubscriptionPage = React.lazy(() =>
  import('./pages/subscription/SubscriptionPage').then((m) => ({ default: m.SubscriptionPage }))
);
const SettingsPage = React.lazy(() =>
  import('./pages/settings/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);
const DebugSupabasePage = React.lazy(() =>
  import('./pages/settings/DebugSupabasePage').then((m) => ({ default: m.DebugSupabasePage }))
);
const StaffPage = React.lazy(() =>
  import('./pages/staff/StaffPage').then((m) => ({ default: m.StaffPage }))
);
const PersonalDashboardPage = React.lazy(() =>
  import('./pages/personal/PersonalDashboardPage').then((m) => ({ default: m.PersonalDashboardPage }))
);
const TelecomPage = React.lazy(() =>
  import('./pages/telecom/TelecomPage').then((m) => ({ default: m.TelecomPage }))
);
const InvoicesPage = React.lazy(() =>
  import('./pages/invoices/InvoicesPage').then((m) => ({ default: m.InvoicesPage }))
);
const ReturnsPage = React.lazy(() =>
  import('./pages/returns/ReturnsPage').then((m) => ({ default: m.ReturnsPage }))
);
const VoiceCallsPage = React.lazy(() =>
  import('./pages/voice/VoiceCallsPage').then((m) => ({ default: m.VoiceCallsPage }))
);
const BranchManagementPage = React.lazy(() =>
  import('./pages/branches/BranchManagementPage').then((m) => ({ default: m.BranchManagementPage }))
);

// Public Customer Views
const PublicStoreView = React.lazy(() =>
  import('./pages/public/PublicStoreView').then((m) => ({ default: m.PublicStoreView }))
);
const PublicLandingView = React.lazy(() =>
  import('./pages/public/PublicLandingView').then((m) => ({ default: m.PublicLandingView }))
);
const MarketplaceView = React.lazy(() =>
  import('./pages/public/MarketplaceView').then((m) => ({ default: m.MarketplaceView }))
);

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// Auth Route Guard (Redirect to dashboard if already logged in)
const AuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LanguageProvider>
          <ToastProvider>
            <HashRouter>
              <Suspense fallback={<PageFallback />}>
                <Routes>
                {/* Public Store & Landing Pages for Buyers */}
                <Route path="/store/:slug" element={<PublicStoreView />} />
                <Route path="/landing/:slug" element={<PublicLandingView />} />
                <Route path="/marketplace" element={<MarketplaceView />} />
                <Route path="/shopx-mall" element={<Navigate to="/marketplace" replace />} />
                <Route path="/shopx" element={<Navigate to="/marketplace" replace />} />
                <Route path="/mall" element={<Navigate to="/marketplace" replace />} />

                {/* Auth Routes */}
                <Route
                  path="/login"
                  element={
                    <AuthRoute>
                      <LoginPage />
                    </AuthRoute>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <AuthRoute>
                      <RegisterPage />
                    </AuthRoute>
                  }
                />
                <Route path="/verify-otp" element={<OtpVerifyPage />} />
                <Route path="/setup" element={<BusinessSetupPage />} />

                {/* Protected Business Dashboard Layout */}
                <Route
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/pos" element={<PosPage />} />
                  <Route path="/sales" element={<SalesListPage />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/orders" element={<OrdersPage />} />
                  <Route path="/orders/incomplete" element={<IncompleteOrdersPage />} />
                  <Route path="/incomplete-orders" element={<Navigate to="/orders/incomplete" replace />} />
                  <Route path="/invoices" element={<InvoicesPage />} />
                  <Route path="/returns" element={<ReturnsPage />} />
                  <Route path="/telecom" element={<TelecomPage />} />
                  <Route path="/personal" element={<PersonalDashboardPage />} />
                  <Route path="/inventory" element={<InventoryPage />} />
                  <Route path="/customers" element={<CustomersPage />} />
                  <Route path="/suppliers" element={<SuppliersPage />} />
                  <Route path="/purchases" element={<PurchasesPage />} />
                  <Route path="/payments" element={<PaymentsPage />} />
                  <Route path="/due" element={<DuePage />} />
                  <Route path="/voice-calls" element={<VoiceCallsPage />} />
                  <Route path="/branches" element={<BranchManagementPage />} />
                  <Route path="/branch-management" element={<Navigate to="/branches" replace />} />
                  <Route path="/online-store" element={<OnlineStorePage />} />
                  <Route path="/landing-pages" element={<LandingPagesPage />} />
                  <Route path="/courier" element={<CourierPage />} />
                  <Route path="/risk-analysis" element={<CustomerRiskPage />} />
                  <Route path="/risk" element={<Navigate to="/risk-analysis" replace />} />
                  <Route path="/expenses" element={<ExpensesPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/sms" element={<SmsPage />} />
                  <Route path="/subscription" element={<SubscriptionPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/settings/debug-supabase" element={<DebugSupabasePage />} />
                  <Route path="/debug-supabase" element={<Navigate to="/settings/debug-supabase" replace />} />
                  <Route path="/staff" element={<StaffPage />} />
                </Route>

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </HashRouter>
        </ToastProvider>
      </LanguageProvider>
    </AuthProvider>
  </ThemeProvider>
  );
}
