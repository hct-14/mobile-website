import React, { useState, useEffect } from 'react';
import { db, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from '../../firebase';
import { Coupon } from '../../types';
import { Plus, Trash2, Edit, Save, X, CheckCircle2, AlertCircle, Ticket, Calendar, Percent, DollarSign } from 'lucide-react';

const CouponManager: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState('');

  const [formData, setFormData] = useState<Partial<Coupon>>({
    code: '',
    discountType: 'percentage',
    discountValue: 0,
    minOrderValue: 0,
    maxDiscount: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    usageLimit: 100,
    usageCount: 0,
    isActive: true
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'coupons'), (snapshot) => {
      setCoupons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Coupon)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Đang lưu...');
    try {
      if (editingId) {
        await updateDoc(doc(db, 'coupons', editingId), formData);
        setStatus('Cập nhật thành công!');
      } else {
        await addDoc(collection(db, 'coupons'), formData);
        setStatus('Thêm mới thành công!');
      }
      setIsAdding(false);
      setEditingId(null);
      setFormData({ code: '', discountType: 'percentage', discountValue: 0, minOrderValue: 0, maxDiscount: 0, startDate: '', endDate: '', usageLimit: 100, usageCount: 0, isActive: true });
    } catch (error) {
      setStatus('Lỗi khi lưu mã giảm giá.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Xóa mã giảm giá này?')) return;
    try {
      await deleteDoc(doc(db, 'coupons', id));
    } catch (error) {
      alert('Lỗi khi xóa.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Quản lý Mã giảm giá</h2>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-orange-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2"
        >
          <Plus size={20} /> Thêm Mã
        </button>
      </div>

      {status && (
        <div className={`p-4 rounded-xl flex items-center gap-2 ${status.includes('Lỗi') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          <CheckCircle2 size={18} /> {status}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coupons.map(coupon => (
          <div key={coupon.id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-orange-50 -mr-8 -mt-8 rounded-full" />
            
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
                  <Ticket size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 uppercase tracking-widest">{coupon.code}</h3>
                  <p className={`text-xs font-bold ${new Date(coupon.endDate) < new Date() ? 'text-red-500' : 'text-gray-500'}`}>
                    {new Date(coupon.endDate) < new Date() ? 'Đã hết hạn: ' : 'Hết hạn: '} {coupon.endDate}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => { setEditingId(coupon.id); setFormData(coupon); }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <Edit size={18} />
                </button>
                <button 
                  onClick={() => handleDelete(coupon.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-3 relative z-10">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">Giảm giá:</span>
                <span className="font-bold text-orange-600">
                  {coupon.discountValue}{coupon.discountType === 'percentage' ? '%' : 'đ'}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">Đơn tối thiểu:</span>
                <span className="font-bold text-gray-900">{coupon.minOrderValue?.toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">Đã dùng:</span>
                <span className="font-bold text-gray-900">{coupon.usageCount} / {coupon.usageLimit || '∞'}</span>
              </div>
              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-orange-600 h-full transition-all" 
                  style={{ width: `${(coupon.usageCount / (coupon.usageLimit || 1)) * 100}%` }}
                />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${coupon.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                {coupon.isActive ? 'Hoạt động' : 'Tạm dừng'}
              </span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                {coupon.discountType === 'percentage' ? 'Phần trăm' : 'Cố định'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {(isAdding || editingId) && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">{editingId ? 'Sửa Mã giảm giá' : 'Thêm Mã giảm giá'}</h3>
              <button onClick={() => { setIsAdding(false); setEditingId(null); }}><X size={24} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Mã code</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl uppercase"
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Loại giảm giá</label>
                  <select 
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                    value={formData.discountType}
                    onChange={e => setFormData({ ...formData, discountType: e.target.value as any })}
                  >
                    <option value="percentage">Phần trăm (%)</option>
                    <option value="fixed">Số tiền cố định (VNĐ)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Giá trị giảm</label>
                  <input 
                    required
                    type="number" 
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                    value={formData.discountValue}
                    onChange={e => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Đơn tối thiểu</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                    value={formData.minOrderValue}
                    onChange={e => setFormData({ ...formData, minOrderValue: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Giới hạn sử dụng</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                    value={formData.usageLimit}
                    onChange={e => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Trạng thái</label>
                  <div className="flex items-center h-10">
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
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Ngày bắt đầu</label>
                  <input 
                    required
                    type="date" 
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Ngày kết thúc</label>
                  <input 
                    required
                    type="date" 
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>

              <button type="submit" className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold mt-4 shadow-lg shadow-orange-100">
                Lưu Mã giảm giá
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponManager;
