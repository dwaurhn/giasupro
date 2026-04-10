import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 1. Import useNavigate
import { dangKyTaiKhoan } from '../services/authService';

export default function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hoTen, setHoTen] = useState('');
  const [vaiTro, setVaiTro] = useState('hoc_vien');
  const [thongBao, setThongBao] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate(); // 2. Khởi tạo navigate

  const handleRegister = async (e) => {
    e.preventDefault();
    setThongBao('');
    setIsSubmitting(true);

    const result = await dangKyTaiKhoan(email, password, hoTen, vaiTro);
    
    setIsSubmitting(false);

    if (result.success) {
      setThongBao('Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.');
      // Tùy chọn: Tự động chuyển về trang login sau 3 giây để người dùng đăng nhập
      // setTimeout(() => navigate('/login'), 3000);
    } else {
      setThongBao(`Lỗi: ${result.message}`);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '50px auto', border: '1px solid #ccc', borderRadius: '8px', fontFamily: 'sans-serif' }}>
      <h2 style={{ textAlign: 'center' }}>Đăng Ký Tài Khoản</h2>
      
      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input 
          type="text" 
          placeholder="Họ và Tên" 
          required 
          value={hoTen} 
          onChange={(e) => setHoTen(e.target.value)} 
          style={{ padding: '10px', fontSize: '16px' }}
        />
        <input 
          type="email" 
          placeholder="Email" 
          required 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          style={{ padding: '10px', fontSize: '16px' }}
        />
        <input 
          type="password" 
          placeholder="Mật khẩu" 
          required 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          style={{ padding: '10px', fontSize: '16px' }}
        />
        
        <label style={{ fontSize: '14px', marginBottom: '-10px' }}>Bạn là:</label>
        <select 
          value={vaiTro} 
          onChange={(e) => setVaiTro(e.target.value)} 
          style={{ padding: '10px', fontSize: '16px', cursor: 'pointer' }}
        >
          <option value="hoc_vien">Học Viên</option>
          <option value="gia_su">Gia Sư</option>
        </select>

        <button 
          type="submit" 
          disabled={isSubmitting}
          style={{ 
            padding: '10px', 
            backgroundColor: isSubmitting ? '#ccc' : '#28a745', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            fontSize: '16px',
            cursor: isSubmitting ? 'not-allowed' : 'pointer' 
          }}
        >
          {isSubmitting ? 'Đang xử lý...' : 'Đăng Ký'}
        </button>
      </form>

      {thongBao && (
        <p style={{ 
          color: thongBao.includes('Lỗi') ? '#dc3545' : '#28a745', 
          marginTop: '15px', 
          textAlign: 'center',
          fontWeight: 'bold'
        }}>
          {thongBao}
        </p>
      )}

      {/* 3. Nút quay lại trang Đăng nhập */}
      <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
        Đã có tài khoản?{' '}
        <span 
          onClick={() => navigate('/login')} 
          style={{ color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}
        >
          Đăng nhập ngay
        </span>
      </p>
    </div>
  );
}