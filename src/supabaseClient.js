import { createClient } from '@supabase/supabase-js';

// Dán trực tiếp URL và Key vào đây luôn, không dùng .env nữa
const supabaseUrl = 'https://hhlyiyvfttybfcljteqj.supabase.co'; 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhobHlpeXZmdHR5YmZjbGp0ZXFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNzE0MTAsImV4cCI6MjA4Nzg0NzQxMH0.8YNI419CDkkGhDKqzT0ugQIuHgLoGQPh37UyorKiUy0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
// Hàm upload ảnh lên Supabase Storage
export const uploadFile = async (bucket, file) => {
  try {
    // Tạo tên file duy nhất để không bị trùng (ví dụ: avatar_12345678.jpg)
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // 1. Đẩy file lên Storage
    let { error: uploadError } = await supabase.storage 
      .from(bucket)
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // 2. Lấy URL công khai của file vừa upload
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    
    return data.publicUrl; // Trả về cái link ảnh để lưu vào Database
  } catch (error) {
    console.error('Lỗi upload:', error.message);
    return null;
  }
};