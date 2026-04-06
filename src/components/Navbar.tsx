import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, User, Search, Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { auth } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar: React.FC = () => {
  const { user, isAdmin, setLoginModalOpen } = useAuth();
  const { totalItems } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => auth.signOut();

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-orange-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-serif font-bold text-orange-800 tracking-tight">
              Tiệm Bánh Ngọt
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/products" className="text-gray-600 hover:text-orange-600 font-medium transition-colors">Sản phẩm</Link>
            <Link to="/custom-cake" className="text-gray-600 hover:text-orange-600 font-medium transition-colors">Bánh theo yêu cầu</Link>
            <Link to="/feedback" className="text-gray-600 hover:text-orange-600 font-medium transition-colors">Đánh giá</Link>
          </div>

          {/* Icons */}
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-600 hover:bg-orange-50 rounded-full transition-colors">
              <Search size={20} />
            </button>
            
            <Link to="/cart" className="p-2 text-gray-600 hover:bg-orange-50 rounded-full transition-colors relative">
              <ShoppingCart size={20} />
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 bg-orange-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ring-2 ring-white">
                  {totalItems}
                </span>
              )}
            </Link>

            {user ? (
              <div className="relative group">
                <button className="flex items-center space-x-2 p-1 hover:bg-orange-50 rounded-full transition-colors">
                  <img 
                    src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || user.email}`} 
                    alt="Avatar" 
                    className="w-8 h-8 rounded-full border border-orange-200"
                  />
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white border border-orange-100 rounded-xl shadow-xl py-2 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all transform origin-top-right scale-95 group-hover:scale-100">
                  <div className="px-4 py-2 border-b border-orange-50 mb-1">
                    <p className="text-sm font-bold text-gray-900 truncate">{user.displayName || 'Người dùng'}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50">Tài khoản</Link>
                  <Link to="/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50">Đơn hàng của tôi</Link>
                  {isAdmin && (
                    <Link to="/admin" className="block px-4 py-2 text-sm text-orange-600 font-bold hover:bg-orange-50">Quản trị viên</Link>
                  )}
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                  >
                    <LogOut size={16} />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setLoginModalOpen(true)}
                className="hidden sm:flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-full hover:bg-orange-700 transition-colors font-medium text-sm"
              >
                <User size={18} />
                <span>Đăng nhập</span>
              </button>
            )}

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 text-gray-600 hover:bg-orange-50 rounded-full"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-orange-50 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-1">
              <Link to="/products" className="block px-3 py-4 text-base font-medium text-gray-700 border-b border-orange-50">Sản phẩm</Link>
              <Link to="/custom-cake" className="block px-3 py-4 text-base font-medium text-gray-700 border-b border-orange-50">Bánh theo yêu cầu</Link>
              <Link to="/feedback" className="block px-3 py-4 text-base font-medium text-gray-700 border-b border-orange-50">Đánh giá</Link>
              {!user && (
                <button 
                  onClick={() => { setLoginModalOpen(true); setIsMenuOpen(false); }}
                  className="w-full mt-4 bg-orange-600 text-white px-4 py-3 rounded-xl font-bold"
                >
                  Đăng nhập ngay
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
