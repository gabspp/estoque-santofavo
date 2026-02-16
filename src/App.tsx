import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import ProductList from "@/pages/products/ProductList";
import ProductForm from "@/pages/products/ProductForm";
import EntryList from "@/pages/entries/EntryList";
import EntryForm from "@/pages/entries/EntryForm";
import CountingDashboard from "@/pages/counting/CountingDashboard";
import CountingArea from "@/pages/counting/CountingArea";
import ApprovalList from "@/pages/approval/ApprovalList";
import ApprovalDetail from "@/pages/approval/ApprovalDetail";
import WeeklyProcessing from "@/pages/reports/WeeklyProcessing";
import ShoppingList from "@/pages/reports/ShoppingList";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import Layout from "@/components/layout/Layout";
import UserManagement from "@/pages/settings/UserManagement";

import { ToastProvider } from "@/components/ui/use-toast";

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          {/* Main App Routes */}
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />

                {/* Public Access (Employees & Admins) */}
                <Route path="/produtos" element={<ProductList />} />
                <Route path="/entradas" element={<EntryList />} />
                <Route path="/entradas/nova" element={<EntryForm />} />
                <Route path="/contagem" element={<CountingDashboard />} />
                <Route path="/contagem/:id" element={<CountingArea />} />
                <Route path="/relatorios/compras" element={<ShoppingList />} />

                {/* Admin Only Routes */}
                <Route element={<AdminRoute />}>
                  <Route path="/produtos/novo" element={<ProductForm />} />
                  <Route path="/produtos/:id" element={<ProductForm />} />
                  <Route path="/aprovacao" element={<ApprovalList />} />
                  <Route path="/aprovacao/:id" element={<ApprovalDetail />} />
                  <Route path="/processamento" element={<WeeklyProcessing />} />
                  <Route path="/usuarios" element={<UserManagement />} />
                </Route>

              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
