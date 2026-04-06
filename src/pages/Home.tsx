import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Star, Clock, ShieldCheck, Heart, ArrowRight, ChevronRight, Zap, ChevronLeft } from 'lucide-react';
import { collection, getDocs, query, where, limit, orderBy } from '../firebase';
import { db } from '../firebase';
import { Product, Category, Banner, Campaign } from '../types';

const CampaignSection: React.FC<{ campaign: Campaign; allProducts: Product[] }> = ({ campaign, allProducts }) => {
  const campaignProducts = allProducts.filter(p => campaign.productIds.includes(p.id));
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 59, seconds: 59 });
  const [items, setItems] = useState<(Product & { uniqueKey: string })[]>([]);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const campaignProductsStr = JSON.stringify(campaignProducts.map(p => p.id));

  useEffect(() => {
    if (campaignProducts.length > 0) {
      let initialItems = [...campaignProducts];
      // Ensure we have enough items for smooth infinite loop (at least 8)
      while (initialItems.length < 8) {
        initialItems = [...initialItems, ...campaignProducts];
      }
      setItems(initialItems.map((item, index) => ({ ...item, uniqueKey: `${item.id}-${index}-${Date.now()}` })));
    }
  }, [campaignProductsStr]);

  useEffect(() => {
    if (isHovered || items.length === 0) return;
    const timer = setInterval(() => {
      setItems(prev => {
        const newItems = [...prev];
        const first = newItems.shift();
        if (first) {
          newItems.push({ ...first, uniqueKey: `${first.id}-${Date.now()}` });
        }
        return newItems;
      });
    }, 5000);
    return () => clearInterval(timer);
  }, [isHovered, items.length]);

  if (campaignProducts.length === 0) return null;

  return (
    <div className="bg-red-600 rounded-[2.5rem] p-6 md:p-10 space-y-8 shadow-2xl relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mt-48 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/5 rounded-full -ml-32 -mb-32 blur-2xl" />

      <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className="bg-yellow-400 p-2 rounded-xl animate-pulse">
            <Zap size={24} className="text-red-600 fill-current" />
          </div>
          <div>
            <h3 className="text-2xl md:text-3xl font-bold text-white uppercase tracking-tight flex items-center gap-3">
              {campaign.name}
            </h3>
            <p className="text-red-100 text-sm opacity-80">{campaign.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3 bg-black/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10">
            <span className="text-red-100 text-xs font-bold uppercase tracking-widest">Kết thúc trong:</span>
            <div className="flex items-center gap-2 font-mono text-xl font-bold text-white">
              <span className="bg-white/10 px-2 py-1 rounded-lg">{String(timeLeft.hours).padStart(2, '0')}</span>
              <span className="animate-pulse">:</span>
              <span className="bg-white/10 px-2 py-1 rounded-lg">{String(timeLeft.minutes).padStart(2, '0')}</span>
              <span className="animate-pulse">:</span>
              <span className="bg-white/10 px-2 py-1 rounded-lg">{String(timeLeft.seconds).padStart(2, '0')}</span>
            </div>
          </div>
          
          <Link 
            to={`/products?campaign=${campaign.id}`}
            className="hidden md:flex items-center gap-2 text-white font-bold hover:underline group"
          >
            Xem tất cả <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      <div 
        className="relative group z-10"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex gap-2 md:gap-4 overflow-hidden pb-6">
          <AnimatePresence mode="popLayout">
            {items.map(product => (
              <motion.div
                layout
                key={product.uniqueKey}
                initial={{ opacity: 0, scale: 0.8, x: 100 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: -100 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="w-[calc((100%-1rem)/3)] md:w-[calc((100%-5rem)/6)] flex-shrink-0"
              >
                <div className="bg-white rounded-xl md:rounded-3xl p-2 md:p-4 shadow-lg hover:shadow-2xl transition-all duration-500 group/card relative h-full flex flex-col">
                  <Link to={`/product/${product.id}`} className="block aspect-square rounded-lg md:rounded-2xl overflow-hidden mb-2 md:mb-4 relative">
                    <img 
                      src={product.images[0]} 
                      alt={product.name} 
                      className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-1 left-1 md:top-2 md:left-2 bg-red-600 text-white text-[8px] md:text-[10px] font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded md:rounded-lg shadow-lg">
                      Giảm {campaign.discountValue}{campaign.discountType === 'percentage' ? '%' : 'đ'}
                    </div>
                  </Link>
                  <div className="space-y-1 md:space-y-3 flex flex-col flex-grow">
                    <Link to={`/product/${product.id}`} className="font-bold text-[10px] md:text-base text-gray-900 line-clamp-2 hover:text-red-600 transition-colors leading-tight flex-grow">
                      {product.name}
                    </Link>
                    <div className="flex flex-col">
                      <span className="text-xs md:text-xl font-black text-red-600">
                        {(campaign.discountType === 'percentage' 
                          ? Math.round(product.price * (1 - campaign.discountValue / 100))
                          : Math.max(0, product.price - campaign.discountValue)).toLocaleString('vi-VN')}đ
                      </span>
                      <span className="text-[8px] md:text-xs text-gray-400 line-through">
                        {product.price.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div className="md:hidden text-center pt-4">
        <Link 
          to={`/products?campaign=${campaign.id}`}
          className="inline-flex items-center gap-2 text-white font-bold hover:underline"
        >
          Xem tất cả <ChevronRight size={20} />
        </Link>
      </div>
    </div>
  );
};

const Home: React.FC = () => {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [fastDelivery, setFastDelivery] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productsRef = collection(db, 'products');
        const categoriesRef = collection(db, 'categories');
        const bannersRef = collection(db, 'banners');
        const campaignsRef = collection(db, 'campaigns');

        const [productsSnap, categoriesSnap, bannersSnap, campaignsSnap] = await Promise.all([
          getDocs(productsRef),
          getDocs(categoriesRef),
          getDocs(query(bannersRef, where('isActive', '==', true), orderBy('order', 'asc'))),
          getDocs(query(campaignsRef, where('isActive', '==', true)))
        ]);

        const fetchedProducts = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setAllProducts(fetchedProducts);
        setBestSellers(fetchedProducts.filter(p => p.isBestSeller).slice(0, 4));
        setFastDelivery(fetchedProducts.filter(p => p.isFastDelivery).slice(0, 4));
        setCategories(categoriesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
        setBanners(bannersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Banner)));
        setCampaigns(campaignsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Campaign)));
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (banners.length > 1) {
      const timer = setInterval(() => {
        setCurrentBanner((prev) => (prev + 1) % banners.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [banners]);

  const USP = [
    { icon: <Clock className="text-orange-600" />, title: "Giao nhanh 1h", desc: "Nhận bánh tươi ngay trong 60 phút" },
    { icon: <Star className="text-orange-600" />, title: "Bánh tươi mỗi ngày", desc: "Nguyên liệu cao cấp, không chất bảo quản" },
    { icon: <ShieldCheck className="text-orange-600" />, title: "Hoàn tiền 100%", desc: "Nếu bánh không đúng mẫu hoặc hư hỏng" },
    { icon: <Heart className="text-orange-600" />, title: "Tận tâm phục vụ", desc: "Hỗ trợ khách hàng 24/7" },
  ];

  return (
    <div className="space-y-12 md:space-y-20 pb-20">
      {/* Hero Section / Banner Slider */}
      <section className="relative min-h-[70vh] md:h-[80vh] flex items-center overflow-hidden bg-orange-50 py-12 md:py-0">
        <AnimatePresence mode="wait">
          {banners.length > 0 ? (
            <motion.div 
              key={banners[currentBanner].id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute inset-0 z-0"
            >
              <img 
                src={banners[currentBanner].imageUrl} 
                alt={banners[currentBanner].title} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/30" />
            </motion.div>
          ) : (
            <div className="absolute inset-0 z-0">
              <img 
                src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=1920" 
                alt="Bakery Hero" 
                className="w-full h-full object-cover opacity-20"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-orange-50 via-orange-50/80 to-transparent" />
            </div>
          )}
        </AnimatePresence>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            key={banners[currentBanner]?.id || 'default'}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className={`max-w-2xl space-y-6 md:space-y-8 ${banners.length > 0 ? 'text-white' : ''}`}
          >
            <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider ${banners.length > 0 ? 'bg-white/20 backdrop-blur-md text-white' : 'bg-orange-100 text-orange-800'}`}>
              <Zap size={14} />
              <span>Giao nhanh trong 1 giờ</span>
            </div>
            <h1 className={`text-4xl sm:text-6xl md:text-7xl font-serif font-bold leading-[1.2] md:leading-[1.1] ${banners.length > 0 ? 'text-white' : 'text-orange-900'}`}>
              {banners.length > 0 ? banners[currentBanner].title : (
                <>
                  Bánh Sinh Nhật <br />
                  <span className="text-orange-600 italic">Tươi Mới Mỗi Ngày</span>
                </>
              )}
            </h1>
            <p className={`text-lg sm:text-xl max-w-lg leading-relaxed ${banners.length > 0 ? 'text-white/90' : 'text-gray-600'}`}>
              Khám phá bộ sưu tập bánh kem nghệ thuật, được làm từ những nguyên liệu cao cấp nhất. Đặt ngay để nhận ưu đãi đặc biệt!
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                to={banners[currentBanner]?.link || "/products"}
                className="bg-orange-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-orange-700 transition-all shadow-lg hover:shadow-orange-200 flex items-center justify-center space-x-2"
              >
                <span>Đặt bánh ngay</span>
                <ArrowRight size={20} />
              </Link>
              {!banners.length && (
                <Link 
                  to="/custom-cake" 
                  className="bg-white text-orange-600 border-2 border-orange-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-orange-50 transition-all text-center"
                >
                  Thiết kế theo yêu cầu
                </Link>
              )}
            </div>
          </motion.div>
        </div>

        {banners.length > 1 && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentBanner(i)}
                className={`w-3 h-3 rounded-full transition-all ${currentBanner === i ? 'bg-orange-600 w-8' : 'bg-white/50 hover:bg-white'}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-serif font-bold text-gray-900 mb-2">Danh mục nổi bật</h2>
            <p className="text-gray-500">Tìm kiếm chiếc bánh hoàn hảo cho mọi dịp</p>
          </div>
          <Link to="/products" className="text-orange-600 font-bold flex items-center space-x-1 hover:underline">
            <span>Xem tất cả</span>
            <ChevronRight size={20} />
          </Link>
        </div>
        <div className="grid grid-cols-5 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-6">
          {categories.length > 0 ? categories.map((cat) => (
            <Link 
              key={cat.id} 
              to={`/products?category=${cat.slug}`}
              className="group bg-white border border-orange-100 p-2 md:p-6 rounded-2xl md:rounded-3xl text-center hover:bg-orange-600 hover:border-orange-600 transition-all shadow-sm hover:shadow-xl hover:-translate-y-1 flex flex-col items-center justify-center"
            >
              <div className="w-10 h-10 md:w-16 md:h-16 bg-orange-50 rounded-xl md:rounded-2xl flex items-center justify-center mb-2 md:mb-4 group-hover:bg-white/20 transition-colors">
                <span className="text-xl md:text-3xl">{cat.icon || '🎂'}</span>
              </div>
              <h3 className="font-bold text-[10px] md:text-base text-gray-900 group-hover:text-white transition-colors line-clamp-2 leading-tight">{cat.name}</h3>
            </Link>
          )) : (
            // Skeleton or static categories if DB is empty
            ['Cho Nữ', 'Cho Nam', 'Cho Bé', 'Người Yêu', 'Kỷ Niệm'].map((name, i) => (
              <div key={i} className="bg-white border border-orange-100 p-2 md:p-6 rounded-2xl md:rounded-3xl text-center opacity-50 flex flex-col items-center justify-center">
                <div className="w-10 h-10 md:w-16 md:h-16 bg-orange-50 rounded-xl md:rounded-2xl mb-2 md:mb-4" />
                <div className="h-2 md:h-4 bg-orange-50 rounded w-2/3" />
              </div>
            ))
          )}
        </div>
      </section>

      {/* Campaigns Section */}
      {campaigns.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {campaigns.map(campaign => (
            <CampaignSection key={campaign.id} campaign={campaign} allProducts={allProducts} />
          ))}
        </section>
      )}

      {/* Products by Category */}
      {categories.map(category => {
        const categoryProducts = allProducts.filter(p => p.categoryId === category.slug).slice(0, 8);
        if (categoryProducts.length === 0) return null;

        return (
          <section key={category.id} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-end mb-6 md:mb-10">
              <div>
                <h2 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 mb-1 md:mb-2">{category.name}</h2>
                <p className="text-sm md:text-base text-gray-500">{category.description || `Khám phá các mẫu ${category.name.toLowerCase()} tuyệt đẹp`}</p>
              </div>
              <Link to={`/products?category=${category.slug}`} className="text-orange-600 font-bold flex items-center space-x-1 hover:underline text-sm md:text-base whitespace-nowrap ml-4">
                <span>Xem thêm</span>
                <ChevronRight size={16} className="md:w-5 md:h-5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8">
              {categoryProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        );
      })}

      {/* Fast Delivery Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-orange-900 rounded-[3rem] overflow-hidden relative">
          <div className="absolute inset-0 opacity-10">
            <img 
              src="https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&q=80&w=1000" 
              alt="Pattern" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="relative z-10 p-12 md:p-20 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="max-w-xl space-y-6 text-center md:text-left">
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-white leading-tight">
                Cần bánh gấp? <br />
                <span className="text-orange-400">Giao ngay trong 1 giờ!</span>
              </h2>
              <p className="text-orange-100 text-lg">
                Chúng tôi có sẵn các mẫu bánh tươi ngon nhất, sẵn sàng giao đến tận tay bạn chỉ trong 60 phút. Đừng để bữa tiệc chờ đợi!
              </p>
              <Link 
                to="/products?delivery=fast" 
                className="inline-block bg-orange-500 text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-orange-400 transition-all shadow-xl"
              >
                Đặt bánh giao nhanh
              </Link>
            </div>
            <div className="w-full max-w-md">
              <img 
                src="https://images.unsplash.com/photo-1535141192574-5d4897c12636?auto=format&fit=crop&q=80&w=800" 
                alt="Fast Delivery Cake" 
                className="rounded-3xl shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </section>

      {/* USP Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          {USP.map((item, i) => (
            <div key={i} className="text-center space-y-4">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                {React.cloneElement(item.icon as React.ReactElement, { size: 32 })}
              </div>
              <h3 className="text-xl font-bold text-gray-900">{item.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  return (
    <motion.div 
      whileHover={{ y: -10 }}
      className="group bg-white rounded-2xl md:rounded-[2rem] overflow-hidden border border-orange-50 shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col"
    >
      <Link to={`/product/${product.id}`} className="block relative aspect-square overflow-hidden">
        <img 
          src={product.images[0] || 'https://picsum.photos/seed/cake/400/400'} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-2 left-2 md:top-4 md:left-4 flex flex-col gap-1 md:gap-2">
          {product.isBestSeller && (
            <span className="bg-orange-600 text-white text-[8px] md:text-[10px] font-bold px-2 py-0.5 md:px-3 md:py-1 rounded-full uppercase tracking-widest shadow-lg">
              Bán chạy
            </span>
          )}
          {product.isFastDelivery && (
            <span className="bg-blue-600 text-white text-[8px] md:text-[10px] font-bold px-2 py-0.5 md:px-3 md:py-1 rounded-full uppercase tracking-widest shadow-lg flex items-center gap-1">
              <Zap size={8} className="md:w-[10px] md:h-[10px]" />
              Giao 1h
            </span>
          )}
        </div>
        {product.salePrice && (
          <div className="absolute top-2 right-2 md:top-4 md:right-4 bg-red-500 text-white text-[10px] md:text-xs font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded md:rounded-lg shadow-lg">
            -{Math.round((1 - product.salePrice / product.price) * 100)}%
          </div>
        )}
      </Link>
      
      <div className="p-3 md:p-6 flex flex-col flex-grow space-y-2 md:space-y-4">
        <div className="flex-grow">
          <Link to={`/product/${product.id}`} className="text-sm md:text-lg font-bold text-gray-900 hover:text-orange-600 transition-colors line-clamp-2 leading-tight">
            {product.name}
          </Link>
          <p className="text-[10px] md:text-sm text-gray-500 mt-1 line-clamp-1">Vị: {product.variants?.flavors?.[0]?.name || 'Mặc định'}</p>
        </div>

        <div className="flex items-end justify-between mt-auto">
          <div className="flex flex-col">
            {product.salePrice ? (
              <>
                <span className="text-sm md:text-xl font-bold text-orange-600">
                  {product.salePrice.toLocaleString('vi-VN')}đ
                </span>
                <span className="text-[10px] md:text-sm text-gray-400 line-through">
                  {product.price.toLocaleString('vi-VN')}đ
                </span>
              </>
            ) : (
              <span className="text-sm md:text-xl font-bold text-orange-600">
                {product.price.toLocaleString('vi-VN')}đ
              </span>
            )}
          </div>
          <button className="bg-orange-100 text-orange-600 p-2 md:p-3 rounded-xl md:rounded-2xl hover:bg-orange-600 hover:text-white transition-all shadow-sm">
            <ShoppingCart size={16} className="md:w-5 md:h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default Home;
