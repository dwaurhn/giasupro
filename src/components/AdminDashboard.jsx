import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx'; // ✅ ĐÃ THÊM IMPORT XLSX
import { 
  getDanhSachGiaSuAdmin, 
  capNhatTrangThaiDuyetGiaSu, 
  taoThongBao, 
  getThongKeAdmin,
  getDanhSachHocVienAdmin,
  getToanBoLichHocAdmin,
  khoaTaiKhoanAdmin,
  getDanhSachRutTienAdmin,
  duyetRutTienAdmin,
  giaiQuyetTranhChapAdmin 
} from '../services/authService';
import { 
  ShieldCheck, CheckCircle, XCircle, Search, Mail, Loader2, 
  Users, GraduationCap, CalendarDays, DollarSign,
  Clock, Eye, AlertTriangle, ShieldAlert, Phone, MapPin, X,
  ArrowDownCircle, Gavel, FileSpreadsheet // ✅ ĐÃ THÊM FileSpreadsheet
} from 'lucide-react';

export default function AdminDashboard({ userProfile }) {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tutors, setTutors] = useState([]);
  const [students, setStudents] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('gia_su');
  
  // STATE MỚI: QUẢN LÝ RÚT TIỀN
  const [rutTienList, setRutTienList] = useState([]);

  // STATE CHO CÁC MODAL
  const [selectedUser, setSelectedUser] = useState(null);
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showUnbanModal, setShowUnbanModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);

  const [banDuration, setBanDuration] = useState('7');
  const [banReason, setBanReason] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => { fetchAdminData(); }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    const [tutorsRes, studentsRes, bookingsRes, statsRes, rutTienRes] = await Promise.all([
      getDanhSachGiaSuAdmin(),
      getDanhSachHocVienAdmin(),
      getToanBoLichHocAdmin(),
      getThongKeAdmin(),
      getDanhSachRutTienAdmin() // GỌI API RÚT TIỀN
    ]);
    if (tutorsRes.data) setTutors(tutorsRes.data);
    if (studentsRes.data) setStudents(studentsRes.data);
    if (bookingsRes.data) setAllBookings(bookingsRes.data);
    if (statsRes.data) setStats(statsRes.data);
    if (rutTienRes.data) setRutTienList(rutTienRes.data); // LƯU STATE RÚT TIỀN
    setLoading(false);
  };

  // ✅ THÊM HÀM XUẤT EXCEL
  const handleExportExcel = () => {
    // Sheet 1: Thống kê tổng quan
    const tongQuan = [
      ['THỐNG KÊ TỔNG QUAN', ''],
      ['Tổng học viên', stats?.totalHocVien || 0],
      ['Gia sư đã duyệt', stats?.giaSuDaDuyet || 0],
      ['Gia sư chờ duyệt', stats?.giaSuChoDuyet || 0],
      ['Tổng lịch học', stats?.totalLichHoc || 0],
      ['Doanh thu ước tính (VNĐ)', stats?.doanhThu || 0],
    ];
    
    // Sheet 2: Danh sách lịch học
    const lichHocData = [
      ['Ngày giờ', 'Học viên', 'Gia sư', 'Số tiền (VNĐ)', 'Trạng thái']
    ];
    allBookings.forEach(b => {
      lichHocData.push([
        new Date(b.thoi_gian_bat_dau).toLocaleString('vi-VN'),
        b.hoc_vien?.ho_ten || 'Không rõ',
        b.gia_su?.ho_ten || 'Không rõ',
        Number(b.tong_tien || 0),
        b.trang_thai
      ]);
    });
    
    // Sheet 3: Danh sách gia sư
    const giaSuData = [
      ['Họ tên', 'Email', 'Môn học', 'Học phí (VNĐ/h)', 'Trạng thái duyệt', 'Trạng thái HĐ']
    ];
    tutors.forEach(t => {
      giaSuData.push([
        t.ho_ten,
        t.email,
        t.chi_tiet_gia_su?.mon_hoc || 'Chưa có',
        Number(t.chi_tiet_gia_su?.gia_tien_moi_gio || 0),
        t.trang_thai_duyet,
        t.trang_thai_hoat_dong
      ]);
    });
    
    // Sheet 4: Yêu cầu rút tiền
    const rutTienData = [
      ['Gia sư', 'Email', 'Số tiền (VNĐ)', 'Ngân hàng', 'Số TK', 'Tên chủ TK', 'Ngày yêu cầu', 'Trạng thái']
    ];
    rutTienList.forEach(r => {
      rutTienData.push([
        r.gia_su?.ho_ten || 'Không rõ',
        r.gia_su?.email || '',
        Number(r.so_tien),
        r.ten_ngan_hang,
        r.so_tai_khoan,
        r.ten_chu_tk,
        new Date(r.created_at).toLocaleDateString('vi-VN'),
        r.trang_thai
      ]);
    });
    
    // Tạo workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(tongQuan), 'Tổng quan');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(lichHocData), 'Lịch học');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(giaSuData), 'Gia sư');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rutTienData), 'Rút tiền');
    
    const ngay = new Date().toLocaleDateString('vi-VN').replace(/\//g, '-');
    XLSX.writeFile(wb, `BaoCao_GiaSuPro_${ngay}.xlsx`);
    toast.success("Đã xuất báo cáo Excel thành công!");
  };

  // ✅ PHÊ DUYỆT
  const handleApprove = async () => {
    const idGiaSu = selectedUser.id;
    const { error } = await capNhatTrangThaiDuyetGiaSu(idGiaSu, 'da_duyet');
    if (!error) {
      setTutors(tutors.map(t => t.id === idGiaSu ? { ...t, trang_thai_duyet: 'da_duyet' } : t));
      await taoThongBao(idGiaSu, "🎉 Chúc mừng! Hồ sơ gia sư của bạn đã được Admin phê duyệt. Bạn đã có thể nhận học viên.");
      toast.success("Đã phê duyệt gia sư thành công!");
      getThongKeAdmin().then(res => { if (res.data) setStats(res.data); });
      setShowApproveModal(false);
      setShowKYCModal(false);
    } else {
      toast.error("Lỗi: " + error.message);
    }
  };

  // ✅ TỪ CHỐI
  const handleReject = async () => {
    if (!rejectReason.trim()) return toast.error("Vui lòng nhập lý do từ chối!");
    const idGiaSu = selectedUser.id;
    const { error } = await capNhatTrangThaiDuyetGiaSu(idGiaSu, 'tu_choi');
    if (!error) {
      setTutors(tutors.map(t => t.id === idGiaSu ? { ...t, trang_thai_duyet: 'tu_choi' } : t));
      await taoThongBao(idGiaSu, `⚠️ Rất tiếc! Hồ sơ gia sư của bạn bị TỪ CHỐI. Lý do: ${rejectReason}`);
      toast.success("Đã từ chối hồ sơ!");
      setShowRejectModal(false);
      setShowKYCModal(false);
      setRejectReason('');
    } else {
      toast.error("Lỗi: " + error.message);
    }
  };

  // ✅ KHÓA TÀI KHOẢN
  const handleBanUser = async (e) => {
    e.preventDefault();
    if (!banReason) return toast.error("Vui lòng nhập lý do khóa!");
    let ngayMoKhoa = null;
    let thongBaoKhoa = "";
    if (banDuration === 'permanent') {
      thongBaoKhoa = `🚫 Tài khoản của bạn đã bị KHÓA VĨNH VIỄN. Lý do: ${banReason}`;
    } else {
      const days = parseInt(banDuration);
      const unlockDate = new Date();
      unlockDate.setDate(unlockDate.getDate() + days);
      ngayMoKhoa = unlockDate.toISOString();
      thongBaoKhoa = `🛑 Tài khoản của bạn bị TẠM KHÓA ${days} ngày. Lý do: ${banReason}. Sẽ mở khóa vào ${unlockDate.toLocaleDateString('vi-VN')}.`;
    }
    const { error } = await khoaTaiKhoanAdmin(selectedUser.id, 'bi_khoa', ngayMoKhoa);
    if (!error) {
      if (selectedUser.vai_tro === 'gia_su') {
        setTutors(tutors.map(t => t.id === selectedUser.id ? { ...t, trang_thai_hoat_dong: 'bi_khoa', ngay_mo_khoa: ngayMoKhoa } : t));
      } else {
        setStudents(students.map(s => s.id === selectedUser.id ? { ...s, trang_thai_hoat_dong: 'bi_khoa', ngay_mo_khoa: ngayMoKhoa } : s));
      }
      await taoThongBao(selectedUser.id, thongBaoKhoa);
      toast.success("Đã khóa tài khoản thành công!");
      setShowBanModal(false);
      setBanReason('');
    } else {
      toast.error("Lỗi khóa tài khoản: " + error.message);
    }
  };

  // ✅ MỞ KHÓA TÀI KHOẢN
  const handleUnbanUser = async () => {
    const user = selectedUser;
    const { error } = await khoaTaiKhoanAdmin(user.id, 'binh_thuong', null);
    if (!error) {
      if (user.vai_tro === 'gia_su') {
        setTutors(tutors.map(t => t.id === user.id ? { ...t, trang_thai_hoat_dong: 'binh_thuong', ngay_mo_khoa: null } : t));
      } else {
        setStudents(students.map(s => s.id === user.id ? { ...s, trang_thai_hoat_dong: 'binh_thuong', ngay_mo_khoa: null } : s));
      }
      await taoThongBao(user.id, "✅ Tài khoản của bạn đã được Admin gỡ lệnh cấm. Hãy tuân thủ quy định nhé!");
      toast.success("Đã mở khóa thành công!");
      setShowUnbanModal(false);
    } else {
      toast.error("Lỗi: " + error.message);
    }
  };

  const filteredTutors = tutors.filter(t => t.ho_ten?.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredStudents = students.filter(s => s.ho_ten?.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredBookings = allBookings.filter(b =>
    b.hoc_vien?.ho_ten?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.gia_su?.ho_ten?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const StatusBadge = ({ status }) => {
    const config = {
      cho_xac_nhan: { bg: 'bg-amber-50', text: 'text-amber-600', label: 'Chờ xác nhận' },
      da_thanh_toan: { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Đã thanh toán' },
      yeu_cau_huy: { bg: 'bg-orange-50', text: 'text-orange-600', label: 'Yêu cầu hủy' },
      da_huy: { bg: 'bg-rose-50', text: 'text-rose-600', label: 'Đã hủy' }
    };
    const { bg, text, label } = config[status] || config.cho_xac_nhan;
    return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${bg} ${text}`}>{label}</span>;
  };

  if (userProfile?.vai_tro !== 'admin') {
    return <div className="flex h-screen items-center justify-center bg-gray-50"><p>Khu vực cấm!</p></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 pb-20">
      <div className="mx-auto max-w-7xl">
        
        {/* HEADER CÓ CHỨA NÚT XUẤT EXCEL */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
              <ShieldCheck className="h-8 w-8 text-blue-600" /> Trung Tâm Quản Trị
            </h1>
            <p className="mt-2 text-slate-500">Bảng điều khiển toàn năng dành cho Admin</p>
          </div>
          <div className="flex gap-3 items-center flex-wrap sm:flex-nowrap">
            {/* ✅ NÚT XUẤT EXCEL */}
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-700 active:scale-95 transition-all"
            >
              <FileSpreadsheet className="h-4 w-4" /> Xuất Excel
            </button>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text" placeholder="Tìm kiếm người dùng..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition-all focus:border-blue-500 shadow-sm"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex py-20 justify-center"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>
        ) : (
          <>
            {stats && (
              <div className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <button onClick={() => setActiveTab('hoc_vien')} className={`text-left rounded-[2rem] border p-6 transition-all hover:-translate-y-1 ${activeTab === 'hoc_vien' ? 'border-blue-400 ring-4 ring-blue-400/20 bg-white shadow-xl' : 'border-blue-100 bg-gradient-to-br from-white to-blue-50/50 shadow-lg shadow-blue-900/5'}`}>
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600"><Users className="h-7 w-7" /></div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Tổng Học Viên</p>
                  <h3 className="mt-1 text-3xl font-black text-blue-950">{stats.totalHocVien}</h3>
                </button>
                <button onClick={() => setActiveTab('gia_su')} className={`text-left rounded-[2rem] border p-6 transition-all hover:-translate-y-1 ${activeTab === 'gia_su' ? 'border-indigo-400 ring-4 ring-indigo-400/20 bg-white shadow-xl' : 'border-indigo-100 bg-gradient-to-br from-white to-indigo-50/50 shadow-lg shadow-indigo-900/5'}`}>
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600"><GraduationCap className="h-7 w-7" /></div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Gia sư Nền tảng</p>
                  <h3 className="mt-1 text-3xl font-black text-indigo-950">{stats.giaSuDaDuyet}</h3>
                  <p className="mt-2 text-xs font-medium text-rose-500 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> {stats.giaSuChoDuyet} hồ sơ chờ duyệt</p>
                </button>
                <button onClick={() => setActiveTab('lich_hoc')} className={`text-left rounded-[2rem] border p-6 transition-all hover:-translate-y-1 ${activeTab === 'lich_hoc' ? 'border-emerald-400 ring-4 ring-emerald-400/20 bg-white shadow-xl' : 'border-emerald-100 bg-gradient-to-br from-white to-emerald-50/50 shadow-lg shadow-emerald-900/5'}`}>
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600"><CalendarDays className="h-7 w-7" /></div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Lịch Học Đã Đặt</p>
                  <h3 className="mt-1 text-3xl font-black text-emerald-950">{stats.totalLichHoc}</h3>
                </button>
                <button onClick={() => setActiveTab('lich_hoc')} className="text-left rounded-[2rem] border p-6 transition-all hover:-translate-y-1 border-amber-100 bg-gradient-to-br from-white to-amber-50/50 shadow-lg shadow-amber-900/5">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600"><DollarSign className="h-7 w-7" /></div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Ước tính Giao dịch</p>
                  <h3 className="mt-1 text-3xl font-black text-amber-950">{stats.doanhThu.toLocaleString()} <span className="text-sm font-bold text-amber-700">₫</span></h3>
                </button>
                <button onClick={() => setActiveTab('rut_tien')} className={`text-left rounded-[2rem] border p-6 transition-all hover:-translate-y-1 ${activeTab === 'rut_tien' ? 'border-purple-400 ring-4 ring-purple-400/20 bg-white shadow-xl' : 'border-purple-100 bg-gradient-to-br from-white to-purple-50/50 shadow-lg'}`}>
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-purple-600"><ArrowDownCircle className="h-7 w-7" /></div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Yêu cầu rút tiền</p>
                  <h3 className="mt-1 text-3xl font-black text-purple-950">{rutTienList.filter(r => r.trang_thai === 'cho_duyet').length}</h3>
                  <p className="mt-2 text-xs font-medium text-amber-500 flex items-center gap-1"><Clock className="h-3 w-3 animate-spin" /> Chờ xử lý</p>
                </button>
                <button onClick={() => setActiveTab('tranh_chap')} className={`text-left rounded-[2rem] border p-6 transition-all hover:-translate-y-1 ${activeTab === 'tranh_chap' ? 'border-red-400 ring-4 ring-red-400/20 bg-white shadow-xl' : 'border-red-100 bg-gradient-to-br from-white to-red-50/50 shadow-lg'}`}>
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600"><Gavel className="h-7 w-7" /></div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Tranh Chấp</p>
                  <h3 className="mt-1 text-3xl font-black text-red-950">{allBookings.filter(b => b.trang_thai === 'dang_tranh_chap').length}</h3>
                  <p className="mt-2 text-xs font-medium text-red-500 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Cần giải quyết</p>
                </button>
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                <h3 className="text-lg font-bold text-slate-800">
                  {activeTab === 'gia_su' && 'Quản lý Hồ sơ Gia sư'}
                  {activeTab === 'hoc_vien' && 'Danh sách Học viên'}
                  {activeTab === 'lich_hoc' && 'Lịch sử Giao dịch & Đặt lịch'}
                  {activeTab === 'rut_tien' && 'Quản lý Yêu cầu Rút tiền'}
                  {activeTab === 'tranh_chap' && 'Giải quyết Tranh chấp & Khiếu nại'}
                </h3>
              </div>

              <div className="overflow-x-auto">
                {/* BẢNG GIA SƯ */}
                {activeTab === 'gia_su' && (
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-800 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 font-bold">Thông tin Gia sư</th>
                        <th className="px-6 py-4 font-bold">Trạng thái Duyệt</th>
                        <th className="px-6 py-4 font-bold">Trạng thái HĐ</th>
                        <th className="px-6 py-4 font-bold text-right">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredTutors.map((tutor) => (
                        <tr key={tutor.id} className="transition-colors hover:bg-slate-50/50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img src={tutor.avatar_url || `https://ui-avatars.com/api/?name=${tutor.ho_ten}&background=3B82F6&color=fff`} className="h-10 w-10 rounded-full object-cover border border-slate-200" alt="" />
                              <div>
                                <p className="font-bold text-slate-900 text-base">{tutor.ho_ten}</p>
                                <p className="flex items-center gap-1 text-xs text-slate-500 mt-0.5"><Mail className="h-3 w-3" /> {tutor.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {tutor.trang_thai_duyet === 'cho_duyet' && <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-600 border border-amber-200"><Loader2 className="h-3 w-3 animate-spin" /> Chờ duyệt</span>}
                            {tutor.trang_thai_duyet === 'da_duyet' && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-600 border border-emerald-200"><CheckCircle className="h-3 w-3" /> Đã duyệt</span>}
                            {tutor.trang_thai_duyet === 'tu_choi' && <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 border border-rose-200"><XCircle className="h-3 w-3" /> Bị từ chối</span>}
                          </td>
                          <td className="px-6 py-4">
                            {tutor.trang_thai_hoat_dong === 'bi_khoa'
                              ? <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600"><ShieldAlert className="h-4 w-4" /> BỊ KHÓA</span>
                              : <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-500"><CheckCircle className="h-4 w-4" /> Bình thường</span>}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => { setSelectedUser(tutor); setShowKYCModal(true); }} className="flex items-center gap-1.5 rounded-lg bg-blue-50 text-blue-600 px-3 py-2 text-xs font-bold hover:bg-blue-100"><Eye className="h-4 w-4" /> Xem hồ sơ</button>
                              {tutor.trang_thai_hoat_dong === 'bi_khoa'
                                ? <button onClick={() => { setSelectedUser(tutor); setShowUnbanModal(true); }} className="flex items-center gap-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 px-3 py-2 text-xs font-bold hover:bg-emerald-100">Mở khóa</button>
                                : <button onClick={() => { setSelectedUser(tutor); setShowBanModal(true); }} className="flex items-center gap-1.5 rounded-lg bg-rose-50 text-rose-600 px-3 py-2 text-xs font-bold hover:bg-rose-100"><AlertTriangle className="h-4 w-4" /> Khóa</button>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* BẢNG HỌC VIÊN */}
                {activeTab === 'hoc_vien' && (
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-800 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 font-bold">Thông tin Học viên</th>
                        <th className="px-6 py-4 font-bold">Ngày tham gia</th>
                        <th className="px-6 py-4 font-bold">Trạng thái</th>
                        <th className="px-6 py-4 font-bold text-right">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStudents.map((student) => (
                        <tr key={student.id} className="transition-colors hover:bg-slate-50/50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img src={student.avatar_url || `https://ui-avatars.com/api/?name=${student.ho_ten}&background=3B82F6&color=fff`} className="h-10 w-10 rounded-full object-cover border border-slate-200" alt="" />
                              <div>
                                <p className="font-bold text-slate-900 text-base">{student.ho_ten}</p>
                                <p className="flex items-center gap-1 text-xs text-slate-500 mt-0.5"><Mail className="h-3 w-3" /> {student.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-500">{new Date(student.created_at).toLocaleDateString('vi-VN')}</td>
                          <td className="px-6 py-4">
                            {student.trang_thai_hoat_dong === 'bi_khoa'
                              ? <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600"><ShieldAlert className="h-4 w-4" /> BỊ KHÓA</span>
                              : <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-500"><CheckCircle className="h-4 w-4" /> Bình thường</span>}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {student.trang_thai_hoat_dong === 'bi_khoa'
                              ? <button onClick={() => { setSelectedUser(student); setShowUnbanModal(true); }} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 px-3 py-2 text-xs font-bold hover:bg-emerald-100">Mở khóa</button>
                              : <button onClick={() => { setSelectedUser(student); setShowBanModal(true); }} className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 text-rose-600 px-3 py-2 text-xs font-bold hover:bg-rose-100"><AlertTriangle className="h-4 w-4" /> Khóa</button>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* BẢNG LỊCH HỌC */}
                {activeTab === 'lich_hoc' && (
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-800 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 font-bold">Ngày giờ</th>
                        <th className="px-6 py-4 font-bold">Học viên</th>
                        <th className="px-6 py-4 font-bold">Gia sư</th>
                        <th className="px-6 py-4 font-bold text-right">Trạng thái & Giá trị</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredBookings.map((booking) => (
                        <tr key={booking.id} className="transition-colors hover:bg-slate-50/50">
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-800">{new Date(booking.thoi_gian_bat_dau).toLocaleDateString('vi-VN')}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1"><Clock className="h-3 w-3" />
                              {new Date(booking.thoi_gian_bat_dau).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </td>
                          <td className="px-6 py-4 font-semibold text-blue-700">{booking.hoc_vien?.ho_ten || 'Không rõ'}</td>
                          <td className="px-6 py-4 font-semibold text-indigo-700">{booking.gia_su?.ho_ten || 'Không rõ'}</td>
                          <td className="px-6 py-4 text-right flex flex-col items-end gap-1.5">
                            <span className="font-black text-rose-600">{Number(booking.tong_tien || 0).toLocaleString()} ₫</span>
                            <StatusBadge status={booking.trang_thai} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* BẢNG RÚT TIỀN */}
                {activeTab === 'rut_tien' && (
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-800 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 font-bold">Gia sư</th>
                        <th className="px-6 py-4 font-bold">Số tiền</th>
                        <th className="px-6 py-4 font-bold">Thông tin ngân hàng</th>
                        <th className="px-6 py-4 font-bold">Ngày yêu cầu</th>
                        <th className="px-6 py-4 font-bold">Trạng thái</th>
                        <th className="px-6 py-4 font-bold text-right">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rutTienList.length === 0 && (
                        <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-400">Chưa có yêu cầu rút tiền nào</td></tr>
                      )}
                      {rutTienList.map(item => (
                        <tr key={item.id} className="transition-colors hover:bg-slate-50/50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img src={item.gia_su?.avatar_url || `https://ui-avatars.com/api/?name=${item.gia_su?.ho_ten}&background=3B82F6&color=fff`} className="h-10 w-10 rounded-full object-cover border border-slate-200" alt="" />
                              <div>
                                <p className="font-bold text-slate-900">{item.gia_su?.ho_ten}</p>
                                <p className="text-xs text-slate-500">{item.gia_su?.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-black text-rose-600 text-base">{Number(item.so_tien).toLocaleString()} ₫</td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-800">{item.ten_ngan_hang}</p>
                            <p className="text-xs text-slate-500">{item.so_tai_khoan}</p>
                            <p className="text-xs text-slate-500">{item.ten_chu_tk}</p>
                          </td>
                          <td className="px-6 py-4 text-slate-500">{new Date(item.created_at).toLocaleDateString('vi-VN')}</td>
                          <td className="px-6 py-4">
                            {item.trang_thai === 'cho_duyet' && <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-600 border border-amber-200"><Clock className="h-3 w-3" /> Chờ duyệt</span>}
                            {item.trang_thai === 'da_chuyen' && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-600 border border-emerald-200"><CheckCircle className="h-3 w-3" /> Đã chuyển</span>}
                            {item.trang_thai === 'tu_choi' && <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 border border-rose-200"><XCircle className="h-3 w-3" /> Từ chối</span>}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {item.trang_thai === 'cho_duyet' && (
                              <div className="flex justify-end gap-2">
                                <button onClick={async () => {
                                  const { error } = await duyetRutTienAdmin(item.id, 'da_chuyen');
                                  if (!error) {
                                    toast.success("Đã duyệt chuyển tiền!");
                                    setRutTienList(prev => prev.map(r => r.id === item.id ? { ...r, trang_thai: 'da_chuyen' } : r));
                                    await taoThongBao(item.id_gia_su, `✅ Yêu cầu rút ${Number(item.so_tien).toLocaleString()}₫ đã được duyệt và chuyển khoản thành công!`);
                                  }
                                }} className="flex items-center gap-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 px-3 py-2 text-xs font-bold hover:bg-emerald-100">
                                  <CheckCircle className="h-4 w-4" /> Đã chuyển
                                </button>
                                <button onClick={async () => {
                                  const { error } = await duyetRutTienAdmin(item.id, 'tu_choi', 'Thông tin tài khoản không hợp lệ');
                                  if (!error) {
                                    toast.success("Đã từ chối yêu cầu!");
                                    setRutTienList(prev => prev.map(r => r.id === item.id ? { ...r, trang_thai: 'tu_choi' } : r));
                                    await taoThongBao(item.id_gia_su, `❌ Yêu cầu rút tiền của bạn bị từ chối. Vui lòng kiểm tra lại thông tin ngân hàng.`);
                                  }
                                }} className="flex items-center gap-1.5 rounded-lg bg-rose-50 text-rose-600 px-3 py-2 text-xs font-bold hover:bg-rose-100">
                                  <XCircle className="h-4 w-4" /> Từ chối
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* BẢNG TRANH CHẤP */}
                {activeTab === 'tranh_chap' && (() => {
                  const tranhChapList = allBookings.filter(b => b.trang_thai === 'dang_tranh_chap');
                  return (
                    <table className="w-full text-left text-sm text-slate-600">
                      <thead className="bg-slate-50 text-slate-800 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-4 font-bold">Ngày giờ</th>
                          <th className="px-6 py-4 font-bold">Học viên</th>
                          <th className="px-6 py-4 font-bold">Gia sư</th>
                          <th className="px-6 py-4 font-bold">Số tiền</th>
                          <th className="px-6 py-4 font-bold">Lý do khiếu nại</th>
                          <th className="px-6 py-4 font-bold text-right">Phán quyết</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {tranhChapList.length === 0 && (
                          <tr><td colSpan="6" className="px-6 py-16 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50"><CheckCircle className="h-8 w-8 text-emerald-400" /></div>
                              <p className="font-bold text-slate-600">Không có tranh chấp nào!</p>
                              <p className="text-xs text-slate-400">Tất cả lịch học đang diễn ra bình thường</p>
                            </div>
                          </td></tr>
                        )}
                        {tranhChapList.map(item => (
                          <tr key={item.id} className="transition-colors hover:bg-red-50/30 border-l-4 border-l-red-400">
                            <td className="px-6 py-4">
                              <p className="font-bold text-slate-800">{new Date(item.thoi_gian_bat_dau).toLocaleDateString('vi-VN')}</p>
                              <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                <Clock className="h-3 w-3" />
                                {new Date(item.thoi_gian_bat_dau).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-bold text-blue-700">{item.hoc_vien?.ho_ten || 'Không rõ'}</p>
                              <p className="text-xs text-slate-400">{item.hoc_vien?.email}</p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-bold text-indigo-700">{item.gia_su?.ho_ten || 'Không rõ'}</p>
                              <p className="text-xs text-slate-400">{item.gia_su?.email}</p>
                            </td>
                            <td className="px-6 py-4 font-black text-rose-600">{Number(item.tong_tien || 0).toLocaleString()} ₫</td>
                            <td className="px-6 py-4 max-w-xs">
                              <div className="rounded-xl bg-red-50 border border-red-100 p-3">
                                <p className="text-xs font-bold text-red-600 uppercase mb-1">Lý do khiếu nại</p>
                                <p className="text-sm text-slate-700 leading-relaxed">{item.ly_do_tranh_chap || 'Không có lý do'}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex flex-col gap-2 items-end">
                                {/* NÚT HOÀN TIỀN CHO HỌC VIÊN */}
                                <button
                                  onClick={async () => {
                                    const { error } = await giaiQuyetTranhChapAdmin(item.id, 'da_hoan_tien');
                                    if (!error) {
                                      toast.success("Đã phán quyết: Hoàn tiền cho học viên!");
                                      // Cập nhật state
                                      const updated = allBookings.map(b => b.id === item.id ? { ...b, trang_thai: 'da_hoan_tien' } : b);
                                      setAllBookings(updated);
                                      // Thông báo cho cả 2 bên
                                      await taoThongBao(item.id_hoc_vien, `⚖️ Admin đã phán quyết: Tranh chấp lịch học được giải quyết. Tiền sẽ được HOÀN LẠI cho bạn!`);
                                      await taoThongBao(item.id_gia_su, `⚖️ Admin đã phán quyết tranh chấp: Tiền buổi học này sẽ được hoàn lại cho học viên. Vui lòng liên hệ Admin nếu có thắc mắc.`);
                                      // Trừ tiền chờ duyệt của gia sư
                                    } else {
                                      toast.error("Lỗi: " + error.message);
                                    }
                                  }}
                                  className="flex items-center gap-1.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 px-4 py-2 text-xs font-bold hover:bg-blue-100 transition-all w-full justify-center"
                                >
                                  <XCircle className="h-4 w-4" /> Hoàn tiền cho Học viên
                                </button>
                                {/* NÚT CHUYỂN TIỀN CHO GIA SƯ */}
                                <button
                                  onClick={async () => {
                                    const { error } = await giaiQuyetTranhChapAdmin(item.id, 'hoan_thanh');
                                    if (!error) {
                                      toast.success("Đã phán quyết: Chuyển tiền cho gia sư!");
                                      const updated = allBookings.map(b => b.id === item.id ? { ...b, trang_thai: 'hoan_thanh' } : b);
                                      setAllBookings(updated);
                                      await taoThongBao(item.id_gia_su, `⚖️ Admin đã phán quyết: Tranh chấp được giải quyết có lợi cho bạn. Tiền buổi học đã được chuyển vào ví!`);
                                      await taoThongBao(item.id_hoc_vien, `⚖️ Admin đã phán quyết tranh chấp: Sau khi xem xét, tiền buổi học sẽ được chuyển cho Gia sư. Liên hệ Admin nếu có thắc mắc.`);
                                    } else {
                                      toast.error("Lỗi: " + error.message);
                                    }
                                  }}
                                  className="flex items-center gap-1.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 px-4 py-2 text-xs font-bold hover:bg-emerald-100 transition-all w-full justify-center"
                                >
                                  <CheckCircle className="h-4 w-4" /> Chuyển tiền cho Gia sư
                                </button>
                                <p className="text-[10px] text-slate-400 text-center">Quyết định không thể hoàn tác</p>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  );
                })()}

              </div>
            </div>
          </>
        )}
      </div>

      {/* ===== MODAL XEM HỒ SƠ KYC ===== */}
      {showKYCModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl my-8 overflow-hidden rounded-2xl bg-white shadow-2xl animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><Eye className="h-5 w-5" /> Hồ sơ chi tiết & KYC</h3>
              <button onClick={() => setShowKYCModal(false)} className="text-white/80 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex flex-col sm:flex-row gap-6 mb-6 pb-6 border-b border-slate-100">
                <img src={selectedUser.avatar_url || `https://ui-avatars.com/api/?name=${selectedUser.ho_ten}&background=3B82F6&color=fff`} className="h-24 w-24 rounded-2xl object-cover shadow-sm border border-slate-200" alt="" />
                <div className="flex-1 space-y-2">
                  <h2 className="text-2xl font-black text-slate-900">{selectedUser.ho_ten}</h2>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-600 mt-2">
                    <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100"><Mail className="h-4 w-4 text-slate-400" /> {selectedUser.email}</span>
                    <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100"><Phone className="h-4 w-4 text-slate-400" /> {selectedUser.so_dien_thoai || 'Trống'}</span>
                    <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100"><MapPin className="h-4 w-4 text-slate-400" /> {selectedUser.dia_chi || 'Trống'}</span>
                  </div>
                </div>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 mb-8">
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                  <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Môn học đăng ký</p>
                  <p className="font-bold text-slate-800">{selectedUser.chi_tiet_gia_su?.mon_hoc || 'Chưa có'}</p>
                </div>
                <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4">
                  <p className="text-xs font-bold text-amber-600 uppercase mb-1">Học phí đề xuất</p>
                  <p className="font-bold text-slate-800">{selectedUser.chi_tiet_gia_su?.gia_tien_moi_gio?.toLocaleString() || '0'} VNĐ/h</p>
                </div>
                <div className="sm:col-span-2 rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Giới thiệu bản thân</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedUser.chi_tiet_gia_su?.gioi_thieu || 'Chưa viết giới thiệu.'}</p>
                </div>
              </div>
              <div className="mb-8 border-t border-slate-100 pt-6">
                <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-blue-500" /> Tài liệu Xác minh Danh tính (KYC)
                </h4>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-2 uppercase">Ảnh CCCD / CMND</p>
                    {selectedUser.chi_tiet_gia_su?.anh_cccd
                      ? <a href={selectedUser.chi_tiet_gia_su.anh_cccd} target="_blank" rel="noopener noreferrer"><img src={selectedUser.chi_tiet_gia_su.anh_cccd} className="w-full h-48 object-cover rounded-xl border border-slate-200 shadow-sm hover:opacity-80 transition-opacity cursor-pointer" alt="CCCD" /></a>
                      : <div className="w-full h-48 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex flex-col gap-2 items-center justify-center text-slate-400 text-sm"><XCircle className="h-6 w-6 text-slate-300" /> Chưa tải ảnh CCCD</div>}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-2 uppercase">Bằng cấp / Thẻ sinh viên</p>
                    {selectedUser.chi_tiet_gia_su?.anh_bang_cap
                      ? <a href={selectedUser.chi_tiet_gia_su.anh_bang_cap} target="_blank" rel="noopener noreferrer"><img src={selectedUser.chi_tiet_gia_su.anh_bang_cap} className="w-full h-48 object-cover rounded-xl border border-slate-200 shadow-sm hover:opacity-80 transition-opacity cursor-pointer" alt="Bằng cấp" /></a>
                      : <div className="w-full h-48 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex flex-col gap-2 items-center justify-center text-slate-400 text-sm"><XCircle className="h-6 w-6 text-slate-300" /> Chưa tải ảnh Bằng cấp</div>}
                  </div>
                </div>
              </div>
              {selectedUser.trang_thai_duyet === 'cho_duyet' && (
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button onClick={() => setShowApproveModal(true)} className="flex-1 flex justify-center items-center gap-2 rounded-xl bg-emerald-500 py-3.5 font-bold text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 active:scale-95 transition-all">
                    <CheckCircle className="h-5 w-5" /> Phê duyệt Gia sư
                  </button>
                  <button onClick={() => setShowRejectModal(true)} className="flex-1 flex justify-center items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 py-3.5 font-bold text-rose-600 hover:bg-rose-100 active:scale-95 transition-all">
                    <XCircle className="h-5 w-5" /> Từ chối
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL XÁC NHẬN PHÊ DUYỆT ===== */}
      {showApproveModal && selectedUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl animate-[fadeIn_0.2s_ease-out] overflow-hidden">
            <div className="bg-emerald-500 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><CheckCircle className="h-5 w-5" /> Xác nhận Phê duyệt</h3>
              <button onClick={() => setShowApproveModal(false)} className="text-white/80 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              <p className="text-sm text-slate-600">Bạn xác nhận <b>PHÊ DUYỆT</b> hồ sơ gia sư của <b>{selectedUser.ho_ten}</b>? Họ sẽ được phép nhận học viên ngay sau đó.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowApproveModal(false)} className="flex-1 rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-600 hover:bg-slate-200">Hủy</button>
                <button onClick={handleApprove} className="flex-1 rounded-xl bg-emerald-500 py-3 text-sm font-bold text-white hover:bg-emerald-600 active:scale-95 transition-all">Xác nhận</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL TỪ CHỐI (có ô nhập lý do) ===== */}
      {showRejectModal && selectedUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl animate-[fadeIn_0.2s_ease-out] overflow-hidden">
            <div className="bg-rose-500 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><XCircle className="h-5 w-5" /> Từ chối Hồ sơ</h3>
              <button onClick={() => { setShowRejectModal(false); setRejectReason(''); }} className="text-white/80 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">Nhập lý do từ chối hồ sơ của <b>{selectedUser.ho_ten}</b>. Lý do này sẽ được gửi thông báo đến họ.</p>
              <textarea
                rows="3" placeholder="VD: Ảnh CCCD không rõ ràng, bằng cấp không hợp lệ..."
                value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
              />
              <div className="flex gap-3">
                <button onClick={() => { setShowRejectModal(false); setRejectReason(''); }} className="flex-1 rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-600 hover:bg-slate-200">Hủy</button>
                <button onClick={handleReject} className="flex-1 rounded-xl bg-rose-600 py-3 text-sm font-bold text-white hover:bg-rose-700 active:scale-95 transition-all">Xác nhận Từ chối</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL MỞ KHÓA ===== */}
      {showUnbanModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl animate-[fadeIn_0.2s_ease-out] overflow-hidden">
            <div className="bg-emerald-500 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><CheckCircle className="h-5 w-5" /> Xác nhận Mở khóa</h3>
              <button onClick={() => setShowUnbanModal(false)} className="text-white/80 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              <p className="text-sm text-slate-600">Bạn muốn <b>MỞ KHÓA</b> tài khoản của <b>{selectedUser.ho_ten}</b>? Họ sẽ có thể sử dụng nền tảng bình thường trở lại.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowUnbanModal(false)} className="flex-1 rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-600 hover:bg-slate-200">Hủy</button>
                <button onClick={handleUnbanUser} className="flex-1 rounded-xl bg-emerald-500 py-3 text-sm font-bold text-white hover:bg-emerald-600 active:scale-95 transition-all">Mở khóa</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL KHÓA TÀI KHOẢN ===== */}
      {showBanModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-rose-500 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><ShieldAlert className="h-5 w-5" /> Xử lý Vi phạm</h3>
              <button onClick={() => setShowBanModal(false)} className="text-white/80 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleBanUser} className="p-6 space-y-5">
              <p className="text-sm text-slate-600">Bạn đang chuẩn bị khóa tài khoản của <b>{selectedUser.ho_ten}</b>.</p>
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Thời hạn khóa</label>
                <select value={banDuration} onChange={e => setBanDuration(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10">
                  <option value="7">Cảnh cáo (Khóa 7 ngày)</option>
                  <option value="30">Vi phạm nặng (Khóa 30 ngày)</option>
                  <option value="permanent">Cấm vĩnh viễn</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Lý do khóa (Bắt buộc)</label>
                <textarea required rows="3" placeholder="VD: Boom lịch học nhiều lần..." value={banReason} onChange={e => setBanReason(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowBanModal(false)} className="flex-1 rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-600 hover:bg-slate-200">Hủy</button>
                <button type="submit" className="flex-1 flex justify-center items-center gap-2 rounded-xl bg-rose-600 py-3 text-sm font-bold text-white shadow-lg shadow-rose-500/30 hover:bg-rose-700 active:scale-95 transition-all">
                  <AlertTriangle className="h-4 w-4" /> Xác nhận Khóa
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