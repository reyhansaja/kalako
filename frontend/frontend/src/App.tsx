import { Navigate, Route, Routes, useParams } from "react-router-dom";
import HomePage from "./app/page";
import LandingPageSection from "./app/landingpage/page";
import AboutPage from "./app/about/page";
import CoreValuesPage from "./app/core-values/page";
import FeaturesPage from "./app/fitur/page";
import DashboardPage from "./app/dashboard/page";
import ReportPage from "./app/laporan/page";
import LoginPage from "./app/login/page";
import RootLoginPage from "./app/root-login/page";
import RegisterPage from "./app/register/page";
import TransactionsPage from "./app/transaksi/page";
import TransactionHistoryPage from "./app/transaksi/histori/page";
import StockRetailPage from "./app/stok-retail/page";
import SuspendedPage from "./app/suspended/page";
import PaymentPage from "./app/payments/page";
import AutoLoginPage from "./app/auto-login/page";
import NotFoundPage from "./app/not/page";
import AdminDashboardPage from "./app/admin/page";
import AdminLoginPage from "./app/admin/login/page";
import AdminPaymentsPage from "./app/admin/payments/page";
import ForgotPasswordPage from "./app/forgot-password/page";

function TenantIndexRedirect() {
  const { tenant } = useParams();
  if (!tenant) return <Navigate to="/not" replace />;
  return <Navigate to={`/${tenant}/login`} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/landingpage" element={<LandingPageSection />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/core-values" element={<CoreValuesPage />} />
      <Route path="/fitur" element={<FeaturesPage />} />
      <Route path="/root-login" element={<RootLoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/not" element={<NotFoundPage />} />
      <Route path="/admin" element={<AdminDashboardPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin/payments" element={<AdminPaymentsPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      <Route path="/:tenant" element={<TenantIndexRedirect />} />
      <Route path="/:tenant/login" element={<LoginPage />} />
      <Route path="/:tenant/dashboard" element={<DashboardPage />} />
      <Route path="/:tenant/laporan" element={<ReportPage />} />
      <Route path="/:tenant/transaksi" element={<TransactionsPage />} />
      <Route path="/:tenant/transaksi/histori" element={<TransactionHistoryPage />} />
      <Route path="/:tenant/stok-retail" element={<StockRetailPage />} />
      <Route path="/:tenant/suspended" element={<SuspendedPage />} />
      <Route path="/:tenant/payments" element={<PaymentPage />} />
      <Route path="/:tenant/auto-login" element={<AutoLoginPage />} />

      <Route path="*" element={<Navigate to="/not" replace />} />
    </Routes>
  );
}
