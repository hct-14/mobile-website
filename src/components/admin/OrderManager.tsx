import React, { useState, useEffect } from 'react';
import { db, collection, getDocs, doc, updateDoc, query, orderBy } from '../../firebase';
import { Order } from '../../types';
import { CheckCircle, XCircle, Clock, Truck, Package, User, Phone, MapPin, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const OrderManager: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Order['status'] | 'all'>('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
    } catch (error) {
      console.error("Fetch orders error:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (error) {
      alert("Lỗi khi cập nhật trạng thái đơn hàng.");
    }
  };

  const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'pending': return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold flex items-center gap-1"><Clock size={12} /> Chờ xử lý</span>;
      case 'confirmed': return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle size={12} /> Đã xác nhận</span>;
      case 'delivering': return <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold flex items-center gap-1"><Truck size={12} /> Đang giao</span>;
      case 'completed': return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1"><Package size={12} /> Hoàn thành</span>;
      case 'cancelled': return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold flex items-center gap-1"><XCircle size={12} /> Đã hủy</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Quản lý Đơn hàng</h2>
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {['all', 'pending', 'confirmed', 'delivering', 'completed', 'cancelled'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s as any)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${filter === s ? 'bg-orange-600 text-white shadow-md' : 'bg-white text-gray-500 hover:bg-orange-50'}`}
            >
              {s === 'all' ? 'Tất cả' : s === 'pending' ? 'Chờ xử lý' : s === 'confirmed' ? 'Đã xác nhận' : s === 'delivering' ? 'Đang giao' : s === 'completed' ? 'Hoàn thành' : 'Đã hủy'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="h-40 bg-gray-100 animate-pulse rounded-3xl" />)
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white p-12 rounded-[2.5rem] text-center border border-orange-100">
            <Package size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Không tìm thấy đơn hàng nào.</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <motion.div 
              layout
              key={order.id}
              className="bg-white rounded-[2.5rem] border border-orange-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row justify-between gap-6 mb-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-gray-900">Đơn hàng #{order.id.slice(-6).toUpperCase()}</h3>
                      {getStatusBadge(order.status)}
                    </div>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Calendar size={14} />
                      {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString('vi-VN') : 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Tổng thanh toán</p>
                    <p className="text-2xl font-bold text-orange-600">{order.total.toLocaleString('vi-VN')}đ</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Thông tin khách hàng</h4>
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-gray-900 flex items-center gap-2"><User size={14} className="text-orange-600" /> {order.contactName}</p>
                      <p className="text-sm text-gray-600 flex items-center gap-2"><Phone size={14} className="text-orange-600" /> {order.contactPhone}</p>
                      <p className="text-sm text-gray-600 flex items-center gap-2"><MapPin size={14} className="text-orange-600" /> {order.shippingAddress}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sản phẩm ({order.items.length})</h4>
                    <div className="space-y-3">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex gap-3">
                          <div className="flex-grow">
                            <p className="text-sm font-bold text-gray-900 line-clamp-1">x{item.quantity} {item.variant?.size} - {item.variant?.flavor}</p>
                            {item.message && <p className="text-[10px] text-orange-500 italic">"{item.message}"</p>}
                          </div>
                          <p className="text-sm font-bold text-gray-900">{(item.price * item.quantity).toLocaleString('vi-VN')}đ</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Thao tác</h4>
                    <div className="flex flex-wrap gap-2">
                      {order.status === 'pending' && (
                        <button 
                          onClick={() => updateOrderStatus(order.id, 'confirmed')}
                          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all"
                        >
                          Xác nhận đơn
                        </button>
                      )}
                      {order.status === 'confirmed' && (
                        <button 
                          onClick={() => updateOrderStatus(order.id, 'delivering')}
                          className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition-all"
                        >
                          Giao hàng
                        </button>
                      )}
                      {order.status === 'delivering' && (
                        <button 
                          onClick={() => updateOrderStatus(order.id, 'completed')}
                          className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-all"
                        >
                          Hoàn thành
                        </button>
                      )}
                      {['pending', 'confirmed'].includes(order.status) && (
                        <button 
                          onClick={() => updateOrderStatus(order.id, 'cancelled')}
                          className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-all"
                        >
                          Hủy đơn
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default OrderManager;
