import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import './App.css';

import Admin from './pages/Admin';
import AdminSalesPage from './pages/AdminSalesPage'; // Import the new sales page
import Cart from './pages/Cart';
import CreateProduct from './pages/CreateProduct';
import AdminCouponsPage from './pages/AdminCouponsPage'; // Import Admin Coupons Page
import LoginPage from './pages/login';
import OwnerLoginPage from './pages/OwnerLogin';
import RegisterPage from './pages/register';
import ShopPage from './pages/Shop';
import NotFoundPage from './pages/NotFoundPage'; // Import NotFoundPage
import ProfilePage from './pages/Profile'; // Import ProfilePage
import EditProfilePage from './pages/EditProfile'; // Import EditProfilePage
import ContactPage from './pages/ContactPage'; // Import ContactPage
import ProductDetailPage from './pages/ProductDetailPage'; // Import ProductDetailPage
import OwnerProtectedRoute from './components/OwnerProtectedRoute'; // Import OwnerProtectedRoute

import Header from './components/Header';
import Footer from './components/Footer'; // Import Footer

function AppContent() {
  const location = useLocation();
  
  // Check if current route is an admin route
  const isAdminRoute = location.pathname.startsWith('/admin') ||
                      location.pathname.startsWith('/create-product');

  return (
    <>
      {/* Conditionally render Header - exclude from admin routes */}
      {!isAdminRoute && <Header />}
      
      <main className={isAdminRoute ? "w-full" : "py-8 w-full"}>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/owner-login" element={<OwnerLoginPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/edit" element={<EditProfilePage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/product/:productId" element={<ProductDetailPage />} />

          {/* Protected Owner Routes */}
          <Route element={<OwnerProtectedRoute />}>
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/sales" element={<AdminSalesPage />} />
            <Route path="/create-product" element={<CreateProduct />} />
            <Route path="/admin/edit-product/:productId" element={<CreateProduct />} />
            <Route path="/admin/coupons" element={<AdminCouponsPage />} />
          </Route>
          
          {/* Catch-all route for 404 Not Found */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      
      {/* Conditionally render Footer - exclude from admin routes */}
      {!isAdminRoute && <Footer />}
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
