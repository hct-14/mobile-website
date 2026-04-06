import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Phone, Mail, MapPin, Clock } from 'lucide-react';
import { db, doc, getDoc } from '../firebase';
import { StoreInfo } from './admin/StoreSettings';

const Footer: React.FC = () => {
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);

  useEffect(() => {
    const fetchStoreInfo = async () => {
      try {
        const docRef = doc(db, 'settings', 'store_info');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setStoreInfo(docSnap.data() as StoreInfo);
        }
      } catch (error) {
        console.error("Error fetching store info:", error);
      }
    };
    fetchStoreInfo();
  }, []);

  return (
    <footer className="bg-orange-50 pt-16 pb-8 border-t border-orange-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-6">
            <Link to="/" className="text-2xl font-serif font-bold text-orange-800 tracking-tight">
              {storeInfo?.name || 'Tiệm Bánh Ngọt'}
            </Link>
            <p className="text-gray-600 text-sm leading-relaxed">
              {storeInfo?.description || 'Mang đến những chiếc bánh ngọt ngào, tươi mới mỗi ngày. Giao nhanh trong 1 giờ, cam kết chất lượng và sự hài lòng tuyệt đối.'}
            </p>
            <div className="flex space-x-4">
              <a href={storeInfo?.facebook || '#'} target="_blank" rel="noopener noreferrer" className="p-2 bg-white rounded-full text-orange-600 hover:bg-orange-600 hover:text-white transition-all shadow-sm">
                <Facebook size={20} />
              </a>
              <a href={storeInfo?.instagram || '#'} target="_blank" rel="noopener noreferrer" className="p-2 bg-white rounded-full text-orange-600 hover:bg-orange-600 hover:text-white transition-all shadow-sm">
                <Instagram size={20} />
              </a>
              <a href="#" className="p-2 bg-white rounded-full text-orange-600 hover:bg-orange-600 hover:text-white transition-all shadow-sm">
                <Twitter size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-orange-900 uppercase tracking-widest">Khám phá</h3>
            <ul className="space-y-3">
              <li><Link to="/products" className="text-gray-600 hover:text-orange-600 text-sm transition-colors">Tất cả sản phẩm</Link></li>
              <li><Link to="/products?category=sinh-nhat" className="text-gray-600 hover:text-orange-600 text-sm transition-colors">Bánh sinh nhật</Link></li>
              <li><Link to="/products?category=cho-be" className="text-gray-600 hover:text-orange-600 text-sm transition-colors">Bánh cho bé</Link></li>
              <li><Link to="/custom-cake" className="text-gray-600 hover:text-orange-600 text-sm transition-colors">Đặt bánh theo yêu cầu</Link></li>
              <li><Link to="/combo" className="text-gray-600 hover:text-orange-600 text-sm transition-colors">Combo quà tặng</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-orange-900 uppercase tracking-widest">Hỗ trợ</h3>
            <ul className="space-y-3">
              <li><Link to="/policy/shipping" className="text-gray-600 hover:text-orange-600 text-sm transition-colors">Chính sách giao hàng</Link></li>
              <li><Link to="/policy/refund" className="text-gray-600 hover:text-orange-600 text-sm transition-colors">Chính sách đổi trả</Link></li>
              <li><Link to="/faq" className="text-gray-600 hover:text-orange-600 text-sm transition-colors">Câu hỏi thường gặp</Link></li>
              <li><Link to="/contact" className="text-gray-600 hover:text-orange-600 text-sm transition-colors">Liên hệ</Link></li>
              <li><Link to="/track-order" className="text-gray-600 hover:text-orange-600 text-sm transition-colors">Tra cứu đơn hàng</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-orange-900 uppercase tracking-widest">Liên hệ</h3>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3 text-gray-600 text-sm">
                <MapPin size={18} className="text-orange-600 shrink-0 mt-0.5" />
                <span>{storeInfo?.address || '123 Đường Bánh Ngọt, Quận 1, TP. Hồ Chí Minh'}</span>
              </li>
              <li className="flex items-center space-x-3 text-gray-600 text-sm">
                <Phone size={18} className="text-orange-600 shrink-0" />
                <span>{storeInfo?.phone || '0123 456 789'}</span>
              </li>
              <li className="flex items-center space-x-3 text-gray-600 text-sm">
                <Mail size={18} className="text-orange-600 shrink-0" />
                <span>{storeInfo?.email || 'contact@tiembanhngot.vn'}</span>
              </li>
              <li className="flex items-center space-x-3 text-gray-600 text-sm">
                <Clock size={18} className="text-orange-600 shrink-0" />
                <span>{storeInfo?.workingHours || '8:00 - 22:00 (Hàng ngày)'}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-orange-200 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} {storeInfo?.name || 'Tiệm Bánh Ngọt'}. Tất cả quyền được bảo lưu.
          </p>
          <div className="flex items-center space-x-6">
            <img src="https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png" alt="MoMo" className="h-6 opacity-60 grayscale hover:grayscale-0 transition-all" />
            <img src="https://vnpay.vn/wp-content/uploads/2020/07/vnpay-logo.png" alt="VNPAY" className="h-4 opacity-60 grayscale hover:grayscale-0 transition-all" />
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">COD</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
