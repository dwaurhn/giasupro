import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 1. Import useNavigate
import { signInWithPassword } from '../services/authService';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate(); // 2. Khởi tạo hàm điều hướng

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const { error } = await signInWithPassword(email, password);

    if (error) {
      setErrorMsg('Sai email hoặc mật khẩu. Vui lòng thử lại!');
      setLoading(false);
    } 
    // LƯU Ý: Bạn không cần navigate('/dashboard') ở đây 
    // vì file App.jsx đang lắng nghe onAuthStateChange và sẽ tự chuyển hướng.
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', fontFamily: 'sans-serif' }}>
      <h2 style={{ textAlign: 'center' }}>Đăng Nhập</h2>
      {errorMsg && <p style={{ color: 'red', textAlign: 'center' }}>{errorMsg}</p>}
      
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input 
          type="email" 
          placeholder="Email của bạn" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: '10px', fontSize: '16px' }}
        />
        <input 
          type="password" 
          placeholder="Mật khẩu" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: '10px', fontSize: '16px' }}
        />
        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            padding: '10px', 
            backgroundColor: loading ? '#ccc' : '#007bff', 
            color: 'white', 
            fontSize: '16px', 
            border: 'none', 
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer' 
          }}
        >
          {loading ? 'Đang xử lý...' : 'Đăng Nhập'}
        </button>
      </form>

      {/* 3. Nút chuyển sang trang Đăng ký bằng navigate */}
      <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
        Chưa có tài khoản?{' '}
        <span 
          onClick={() => navigate('/register')} 
          style={{ color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}
        >
          Đăng ký ngay
        </span>
      </p>
    </div>
  );
}