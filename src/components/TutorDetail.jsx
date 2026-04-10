import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { getLichRanhGiaSu, getLichDaDat, guiYeuCauDatLich, layDanhGiaGiaSu, guiDanhGia, taoThongBao, congTienChoGiaSu } from '../services/authService'; 
import {
  ArrowLeft, BookOpen, DollarSign, CalendarDays, Clock, User,
  GraduationCap, MapPin, Mail, Loader2, CheckCircle2, Users,
  Send, X, UserCheck, XCircle, AlertTriangle, Star, MessageSquareQuote,
  CreditCard, Smartphone, Building2, CheckCircle
} from 'lucide-react';

export default function TutorDetail({ session, userProfile }) {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [tutor, setTutor] = useState(null);
  const [lichRanh, setLichRanh] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ngayChon, setNgayChon] = useState('');
  const [lichDaDat, setLichDaDat] = useState([]);
  const [khungGioChon, setKhungGioChon] = useState(null);
  const [totalPrice, setTotalPrice] = useState(0);

  const [reviews, setReviews] = useState([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  // ===== STATE THANH TOÁN MỚI =====
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentStep, setPaymentStep] = useState('select'); // 'select' | 'processing' | 'success'
  const [pendingBookingData, setPendingBookingData] = useState(null);

  useEffect(() => {
    const fetchTutorDetails = async () => {
      setLoading(true);
      
      const { data: tutorData, error: tutorError } = await supabase
        .from('nguoi_dung')
        .select(`*, chi_tiet_gia_su (mon_hoc, gia_tien_moi_gio, gioi_thieu)`)
        .eq('id', id)
        .single();

      if (tutorError) {
        console.error("Lỗi tải thông tin:", tutorError);
        setLoading(false);
        return;
      }
      
      setTutor(tutorData);

      const [resLich, resDanhGia] = await Promise.all([
        getLichRanhGiaSu(id),
        layDanhGiaGiaSu(id)
      ]);
      
      if (resLich.data) setLichRanh(resLich.data);
      if (resDanhGia.data) setReviews(resDanhGia.data);
      
      setLoading(false);
    };

    fetchTutorDetails();
  }, [id]);

  const getAvatarUrl = (tutorObj) => {
    const url = tutorObj?.avatar_url; 
    if (url) return url;
    const name = encodeURIComponent(tutorObj?.ho_ten || 'User');
    return `https://ui-avatars.com/api/?name=${name}&background=3B82F6&color=fff&size=256&bold=true`;
  };

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, curr) => acc + curr.so_sao, 0) / reviews.length).toFixed(1) 
    : 0;

  const handleOpenModal = async () => {
    if (tutor.id === session.user.id) return toast.error("Bạn không thể tự đặt lịch học của chính mình!");
    if (userProfile?.vai_tro === 'gia_su') return toast.error("Chỉ có Học viên mới được đặt lịch!");

    setNgayChon('');
    setKhungGioChon(null);
    setTotalPrice(0);
    setIsModalOpen(true);

    const { data } = await getLichDaDat(tutor.id);
    if (data) setLichDaDat(data);
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
    let dateStr = '';
    if (lich.is_lap_lai === false && lich.ngay_cu_the) {
      dateStr = lich.ngay_cu_the.split('T')[0];
    } else {
      dateStr = getNextDateOfWeekday(lich.thu_trong_tuan);
    }

    const startString = `${dateStr}T${lich.gio_bat_dau}`;
    const cacLuotDat = lichDaDat.filter(dat => dat.thoi_gian_bat_dau.includes(startString));
    const soChoTrong = (lich.so_luong_toi_da || 1) - cacLuotDat.length;
    
    if (soChoTrong <= 0) {
      toast.error(`Khung giờ ngày ${new Date(dateStr).toLocaleDateString('vi-VN')} đã kín chỗ!`);
      setNgayChon(dateStr); 
      setKhungGioChon(null);
      setTotalPrice(0);
      return;
    }

    setNgayChon(dateStr);
    setKhungGioChon(lich);
    
    const hocPhi = tutor?.chi_tiet_gia_su?.gia_tien_moi_gio || 0;
    const start = new Date(`${dateStr}T${lich.gio_bat_dau}`);
    const end = new Date(`${dateStr}T${lich.gio_ket_thuc}`);
    setTotalPrice(((end - start) / (1000 * 60 * 60)) * hocPhi);
  };

  const handleChonKhungGio = (khung) => {
    setKhungGioChon(khung);
    const hocPhi = tutor?.chi_tiet_gia_su?.gia_tien_moi_gio || 0;
    const start = new Date(`${ngayChon}T${khung.gio_bat_dau}`);
    const end = new Date(`${ngayChon}T${khung.gio_ket_thuc}`);
    setTotalPrice(((end - start) / (1000 * 60 * 60)) * hocPhi);
  };

  // ===== XỬ LÝ ĐẶT LỊCH → MỞ MODAL THANH TOÁN =====
  const handleBooking = async (e) => {
    e.preventDefault();
    if (!khungGioChon || !ngayChon) return toast.error("Vui lòng chọn ngày và khung giờ học!");

    const bookingData = {
      id_hoc_vien: session.user.id,
      id_gia_su: id,
      thoi_gian_bat_dau: `${ngayChon}T${khungGioChon.gio_bat_dau}`,
      thoi_gian_ket_thuc: `${ngayChon}T${khungGioChon.gio_ket_thuc}`,
      tong_tien: isNaN(totalPrice) ? 0 : totalPrice,
      trang_thai: 'cho_xac_nhan'
    };

    // Lưu lại bookingData rồi mở modal thanh toán
    setPendingBookingData(bookingData);
    setSelectedPayment(null);
    setPaymentStep('select');
    setIsModalOpen(false);
    setShowPaymentModal(true);
  };

  // ===== XỬ LÝ THANH TOÁN =====
  const handleConfirmPayment = async () => {
    if (!selectedPayment) return toast.error("Vui lòng chọn phương thức thanh toán!");

    // Bước 1: Chuyển sang màn hình đang xử lý
    setPaymentStep('processing');

    // Bước 2: Giả lập 2.5 giây xử lý
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Bước 3: Lưu booking vào DB
    const { error } = await guiYeuCauDatLich(pendingBookingData);
    if (error) {
      toast.error("Lỗi đặt lịch: " + error.message);
      setShowPaymentModal(false);
      return;
    }

    // ✅ ĐÃ THÊM: Cộng tiền chờ duyệt cho gia sư
    await congTienChoGiaSu(id, pendingBookingData.tong_tien);

    // Bước 4: Gửi thông báo cho gia sư
    const tenHocVien = userProfile?.ho_ten || 'Một học viên';
    try {
      await supabase.from('thong_bao').insert([{
        id_nguoi_dung: id,
        noi_dung: `🎉 Học viên ${tenHocVien} vừa đặt lịch học và đã thanh toán qua ${selectedPayment}.`,
        link_den: '/dashboard'
      }]);
    } catch (err) { console.error(err); }

    // Bước 5: Hiện màn hình thành công
    setPaymentStep('success');
  };

  const handleClosePaymentSuccess = () => {
    setShowPaymentModal(false);
    setPaymentStep('select');
    setPendingBookingData(null);
    setSelectedPayment(null);
    navigate('/dashboard');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return toast.error("Vui lòng nhập nội dung đánh giá!");

    const newReview = {
      id_gia_su: tutor.id,
      id_hoc_vien: session.user.id,
      so_sao: rating,
      nhan_xet: comment 
    };

    const { data, error } = await guiDanhGia(newReview);
    if (!error && data) {
      toast.success("Cảm ơn bạn đã đánh giá Gia sư!");
      const reviewToRender = {
        ...data[0],
        hoc_vien: { ho_ten: userProfile.ho_ten, avatar_url: userProfile.avatar_url }
      };
      setReviews([reviewToRender, ...reviews]);
      setIsReviewModalOpen(false);
      setComment('');
      setRating(5);
    } else {
      toast.error("Lỗi khi gửi đánh giá: " + error.message);
    }
  };

  const formatThu = (thuNum) => thuNum === 8 ? "Chủ Nhật" : `Thứ ${thuNum}`;
  const jsDate = ngayChon ? new Date(ngayChon) : null;
  const thuCuaNgayChon = jsDate ? (jsDate.getDay() === 0 ? 8 : jsDate.getDay() + 1) : null;
  
  const khungGioCuaNgay = lichRanh.filter(lich => {
    if (lich.is_lap_lai === false) {
      const ngayDB = lich.ngay_cu_the ? lich.ngay_cu_the.split('T')[0] : '';
      return ngayDB === ngayChon;
    }
    return lich.thu_trong_tuan === thuCuaNgayChon;
  });

  const getSlotClasses = (khung) => {
    const soLuongToiDa = khung.so_luong_toi_da || 1;
    if (!ngayChon) return { wrapper: '', icon: null, status: '', disabled: false };

    const startString = `${ngayChon}T${khung.gio_bat_dau}`;
    const cacLuotDat = lichDaDat.filter(dat => dat.thoi_gian_bat_dau.includes(startString));
    const soChoTrong = soLuongToiDa - cacLuotDat.length;
    const isBookedByMe = cacLuotDat.some(dat => dat.id_hoc_vien === session?.user?.id);
    const isSelected = khungGioChon?.id === khung.id;
    const isFull = soChoTrong <= 0;

    if (isBookedByMe) return { wrapper: 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-60', icon: <UserCheck className="mx-auto mb-1 h-4 w-4 text-gray-400" />, status: 'Bạn đã đặt', disabled: true };
    if (isFull) return { wrapper: 'border-red-200 bg-red-50 text-red-400 cursor-not-allowed opacity-70', icon: <XCircle className="mx-auto mb-1 h-4 w-4 text-red-400" />, status: 'Đã kín chỗ', disabled: true };
    if (isSelected) return { wrapper: 'border-green-500 bg-green-50 text-green-700 ring-2 ring-green-500/20 shadow-md', icon: <CheckCircle2 className="mx-auto mb-1 h-4 w-4 text-green-600" />, status: 'Đang chọn', disabled: false };
    return { wrapper: 'border-gray-200 bg-white text-gray-700 cursor-pointer hover:border-blue-400 hover:shadow-md hover:bg-blue-50/30 transition-all', icon: <Users className="mx-auto mb-1 h-4 w-4 text-gray-400" />, status: `Còn ${soChoTrong}/${soLuongToiDa} chỗ`, disabled: false };
  };

  const paymentMethods = [
    {
      id: 'VNPay',
      name: 'VNPay',
      desc: 'Thanh toán qua cổng VNPay',
      icon: '🏦',
      color: 'border-blue-200 bg-blue-50',
      selectedColor: 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50',
      textColor: 'text-blue-700'
    },
    {
      id: 'MoMo',
      name: 'Ví MoMo',
      desc: 'Thanh toán qua ví điện tử MoMo',
      icon: '💜',
      color: 'border-pink-200 bg-pink-50',
      selectedColor: 'border-pink-500 ring-2 ring-pink-500/20 bg-pink-50',
      textColor: 'text-pink-700'
    },
    {
      id: 'Chuyển khoản ngân hàng',
      name: 'Chuyển khoản',
      desc: 'Chuyển khoản ngân hàng trực tiếp',
      icon: '🏧',
      color: 'border-emerald-200 bg-emerald-50',
      selectedColor: 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50',
      textColor: 'text-emerald-700'
    }
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-sm font-medium text-slate-500">Đang tải hồ sơ gia sư...</p>
        </div>
      </div>
    );
  }

  if (!tutor) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <h2 className="mb-2 text-2xl font-bold text-slate-800">Không tìm thấy gia sư</h2>
        <p className="mb-6 text-slate-500">Hồ sơ này có thể không tồn tại hoặc đã bị xóa.</p>
        <button onClick={() => navigate('/tutors')} className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-white transition-all hover:bg-blue-700">
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <section className="relative h-64 w-full overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
        <button 
          onClick={() => navigate(-1)}
          className="absolute left-6 top-6 flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/30"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </button>
      </section>

      <div className="mx-auto -mt-24 max-w-5xl px-4 sm:px-6 relative z-10">
        <div className="grid gap-8 md:grid-cols-3">
          
          <div className="space-y-6">
            <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 text-center shadow-xl shadow-slate-200/50">
              <div className="mx-auto -mt-20 mb-4 h-32 w-32 overflow-hidden rounded-[2rem] border-8 border-white bg-slate-100 shadow-lg">
                <img src={getAvatarUrl(tutor)} alt={tutor.ho_ten} className="h-full w-full object-cover" />
              </div>
              <h1 className="mb-1 text-2xl font-black text-slate-900">{tutor.ho_ten}</h1>
              <div className="mb-6 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600 uppercase tracking-wider">
                <GraduationCap className="h-4 w-4" /> Gia Sư Nền Tảng
              </div>

              <div className="flex flex-col gap-3 text-left text-sm text-slate-600 mb-6">
                {tutor.dia_chi && (
                  <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                    <MapPin className="h-5 w-5 text-slate-400 shrink-0" />
                    <span>{tutor.dia_chi}</span>
                  </div>
                )}
                {tutor.email && (
                  <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                    <Mail className="h-5 w-5 text-slate-400 shrink-0" />
                    <span className="truncate">{tutor.email}</span>
                  </div>
                )}
              </div>

              <button 
                onClick={handleOpenModal}
                className="w-full rounded-2xl bg-blue-600 py-4 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:bg-blue-700 active:scale-95 flex items-center justify-center gap-2"
              >
                <CalendarDays className="h-5 w-5" />
                Đặt Lịch Học Ngay
              </button>
            </div>

            <div className="rounded-[2rem] border border-amber-100 bg-amber-50/50 p-6 text-center">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-amber-600">Đánh giá chung</p>
              <div className="flex items-center justify-center gap-2">
                <Star className="h-8 w-8 fill-current text-amber-500" />
                <p className="text-4xl font-black text-amber-600">{avgRating}</p>
              </div>
              <p className="mt-2 text-sm font-medium text-amber-700/70">Dựa trên {reviews.length} nhận xét</p>
            </div>

            <div className="rounded-[2rem] border border-emerald-100 bg-emerald-50 p-6 text-center">
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-emerald-600">Học phí đề xuất</p>
              <p className="text-3xl font-black text-emerald-700">
                {tutor.chi_tiet_gia_su?.gia_tien_moi_gio ? `${Number(tutor.chi_tiet_gia_su.gia_tien_moi_gio).toLocaleString()}` : 'Thỏa thuận'}
                <span className="text-base font-medium"> ₫/h</span>
              </p>
            </div>
          </div>

          <div className="md:col-span-2 space-y-8">
            <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm">
              <h2 className="mb-6 flex items-center gap-3 text-xl font-black text-slate-900">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600"><User className="h-5 w-5" /></div>
                Hồ sơ giảng dạy
              </h2>
              <div className="mb-8">
                <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-slate-400">Môn học phụ trách</h3>
                <div className="inline-flex items-center gap-2 rounded-2xl bg-blue-50 px-5 py-3 text-blue-700 font-bold">
                  <BookOpen className="h-5 w-5" />
                  {tutor.chi_tiet_gia_su?.mon_hoc || 'Đang cập nhật'}
                </div>
              </div>
              <div>
                <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-slate-400">Giới thiệu bản thân & Kinh nghiệm</h3>
                <div className="rounded-2xl bg-slate-50 p-6 text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {tutor.chi_tiet_gia_su?.gioi_thieu || "Gia sư này chưa cập nhật phần giới thiệu bản thân."}
                </div>
              </div>
            </div>

            <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="flex items-center gap-3 text-xl font-black text-slate-900">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-600"><CalendarDays className="h-5 w-5" /></div>
                  Khung giờ có thể dạy
                </h2>
              </div>
              {lichRanh.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {lichRanh.map((lich) => (
                    <div key={lich.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4 transition-all hover:border-cyan-200 hover:bg-cyan-50/30">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-white shadow-sm text-cyan-600 font-black">
                          <span className="text-[10px] uppercase text-slate-400">Thứ</span>
                          {lich.thu_trong_tuan}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{lich.gio_bat_dau.substring(0, 5)} - {lich.gio_ket_thuc.substring(0, 5)}</p>
                          <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5"><Users className="h-3 w-3" /> Tối đa {lich.so_luong_toi_da} HS</p>
                        </div>
                      </div>
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 opacity-50" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center">
                  <Clock className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                  <p className="font-medium text-slate-500">Gia sư chưa thiết lập lịch rảnh.</p>
                </div>
              )}
            </div>

            <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="flex items-center gap-3 text-xl font-black text-slate-900">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-500"><Star className="h-5 w-5 fill-current" /></div>
                  Đánh giá từ Học viên
                </h2>
                {userProfile?.vai_tro === 'hoc_vien' && (
                  <button onClick={() => setIsReviewModalOpen(true)} className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-200">
                    <MessageSquareQuote className="h-4 w-4" /> Viết đánh giá
                  </button>
                )}
              </div>
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((rv) => (
                    <div key={rv.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img src={getAvatarUrl(rv.hoc_vien)} alt="Học viên" className="h-10 w-10 rounded-full border border-slate-200 object-cover" />
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{rv.hoc_vien?.ho_ten || 'Học viên ẩn danh'}</p>
                            <p className="text-xs text-slate-400">{new Date(rv.created_at).toLocaleDateString('vi-VN')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 rounded-lg bg-amber-100 px-2 py-1 text-amber-600">
                          <span className="text-sm font-black">{rv.so_sao}</span>
                          <Star className="h-3 w-3 fill-current" />
                        </div>
                      </div>
                      <p className="text-sm text-slate-700">{rv.nhan_xet}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center">
                  <Star className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                  <p className="font-medium text-slate-500">Chưa có đánh giá nào cho Gia sư này.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ============ MODAL ĐẶT LỊCH ============ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md animate-[fadeIn_0.25s_ease-out] rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="relative bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-5 text-center text-white shrink-0">
              <button type="button" onClick={() => setIsModalOpen(false)} className="absolute right-3 top-3 rounded-full p-1.5 text-white/70 transition-colors hover:bg-white/20 hover:text-white">
                <X className="h-5 w-5" />
              </button>
              <div className="mx-auto mb-2 h-16 w-16 overflow-hidden rounded-full border-2 border-white/40 shadow-lg">
                <img src={getAvatarUrl(tutor)} alt={tutor.ho_ten} className="h-full w-full object-cover" />
              </div>
              <h3 className="text-lg font-bold">Đặt lịch với {tutor.ho_ten}</h3>
              <p className="mt-1 text-sm text-blue-100">Chọn ngày và khung giờ học phù hợp</p>
            </div>
            
            <div className="overflow-y-auto p-6 flex flex-col gap-5">
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                <h4 className="mb-3 text-sm font-bold text-blue-800 flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Lịch sẵn của gia sư:</h4>
                {lichRanh.length > 0 ? (
                  <ul className="space-y-2 text-sm text-gray-700">
                    {lichRanh.map((lich) => {
                      const isMatched = khungGioChon?.id === lich.id;
                      return (
                        <li key={lich.id} onClick={() => handleSelectSuggestedSlot(lich)} className={`flex items-center gap-2 p-3 rounded-lg border shadow-sm cursor-pointer transition-all ${isMatched ? 'border-green-500 bg-green-50 ring-2 ring-green-500/20' : 'border-blue-100/50 bg-white hover:border-blue-300 hover:bg-blue-50'}`}>
                          <CheckCircle2 className={`h-4 w-4 shrink-0 ${isMatched ? 'text-green-600' : 'text-emerald-500'}`} />
                          <span className={`font-bold ${isMatched ? 'text-green-700' : 'text-gray-800'}`}>
                            {lich.is_lap_lai === false && lich.ngay_cu_the ? `Ngày ${new Date(lich.ngay_cu_the).toLocaleDateString('vi-VN')}` : `${formatThu(lich.thu_trong_tuan)} hàng tuần`}
                          </span>
                          <span className={`text-xs ${isMatched ? 'text-green-600' : 'text-gray-500'}`}>({lich.gio_bat_dau.substring(0, 5)} - {lich.gio_ket_thuc.substring(0, 5)})</span>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 italic">Gia sư chưa thiết lập lịch rảnh nào.</p>
                )}
              </div>

              <form onSubmit={handleBooking} className="flex flex-col gap-5">
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-bold text-blue-600"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-extrabold text-blue-700">1</span>Hoặc tự chọn ngày học</label>
                  <input type="date" required min={new Date().toISOString().split('T')[0]} value={ngayChon} onChange={e => { setNgayChon(e.target.value); setKhungGioChon(null); setTotalPrice(0); }} className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-800 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10" />
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
                              <div className="text-sm font-bold">{khung.gio_bat_dau.substring(0, 5)} - {khung.gio_ket_thuc.substring(0, 5)}</div>
                              <div className="mt-1 text-xs font-semibold">{slot.status}</div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                        <XCircle className="h-4 w-4 shrink-0" />Không có lịch rảnh vào ngày này.
                      </div>
                    )}
                  </div>
                )}

                {khungGioChon && (
                  <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 mt-2">
                    <div className="flex items-center gap-2 text-sm font-bold text-blue-700"><DollarSign className="h-5 w-5" />Tổng cộng</div>
                    <span className="text-xl font-extrabold text-rose-600">{totalPrice.toLocaleString()} VNĐ</span>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={!khungGioChon} className={'flex flex-1 items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white shadow-md transition-all ' + (khungGioChon ? 'bg-green-500 hover:bg-green-600 hover:shadow-lg active:scale-[0.98]' : 'cursor-not-allowed bg-gray-300')}>
                    <CreditCard className="h-4 w-4" /> Tiến hành thanh toán
                  </button>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white py-3.5 text-sm font-bold text-gray-600 hover:bg-gray-50">
                    Đóng
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ============ MODAL THANH TOÁN ============ */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md animate-[fadeIn_0.25s_ease-out] rounded-2xl bg-white shadow-2xl overflow-hidden">

            {/* ===== BƯỚC 1: CHỌN PHƯƠNG THỨC ===== */}
            {paymentStep === 'select' && (
              <>
                <div className="bg-gradient-to-r from-indigo-600 to-blue-500 px-6 py-5 text-white">
                  <button onClick={() => { setShowPaymentModal(false); setIsModalOpen(true); }} className="absolute right-3 top-3 rounded-full p-1.5 text-white/70 hover:bg-white/20"><X className="h-5 w-5" /></button>
                  <div className="flex items-center gap-3 mb-1">
                    <CreditCard className="h-6 w-6" />
                    <h3 className="text-lg font-bold">Thanh toán</h3>
                  </div>
                  <p className="text-sm text-blue-100">Chọn phương thức thanh toán phù hợp</p>
                </div>

                <div className="p-6 space-y-4">
                  {/* Tóm tắt đơn hàng */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Thông tin đặt lịch</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-slate-500">Gia sư</span><span className="font-bold text-slate-800">{tutor.ho_ten}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Ngày học</span><span className="font-bold text-slate-800">{ngayChon ? new Date(ngayChon).toLocaleDateString('vi-VN') : ''}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Giờ học</span><span className="font-bold text-slate-800">{khungGioChon?.gio_bat_dau?.substring(0,5)} - {khungGioChon?.gio_ket_thuc?.substring(0,5)}</span></div>
                      <div className="flex justify-between pt-2 border-t border-slate-200"><span className="font-bold text-slate-700">Tổng tiền</span><span className="font-black text-rose-600 text-base">{totalPrice.toLocaleString()} VNĐ</span></div>
                    </div>
                  </div>

                  {/* Chọn phương thức */}
                  <div className="space-y-3">
                    <p className="text-sm font-bold text-slate-700">Phương thức thanh toán</p>
                    {paymentMethods.map(method => (
                      <div key={method.id} onClick={() => setSelectedPayment(method.id)} className={`flex items-center gap-4 rounded-xl border-2 p-4 cursor-pointer transition-all ${selectedPayment === method.id ? method.selectedColor : method.color + ' hover:opacity-80'}`}>
                        <span className="text-2xl">{method.icon}</span>
                        <div className="flex-1">
                          <p className={`font-bold text-sm ${method.textColor}`}>{method.name}</p>
                          <p className="text-xs text-slate-500">{method.desc}</p>
                        </div>
                        <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedPayment === method.id ? 'border-blue-500 bg-blue-500' : 'border-slate-300'}`}>
                          {selectedPayment === method.id && <div className="h-2 w-2 rounded-full bg-white"></div>}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button onClick={handleConfirmPayment} disabled={!selectedPayment} className={`w-full rounded-xl py-4 font-bold text-white transition-all active:scale-95 flex items-center justify-center gap-2 ${selectedPayment ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 shadow-lg shadow-blue-500/30' : 'bg-slate-300 cursor-not-allowed'}`}>
                    <CreditCard className="h-5 w-5" /> Xác nhận thanh toán {totalPrice.toLocaleString()} VNĐ
                  </button>
                </div>
              </>
            )}

            {/* ===== BƯỚC 2: ĐANG XỬ LÝ ===== */}
            {paymentStep === 'processing' && (
              <div className="p-12 text-center">
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-blue-50">
                  <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">Đang xử lý thanh toán</h3>
                <p className="text-slate-500 text-sm">Vui lòng không đóng trang này...</p>
                <div className="mt-6 flex justify-center gap-2">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="h-2 w-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }}></div>
                  ))}
                </div>
              </div>
            )}

            {/* ===== BƯỚC 3: THÀNH CÔNG ===== */}
            {paymentStep === 'success' && (
              <div className="p-10 text-center">
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50">
                  <CheckCircle className="h-14 w-14 text-emerald-500" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Thanh toán thành công!</h3>
                <p className="text-slate-500 text-sm mb-6">Yêu cầu đặt lịch đã được gửi đến <b>{tutor.ho_ten}</b>. Gia sư sẽ xác nhận sớm nhất có thể.</p>

                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 mb-6 text-sm text-left space-y-2">
                  <div className="flex justify-between"><span className="text-slate-500">Phương thức</span><span className="font-bold text-emerald-700">{selectedPayment}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Số tiền</span><span className="font-bold text-emerald-700">{totalPrice.toLocaleString()} VNĐ</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Trạng thái</span><span className="font-bold text-emerald-700">✅ Đã thanh toán</span></div>
                </div>

                <button onClick={handleClosePaymentSuccess} className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 py-4 font-bold text-white shadow-lg shadow-emerald-500/30 hover:opacity-90 active:scale-95 transition-all">
                  Xem lịch học của tôi
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============ MODAL VIẾT ĐÁNH GIÁ ============ */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md animate-[fadeIn_0.25s_ease-out] rounded-2xl bg-white shadow-2xl overflow-hidden p-6">
            <button onClick={() => setIsReviewModalOpen(false)} className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">
              <X className="h-5 w-5" />
            </button>
            <h3 className="mb-2 text-xl font-black text-slate-900">Đánh giá Gia sư</h3>
            <p className="mb-6 text-sm text-slate-500">Chia sẻ trải nghiệm học tập của bạn với {tutor.ho_ten}</p>
            <form onSubmit={handleSubmitReview} className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Chất lượng giảng dạy</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" onClick={() => setRating(star)} className="transition-transform hover:scale-110 focus:outline-none">
                      <Star className={`h-8 w-8 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-200'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Chia sẻ thêm (Tùy chọn)</label>
                <textarea rows="4" placeholder="Gia sư dạy rất dễ hiểu, tài liệu đầy đủ..." value={comment} onChange={(e) => setComment(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all" />
              </div>
              <button type="submit" className="w-full rounded-xl bg-blue-600 py-3.5 font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:bg-blue-700 active:scale-95 flex items-center justify-center gap-2">
                <Send className="h-4 w-4" /> Gửi Đánh Giá
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }`}</style>
    </div>
  );
}