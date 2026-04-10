import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { Toaster } from 'react-hot-toast';

// Import các Components
import AdminDashboard from './components/AdminDashboard';
import Home from './components/Home';
import Navbar from './components/Navbar';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import TutorList from './components/TutorList';
// Đã xóa dòng import TutorList bị trùng lặp
import TutorDetail from './components/TutorDetail'; // Đã thêm import TutorDetail
import WalletPage from './components/Wallet';
import Community from './components/Community';
import NotFound from './components/NotFound'; // ✅ Đã thêm import NotFound

export default function App() {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null); // Quản lý ảnh & tên toàn cục
  const [loading, setLoading] = useState(true);

  // Hàm lấy thông tin chi tiết từ bảng nguoi_dung
  const fetchFullProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('nguoi_dung')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setUserProfile(data);
      }
    } catch (err) {
      console.error("Lỗi lấy profile toàn cục:", err);
    }
  };

  useEffect(() => {
    // 1. Kiểm tra session ban đầu
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchFullProfile(session.user.id);
      setLoading(false);
    });

    // 2. Lắng nghe thay đổi trạng thái đăng nhập
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchFullProfile(session.user.id);
      } else {
        setUserProfile(null); // Xóa profile khi đăng xuất
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
        <h3>Đang khởi động hệ thống Gia Sư...</h3>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster position="top-right" /> {/* thêm dòng này */}
      <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', backgroundColor: '#f9f9f9' }}>
        
        {/* NAVBAR: Nhận userProfile để hiển thị ảnh ở mọi trang */}
        <Navbar session={session} userProfile={userProfile} />

        <div style={{ padding: session ? '20px' : '0' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />

            <Route 
              path="/login" 
              element={session ? <Navigate to="/dashboard" replace /> : <LoginForm />} 
            />
            
            <Route 
              path="/register" 
              element={session ? <Navigate to="/dashboard" replace /> : <RegisterForm />} 
            />

            <Route 
              path="/dashboard" 
              element={session ? <Dashboard session={session} userProfile={userProfile} /> : <Navigate to="/login" replace />} 
            />

            <Route 
              path="/profile" 
              element={
                session 
                ? <Profile session={session} userProfile={userProfile} setUserProfile={setUserProfile} /> 
                : <Navigate to="/login" replace />
              } 
            />

            <Route 
              path="/tutors" 
              element={session ? <TutorList session={session} userProfile={userProfile} /> : <Navigate to="/login" replace />} 
            />

            <Route 
              path="/tutor/:id" 
              element={session ? <TutorDetail session={session} userProfile={userProfile} /> : <Navigate to="/login" replace />} 
            />

            {/* ✅ ADMIN ROUTE - phải nằm TRƯỚC route * */}
            <Route
              path="/admin"
              element={
                session && userProfile?.vai_tro === 'admin'
                ? <AdminDashboard userProfile={userProfile} />
                : <Navigate to="/login" replace />
              }
            />

            {/* ✅ WALLET ROUTE - Dành cho Gia sư */}
            <Route
              path="/wallet"
              element={
                session && userProfile?.vai_tro === 'gia_su'
                ? <WalletPage session={session} userProfile={userProfile} />
                : <Navigate to="/login" replace />
              }
            />

            {/* ✅ ĐÃ SỬA: COMMUNITY ROUTE CHO MỌI NGƯỜI */}
            <Route 
              path="/community" 
              element={<Community session={session} userProfile={userProfile} />} 
            />

            {/* ✅ ĐÃ SỬA ROUTE * */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}