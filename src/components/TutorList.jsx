import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { supabase } from '../supabaseClient';
import { guiYeuCauDatLich, getDanhSachGiaSu, getLichRanhGiaSu, getLichDaDat, taoThongBao, layDanhGiaGiaSu } from '../services/authService';
import {
  Search, BookOpen, DollarSign, CalendarDays, Clock, Users,
  CheckCircle2, XCircle, UserCheck, X, Loader2, User, 
  CreditCard, CheckCircle, Star, SlidersHorizontal, ChevronDown, GraduationCap, QrCode, Copy
} from 'lucide-react';

export default function TutorList({ session, userProfile }) {
  const navigate = useNavigate(); 
  const [tutors, setTutors] = useState([]);
  const [tutorRatings, setTutorRatings] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedKhoiDay, setSelectedKhoiDay] = useState(''); 
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
  const [paymentStep, setPaymentStep] = useState('select'); // select -> qr_scan -> processing -> success
  const [pendingBookingData, setPendingBookingData] = useState(null);

  const paymentMethods = [
    { id: 'MoMo', name: 'Ví MoMo', desc: 'Quét mã QR qua ví điện tử MoMo', icon: '💜', color: 'border-pink-200 bg-pink-50', selectedColor: 'border-pink-500 ring-2 ring-pink-500/20 bg-pink-50', textColor: 'text-pink-700' },
    { id: 'Chuyển khoản ngân hàng', name: 'Chuyển khoản / VietQR', desc: 'Quét mã VietQR bằng App Ngân hàng', icon: '🏦', color: 'border-emerald-200 bg-emerald-50', selectedColor: 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50', textColor: 'text-emerald-700' },
    { id: 'VNPay', name: 'VNPay', desc: 'Thanh toán qua cổng VNPay', icon: '💳', color: 'border-blue-200 bg-blue-50', selectedColor: 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50', textColor: 'text-blue-700' }
  ];

  useEffect(() => { fetchTutors(); }, []);

  const fetchTutors = async () => {
    setLoading(true);
    const { data, error } = await getDanhSachGiaSu();
    if (!error && data) {
      setTutors(data);
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
    if (tutor.id === session?.user?.id) return alert("Bạn không thể tự đặt lịch học của chính mình!");
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
      tong_tien: isNaN(totalPrice) ? 0 : totalPrice, trang_thai: 'cho_xac_nhan' // Trạng thái là chờ xác nhận
    };
    setPendingBookingData(bookingData); setSelectedPayment(null); setPaymentStep('select');
    setIsModalOpen(false); setShowPaymentModal(true);
  };

  // CẬP NHẬT: Bước chuyển sang quét QR (Áp dụng Cách 1 cho MoMo)
  const handleProceedToQR = async () => {
    if (!selectedPayment) return alert("Vui lòng chọn phương thức thanh toán!");
    
    if (selectedPayment === 'MoMo') {
      setPaymentStep('processing');
      const orderId = `GSPRO_${Date.now()}`; 
      
      try {
        const res = await fetch('/api/momo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: totalPrice,
            orderInfo: `Thanh toan dat lich cho gia su ${selectedTutor.ho_ten}`,
            orderId: orderId
          })
        });
        
        const data = await res.json();
        
        if (data && data.payUrl) {
          // --- THAY ĐỔI Ở ĐÂY: Mở tab mới thay vì chuyển hướng trang hiện tại ---
          window.open(data.payUrl, '_blank'); 
          // --- Chuyển Modal sang bước qr_scan để hiện nút xác nhận
          setPaymentStep('qr_scan');
        } else {
          alert('Lỗi khởi tạo MoMo: ' + (data.message || 'Không có payUrl'));
          setPaymentStep('select');
        }
      } catch (err) {
        alert('Lỗi kết nối máy chủ thanh toán MoMo!');
        setPaymentStep('select');
      }
    } else {
      // 2. Nếu chọn Chuyển khoản ngân hàng -> Hiện QR như cũ
      setPaymentStep('qr_scan');
    }
  };

  // Bước xác nhận đã chuyển khoản/thanh toán xong (Dùng chung cho cả MoMo và Ngân hàng)
  const handleConfirmTransfer = async () => {
    setPaymentStep('processing');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Giả lập độ trễ

    const { error } = await guiYeuCauDatLich(pendingBookingData);
    if (error) { alert("Lỗi đặt lịch: " + error.message); setShowPaymentModal(false); return; }
    
    try {
      await supabase.from('thong_bao').insert([{ 
        id_nguoi_dung: selectedTutor.id, 
        noi_dung: `💰 Học viên ${userProfile?.ho_ten || 'Một học viên'} đã báo cáo thanh toán thành công. Vui lòng kiểm tra và xác nhận lịch dạy!`, 
        link_den: '/dashboard' 
      }]);
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

  const thcsSubjects = ['Toán Học', 'Ngữ Văn', 'Tiếng Anh'];

  const filteredTutors = tutors.filter(tutor => {
    const textMatch = tutor.ho_ten?.toLowerCase().includes(searchTerm.toLowerCase()) || tutor.chi_tiet_gia_su?.mon_hoc?.toLowerCase().includes(searchTerm.toLowerCase());
    const subjectMatch = selectedSubject === '' || tutor.chi_tiet_gia_su?.mon_hoc === selectedSubject;
    const khoiMatch = selectedKhoiDay === '' || tutor.chi_tiet_gia_su?.khoi_day === selectedKhoiDay;
    const giaHoc = Number(tutor.chi_tiet_gia_su?.gia_tien_moi_gio || 0);
    const priceMinMatch = minPrice === '' || giaHoc >= Number(minPrice);
    const priceMaxMatch = maxPrice === '' || giaHoc <= Number(maxPrice);
    const rating = tutorRatings[tutor.id]?.avg || 0;
    const starMatch = minStar === 0 || rating >= minStar;
    return textMatch && subjectMatch && khoiMatch && priceMinMatch && priceMaxMatch && starMatch;
  });

  const hasActiveFilter = selectedSubject !== '' || selectedKhoiDay !== '' || minPrice !== '' || maxPrice !== '' || minStar > 0;

  const resetFilters = () => { setSelectedSubject(''); setSelectedKhoiDay(''); setMinPrice(''); setMaxPrice(''); setMinStar(0); setSearchTerm(''); };

  const StarDisplay = ({ avg, count }) => (
    <div className="flex items-center justify-center gap-1">
      {[1,2,3,4,5].map(s => (
        <Star key={s} className={`h-4 w-4 ${s <= Math.round(avg) ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-200'}`} />
      ))}
      <span className="text-sm font-bold text-amber-600 ml-1">{avg > 0 ? avg : 'Chưa có'}</span>
      {count > 0 && <span className="text-xs text-slate-400">({count})</span>}
    </div>
  );

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /><p className="text-sm font-medium text-gray-500">Đang tìm kiếm gia sư THCS...</p></div>
    </div>
  );

  const noiDungChuyenKhoan = `GSPRO ${userProfile?.ho_ten?.replace(/\s+/g, '').toUpperCase() || 'HOCVIEN'} LICH HOC`;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* HEADER GIỮ NGUYÊN */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-500 pb-28 pt-14">
        <div className="relative z-10 mx-auto max-w-4xl px-5 text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold text-white backdrop-blur-sm">
            <GraduationCap className="h-4 w-4" /> Luyện thi lớp 10 - Nền tảng vững chắc
          </span>
          <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-white md:text-5xl">Tìm Gia Sư Cấp 2 Phù Hợp</h1>
          <p className="mb-8 text-blue-100 md:text-lg">Đội ngũ chuyên giảng dạy Toán, Ngữ Văn, Tiếng Anh khối 6-9</p>
          
          <div className="relative mx-auto flex flex-col gap-3 sm:flex-row max-w-2xl">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Tìm tên gia sư hoặc môn học..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full rounded-xl border-2 border-white/20 bg-white py-3.5 pl-12 pr-5 text-base text-gray-800 shadow-xl outline-none placeholder:text-gray-400 focus:border-white focus:ring-4 focus:ring-white/20 transition-all" />
            </div>
            <button onClick={() => setShowFilterPanel(!showFilterPanel)} className={`flex items-center justify-center gap-2 rounded-xl border-2 px-5 py-3.5 text-sm font-bold shadow-xl transition-all ${showFilterPanel ? 'bg-white text-blue-600 border-white' : 'bg-white/20 text-white border-white/30 hover:bg-white/30'}`}>
              <SlidersHorizontal className="h-5 w-5" />
              Bộ lọc
              {hasActiveFilter && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white">!</span>}
              <ChevronDown className={`h-4 w-4 transition-transform ${showFilterPanel ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showFilterPanel && (
            <div className="mx-auto mt-4 max-w-2xl rounded-2xl bg-white p-5 shadow-2xl text-left animate-[fadeIn_0.2s_ease-out]">
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> Môn học</label>
                  <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 cursor-pointer">
                    <option value="">Tất cả 3 môn</option>
                    {thcsSubjects.map((m, i) => <option key={i} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Khối lớp</label>
                  <select value={selectedKhoiDay} onChange={e => setSelectedKhoiDay(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 cursor-pointer">
                    <option value="">Tất cả khối lớp</option>
                    <option value="6-7">Khối 6 - 7</option>
                    <option value="8-9">Khối 8 - 9</option>
                  </select>
                </div>
                <div className="md:col-span-1 sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1"><Star className="h-3.5 w-3.5" /> Sao tối thiểu</label>
                  <select value={minStar} onChange={e => setMinStar(Number(e.target.value))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 cursor-pointer">
                    <option value={0}>Tất cả đánh giá</option>
                    <option value={5}>⭐⭐⭐⭐⭐ (5 Sao)</option>
                    <option value={4}>⭐⭐⭐⭐ (Từ 4 Sao)</option>
                    <option value={3}>⭐⭐⭐ (Từ 3 Sao)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" /> Giá từ (VNĐ/h)</label>
                  <input type="number" placeholder="VD: 50000" value={minPrice} onChange={e => setMinPrice(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" /> Giá đến (VNĐ/h)</label>
                  <input type="number" placeholder="VD: 200000" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                <p className="text-sm text-slate-500">Tìm thấy <b className="text-blue-600">{filteredTutors.length}</b> gia sư phù hợp</p>
                {hasActiveFilter && <button onClick={resetFilters} className="flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100 transition-all"><X className="h-3.5 w-3.5" /> Xóa bộ lọc</button>}
              </div>
            </div>
          )}
        </div>
        <div className="absolute bottom-0 left-0 w-full leading-none z-10 pointer-events-none">
          <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-12 md:h-24 lg:h-32"><path d="M0 40L60 36.7C120 33 240 27 360 30C480 33 600 47 720 53.3C840 60 960 60 1080 53.3C1200 47 1320 33 1380 26.7L1440 20V100H1380C1320 100 1200 100 1080 100C960 100 840 100 720 100C600 100 480 100 360 100C240 100 120 100 60 100H0V40Z" fill="#F8FAFC"/></svg>
        </div>
      </section>

      {/* DANH SÁCH GIA SƯ GIỮ NGUYÊN */}
      <div className="mx-auto -mt-10 max-w-6xl px-5 pb-20 relative z-20">
        {hasActiveFilter && (
          <div className="mb-6 flex flex-wrap justify-center gap-2">
            {selectedSubject && <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1.5 text-sm font-bold text-blue-700 shadow-sm border border-blue-200"><BookOpen className="h-3.5 w-3.5" />{selectedSubject}<button onClick={() => setSelectedSubject('')}><X className="h-3.5 w-3.5 ml-1 hover:text-blue-900" /></button></span>}
            {selectedKhoiDay && <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-bold text-emerald-700 shadow-sm border border-emerald-200"><GraduationCap className="h-3.5 w-3.5" />Khối {selectedKhoiDay}<button onClick={() => setSelectedKhoiDay('')}><X className="h-3.5 w-3.5 ml-1 hover:text-emerald-900" /></button></span>}
            {minStar > 0 && <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-sm font-bold text-amber-700 shadow-sm border border-amber-200"><Star className="h-3.5 w-3.5 fill-current" />{minStar}+ sao<button onClick={() => setMinStar(0)}><X className="h-3.5 w-3.5 ml-1 hover:text-amber-900" /></button></span>}
            {minPrice && <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-200 px-3 py-1.5 text-sm font-bold text-slate-700 shadow-sm">Từ {Number(minPrice).toLocaleString()}₫<button onClick={() => setMinPrice('')}><X className="h-3.5 w-3.5 ml-1" /></button></span>}
            {maxPrice && <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-200 px-3 py-1.5 text-sm font-bold text-slate-700 shadow-sm">Đến {Number(maxPrice).toLocaleString()}₫<button onClick={() => setMaxPrice('')}><X className="h-3.5 w-3.5 ml-1" /></button></span>}
          </div>
        )}

        {filteredTutors.length === 0 ? (
          <div className="rounded-3xl bg-white py-24 text-center shadow-sm border border-gray-100 mt-10">
            <Search className="mx-auto mb-4 h-16 w-16 text-gray-200" />
            <p className="text-xl font-bold text-gray-600">Không tìm thấy gia sư nào</p>
            <p className="text-gray-400 mt-2">Hãy thử thay đổi điều kiện lọc hoặc môn học khác nhé!</p>
            {hasActiveFilter && <button onClick={resetFilters} className="mt-6 rounded-full bg-blue-50 px-6 py-2.5 font-bold text-blue-600 transition-all hover:bg-blue-100">Xóa tất cả bộ lọc</button>}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTutors.map(tutor => {
              const ratingInfo = tutorRatings[tutor.id] || { avg: 0, count: 0 };
              const chiTiet = tutor.chi_tiet_gia_su || {};
              
              return (
                <div key={tutor.id} className="group relative overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
                  <div className="h-2 w-full bg-gradient-to-r from-blue-500 to-cyan-400" />
                  <div className="flex flex-col items-center p-8 text-center">
                    <div className="mb-5 h-28 w-28 overflow-hidden rounded-full shadow-lg shadow-blue-500/20 ring-4 ring-blue-50 transition-transform duration-300 group-hover:scale-105">
                      <img src={getAvatarUrl(tutor)} alt={tutor.ho_ten} className="h-full w-full object-cover" />
                    </div>
                    
                    <h3 className="mb-2 text-xl font-black text-gray-900">{tutor.ho_ten}</h3>
                    
                    <div className="mb-4 flex gap-2">
                      <span className="rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-xs font-bold text-blue-700">{chiTiet.mon_hoc || 'Chưa cập nhật'}</span>
                      <span className="rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">Khối {chiTiet.khoi_day || '---'}</span>
                    </div>
                    
                    <div className="mb-6 w-full space-y-3 border-t border-slate-100 pt-5">
                      <StarDisplay avg={ratingInfo.avg} count={ratingInfo.count} />
                      <div className="flex items-center justify-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-rose-500" />
                        <span className="font-medium text-gray-500">Học phí:</span>
                        <span className="font-bold text-rose-600">{chiTiet.gia_tien_moi_gio ? `${Number(chiTiet.gia_tien_moi_gio).toLocaleString()} VNĐ/h` : 'Thỏa thuận'}</span>
                      </div>
                    </div>

                    <div className="mt-auto flex w-full gap-3">
                      <button onClick={() => navigate(`/tutor/${tutor.id}`)} className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white py-3 text-sm font-bold text-slate-700 transition-all hover:border-blue-500 hover:text-blue-600 active:scale-95">
                        <User className="h-4 w-4" /> Hồ Sơ
                      </button>
                      <button onClick={() => handleOpenModal(tutor)} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-lg active:scale-95">
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

      {/* MODAL ĐẶT LỊCH GIỮ NGUYÊN */}
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
                    <CreditCard className="h-4 w-4" /> Tiếp tục
                  </button>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white py-3.5 text-sm font-bold text-gray-600 hover:bg-gray-50">Đóng</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL THANH TOÁN (CẬP NHẬT CÁCH 1 CHO MOMO)                 */}
      {/* ========================================================= */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md animate-[fadeIn_0.25s_ease-out] rounded-2xl bg-white shadow-2xl overflow-hidden">
            
            {/* BƯỚC 1: CHỌN PHƯƠNG THỨC */}
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
                      <div className="flex justify-between border-t border-slate-200 pt-2 mt-2"><span className="font-bold text-slate-700">Tổng tiền</span><span className="font-black text-rose-600 text-base">{totalPrice.toLocaleString()} VNĐ</span></div>
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
                  <button onClick={handleProceedToQR} disabled={!selectedPayment} className={`w-full rounded-xl py-4 font-bold text-white transition-all active:scale-95 flex items-center justify-center gap-2 ${selectedPayment ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 shadow-lg' : 'bg-slate-300 cursor-not-allowed'}`}>
                    <QrCode className="h-5 w-5" /> Hiện mã thanh toán
                  </button>
                </div>
              </>
            )}

            {/* BƯỚC 2: HIỆN MÃ QR HOẶC CHỜ XÁC NHẬN MOMO (ĐÃ CẬP NHẬT) */}
            {paymentStep === 'qr_scan' && (
              <div className="p-6 bg-slate-50">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-black text-slate-900">
                    {selectedPayment === 'MoMo' ? 'Đang thanh toán qua MoMo' : 'Quét mã để thanh toán'}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {selectedPayment === 'MoMo' ? 'Vui lòng hoàn tất thanh toán ở tab MoMo vừa mở' : 'Mở ứng dụng Ngân hàng và quét mã'}
                  </p>
                </div>

                {/* KIỂM TRA: NẾU LÀ MOMO THÌ HIỆN ICON CHỜ, NẾU LÀ NGÂN HÀNG THÌ HIỆN MÃ QR */}
                {selectedPayment === 'MoMo' ? (
                  <div className="flex flex-col items-center justify-center py-6 mb-6">
                    <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-pink-100 text-4xl animate-pulse shadow-inner border border-pink-200">
                      💜
                    </div>
                    <p className="text-sm text-center text-slate-600 font-medium px-4">
                      Hệ thống đang chờ bạn hoàn tất giao dịch tại tab mới.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Khung chứa mã QR Ngân Hàng (Giữ nguyên cũ) */}
                    <div className="mx-auto bg-white p-3 border-2 border-slate-200 rounded-2xl w-48 h-48 mb-6 shadow-sm relative">
                       <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=MAT_KHAU_CHUYEN_KHOAN_${totalPrice}`} 
                          alt="QR Code" 
                          className="w-full h-full object-contain" 
                       />
                    </div>
    
                    {/* Thông tin chuyển khoản Ngân hàng (Giữ nguyên cũ) */}
                    <div className="bg-white p-5 rounded-2xl text-sm mb-6 space-y-3 border border-slate-200 shadow-sm">
                       <div className="flex justify-between items-center"><span className="text-slate-500">Chủ tài khoản:</span><span className="font-bold text-slate-800 uppercase">Gia Su Pro Admin</span></div>
                       <div className="flex justify-between items-center"><span className="text-slate-500">Ngân hàng:</span><span className="font-bold text-slate-800">MBBank</span></div>
                       <div className="flex justify-between items-center"><span className="text-slate-500">Số tài khoản:</span><span className="font-black tracking-wider text-slate-800">0123 456 789</span></div>
                       <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                         <span className="text-slate-500">Số tiền:</span>
                         <span className="font-black text-lg text-rose-600">{totalPrice.toLocaleString()} VNĐ</span>
                       </div>
                       <div className="pt-2 border-t border-slate-100">
                         <span className="text-slate-500 block mb-1">Nội dung chuyển khoản (Bắt buộc):</span>
                         <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-lg p-2.5">
                           <span className="font-black text-blue-700 tracking-wider">{noiDungChuyenKhoan}</span>
                           <Copy className="h-4 w-4 text-blue-400 cursor-pointer hover:text-blue-600" onClick={() => alert('Đã copy nội dung!')} />
                         </div>
                       </div>
                    </div>
                  </>
                )}

                <p className="text-xs text-center text-rose-500 font-medium mb-6 px-4">
                  *Vui lòng bấm nút bên dưới SAU KHI bạn đã {selectedPayment === 'MoMo' ? 'thanh toán' : 'chuyển khoản'} thành công.
                </p>

                <div className="flex gap-3">
                  <button onClick={() => setPaymentStep('select')} className="flex-1 py-3.5 font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-all">Quay lại</button>
                  
                  {/* NÚT XÁC NHẬN - DÙNG CHUNG CHO CẢ MOMO VÀ NGÂN HÀNG */}
                  <button onClick={handleConfirmTransfer} className="flex-[2] py-3.5 font-bold text-white bg-green-500 rounded-xl hover:bg-green-600 shadow-md shadow-green-500/20 transition-all active:scale-95">
                    {selectedPayment === 'MoMo' ? 'Tôi đã thanh toán xong' : 'Tôi đã chuyển xong'}
                  </button>
                </div>
              </div>
            )}

            {/* BƯỚC 3: ĐANG XỬ LÝ (GIỮ NGUYÊN) */}
            {paymentStep === 'processing' && (
              <div className="p-12 text-center">
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-blue-50"><Loader2 className="h-12 w-12 animate-spin text-blue-600" /></div>
                <h3 className="text-xl font-black text-slate-900 mb-2">Đang gửi yêu cầu...</h3>
                <p className="text-slate-500 text-sm">Hệ thống đang ghi nhận đặt lịch của bạn</p>
                <div className="mt-6 flex justify-center gap-2">{[0,1,2].map(i => <div key={i} className="h-2 w-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }}></div>)}</div>
              </div>
            )}

            {/* BƯỚC 4: THÀNH CÔNG VÀ CHỜ DUYỆT (GIỮ NGUYÊN) */}
            {paymentStep === 'success' && (
              <div className="p-10 text-center">
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-amber-50"><Clock className="h-14 w-14 text-amber-500" /></div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Đang chờ xác nhận!</h3>
                <p className="text-slate-500 text-sm mb-6">Yêu cầu đặt lịch đã được ghi nhận. Admin và Gia sư <b>{selectedTutor?.ho_ten}</b> sẽ kiểm tra đối soát giao dịch và duyệt lịch cho bạn trong ít phút.</p>
                
                <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 mb-6 text-sm text-left space-y-2">
                  <div className="flex justify-between"><span className="text-slate-500">Mã giao dịch</span><span className="font-bold text-amber-700">{noiDungChuyenKhoan}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Số tiền</span><span className="font-bold text-amber-700">{totalPrice.toLocaleString()} VNĐ</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Trạng thái</span><span className="font-bold text-amber-600 flex items-center gap-1"><Clock className="h-3.5 w-3.5"/> Chờ duyệt</span></div>
                </div>
                
                <button onClick={handleClosePaymentSuccess} className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 py-4 font-bold text-white shadow-lg hover:opacity-90 active:scale-95 transition-all">Xem tiến trình học</button>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }`}</style>
    </div>
  );
}