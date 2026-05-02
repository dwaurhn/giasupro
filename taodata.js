import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hhlyiyvfttybfcljteqj.supabase.co';
// Token Service Role của bạn đã chính xác
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhobHlpeXZmdHR5YmZjbGp0ZXFqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjI3MTQxMCwiZXhwIjoyMDg3ODQ3NDEwfQ.8bataiIyFVy7UDkGxEDESWD8YJbUkuGfYKiFKohr6l4';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// --- KHAI BÁO CÁC DANH MỤC (THIẾU CÁI NÀY LÀ LỖI) ---
const listMonHoc = ['Toán Học', 'Ngữ Văn', 'Tiếng Anh'];
const listKhoiDay = ['6-7', '8-9'];

const danhSachUsers = [
  // --- 20 HỌC VIÊN ---
  { ho_ten: 'Lê Phương Anh', email: 'hocvien.phuonganh@gmail.com', sdt: '0901000001', vai_tro: 'hoc_vien', dia_chi: 'Hà Nội', mon: null, gia: null },
  { ho_ten: 'Trần Bảo Quốc', email: 'hocvien.baoquoc@gmail.com', sdt: '0901000002', vai_tro: 'hoc_vien', dia_chi: 'TP.HCM', mon: null, gia: null },
  { ho_ten: 'Nguyễn Hoàng Bách', email: 'hocvien.hoangbach@gmail.com', sdt: '0901000003', vai_tro: 'hoc_vien', dia_chi: 'Đà Nẵng', mon: null, gia: null },
  { ho_ten: 'Phạm Thảo My', email: 'hocvien.thaomy@gmail.com', sdt: '0901000004', vai_tro: 'hoc_vien', dia_chi: 'Cần Thơ', mon: null, gia: null },
  { ho_ten: 'Vũ Đức Hải', email: 'hocvien.duchai@gmail.com', sdt: '0901000005', vai_tro: 'hoc_vien', dia_chi: 'Hải Phòng', mon: null, gia: null },
  { ho_ten: 'Đặng Tuấn Kiệt', email: 'hocvien.tuankiet@gmail.com', sdt: '0901000006', vai_tro: 'hoc_vien', dia_chi: 'Hà Nội', mon: null, gia: null },
  { ho_ten: 'Bùi Nhã Uyên', email: 'hocvien.nhauyen@gmail.com', sdt: '0901000007', vai_tro: 'hoc_vien', dia_chi: 'TP.HCM', mon: null, gia: null },
  { ho_ten: 'Đỗ Minh Khang', email: 'hocvien.minhkhang@gmail.com', sdt: '0901000008', vai_tro: 'hoc_vien', dia_chi: 'Đà Nẵng', mon: null, gia: null },
  { ho_ten: 'Hồ Mai Phương', email: 'hocvien.maiphuong@gmail.com', sdt: '0901000009', vai_tro: 'hoc_vien', dia_chi: 'Cần Thơ', mon: null, gia: null },
  { ho_ten: 'Ngô Gia Bảo', email: 'hocvien.giabao@gmail.com', sdt: '0901000010', vai_tro: 'hoc_vien', dia_chi: 'Hải Phòng', mon: null, gia: null },
  { ho_ten: 'Lý Lan Hương', email: 'hocvien.lanhuong@gmail.com', sdt: '0901000011', vai_tro: 'hoc_vien', dia_chi: 'Hà Nội', mon: null, gia: null },
  { ho_ten: 'Tạ Nhật Minh', email: 'hocvien.nhatminh@gmail.com', sdt: '0901000012', vai_tro: 'hoc_vien', dia_chi: 'TP.HCM', mon: null, gia: null },
  { ho_ten: 'Châu Ngọc Diệp', email: 'hocvien.ngocdiep@gmail.com', sdt: '0901000013', vai_tro: 'hoc_vien', dia_chi: 'Đà Nẵng', mon: null, gia: null },
  { ho_ten: 'Dương Quang Thái', email: 'hocvien.quangthai@gmail.com', sdt: '0901000014', vai_tro: 'hoc_vien', dia_chi: 'Cần Thơ', mon: null, gia: null },
  { ho_ten: 'Phan Thị Xuân', email: 'hocvien.thixuan@gmail.com', sdt: '0901000015', vai_tro: 'hoc_vien', dia_chi: 'Hải Phòng', mon: null, gia: null },
  { ho_ten: 'Đinh Trọng Ân', email: 'hocvien.trongan@gmail.com', sdt: '0901000016', vai_tro: 'hoc_vien', dia_chi: 'Hà Nội', mon: null, gia: null },
  { ho_ten: 'Tô Cẩm Tú', email: 'hocvien.camtu@gmail.com', sdt: '0901000017', vai_tro: 'hoc_vien', dia_chi: 'TP.HCM', mon: null, gia: null },
  { ho_ten: 'Lâm Đình Khoa', email: 'hocvien.dinhkhoa@gmail.com', sdt: '0901000018', vai_tro: 'hoc_vien', dia_chi: 'Đà Nẵng', mon: null, gia: null },
  { ho_ten: 'Trịnh Yến Nhi', email: 'hocvien.yennhi@gmail.com', sdt: '0901000019', vai_tro: 'hoc_vien', dia_chi: 'Cần Thơ', mon: null, gia: null },
  { ho_ten: 'Đoàn Thanh Sơn', email: 'hocvien.thanhson@gmail.com', sdt: '0901000020', vai_tro: 'hoc_vien', dia_chi: 'Hải Phòng', mon: null, gia: null },

  // --- 20 GIA SƯ ---
  { ho_ten: 'Lê Quang Khải', email: 'giasu.quangkhai@gmail.com', sdt: '0902000001', vai_tro: 'gia_su', dia_chi: 'Hà Nội', gia: '150000' },
  { ho_ten: 'Nguyễn Trọng Đạt', email: 'giasu.trongdat@gmail.com', sdt: '0902000002', vai_tro: 'gia_su', dia_chi: 'TP.HCM', gia: '200000' },
  { ho_ten: 'Trần Thanh Trúc', email: 'giasu.thanhtruc@gmail.com', sdt: '0902000003', vai_tro: 'gia_su', dia_chi: 'Đà Nẵng', gia: '120000' },
  { ho_ten: 'Phạm Hoàng Long', email: 'giasu.hoanglong@gmail.com', sdt: '0902000004', vai_tro: 'gia_su', dia_chi: 'Cần Thơ', gia: '180000' },
  { ho_ten: 'Vũ Kim Oanh', email: 'giasu.kimoanh@gmail.com', sdt: '0902000005', vai_tro: 'gia_su', dia_chi: 'Hải Phòng', gia: '150000' },
  { ho_ten: 'Đặng Ngọc Hân', email: 'giasu.ngochan@gmail.com', sdt: '0902000006', vai_tro: 'gia_su', dia_chi: 'Hà Nội', gia: '130000' },
  { ho_ten: 'Bùi Tiến Dũng', email: 'giasu.tiendung@gmail.com', sdt: '0902000007', vai_tro: 'gia_su', dia_chi: 'TP.HCM', gia: '250000' },
  { ho_ten: 'Đỗ Bích Ngọc', email: 'giasu.bichngoc@gmail.com', sdt: '0902000008', vai_tro: 'gia_su', dia_chi: 'Đà Nẵng', gia: '220000' },
  { ho_ten: 'Hồ Quốc Việt', email: 'giasu.quocviet@gmail.com', sdt: '0902000009', vai_tro: 'gia_su', dia_chi: 'Cần Thơ', gia: '160000' },
  { ho_ten: 'Ngô Quỳnh Mai', email: 'giasu.quynhmai@gmail.com', sdt: '0902000010', vai_tro: 'gia_su', dia_chi: 'Hải Phòng', gia: '140000' },
  { ho_ten: 'Lý Hải Nam', email: 'giasu.hainam@gmail.com', sdt: '0902000011', vai_tro: 'gia_su', dia_chi: 'Hà Nội', gia: '170000' },
  { ho_ten: 'Tạ Phương Thảo', email: 'giasu.phuongthao@gmail.com', sdt: '0902000012', vai_tro: 'gia_su', dia_chi: 'TP.HCM', gia: '190000' },
  { ho_ten: 'Châu Tấn Phát', email: 'giasu.tanphat@gmail.com', sdt: '0902000013', vai_tro: 'gia_su', dia_chi: 'Đà Nẵng', gia: '150000' },
  { ho_ten: 'Dương Đăng Khoa', email: 'giasu.dangkhoa@gmail.com', sdt: '0902000014', vai_tro: 'gia_su', dia_chi: 'Cần Thơ', gia: '200000' },
  { ho_ten: 'Phan Minh Nhật', email: 'giasu.minhnhat@gmail.com', sdt: '0902000015', vai_tro: 'gia_su', dia_chi: 'Hải Phòng', gia: '180000' },
  { ho_ten: 'Đinh Ánh Tuyết', email: 'giasu.anhtuyet@gmail.com', sdt: '0902000016', vai_tro: 'gia_su', dia_chi: 'Hà Nội', gia: '160000' },
  { ho_ten: 'Tô Văn Hiếu', email: 'giasu.vanhieu@gmail.com', sdt: '0902000017', vai_tro: 'gia_su', dia_chi: 'TP.HCM', gia: '190000' },
  { ho_ten: 'Lâm Thúy Vy', email: 'giasu.thuyvy@gmail.com', sdt: '0902000018', vai_tro: 'gia_su', dia_chi: 'Đà Nẵng', gia: '250000' },
  { ho_ten: 'Trịnh Đức Trí', email: 'giasu.ductri@gmail.com', sdt: '0902000019', vai_tro: 'gia_su', dia_chi: 'Cần Thơ', gia: '140000' },
  { ho_ten: 'Đoàn Mỹ Linh', email: 'giasu.mylinh@gmail.com', sdt: '0902000020', vai_tro: 'gia_su', dia_chi: 'Hải Phòng', gia: '170000' }
];

async function seedData() {
  console.log("🚀 Bắt đầu quá trình tạo tài khoản...");

  for (const user of danhSachUsers) {
    let currentId = null;

    // 1. Cố gắng tạo Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: '123456',
      email_confirm: true,
      user_metadata: { ho_ten: 'Temp Name', vai_tro: user.vai_tro }
    });

    if (authError) {
      // Sửa điều kiện so khớp lỗi của Supabase
      if (authError.message.toLowerCase().includes("already") || authError.status === 422) {
        console.log(`⚠️ Email ${user.email} đã tồn tại, đang lấy ID...`);
        const { data: listData } = await supabase.auth.admin.listUsers();
        const found = listData.users.find(u => u.email === user.email);
        if (found) currentId = found.id;
      } else {
        console.error(`❌ Lỗi Auth ${user.email}:`, authError.message);
        continue;
      }
    } else {
      currentId = authData.user.id;
    }

    if (!currentId) continue;

    // 2. Logic Môn & Khối
    let m = user.mon;
    let k = null;
    if (user.vai_tro === 'gia_su') {
      m = listMonHoc[Math.floor(Math.random() * listMonHoc.length)];
      k = listKhoiDay[Math.floor(Math.random() * listKhoiDay.length)];
    }

    // 3. Upsert vào public.nguoi_dung
    const { error: profileError } = await supabase
      .from('nguoi_dung')
      .upsert({
        id: currentId,
        ho_ten: user.ho_ten,
        email: user.email,
        so_dien_thoai: user.sdt,
        vai_tro: user.vai_tro,
        dia_chi: user.dia_chi,
        mon_hoc: m,
        khoi_day: k,
        hoc_phi: user.gia,
        trang_thai_duyet: 'da_duyet'
      });

    if (profileError) {
      console.error(`❌ Lỗi Profile ${user.email}:`, profileError.message);
    } else {
      console.log(`✅ Thành công: ${user.email} ${user.vai_tro === 'gia_su' ? `(${m} - Khối ${k})` : ''}`);
    }
  }
  console.log("🎉 HOÀN TẤT!");
}

seedData();