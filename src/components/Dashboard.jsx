import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import ChatPopup from './ChatPopup';
import { supabase } from '../supabaseClient';
import {
  getUserProfile, getLichDayCuaGiaSu, getLichHocCuaHocVien,
  capNhatTrangThaiLichHoc, getLichRanhGiaSu, themLichRanh, xoaLichRanh,
  laySoTinNhanChuaDoc, layDanhGiaGiaSu, taoThongBao, guiKhieuNaiLichHoc, xacNhanHocXong, guiDanhGia
} from '../services/authService';
import {
  Clock, CheckCircle2, XCircle, AlertTriangle, Calendar, DollarSign,
  Phone, Plus, Trash, Users, BookOpen, GraduationCap,
  CalendarDays, Loader2, MessageCircle, Video, Edit, Star, TrendingUp,
  ShieldAlert, X, Send
} from 'lucide-react';

export default function Dashboard({ session }) {
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatPartner, setChatPartner] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [lichRanhList, setLichRanhList] = useState([]);
  const [newLichRanh, setNewLichRanh] = useState({ thu_trong_tuan: 2, gio_bat_dau: '', gio_ket_thuc: '', so_luong_toi_da: 1 });
  const [ngayHienThi, setNgayHienThi] = useState('');
  const [isLapLai, setIsLapLai] = useState(true);
  const [reviews, setReviews] = useState([]);

  // ===== MODAL STATES =====
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState(null); // {idLichHoc, idGiaSu}
  const [reportReason, setReportReason] = useState('');

  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkTarget, setLinkTarget] = useState(null); // {idLichHoc, currentLink}
  const [newLink, setNewLink] = useState('');

  const [showDeleteLichModal, setShowDeleteLichModal] = useState(false);
  const [deleteLichTarget, setDeleteLichTarget] = useState(null);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ title: '', message: '', onConfirm: null, color: 'blue' });

  // ===== RATING STATES =====
  const [showRatingPopup, setShowRatingPopup] = useState(false);
  const [ratingTarget, setRatingTarget] = useState(null); // {idLichHoc, idGiaSu, tenGiaSu, avatarGiaSu}
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingComment, setRatingComment] = useState('');

  // ===== LOAD DATA =====
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        if (!session?.user?.id) return;
        const { data: userData } = await getUserProfile(session.user.id);
        setProfile(userData);
        if (userData?.vai_tro === 'gia_su') {
          const [resBookings, resLichRanh, resReviews] = await Promise.all([
            getLichDayCuaGiaSu(session.user.id),
            getLichRanhGiaSu(session.user.id),
            layDanhGiaGiaSu(session.user.id)
          ]);
          setBookings(resBookings.data || []);
          setLichRanhList(resLichRanh.data || []);
          setReviews(resReviews.data || []);
        } else if (userData?.vai_tro === 'hoc_vien') {
          const { data: bookingData } = await getLichHocCuaHocVien(session.user.id);
          setBookings(bookingData || []);
        }
        const counts = await laySoTinNhanChuaDoc(session.user.id);
        setUnreadCounts(counts);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();

    if (session?.user?.id) {
      const channel = supabase
        .channel('dashboard_unread_badge')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tin_nhan', filter: `id_nguoi_nhan=eq.${session.user.id}` }, async () => {
          const counts = await laySoTinNhanChuaDoc(session.user.id);
          setUnreadCounts(counts);
        })
        .subscribe();
      return () => supabase.removeChannel(channel);
    }
  }, [session, chatPartner]);

  // ===== HELPER: Modal xác nhận chung =====
  const openConfirm = (title, message, onConfirm, color = 'blue') => {
    setConfirmConfig({ title, message, onConfirm, color });
    setShowConfirmModal(true);
  };

  // ===== BÁO CÁO GIA SƯ =====
  const handleReportTutor = (idLichHoc, idGiaSu) => {
    setReportTarget({ idLichHoc, idGiaSu });
    setReportReason('');
    setShowReportModal(true);
  };

  const submitReport = async () => {
    if (!reportReason.trim()) return toast.error("Vui lòng nhập lý do khiếu nại!");
    const { error } = await guiKhieuNaiLichHoc(reportTarget.idLichHoc, reportReason.trim());
    if (error) {
      toast.error("Lỗi khi gửi khiếu nại: " + error.message);
    } else {
      toast.success("Đã gửi khiếu nại thành công! Lịch học đã bị đóng băng.");
      setBookings(prev => prev.map(b => b.id === reportTarget.idLichHoc
        ? { ...b, trang_thai: 'dang_tranh_chap', ly_do_tranh_chap: reportReason.trim() } : b));
      taoThongBao(reportTarget.idGiaSu, `🚨 BÁO ĐỘNG: Học viên vừa KHIẾU NẠI lịch học của bạn với lý do: "${reportReason.trim()}". Lịch học đã bị đóng băng chờ Admin phán quyết!`);
      setShowReportModal(false);
      setReportReason('');
    }
  };

  // ===== CẬP NHẬT TRẠNG THÁI LỊCH =====
  const handleUpdateStatus = async (idLichHoc, trangThaiMoi, isHocVien = false) => {
    if (trangThaiMoi === 'yeu_cau_huy') {
      openConfirm('Xin hủy lịch', 'Bạn có muốn gửi yêu cầu XIN HỦY lịch này tới Gia sư không?', async () => {
        await doUpdateStatus(idLichHoc, trangThaiMoi, isHocVien, null);
        setShowConfirmModal(false);
      }, 'amber');
    } else if (trangThaiMoi === 'da_huy') {
      const msg = isHocVien ? 'Bạn có chắc chắn muốn HỦY YÊU CẦU đặt lịch này?' : 'Bạn có chắc chắn muốn HỦY lịch học này?';
      openConfirm('Xác nhận hủy', msg, async () => {
        await doUpdateStatus(idLichHoc, trangThaiMoi, isHocVien, null);
        setShowConfirmModal(false);
      }, 'rose');
    } else if (!isHocVien && trangThaiMoi === 'da_thanh_toan') {
      // Mở modal nhập link
      setLinkTarget({ idLichHoc, currentLink: '', mode: 'accept' });
      setNewLink('');
      setShowLinkModal(true);
    }
  };

  const doUpdateStatus = async (idLichHoc, trangThaiMoi, isHocVien, linkPhong) => {
    const { error } = await capNhatTrangThaiLichHoc(idLichHoc, trangThaiMoi, linkPhong);
    if (error) { toast.error("Lỗi: " + error.message); return; }

    setBookings(prev => prev.map(b => b.id === idLichHoc ? {
      ...b, trang_thai: trangThaiMoi,
      ...(linkPhong !== null && { link_phong_hoc: linkPhong })
    } : b));

    const currentBooking = bookings.find(b => b.id === idLichHoc);
    if (currentBooking) {
      const targetUserId = isHocVien ? currentBooking.id_gia_su : currentBooking.id_hoc_vien;
      let thongBaoMsg = '';
      if (trangThaiMoi === 'da_thanh_toan' && !isHocVien) thongBaoMsg = `🎉 Gia sư ${profile?.ho_ten} đã chấp nhận lịch học của bạn!`;
      else if (trangThaiMoi === 'da_huy') thongBaoMsg = `❌ ${profile?.ho_ten} vừa hủy một lịch học.`;
      else if (trangThaiMoi === 'yeu_cau_huy') thongBaoMsg = `⚠️ ${profile?.ho_ten} đang yêu cầu hủy lịch.`;
      if (thongBaoMsg) taoThongBao(targetUserId, thongBaoMsg).catch(console.error);
    }
    toast.success("Cập nhật thành công!");
  };

  // ===== CẬP NHẬT LINK PHÒNG HỌC =====
  const handleUpdateLink = (idLichHoc, currentLink = '') => {
    setLinkTarget({ idLichHoc, currentLink, mode: 'edit' });
    setNewLink(currentLink);
    setShowLinkModal(true);
  };

  const submitLink = async () => {
    const finalLink = newLink.trim();
    if (linkTarget.mode === 'accept') {
      await doUpdateStatus(linkTarget.idLichHoc, 'da_thanh_toan', false, finalLink);
    } else {
      const { error } = await capNhatTrangThaiLichHoc(linkTarget.idLichHoc, 'da_thanh_toan', finalLink);
      if (error) { toast.error("Lỗi: " + error.message); return; }
      setBookings(prev => prev.map(b => b.id === linkTarget.idLichHoc ? { ...b, link_phong_hoc: finalLink } : b));
      toast.success(finalLink ? "Đã cập nhật link phòng học!" : "Đã gỡ link phòng học!");
    }
    setShowLinkModal(false);
  };

  // ===== XÁC NHẬN HỌC XONG & ĐÁNH GIÁ =====
  const handleXacNhanHocXong = (item) => {
    openConfirm(
      'Xác nhận học xong',
      `Bạn xác nhận đã hoàn thành buổi học với ${item.gia_su?.ho_ten}? Tiền sẽ được chuyển cho gia sư sau khi xác nhận.`,
      async () => {
        const { error } = await xacNhanHocXong(item.id, item.id_gia_su, Number(item.tong_tien));
        if (error) {
          toast.error("Lỗi: " + error.message);
        } else {
          toast.success("Đã xác nhận! Tiền đã được chuyển cho gia sư.");
          setBookings(prev => prev.map(b => b.id === item.id ? { ...b, trang_thai: 'hoan_thanh', hoc_vien_xac_nhan: true } : b));
          // Mở popup đánh giá
          setRatingTarget({ idLichHoc: item.id, idGiaSu: item.id_gia_su, tenGiaSu: item.gia_su?.ho_ten, avatarGiaSu: item.gia_su?.avatar_url });
          setRatingStars(5);
          setRatingComment('');
          setShowRatingPopup(true);
        }
        setShowConfirmModal(false);
      },
      'blue'
    );
  };

  const handleSubmitRating = async () => {
    if (!ratingTarget) return;
    const { error } = await guiDanhGia({
      id_gia_su: ratingTarget.idGiaSu,
      id_hoc_vien: session.user.id,
      so_sao: ratingStars,
      nhan_xet: ratingComment
    });
    if (!error) {
      toast.success("Cảm ơn bạn đã đánh giá!");
    } else {
      toast.error("Lỗi khi gửi đánh giá: " + error.message);
    }
    setShowRatingPopup(false);
  };

  // ===== LỊCH RẢNH =====
  const handleAddLichRanh = async (e) => {
    e.preventDefault();
    if (!ngayHienThi) return toast.error("Vui lòng chọn ngày từ bảng lịch!");
    if (newLichRanh.gio_bat_dau >= newLichRanh.gio_ket_thuc) return toast.error("Giờ bắt đầu phải nhỏ hơn giờ kết thúc!");
    const dataToInsert = {
      id_gia_su: session.user.id,
      thu_trong_tuan: Number(newLichRanh.thu_trong_tuan),
      gio_bat_dau: newLichRanh.gio_bat_dau,
      gio_ket_thuc: newLichRanh.gio_ket_thuc,
      so_luong_toi_da: Number(newLichRanh.so_luong_toi_da),
      is_lap_lai: isLapLai,
      ngay_cu_the: isLapLai ? null : ngayHienThi
    };
    const { data, error } = await themLichRanh(dataToInsert);
    if (!error && data) {
      toast.success("Thêm lịch rảnh thành công!");
      setLichRanhList([...lichRanhList, data[0]]);
      setNgayHienThi('');
      setIsLapLai(true);
    } else {
      toast.error("Có lỗi xảy ra: " + (error?.message || "Không thể lưu"));
    }
  };

  const handleDeleteLichRanh = (idLichRanh) => {
    setDeleteLichTarget(idLichRanh);
    setShowDeleteLichModal(true);
  };

  const confirmDeleteLich = async () => {
    const { error } = await xoaLichRanh(deleteLichTarget);
    if (!error) {
      setLichRanhList(prev => prev.filter(item => item.id !== deleteLichTarget));
      toast.success("Đã xóa lịch rảnh!");
    } else {
      toast.error("Lỗi xóa lịch: " + error.message);
    }
    setShowDeleteLichModal(false);
  };

  const formatThu = (thuNum) => thuNum === 8 ? "Chủ Nhật" : `Thứ ${thuNum}`;

  const getAvatarUrl = (name) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=3B82F6&color=fff&size=128&bold=true&font-size=0.4`;

  const StatusBadge = ({ status }) => {
    const config = {
      cho_xac_nhan: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: Clock, label: 'Đang chờ xác nhận' },
      da_thanh_toan: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: CheckCircle2, label: 'Đã xác nhận' },
      yeu_cau_huy: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', icon: AlertTriangle, label: 'Yêu cầu hủy' },
      da_huy: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', icon: XCircle, label: 'Đã hủy' },
      dang_tranh_chap: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700', icon: ShieldAlert, label: 'ĐANG TRANH CHẤP' },
      da_hoan_tien: { bg: 'bg-slate-100', border: 'border-slate-300', text: 'text-slate-600', icon: CheckCircle2, label: 'Đã hoàn tiền' },
      hoan_thanh: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: CheckCircle2, label: 'Đã hoàn thành' }
    };
    const { bg, border, text, icon: Icon, label } = config[status] || config.cho_xac_nhan;
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${bg} ${border} ${text}`}>
        <Icon className="h-3.5 w-3.5" />{label}
      </span>
    );
  };

  const stats = (() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthlyRevenue = bookings.filter(b => {
      const d = new Date(b.thoi_gian_bat_dau);
      return (b.trang_thai === 'da_thanh_toan' || b.trang_thai === 'hoan_thanh') && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).reduce((sum, b) => sum + (Number(b.tong_tien) || 0), 0);
    const activeStudentsCount = new Set(bookings.filter(b => b.trang_thai !== 'da_huy' && b.trang_thai !== 'da_hoan_tien').map(b => b.id_hoc_vien)).size;
    const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.so_sao, 0) / reviews.length).toFixed(1) : "0.0";
    return { monthlyRevenue, activeStudentsCount, avgRating };
  })();

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-blue-100"></div>
          <Loader2 className="absolute inset-0 h-16 w-16 animate-spin text-blue-600" />
        </div>
        <p className="text-lg font-medium text-gray-600">Đang tải dữ liệu...</p>
      </div>
    </div>
  );

  if (profile?.trang_thai_hoat_dong === 'bi_khoa') return (
    <div className="flex min-h-screen items-center justify-center bg-rose-50 p-6 font-sans">
      <div className="max-w-md text-center rounded-[2.5rem] bg-white p-10 shadow-2xl border border-rose-100">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-rose-100 text-rose-600 mb-6"><ShieldAlert className="h-12 w-12" /></div>
        <h2 className="text-2xl font-black text-slate-900 mb-3">Tài khoản bị đóng băng</h2>
        <p className="text-slate-500 mb-8 leading-relaxed">Hệ thống phát hiện bạn đã vi phạm quy định của nền tảng.</p>
        {profile.ngay_mo_khoa
          ? <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100"><p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Thời gian mở khóa dự kiến</p><p className="text-lg font-black text-rose-600">{new Date(profile.ngay_mo_khoa).toLocaleDateString('vi-VN')}</p></div>
          : <div className="p-5 bg-rose-50 rounded-2xl border border-rose-100"><p className="text-sm font-black text-rose-700">TÀI KHOẢN BỊ KHÓA VĨNH VIỄN</p></div>}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 pb-16">
      {/* HEADER */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 px-6 pt-20 pb-40">
        <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
        <div className="relative z-20 mx-auto max-w-5xl">
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 overflow-hidden rounded-2xl border-4 border-white/30 shadow-xl bg-white">
              <img src={profile?.avatar_url || getAvatarUrl(profile?.ho_ten)} alt={profile?.ho_ten} className="h-full w-full object-cover" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white md:text-3xl">Xin chào, {profile?.ho_ten}!</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold backdrop-blur-sm ${profile?.vai_tro === 'gia_su' ? 'bg-emerald-400/20 text-emerald-100' : 'bg-cyan-400/20 text-cyan-100'}`}>
                  {profile?.vai_tro === 'gia_su' ? <><GraduationCap className="h-4 w-4" /> Gia sư</> : <><BookOpen className="h-4 w-4" /> Học viên</>}
                </span>
                <span className="text-sm text-blue-100">{bookings.length} lịch {profile?.vai_tro === 'gia_su' ? 'dạy' : 'học'}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full leading-none z-10 pointer-events-none">
          <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-12 md:h-24 lg:h-32">
            <path d="M0 40L60 36.7C120 33 240 27 360 30C480 33 600 47 720 53.3C840 60 960 60 1080 53.3C1200 47 1320 33 1380 26.7L1440 20V100H1380C1320 100 1200 100 1080 100C960 100 840 100 720 100C600 100 480 100 360 100C240 100 120 100 60 100H0V40Z" fill="#F9FAFB"/>
          </svg>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-5xl px-4 sm:px-6 relative z-30">
        {/* STATS - GIA SƯ */}
        {profile?.vai_tro === 'gia_su' && (
          <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-[2rem] border border-white bg-white/70 p-6 shadow-xl backdrop-blur-md transition-all hover:scale-[1.02]">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600"><DollarSign className="h-6 w-6" /></div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Doanh thu tạm tính</p>
              <h3 className="mt-1 text-2xl font-black text-emerald-700">{stats.monthlyRevenue.toLocaleString()} <span className="text-sm">VNĐ</span></h3>
              <div className="mt-2 flex items-center gap-1 text-xs font-bold text-emerald-500"><TrendingUp className="h-3 w-3" /> Tăng trưởng ổn định</div>
            </div>
            <div className="rounded-[2rem] border border-white bg-white/70 p-6 shadow-xl backdrop-blur-md transition-all hover:scale-[1.02]">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600"><Users className="h-6 w-6" /></div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Học viên đang dạy</p>
              <h3 className="mt-1 text-2xl font-black text-blue-700">{stats.activeStudentsCount} <span className="text-sm">Học viên</span></h3>
            </div>
            <div className="rounded-[2rem] border border-white bg-white/70 p-6 shadow-xl backdrop-blur-md transition-all hover:scale-[1.02]">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600"><Star className="h-6 w-6 fill-current" /></div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Đánh giá trung bình</p>
              <h3 className="mt-1 text-2xl font-black text-amber-600">{stats.avgRating} <span className="text-sm">/ 5.0</span></h3>
              <p className="mt-2 text-xs text-slate-400 font-medium">Dựa trên {reviews.length} nhận xét</p>
            </div>
          </div>
        )}

        {/* GIA SƯ DASHBOARD */}
        {profile?.vai_tro === 'gia_su' && (
          <div className="space-y-8">
            <section>
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600"><CalendarDays className="h-5 w-5" /></div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Danh sách yêu cầu học</h2>
                  <p className="text-sm text-gray-500">Quản lý các yêu cầu đặt lịch từ học viên</p>
                </div>
              </div>
              {bookings.length > 0 ? (
                <div className="space-y-4">
                  {[...bookings].sort((a, b) => {
                    const priority = { dang_tranh_chap: 0, cho_xac_nhan: 1, yeu_cau_huy: 2, da_thanh_toan: 3, hoan_thanh: 4, da_huy: 5, da_hoan_tien: 6 };
                    return (priority[a.trang_thai] || 99) - (priority[b.trang_thai] || 99);
                  }).map((item) => (
                    <div key={item.id} className={`group overflow-hidden rounded-[2rem] border bg-white shadow-sm transition-all duration-300 hover:shadow-lg ${item.trang_thai === 'dang_tranh_chap' ? 'border-red-300 ring-2 ring-red-100' : item.trang_thai === 'yeu_cau_huy' ? 'border-orange-200 ring-2 ring-orange-100' : 'border-gray-100'}`}>
                      {item.trang_thai === 'dang_tranh_chap' && <div className="flex items-center gap-2 bg-red-600 px-6 py-2 text-sm font-bold text-white animate-pulse"><ShieldAlert className="h-4 w-4" /> BỊ KHIẾU NẠI: Admin đang điều tra!</div>}
                      {item.trang_thai === 'yeu_cau_huy' && <div className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-2 text-sm font-semibold text-white"><AlertTriangle className="h-4 w-4" /> Học viên yêu cầu hủy lịch này!</div>}
                      <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-4">
                          <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl border-2 border-emerald-100 shadow-sm">
                            <img src={item.hoc_vien?.avatar_url || getAvatarUrl(item.hoc_vien?.ho_ten)} alt="" className="h-full w-full object-cover" />
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-bold text-gray-900">{item.hoc_vien?.ho_ten}</h3>
                              <StatusBadge status={item.trang_thai} />
                            </div>
                            <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-600">
                              <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4 text-blue-500" />{new Date(item.thoi_gian_bat_dau).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                              <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4 text-cyan-500" />{new Date(item.thoi_gian_bat_dau).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(item.thoi_gian_ket_thuc).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1.5 text-sm font-bold text-rose-600"><DollarSign className="h-4 w-4" />{Number(item.tong_tien).toLocaleString()} VNĐ</div>
                          </div>
                        </div>
                        <div className="flex flex-shrink-0 gap-2 sm:flex-col sm:items-end">
                          <button onClick={() => { setChatPartner({ id: item.id_hoc_vien, ho_ten: item.hoc_vien?.ho_ten, avatar_url: item.hoc_vien?.avatar_url }); setUnreadCounts(prev => ({ ...prev, [item.id_hoc_vien]: 0 })); }} className="relative inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-600 hover:bg-blue-100">
                            <MessageCircle className="h-4 w-4" /> Nhắn tin
                            {unreadCounts[item.id_hoc_vien] > 0 && <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white animate-bounce">{unreadCounts[item.id_hoc_vien]}</span>}
                          </button>
                          {item.trang_thai === 'da_thanh_toan' && (
                            <div className="flex flex-wrap gap-2 mt-1 justify-end">
                              {item.link_phong_hoc ? (
                                <div className="flex items-center gap-2">
                                  <a href={item.link_phong_hoc.startsWith('http') ? item.link_phong_hoc : `https://${item.link_phong_hoc}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg hover:-translate-y-0.5"><Video className="h-4 w-4" /> Vào Lớp</a>
                                  <button onClick={() => handleUpdateLink(item.id, item.link_phong_hoc)} className="inline-flex items-center justify-center rounded-xl bg-slate-100 border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200"><Edit className="h-4 w-4" /></button>
                                </div>
                              ) : (
                                <button onClick={() => handleUpdateLink(item.id)} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg hover:-translate-y-0.5"><Video className="h-4 w-4" /> Gắn Link Meet</button>
                              )}
                              <button onClick={() => handleUpdateStatus(item.id, 'da_huy', false)} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-100"><XCircle className="h-4 w-4" /> Hủy lịch</button>
                            </div>
                          )}
                          {item.trang_thai === 'cho_xac_nhan' && (
                            <div className="flex gap-2 mt-1">
                              <button onClick={() => handleUpdateStatus(item.id, 'da_thanh_toan', false)} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:-translate-y-0.5"><CheckCircle2 className="h-4 w-4" /> Chấp nhận</button>
                              <button onClick={() => handleUpdateStatus(item.id, 'da_huy', false)} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-red-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:-translate-y-0.5"><XCircle className="h-4 w-4" /> Từ chối</button>
                            </div>
                          )}
                          {item.trang_thai === 'yeu_cau_huy' && (
                            <div className="flex gap-2 mt-1">
                              <button onClick={() => handleUpdateStatus(item.id, 'da_huy', false)} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-red-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:-translate-y-0.5"><XCircle className="h-4 w-4" /> Đồng ý hủy</button>
                              <button onClick={() => handleUpdateStatus(item.id, 'da_thanh_toan', false)} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:-translate-y-0.5"><CheckCircle2 className="h-4 w-4" /> Giữ lại lịch</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[2rem] border border-dashed border-gray-200 bg-white/50 p-12 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100"><CalendarDays className="h-8 w-8 text-gray-400" /></div>
                  <h3 className="text-lg font-semibold text-gray-700">Chưa có yêu cầu nào</h3>
                </div>
              )}
            </section>

            {/* LỊCH RẢNH */}
            <section className="overflow-hidden rounded-[2rem] border border-cyan-100 bg-gradient-to-br from-cyan-50 via-white to-blue-50 shadow-sm">
              <div className="border-b border-cyan-100 bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20"><Clock className="h-5 w-5 text-white" /></div>
                  <div><h2 className="text-lg font-bold text-white">Cài Đặt Lịch Rảnh</h2><p className="text-sm text-cyan-100">Thiết lập khung giờ dạy lớp nhóm</p></div>
                </div>
              </div>
              <div className="p-6">
                <form onSubmit={handleAddLichRanh} className="mb-6 flex flex-wrap items-end gap-4 rounded-2xl bg-white p-5 shadow-sm">
                  <div className="min-w-[150px] flex-1">
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">Chọn Ngày</label>
                    <input type="date" required value={ngayHienThi} min={new Date().toISOString().split('T')[0]} onChange={(e) => { setNgayHienThi(e.target.value); if (e.target.value) { const dateObj = new Date(e.target.value); const thu = dateObj.getDay() === 0 ? 8 : dateObj.getDay() + 1; setNewLichRanh({ ...newLichRanh, thu_trong_tuan: thu }); } }} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 focus:border-cyan-500 focus:outline-none focus:ring-4 focus:ring-cyan-500/10" />
                    {ngayHienThi && <label className="mt-2 flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={isLapLai} onChange={(e) => setIsLapLai(e.target.checked)} className="h-4 w-4 rounded border-cyan-300 text-cyan-600" /><span className="text-[12px] font-bold text-cyan-700">Lặp lại vào mọi {formatThu(newLichRanh.thu_trong_tuan)}</span></label>}
                  </div>
                  <div className="min-w-[130px]">
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">Bắt đầu</label>
                    <input type="time" required value={newLichRanh.gio_bat_dau} onChange={(e) => setNewLichRanh({ ...newLichRanh, gio_bat_dau: e.target.value })} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 focus:border-cyan-500 focus:outline-none focus:ring-4 focus:ring-cyan-500/10" />
                  </div>
                  <div className="min-w-[130px]">
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">Kết thúc</label>
                    <input type="time" required value={newLichRanh.gio_ket_thuc} onChange={(e) => setNewLichRanh({ ...newLichRanh, gio_ket_thuc: e.target.value })} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 focus:border-cyan-500 focus:outline-none focus:ring-4 focus:ring-cyan-500/10" />
                  </div>
                  <div className="w-24">
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">Số HS</label>
                    <input type="number" min="1" required value={newLichRanh.so_luong_toi_da} onChange={(e) => setNewLichRanh({ ...newLichRanh, so_luong_toi_da: e.target.value })} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 focus:border-cyan-500 focus:outline-none focus:ring-4 focus:ring-cyan-500/10" />
                  </div>
                  <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-3 text-sm font-bold text-white shadow-lg hover:-translate-y-0.5"><Plus className="h-4 w-4" />Thêm lịch</button>
                </form>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {lichRanhList.map((lich) => (
                    <div key={lich.id} className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:border-cyan-200 hover:shadow-md">
                      <button onClick={() => handleDeleteLichRanh(lich.id)} className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-400 opacity-0 hover:bg-rose-100 hover:text-rose-500 group-hover:opacity-100"><Trash className="h-4 w-4" /></button>
                      <div className="mb-3 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-3 py-1.5 text-sm font-bold text-white shadow-sm"><Calendar className="h-4 w-4" />{lich.is_lap_lai === false && lich.ngay_cu_the ? new Date(lich.ngay_cu_the).toLocaleDateString('vi-VN') : `${formatThu(lich.thu_trong_tuan)} hàng tuần`}</div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-700"><Clock className="h-4 w-4 text-cyan-500" /><span className="text-sm"><span className="font-semibold">{lich.gio_bat_dau.substring(0, 5)}</span> - <span className="font-semibold">{lich.gio_ket_thuc.substring(0, 5)}</span></span></div>
                        <div className="flex items-center gap-2 text-emerald-600"><Users className="h-4 w-4" /><span className="text-sm font-semibold">Tối đa {lich.so_luong_toi_da} học viên</span></div>
                      </div>
                    </div>
                  ))}
                  {lichRanhList.length === 0 && <div className="col-span-full rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center"><Clock className="mx-auto mb-2 h-8 w-8 text-gray-300" /><p className="text-sm text-gray-500">Chưa có lịch rảnh nào</p></div>}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* HỌC VIÊN DASHBOARD */}
        {profile?.vai_tro === 'hoc_vien' && (
          <section>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600"><BookOpen className="h-5 w-5" /></div>
              <div><h2 className="text-xl font-bold text-gray-900">Lịch học đã đặt</h2><p className="text-sm text-gray-500">Theo dõi và quản lý các buổi học của bạn</p></div>
            </div>
            {bookings.length > 0 ? (
              <div className="space-y-4">
                {[...bookings].sort((a, b) => {
                  const priority = { dang_tranh_chap: 0, cho_xac_nhan: 1, da_thanh_toan: 2, yeu_cau_huy: 3, hoan_thanh: 4, da_huy: 5, da_hoan_tien: 6 };
                  return (priority[a.trang_thai] || 99) - (priority[b.trang_thai] || 99);
                }).map((item) => (
                  <div key={item.id} className={`group overflow-hidden rounded-[2rem] border bg-white shadow-sm transition-all duration-300 hover:shadow-lg ${item.trang_thai === 'dang_tranh_chap' ? 'border-red-300 ring-2 ring-red-100' : 'border-gray-100'}`}>
                    {item.trang_thai === 'dang_tranh_chap' && <div className="flex items-center gap-2 bg-red-600 px-6 py-2 text-sm font-bold text-white"><ShieldAlert className="h-4 w-4" /> ĐÃ GỬI BÁO CÁO: Lịch học đang bị đóng băng chờ Admin giải quyết.</div>}
                    <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl border-2 border-blue-100 shadow-sm"><img src={item.gia_su?.avatar_url || getAvatarUrl(item.gia_su?.ho_ten)} alt="" className="h-full w-full object-cover" /></div>
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-bold text-gray-900">{item.gia_su?.ho_ten}</h3><StatusBadge status={item.trang_thai} /></div>
                          <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-600">
                            <span className="inline-flex items-center gap-1.5"><Phone className="h-4 w-4 text-emerald-500" />{item.gia_su?.so_dien_thoai || 'Chưa cập nhật'}</span>
                            <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4 text-blue-500" />{new Date(item.thoi_gian_bat_dau).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                            <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4 text-cyan-500" />{new Date(item.thoi_gian_bat_dau).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(item.thoi_gian_ket_thuc).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          {item.tong_tien && <div className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1.5 text-sm font-bold text-rose-600"><DollarSign className="h-4 w-4" />{Number(item.tong_tien).toLocaleString()} VNĐ</div>}
                        </div>
                      </div>
                      <div className="flex flex-shrink-0 gap-2 sm:flex-col sm:items-end">
                        <button onClick={() => { setChatPartner({ id: item.id_gia_su, ho_ten: item.gia_su?.ho_ten, avatar_url: item.gia_su?.avatar_url }); setUnreadCounts(prev => ({ ...prev, [item.id_gia_su]: 0 })); }} className="relative inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-600 hover:bg-blue-100">
                          <MessageCircle className="h-4 w-4" /> Nhắn tin
                          {unreadCounts[item.id_gia_su] > 0 && <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white animate-bounce">{unreadCounts[item.id_gia_su]}</span>}
                        </button>
                        
                        {item.trang_thai === 'da_thanh_toan' && (
                          <div className="flex flex-wrap gap-2 mt-1 justify-end">
                            {item.link_phong_hoc
                              ? <a href={item.link_phong_hoc.startsWith('http') ? item.link_phong_hoc : `https://${item.link_phong_hoc}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg hover:-translate-y-0.5"><Video className="h-4 w-4" /> Vào Lớp Học</a>
                              : <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 bg-slate-100 px-3 py-2 rounded-xl"><Loader2 className="h-4 w-4 animate-spin text-blue-400" /> Đang chờ link...</span>}
                            
                            <button onClick={() => handleReportTutor(item.id, item.id_gia_su)} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg hover:-translate-y-0.5"><ShieldAlert className="h-4 w-4" /> Báo cáo</button>
                            
                            {!item.hoc_vien_xac_nhan && (
                              <button
                                onClick={() => handleXacNhanHocXong(item)}
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg hover:-translate-y-0.5 transition-all"
                              >
                                <CheckCircle2 className="h-4 w-4" /> Xác nhận học xong
                              </button>
                            )}
                          </div>
                        )}

                        {item.trang_thai === 'hoan_thanh' && (
                          <div className="flex gap-2 mt-1 justify-end">
                            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                              <CheckCircle2 className="h-4 w-4" /> Đã hoàn thành
                            </span>
                          </div>
                        )}

                        {item.trang_thai === 'cho_xac_nhan' && <button onClick={() => handleUpdateStatus(item.id, 'yeu_cau_huy', true)} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 px-5 py-2.5 mt-1 text-sm font-bold text-white shadow-lg hover:-translate-y-0.5"><AlertTriangle className="h-4 w-4" /> Xin hủy lịch</button>}
                        {item.trang_thai === 'yeu_cau_huy' && <span className="inline-flex items-center gap-1.5 text-sm text-orange-600 mt-1"><Loader2 className="h-4 w-4 animate-spin" /> Đang chờ Gia sư duyệt...</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[2rem] border border-dashed border-gray-200 bg-white/50 p-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100"><BookOpen className="h-8 w-8 text-gray-400" /></div>
                <h3 className="text-lg font-semibold text-gray-700">Chưa có lịch học nào</h3>
                <p className="mt-1 text-sm text-gray-500">Hãy tìm gia sư và đặt lịch học ngay!</p>
              </div>
            )}
          </section>
        )}
      </div>

      {/* CHAT POPUP */}
      {chatPartner && (
        <ChatPopup session={session} partner={chatPartner} onClose={() => { setChatPartner(null); laySoTinNhanChuaDoc(session.user.id).then(counts => setUnreadCounts(counts)); }} />
      )}

      {/* ===== MODAL BÁO CÁO GIA SƯ ===== */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-red-600 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><ShieldAlert className="h-5 w-5" /> Báo cáo / Khiếu nại Gia sư</h3>
              <button onClick={() => setShowReportModal(false)} className="text-white/80 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">Lịch học sẽ bị <b>đóng băng ngay lập tức</b> để Admin vào cuộc giải quyết. Vui lòng nhập rõ lý do khiếu nại:</p>
              <textarea rows="4" placeholder="VD: Gia sư không vào dạy đúng giờ, dạy sai nội dung..." value={reportReason} onChange={e => setReportReason(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10" />
              <div className="flex gap-3">
                <button onClick={() => setShowReportModal(false)} className="flex-1 rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-600 hover:bg-slate-200">Hủy</button>
                <button onClick={submitReport} className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-bold text-white hover:bg-red-700 active:scale-95 transition-all">Gửi khiếu nại</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL NHẬP LINK PHÒNG HỌC ===== */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><Video className="h-5 w-5" /> {linkTarget?.mode === 'accept' ? 'Chấp nhận & Gắn Link Meet' : 'Cập nhật Link Phòng Học'}</h3>
              <button onClick={() => setShowLinkModal(false)} className="text-white/80 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">{linkTarget?.mode === 'accept' ? 'Bạn sắp chấp nhận lịch học này. Hãy gắn link phòng học để học viên biết cách vào lớp.' : 'Dán link Google Meet hoặc Zoom mới vào đây. Để trống nếu muốn xóa link cũ.'}</p>
              <input type="text" placeholder="https://meet.google.com/xxx-xxxx-xxx" value={newLink} onChange={e => setNewLink(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10" />
              <div className="flex gap-3">
                <button onClick={() => setShowLinkModal(false)} className="flex-1 rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-600 hover:bg-slate-200">Hủy</button>
                <button onClick={submitLink} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 py-3 text-sm font-bold text-white hover:opacity-90 active:scale-95 transition-all"><Send className="h-4 w-4" />{linkTarget?.mode === 'accept' ? 'Chấp nhận lịch' : 'Lưu link'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL XÓA LỊCH RẢNH ===== */}
      {showDeleteLichModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-rose-500 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><Trash className="h-5 w-5" /> Xóa khung giờ rảnh</h3>
              <button onClick={() => setShowDeleteLichModal(false)} className="text-white/80 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              <p className="text-sm text-slate-600">Bạn có chắc muốn <b>xóa</b> khung giờ rảnh này? Học viên sẽ không thể đặt lịch vào khung giờ này nữa.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteLichModal(false)} className="flex-1 rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-600 hover:bg-slate-200">Hủy</button>
                <button onClick={confirmDeleteLich} className="flex-1 rounded-xl bg-rose-600 py-3 text-sm font-bold text-white hover:bg-rose-700 active:scale-95 transition-all">Xóa</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL XÁC NHẬN CHUNG ===== */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden animate-[fadeIn_0.2s_ease-out]">
            <div className={`px-6 py-4 flex items-center justify-between ${confirmConfig.color === 'rose' ? 'bg-rose-500' : confirmConfig.color === 'amber' ? 'bg-amber-500' : 'bg-blue-500'}`}>
              <h3 className="text-lg font-bold text-white">{confirmConfig.title}</h3>
              <button onClick={() => setShowConfirmModal(false)} className="text-white/80 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              <p className="text-sm text-slate-600">{confirmConfig.message}</p>
              <div className="flex gap-3">
                <button onClick={() => setShowConfirmModal(false)} className="flex-1 rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-600 hover:bg-slate-200">Hủy</button>
                <button onClick={confirmConfig.onConfirm} className={`flex-1 rounded-xl py-3 text-sm font-bold text-white active:scale-95 transition-all ${confirmConfig.color === 'rose' ? 'bg-rose-600 hover:bg-rose-700' : confirmConfig.color === 'amber' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'}`}>Xác nhận</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RATING POPUP */}
      {showRatingPopup && ratingTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-gradient-to-r from-amber-400 to-orange-400 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Star className="h-5 w-5 fill-current" /> Đánh giá buổi học
              </h3>
              <button onClick={() => setShowRatingPopup(false)} className="text-white/80 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-4">
                <img src={ratingTarget.avatarGiaSu || `https://ui-avatars.com/api/?name=${ratingTarget.tenGiaSu}&background=3B82F6&color=fff`} className="h-14 w-14 rounded-2xl object-cover border border-slate-200" alt="" />
                <div>
                  <p className="font-black text-slate-900">{ratingTarget.tenGiaSu}</p>
                  <p className="text-sm text-slate-500">Hãy chia sẻ trải nghiệm của bạn!</p>
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-bold text-slate-700">Chất lượng giảng dạy</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} type="button" onClick={() => setRatingStars(star)} className="transition-transform hover:scale-110">
                      <Star className={`h-9 w-9 ${star <= ratingStars ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-200'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700">Nhận xét (Tùy chọn)</label>
                <textarea rows="3" placeholder="Gia sư dạy rất dễ hiểu, nhiệt tình..." value={ratingComment} onChange={e => setRatingComment(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowRatingPopup(false)} className="flex-1 rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-600 hover:bg-slate-200">Bỏ qua</button>
                <button onClick={handleSubmitRating} className="flex-1 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 py-3 text-sm font-bold text-white hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2">
                  <Star className="h-4 w-4 fill-current" /> Gửi đánh giá
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }`}</style>
    </div>
  );
}