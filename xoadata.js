import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hhlyiyvfttybfcljteqj.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhobHlpeXZmdHR5YmZjbGp0ZXFqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjI3MTQxMCwiZXhwIjoyMDg3ODQ3NDEwfQ.8bataiIyFVy7UDkGxEDESWD8YJbUkuGfYKiFKohr6l4';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function cleanTrash() {
  console.log("🧹 Đang quét dọn tài khoản cũ...");

  // 1. Lấy danh sách toàn bộ user trong Auth
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error("Lỗi lấy danh sách:", listError.message);
    return;
  }

  // 2. Lọc ra các email giả lập (hocvien... và giasu...)
  const targets = users.filter(u => 
    u.email.includes('hocvien.') || u.email.includes('giasu.')
  );

  console.log(`Tìm thấy ${targets.length} tài khoản rác.`);

  // 3. Xóa từng đứa một
  for (const u of targets) {
    const { error: delError } = await supabase.auth.admin.deleteUser(u.id);
    if (delError) {
      console.error(`❌ Không thể xóa ${u.email}:`, delError.message);
    } else {
      console.log(`🗑️ Đã xóa: ${u.email}`);
    }
  }

  // 4. Xóa luôn ở bảng public cho chắc (Dù xóa Auth thường sẽ cascade nhưng cứ làm cho sạch)
  await supabase.from('nguoi_dung').delete().ilike('email', 'hocvien.%');
  await supabase.from('nguoi_dung').delete().ilike('email', 'giasu.%');

  console.log("✨ ĐÃ DỌN SẠCH SẼ!");
}

cleanTrash();