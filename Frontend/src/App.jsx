import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';

import Admin from './pages/Admin';
import AdminSalesPage from './pages/AdminSalesPage'; // Import the new sales page
import Cart from './pages/Cart';
import CreateProduct from './pages/CreateProduct';
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

function App() {
  return (
    <BrowserRouter>
      <Header />
      <main className="py-8 w-full"> 
        <Routes>
          <Route path="/" element={<RegisterPage />} />
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
            <Route path="/admin/sales" element={<AdminSalesPage />} /> {/* New route for sales page */}
            <Route path="/create-product" element={<CreateProduct />} />
            <Route path="/admin/edit-product/:productId" element={<CreateProduct />} />
          </Route>
          
          {/* Catch-all route for 404 Not Found */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
