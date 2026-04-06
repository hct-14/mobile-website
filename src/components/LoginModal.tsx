import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Lock, Chrome, AlertCircle } from 'lucide-react';
import { auth, googleProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from '../firebase';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      onClose();
    } catch (error) {
      console.error("Login failed:", error);
      setError('Đăng nhập Google thất bại.');
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onClose();
      setEmail('');
      setPassword('');
    } catch (err: any) {
      console.error("Auth error:", err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Email hoặc mật khẩu không chính xác.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Email này đã được sử dụng.');
      } else if (err.code === 'auth/weak-password') {
        setError('Mật khẩu phải có ít nhất 6 ký tự.');
      } else {
        setError('Đã có lỗi xảy ra. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] overflow-y-auto bg-black/60 backdrop-blur-md">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md transform overflow-hidden rounded-[2.5rem] bg-white p-6 md:p-10 text-left align-middle shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all relative"
            >
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-2 hover:bg-orange-50 rounded-full transition-colors text-gray-400 hover:text-orange-600"
              >
                <X size={24} />
              </button>

              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-2xl mb-4 text-orange-600">
                  <User size={32} />
                </div>
                <h2 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 mb-2">
                  {isRegister ? 'Tạo tài khoản' : 'Chào mừng trở lại'}
                </h2>
                <p className="text-gray-500 text-sm md:text-base">
                  {isRegister ? 'Tham gia cùng chúng tôi để nhận ưu đãi' : 'Đăng nhập để tiếp tục mua sắm'}
                </p>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="mb-6 p-4 bg-red-50 text-red-700 rounded-2xl flex items-center gap-3 text-sm border border-red-100"
                >
                  <AlertCircle size={18} className="shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700 ml-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      required
                      type="email" 
                      placeholder="example@gmail.com"
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-gray-900"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700 ml-1">Mật khẩu</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      required
                      type="password" 
                      placeholder="••••••••"
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-gray-900"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-orange-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-orange-700 transition-all shadow-xl shadow-orange-100 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (isRegister ? 'Đăng ký ngay' : 'Đăng nhập')}
                </button>
              </form>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-400 font-medium">Hoặc tiếp tục với</span>
                </div>
              </div>

              <button 
                onClick={handleGoogleLogin}
                className="w-full bg-white border border-gray-200 text-gray-700 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-gray-50 transition-all active:scale-95"
              >
                <Chrome size={20} className="text-blue-600" />
                <span>Google</span>
              </button>

              <p className="mt-8 text-center text-gray-500 text-sm">
                {isRegister ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}
                <button 
                  onClick={() => setIsRegister(!isRegister)}
                  className="ml-2 text-orange-600 font-bold hover:underline"
                >
                  {isRegister ? 'Đăng nhập ngay' : 'Đăng ký ngay'}
                </button>
              </p>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LoginModal;
