import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { supabase } from '../supabaseClient';
import { guiYeuCauDatLich, getDanhSachGiaSu, getLichRanhGiaSu, getLichDaDat, taoThongBao, congTienChoGiaSu, layDanhGiaGiaSu } from '../services/authService';
import {
  Search, BookOpen, DollarSign, CalendarDays, Clock, Users,
  CheckCircle2, XCircle, AlertTriangle, UserCheck, X, Send, Loader2, User, Filter,
  CreditCard, CheckCircle, Star, SlidersHorizontal, ChevronDown
} from 'lucide-react';

export default function TutorList({ session, userProfile }) {
  const navigate = useNavigate(); 
  const [tutors, setTutors] = useState([]);
  const [tutorRatings, setTutorRatings] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minStar, setMinStar] = useState(0);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [ngayChon, setNgayChon] = useState('');
  const [lichRanhGiaSu, setLichRanhGiaSu] = useState([]);
  const [lichDaDat, setLichDaDat] = useState([]);
  const [khungGioChon, setKhungGioChon] = useState(null);
  const [totalPrice, setTotalPrice] = useState(0);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentStep, setPaymentStep] = useState('select'); 
  const [pendingBookingData, setPendingBookingData] = useState(null);

  const paymentMethods = [
    { id: 'VNPay', name: 'VNPay', desc: 'Thanh toán qua cổng VNPay', icon: '🏦', color: 'border-blue-200 bg-blue-50', selectedColor: 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50', textColor: 'text-blue-700' },
    { id: 'MoMo', name: 'Ví MoMo', desc: 'Thanh toán qua ví điện tử MoMo', icon: '💜', color: 'border-pink-200 bg-pink-50', selectedColor: 'border-pink-500 ring-2 ring-pink-500/20 bg-pink-50', textColor: 'text-pink-700' },
    { id: 'Chuyển khoản ngân hàng', name: 'Chuyển khoản', desc: 'Chuyển khoản ngân hàng trực tiếp', icon: '🏧', color: 'border-emerald-200 bg-emerald-50', selectedColor: 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50', textColor: 'text-emerald-700' }
  ];

  useEffect(() => { fetchTutors(); }, []);

  const fetchTutors = async () => {
    setLoading(true);
    const { data, error } = await getDanhSachGiaSu();
    if (!error && data) {
      setTutors(data);
      // Load ratings cho tất cả gia sư
      const ratingsMap = {};
      await Promise.all(data.map(async (tutor) => {
        const { data: reviews } = await layDanhGiaGiaSu(tutor.id);
        if (reviews && reviews.length > 0) {
          const avg = reviews.reduce((sum, r) => sum + r.so_sao, 0) / reviews.length;
          ratingsMap[tutor.id] = { avg: parseFloat(avg.toFixed(1)), count: reviews.length };
        } else {
          ratingsMap[tutor.id] = { avg: 0, count: 0 };
        }
      }));
      setTutorRatings(ratingsMap);
    }
    setLoading(false);
  };

  const getAvatarUrl = (tutor) => {
    if (tutor.avatar_url) return tutor.avatar_url;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(tutor.ho_ten || 'User')}&background=3B82F6&color=fff&size=128&bold=true&font-size=0.4`;
  };

  const handleOpenModal = async (tutor) => {
    if (tutor.id === session.user.id) return alert("Bạn không thể tự đặt lịch học của chính mình!");
    if (userProfile?.vai_tro === 'gia_su') return alert("Chỉ có Học viên mới được đặt lịch!");
    setSelectedTutor(tutor);
    setNgayChon(''); setKhungGioChon(null); setTotalPrice(0);
    setIsModalOpen(true);
    const [resRanh, resDaDat] = await Promise.all([getLichRanhGiaSu(tutor.id), getLichDaDat(tutor.id)]);
    if (resRanh.data) setLichRanhGiaSu(resRanh.data);
    if (resDaDat.data) setLichDaDat(resDaDat.data);
  };

  const getNextDateOfWeekday = (thu) => {
    const today = new Date();
    const currentDay = today.getDay(); 
    const targetDay = thu === 8 ? 0 : thu - 1;
    let daysToAdd = (targetDay + 7 - currentDay) % 7;
    const nextDate = new Date();
    nextDate.setDate(today.getDate() + daysToAdd);
    const offset = nextDate.getTimezoneOffset();
    const localDate = new Date(nextDate.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  };

  const handleSelectSuggestedSlot = (lich) => {
    let dateStr = lich.is_lap_lai === false && lich.ngay_cu_the ? lich.ngay_cu_the.split('T')[0] : getNextDateOfWeekday(lich.thu_trong_tuan);
    const startString = `${dateStr}T${lich.gio_bat_dau}`;
    const cacLuotDat = lichDaDat.filter(dat => dat.thoi_gian_bat_dau.includes(startString));
    const soChoTrong = (lich.so_luong_toi_da || 1) - cacLuotDat.length;
    if (soChoTrong <= 0) {
      alert(`Khung giờ ngày ${new Date(dateStr).toLocaleDateString('vi-VN')} đã kín chỗ!`);
      setNgayChon(dateStr); setKhungGioChon(null); setTotalPrice(0);
      return;
    }
    setNgayChon(dateStr); setKhungGioChon(lich);
    const hocPhi = selectedTutor?.chi_tiet_gia_su?.gia_tien_moi_gio || 0;
    const start = new Date(`${dateStr}T${lich.gio_bat_dau}`);
    const end = new Date(`${dateStr}T${lich.gio_ket_thuc}`);
    setTotalPrice(((end - start) / (1000 * 60 * 60)) * hocPhi);
  };

  const handleChonKhungGio = (khung) => {
    setKhungGioChon(khung);
    const hocPhi = selectedTutor?.chi_tiet_gia_su?.gia_tien_moi_gio || 0;
    const start = new Date(`${ngayChon}T${khung.gio_bat_dau}`);
    const end = new Date(`${ngayChon}T${khung.gio_ket_thuc}`);
    setTotalPrice(((end - start) / (1000 * 60 * 60)) * hocPhi);
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!khungGioChon || !ngayChon) return alert("Vui lòng chọn ngày và khung giờ học!");
    const bookingData = {
      id_hoc_vien: session.user.id, id_gia_su: selectedTutor.id,
      thoi_gian_bat_dau: `${ngayChon}T${khungGioChon.gio_bat_dau}`,
      thoi_gian_ket_thuc: `${ngayChon}T${khungGioChon.gio_ket_thuc}`,
      tong_tien: isNaN(totalPrice) ? 0 : totalPrice, trang_thai: 'cho_xac_nhan'
    };
    setPendingBookingData(bookingData); setSelectedPayment(null); setPaymentStep('select');
    setIsModalOpen(false); setShowPaymentModal(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedPayment) return alert("Vui lòng chọn phương thức thanh toán!");
    setPaymentStep('processing');
    await new Promise(resolve => setTimeout(resolve, 2500));
    const { error } = await guiYeuCauDatLich(pendingBookingData);
    if (error) { alert("Lỗi đặt lịch: " + error.message); setShowPaymentModal(false); return; }
    await congTienChoGiaSu(selectedTutor.id, pendingBookingData.tong_tien);
    try {
      await supabase.from('thong_bao').insert([{ id_nguoi_dung: selectedTutor.id, noi_dung: `🎉 Học viên ${userProfile?.ho_ten || 'Một học viên'} vừa đặt lịch và thanh toán qua ${selectedPayment}.`, link_den: '/dashboard' }]);
    } catch (err) { console.error(err); }
    setPaymentStep('success');
  };

  const handleClosePaymentSuccess = () => {
    setShowPaymentModal(false); setPaymentStep('select');
    setPendingBookingData(null); setSelectedPayment(null);
    navigate('/dashboard');
  };

  const formatThu = (thuNum) => thuNum === 8 ? "Chủ Nhật" : `Thứ ${thuNum}`;
  const jsDate = ngayChon ? new Date(ngayChon) : null;
  const thuCuaNgayChon = jsDate ? (jsDate.getDay() === 0 ? 8 : jsDate.getDay() + 1) : null;
  const khungGioCuaNgay = lichRanhGiaSu.filter(lich => {
    if (lich.is_lap_lai === false) return (lich.ngay_cu_the ? lich.ngay_cu_the.split('T')[0] : '') === ngayChon;
    return lich.thu_trong_tuan === thuCuaNgayChon;
  });

  const tinhTrangThaiGhe = (khung) => {
    const soLuongToiDa = khung.so_luong_toi_da || 1;
    if (!ngayChon) return { soChoTrong: soLuongToiDa, isFull: false, isBookedByMe: false };
    const startString = `${ngayChon}T${khung.gio_bat_dau}`;
    const cacLuotDat = lichDaDat.filter(dat => dat.thoi_gian_bat_dau.includes(startString));
    return { soChoTrong: soLuongToiDa - cacLuotDat.length, isFull: (soLuongToiDa - cacLuotDat.length) <= 0, isBookedByMe: cacLuotDat.some(dat => dat.id_hoc_vien === session?.user?.id) };
  };

  const getSlotClasses = (khung) => {
    const trangThai = tinhTrangThaiGhe(khung);
    const isSelected = khungGioChon?.id === khung.id;
    const soLuongToiDa = khung.so_luong_toi_da || 1;
    if (trangThai.isBookedByMe) return { wrapper: 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-60', icon: <UserCheck className="mx-auto mb-1 h-4 w-4 text-gray-400" />, status: 'Bạn đã đặt', disabled: true };
    if (trangThai.isFull) return { wrapper: 'border-red-200 bg-red-50 text-red-400 cursor-not-allowed opacity-70', icon: <XCircle className="mx-auto mb-1 h-4 w-4 text-red-400" />, status: 'Đã kín chỗ', disabled: true };
    if (isSelected) return { wrapper: 'border-green-500 bg-green-50 text-green-700 ring-2 ring-green-500/20 shadow-md', icon: <CheckCircle2 className="mx-auto mb-1 h-4 w-4 text-green-600" />, status: 'Đang chọn', disabled: false };
    return { wrapper: 'border-gray-200 bg-white text-gray-700 cursor-pointer hover:border-blue-400 hover:shadow-md hover:bg-blue-50/30 transition-all', icon: <Users className="mx-auto mb-1 h-4 w-4 text-gray-400" />, status: `Còn ${trangThai.soChoTrong}/${soLuongToiDa} chỗ`, disabled: false };
  };

  const availableSubjects = Array.from(new Set(tutors.map(t => t.chi_tiet_gia_su?.mon_hoc).filter(m => m && m.trim() !== '')));

  // ===== BỘ LỌC NÂNG CAO =====
  const filteredTutors = tutors.filter(tutor => {
    const textMatch = tutor.ho_ten?.toLowerCase().includes(searchTerm.toLowerCase()) || tutor.chi_tiet_gia_su?.mon_hoc?.toLowerCase().includes(searchTerm.toLowerCase());
    const subjectMatch = selectedSubject === '' || tutor.chi_tiet_gia_su?.mon_hoc === selectedSubject;
    const giaHoc = Number(tutor.chi_tiet_gia_su?.gia_tien_moi_gio || 0);
    const priceMinMatch = minPrice === '' || giaHoc >= Number(minPrice);
    const priceMaxMatch = maxPrice === '' || giaHoc <= Number(maxPrice);
    const rating = tutorRatings[tutor.id]?.avg || 0;
    const starMatch = minStar === 0 || rating >= minStar;
    return textMatch && subjectMatch && priceMinMatch && priceMaxMatch && starMatch;
  });

  const hasActiveFilter = selectedSubject !== '' || minPrice !== '' || maxPrice !== '' || minStar > 0;

  const resetFilters = () => { setSelectedSubject(''); setMinPrice(''); setMaxPrice(''); setMinStar(0); setSearchTerm(''); };

  const StarDisplay = ({ avg, count }) => (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(s => (
        <Star key={s} className={`h-3.5 w-3.5 ${s <= Math.round(avg) ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-200'}`} />
      ))}
      <span className="text-xs font-bold text-amber-600 ml-1">{avg > 0 ? avg : 'Chưa có'}</span>
      {count > 0 && <span className="text-xs text-slate-400">({count})</span>}
    </div>
  );

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /><p className="text-sm font-medium text-gray-500">Đang tìm kiếm gia sư...</p></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-500 pb-28 pt-14">
        <div className="relative z-10 mx-auto max-w-4xl px-5 text-center">
          <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-white md:text-4xl">Tìm Kiếm Gia Sư Phù Hợp</h1>
          <p className="mb-8 text-blue-100">Lọc theo môn học, khoảng giá và đánh giá sao</p>
          
          {/* THANH TÌM KIẾM */}
          <div className="relative mx-auto flex flex-col gap-3 sm:flex-row max-w-2xl">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Tìm theo tên gia sư hoặc môn học..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full rounded-xl border-2 border-white/20 bg-white py-3.5 pl-12 pr-5 text-base text-gray-800 shadow-xl outline-none placeholder:text-gray-400 focus:border-white focus:ring-4 focus:ring-white/20 transition-all" />
            </div>
            <button onClick={() => setShowFilterPanel(!showFilterPanel)} className={`flex items-center gap-2 rounded-xl border-2 px-5 py-3.5 text-sm font-bold shadow-xl transition-all ${showFilterPanel ? 'bg-white text-blue-600 border-white' : 'bg-white/20 text-white border-white/30 hover:bg-white/30'}`}>
              <SlidersHorizontal className="h-5 w-5" />
              Bộ lọc
              {hasActiveFilter && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white">!</span>}
              <ChevronDown className={`h-4 w-4 transition-transform ${showFilterPanel ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* PANEL BỘ LỌC NÂNG CAO */}
          {showFilterPanel && (
            <div className="mx-auto mt-4 max-w-2xl rounded-2xl bg-white p-5 shadow-2xl text-left animate-[fadeIn_0.2s_ease-out]">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Lọc môn học */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> Môn học</label>
                  <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 cursor-pointer">
                    <option value="">Tất cả môn học</option>
                    {availableSubjects.map((m, i) => <option key={i} value={m}>{m}</option>)}
                  </select>
                </div>

                {/* Lọc đánh giá sao */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1"><Star className="h-3.5 w-3.5" /> Đánh giá tối thiểu</label>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2">
                    {[0,1,2,3,4,5].map(s => (
                      <button key={s} type="button" onClick={() => setMinStar(s)} className={`flex items-center justify-center rounded-lg px-2 py-1 text-xs font-bold transition-all ${minStar === s ? 'bg-amber-400 text-white shadow-sm' : 'text-slate-400 hover:text-amber-400'}`}>
                        {s === 0 ? 'Tất cả' : <><Star className="h-3 w-3 fill-current mr-0.5" />{s}+</>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lọc giá từ */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" /> Giá từ (VNĐ/h)</label>
                  <input type="number" placeholder="VD: 50000" value={minPrice} onChange={e => setMinPrice(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" />
                </div>

                {/* Lọc giá đến */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" /> Giá đến (VNĐ/h)</label>
                  <input type="number" placeholder="VD: 200000" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-slate-500">Tìm thấy <b className="text-blue-600">{filteredTutors.length}</b> gia sư phù hợp</p>
                {hasActiveFilter && (
                  <button onClick={resetFilters} className="flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100 transition-all">
                    <X className="h-3.5 w-3.5" /> Xóa bộ lọc
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="absolute bottom-0 left-0 w-full leading-none z-10 pointer-events-none">
          <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-12 md:h-24 lg:h-32"><path d="M0 40L60 36.7C120 33 240 27 360 30C480 33 600 47 720 53.3C840 60 960 60 1080 53.3C1200 47 1320 33 1380 26.7L1440 20V100H1380C1320 100 1200 100 1080 100C960 100 840 100 720 100C600 100 480 100 360 100C240 100 120 100 60 100H0V40Z" fill="#F8FAFC"/></svg>
        </div>
      </section>

      {/* DANH SÁCH GIA SƯ */}
      <div className="mx-auto -mt-10 max-w-6xl px-5 pb-20 relative z-20">
        {/* ACTIVE FILTERS TAGS */}
        {hasActiveFilter && (
          <div className="mb-4 flex flex-wrap gap-2">
            {selectedSubject && <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700"><BookOpen className="h-3 w-3" />{selectedSubject}<button onClick={() => setSelectedSubject('')}><X className="h-3 w-3 ml-1" /></button></span>}
            {minStar > 0 && <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700"><Star className="h-3 w-3 fill-current" />{minStar}+ sao<button onClick={() => setMinStar(0)}><X className="h-3 w-3 ml-1" /></button></span>}
            {minPrice && <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">Từ {Number(minPrice).toLocaleString()}₫<button onClick={() => setMinPrice('')}><X className="h-3 w-3 ml-1" /></button></span>}
            {maxPrice && <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">Đến {Number(maxPrice).toLocaleString()}₫<button onClick={() => setMaxPrice('')}><X className="h-3 w-3 ml-1" /></button></span>}
          </div>
        )}

        {filteredTutors.length === 0 ? (
          <div className="rounded-2xl bg-white py-20 text-center shadow-sm border border-gray-100">
            <Search className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <p className="text-lg font-semibold text-gray-500">Không tìm thấy gia sư nào</p>
            <p className="text-sm text-gray-400 mt-1">Thử thay đổi bộ lọc để tìm thêm gia sư</p>
            {hasActiveFilter && <button onClick={resetFilters} className="mt-4 text-blue-600 font-bold hover:underline">Xóa tất cả bộ lọc</button>}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTutors.map(tutor => {
              const ratingInfo = tutorRatings[tutor.id] || { avg: 0, count: 0 };
              return (
                <div key={tutor.id} className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-blue-100">
                  <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-cyan-400" />
                  <div className="flex flex-col items-center p-7 text-center">
                    <div className="mb-4 h-24 w-24 overflow-hidden rounded-full shadow-lg shadow-blue-500/20 ring-4 ring-blue-50 transition-transform duration-300 group-hover:scale-105">
                      <img src={getAvatarUrl(tutor)} alt={tutor.ho_ten} className="h-full w-full object-cover" />
                    </div>
                    <h3 className="mb-1 text-xl font-bold text-gray-900">{tutor.ho_ten}</h3>
                    
                    {/* ĐÁNH GIÁ SAO */}
                    <div className="mb-3">
                      <StarDisplay avg={ratingInfo.avg} count={ratingInfo.count} />
                    </div>

                    <div className="mb-6 w-full space-y-2.5">
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                        <BookOpen className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">Môn dạy:</span>
                        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">{tutor.chi_tiet_gia_su?.mon_hoc || 'Chưa cập nhật'}</span>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                        <DollarSign className="h-4 w-4 text-emerald-500" />
                        <span className="font-medium">Học phí:</span>
                        <span className="font-bold text-emerald-600">{tutor.chi_tiet_gia_su?.gia_tien_moi_gio ? `${Number(tutor.chi_tiet_gia_su.gia_tien_moi_gio).toLocaleString()} VNĐ/h` : 'Thỏa thuận'}</span>
                      </div>
                    </div>

                    <div className="mt-auto flex w-full gap-3">
                      <button onClick={() => navigate(`/tutor/${tutor.id}`)} className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-blue-100 bg-blue-50 py-2.5 text-sm font-bold text-blue-600 transition-all hover:border-blue-200 hover:bg-blue-100 active:scale-95">
                        <User className="h-4 w-4" /> Hồ Sơ
                      </button>
                      <button onClick={() => handleOpenModal(tutor)} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-lg active:scale-95">
                        <CalendarDays className="h-4 w-4" /> Đặt Lịch
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL ĐẶT LỊCH */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md animate-[fadeIn_0.25s_ease-out] rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="relative bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-5 text-center text-white shrink-0">
              <button type="button" onClick={() => setIsModalOpen(false)} className="absolute right-3 top-3 rounded-full p-1.5 text-white/70 hover:bg-white/20"><X className="h-5 w-5" /></button>
              <div className="mx-auto mb-2 h-16 w-16 overflow-hidden rounded-full border-2 border-white/40 shadow-lg">
                <img src={selectedTutor ? getAvatarUrl(selectedTutor) : ''} alt="" className="h-full w-full object-cover" />
              </div>
              <h3 className="text-lg font-bold">Đặt lịch với {selectedTutor?.ho_ten}</h3>
            </div>
            <div className="overflow-y-auto p-6 flex flex-col gap-5">
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                <h4 className="mb-3 text-sm font-bold text-blue-800 flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Lịch sẵn của gia sư:</h4>
                {lichRanhGiaSu.length > 0 ? (
                  <ul className="space-y-2 text-sm">
                    {lichRanhGiaSu.map(lich => {
                      const isMatched = khungGioChon?.id === lich.id;
                      return (
                        <li key={lich.id} onClick={() => handleSelectSuggestedSlot(lich)} className={`flex items-center gap-2 p-3 rounded-lg border shadow-sm cursor-pointer transition-all ${isMatched ? 'border-green-500 bg-green-50 ring-2 ring-green-500/20' : 'border-blue-100/50 bg-white hover:border-blue-300 hover:bg-blue-50'}`}>
                          <CheckCircle2 className={`h-4 w-4 shrink-0 ${isMatched ? 'text-green-600' : 'text-emerald-500'}`} />
                          <span className={`font-bold ${isMatched ? 'text-green-700' : 'text-gray-800'}`}>{lich.is_lap_lai === false && lich.ngay_cu_the ? `Ngày ${new Date(lich.ngay_cu_the).toLocaleDateString('vi-VN')}` : `${formatThu(lich.thu_trong_tuan)} hàng tuần`}</span>
                          <span className={`text-xs ${isMatched ? 'text-green-600' : 'text-gray-500'}`}>({lich.gio_bat_dau.substring(0,5)} - {lich.gio_ket_thuc.substring(0,5)})</span>
                        </li>
                      );
                    })}
                  </ul>
                ) : <p className="text-sm text-gray-500 italic">Gia sư chưa thiết lập lịch rảnh nào.</p>}
              </div>

              <form onSubmit={handleBooking} className="flex flex-col gap-5">
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-bold text-blue-600"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-extrabold text-blue-700">1</span>Hoặc tự chọn ngày học</label>
                  <input type="date" required min={new Date().toISOString().split('T')[0]} value={ngayChon} onChange={e => { setNgayChon(e.target.value); setKhungGioChon(null); setTotalPrice(0); }} className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" />
                </div>
                {ngayChon && (
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-bold text-blue-600"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-extrabold text-blue-700">2</span>Xác nhận khung giờ</label>
                    {khungGioCuaNgay.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3">
                        {khungGioCuaNgay.map(khung => {
                          const slot = getSlotClasses(khung);
                          return (
                            <div key={khung.id} onClick={() => !slot.disabled && handleChonKhungGio(khung)} className={`rounded-xl border-2 p-3 text-center transition-all duration-200 ${slot.wrapper}`}>
                              {slot.icon}
                              <div className="text-sm font-bold">{khung.gio_bat_dau.substring(0,5)} - {khung.gio_ket_thuc.substring(0,5)}</div>
                              <div className="mt-1 text-xs font-semibold">{slot.status}</div>
                            </div>
                          );
                        })}
                      </div>
                    ) : <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"><XCircle className="h-4 w-4 shrink-0" />Không có lịch rảnh.</div>}
                  </div>
                )}
                {khungGioChon && (
                  <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 mt-2">
                    <div className="flex items-center gap-2 text-sm font-bold text-blue-700"><DollarSign className="h-5 w-5" />Tổng cộng</div>
                    <span className="text-xl font-extrabold text-rose-600">{totalPrice.toLocaleString()} VNĐ</span>
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={!khungGioChon} className={'flex flex-1 items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white shadow-md transition-all ' + (khungGioChon ? 'bg-green-500 hover:bg-green-600 active:scale-[0.98]' : 'cursor-not-allowed bg-gray-300')}>
                    <CreditCard className="h-4 w-4" /> Tiến hành thanh toán
                  </button>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white py-3.5 text-sm font-bold text-gray-600 hover:bg-gray-50">Đóng</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL THANH TOÁN */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md animate-[fadeIn_0.25s_ease-out] rounded-2xl bg-white shadow-2xl overflow-hidden">
            {paymentStep === 'select' && (
              <>
                <div className="bg-gradient-to-r from-indigo-600 to-blue-500 px-6 py-5 text-white">
                  <button onClick={() => { setShowPaymentModal(false); setIsModalOpen(true); }} className="absolute right-3 top-3 rounded-full p-1.5 text-white/70 hover:bg-white/20"><X className="h-5 w-5" /></button>
                  <div className="flex items-center gap-3 mb-1"><CreditCard className="h-6 w-6" /><h3 className="text-lg font-bold">Thanh toán</h3></div>
                  <p className="text-sm text-blue-100">Chọn phương thức thanh toán phù hợp</p>
                </div>
                <div className="p-6 space-y-4">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Thông tin đặt lịch</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-slate-500">Gia sư</span><span className="font-bold text-slate-800">{selectedTutor?.ho_ten}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Ngày học</span><span className="font-bold text-slate-800">{ngayChon ? new Date(ngayChon).toLocaleDateString('vi-VN') : ''}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Giờ học</span><span className="font-bold text-slate-800">{khungGioChon?.gio_bat_dau?.substring(0,5)} - {khungGioChon?.gio_ket_thuc?.substring(0,5)}</span></div>
                      <div className="flex justify-between pt-2 border-t border-slate-200"><span className="font-bold text-slate-700">Tổng tiền</span><span className="font-black text-rose-600 text-base">{totalPrice.toLocaleString()} VNĐ</span></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm font-bold text-slate-700">Phương thức thanh toán</p>
                    {paymentMethods.map(method => (
                      <div key={method.id} onClick={() => setSelectedPayment(method.id)} className={`flex items-center gap-4 rounded-xl border-2 p-4 cursor-pointer transition-all ${selectedPayment === method.id ? method.selectedColor : method.color + ' hover:opacity-80'}`}>
                        <span className="text-2xl">{method.icon}</span>
                        <div className="flex-1"><p className={`font-bold text-sm ${method.textColor}`}>{method.name}</p><p className="text-xs text-slate-500">{method.desc}</p></div>
                        <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${selectedPayment === method.id ? 'border-blue-500 bg-blue-500' : 'border-slate-300'}`}>
                          {selectedPayment === method.id && <div className="h-2 w-2 rounded-full bg-white"></div>}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={handleConfirmPayment} disabled={!selectedPayment} className={`w-full rounded-xl py-4 font-bold text-white transition-all active:scale-95 flex items-center justify-center gap-2 ${selectedPayment ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 shadow-lg' : 'bg-slate-300 cursor-not-allowed'}`}>
                    <CreditCard className="h-5 w-5" /> Xác nhận thanh toán {totalPrice.toLocaleString()} VNĐ
                  </button>
                </div>
              </>
            )}
            {paymentStep === 'processing' && (
              <div className="p-12 text-center">
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-blue-50"><Loader2 className="h-12 w-12 animate-spin text-blue-600" /></div>
                <h3 className="text-xl font-black text-slate-900 mb-2">Đang xử lý thanh toán</h3>
                <p className="text-slate-500 text-sm">Vui lòng không đóng trang này...</p>
                <div className="mt-6 flex justify-center gap-2">{[0,1,2].map(i => <div key={i} className="h-2 w-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }}></div>)}</div>
              </div>
            )}
            {paymentStep === 'success' && (
              <div className="p-10 text-center">
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50"><CheckCircle className="h-14 w-14 text-emerald-500" /></div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Thanh toán thành công!</h3>
                <p className="text-slate-500 text-sm mb-6">Yêu cầu đặt lịch đã được gửi đến <b>{selectedTutor?.ho_ten}</b>.</p>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 mb-6 text-sm text-left space-y-2">
                  <div className="flex justify-between"><span className="text-slate-500">Phương thức</span><span className="font-bold text-emerald-700">{selectedPayment}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Số tiền</span><span className="font-bold text-emerald-700">{totalPrice.toLocaleString()} VNĐ</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Trạng thái</span><span className="font-bold text-emerald-700">✅ Đã thanh toán</span></div>
                </div>
                <button onClick={handleClosePaymentSuccess} className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 py-4 font-bold text-white shadow-lg hover:opacity-90 active:scale-95 transition-all">Xem lịch học của tôi</button>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }`}</style>
    </div>
  );
}