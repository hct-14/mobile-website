import React, { useState, useEffect } from 'react';
import { db, collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Product, Category } from '../types';
import { Plus, Trash2, Edit, Save, X, Image as ImageIcon, CheckCircle2, AlertCircle, LayoutDashboard, ShoppingBag, Image as BannerIcon, Megaphone, Ticket, BarChart3, ClipboardList, Upload, Store, TrendingUp } from 'lucide-react';
import BannerManager from '../components/admin/BannerManager';
import CampaignManager from '../components/admin/CampaignManager';
import CouponManager from '../components/admin/CouponManager';
import StatisticsDashboard from '../components/admin/StatisticsDashboard';
import OrderManager from '../components/admin/OrderManager';
import CategoryManager from '../components/admin/CategoryManager';
import StoreSettings from '../components/admin/StoreSettings';
import OperationManager from '../components/admin/OperationManager';

const Admin: React.FC = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'products' | 'banners' | 'campaigns' | 'coupons' | 'stats' | 'orders' | 'categories' | 'settings' | 'operations'>('stats');
  const [status, setStatus] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    salePrice: undefined,
    categoryId: '',
    images: [''],
    variants: { 
      flavors: [
        { name: 'Vani', sizes: [{ name: '14cm', price: 200000 }] }
      ] 
    },
    isBestSeller: false,
    isFastDelivery: true,
    stock: 10,
    views: 0,
    orderCount: 0
  });

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodSnap, catSnap] = await Promise.all([
        getDocs(collection(db, 'products')),
        getDocs(collection(db, 'categories'))
      ]);
      setProducts(prodSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
      setCategories(catSnap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || formData.price === undefined || !formData.categoryId || formData.stock === undefined) {
      setStatus('Lỗi: Vui lòng điền đầy đủ Tên, Giá, Danh mục và Số lượng.');
      return;
    }

    setStatus('Đang lưu...');
    try {
      const slug = formData.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ /g, '-').replace(/[^\w-]+/g, '');

      // Check image sizes (rough estimate for base64)
      const totalImageSize = (formData.images || []).reduce((acc, img) => acc + img.length, 0);
      const totalFlavorImageSize = (formData.variants?.flavors || []).reduce((acc, f) => acc + (f.image?.length || 0), 0);
      if (totalImageSize + totalFlavorImageSize > 1000000) {
        setStatus('Lỗi: Kích thước ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn hoặc dùng URL ảnh.');
        return;
      }

      if (editingId) {
        await updateDoc(doc(db, 'products', editingId), { ...formData, slug });
        setStatus('Cập nhật thành công!');
      } else {
        await addDoc(collection(db, 'products'), { 
          ...formData, 
          slug,
          views: 0,
          orderCount: 0
        });
        setStatus('Thêm mới thành công!');
      }
      setEditingId(null);
      setIsAdding(false);
      fetchData();
    } catch (error: any) {
      console.error("Save error:", error);
      setStatus(`Lỗi khi lưu dữ liệu: ${error.message || 'Vui lòng thử lại'}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      fetchData();
    } catch (error) {
      alert('Lỗi khi xóa.');
    }
  };

  const seedData = async () => {
    setStatus('Đang khởi tạo dữ liệu...');
    try {
      const categoriesRef = collection(db, 'categories');
      const productsRef = collection(db, 'products');
      const bannersRef = collection(db, 'banners');
      
      const catsSnap = await getDocs(categoriesRef);
      const prodsSnap = await getDocs(productsRef);
      const bannersSnap = await getDocs(bannersRef);

      // Seed Categories if empty
      if (catsSnap.empty) {
        const cats = [
          { name: 'Bánh Sinh Nhật', slug: 'sinh-nhat', icon: '🎂' },
          { name: 'Bánh Cho Bé', slug: 'cho-be', icon: '👶' },
          { name: 'Bánh Cho Nữ', slug: 'cho-nu', icon: '👩' },
          { name: 'Bánh Cho Nam', slug: 'cho-nam', icon: '👨' },
          { name: 'Bánh Kỷ Niệm', slug: 'ky-niem', icon: '💍' },
          { name: 'Combo Quà Tặng', slug: 'combo', icon: '🎁' },
        ];
        for (const cat of cats) await addDoc(categoriesRef, cat);
      }

      // Seed Products if empty
      if (prodsSnap.empty) {
        const demoProducts = [
          {
            name: 'Bánh Kem Dâu Tây Premium',
            description: 'Bánh kem dâu tây tươi với lớp kem béo ngậy và cốt bánh bông lan mềm mịn.',
            price: 350000,
            salePrice: 299000,
            categoryId: 'sinh-nhat',
            images: ['https://picsum.photos/seed/strawberry-cake/800/800'],
            variants: { 
              flavors: [
                { name: 'Dâu tây', sizes: [{ name: '14cm', price: 299000 }, { name: '18cm', price: 399000 }] },
                { name: 'Vani', sizes: [{ name: '14cm', price: 299000 }, { name: '18cm', price: 399000 }] }
              ]
            },
            isBestSeller: true,
            isFastDelivery: true,
            stock: 15,
            views: 120,
            orderCount: 45
          },
          {
            name: 'Bánh Chocolate Galaxy',
            description: 'Thiết kế dải ngân hà huyền bí với vị chocolate đậm đà từ Bỉ.',
            price: 450000,
            categoryId: 'cho-nam',
            images: ['https://picsum.photos/seed/galaxy-cake/800/800'],
            variants: { 
              flavors: [
                { name: 'Chocolate', sizes: [{ name: '16cm', price: 450000 }, { name: '20cm', price: 550000 }] },
                { name: 'Mocha', sizes: [{ name: '16cm', price: 450000 }, { name: '20cm', price: 550000 }] }
              ]
            },
            isBestSeller: true,
            isFastDelivery: false,
            stock: 8,
            views: 250,
            orderCount: 30
          },
          {
            name: 'Bánh Công Chúa Hồng',
            description: 'Mẫu bánh búp bê công chúa dành riêng cho các bé gái, trang trí lộng lẫy.',
            price: 550000,
            categoryId: 'cho-be',
            images: ['https://picsum.photos/seed/princess-cake/800/800'],
            variants: { 
              flavors: [
                { name: 'Dâu tây', sizes: [{ name: '18cm', price: 550000 }, { name: '22cm', price: 650000 }] },
                { name: 'Vani', sizes: [{ name: '18cm', price: 550000 }, { name: '22cm', price: 650000 }] }
              ]
            },
            isBestSeller: false,
            isFastDelivery: false,
            stock: 5,
            views: 180,
            orderCount: 12
          },
          {
            name: 'Bánh Siêu Nhân Anh Hùng',
            description: 'Bánh kem tạo hình siêu nhân mạnh mẽ cho các bé trai năng động.',
            price: 520000,
            categoryId: 'cho-be',
            images: ['https://picsum.photos/seed/superhero-cake/800/800'],
            variants: { 
              flavors: [
                { name: 'Chocolate', sizes: [{ name: '18cm', price: 520000 }, { name: '22cm', price: 620000 }] },
                { name: 'Vani', sizes: [{ name: '18cm', price: 520000 }, { name: '22cm', price: 620000 }] }
              ]
            },
            isBestSeller: true,
            isFastDelivery: true,
            stock: 10,
            views: 320,
            orderCount: 55
          },
          {
            name: 'Bánh Hoa Hồng Lãng Mạn',
            description: 'Trang trí hoa kem bơ tinh xảo, món quà ý nghĩa cho phái đẹp.',
            price: 420000,
            salePrice: 380000,
            categoryId: 'cho-nu',
            images: ['https://picsum.photos/seed/rose-cake/800/800'],
            variants: { 
              flavors: [
                { name: 'Trà xanh', sizes: [{ name: '16cm', price: 380000 }, { name: '20cm', price: 480000 }] },
                { name: 'Vani', sizes: [{ name: '16cm', price: 380000 }, { name: '20cm', price: 480000 }] }
              ]
            },
            isBestSeller: true,
            isFastDelivery: true,
            stock: 12,
            views: 450,
            orderCount: 80
          },
          {
            name: 'Bánh Kỷ Niệm Ngày Cưới Gold',
            description: 'Thiết kế sang trọng với tông màu vàng gold, biểu tượng cho tình yêu vĩnh cửu.',
            price: 650000,
            categoryId: 'ky-niem',
            images: ['https://picsum.photos/seed/anniversary-cake/800/800'],
            variants: { 
              flavors: [
                { name: 'Vani Red Velvet', sizes: [{ name: '20cm', price: 650000 }, { name: '24cm', price: 750000 }] },
                { name: 'Phô mai', sizes: [{ name: '20cm', price: 650000 }, { name: '24cm', price: 750000 }] }
              ]
            },
            isBestSeller: false,
            isFastDelivery: false,
            stock: 4,
            views: 90,
            orderCount: 8
          },
          {
            name: 'Combo Trà Chiều & Bánh Ngọt',
            description: 'Set quà tặng gồm trà hoa cúc và 6 chiếc bánh cupcake đa dạng hương vị.',
            price: 280000,
            categoryId: 'combo',
            images: ['https://picsum.photos/seed/tea-combo/800/800'],
            variants: { 
              flavors: [
                { name: 'Mix 6 vị', sizes: [{ name: 'Set Standard', price: 280000 }] }
              ]
            },
            isBestSeller: true,
            isFastDelivery: true,
            stock: 20,
            views: 150,
            orderCount: 60
          },
          {
            name: 'Bánh Tiramisu Ý Cổ Điển',
            description: 'Hương vị cà phê nồng nàn quyện cùng lớp kem mascarpone mềm mịn.',
            price: 320000,
            categoryId: 'sinh-nhat',
            images: ['https://picsum.photos/seed/tiramisu/800/800'],
            variants: { 
              flavors: [
                { name: 'Cà phê truyền thống', sizes: [{ name: '14cm', price: 320000 }, { name: '18cm', price: 420000 }] }
              ]
            },
            isBestSeller: false,
            isFastDelivery: true,
            stock: 15,
            views: 210,
            orderCount: 25
          }
        ];
        for (const prod of demoProducts) {
          await addDoc(productsRef, {
            ...prod,
            slug: prod.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ /g, '-').replace(/[^\w-]+/g, '')
          });
        }
      }

      // Seed Banners if empty
      if (bannersSnap.empty) {
        const demoBanners = [
          {
            title: 'Ưu đãi Khai trương - Giảm 20%',
            imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=1920',
            link: '/products',
            isActive: true,
            order: 1
          },
          {
            title: 'Bánh Sinh Nhật Thiết Kế Riêng',
            imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&q=80&w=1920',
            link: '/custom-cake',
            isActive: true,
            order: 2
          }
        ];
        for (const banner of demoBanners) await addDoc(bannersRef, banner);
      }

      fetchData();
      setStatus('Khởi tạo thành công!');
    } catch (error) {
      console.error("Seed error:", error);
      setStatus('Lỗi khởi tạo.');
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="bg-red-50 p-8 rounded-3xl text-center space-y-4 max-w-md">
          <AlertCircle className="mx-auto text-red-500" size={48} />
          <h2 className="text-2xl font-bold text-red-900">Truy cập bị từ chối</h2>
          <p className="text-red-700">Bạn không có quyền quản trị viên để truy cập trang này.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'stats', label: 'Thống kê', icon: <BarChart3 size={20} /> },
    { id: 'orders', label: 'Đơn hàng', icon: <ClipboardList size={20} /> },
    { id: 'operations', label: 'Vận hành', icon: <TrendingUp size={20} /> },
    { id: 'products', label: 'Sản phẩm', icon: <ShoppingBag size={20} /> },
    { id: 'categories', label: 'Danh mục', icon: <LayoutDashboard size={20} /> },
    { id: 'banners', label: 'Banner', icon: <BannerIcon size={20} /> },
    { id: 'campaigns', label: 'Chiến dịch', icon: <Megaphone size={20} /> },
    { id: 'coupons', label: 'Mã giảm giá', icon: <Ticket size={20} /> },
    { id: 'settings', label: 'Cài đặt', icon: <Store size={20} /> },
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, images: [reader.result as string] });
      };
      reader.readAsDataURL(file);
    }
  };

  const addVariantFlavor = () => {
    const newFlavors = [...(formData.variants?.flavors || []), { name: '', sizes: [{ name: '', price: 0 }] }];
    setFormData({ 
      ...formData, 
      variants: { ...(formData.variants || {}), flavors: newFlavors } 
    });
  };

  const updateVariantFlavor = (index: number, name: string) => {
    const newFlavors = [...(formData.variants?.flavors || [])];
    newFlavors[index] = { ...newFlavors[index], name };
    setFormData({ 
      ...formData, 
      variants: { ...(formData.variants || {}), flavors: newFlavors } 
    });
  };

  const updateVariantFlavorImage = (index: number, image: string) => {
    const newFlavors = [...(formData.variants?.flavors || [])];
    newFlavors[index] = { ...newFlavors[index], image };
    setFormData({ 
      ...formData, 
      variants: { ...(formData.variants || {}), flavors: newFlavors } 
    });
  };

  const handleFlavorImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      updateVariantFlavorImage(index, reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeVariantFlavor = (index: number) => {
    const newFlavors = (formData.variants?.flavors || []).filter((_, i) => i !== index);
    setFormData({ 
      ...formData, 
      variants: { ...(formData.variants || {}), flavors: newFlavors } 
    });
  };

  const addVariantSize = (flavorIndex: number) => {
    const newFlavors = [...(formData.variants?.flavors || [])];
    newFlavors[flavorIndex].sizes = [...newFlavors[flavorIndex].sizes, { name: '', price: 0 }];
    setFormData({ 
      ...formData, 
      variants: { ...(formData.variants || {}), flavors: newFlavors } 
    });
  };

  const updateVariantSize = (flavorIndex: number, sizeIndex: number, field: 'name' | 'price', value: string | number) => {
    const newFlavors = [...(formData.variants?.flavors || [])];
    newFlavors[flavorIndex].sizes[sizeIndex] = { ...newFlavors[flavorIndex].sizes[sizeIndex], [field]: value };
    setFormData({ 
      ...formData, 
      variants: { ...(formData.variants || {}), flavors: newFlavors } 
    });
  };

  const removeVariantSize = (flavorIndex: number, sizeIndex: number) => {
    const newFlavors = [...(formData.variants?.flavors || [])];
    newFlavors[flavorIndex].sizes = newFlavors[flavorIndex].sizes.filter((_, i) => i !== sizeIndex);
    setFormData({ 
      ...formData, 
      variants: { ...(formData.variants || {}), flavors: newFlavors } 
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10 space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900">Quản trị hệ thống</h1>
          <p className="text-gray-500">Chào mừng trở lại, Quản trị viên</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={seedData}
            className="bg-orange-100 text-orange-700 px-6 py-3 rounded-2xl font-bold hover:bg-orange-200 transition-all"
          >
            Khởi tạo mẫu
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto pb-2 gap-2 no-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-orange-600 text-white shadow-lg shadow-orange-100' : 'bg-white text-gray-500 hover:bg-orange-50'}`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {status && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 ${status.includes('Lỗi') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {status.includes('Lỗi') ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          <span className="font-medium">{status}</span>
        </div>
      )}

      {/* Tab Content */}
      <div className="min-h-[60vh]">
        {activeTab === 'stats' && <StatisticsDashboard />}
        {activeTab === 'orders' && <OrderManager />}
        {activeTab === 'operations' && <OperationManager />}
        
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Quản lý Sản phẩm</h2>
              <button 
                onClick={() => { setIsAdding(true); setEditingId(null); setFormData({ name: '', price: 0, images: [''], isFastDelivery: true, stock: 10 }); setStatus(''); }}
                className="bg-orange-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-orange-700 transition-all flex items-center gap-2 shadow-lg shadow-orange-200"
              >
                <Plus size={20} />
                <span>Thêm sản phẩm</span>
              </button>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-orange-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-orange-50 border-b border-orange-100">
                      <th className="px-6 py-4 text-sm font-bold text-orange-900 uppercase tracking-wider">Sản phẩm</th>
                      <th className="px-6 py-4 text-sm font-bold text-orange-900 uppercase tracking-wider">Giá</th>
                      <th className="px-6 py-4 text-sm font-bold text-orange-900 uppercase tracking-wider">Thống kê</th>
                      <th className="px-6 py-4 text-sm font-bold text-orange-900 uppercase tracking-wider">Kho</th>
                      <th className="px-6 py-4 text-sm font-bold text-orange-900 uppercase tracking-wider text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-50">
                    {loading ? (
                      [1, 2, 3].map(i => (
                        <tr key={i} className="animate-pulse">
                          <td className="px-6 py-6"><div className="h-12 w-12 bg-gray-100 rounded-xl" /></td>
                          <td className="px-6 py-6"><div className="h-4 w-24 bg-gray-100 rounded" /></td>
                          <td className="px-6 py-6"><div className="h-4 w-16 bg-gray-100 rounded" /></td>
                          <td className="px-6 py-6"><div className="h-4 w-8 bg-gray-100 rounded" /></td>
                          <td className="px-6 py-6"><div className="h-8 w-20 bg-gray-100 rounded ml-auto" /></td>
                        </tr>
                      ))
                    ) : products.map(product => (
                      <tr key={product.id} className="hover:bg-orange-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <img src={product.images[0]} className="w-12 h-12 rounded-xl object-cover border border-orange-100" />
                            <div>
                              <p className="font-bold text-gray-900">{product.name}</p>
                              <p className="text-xs text-gray-400">{product.categoryId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-orange-600">{product.price.toLocaleString('vi-VN')}đ</p>
                          {product.salePrice && <p className="text-xs text-gray-400 line-through">{product.salePrice.toLocaleString('vi-VN')}đ</p>}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs space-y-1">
                            <p className="text-gray-500"><span className="font-bold text-gray-900">{product.views || 0}</span> lượt xem</p>
                            <p className="text-gray-500"><span className="font-bold text-gray-900">{product.orderCount || 0}</span> đơn hàng</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`font-bold ${product.stock < 5 ? 'text-red-500' : 'text-gray-700'}`}>{product.stock}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => { setEditingId(product.id!); setFormData(product); setStatus(''); setIsAdding(false); }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit size={18} />
                            </button>
                            <button 
                              onClick={() => handleDelete(product.id!)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'banners' && <BannerManager />}
        {activeTab === 'campaigns' && <CampaignManager />}
        {activeTab === 'coupons' && <CouponManager />}
        {activeTab === 'categories' && <CategoryManager />}
        {activeTab === 'settings' && <StoreSettings />}
      </div>

      {/* Product Form Modal */}
      {(isAdding || editingId) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 md:p-10 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{editingId ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}</h2>
              <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={24} />
              </button>
            </div>

            {status && (
              <div className={`p-4 mb-6 rounded-2xl flex items-center gap-3 ${status.includes('Lỗi') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                {status.includes('Lỗi') ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                <span className="font-medium">{status}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-bold text-gray-700">Tên sản phẩm</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Giá gốc (VNĐ)</label>
                <input 
                  required
                  type="number" 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Giá khuyến mãi (VNĐ)</label>
                <input 
                  type="number" 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                  value={formData.salePrice || ''}
                  onChange={e => setFormData({ ...formData, salePrice: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Danh mục</label>
                <select 
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                  value={formData.categoryId}
                  onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                >
                  <option value="">Chọn danh mục</option>
                  {categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Số lượng kho</label>
                <input 
                  required
                  type="number" 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                  value={formData.stock}
                  onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-2 col-span-2">
                <label className="text-sm font-bold text-gray-700">Hình ảnh sản phẩm</label>
                <div className="flex flex-col gap-4">
                  <div className="flex gap-4 items-center">
                    <label className="flex-grow flex items-center justify-center gap-2 px-4 py-3 bg-orange-50 border-2 border-dashed border-orange-200 rounded-xl text-orange-600 font-bold cursor-pointer hover:bg-orange-100 transition-all">
                      <Upload size={20} />
                      <span>Tải ảnh lên</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                    <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden border border-gray-200">
                      {formData.images?.[0] ? <img src={formData.images[0]} className="w-full h-full object-cover" /> : <ImageIcon size={24} className="text-gray-400" />}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Hoặc dán URL ảnh</p>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-orange-500"
                      placeholder="https://..."
                      value={formData.images?.[0]}
                      onChange={e => setFormData({ ...formData, images: [e.target.value] })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6 col-span-2 border-t border-gray-100 pt-6">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-gray-700">Vị & Kích thước & Giá</label>
                  <button 
                    type="button"
                    onClick={addVariantFlavor}
                    className="text-xs bg-orange-100 text-orange-600 px-3 py-1 rounded-lg font-bold hover:bg-orange-200"
                  >
                    + Thêm vị mới
                  </button>
                </div>
                <div className="space-y-6">
                  {(formData.variants?.flavors || []).map((flavor, fIdx) => (
                    <div key={fIdx} className="bg-gray-50 p-4 rounded-2xl space-y-4 border border-gray-100">
                      <div className="flex gap-3 items-center">
                        <div className="flex-1 space-y-3">
                          <input 
                            type="text" 
                            placeholder="Tên vị (VD: Vani, Chocolate)"
                            className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold outline-none focus:ring-1 focus:ring-orange-500"
                            value={flavor.name}
                            onChange={e => updateVariantFlavor(fIdx, e.target.value)}
                          />
                          <div className="flex gap-3 items-center">
                            <label className="flex items-center gap-2 px-3 py-1.5 bg-white border border-orange-200 rounded-lg text-orange-600 text-[10px] font-bold cursor-pointer hover:bg-orange-50 transition-all">
                              <Upload size={14} />
                              <span>Ảnh vị</span>
                              <input type="file" accept="image/*" className="hidden" onChange={e => handleFlavorImageUpload(fIdx, e)} />
                            </label>
                            <input 
                              type="text" 
                              placeholder="URL ảnh vị (tùy chọn)"
                              className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[10px] outline-none focus:ring-1 focus:ring-orange-500"
                              value={flavor.image || ''}
                              onChange={e => updateVariantFlavorImage(fIdx, e.target.value)}
                            />
                            {flavor.image && (
                              <div className="w-8 h-8 rounded-lg overflow-hidden border border-gray-200">
                                <img src={flavor.image} className="w-full h-full object-cover" />
                              </div>
                            )}
                          </div>
                        </div>
                        <button 
                          type="button"
                          onClick={() => removeVariantFlavor(fIdx)}
                          className="p-2 text-red-400 hover:text-red-600"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      
                      <div className="pl-6 space-y-3 border-l-2 border-orange-100">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Kích thước của vị này</span>
                          <button 
                            type="button"
                            onClick={() => addVariantSize(fIdx)}
                            className="text-[10px] bg-white border border-orange-200 text-orange-600 px-2 py-1 rounded-md font-bold hover:bg-orange-50"
                          >
                            + Thêm size
                          </button>
                        </div>
                        {flavor.sizes.map((size, sIdx) => (
                          <div key={sIdx} className="flex gap-3 items-center">
                            <input 
                              type="text" 
                              placeholder="Size (VD: 14cm)"
                              className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-orange-500"
                              value={size.name}
                              onChange={e => updateVariantSize(fIdx, sIdx, 'name', e.target.value)}
                            />
                            <input 
                              type="number" 
                              placeholder="Giá"
                              className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-orange-500"
                              value={size.price}
                              onChange={e => updateVariantSize(fIdx, sIdx, 'price', Number(e.target.value))}
                            />
                            <button 
                              type="button"
                              onClick={() => removeVariantSize(fIdx, sIdx)}
                              className="p-1.5 text-gray-400 hover:text-red-500"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {(formData.variants?.flavors || []).length === 0 && (
                    <p className="text-xs text-gray-400 italic">Chưa có biến thể. Giá mặc định sẽ được sử dụng.</p>
                  )}
                </div>
              </div>

              <div className="col-span-2 flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.isBestSeller} onChange={e => setFormData({ ...formData, isBestSeller: e.target.checked })} className="w-5 h-5 accent-orange-600" />
                  <span className="text-sm font-bold text-gray-700">Bán chạy nhất</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.isFastDelivery} onChange={e => setFormData({ ...formData, isFastDelivery: e.target.checked })} className="w-5 h-5 accent-orange-600" />
                  <span className="text-sm font-bold text-gray-700">Giao nhanh 1h</span>
                </label>
              </div>

              <div className="col-span-2 pt-6">
                <button type="submit" className="w-full bg-orange-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-orange-700 transition-all shadow-xl shadow-orange-200 flex items-center justify-center gap-2">
                  <Save size={20} />
                  <span>Lưu sản phẩm</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
