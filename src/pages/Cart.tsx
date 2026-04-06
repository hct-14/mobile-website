import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const Cart: React.FC = () => {
  const { items, removeFromCart, updateQuantity, toggleSelection, totalPrice, totalItems } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="mb-6 flex justify-center">
          <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center">
            <ShoppingBag size={48} className="text-orange-200" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Giỏ hàng của bạn đang trống</h2>
        <p className="text-gray-500 mb-8">Hãy khám phá những chiếc bánh tuyệt vời của chúng tôi!</p>
        <Link 
          to="/products" 
          className="inline-block bg-orange-600 text-white px-8 py-3 rounded-full font-bold hover:bg-orange-700 transition-colors"
        >
          Tiếp tục mua sắm
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-serif font-bold text-gray-900 mb-8">Giỏ hàng của bạn ({totalItems})</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-6">
          {items.map((item, index) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              key={`${item.productId}-${JSON.stringify(item.variant)}`}
              className="flex flex-col sm:flex-row gap-6 bg-white p-6 rounded-3xl border border-orange-100 shadow-sm hover:shadow-md transition-shadow relative group"
            >
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  checked={item.selected}
                  onChange={() => toggleSelection(item.productId, item.variant)}
                  className="w-5 h-5 rounded border-orange-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                />
              </div>

              <div className="w-full sm:w-32 h-32 rounded-2xl overflow-hidden flex-shrink-0">
                <img 
                  src={item.product.images[0]} 
                  alt={item.product.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              
              <div className="flex-grow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-gray-900">{item.product.name}</h3>
                  <button 
                    onClick={() => removeFromCart(item.productId, item.variant)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
                
                <div className="text-sm text-gray-500 mb-4 space-y-1">
                  <p>Kích thước: {item.variant?.size}</p>
                  <p>Hương vị: {item.variant?.flavor}</p>
                  {item.variant?.accessories && item.variant.accessories.length > 0 && (
                    <p>Phụ kiện: {item.variant.accessories.join(', ')}</p>
                  )}
                  {item.message && <p className="italic">Ghi chú: "{item.message}"</p>}
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3 bg-orange-50 rounded-full px-3 py-1">
                    <button 
                      onClick={() => updateQuantity(item.productId, item.variant, Math.max(1, item.quantity - 1))}
                      className="w-8 h-8 flex items-center justify-center text-orange-600 hover:bg-white rounded-full transition-colors"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="font-bold w-4 text-center">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.productId, item.variant, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center text-orange-600 hover:bg-white rounded-full transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-orange-600">
                      {((item.price || item.product.salePrice || item.product.price) * item.quantity).toLocaleString('vi-VN')}đ
                    </p>
                    <p className="text-xs text-gray-400">
                      {(item.price || item.product.salePrice || item.product.price).toLocaleString('vi-VN')}đ / cái
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-white p-8 rounded-3xl border border-orange-100 shadow-sm sticky top-24">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Tóm tắt đơn hàng</h2>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-gray-600">
                <span>Tạm tính</span>
                <span>{totalPrice.toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Phí vận chuyển</span>
                <span className="text-green-600 font-medium">Miễn phí</span>
              </div>
              <div className="border-t border-orange-100 pt-4 mt-4 flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">Tổng cộng</span>
                <span className="text-2xl font-bold text-orange-600">{totalPrice.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>
            
            <button 
              onClick={() => navigate('/checkout')}
              disabled={totalItems === 0}
              className={`w-full bg-orange-600 text-white py-4 rounded-full font-bold text-lg transition-all shadow-lg flex items-center justify-center space-x-2 ${totalItems === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-orange-700 hover:shadow-orange-200'}`}
            >
              <span>Thanh toán ngay</span>
              <ArrowRight size={20} />
            </button>
            
            <div className="mt-6 space-y-4">
              <div className="flex items-center space-x-3 text-sm text-gray-500">
                <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                  <ShoppingBag size={16} />
                </div>
                <span>Giao hàng nhanh trong 2h</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-500">
                <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                  <Plus size={16} />
                </div>
                <span>Tặng kèm nến và dao cắt bánh</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
