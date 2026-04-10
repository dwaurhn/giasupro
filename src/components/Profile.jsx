import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { layDanhGiaGiaSu, getLichRanhGiaSu, uploadAnhLenSupabase } from '../services/authService'; // <-- ĐÃ THÊM HÀM UPLOAD
import { 
  Settings, User, Phone, MapPin, BookOpen, DollarSign, 
  GraduationCap, Mail, Save, X, Camera, Star, Loader2, MessageSquareQuote,
  CalendarDays, Clock, CheckCircle2, Users, Trash, ShieldCheck,
  Image as ImageIcon, XCircle, UploadCloud // <-- THÊM ICON UPLOAD
} from 'lucide-react';

export default function Profile({ session, userProfile, setUserProfile }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false); // <-- STATE MỚI: QUẢN LÝ TRẠNG THÁI ĐANG TẢI ẢNH
  
  // Dữ liệu hiển thị
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [lichRanh, setLichRanh] = useState([]);

  // Dữ liệu Form
  const [formData, setFormData] = useState({
    ho_ten: '',
    so_dien_thoai: '',
    dia_chi: '',
    avatar_url: '',
    mon_hoc: '',
    gia_tien_moi_gio: '',
    gioi_thieu: '',
    anh_cccd: '',
    anh_bang_cap: ''
  });

  useEffect(() => {
    fetchProfile();
  }, [session]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data: userData, error } = await supabase
        .from('nguoi_dung')
        .select(`
          *,
          chi_tiet_gia_su ( mon_hoc, gia_tien_moi_gio, gioi_thieu, anh_cccd, anh_bang_cap ) 
        `) 
        .eq('id', session.user.id)
        .single();

      if (error) throw error;

      setProfile(userData);

      // Xử lý thông minh: Dù Supabase trả về Object hay Array đều đọc được
      const chiTiet = Array.isArray(userData.chi_tiet_gia_su) 
                      ? userData.chi_tiet_gia_su[0] 
                      : userData.chi_tiet_gia_su;

      setFormData({
        ho_ten: userData.ho_ten || '',
        so_dien_thoai: userData.so_dien_thoai || '',
        dia_chi: userData.dia_chi || '',
        avatar_url: userData.avatar_url || '',
        mon_hoc: chiTiet?.mon_hoc || '',
        gia_tien_moi_gio: chiTiet?.gia_tien_moi_gio || '',
        gioi_thieu: chiTiet?.gioi_thieu || '',
        anh_cccd: chiTiet?.anh_cccd || '',         
        anh_bang_cap: chiTiet?.anh_bang_cap || ''  
      });

      if (userData.vai_tro === 'gia_su') {
        const [reviewRes, lichRes] = await Promise.all([
          layDanhGiaGiaSu(session.user.id),
          getLichRanhGiaSu(session.user.id)
        ]);
        
        if (reviewRes.data) setReviews(reviewRes.data);
        if (lichRes.data) setLichRanh(lichRes.data);
      }
    } catch (error) {
      console.error('Lỗi tải hồ sơ:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // 1. Cập nhật bảng nguoi_dung
      const { error: userError } = await supabase
        .from('nguoi_dung')
        .update({
          ho_ten: formData.ho_ten,
          so_dien_thoai: formData.so_dien_thoai,
          dia_chi: formData.dia_chi,
          avatar_url: formData.avatar_url
        })
        .eq('id', session.user.id);

      if (userError) throw userError;

      // 2. Cập nhật bảng chi_tiet_gia_su
      if (profile.vai_tro === 'gia_su') {
        const { error: tutorError } = await supabase
          .from('chi_tiet_gia_su')
          .upsert({
            id_nguoi_dung: session.user.id,
            mon_hoc: formData.mon_hoc,
            gia_tien_moi_gio: formData.gia_tien_moi_gio ? Number(formData.gia_tien_moi_gio) : null,
            gioi_thieu: formData.gioi_thieu,
            anh_cccd: formData.anh_cccd,         
            anh_bang_cap: formData.anh_bang_cap  
          }, { onConflict: 'id_nguoi_dung' }); 

        if (tutorError) throw tutorError;
      }

      alert('Cập nhật hồ sơ thành công!');
      setIsEditing(false);
      fetchProfile(); 
      
      if (setUserProfile) {
        setUserProfile(prev => ({ ...prev, ho_ten: formData.ho_ten, avatar_url: formData.avatar_url }));
      }
      
    } catch (error) {
      alert('Lỗi cập nhật: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // ================= HÀM XỬ LÝ KHI NGƯỜI DÙNG CHỌN FILE TỪ MÁY =================
  const handleUploadFile = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    // Chặn file > 5MB
    if (file.size > 5 * 1024 * 1024) {
      return alert("Dung lượng ảnh quá lớn. Vui lòng chọn ảnh dưới 5MB.");
    }

    setUploadingImage(true);
    
    // Gọi hàm upload đã viết ở authService
    const { url, error } = await uploadAnhLenSupabase(file);
    
    if (error) {
      alert("Lỗi tải ảnh: " + (error.message || "Không thể kết nối đến máy chủ lưu trữ."));
    } else if (url) {
      // Lắp URL ảnh mới vào đúng trường dữ liệu đang thao tác
      setFormData(prev => ({ ...prev, [fieldName]: url }));
    }
    
    setUploadingImage(false);
  };
  // ===========================================================================

  const getAvatarFallback = (name) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=3B82F6&color=fff&size=256&bold=true`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-sm font-medium text-slate-500">Đang tải hồ sơ...</p>
        </div>
      </div>
    );
  }

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, curr) => acc + curr.so_sao, 0) / reviews.length).toFixed(1) 
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      
      {/* HEADER CÓ GRADIENT XANH */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-500 pb-24 pt-14">
        <div className="relative z-10 mx-auto max-w-3xl px-5 text-center">
           <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
             Trang Cá Nhân
           </h1>
           <p className="mb-8 text-blue-100">Quản lý thông tin và hồ sơ giảng dạy của bạn</p>
        </div>

        {/* Nút Bánh Răng nằm nổi bật */}
        <div className="absolute right-6 top-6 z-20 flex gap-3">
          {!isEditing ? (
            <button 
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 rounded-full bg-white/20 px-5 py-2.5 text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/30 shadow-lg"
            >
              <Settings className="h-4 w-4" /> Chỉnh sửa hồ sơ
            </button>
          ) : (
            <button 
              onClick={() => setIsEditing(false)}
              className="flex items-center gap-2 rounded-full bg-rose-500/90 px-5 py-2.5 text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-rose-600 shadow-lg"
            >
              <X className="h-4 w-4" /> Hủy chỉnh sửa
            </button>
          )}
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 w-full leading-none">
          <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 40L60 36.7C120 33 240 27 360 30C480 33 600 47 720 53.3C840 60 960 60 1080 53.3C1200 47 1320 33 1380 26.7L1440 20V100H1380C1320 100 1200 100 1080 100C960 100 840 100 720 100C600 100 480 100 360 100C240 100 120 100 60 100H0V40Z" fill="#F8FAFC"/>
          </svg>
        </div>
      </section>

      {/* NỘI DUNG CHÍNH */}
      <div className="mx-auto -mt-10 max-w-5xl px-4 sm:px-6 relative z-10">
        <div className="grid gap-8 md:grid-cols-3">
          
          {/* ================= CỘT TRÁI ================= */}
          <div className="space-y-6">
            <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 text-center shadow-xl shadow-slate-200/50">
              
              {/* KHU VỰC AVATAR ĐÃ ĐƯỢC ĐỘ THÀNH NÚT TẢI ẢNH */}
              <div className="group relative mx-auto mb-4 h-32 w-32 overflow-hidden rounded-[2rem] border-8 border-white bg-slate-100 shadow-lg">
                <img 
                  src={formData.avatar_url || getAvatarFallback(formData.ho_ten)} 
                  alt={formData.ho_ten} 
                  className="h-full w-full object-cover" 
                />
                {isEditing && (
                  <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/50 text-white opacity-0 backdrop-blur-sm transition-all group-hover:opacity-100">
                    {uploadingImage ? <Loader2 className="h-8 w-8 animate-spin" /> : <Camera className="h-8 w-8" />}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUploadFile(e, 'avatar_url')} disabled={uploadingImage} />
                  </label>
                )}
              </div>

              <h1 className="mb-1 text-2xl font-black text-slate-900">{formData.ho_ten || 'Chưa cập nhật tên'}</h1>
              
              <div className={`mb-6 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider 
                ${profile?.vai_tro === 'admin' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 
                  profile?.vai_tro === 'gia_su' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                {profile?.vai_tro === 'admin' && <><ShieldCheck className="h-4 w-4" /> Quản Trị Hệ Thống</>}
                {profile?.vai_tro === 'gia_su' && <><GraduationCap className="h-4 w-4" /> Gia Sư Nền Tảng</>}
                {profile?.vai_tro === 'hoc_vien' && <><User className="h-4 w-4" /> Học Viên</>}
              </div>

              <div className="flex flex-col gap-3 text-left text-sm text-slate-600">
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                  <Mail className="h-5 w-5 text-slate-400 shrink-0" />
                  <span className="truncate">{session.user.email}</span>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                  <Phone className="h-5 w-5 text-slate-400 shrink-0" />
                  <span>{formData.so_dien_thoai || 'Chưa cập nhật SĐT'}</span>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                  <MapPin className="h-5 w-5 text-slate-400 shrink-0" />
                  <span>{formData.dia_chi || 'Chưa cập nhật địa chỉ'}</span>
                </div>
              </div>
            </div>

            {!isEditing && profile?.vai_tro === 'gia_su' && (
               <>
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
                      {formData.gia_tien_moi_gio ? `${Number(formData.gia_tien_moi_gio).toLocaleString()}` : 'Thỏa thuận'}
                      <span className="text-base font-medium"> ₫/h</span>
                    </p>
                  </div>
               </>
            )}
          </div>

          {/* ================= CỘT PHẢI ================= */}
          <div className="md:col-span-2">
            
            {isEditing ? (
              // ================= FORM CHỈNH SỬA =================
              <form onSubmit={handleSave} className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-xl relative overflow-hidden">
                
                {/* LỚP PHỦ KHI ĐANG UPLOAD ẢNH */}
                {uploadingImage && (
                  <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-3" />
                    <p className="font-bold text-slate-800">Đang tải ảnh lên hệ thống...</p>
                  </div>
                )}

                <h2 className="mb-6 flex items-center gap-3 text-xl font-black text-slate-900">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600"><Settings className="h-5 w-5" /></div>
                  Cập nhật thông tin
                </h2>

                <div className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Họ và Tên</label>
                      <input type="text" required value={formData.ho_ten} onChange={e => setFormData({...formData, ho_ten: e.target.value})} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 p-3.5 text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Số điện thoại</label>
                      <input type="text" value={formData.so_dien_thoai} onChange={e => setFormData({...formData, so_dien_thoai: e.target.value})} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 p-3.5 text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all" />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Địa chỉ</label>
                    <input type="text" value={formData.dia_chi} onChange={e => setFormData({...formData, dia_chi: e.target.value})} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 p-3.5 text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all" />
                  </div>

                  {profile?.vai_tro === 'gia_su' && (
                    <div className="mt-8 border-t border-slate-100 pt-8 space-y-5">
                       <h3 className="text-sm font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2 mb-4">
                         <BookOpen className="h-4 w-4" /> Thông tin Giảng dạy & KYC
                       </h3>

                       <div className="grid gap-5 sm:grid-cols-2">
                          <div>
                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Môn học phụ trách</label>
                            <input type="text" placeholder="VD: Lập trình Web, Tiếng Anh..." value={formData.mon_hoc} onChange={e => setFormData({...formData, mon_hoc: e.target.value})} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 p-3.5 text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-all" />
                          </div>
                          <div>
                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Học phí (VNĐ/Giờ)</label>
                            <input type="number" placeholder="VD: 150000" value={formData.gia_tien_moi_gio} onChange={e => setFormData({...formData, gia_tien_moi_gio: e.target.value})} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 p-3.5 text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-all" />
                          </div>

                          {/* ===== KHU VỰC TẢI ẢNH CCCD ===== */}
                          <div>
                            <label className="mb-1.5 flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                              <ImageIcon className="h-3.5 w-3.5" /> Ảnh CCCD/CMND
                            </label>
                            {formData.anh_cccd ? (
                              <div className="relative h-32 rounded-xl border-2 border-emerald-500 overflow-hidden group">
                                <img src={formData.anh_cccd} className="w-full h-full object-cover" alt="CCCD" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                  <label className="cursor-pointer text-white text-sm font-bold flex items-center gap-1">
                                    <UploadCloud className="h-5 w-5"/> Đổi ảnh
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUploadFile(e, 'anh_cccd')} disabled={uploadingImage} />
                                  </label>
                                </div>
                              </div>
                            ) : (
                              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 hover:border-blue-400 transition-all">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                  <UploadCloud className="w-8 h-8 mb-2 text-slate-400" />
                                  <p className="text-sm text-slate-500 font-semibold">Bấm để tải ảnh CCCD</p>
                                </div>
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUploadFile(e, 'anh_cccd')} disabled={uploadingImage} />
                              </label>
                            )}
                          </div>

                          {/* ===== KHU VỰC TẢI ẢNH BẰNG CẤP ===== */}
                          <div>
                            <label className="mb-1.5 flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                              <ImageIcon className="h-3.5 w-3.5" /> Bằng Cấp / Thẻ SV
                            </label>
                            {formData.anh_bang_cap ? (
                              <div className="relative h-32 rounded-xl border-2 border-emerald-500 overflow-hidden group">
                                <img src={formData.anh_bang_cap} className="w-full h-full object-cover" alt="Bằng cấp" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                  <label className="cursor-pointer text-white text-sm font-bold flex items-center gap-1">
                                    <UploadCloud className="h-5 w-5"/> Đổi ảnh
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUploadFile(e, 'anh_bang_cap')} disabled={uploadingImage} />
                                  </label>
                                </div>
                              </div>
                            ) : (
                              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 hover:border-blue-400 transition-all">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                  <UploadCloud className="w-8 h-8 mb-2 text-slate-400" />
                                  <p className="text-sm text-slate-500 font-semibold">Bấm để tải Bằng cấp</p>
                                </div>
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUploadFile(e, 'anh_bang_cap')} disabled={uploadingImage} />
                              </label>
                            )}
                          </div>
                       </div>

                       <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Giới thiệu & Kinh nghiệm</label>
                        <textarea rows="4" placeholder="Giới thiệu về kinh nghiệm giảng dạy của bạn..." value={formData.gioi_thieu} onChange={e => setFormData({...formData, gioi_thieu: e.target.value})} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 p-3.5 text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-all" />
                      </div>
                    </div>
                  )}

                  <div className="pt-4">
                    <button type="submit" disabled={saving || uploadingImage} className="w-full flex items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:bg-blue-700 active:scale-95 disabled:bg-slate-400 disabled:shadow-none">
                      {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                      Lưu Thay Đổi
                    </button>
                  </div>
                </div>
              </form>

            ) : (
              // ================= CHẾ ĐỘ XEM HỒ SƠ =================
              <div className="space-y-8">
                {profile?.vai_tro === 'gia_su' ? (
                  <>
                    <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm">
                      <h2 className="mb-6 flex items-center gap-3 text-xl font-black text-slate-900">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600"><BookOpen className="h-5 w-5" /></div>
                        Hồ sơ giảng dạy của bạn
                      </h2>

                      <div className="mb-8 grid gap-4 sm:grid-cols-2">
                        <div className="rounded-2xl bg-slate-50 p-5 border border-slate-100">
                          <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Môn học phụ trách</h3>
                          <p className="font-bold text-blue-700">{formData.mon_hoc || 'Chưa cập nhật'}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-5 border border-slate-100">
                          <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Trạng thái duyệt</h3>
                          {profile?.trang_thai_duyet === 'da_duyet' ? (
                            <span className="inline-flex items-center gap-1.5 text-emerald-600 font-bold"><CheckCircle2 className="h-5 w-5" /> Đã được xác minh</span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-amber-500 font-bold"><Clock className="h-5 w-5" /> Đang chờ duyệt</span>
                          )}
                        </div>
                      </div>

                      {/* HIỂN THỊ ẢNH KYC CHO GIA SƯ TỰ XEM */}
                      <div className="mb-8 border-t border-slate-100 pt-6">
                        <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-blue-500" /> Tài liệu xác minh KYC (Ẩn với học viên)
                        </h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                           <div className="relative h-32 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center">
                             {formData.anh_cccd ? <a href={formData.anh_cccd} target="_blank" rel="noopener noreferrer"><img src={formData.anh_cccd} className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" alt="CCCD" /></a> : <div className="flex flex-col items-center gap-1"><XCircle className="h-5 w-5 text-slate-300" /><span className="text-xs text-slate-400 font-medium">Chưa có ảnh CCCD</span></div>}
                             <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] font-bold p-1.5 text-center pointer-events-none">Ảnh CCCD / CMND</div>
                           </div>
                           <div className="relative h-32 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center">
                             {formData.anh_bang_cap ? <a href={formData.anh_bang_cap} target="_blank" rel="noopener noreferrer"><img src={formData.anh_bang_cap} className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" alt="Bang cap" /></a> : <div className="flex flex-col items-center gap-1"><XCircle className="h-5 w-5 text-slate-300" /><span className="text-xs text-slate-400 font-medium">Chưa có Bằng cấp</span></div>}
                             <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] font-bold p-1.5 text-center pointer-events-none">Bằng cấp / Thẻ SV</div>
                           </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-slate-400">Giới thiệu bản thân</h3>
                        <div className="rounded-2xl bg-slate-50 p-6 text-slate-700 leading-relaxed whitespace-pre-wrap min-h-[100px]">
                          {formData.gioi_thieu || "Bạn chưa cập nhật phần giới thiệu bản thân."}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm">
                      <div className="mb-6 flex items-center justify-between">
                        <h2 className="flex items-center gap-3 text-xl font-black text-slate-900">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-600"><CalendarDays className="h-5 w-5" /></div>
                          Khung giờ dạy hiện tại
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
                                  <p className="font-bold text-slate-900 text-sm">
                                    {lich.gio_bat_dau.substring(0, 5)} - {lich.gio_ket_thuc.substring(0, 5)}
                                  </p>
                                  <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                                    <Users className="h-3 w-3" /> Tối đa {lich.so_luong_toi_da} HS
                                  </p>
                                </div>
                              </div>
                              <CheckCircle2 className="h-5 w-5 text-emerald-500 opacity-50" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center">
                          <Clock className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                          <p className="font-medium text-slate-500">Bạn chưa thiết lập lịch rảnh. Hãy sang trang Dashboard để thêm nhé!</p>
                        </div>
                      )}
                    </div>

                    <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm">
                      <div className="mb-6 flex items-center justify-between">
                        <h2 className="flex items-center gap-3 text-xl font-black text-slate-900">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-500">
                            <Star className="h-5 w-5 fill-current" />
                          </div>
                          Đánh giá từ Học viên
                        </h2>
                      </div>

                      {reviews.length > 0 ? (
                        <div className="space-y-4">
                          {reviews.map((rv) => (
                            <div key={rv.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-5 transition-all hover:bg-white hover:shadow-md hover:border-slate-200">
                              <div className="mb-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <img 
                                    src={rv.hoc_vien?.avatar_url || getAvatarFallback(rv.hoc_vien?.ho_ten)} 
                                    alt={rv.hoc_vien?.ho_ten || "Học viên"} 
                                    className="h-10 w-10 rounded-full border border-slate-200 object-cover"
                                  />
                                  <div>
                                    <p className="font-bold text-slate-900 text-sm">{rv.hoc_vien?.ho_ten || 'Học viên ẩn danh'}</p>
                                    <p className="text-xs text-slate-400">{new Date(rv.created_at).toLocaleDateString('vi-VN')}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 rounded-lg bg-amber-100 px-2.5 py-1 text-amber-600">
                                  <span className="text-sm font-black">{rv.so_sao}</span>
                                  <Star className="h-3.5 w-3.5 fill-current" />
                                </div>
                              </div>
                              <p className="text-sm text-slate-700 italic border-l-2 border-slate-200 pl-3">"{rv.nhan_xet}"</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center">
                          <MessageSquareQuote className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                          <p className="font-bold text-slate-500">Chưa có đánh giá nào.</p>
                          <p className="text-sm text-slate-400 mt-1">Hãy dạy thật nhiệt tình để nhận cơn mưa sao từ học viên nhé!</p>
                        </div>
                      )}
                    </div>
                  </>
                ) : profile?.vai_tro === 'admin' ? (
                  <div className="flex h-full flex-col items-center justify-center rounded-[2.5rem] border-2 border-dashed border-amber-200 bg-amber-50/50 p-12 text-center">
                     <ShieldCheck className="mx-auto mb-4 h-16 w-16 text-amber-400" />
                     <h2 className="text-xl font-black text-amber-900 mb-2">Hồ sơ Quản Trị Viên</h2>
                     <p className="text-amber-700/80">Hãy sang trang Quản Trị Hệ Thống để bắt đầu công việc điều hành nền tảng.</p>
                  </div>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center rounded-[2.5rem] border-2 border-dashed border-blue-100 bg-blue-50/50 p-12 text-center">
                     <BookOpen className="mx-auto mb-4 h-16 w-16 text-blue-300" />
                     <h2 className="text-xl font-black text-blue-900 mb-2">Hồ sơ Học Viên</h2>
                     <p className="text-blue-600/70">Thông tin của bạn đã được cập nhật. Hãy sang trang Tìm Gia Sư để bắt đầu học nhé.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}