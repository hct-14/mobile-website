import React, { useState, useEffect } from 'react';
import { db, doc, getDoc, setDoc } from '../../firebase';
import { Save, CheckCircle2, AlertCircle, Store, Phone, Mail, MapPin, Clock, Facebook, Instagram } from 'lucide-react';

export interface StoreInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
  workingHours: string;
  facebook: string;
  instagram: string;
  description: string;
}

const StoreSettings: React.FC = () => {
  const [formData, setFormData] = useState<StoreInfo>({
    name: 'Tiệm Bánh Ngọt',
    phone: '0123 456 789',
    email: 'contact@tiembanhngot.vn',
    address: '123 Đường Bánh Ngọt, Quận 1, TP. Hồ Chí Minh',
    workingHours: '8:00 - 22:00 (Hàng ngày)',
    facebook: 'https://facebook.com',
    instagram: 'https://instagram.com',
    description: 'Mang đến những chiếc bánh ngọt ngào, tươi mới mỗi ngày. Giao nhanh trong 1 giờ, cam kết chất lượng và sự hài lòng tuyệt đối.'
  });
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const fetchStoreInfo = async () => {
      try {
        const docRef = doc(db, 'settings', 'store_info');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setFormData(docSnap.data() as StoreInfo);
        }
      } catch (error) {
        console.error("Error fetching store info:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStoreInfo();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Đang lưu...');
    try {
      await setDoc(doc(db, 'settings', 'store_info'), formData);
      setStatus('Cập nhật thông tin thành công!');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      console.error("Error saving store info:", error);
      setStatus('Lỗi khi lưu dữ liệu.');
    }
  };

  if (loading) {
    return <div className="animate-pulse flex space-x-4">
      <div className="flex-1 space-y-6 py-1">
        <div className="h-2 bg-gray-200 rounded"></div>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-4">
            <div className="h-2 bg-gray-200 rounded col-span-2"></div>
            <div className="h-2 bg-gray-200 rounded col-span-1"></div>
          </div>
          <div className="h-2 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Thông tin cửa hàng</h2>
      </div>

      {status && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 ${status.includes('Lỗi') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {status.includes('Lỗi') ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          <span className="font-medium">{status}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-[2.5rem] p-8 border border-orange-100 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Store size={16} className="text-orange-600" /> Tên cửa hàng
            </label>
            <input 
              required
              type="text" 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Phone size={16} className="text-orange-600" /> Số điện thoại
            </label>
            <input 
              required
              type="text" 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Mail size={16} className="text-orange-600" /> Email
            </label>
            <input 
              required
              type="email" 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Clock size={16} className="text-orange-600" /> Giờ làm việc
            </label>
            <input 
              required
              type="text" 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
              value={formData.workingHours}
              onChange={e => setFormData({ ...formData, workingHours: e.target.value })}
            />
          </div>

          <div className="space-y-2 col-span-1 md:col-span-2">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <MapPin size={16} className="text-orange-600" /> Địa chỉ
            </label>
            <input 
              required
              type="text" 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="space-y-2 col-span-1 md:col-span-2">
            <label className="text-sm font-bold text-gray-700">Mô tả ngắn (Footer)</label>
            <textarea 
              required
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none resize-none"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Facebook size={16} className="text-blue-600" /> Link Facebook
            </label>
            <input 
              type="url" 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
              value={formData.facebook}
              onChange={e => setFormData({ ...formData, facebook: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Instagram size={16} className="text-pink-600" /> Link Instagram
            </label>
            <input 
              type="url" 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
              value={formData.instagram}
              onChange={e => setFormData({ ...formData, instagram: e.target.value })}
            />
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100">
          <button type="submit" className="bg-orange-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-orange-700 transition-all shadow-xl shadow-orange-200 flex items-center justify-center gap-2">
            <Save size={20} />
            <span>Lưu thay đổi</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default StoreSettings;
