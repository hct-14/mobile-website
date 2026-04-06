import React, { useState, useEffect } from 'react';
import { db, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from '../../firebase';
import { Banner } from '../../types';
import { Plus, Trash2, Edit, Save, X, Image as ImageIcon, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';

const BannerManager: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState('');

  const [formData, setFormData] = useState<Partial<Banner>>({
    imageUrl: '',
    title: '',
    link: '',
    isActive: true,
    order: 0
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'banners'), (snapshot) => {
      const bannerData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Banner));
      setBanners(bannerData.sort((a, b) => a.order - b.order));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Đang lưu...');
    try {
      if (editingId) {
        await updateDoc(doc(db, 'banners', editingId), formData);
        setStatus('Cập nhật thành công!');
      } else {
        await addDoc(collection(db, 'banners'), formData);
        setStatus('Thêm mới thành công!');
      }
      setIsAdding(false);
      setEditingId(null);
      setFormData({ imageUrl: '', title: '', link: '', isActive: true, order: 0 });
    } catch (error) {
      setStatus('Lỗi khi lưu banner.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Xóa banner này?')) return;
    try {
      await deleteDoc(doc(db, 'banners', id));
    } catch (error) {
      alert('Lỗi khi xóa.');
    }
  };

  const toggleStatus = async (banner: Banner) => {
    try {
      await updateDoc(doc(db, 'banners', banner.id), { isActive: !banner.isActive });
    } catch (error) {
      alert('Lỗi khi cập nhật trạng thái.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Quản lý Banner</h2>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-orange-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2"
        >
          <Plus size={20} /> Thêm Banner
        </button>
      </div>

      {status && (
        <div className={`p-4 rounded-xl flex items-center gap-2 ${status.includes('Lỗi') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          <CheckCircle2 size={18} /> {status}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banners.map(banner => (
          <div key={banner.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="aspect-[21/9] relative group">
              <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button 
                  onClick={() => { setEditingId(banner.id); setFormData(banner); }}
                  className="p-2 bg-white rounded-full text-blue-600 shadow-lg"
                >
                  <Edit size={18} />
                </button>
                <button 
                  onClick={() => handleDelete(banner.id)}
                  className="p-2 bg-white rounded-full text-red-600 shadow-lg"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="absolute top-2 right-2">
                <button 
                  onClick={() => toggleStatus(banner)}
                  className={`p-1.5 rounded-lg shadow-sm ${banner.isActive ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}
                >
                  {banner.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-gray-900 truncate">{banner.title || 'Không có tiêu đề'}</h3>
              <p className="text-xs text-gray-500 truncate">{banner.link || 'Không có liên kết'}</p>
              <div className="mt-2 text-xs font-bold text-orange-600 uppercase tracking-wider">Thứ tự: {banner.order}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {(isAdding || editingId) && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">{editingId ? 'Sửa Banner' : 'Thêm Banner'}</h3>
              <button onClick={() => { setIsAdding(false); setEditingId(null); }}><X size={24} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-700">Link ảnh</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                  value={formData.imageUrl}
                  onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-700">Tiêu đề (Tùy chọn)</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-700">Liên kết (Tùy chọn)</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                  value={formData.link}
                  onChange={e => setFormData({ ...formData, link: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Thứ tự hiển thị</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                    value={formData.order}
                    onChange={e => setFormData({ ...formData, order: Number(e.target.value) })}
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.isActive} 
                      onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-5 h-5 accent-orange-600"
                    />
                    <span className="text-sm font-bold text-gray-700">Hoạt động</span>
                  </label>
                </div>
              </div>
              <button type="submit" className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold mt-4 shadow-lg shadow-orange-100">
                Lưu Banner
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BannerManager;
