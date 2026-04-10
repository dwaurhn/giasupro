import { supabase } from '../supabaseClient';

// 1. Hàm Đăng ký
export const dangKyTaiKhoan = async (email, password, hoTen, vaiTro) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          ho_ten: hoTen,
          vai_tro: vaiTro,
        },
      },
    });

    if (error) return { success: false, message: error.message };
    return { success: true, data: data };
  } catch (err) {
    return { success: false, message: "Đã có lỗi xảy ra." };
  }
};

// 2. Hàm Đăng nhập
export const signInWithPassword = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
};

// 3. Hàm Đăng xuất
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

// 4. Hàm lấy thông tin chi tiết (CẬP NHẬT: Gộp dữ liệu từ bảng chi_tiet_gia_su)
export const getUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from('nguoi_dung')
    .select('*, chi_tiet_gia_su(*)') // Dấu * sẽ lấy TẤT CẢ các cột, bao gồm cả avatar_url mới thêm
    .eq('id', userId)
    .single();
  return { data, error };
};

// 5. Hàm Cập nhật thông tin (CẬP NHẬT: Xử lý lưu cả 2 bảng)
export const updateUserProfile = async (userId, vaiTro, updatesNguoiDung, updatesChiTietGiaSu = null) => {
  // 5.1 Cập nhật bảng chung (nguoi_dung)
  const { error: err1 } = await supabase
    .from('nguoi_dung')
    .update(updatesNguoiDung)
    .eq('id', userId);
    
  if (err1) return { error: err1 };

  // 5.2 Nếu là gia sư, dùng lệnh 'upsert' (cập nhật nếu có, tạo mới nếu chưa có) cho bảng chi_tiet_gia_su
  if (vaiTro === 'gia_su' && updatesChiTietGiaSu) {
    const { error: err2 } = await supabase
      .from('chi_tiet_gia_su')
      .upsert({ id_nguoi_dung: userId, ...updatesChiTietGiaSu });
      
    if (err2) return { error: err2 };
  }

  return { error: null };
};

// 6. Hàm lấy danh sách toàn bộ Gia Sư (MỚI: Dùng cho trang TutorList)
export const getDanhSachGiaSu = async () => {
  const { data, error } = await supabase
    .from('nguoi_dung')
    .select(`*, chi_tiet_gia_su(*)`)
    .eq('vai_tro', 'gia_su')
    .eq('trang_thai_duyet', 'da_duyet')
    .eq('trang_thai_hoat_dong', 'binh_thuong'); 
  return { data, error };
};

// 7. Hàm gửi yêu cầu đặt lịch
export const guiYeuCauDatLich = async (bookingData) => {
  const { data, error } = await supabase
    .from('dat_lich_hoc')
    .insert([bookingData]);
  return { data, error };
};

// 8. Hàm lấy danh sách học viên đã đặt lịch với Gia sư
export const getLichDayCuaGiaSu = async (giaSuId) => {
  const { data, error } = await supabase
    .from('dat_lich_hoc')
    .select(`
      *,
      hoc_vien:nguoi_dung!dat_lich_hoc_id_hoc_vien_fkey(ho_ten, so_dien_thoai, avatar_url)
    `) 
    .eq('id_gia_su', giaSuId)
    .order('created_at', { ascending: false });

  if (error) console.error("LỖI LẤY LỊCH DẠY:", error);

  return { data, error };
};

// Cập nhật trạng thái lịch học (và lưu link phòng học nếu có)
export const capNhatTrangThaiLichHoc = async (idLichHoc, trangThaiMoi, linkPhongHoc = null) => {
  const updateData = { trang_thai: trangThaiMoi };
  
  // Nếu có truyền link phòng học vào thì mới cập nhật cột đó
  if (linkPhongHoc !== null) {
    updateData.link_phong_hoc = linkPhongHoc;
  }

  const { data, error } = await supabase
    .from('dat_lich_hoc')
    .update(updateData)
    .eq('id', idLichHoc)
    .select();
    
  return { data, error };
};

// Hàm lấy danh sách lịch đã đặt của Học viên
export const getLichHocCuaHocVien = async (hocVienId) => {
  const { data, error } = await supabase
    .from('dat_lich_hoc')
    .select(`
      *,
      gia_su:nguoi_dung!dat_lich_hoc_id_gia_su_fkey(ho_ten, so_dien_thoai, avatar_url)
    `) 
    .eq('id_hoc_vien', hocVienId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("LỖI LẤY LỊCH CỦA HỌC VIÊN:", error);
  }

  return { data, error };
};

// ==========================================
// QUẢN LÝ LỊCH RẢNH CỦA GIA SƯ
// ==========================================

// 1. Lấy danh sách lịch rảnh
export const getLichRanhGiaSu = async (giaSuId) => {
  const { data, error } = await supabase
    .from('lich_ranh_gia_su')
    .select('*')
    .eq('id_gia_su', giaSuId)
    .order('thu_trong_tuan', { ascending: true })
    .order('gio_bat_dau', { ascending: true });
  return { data, error };
};

// 2. Thêm lịch rảnh mới
export const themLichRanh = async (lichRanhData) => {
  const { data, error } = await supabase
    .from('lich_ranh_gia_su')
    .insert([lichRanhData])
    .select(); 
  return { data, error };
};

// 3. Xóa lịch rảnh
export const xoaLichRanh = async (idLichRanh) => {
  const { error } = await supabase
    .from('lich_ranh_gia_su')
    .delete()
    .eq('id', idLichRanh);
  return { error };
};

// Hàm lấy các lịch ĐÃ ĐƯỢC DUYỆT, ĐANG CHỜ, hoặc ĐANG XIN HỦY
export const getLichDaDat = async (giaSuId) => {
  const { data, error } = await supabase
    .from('dat_lich_hoc')
    .select('thoi_gian_bat_dau, thoi_gian_ket_thuc, trang_thai, id_hoc_vien') 
    .eq('id_gia_su', giaSuId)
    .in('trang_thai', ['da_thanh_toan', 'cho_xac_nhan', 'yeu_cau_huy']); 
    
  return { data, error };
};

// ==========================================
// TÍNH NĂNG CHAT REAL-TIME
// ==========================================

// 1. Hàm lấy lịch sử tin nhắn giữa 2 người
export const layLichSuTinNhan = async (myId, partnerId) => {
  const { data, error } = await supabase
    .from('tin_nhan')
    .select('*')
    .or(`and(id_nguoi_gui.eq.${myId},id_nguoi_nhan.eq.${partnerId}),and(id_nguoi_gui.eq.${partnerId},id_nguoi_nhan.eq.${myId})`)
    .order('created_at', { ascending: true }); 

  if (error) console.error("Lỗi tải tin nhắn:", error);
  return { data, error };
};

// 2. Hàm gửi tin nhắn mới
export const guiTinNhan = async (idNguoiGui, idNguoiNhan, noiDung) => {
  const { data, error } = await supabase
    .from('tin_nhan')
    .insert([
      { 
        id_nguoi_gui: idNguoiGui, 
        id_nguoi_nhan: idNguoiNhan, 
        noi_dung: noiDung 
      }
    ])
    .select();

  if (error) console.error("Lỗi gửi tin nhắn:", error);
  return { data, error };
};

// 3. Hàm đếm số tin nhắn chưa đọc (Hiển thị chấm đỏ)
export const laySoTinNhanChuaDoc = async (myId) => {
  const { data, error } = await supabase
    .from('tin_nhan')
    .select('id_nguoi_gui')
    .eq('id_nguoi_nhan', myId)
    .eq('da_xem', false);

  if (error) {
    console.error("Lỗi đếm tin nhắn:", error);
    return {};
  }

  const counts = {};
  data.forEach(msg => {
    counts[msg.id_nguoi_gui] = (counts[msg.id_nguoi_gui] || 0) + 1;
  });
  return counts;
};

// 4. Hàm đánh dấu đã đọc (Xóa chấm đỏ khi mở chat)
export const danhDauDaDoc = async (myId, partnerId) => {
  const { error } = await supabase
    .from('tin_nhan')
    .update({ da_xem: true })
    .eq('id_nguoi_nhan', myId)
    .eq('id_nguoi_gui', partnerId)
    .eq('da_xem', false);
  return { error };
};

// Lấy danh sách đánh giá của Gia sư
export const layDanhGiaGiaSu = async (idGiaSu) => {
  const { data, error } = await supabase
    .from('danh_gia')
    .select(`
      *,
      hoc_vien:nguoi_dung!danh_gia_id_hoc_vien_fkey(ho_ten, avatar_url)
    `)
    .eq('id_gia_su', idGiaSu)
    .order('created_at', { ascending: false });
  
  return { data, error };
};

// Gửi đánh giá mới (SỬ DỤNG UPSERT ĐỂ TRÁNH LỖI 409)
export const guiDanhGia = async (danhGiaData) => {
  const { data: lichHoc, error: findError } = await supabase
    .from('dat_lich_hoc')
    .select('id')
    .eq('id_gia_su', danhGiaData.id_gia_su)
    .eq('id_hoc_vien', danhGiaData.id_hoc_vien)
    .limit(1);

  if (findError || !lichHoc || lichHoc.length === 0) {
    return { error: { message: "Bạn phải từng đặt lịch với gia sư này thì mới được phép gửi đánh giá!" } };
  }

  const dataToUpsert = {
    id_dat_lich: lichHoc[0].id,
    id_gia_su: danhGiaData.id_gia_su,
    id_hoc_vien: danhGiaData.id_hoc_vien,
    so_sao: danhGiaData.so_sao,
    nhan_xet: danhGiaData.nhan_xet 
  };

  const { data, error } = await supabase
    .from('danh_gia')
    .upsert(
      [dataToUpsert], 
      { onConflict: 'id_dat_lich' } 
    )
    .select();
    
  return { data, error };
};

// ================= HỆ THỐNG THÔNG BÁO =================

// 1. Tải danh sách thông báo về
export const layThongBao = async (userId) => {
  return await supabase
    .from('thong_bao')
    .select('*')
    .eq('id_nguoi_dung', userId)
    .order('created_at', { ascending: false })
    .limit(15);
};

// 2. Tắt chấm đỏ khi người dùng bấm vào xem thông báo
export const danhDauThongBaoDaDoc = async (idThongBao) => {
  return await supabase
    .from('thong_bao')
    .update({ da_doc: true })
    .eq('id', idThongBao);
};

// 3. Hệ thống tự động bắn thông báo khi có sự kiện
export const taoThongBao = async (userId, noiDung, linkDen = '/dashboard') => {
  return await supabase
    .from('thong_bao')
    .insert([{ id_nguoi_dung: userId, noi_dung: noiDung, link_den: linkDen }]);
};

// ================= CÁC HÀM DÀNH CHO ADMIN =================

// 1. Lấy danh sách toàn bộ Gia sư (Bao gồm cả chờ duyệt và đã duyệt)
export const getDanhSachGiaSuAdmin = async () => {
  const { data, error } = await supabase
    .from('nguoi_dung')
    .select(`*, chi_tiet_gia_su(*)`)
    .eq('vai_tro', 'gia_su')
    .order('created_at', { ascending: false });
  return { data, error };
};

// 2. Admin duyệt hoặc từ chối Gia sư
export const capNhatTrangThaiDuyetGiaSu = async (idGiaSu, trangThai) => {
  const { data, error } = await supabase
    .from('nguoi_dung')
    .update({ trang_thai_duyet: trangThai })
    .eq('id', idGiaSu);
  return { data, error };
};

// 3. Admin lấy dữ liệu Thống kê Tổng quan
export const getThongKeAdmin = async () => {
  try {
    const { data: users, error: usersError } = await supabase
      .from('nguoi_dung')
      .select('vai_tro, trang_thai_duyet');

    const { data: bookings, error: bookingsError } = await supabase
      .from('dat_lich_hoc')
      .select('trang_thai, tong_tien');

    if (usersError || bookingsError) throw usersError || bookingsError;

    const totalHocVien = users.filter(u => u.vai_tro === 'hoc_vien').length;
    const giaSuDaDuyet = users.filter(u => u.vai_tro === 'gia_su' && u.trang_thai_duyet === 'da_duyet').length;
    const giaSuChoDuyet = users.filter(u => u.vai_tro === 'gia_su' && u.trang_thai_duyet === 'cho_duyet').length;

    const totalLichHoc = bookings.length;
    const doanhThu = bookings
      .filter(b => b.trang_thai === 'da_thanh_toan')
      .reduce((sum, b) => sum + (Number(b.tong_tien) || 0), 0);

    return {
      data: { totalHocVien, giaSuDaDuyet, giaSuChoDuyet, totalLichHoc, doanhThu }
    };
  } catch (error) {
    console.error("Lỗi lấy thống kê:", error);
    return { error };
  }
};

// 4. Admin lấy danh sách toàn bộ Học viên
export const getDanhSachHocVienAdmin = async () => {
  const { data, error } = await supabase
    .from('nguoi_dung')
    .select('*')
    .eq('vai_tro', 'hoc_vien')
    .order('created_at', { ascending: false });
  return { data, error };
};

// 5. Admin lấy toàn bộ Lịch sử Đặt lịch (Kèm tên người dạy và người học)
export const getToanBoLichHocAdmin = async () => {
  const { data, error } = await supabase
    .from('dat_lich_hoc')
    .select(`
      *,
      hoc_vien:id_hoc_vien(ho_ten, email),
      gia_su:id_gia_su(ho_ten, email)
    `)
    .order('created_at', { ascending: false });
  return { data, error };
};

// 6. Admin Khóa / Mở khóa tài khoản (Xử lý vi phạm)
export const khoaTaiKhoanAdmin = async (idNguoiDung, trangThai, ngayMoKhoa = null) => {
  const { data, error } = await supabase
    .from('nguoi_dung')
    .update({ 
      trang_thai_hoat_dong: trangThai, 
      ngay_mo_khoa: ngayMoKhoa 
    })
    .eq('id', idNguoiDung);
  return { data, error };
};

// ================= HÀM UPLOAD ẢNH LÊN SUPABASE STORAGE =================
export const uploadAnhLenSupabase = async (file) => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.floor(Math.random() * 1000)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    return { url: publicUrlData.publicUrl, error: null };
  } catch (error) {
    console.error("Lỗi upload ảnh:", error);
    return { url: null, error };
  }
};

// ================= CÁC HÀM XỬ LÝ TRANH CHẤP & KHIẾU NẠI =================

// 7. Học viên gửi khiếu nại (Đóng băng lịch học)
export const guiKhieuNaiLichHoc = async (idLichHoc, lyDo) => {
  const { data, error } = await supabase
    .from('dat_lich_hoc')
    .update({ 
      trang_thai: 'dang_tranh_chap', 
      ly_do_tranh_chap: lyDo 
    })
    .eq('id', idLichHoc);
  return { data, error };
};

// 8. Admin phán quyết tranh chấp
export const giaiQuyetTranhChapAdmin = async (idLichHoc, phanQuyet) => {
  const { data, error } = await supabase
    .from('dat_lich_hoc')
    .update({ trang_thai: phanQuyet })
    .eq('id', idLichHoc);
  return { data, error };
};

// ================= ESCROW SYSTEM =================
export const congTienChoGiaSu = async (idGiaSu, soTien) => {
  const { data: giaSu } = await supabase.from('nguoi_dung').select('so_du_cho_duyet').eq('id', idGiaSu).single();
  const { error } = await supabase.from('nguoi_dung').update({ so_du_cho_duyet: (giaSu?.so_du_cho_duyet || 0) + soTien }).eq('id', idGiaSu);
  return { error };
};

export const xacNhanHocXong = async (idLichHoc, idGiaSu, soTien) => {
  const HOA_HONG = 0.1;
  const tienThucNhan = soTien * (1 - HOA_HONG);

  const { error: e1 } = await supabase.from('dat_lich_hoc').update({ trang_thai: 'hoan_thanh', hoc_vien_xac_nhan: true }).eq('id', idLichHoc);
  if (e1) return { error: e1 };

  const { data: giaSu } = await supabase.from('nguoi_dung').select('so_du_cho_duyet, so_du_kha_dung').eq('id', idGiaSu).single();
  const { error: e2 } = await supabase.from('nguoi_dung').update({
    so_du_cho_duyet: Math.max(0, (giaSu?.so_du_cho_duyet || 0) - soTien),
    so_du_kha_dung: (giaSu?.so_du_kha_dung || 0) + tienThucNhan
  }).eq('id', idGiaSu);
  return { error: e2 };
};

// ================= VÍ GIA SƯ =================

// ✅ ĐÃ CHÈN ID ADMIN VÀO ĐÂY
const ADMIN_ID = '50860268-ddb5-4b4b-8d81-b59e26380e77';

export const layThongTinVi = async (idGiaSu) => {
  const { data, error } = await supabase.from('nguoi_dung').select('so_du_cho_duyet, so_du_kha_dung').eq('id', idGiaSu).single();
  return { data, error };
};

export const guiYeuCauRutTien = async (idGiaSu, soTien, soTaiKhoan, tenNganHang, tenChuTk) => {
  const { data: giaSu } = await supabase.from('nguoi_dung').select('so_du_kha_dung, ho_ten').eq('id', idGiaSu).single();
  if ((giaSu?.so_du_kha_dung || 0) < soTien) return { error: { message: 'Số dư khả dụng không đủ!' } };

  const { error: e1 } = await supabase.from('nguoi_dung').update({ so_du_kha_dung: giaSu.so_du_kha_dung - soTien }).eq('id', idGiaSu);
  if (e1) return { error: e1 };

  const { error: e2 } = await supabase.from('yeu_cau_rut_tien').insert([{ id_gia_su: idGiaSu, so_tien: soTien, so_tai_khoan: soTaiKhoan, ten_ngan_hang: tenNganHang, ten_chu_tk: tenChuTk }]);
  
  // Bắn thông báo cho Admin
  if (!e2 && ADMIN_ID) {
    await taoThongBao(
      ADMIN_ID, 
      `💰 YÊU CẦU RÚT TIỀN: Gia sư ${giaSu.ho_ten} vừa yêu cầu rút ${Number(soTien).toLocaleString()}₫. Hãy kiểm tra ngay!`, 
      '/admin'
    );
  }

  return { error: e2 };
};

export const layLichSuRutTien = async (idGiaSu) => {
  const { data, error } = await supabase.from('yeu_cau_rut_tien').select('*').eq('id_gia_su', idGiaSu).order('created_at', { ascending: false });
  return { data, error };
};

export const getDanhSachRutTienAdmin = async () => {
  const { data, error } = await supabase
    .from('yeu_cau_rut_tien')
    // Sửa lại cú pháp Join: gia_su:nguoi_dung(...) thay vì gia_su:id_gia_su(...)
    .select(`*, gia_su:nguoi_dung(ho_ten, email, avatar_url)`) 
    .order('created_at', { ascending: false });
    
  if (error) console.error("Lỗi lấy DS Rút tiền Admin:", error);
  return { data, error };
};
export const duyetRutTienAdmin = async (idYeuCau, trangThai, ghiChu = '') => {
  const { error } = await supabase.from('yeu_cau_rut_tien').update({ trang_thai: trangThai, ghi_chu: ghiChu }).eq('id', idYeuCau);
  return { error };
};

export const layTatCaDanhGia = async () => {
  const { data, error } = await supabase
    .from('danh_gia')
    .select(`
      *,
      hoc_vien:id_hoc_vien(ho_ten, avatar_url),
      gia_su:id_gia_su(ho_ten, avatar_url, chi_tiet_gia_su(mon_hoc))
    `)
    .order('created_at', { ascending: false })
    .limit(6);
  return { data, error };
};