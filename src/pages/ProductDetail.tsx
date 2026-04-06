import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { db, doc, getDoc, updateDoc, increment, addDoc, collection } from '../firebase';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { ShoppingCart, ChevronLeft, Star, Clock, Truck, ShieldCheck, Minus, Plus, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedFlavor, setSelectedFlavor] = useState('');
  const [activeImage, setActiveImage] = useState('');
  const [message, setMessage] = useState('');
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as Product;
          setProduct(data);
          if (data.variants?.flavors?.length) {
            const firstFlavor = data.variants.flavors[0];
            setSelectedFlavor(firstFlavor.name);
            if (firstFlavor.image) {
              setActiveImage(firstFlavor.image);
            } else {
              setActiveImage(data.images[0]);
            }
            if (firstFlavor.sizes?.length) {
              setSelectedSize(firstFlavor.sizes[0].name);
            }
          } else {
            setActiveImage(data.images[0]);
          }
          
          // Track view
          await updateDoc(docRef, { views: increment(1) });
          await addDoc(collection(db, 'productViews'), {
            productId: id,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-10 space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Không tìm thấy sản phẩm</h2>
        <Link to="/products" className="text-orange-600 font-bold flex items-center gap-2">
          <ChevronLeft size={20} /> Quay lại cửa hàng
        </Link>
      </div>
    );
  }

  const getPrice = () => {
    if (!product) return 0;
    if (product?.variants?.flavors) {
      const flavor = product.variants.flavors.find(f => f.name === selectedFlavor);
      if (flavor) {
        const size = flavor.sizes?.find(s => s.name === selectedSize);
        if (size) return size.price;
      }
    }
    return product.salePrice || product.price;
  };

  const handleFlavorChange = (flavorName: string) => {
    setSelectedFlavor(flavorName);
    const flavor = product?.variants?.flavors?.find(f => f.name === flavorName);
    if (flavor) {
      if (flavor.image) {
        setActiveImage(flavor.image);
      }
      if (flavor.sizes && flavor.sizes.length > 0) {
        setSelectedSize(flavor.sizes[0].name);
      }
    }
  };

  const handleAddToCart = (redirect = false) => {
    addToCart({
      productId: product.id,
      product,
      quantity,
      price: getPrice(),
      variant: { size: selectedSize, flavor: selectedFlavor },
      message: message.trim()
    });
    if (redirect) {
      navigate('/checkout');
    } else {
      alert('Đã thêm vào giỏ hàng!');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
      <Link to="/products" className="inline-flex items-center gap-2 text-gray-500 hover:text-orange-600 font-bold mb-6 transition-colors">
        <ChevronLeft size={20} /> Quay lại danh sách
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Image Gallery */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-5 space-y-4"
        >
          <div className="aspect-square rounded-[3rem] overflow-hidden bg-gray-100 border border-gray-100 shadow-xl shadow-orange-50 relative">
            <img src={activeImage || product.images[0]} alt={product.name} className="w-full h-full object-cover" />
            <div className="absolute top-6 left-6 flex flex-col items-start gap-2">
              {product.isBestSeller && <span className="bg-orange-600 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg">Bán chạy nhất</span>}
              {product.isFastDelivery && <span className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg">Giao nhanh 1h</span>}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {product.images.map((img, i) => (
              <div 
                key={i} 
                onClick={() => setActiveImage(img)}
                className={`aspect-square rounded-2xl overflow-hidden border-2 cursor-pointer transition-all ${activeImage === img ? 'border-orange-600' : 'border-transparent hover:border-orange-600'}`}
              >
                <img src={img} className="w-full h-full object-cover" />
              </div>
            ))}
            {product.variants?.flavors.filter(f => f.image).map((flavor, i) => (
              <div 
                key={`flavor-${i}`} 
                onClick={() => { setActiveImage(flavor.image!); setSelectedFlavor(flavor.name); }}
                className={`aspect-square rounded-2xl overflow-hidden border-2 cursor-pointer transition-all ${activeImage === flavor.image ? 'border-orange-600' : 'border-transparent hover:border-orange-600'}`}
              >
                <img src={flavor.image} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Product Info */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-7 space-y-6"
        >
          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 leading-tight">{product.name}</h1>
            <div className="flex items-center gap-4">
              <div className="flex text-yellow-400">
                {[1, 2, 3, 4, 5].map(i => <Star key={i} size={16} fill="currentColor" />)}
              </div>
              <span className="text-sm text-gray-400 font-medium">(120 đánh giá)</span>
              <span className="text-sm text-gray-400 font-medium">|</span>
              <span className="text-sm text-gray-400 font-medium">{product.views || 0} lượt xem</span>
            </div>
          </div>

          <div className="flex items-baseline gap-4">
            <span className="text-3xl font-bold text-orange-600">{getPrice().toLocaleString('vi-VN')}đ</span>
            {product.salePrice && !product.variants?.flavors?.some(f => f.sizes?.some(s => s.price)) && (
              <span className="text-lg text-gray-300 line-through font-medium">{product.price.toLocaleString('vi-VN')}đ</span>
            )}
          </div>

          <div className="space-y-6 pt-4 border-t border-gray-100">
            {/* Variants */}
            {product.variants?.flavors && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-900 uppercase tracking-widest">Hương vị</label>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.flavors.map((flavor, index) => (
                      <button
                        key={`flavor-${flavor.name}-${index}`}
                        onClick={() => handleFlavorChange(flavor.name)}
                        className={`px-4 py-2 rounded-xl font-bold text-sm transition-all border-2 ${selectedFlavor === flavor.name ? 'border-orange-600 bg-orange-50 text-orange-600' : 'border-gray-100 text-gray-500 hover:border-orange-200'}`}
                      >
                        {flavor.name}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedFlavor && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-900 uppercase tracking-widest">Kích thước</label>
                    <div className="flex flex-wrap gap-2">
                      {product?.variants?.flavors?.find(f => f.name === selectedFlavor)?.sizes.map((size, index) => (
                        <button
                          key={`size-${size.name}-${index}`}
                          onClick={() => setSelectedSize(size.name)}
                          className={`px-4 py-2 rounded-xl font-bold text-sm transition-all border-2 flex flex-col items-center ${selectedSize === size.name ? 'border-orange-600 bg-orange-50 text-orange-600' : 'border-gray-100 text-gray-500 hover:border-orange-200'}`}
                        >
                          <span>{size.name}</span>
                          <span className="text-[10px] opacity-70">{size.price.toLocaleString('vi-VN')}đ</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="pt-4">
              <label className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-2 block">Mô tả sản phẩm</label>
              <p className="text-gray-600 leading-relaxed text-sm">
                {product.description || 'Sản phẩm bánh ngọt cao cấp được làm từ những nguyên liệu tươi ngon nhất, đảm bảo hương vị đặc trưng và chất lượng tuyệt hảo cho mọi bữa tiệc.'}
              </p>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-900 uppercase tracking-widest">Lời chúc trên bánh (Tùy chọn)</label>
              <input 
                type="text" 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ví dụ: Chúc mừng sinh nhật bé Bi!"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-orange-600 focus:ring-0 outline-none transition-all font-medium text-sm"
              />
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-900 uppercase tracking-widest">Số lượng</label>
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-100">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-white rounded-lg transition-colors text-gray-500"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-10 text-center font-bold">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(Math.min(2, quantity + 1))}
                    className="p-2 hover:bg-white rounded-lg transition-colors text-gray-500"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <p className="text-xs text-gray-400 font-medium">Còn {product.stock || 0} sản phẩm</p>
              </div>
              <p className="text-[10px] text-red-500 font-medium italic">* Mỗi đơn hàng tối đa 2 bánh</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6">
            <button 
              onClick={() => handleAddToCart(false)}
              className="flex-grow bg-white text-orange-600 border-2 border-orange-600 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-orange-50 transition-all active:scale-95"
            >
              <ShoppingCart size={20} />
              Thêm vào giỏ hàng
            </button>
            <button 
              onClick={() => handleAddToCart(true)}
              className="flex-grow bg-orange-600 text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-100 hover:bg-orange-700 transition-all active:scale-95"
            >
              Đặt hàng ngay
            </button>
            <button className="p-3.5 bg-white border-2 border-gray-100 rounded-2xl text-gray-400 hover:text-red-500 hover:border-red-100 transition-all">
              <Heart size={20} />
            </button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-3 pt-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mx-auto">
                <Truck size={24} />
              </div>
              <p className="text-[10px] font-bold text-gray-900 uppercase tracking-wider">Giao hàng nhanh</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                <Clock size={24} />
              </div>
              <p className="text-[10px] font-bold text-gray-900 uppercase tracking-wider">Hỗ trợ 24/7</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mx-auto">
                <ShieldCheck size={24} />
              </div>
              <p className="text-[10px] font-bold text-gray-900 uppercase tracking-wider">Bảo đảm chất lượng</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProductDetail;
