import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LoginModal from './components/LoginModal';
import Home from './pages/Home';
import Admin from './pages/Admin';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import CustomCake from './pages/CustomCake';
import { useAuth } from './context/AuthContext';
import { db, collection, addDoc, serverTimestamp } from './firebase';

// Placeholder components for other pages
const Feedback = () => <div className="p-20 text-center">Trang đánh giá đang phát triển...</div>;

const PageTracker = () => {
  const location = useLocation();

  useEffect(() => {
    const trackPageView = async () => {
      try {
        // Don't track admin routes
        if (location.pathname.startsWith('/admin')) return;
        
        await addDoc(collection(db, 'pageViews'), {
          path: location.pathname,
          timestamp: serverTimestamp(),
          userAgent: navigator.userAgent
        });
      } catch (error) {
        console.error("Error tracking page view:", error);
      }
    };

    // Use a small delay to avoid tracking rapid redirects
    const timer = setTimeout(trackPageView, 1000);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return null;
};

const AppContent = () => {
  const { isLoginModalOpen, setLoginModalOpen } = useAuth();
  
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <PageTracker />
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/custom-cake" element={<CustomCake />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
      <Footer />
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setLoginModalOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <AppContent />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}
