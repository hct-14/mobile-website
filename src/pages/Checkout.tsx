import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { db, collection, addDoc, query, where, getDocs, serverTimestamp } from '../firebase';
import { CreditCard, Truck, MapPin, Phone, User, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { Coupon } from '../types';

const Checkout: React.FC = () => {
  const { selectedItems, totalPrice, clearCart, updateMessage } = useCart();
  const { user, setLoginModalOpen } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: user?.displayName || '',
    phone: '',
    address: '',
    paymentMethod: 'COD' as 'COD' | 'MOMO' | 'VNPAY',
    deliveryTime: '',
    note: ''
  });

  const handlePaymentMethodChange = (method: 'COD' | 'MOMO' | 'VNPAY') => {
    if (method === 'MOMO' || method === 'VNPAY') {
      alert('Tính năng thanh toán qua ' + method + ' đang được phát triển. Vui lòng chọn Tiền mặt (COD).');
      return;
    }
    setFormData({...formData, paymentMethod: method});
  };
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  const handleApplyCoupon = async () => {
    setCouponError('');
    const code = couponCode.toUpperCase().trim();
    if (!code) return;

    try {
      const q = query(collection(db, 'coupons'), where('code', '==', code), where('isActive', '==', true));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setCouponError('Mã giảm giá không hợp lệ hoặc đã hết hạn.');
        return;
      }

      const coupon = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as Coupon;

      // Check expiration
      if (new Date(coupon.endDate) < new Date()) {
        setCouponError('Mã giảm giá này đã hết hạn.');
        return;
      }

      // Check usage limit
      if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
        setCouponError('Mã giảm giá này đã hết lượt sử dụng.');
        return;
      }

      // Check min order value
      if (coupon.minOrderValue && totalPrice < coupon.minOrderValue) {
        setCouponError(`Đơn hàng tối thiểu ${coupon.minOrderValue.toLocaleString('vi-VN')}đ để sử dụng mã này.`);
        return;
      }

      let amount = 0;
      if (coupon.discountType === 'percentage') {
        amount = Math.round(totalPrice * (coupon.discountValue / 100));
        if (coupon.maxDiscount) {
          amount = Math.min(amount, coupon.maxDiscount);
        }
      } else {
        amount = coupon.discountValue;
      }

      setDiscount(Math.min(amount, totalPrice));
      setAppliedCoupon(code);
      setCouponCode('');
    } catch (error) {
      console.error("Coupon error:", error);
      setCouponError('Lỗi khi áp dụng mã giảm giá.');
    }
  };

  const finalTotal = Math.max(0, totalPrice - discount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setLoginModalOpen(true);
      return;
    }
    
    if (selectedItems.length === 0) {
      alert("Vui lòng chọn ít nhất một sản phẩm để thanh toán.");
      navigate('/cart');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const orderData = {
        userId: user.uid,
        items: selectedItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          variant: item.variant,
          price: item.price || item.product.salePrice || item.product.price,
          message: item.message || ''
        })),
        total: finalTotal,
        subtotal: totalPrice,
        discount: discount,
        couponCode: appliedCoupon,
        status: 'pending',
        deliveryTime: formData.deliveryTime,
        paymentMethod: formData.paymentMethod,
        shippingAddress: formData.address,
        contactPhone: formData.phone,
        contactName: formData.name,
        note: formData.note,
        createdAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'orders'), orderData);
      setIsSuccess(true);
      clearCart();
    } catch (error) {
      console.error("Order error:", error);
      alert("Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-12 rounded-3xl border border-green-100 shadow-xl"
        >
          <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle size={48} className="text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Đặt hàng thành công!</h2>
          <p className="text-gray-500 mb-8 text-lg">Cảm ơn bạn đã tin tưởng lựa chọn tiệm bánh của chúng tôi. Đơn hàng của bạn đang được xử lý và sẽ sớm được giao đến bạn.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigate('/products')}
              className="bg-orange-600 text-white px-8 py-3 rounded-full font-bold hover:bg-orange-700 transition-colors"
            >
              Tiếp tục mua sắm
            </button>
            <button 
              onClick={() => navigate('/')}
              className="bg-white text-orange-600 border-2 border-orange-600 px-8 py-3 rounded-full font-bold hover:bg-orange-50 transition-colors"
            >
              Về trang chủ
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-center space-x-4 mb-8">
        <button onClick={() => navigate('/cart')} className="text-gray-400 hover:text-orange-600 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-serif font-bold text-gray-900">Thanh toán</h1>
      </div>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          {/* Shipping Info */}
          <section className="bg-white p-8 rounded-3xl border border-orange-100 shadow-sm">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-orange-600">
                <Truck size={20} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Thông tin giao hàng</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 flex items-center space-x-2">
                  <User size={16} className="text-orange-600" />
                  <span>Họ và tên</span>
                </label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 rounded-2xl border border-orange-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                  placeholder="Nhập tên người nhận"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 flex items-center space-x-2">
                  <Phone size={16} className="text-orange-600" />
                  <span>Số điện thoại</span>
                </label>
                <input 
                  required
                  type="tel" 
                  value={formData.phone}
                  onChange={e => {
                    const value = e.target.value.replace(/\D/g, '');
                    setFormData({...formData, phone: value});
                  }}
                  className="w-full px-4 py-3 rounded-2xl border border-orange-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                  placeholder="Nhập số điện thoại"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-bold text-gray-700 flex items-center space-x-2">
                  <MapPin size={16} className="text-orange-600" />
                  <span>Địa chỉ nhận bánh</span>
                </label>
                <input 
                  required
                  type="text" 
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  className="w-full px-4 py-3 rounded-2xl border border-orange-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                  placeholder="Số nhà, tên đường, phường/xã, quận/huyện"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-bold text-gray-700 flex items-center space-x-2">
                  <CreditCard size={16} className="text-orange-600" />
                  <span>Thời gian nhận bánh mong muốn</span>
                </label>
                <input 
                  required
                  type="datetime-local" 
                  value={formData.deliveryTime}
                  onChange={e => setFormData({...formData, deliveryTime: e.target.value})}
                  className="w-full px-4 py-3 rounded-2xl border border-orange-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>
          </section>
          
          {/* Payment Method */}
          <section className="bg-white p-8 rounded-3xl border border-orange-100 shadow-sm">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-orange-600">
                <CreditCard size={20} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Phương thức thanh toán</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { id: 'COD', name: 'Tiền mặt (COD)', icon: '💵' },
                { id: 'MOMO', name: 'Ví MoMo', icon: '📱' },
                { id: 'VNPAY', name: 'VNPay', icon: '💳' }
              ].map(method => (
                <label 
                  key={method.id}
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${formData.paymentMethod === method.id ? 'border-orange-600 bg-orange-50' : 'border-orange-100 hover:border-orange-300'}`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{method.icon}</span>
                    <span className="font-bold text-gray-900">{method.name}</span>
                  </div>
                  <input 
                    type="radio" 
                    name="payment" 
                    value={method.id}
                    checked={formData.paymentMethod === method.id}
                    onChange={() => handlePaymentMethodChange(method.id as any)}
                    className="hidden"
                  />
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.paymentMethod === method.id ? 'border-orange-600' : 'border-gray-300'}`}>
                    {formData.paymentMethod === method.id && <div className="w-2.5 h-2.5 bg-orange-600 rounded-full" />}
                  </div>
                </label>
              ))}
            </div>
          </section>
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-white p-8 rounded-3xl border border-orange-100 shadow-sm sticky top-24">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Tóm tắt đơn hàng</h2>
            
            <div className="max-h-80 overflow-y-auto mb-6 space-y-6 pr-2 custom-scrollbar">
              {selectedItems.map(item => (
                <div key={`${item.productId}-${JSON.stringify(item.variant)}`} className="space-y-3">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                      <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-grow">
                      <h4 className="text-sm font-bold text-gray-900 line-clamp-1">{item.product.name}</h4>
                      <p className="text-xs text-gray-500">SL: {item.quantity} x {item.variant?.size}</p>
                      <p className="text-sm font-bold text-orange-600">
                        {((item.price || item.product.salePrice || item.product.price) * item.quantity).toLocaleString('vi-VN')}đ
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Lời chúc trên bánh</label>
                    <input 
                      type="text" 
                      value={item.message || ''}
                      onChange={(e) => updateMessage(item.productId, item.variant, e.target.value)}
                      placeholder="Nhập lời chúc..."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-orange-50 bg-orange-50/30 focus:bg-white focus:border-orange-200 outline-none transition-all italic"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Coupon Code */}
            <div className="mb-6">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Mã giảm giá"
                  className="flex-grow px-4 py-2 rounded-xl border border-orange-100 focus:ring-1 focus:ring-orange-500 outline-none text-sm"
                />
                <button 
                  type="button"
                  onClick={handleApplyCoupon}
                  className="bg-orange-50 text-orange-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-orange-100 transition-colors"
                >
                  Áp dụng
                </button>
              </div>
              {couponError && <p className="text-xs text-red-500 mt-1 ml-1">{couponError}</p>}
              {appliedCoupon && (
                <div className="flex items-center justify-between mt-2 px-3 py-1 bg-green-50 rounded-lg">
                  <span className="text-xs text-green-700 font-bold">Đã áp dụng: {appliedCoupon}</span>
                  <button 
                    type="button"
                    onClick={() => { setDiscount(0); setAppliedCoupon(null); }}
                    className="text-xs text-green-700 hover:underline"
                  >
                    Gỡ bỏ
                  </button>
                </div>
              )}
            </div>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-gray-600">
                <span>Tạm tính</span>
                <span>{totalPrice.toLocaleString('vi-VN')}đ</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá</span>
                  <span>-{discount.toLocaleString('vi-VN')}đ</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Phí vận chuyển</span>
                <span className="text-green-600 font-medium">Miễn phí</span>
              </div>
              <div className="border-t border-orange-100 pt-4 mt-4 flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">Tổng cộng</span>
                <span className="text-2xl font-bold text-orange-600">{finalTotal.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>
            
            <button 
              type="submit"
              disabled={isSubmitting}
              className={`w-full bg-orange-600 text-white py-4 rounded-full font-bold text-lg hover:bg-orange-700 transition-all shadow-lg hover:shadow-orange-200 flex items-center justify-center space-x-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Xác nhận đặt hàng</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
            
            <p className="mt-4 text-xs text-center text-gray-400">
              Bằng cách đặt hàng, bạn đồng ý với các điều khoản và chính sách của chúng tôi.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Checkout;
