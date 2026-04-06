import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Cake, Camera, Calendar, Phone, User, MessageSquare, CheckCircle, ArrowRight, Info } from 'lucide-react';
import { motion } from 'framer-motion';

const CustomCake: React.FC = () => {
  const { user, setLoginModalOpen } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: user?.displayName || '',
    phone: '',
    email: user?.email || '',
    description: '',
    deliveryTime: '',
    referenceImages: [] as string[]
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setLoginModalOpen(true);
      return;
    }
    
    setIsSubmitting(true);
    try {
      const requestData = {
        userId: user.uid,
        contactName: formData.name,
        contactPhone: formData.phone,
        email: formData.email,
        description: formData.description,
        referenceImages: formData.referenceImages,
        deliveryTime: formData.deliveryTime,
        status: 'pending',
        createdAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'custom_requests'), requestData);
      setIsSuccess(true);
    } catch (error) {
      console.error("Custom request error:", error);
      alert("Có lỗi xảy ra khi gửi yêu cầu. Vui lòng thử lại.");
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
          className="bg-white p-12 rounded-3xl border border-orange-100 shadow-xl"
        >
          <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle size={48} className="text-orange-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Đặt hàng thành công!</h2>
          <p className="text-gray-500 mb-8 text-lg">Chúng tôi đã nhận được yêu cầu thiết kế bánh của bạn. Đội ngũ tư vấn sẽ liên hệ với bạn trong vòng 24h để trao đổi chi tiết và báo giá.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigate('/products')}
              className="bg-orange-600 text-white px-8 py-3 rounded-full font-bold hover:bg-orange-700 transition-colors"
            >
              Xem các mẫu có sẵn
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        <div>
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center space-x-2 bg-orange-50 text-orange-600 px-4 py-2 rounded-full text-sm font-bold">
              <Cake size={16} />
              <span>Dịch vụ đặc biệt</span>
            </div>
            <h1 className="text-5xl font-serif font-bold text-gray-900 leading-tight">
              Thiết kế chiếc bánh <br />
              <span className="text-orange-600">Dành riêng cho bạn</span>
            </h1>
            <p className="text-xl text-gray-500 leading-relaxed">
              Bạn có ý tưởng độc đáo cho ngày đặc biệt? Hãy chia sẻ với chúng tôi, tiệm bánh sẽ giúp bạn hiện thực hóa chiếc bánh trong mơ với hương vị tuyệt hảo nhất.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-8">
              <div className="bg-white p-6 rounded-3xl border border-orange-100 shadow-sm">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-4">
                  <MessageSquare size={24} />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Tư vấn tận tâm</h3>
                <p className="text-sm text-gray-500">Lắng nghe và tư vấn mẫu bánh phù hợp nhất với ngân sách và sở thích.</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-orange-100 shadow-sm">
                <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 mb-4">
                  <Camera size={24} />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Làm theo mẫu</h3>
                <p className="text-sm text-gray-500">Chỉ cần gửi ảnh mẫu, chúng tôi sẽ tái hiện chính xác đến 95%.</p>
              </div>
            </div>
            
            <div className="bg-orange-600 p-8 rounded-3xl text-white relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-2">Bạn cần hỗ trợ gấp?</h3>
                <p className="opacity-90 mb-6">Liên hệ trực tiếp với nghệ nhân làm bánh qua hotline hoặc Zalo.</p>
                <a href="tel:0123456789" className="inline-flex items-center space-x-2 bg-white text-orange-600 px-6 py-3 rounded-full font-bold hover:bg-orange-50 transition-colors">
                  <Phone size={20} />
                  <span>0123 456 789</span>
                </a>
              </div>
              <Cake size={120} className="absolute -bottom-10 -right-10 opacity-10 rotate-12" />
            </div>
          </motion.div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-10 rounded-[2.5rem] border border-orange-100 shadow-xl"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Gửi yêu cầu thiết kế</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
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
                  placeholder="Nhập tên của bạn"
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
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 flex items-center space-x-2">
                <Calendar size={16} className="text-orange-600" />
                <span>Ngày & giờ nhận bánh dự kiến</span>
              </label>
              <input 
                required
                type="datetime-local" 
                value={formData.deliveryTime}
                onChange={e => setFormData({...formData, deliveryTime: e.target.value})}
                className="w-full px-4 py-3 rounded-2xl border border-orange-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 flex items-center space-x-2">
                <MessageSquare size={16} className="text-orange-600" />
                <span>Mô tả ý tưởng của bạn</span>
              </label>
              <textarea 
                required
                rows={4}
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-3 rounded-2xl border border-orange-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all resize-none"
                placeholder="Hãy mô tả chi tiết về kích thước, hương vị, màu sắc hoặc thông điệp bạn muốn ghi lên bánh..."
              />
            </div>
            
            <div className="bg-blue-50 p-4 rounded-2xl flex items-start space-x-3">
              <Info size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-700">
                Sau khi gửi yêu cầu, chúng tôi sẽ xem xét và gửi báo giá chi tiết cho bạn qua số điện thoại hoặc Zalo.
              </p>
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
                  <span>Gửi yêu cầu ngay</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default CustomCake;
