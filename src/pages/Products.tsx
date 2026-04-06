import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy } from '../firebase';
import { db } from '../firebase';
import { Product, Category } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, ShoppingCart, Search, SlidersHorizontal, ChevronDown, Zap, ChevronRight } from 'lucide-react';

const Products: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const categoryFilter = searchParams.get('category');
  const sortFilter = searchParams.get('sort');
  const deliveryFilter = searchParams.get('delivery');
  const campaignFilter = searchParams.get('campaign');

  const [campaignTitle, setCampaignTitle] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const categoriesRef = collection(db, 'categories');
        const catsSnap = await getDocs(categoriesRef);
        setCategories(catsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));

        let productsRef = collection(db, 'products');
        let q = query(productsRef);

        if (categoryFilter) {
          q = query(productsRef, where('categoryId', '==', categoryFilter));
        }

        const productsSnap = await getDocs(q);
        let fetchedProducts = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));

        if (campaignFilter) {
          const campaignsRef = collection(db, 'campaigns');
          const campaignSnap = await getDocs(query(campaignsRef, where('isActive', '==', true)));
          const activeCampaigns = campaignSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
          const selectedCampaign = activeCampaigns.find(c => c.id === campaignFilter);
          
          if (selectedCampaign && selectedCampaign.productIds) {
            setCampaignTitle(selectedCampaign.name);
            fetchedProducts = fetchedProducts.filter(p => selectedCampaign.productIds.includes(p.id))
              .map(p => ({
                ...p,
                salePrice: selectedCampaign.discountType === 'percentage' 
                  ? Math.round(p.price * (1 - selectedCampaign.discountValue / 100))
                  : Math.max(0, p.price - selectedCampaign.discountValue)
              }));
          }
        } else {
          setCampaignTitle(null);
        }

        // Client-side filtering/sorting for simplicity
        if (deliveryFilter === 'fast') {
          fetchedProducts = fetchedProducts.filter(p => p.isFastDelivery);
        }

        if (sortFilter === 'best-seller') {
          fetchedProducts = fetchedProducts.filter(p => p.isBestSeller);
        }

        if (searchTerm) {
          fetchedProducts = fetchedProducts.filter(p => 
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.description.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }

        setProducts(fetchedProducts);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [categoryFilter, sortFilter, deliveryFilter, searchTerm]);

  useEffect(() => {
    if (searchTerm.trim().length >= 2) {
      const filtered = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 6);
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchTerm, products]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCategoryChange = (slug: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (slug) newParams.set('category', slug);
    else newParams.delete('category');
    setSearchParams(newParams);
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="bg-orange-50 pt-10 md:pt-12 pb-16 md:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3 md:space-y-4">
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-orange-900">
            {campaignTitle || (categoryFilter ? categories.find(c => c.slug === categoryFilter)?.name : 'Tất cả sản phẩm')}
          </h1>
          <p className="text-sm md:text-base text-gray-600 max-w-xl mx-auto">
            Khám phá thế giới bánh ngọt đầy màu sắc và hương vị. Mỗi chiếc bánh là một tác phẩm nghệ thuật dành riêng cho bạn.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 md:-mt-10">
        <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-xl border border-orange-100 p-4 md:p-8">
          {/* Toolbar */}
          <div className="flex flex-col md:flex-row gap-6 justify-between items-center mb-10">
            <div className="relative w-full md:w-96" ref={searchRef}>
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="text" 
                placeholder="Tìm kiếm bánh..."
                className="w-full pl-12 pr-4 py-3 bg-orange-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 transition-all outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => searchTerm.length >= 2 && setShowSuggestions(true)}
              />

              {/* Suggestions Dropdown */}
              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-orange-100 overflow-hidden"
                  >
                    <div className="p-2">
                      {suggestions.map((product) => (
                        <button
                          key={product.id}
                          onClick={() => {
                            navigate(`/product/${product.id}`);
                            setShowSuggestions(false);
                            setSearchTerm('');
                          }}
                          className="w-full flex items-center gap-4 p-3 hover:bg-orange-50 rounded-xl transition-colors text-left group"
                        >
                          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-orange-100">
                            <img 
                              src={product.images[0] || 'https://picsum.photos/seed/cake/100/100'} 
                              alt={product.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 truncate group-hover:text-orange-600 transition-colors">
                              {product.name}
                            </h4>
                            <p className="text-xs text-orange-600 font-bold">
                              {product.salePrice ? product.salePrice.toLocaleString('vi-VN') : product.price.toLocaleString('vi-VN')}đ
                            </p>
                          </div>
                          <ChevronRight size={16} className="text-gray-300 group-hover:text-orange-600 transition-colors" />
                        </button>
                      ))}
                    </div>
                    <div className="bg-orange-50 p-3 text-center border-t border-orange-100">
                      <button 
                        onClick={() => setShowSuggestions(false)}
                        className="text-xs font-bold text-orange-600 hover:underline"
                      >
                        Xem tất cả kết quả cho "{searchTerm}"
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center space-x-4 w-full md:w-auto">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="flex-1 md:flex-none flex items-center justify-center space-x-2 bg-white border border-orange-200 px-6 py-3 rounded-2xl font-bold text-gray-700 hover:bg-orange-50 transition-all"
              >
                <SlidersHorizontal size={20} />
                <span>Bộ lọc</span>
              </button>
              <div className="relative flex-1 md:flex-none">
                <select 
                  className="w-full appearance-none bg-white border border-orange-200 px-6 py-3 pr-12 rounded-2xl font-bold text-gray-700 hover:bg-orange-50 transition-all outline-none cursor-pointer"
                  onChange={(e) => {
                    const newParams = new URLSearchParams(searchParams);
                    if (e.target.value) newParams.set('sort', e.target.value);
                    else newParams.delete('sort');
                    setSearchParams(newParams);
                  }}
                >
                  <option value="">Sắp xếp mặc định</option>
                  <option value="best-seller">Bán chạy nhất</option>
                  <option value="price-asc">Giá thấp đến cao</option>
                  <option value="price-desc">Giá cao đến thấp</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
              </div>
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-b border-orange-100 mb-10"
              >
                <div className="pb-10 grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div>
                    <h3 className="font-bold text-gray-900 mb-4">Danh mục</h3>
                    <div className="flex flex-wrap gap-2">
                      <button 
                        onClick={() => handleCategoryChange(null)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${!categoryFilter ? 'bg-orange-600 text-white' : 'bg-orange-50 text-gray-600 hover:bg-orange-100'}`}
                      >
                        Tất cả
                      </button>
                      {categories.map(cat => (
                        <button 
                          key={cat.id}
                          onClick={() => handleCategoryChange(cat.slug)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${categoryFilter === cat.slug ? 'bg-orange-600 text-white' : 'bg-orange-50 text-gray-600 hover:bg-orange-100'}`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-4">Giao hàng</h3>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          const newParams = new URLSearchParams(searchParams);
                          if (deliveryFilter === 'fast') newParams.delete('delivery');
                          else newParams.set('delivery', 'fast');
                          setSearchParams(newParams);
                        }}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center space-x-2 ${deliveryFilter === 'fast' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                      >
                        <Zap size={16} />
                        <span>Giao nhanh 1h</span>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Product Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="bg-white rounded-3xl overflow-hidden border border-orange-50 shadow-sm animate-pulse">
                  <div className="aspect-square bg-orange-50" />
                  <div className="p-6 space-y-4">
                    <div className="h-6 bg-orange-50 rounded w-3/4" />
                    <div className="h-4 bg-orange-50 rounded w-1/2" />
                    <div className="h-10 bg-orange-50 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 space-y-4">
              <div className="text-6xl">🍰</div>
              <h3 className="text-xl font-bold text-gray-900">Không tìm thấy sản phẩm nào</h3>
              <p className="text-gray-500">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
              <button 
                onClick={() => setSearchParams({})}
                className="text-orange-600 font-bold hover:underline"
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -10 }}
      className="group bg-white rounded-[2rem] overflow-hidden border border-orange-50 shadow-sm hover:shadow-2xl transition-all duration-500"
    >
      <Link to={`/product/${product.id}`} className="block relative aspect-square overflow-hidden">
        <img 
          src={product.images[0] || 'https://picsum.photos/seed/cake/400/400'} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {product.isBestSeller && (
            <span className="bg-orange-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
              Bán chạy
            </span>
          )}
          {product.isFastDelivery && (
            <span className="bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg flex items-center gap-1">
              <Zap size={10} />
              Giao 1h
            </span>
          )}
        </div>
      </Link>
      
      <div className="p-6 space-y-4">
        <div>
          <Link to={`/product/${product.id}`} className="text-lg font-bold text-gray-900 hover:text-orange-600 transition-colors line-clamp-1">
            {product.name}
          </Link>
          <p className="text-sm text-gray-500 mt-1 line-clamp-1">Vị: {product.variants?.flavors?.[0]?.name || 'Mặc định'}</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            {product.salePrice ? (
              <>
                <span className="text-xl font-bold text-orange-600">
                  {product.salePrice.toLocaleString('vi-VN')}đ
                </span>
                <span className="text-sm text-gray-400 line-through">
                  {product.price.toLocaleString('vi-VN')}đ
                </span>
              </>
            ) : (
              <span className="text-xl font-bold text-orange-600">
                {product.price.toLocaleString('vi-VN')}đ
              </span>
            )}
          </div>
          <button className="bg-orange-100 text-orange-600 p-3 rounded-2xl hover:bg-orange-600 hover:text-white transition-all shadow-sm">
            <ShoppingCart size={20} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default Products;
