import React, { useState, useEffect } from 'react';
import { db, collection, getDocs, query, where, orderBy, limit } from '../../firebase';
import { Product, Order, ProductView } from '../../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import { TrendingUp, Users, ShoppingBag, Eye, Calendar, ArrowUpRight, ArrowDownRight, MousePointerClick } from 'lucide-react';

interface PageView {
  id: string;
  path: string;
  timestamp: any;
}

const StatisticsDashboard: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [views, setViews] = useState<ProductView[]>([]);
  const [pageViews, setPageViews] = useState<PageView[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('week');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [prodSnap, orderSnap, viewSnap, pageViewSnap] = await Promise.all([
          getDocs(collection(db, 'products')),
          getDocs(collection(db, 'orders')),
          getDocs(collection(db, 'productViews')),
          getDocs(collection(db, 'pageViews'))
        ]);

        setProducts(prodSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
        setOrders(orderSnap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
        setViews(viewSnap.docs.map(d => ({ id: d.id, ...d.data() } as ProductView)));
        setPageViews(pageViewSnap.docs.map(d => ({ id: d.id, ...d.data() } as PageView)));
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Helper to get date string from timestamp or ISO string
  const getDateStr = (val: any) => {
    if (!val) return '';
    if (typeof val === 'string') return val.split('T')[0];
    if (val.toDate && typeof val.toDate === 'function') {
      return val.toDate().toISOString().split('T')[0];
    }
    if (val.seconds) {
      return new Date(val.seconds * 1000).toISOString().split('T')[0];
    }
    return '';
  };

  // Process data for charts
  const getChartData = () => {
    const now = new Date();
    const data: any[] = [];
    
    if (timeRange === 'week') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayViews = views.filter(v => getDateStr(v.timestamp) === dateStr).length;
        const dayPageViews = pageViews.filter(v => getDateStr(v.timestamp) === dateStr).length;
        const dayOrders = orders.filter(o => getDateStr(o.createdAt) === dateStr).length;
        data.push({ name: d.toLocaleDateString('vi-VN', { weekday: 'short' }), views: dayViews, pageViews: dayPageViews, orders: dayOrders });
      }
    } else if (timeRange === 'month') {
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayViews = views.filter(v => getDateStr(v.timestamp) === dateStr).length;
        const dayPageViews = pageViews.filter(v => getDateStr(v.timestamp) === dateStr).length;
        const dayOrders = orders.filter(o => getDateStr(o.createdAt) === dateStr).length;
        data.push({ name: d.getDate().toString(), views: dayViews, pageViews: dayPageViews, orders: dayOrders });
      }
    } else if (timeRange === 'year') {
      for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(now.getMonth() - i);
        const monthYear = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
        const monthViews = views.filter(v => getDateStr(v.timestamp).startsWith(monthYear)).length;
        const monthPageViews = pageViews.filter(v => getDateStr(v.timestamp).startsWith(monthYear)).length;
        const monthOrders = orders.filter(o => getDateStr(o.createdAt).startsWith(monthYear)).length;
        data.push({ name: d.toLocaleDateString('vi-VN', { month: 'short' }), views: monthViews, pageViews: monthPageViews, orders: monthOrders });
      }
    }

    return data;
  };

  const topProducts = [...products]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 5);

  const COLORS = ['#ea580c', '#f97316', '#fb923c', '#fdba74', '#fed7aa'];

  const expectedRevenue = orders
    .filter(o => ['confirmed', 'delivering'].includes(o.status))
    .reduce((acc, o) => acc + (o.total || 0), 0);

  const actualRevenue = orders
    .filter(o => o.status === 'completed')
    .reduce((acc, o) => acc + (o.total || 0), 0);

  const stats = [
    { title: 'Lượt truy cập trang', value: pageViews.length, icon: <MousePointerClick size={24} />, color: 'bg-indigo-50 text-indigo-600', trend: '+15%', isUp: true },
    { title: 'Tổng lượt xem SP', value: views.length, icon: <Eye size={24} />, color: 'bg-blue-50 text-blue-600', trend: '+12%', isUp: true },
    { title: 'Tổng đơn hàng', value: orders.length, icon: <ShoppingBag size={24} />, color: 'bg-orange-50 text-orange-600', trend: '+5%', isUp: true },
    { title: 'Doanh thu thực tế', value: actualRevenue.toLocaleString('vi-VN') + 'đ', icon: <TrendingUp size={24} />, color: 'bg-green-50 text-green-600', trend: '+8%', isUp: true },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Thống kê & Phân tích</h2>
        <div className="flex bg-gray-100 p-1 rounded-xl">
          {(['week', 'month', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${timeRange === range ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {range === 'week' ? 'Tuần' : range === 'month' ? 'Tháng' : 'Năm'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div className={`p-3 rounded-2xl ${stat.color}`}>
                {stat.icon}
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold ${stat.isUp ? 'text-green-600' : 'text-red-600'}`}>
                {stat.isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {stat.trend}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{stat.title}</p>
              <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-8">Lượt xem & Đơn hàng</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={getChartData()}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ea580c" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="pageViews" stroke="#4f46e5" strokeWidth={3} fillOpacity={0} name="Truy cập trang" />
                <Area type="monotone" dataKey="views" stroke="#ea580c" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" name="Xem SP" />
                <Area type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={3} fillOpacity={0} name="Đơn hàng" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-8">Sản phẩm xem nhiều</h3>
          <div className="space-y-6">
            {topProducts.map((product, i) => (
              <div key={product.id} className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-grow min-w-0">
                  <p className="font-bold text-gray-900 truncate">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.views || 0} lượt xem</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-orange-600">{Math.round(((product.views || 0) / (views.length || 1)) * 100)}%</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-10 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={topProducts.map(p => ({ name: p.name, value: p.views || 0 }))}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {topProducts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsDashboard;
