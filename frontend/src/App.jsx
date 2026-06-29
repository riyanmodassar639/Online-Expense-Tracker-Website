import { Routes, Route, Navigate } from "react-router-dom";

import Home from "./client/pages/Home";
import Login from "./client/pages/Login";
import Register from "./client/pages/Register";

// Admin
import AdminLanding from "./admin/pages/AdminLanding";
import AdminLayout from "./admin/layout/AdminLayout";
import AdminDashboard from "./admin/pages/AdminDashboard";
import AdminUsers from "./admin/pages/AdminUsers";
import AdminPayments from "./admin/pages/AdminPayments";
import RequireAdmin from "./admin/components/RequireAdmin";

// User
import UserLayout from "./client/layout/UserLayout";
import UserDashboard from "./client/pages/UserDashboard";
import UserProfile from "./client/pages/UserProfile";
import UserExpenses from "./client/pages/UserExpenses";
import RequireUser from "./client/components/RequireUser";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      {/* Auth */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Admin landing */}
      <Route path="/admin" element={<AdminLanding />} />

      {/* Admin protected */}
      <Route
        path="/admin/*"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="payments" element={<AdminPayments />} />
      </Route>

      {/* User protected */}
      <Route
        path="/user/*"
        element={
          <RequireUser>
            <UserLayout />
          </RequireUser>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<UserDashboard />} />
        <Route path="expenses" element={<UserExpenses />} />
        <Route path="profile" element={<UserProfile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
