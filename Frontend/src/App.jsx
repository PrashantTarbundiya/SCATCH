import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';

import Admin from './pages/Admin';
import Cart from './pages/Cart';
import CreateProduct from './pages/CreateProduct';
import LoginPage from './pages/login'; 
import OwnerLoginPage from './pages/OwnerLogin'; 
import RegisterPage from './pages/register';
import ShopPage from './pages/Shop';
import OwnerProtectedRoute from './components/OwnerProtectedRoute'; // Import OwnerProtectedRoute

import Header from './components/Header';
// import Footer from './components/Footer';

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

          {/* Protected Owner Routes */}
          <Route element={<OwnerProtectedRoute />}>
            <Route path="/admin" element={<Admin />} />
            <Route path="/create-product" element={<CreateProduct />} />
            <Route path="/admin/edit-product/:productId" element={<CreateProduct />} />
          </Route>
        </Routes>
      </main>
      {/* <Footer /> */}
    </BrowserRouter>
  );
}

export default App;
