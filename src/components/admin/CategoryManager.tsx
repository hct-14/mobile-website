import React, { useState, useEffect } from 'react';
import { db, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from '../../firebase';
import { Category } from '../../types';
import { Plus, Trash2, Edit, Save, X, CheckCircle2, AlertCircle, Tag } from 'lucide-react';

const CategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState('');

  const [formData, setFormData] = useState<Partial<Category>>({
    name: '',
    slug: '',
    icon: '🎂'
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'categories'), (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Đang lưu...');
    try {
      const slug = formData.name?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ /g, '-').replace(/[^\w-]+/g, '');
      const data = { ...formData, slug };
      
      if (editingId) {
        await updateDoc(doc(db, 'categories', editingId), data);
        setStatus('Cập nhật thành công!');
      } else {
        await addDoc(collection(db, 'categories'), data);
        setStatus('Thêm mới thành công!');
      }
      setIsAdding(false);
      setEditingId(null);
      setFormData({ name: '', slug: '', icon: '🎂' });
    } catch (error) {
      setStatus('Lỗi khi lưu danh mục.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Xóa danh mục này? Các sản phẩm thuộc danh mục này có thể bị ảnh hưởng.')) return;
    try {
      await deleteDoc(doc(db, 'categories', id));
    } catch (error) {
      alert('Lỗi khi xóa.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Quản lý Danh mục</h2>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-orange-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2"
        >
          <Plus size={20} /> Thêm Danh mục
        </button>
      </div>

      {status && (
        <div className={`p-4 rounded-xl flex items-center gap-2 ${status.includes('Lỗi') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          <CheckCircle2 size={18} /> {status}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map(cat => (
          <div key={cat.id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-2xl">
                {cat.icon || '🎂'}
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{cat.name}</h3>
                <p className="text-xs text-gray-500">{cat.slug}</p>
              </div>
            </div>
            <div className="flex gap-1">
              <button 
                onClick={() => { setEditingId(cat.id); setFormData(cat); }}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
              >
                <Edit size={18} />
              </button>
              <button 
                onClick={() => handleDelete(cat.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {(isAdding || editingId) && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">{editingId ? 'Sửa Danh mục' : 'Thêm Danh mục'}</h3>
              <button onClick={() => { setIsAdding(false); setEditingId(null); }}><X size={24} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-700">Tên danh mục</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-700">Icon (Emoji)</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                  value={formData.icon}
                  onChange={e => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="🎂"
                />
              </div>
              <button type="submit" className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold mt-4 shadow-lg shadow-orange-100">
                Lưu Danh mục
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManager;
