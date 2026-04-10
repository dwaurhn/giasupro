import { supabase } from '../supabaseClient';

// 1. Lấy danh sách bài viết
export const layDanhSachBaiViet = async () => {
  const { data, error } = await supabase
    .from('bai_viet')
    .select(`
      *,
      nguoi_dang:id_nguoi_dang (ho_ten, avatar_url, vai_tro)
    `)
    .order('created_at', { ascending: false });

  return { data, error };
};

// 2. Tạo bài viết mới (CÓ LƯU ẢNH)
export const taoBaiViet = async (idNguoiDang, noiDung, loaiBaiViet = 'thao_luan', hinhAnhUrl = null) => {
  const { data, error } = await supabase
    .from('bai_viet')
    .insert([
      {
        id_nguoi_dang: idNguoiDang,
        noi_dung: noiDung,
        loai_bai_viet: loaiBaiViet,
        hinh_anh_url: hinhAnhUrl // Đã bổ sung lưu ảnh vào Database
      }
    ])
    .select(`*, nguoi_dang:id_nguoi_dang (ho_ten, avatar_url, vai_tro)`);

  return { data, error };
};

// 3. Thả tim (hoặc bỏ thả tim)
export const toggleLikeBaiViet = async (idBaiViet, idNguoiDung) => {
  const { data: existingLike, error: checkError } = await supabase
    .from('thich_bai_viet')
    .select('*')
    .eq('id_bai_viet', idBaiViet)
    .eq('id_nguoi_dung', idNguoiDung)
    .single();

  if (checkError && checkError.code !== 'PGRST116') { 
    return { error: checkError };
  }

  if (existingLike) {
    const { error: deleteError } = await supabase
      .from('thich_bai_viet')
      .delete()
      .eq('id_bai_viet', idBaiViet)
      .eq('id_nguoi_dung', idNguoiDung);
    return { data: { liked: false }, error: deleteError };
  } else {
    const { error: insertError } = await supabase
      .from('thich_bai_viet')
      .insert([{ id_bai_viet: idBaiViet, id_nguoi_dung: idNguoiDung }]);
    return { data: { liked: true }, error: insertError };
  }
};

// 4. Lấy danh sách bình luận của 1 bài viết
export const layBinhLuanCuaBaiViet = async (idBaiViet) => {
  const { data, error } = await supabase
    .from('binh_luan')
    .select(`*, nguoi_binh_luan:id_nguoi_binh_luan(ho_ten, avatar_url, vai_tro)`)
    .eq('id_bai_viet', idBaiViet)
    .order('created_at', { ascending: true });
  return { data, error };
};

// 5. Gửi bình luận mới
export const taoBinhLuan = async (idBaiViet, idNguoiDung, noiDung) => {
  const { data, error } = await supabase
    .from('binh_luan')
    .insert([{ id_bai_viet: idBaiViet, id_nguoi_binh_luan: idNguoiDung, noi_dung: noiDung }])
    .select(`*, nguoi_binh_luan:id_nguoi_binh_luan(ho_ten, avatar_url, vai_tro)`);
  return { data, error };
};