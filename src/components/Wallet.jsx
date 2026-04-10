import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { layThongTinVi, guiYeuCauRutTien, layLichSuRutTien } from '../services/authService';
import { Wallet, Clock, CheckCircle2, XCircle, ArrowDownCircle, Loader2, X, Building2, User, CreditCard, AlertTriangle } from 'lucide-react';

export default function WalletPage({ session, userProfile }) {
  const [vi, setVi] = useState({ so_du_cho_duyet: 0, so_du_kha_dung: 0 });
  const [lichSu, setLichSu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRutModal, setShowRutModal] = useState(false);
  const [soTien, setSoTien] = useState('');
  const [soTaiKhoan, setSoTaiKhoan] = useState('');
  const [tenNganHang, setTenNganHang] = useState('');
  const [tenChuTk, setTenChuTk] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [viRes, lichRes] = await Promise.all([
      layThongTinVi(session.user.id),
      layLichSuRutTien(session.user.id)
    ]);
    if (viRes.data) setVi(viRes.data);
    if (lichRes.data) setLichSu(lichRes.data);
    setLoading(false);
  };

  const handleRutTien = async (e) => {
    e.preventDefault();
    const amount = Number(soTien);
    
    // ✅ THÊM DÒNG NÀY: Dọn dẹp số dư gốc sạch sẽ
    const safeSoDu = Number(String(vi.so_du_kha_dung).replace(/\D/g, ""));

    if (amount < 50000) return toast.error("Số tiền rút tối thiểu là 50,000 VNĐ!");
    
    // ✅ SỬA DÒNG NÀY: Thay vi.so_du_kha_dung thành safeSoDu
    if (amount > safeSoDu) return toast.error("Số dư khả dụng không đủ!");
    
    if (!soTaiKhoan || !tenNganHang || !tenChuTk) return toast.error("Vui lòng điền đầy đủ thông tin ngân hàng!");

    setSubmitting(true);
    const { error } = await guiYeuCauRutTien(session.user.id, amount, soTaiKhoan, tenNganHang, tenChuTk);
    setSubmitting(false);

    if (error) {
      toast.error("Lỗi: " + error.message);
    } else {
      toast.success("Đã gửi yêu cầu rút tiền! Admin sẽ duyệt trong 1-2 ngày làm việc.");
      setShowRutModal(false);
      setSoTien(''); setSoTaiKhoan(''); setTenNganHang(''); setTenChuTk('');
      loadData();
    }
  };

  const HOA_HONG = 10;

  if (userProfile?.vai_tro !== 'gia_su') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-slate-500">Tính năng này chỉ dành cho Gia sư.</p>
      </div>
    );
  }

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-20">
      <div className="mx-auto max-w-3xl">

        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <Wallet className="h-8 w-8 text-blue-600" /> Ví của tôi
          </h1>
          <p className="mt-2 text-slate-500">Quản lý thu nhập và rút tiền về ngân hàng</p>
        </div>

        {/* THÔNG BÁO PHÍ HOA HỒNG */}
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700">
            Nền tảng thu <b>{HOA_HONG}% phí hoa hồng</b> trên mỗi buổi học hoàn thành. Số tiền thực nhận = Học phí × 90%.
          </p>
        </div>

        {/* SỐ DƯ */}
        <div className="grid gap-4 sm:grid-cols-2 mb-8">
          <div className="rounded-[2rem] border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-6 shadow-sm">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
              <Clock className="h-6 w-6" />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Tiền chờ duyệt</p>
            <h3 className="mt-1 text-3xl font-black text-amber-600">{Number(vi.so_du_cho_duyet || 0).toLocaleString()}<span className="text-base font-medium"> ₫</span></h3>
            <p className="mt-2 text-xs text-slate-400">Tiền từ các buổi học chưa hoàn thành</p>
          </div>

          <div className="rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Số dư khả dụng</p>
            <h3 className="mt-1 text-3xl font-black text-emerald-600">{Number(vi.so_du_kha_dung || 0).toLocaleString()}<span className="text-base font-medium"> ₫</span></h3>
            <p className="mt-2 text-xs text-slate-400">Có thể rút về ngân hàng ngay</p>
          </div>
        </div>

        {/* NÚT RÚT TIỀN */}
        <button
          onClick={() => setShowRutModal(true)}
          disabled={vi.so_du_kha_dung <= 0}
          className={`w-full mb-8 flex items-center justify-center gap-2 rounded-2xl py-4 font-bold text-white shadow-lg transition-all active:scale-95 ${vi.so_du_kha_dung > 0 ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 shadow-blue-500/30' : 'bg-slate-300 cursor-not-allowed'}`}
        >
          <ArrowDownCircle className="h-5 w-5" />
          Yêu cầu rút tiền
        </button>

        {/* LỊCH SỬ RÚT TIỀN */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
            <h3 className="text-lg font-bold text-slate-800">Lịch sử rút tiền</h3>
          </div>
          {lichSu.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {lichSu.map(item => (
                <div key={item.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="font-bold text-slate-800">{Number(item.so_tien).toLocaleString()} ₫</p>
                    <p className="text-xs text-slate-400 mt-0.5">{item.ten_ngan_hang} - {item.so_tai_khoan}</p>
                    <p className="text-xs text-slate-400">{new Date(item.created_at).toLocaleDateString('vi-VN')}</p>
                  </div>
                  <div>
                    {item.trang_thai === 'cho_duyet' && <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-600 border border-amber-200"><Clock className="h-3 w-3" /> Chờ duyệt</span>}
                    {item.trang_thai === 'da_chuyen' && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-600 border border-emerald-200"><CheckCircle2 className="h-3 w-3" /> Đã chuyển</span>}
                    {item.trang_thai === 'tu_choi' && (
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 border border-rose-200"><XCircle className="h-3 w-3" /> Từ chối</span>
                        {item.ghi_chu && <p className="text-xs text-slate-400 mt-1">{item.ghi_chu}</p>}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <ArrowDownCircle className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <p className="text-slate-500">Chưa có lịch sử rút tiền</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL RÚT TIỀN */}
      {showRutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><ArrowDownCircle className="h-5 w-5" /> Yêu cầu rút tiền</h3>
              <button onClick={() => setShowRutModal(false)} className="text-white/80 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleRutTien} className="p-6 space-y-4">
              <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-sm text-emerald-700 font-medium">
                Số dư khả dụng: <b>{Number(vi.so_du_kha_dung).toLocaleString()} ₫</b>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700">Số tiền muốn rút (VNĐ)</label>
<input 
  type="number" 
  min="50000" 
  max={Number(String(vi.so_du_kha_dung).replace(/\D/g, ""))} 
  placeholder="VD: 500000" 
  value={soTien} 
  onChange={e => setSoTien(e.target.value)} 
  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" 
  required 
/>
                <p className="mt-1 text-xs text-slate-400">Tối thiểu 50,000 ₫</p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700 flex items-center gap-1"><Building2 className="h-4 w-4" /> Tên ngân hàng</label>
                <input type="text" placeholder="VD: Vietcombank, Techcombank..." value={tenNganHang} onChange={e => setTenNganHang(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" required />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700 flex items-center gap-1"><CreditCard className="h-4 w-4" /> Số tài khoản</label>
                <input type="text" placeholder="VD: 1234567890" value={soTaiKhoan} onChange={e => setSoTaiKhoan(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" required />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700 flex items-center gap-1"><User className="h-4 w-4" /> Tên chủ tài khoản</label>
                <input type="text" placeholder="VD: NGUYEN VAN A" value={tenChuTk} onChange={e => setTenChuTk(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" required />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowRutModal(false)} className="flex-1 rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-600 hover:bg-slate-200">Hủy</button>
                <button type="submit" disabled={submitting} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-sm font-bold text-white hover:opacity-90 active:scale-95 transition-all">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowDownCircle className="h-4 w-4" />}
                  Gửi yêu cầu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }`}</style>
    </div>
  );
}