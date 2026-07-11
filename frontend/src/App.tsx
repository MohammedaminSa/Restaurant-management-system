import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import NotFound from './pages/NotFound.tsx';
import QRScanPage from './pages/customer/QRScanPage.tsx';
import MenuPage from './pages/customer/MenuPage.tsx';
import MenuItemDetailPage from './pages/customer/MenuItemDetailPage.tsx';
import CheckoutPage from './pages/customer/CheckoutPage.tsx';
import OrderTrackingPage from './pages/customer/OrderTrackingPage.tsx';
import LoginPage from './pages/auth/LoginPage.tsx';
import KitchenDashboard from './pages/kitchen/KitchenDashboard.tsx';
import WaiterDashboard from './pages/waiter/WaiterDashboard.tsx';
import CashierDashboard from './pages/cashier/CashierDashboard.tsx';
import MenuManagementPage from './pages/admin/MenuManagementPage.tsx';
import TableManagementPage from './pages/admin/TableManagementPage.tsx';
import UserManagementPage from './pages/admin/UserManagementPage.tsx';

function App() {
  return (
    <Routes>
      {/* Public Routes - Customer Flow */}
      <Route path="/" element={<Navigate to="/scan/demo-qr-code" replace />} />
      <Route path="/scan/:qrCode" element={<QRScanPage />} />
      
      <Route element={<Layout />}>
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/menu/:itemId" element={<MenuItemDetailPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/orders" element={<OrderTrackingPage />} />
      </Route>

      {/* Auth Routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Staff Routes */}
      <Route element={<Layout />}>
        <Route
          path="/kitchen"
          element={
            <ProtectedRoute allowedRoles={['kitchen_staff', 'super_admin']}>
              <KitchenDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/waiter"
          element={
            <ProtectedRoute allowedRoles={['waiter', 'super_admin']}>
              <WaiterDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cashier"
          element={
            <ProtectedRoute allowedRoles={['cashier', 'super_admin']}>
              <CashierDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/menu"
          element={
            <ProtectedRoute allowedRoles={['restaurant_admin', 'super_admin']}>
              <MenuManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/tables"
          element={
            <ProtectedRoute allowedRoles={['restaurant_admin', 'super_admin']}>
              <TableManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['restaurant_admin', 'super_admin']}>
              <UserManagementPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* 404 Not Found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
