import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Suspense, lazy } from 'react';


// Lazy load components
const Home = lazy(() => import('./pages/Home'));
const Admin = lazy(() => import('./pages/Admin'));
const AdminSalesPage = lazy(() => import('./pages/AdminSalesPage'));
const Cart = lazy(() => import('./pages/Cart'));
const CreateProduct = lazy(() => import('./pages/CreateProduct'));
const ManageCoupons = lazy(() => import('./pages/ManageCoupons'));
const CreateCoupon = lazy(() => import('./pages/CreateCoupon'));
const EditCoupon = lazy(() => import('./pages/EditCoupon'));
const AdminOrdersPage = lazy(() => import('./pages/AdminOrdersPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));

const LoginPage = lazy(() => import('./pages/login'));
const OwnerLoginPage = lazy(() => import('./pages/OwnerLogin'));
const RegisterPage = lazy(() => import('./pages/register'));
const ShopPage = lazy(() => import('./pages/Shop'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const ProfilePage = lazy(() => import('./pages/Profile'));
const EditProfilePage = lazy(() => import('./pages/EditProfile'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const ProductReviewPage = lazy(() => import('./pages/ProductReviewPage'));
const OwnerProtectedRoute = lazy(() => import('./components/OwnerProtectedRoute'));
const UserProtectedRoute = lazy(() => import('./components/UserProtectedRoute'));

import Header from './components/Header';
import AIAssistantButton from './components/AIAssistantButton';
import { useUser } from './context/UserContext';

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

function AppContent() {
  const location = useLocation();
  const { isAuthenticated } = useUser();

  // Check if current route is an admin route or home page
  const isAdminRoute = location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/create-product');
  const isHomePage = location.pathname === '/';
  const isShopPage = location.pathname === '/shop';

  return (
    <>
      {/* Conditionally render Header - exclude from admin routes */}
      {!isAdminRoute && <Header />}

      <main className={isAdminRoute ? "w-full" : "min-h-screen w-full bg-background text-foreground"}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/owner-login" element={<OwnerLoginPage />} />

            {/* Protected User Routes */}
            <Route element={<UserProtectedRoute />}>
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/profile/edit" element={<EditProfilePage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/product/:productId" element={<ProductDetailPage />} />
              <Route path="/product/:productId/reviews" element={<ProductReviewPage />} />
            </Route>

            {/* Protected Owner Routes */}
            <Route element={<OwnerProtectedRoute />}>
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/sales" element={<AdminSalesPage />} />
              <Route path="/create-product" element={<CreateProduct />} />
              <Route path="/admin/edit-product/:productId" element={<CreateProduct />} />
              <Route path="/admin/coupons" element={<ManageCoupons />} />
              <Route path="/admin/create-coupon" element={<CreateCoupon />} />
              <Route path="/admin/edit-coupon/:couponId" element={<EditCoupon />} />
              <Route path="/admin/orders" element={<AdminOrdersPage />} />

            </Route>

            {/* Catch-all route for 404 Not Found */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>

      {/* AI Assistant - show only on shop page when user is logged in */}
      {isShopPage && isAuthenticated && <AIAssistantButton />}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;



