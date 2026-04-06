import React, { useState, useEffect } from 'react';
import { db, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from '../../firebase';
import { Campaign, Product } from '../../types';
import { Plus, Trash2, Edit, Save, X, CheckCircle2, AlertCircle, Calendar, Tag, Percent } from 'lucide-react';

const CampaignManager: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState('');

  const [formData, setFormData] = useState<Partial<Campaign>>({
    name: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    discountType: 'percentage',
    discountValue: 0,
    productIds: [],
    isActive: true
  });

  useEffect(() => {
    const unsubscribeCampaigns = onSnapshot(collection(db, 'campaigns'), (snapshot) => {
      setCampaigns(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Campaign)));
      setLoading(false);
    });
    
    const fetchProducts = async () => {
      const snap = await getDocs(collection(db, 'products'));
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
    };
    
    fetchProducts();
    return () => unsubscribeCampaigns();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Đang lưu...');
    try {
      if (editingId) {
        await updateDoc(doc(db, 'campaigns', editingId), formData);
        setStatus('Cập nhật thành công!');
      } else {
        await addDoc(collection(db, 'campaigns'), formData);
        setStatus('Thêm mới thành công!');
      }
      setIsAdding(false);
      setEditingId(null);
      setFormData({ name: '', description: '', startDate: '', endDate: '', discountType: 'percentage', discountValue: 0, productIds: [], isActive: true });
    } catch (error) {
      setStatus('Lỗi khi lưu chiến dịch.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Xóa chiến dịch này?')) return;
    try {
      await deleteDoc(doc(db, 'campaigns', id));
    } catch (error) {
      alert('Lỗi khi xóa.');
    }
  };

  const toggleProduct = (productId: string) => {
    const currentIds = formData.productIds || [];
    if (currentIds.includes(productId)) {
      setFormData({ ...formData, productIds: currentIds.filter(id => id !== productId) });
    } else {
      setFormData({ ...formData, productIds: [...currentIds, productId] });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Quản lý Chiến dịch Sale</h2>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-orange-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2"
        >
          <Plus size={20} /> Thêm Chiến dịch
        </button>
      </div>

      {status && (
        <div className={`p-4 rounded-xl flex items-center gap-2 ${status.includes('Lỗi') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          <CheckCircle2 size={18} /> {status}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {campaigns.map(campaign => (
          <div key={campaign.id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow relative">
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-gray-900">{campaign.name}</h3>
                <p className="text-sm text-gray-500">{campaign.description}</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => { setEditingId(campaign.id); setFormData(campaign); }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <Edit size={18} />
                </button>
                <button 
                  onClick={() => handleDelete(campaign.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-orange-50 p-3 rounded-xl flex items-center gap-3">
                <Tag className="text-orange-600" size={20} />
                <div>
                  <p className="text-[10px] text-orange-800 font-bold uppercase tracking-wider">Giảm giá</p>
                  <p className="text-lg font-bold text-orange-900">
                    {campaign.discountValue}{campaign.discountType === 'percentage' ? '%' : 'đ'}
                  </p>
                </div>
              </div>
              <div className="bg-blue-50 p-3 rounded-xl flex items-center gap-3">
                <Calendar className="text-blue-600" size={20} />
                <div>
                  <p className="text-[10px] text-blue-800 font-bold uppercase tracking-wider">Thời gian</p>
                  <p className="text-xs font-bold text-blue-900">
                    {campaign.startDate} - {campaign.endDate}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${campaign.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                {campaign.isActive ? 'Đang chạy' : 'Tạm dừng'}
              </span>
              <span className="text-xs text-gray-500 font-bold">{campaign.productIds.length} sản phẩm áp dụng</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {(isAdding || editingId) && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">{editingId ? 'Sửa Chiến dịch' : 'Thêm Chiến dịch'}</h3>
              <button onClick={() => { setIsAdding(false); setEditingId(null); }}><X size={24} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Tên chiến dịch</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
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

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Chọn sản phẩm áp dụng</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 bg-gray-50 rounded-xl border border-gray-100">
                  {products.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleProduct(p.id)}
                      className={`p-2 rounded-lg text-left text-xs font-medium transition-all border ${formData.productIds?.includes(p.id) ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-gray-600 border-gray-100 hover:border-orange-200'}`}
                    >
                      <p className="truncate">{p.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold mt-4 shadow-lg shadow-orange-100">
                Lưu Chiến dịch
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignManager;
