import React, { useState, useEffect } from 'react';
import { db, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp } from '../../firebase';
import { ImportRecord, ExpenseRecord, Order } from '../../types';
import { Plus, Edit, Trash2, Save, X, TrendingUp, TrendingDown, DollarSign, Package, Receipt, Calendar } from 'lucide-react';

const OperationManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'imports' | 'expenses' | 'profit'>('profit');
  const [imports, setImports] = useState<ImportRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  // Form states
  const [isAddingImport, setIsAddingImport] = useState(false);
  const [editingImportId, setEditingImportId] = useState<string | null>(null);
  const [importForm, setImportForm] = useState<Partial<ImportRecord>>({
    itemName: '', category: 'Nguyên liệu làm bánh', quantity: 0, unit: 'kg', unitPrice: 0, supplier: '', importDate: new Date().toISOString().split('T')[0], notes: ''
  });

  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [expenseForm, setExpenseForm] = useState<Partial<ExpenseRecord>>({
    name: '', category: 'Quảng cáo', amount: 0, expenseDate: new Date().toISOString().split('T')[0], notes: ''
  });

  // Filter state for Profit
  const [profitFilter, setProfitFilter] = useState<string>('thisMonth');

  // Generate last 12 months for the dropdown
  const generateMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${d.getFullYear()}-${d.getMonth() + 1}`; // e.g., "2026-4"
      const label = `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`;
      options.push({ value, label });
    }
    return options;
  };
  const monthOptions = generateMonthOptions();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [importsSnap, expensesSnap, ordersSnap] = await Promise.all([
        getDocs(query(collection(db, 'imports'), orderBy('importDate', 'desc'))),
        getDocs(query(collection(db, 'expenses'), orderBy('expenseDate', 'desc'))),
        getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')))
      ]);

      setImports(importsSnap.docs.map(d => ({ id: d.id, ...d.data() } as ImportRecord)));
      setExpenses(expensesSnap.docs.map(d => ({ id: d.id, ...d.data() } as ExpenseRecord)));
      setOrders(ordersSnap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
    } catch (error) {
      console.error("Error fetching operations data:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- Import Handlers ---
  const handleSaveImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Đang lưu...');
    try {
      const totalPrice = (importForm.quantity || 0) * (importForm.unitPrice || 0);
      const dataToSave = { ...importForm, totalPrice, createdAt: serverTimestamp() };

      if (editingImportId) {
        await updateDoc(doc(db, 'imports', editingImportId), dataToSave);
        setStatus('Cập nhật thành công!');
      } else {
        await addDoc(collection(db, 'imports'), dataToSave);
        setStatus('Thêm mới thành công!');
      }
      setIsAddingImport(false);
      setEditingImportId(null);
      fetchData();
      setTimeout(() => setStatus(''), 3000);
    } catch (error: any) {
      console.error("Import save error:", error);
      setStatus(`Lỗi khi lưu dữ liệu: ${error.message || 'Vui lòng thử lại'}`);
    }
  };

  const handleDeleteImport = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa phiếu nhập này?')) return;
    try {
      await deleteDoc(doc(db, 'imports', id));
      fetchData();
    } catch (error) {
      alert('Lỗi khi xóa.');
    }
  };

  // --- Expense Handlers ---
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Đang lưu...');
    try {
      const dataToSave = { ...expenseForm, createdAt: serverTimestamp() };

      if (editingExpenseId) {
        await updateDoc(doc(db, 'expenses', editingExpenseId), dataToSave);
        setStatus('Cập nhật thành công!');
      } else {
        await addDoc(collection(db, 'expenses'), dataToSave);
        setStatus('Thêm mới thành công!');
      }
      setIsAddingExpense(false);
      setEditingExpenseId(null);
      fetchData();
      setTimeout(() => setStatus(''), 3000);
    } catch (error: any) {
      console.error("Expense save error:", error);
      setStatus(`Lỗi khi lưu dữ liệu: ${error.message || 'Vui lòng thử lại'}`);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa khoản chi này?')) return;
    try {
      await deleteDoc(doc(db, 'expenses', id));
      fetchData();
    } catch (error) {
      alert('Lỗi khi xóa.');
    }
  };

  // --- Profit Calculation ---
  const getFilteredData = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let filteredOrders = orders.filter(o => o.status === 'completed' || o.status === 'delivering');
    let filteredImports = imports;
    let filteredExpenses = expenses;

    if (profitFilter === 'thisMonth') {
      filteredOrders = filteredOrders.filter(o => {
        if (!o.createdAt) return false;
        const d = o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });
      filteredImports = filteredImports.filter(i => {
        const d = new Date(i.importDate);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });
      filteredExpenses = filteredExpenses.filter(e => {
        const d = new Date(e.expenseDate);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });
    } else if (profitFilter !== 'all') {
      // Format is "YYYY-M"
      const [yearStr, monthStr] = profitFilter.split('-');
      const targetYear = parseInt(yearStr);
      const targetMonth = parseInt(monthStr) - 1; // 0-indexed
      
      filteredOrders = filteredOrders.filter(o => {
        if (!o.createdAt) return false;
        const d = o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
        return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
      });
      filteredImports = filteredImports.filter(i => {
        const d = new Date(i.importDate);
        return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
      });
      filteredExpenses = filteredExpenses.filter(e => {
        const d = new Date(e.expenseDate);
        return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
      });
    }

    const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);
    const totalImportCost = filteredImports.reduce((sum, i) => sum + i.totalPrice, 0);
    const totalOtherExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalProfit = totalRevenue - totalImportCost - totalOtherExpenses;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return { totalRevenue, totalImportCost, totalOtherExpenses, totalProfit, profitMargin };
  };

  const stats = getFilteredData();

  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className="flex gap-4 border-b border-gray-200 pb-4">
        <button
          onClick={() => setActiveTab('profit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${activeTab === 'profit' ? 'bg-orange-100 text-orange-600' : 'text-gray-500 hover:bg-gray-100'}`}
        >
          <TrendingUp size={20} /> Lợi nhuận
        </button>
        <button
          onClick={() => setActiveTab('imports')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${activeTab === 'imports' ? 'bg-orange-100 text-orange-600' : 'text-gray-500 hover:bg-gray-100'}`}
        >
          <Package size={20} /> Nhập hàng
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${activeTab === 'expenses' ? 'bg-orange-100 text-orange-600' : 'text-gray-500 hover:bg-gray-100'}`}
        >
          <Receipt size={20} /> Chi phí khác
        </button>
      </div>

      {status && (
        <div className="p-4 bg-blue-50 text-blue-700 rounded-xl font-medium">
          {status}
        </div>
      )}

      {/* PROFIT TAB */}
      {activeTab === 'profit' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-900">Báo cáo lợi nhuận</h3>
            <select 
              value={profitFilter}
              onChange={(e) => setProfitFilter(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-medium"
            >
              <option value="thisMonth">Tháng này</option>
              {monthOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
              <option value="all">Tất cả thời gian</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                  <DollarSign size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-500 uppercase">Doanh thu</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalRevenue.toLocaleString('vi-VN')}đ</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
                  <Package size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-500 uppercase">Chi phí nhập hàng</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalImportCost.toLocaleString('vi-VN')}đ</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
                  <Receipt size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-500 uppercase">Chi phí khác</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalOtherExpenses.toLocaleString('vi-VN')}đ</p>
                </div>
              </div>
            </div>

            <div className={`bg-white p-6 rounded-2xl border ${stats.totalProfit >= 0 ? 'border-green-200 shadow-green-50' : 'border-red-200 shadow-red-50'} shadow-md`}>
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stats.totalProfit >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {stats.totalProfit >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-500 uppercase">Lợi nhuận ròng</p>
                  <p className={`text-2xl font-bold ${stats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.totalProfit.toLocaleString('vi-VN')}đ
                  </p>
                </div>
              </div>
              <div className="mt-2 text-sm font-medium text-gray-500">
                Tỷ suất lợi nhuận: <span className={stats.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}>{stats.profitMargin.toFixed(2)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IMPORTS TAB */}
      {activeTab === 'imports' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-900">Lịch sử nhập hàng</h3>
            <button 
              onClick={() => { 
                setIsAddingImport(true); 
                setEditingImportId(null); 
                setImportForm({ itemName: '', category: 'Nguyên liệu làm bánh', quantity: 0, unit: 'kg', unitPrice: 0, supplier: '', importDate: new Date().toISOString().split('T')[0], notes: '' }); 
              }}
              className="bg-orange-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-orange-700 transition-all flex items-center gap-2"
            >
              <Plus size={20} /> Thêm phiếu nhập
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-4 text-sm font-bold text-gray-700">Ngày nhập</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-700">Mặt hàng</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-700">Nhóm</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-700">Số lượng</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-700">Đơn giá</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-700">Thành tiền</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-700 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {imports.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-600">{item.importDate}</td>
                      <td className="px-6 py-4 font-bold text-gray-900">{item.itemName}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.category}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{item.quantity} {item.unit}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.unitPrice.toLocaleString('vi-VN')}đ</td>
                      <td className="px-6 py-4 font-bold text-orange-600">{item.totalPrice.toLocaleString('vi-VN')}đ</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => { setEditingImportId(item.id!); setImportForm(item); setIsAddingImport(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                            <Edit size={18} />
                          </button>
                          <button onClick={() => handleDeleteImport(item.id!)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {imports.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">Chưa có dữ liệu nhập hàng</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* EXPENSES TAB */}
      {activeTab === 'expenses' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-900">Chi phí khác</h3>
            <button 
              onClick={() => { 
                setIsAddingExpense(true); 
                setEditingExpenseId(null); 
                setExpenseForm({ name: '', category: 'Quảng cáo', amount: 0, expenseDate: new Date().toISOString().split('T')[0], notes: '' }); 
              }}
              className="bg-orange-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-orange-700 transition-all flex items-center gap-2"
            >
              <Plus size={20} /> Thêm chi phí
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-4 text-sm font-bold text-gray-700">Ngày chi</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-700">Khoản chi</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-700">Nhóm</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-700">Số tiền</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-700">Ghi chú</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-700 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {expenses.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-600">{item.expenseDate}</td>
                      <td className="px-6 py-4 font-bold text-gray-900">{item.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.category}</td>
                      <td className="px-6 py-4 font-bold text-red-600">{item.amount.toLocaleString('vi-VN')}đ</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{item.notes}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => { setEditingExpenseId(item.id!); setExpenseForm(item); setIsAddingExpense(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                            <Edit size={18} />
                          </button>
                          <button onClick={() => handleDeleteExpense(item.id!)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {expenses.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Chưa có dữ liệu chi phí</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* IMPORT FORM MODAL */}
      {(isAddingImport || editingImportId) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{editingImportId ? 'Sửa phiếu nhập' : 'Thêm phiếu nhập mới'}</h2>
              <button onClick={() => { setIsAddingImport(false); setEditingImportId(null); }} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSaveImport} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Tên mặt hàng</label>
                  <input required type="text" className="w-full px-4 py-2 border rounded-xl" value={importForm.itemName} onChange={e => setImportForm({...importForm, itemName: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Nhóm hàng</label>
                  <select required className="w-full px-4 py-2 border rounded-xl" value={importForm.category} onChange={e => setImportForm({...importForm, category: e.target.value})}>
                    <option value="Nguyên liệu làm bánh">Nguyên liệu làm bánh</option>
                    <option value="Vật tư đóng gói">Vật tư đóng gói</option>
                    <option value="Phụ kiện trang trí">Phụ kiện trang trí</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Số lượng</label>
                  <input required type="number" step="0.01" className="w-full px-4 py-2 border rounded-xl" value={importForm.quantity} onChange={e => setImportForm({...importForm, quantity: Number(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Đơn vị tính</label>
                  <input required type="text" placeholder="kg, hộp, cái..." className="w-full px-4 py-2 border rounded-xl" value={importForm.unit} onChange={e => setImportForm({...importForm, unit: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Đơn giá nhập (VNĐ)</label>
                  <input required type="number" className="w-full px-4 py-2 border rounded-xl" value={importForm.unitPrice} onChange={e => setImportForm({...importForm, unitPrice: Number(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Thành tiền (Tự tính)</label>
                  <input disabled type="text" className="w-full px-4 py-2 border rounded-xl bg-gray-50 font-bold text-orange-600" value={((importForm.quantity || 0) * (importForm.unitPrice || 0)).toLocaleString('vi-VN') + 'đ'} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Ngày nhập</label>
                  <input required type="date" className="w-full px-4 py-2 border rounded-xl" value={importForm.importDate} onChange={e => setImportForm({...importForm, importDate: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Hạn sử dụng (Tùy chọn)</label>
                  <input type="date" className="w-full px-4 py-2 border rounded-xl" value={importForm.expiryDate || ''} onChange={e => setImportForm({...importForm, expiryDate: e.target.value})} />
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-sm font-bold text-gray-700">Nhà cung cấp</label>
                  <input required type="text" className="w-full px-4 py-2 border rounded-xl" value={importForm.supplier} onChange={e => setImportForm({...importForm, supplier: e.target.value})} />
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-sm font-bold text-gray-700">Ghi chú</label>
                  <textarea className="w-full px-4 py-2 border rounded-xl" rows={2} value={importForm.notes || ''} onChange={e => setImportForm({...importForm, notes: e.target.value})}></textarea>
                </div>
              </div>
              <button type="submit" className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 mt-4">
                Lưu phiếu nhập
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EXPENSE FORM MODAL */}
      {(isAddingExpense || editingExpenseId) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{editingExpenseId ? 'Sửa chi phí' : 'Thêm chi phí mới'}</h2>
              <button onClick={() => { setIsAddingExpense(false); setEditingExpenseId(null); }} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSaveExpense} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Tên khoản chi</label>
                <input required type="text" className="w-full px-4 py-2 border rounded-xl" value={expenseForm.name} onChange={e => setExpenseForm({...expenseForm, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Nhóm chi phí</label>
                <select required className="w-full px-4 py-2 border rounded-xl" value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value})}>
                  <option value="Quảng cáo">Quảng cáo (FB, TikTok...)</option>
                  <option value="Giao hàng">Ship / Giao hàng</option>
                  <option value="Mặt bằng & Điện nước">Mặt bằng & Điện nước</option>
                  <option value="Nhân sự">Nhân sự</option>
                  <option value="Máy móc & Dụng cụ">Máy móc & Dụng cụ</option>
                  <option value="Đóng gói & In ấn">Đóng gói & In ấn</option>
                  <option value="Bảo trì & Hosting">Bảo trì & Hosting</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Số tiền (VNĐ)</label>
                <input required type="number" className="w-full px-4 py-2 border rounded-xl" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: Number(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Ngày phát sinh</label>
                <input required type="date" className="w-full px-4 py-2 border rounded-xl" value={expenseForm.expenseDate} onChange={e => setExpenseForm({...expenseForm, expenseDate: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Ghi chú</label>
                <textarea className="w-full px-4 py-2 border rounded-xl" rows={3} value={expenseForm.notes || ''} onChange={e => setExpenseForm({...expenseForm, notes: e.target.value})}></textarea>
              </div>
              <button type="submit" className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 mt-4">
                Lưu chi phí
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperationManager;
