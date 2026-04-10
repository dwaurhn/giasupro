import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { layThongBao, danhDauThongBaoDaDoc } from '../services/authService';
import {
  GraduationCap, Home, Search, CalendarDays, UserCircle, LogOut,
  LogIn, UserPlus, Menu, X, Bell, Clock, ShieldCheck, Wallet, MessageSquare, Users
} from 'lucide-react';

export default function Navbar({ session, userProfile }) {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNoti, setShowNoti] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;
    const fetchNotis = async () => {
      const { data } = await layThongBao(session.user.id);
      setNotifications(data || []);
    };
    fetchNotis();
    const channel = supabase
      .channel('chuong_thong_bao')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'thong_bao', filter: `id_nguoi_dung=eq.${session.user.id}` },
        (payload) => { setNotifications(prev => [payload.new, ...prev]); })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleReadNotification = async (id) => {
    await danhDauThongBaoDaDoc(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, da_doc: true } : n));
  };

  const getNavLinks = () => {
    // ✅ HIỂN THỊ TRANG CHỦ & CỘNG ĐỒNG CHO TẤT CẢ MỌI NGƯỜI
    let links = [
      { to: '/', label: 'Trang chủ', icon: Home },
      { to: '/community', label: 'Cộng đồng', icon: Users } 
    ];

    if (session) {
      if (userProfile?.vai_tro === 'admin') {
        links.push({ to: '/admin', label: 'Quản Trị Hệ Thống', icon: ShieldCheck });
      } else {
        links.push(
          { to: '/tutors', label: 'Tìm Gia Sư', icon: Search },
          { to: '/dashboard', label: 'Quản lý Lịch', icon: CalendarDays }
        );
        if (userProfile?.vai_tro === 'gia_su') {
          links.push({ to: '/wallet', label: 'Ví của tôi', icon: Wallet });
        }
      }
      links.push({ to: '/profile', label: 'Hồ sơ', icon: UserCircle });
    }
    return links;
  };

  const navLinks = getNavLinks();
  const unreadCount = notifications.filter(n => !n.da_doc).length;

  return (
    <nav className={'sticky top-0 z-50 w-full border-b transition-all duration-300 ' + (scrolled ? 'border-gray-200/60 bg-white/70 shadow-lg shadow-gray-900/5 backdrop-blur-xl' : 'border-transparent bg-white/50 backdrop-blur-md')}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <Link to="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-blue-600 transition-colors hover:text-blue-700">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/30">
            <GraduationCap className="h-5 w-5" />
          </span>
          GiaSuPro
        </Link>

        {/* DESKTOP MENU */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map(link => {
            const Icon = link.icon;
            const isProfile = link.to === '/profile';
            const isAdmin = link.to === '/admin';
            const isWallet = link.to === '/wallet';
            const isCommunity = link.to === '/community'; 
            return (
              <Link key={link.to} to={link.to}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
                  isAdmin ? 'text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200' :
                  isWallet ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200' :
                  isCommunity ? 'text-purple-600 hover:bg-purple-50 hover:text-purple-700' : // ✅ TÔ MÀU NỔI BẬT CHO CỘNG ĐỒNG
                  'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {isProfile && userProfile?.avatar_url
                  ? <img src={userProfile.avatar_url} alt="Avatar" className="h-6 w-6 rounded-full object-cover border border-blue-200" />
                  : <Icon className="h-4 w-4" />}
                {link.label}
              </Link>
            );
          })}

          <div className="mx-2 h-6 w-px bg-gray-200" />

          {session ? (
            <div className="flex items-center gap-3">
              <div className="relative">
                <button onClick={() => setShowNoti(!showNoti)} className="relative flex h-10 w-10 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm animate-pulse">{unreadCount}</span>}
                </button>
                {showNoti && (
                  <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl z-50">
                    <div className="flex items-center justify-between bg-blue-600 px-4 py-3">
                      <span className="text-sm font-bold text-white">Thông báo</span>
                      <span className="rounded-full bg-black/20 px-2 py-0.5 text-xs text-blue-100">{unreadCount} chưa đọc</span>
                    </div>
                    <div className="max-h-80 overflow-y-auto bg-gray-50">
                      {notifications.length > 0 ? notifications.map((n) => (
                        <div key={n.id} onClick={() => handleReadNotification(n.id)} className={`flex cursor-pointer items-start gap-3 border-b border-gray-100 px-4 py-3 text-sm transition-all hover:bg-white ${!n.da_doc ? 'bg-blue-50/50' : ''}`}>
                          <div className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${!n.da_doc ? 'bg-blue-500' : 'bg-transparent'}`} />
                          <div>
                            <p className={!n.da_doc ? 'font-semibold text-gray-800' : 'text-gray-600'}>{n.noi_dung}</p>
                            <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-gray-400"><Clock className="h-3 w-3" />{new Date(n.created_at).toLocaleString('vi-VN')}</p>
                          </div>
                        </div>
                      )) : (
                        <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-gray-400">
                          <Bell className="h-8 w-8 text-gray-200" />Không có thông báo nào
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <span className="text-xs font-bold text-gray-500 hidden lg:inline">
                Chào, {userProfile?.ho_ten?.split(' ').pop() || 'Bạn'}!
                {userProfile?.vai_tro === 'admin' && <ShieldCheck className="inline h-3 w-3 text-amber-500 ml-1" />}
              </span>
              <button onClick={handleLogout} className="flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-600 transition-all hover:border-red-300 hover:bg-red-100 active:scale-95">
                <LogOut className="h-4 w-4" />Đăng xuất
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900">
                <LogIn className="h-4 w-4" />Đăng nhập
              </Link>
              <Link to="/register" className="flex items-center gap-1.5 rounded-full bg-green-500 px-5 py-2 text-sm font-bold text-white shadow-md shadow-green-500/25 transition-all hover:-translate-y-0.5 hover:bg-green-600 active:translate-y-0">
                <UserPlus className="h-4 w-4" />Đăng ký ngay
              </Link>
            </>
          )}
        </div>

        {/* MOBILE TOGGLE */}
        <div className="flex items-center gap-3 md:hidden">
          {session && (
            <div className="relative flex items-center">
              <button onClick={() => setShowNoti(!showNoti)} className="relative flex h-10 w-10 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm">{unreadCount}</span>}
              </button>
              {showNoti && (
                <div className="absolute right-0 top-12 mt-2 w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl z-50">
                  <div className="flex items-center justify-between bg-blue-600 px-4 py-3">
                    <span className="text-sm font-bold text-white">Thông báo</span>
                    <span className="rounded-full bg-black/20 px-2 py-0.5 text-xs text-blue-100">{unreadCount} chưa đọc</span>
                  </div>
                  <div className="max-h-72 overflow-y-auto bg-gray-50">
                    {notifications.length > 0 ? notifications.map((n) => (
                      <div key={n.id} onClick={() => handleReadNotification(n.id)} className={`flex cursor-pointer items-start gap-3 border-b border-gray-100 px-4 py-3 text-sm transition-all hover:bg-white ${!n.da_doc ? 'bg-blue-50/50' : ''}`}>
                        <div className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${!n.da_doc ? 'bg-blue-500' : 'bg-transparent'}`} />
                        <div>
                          <p className={!n.da_doc ? 'font-semibold text-gray-800' : 'text-gray-600'}>{n.noi_dung}</p>
                          <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-gray-400"><Clock className="h-3 w-3" />{new Date(n.created_at).toLocaleString('vi-VN')}</p>
                        </div>
                      </div>
                    )) : (
                      <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-gray-400">
                        <Bell className="h-8 w-8 text-gray-200" />Không có thông báo nào
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          {session && userProfile?.avatar_url && <img src={userProfile.avatar_url} alt="Avatar Mobile" className="h-8 w-8 rounded-full border-2 border-blue-500 object-cover" />}
          <button onClick={() => setMobileOpen(prev => !prev)} className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-600 transition-colors hover:bg-gray-100">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* MOBILE DROPDOWN */}
      <div className={'overflow-hidden transition-all duration-300 md:hidden ' + (mobileOpen ? 'max-h-96 border-t border-gray-100' : 'max-h-0')}>
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-4">
          {navLinks.map(link => {
            const Icon = link.icon;
            const isProfile = link.to === '/profile';
            const isAdmin = link.to === '/admin';
            const isWallet = link.to === '/wallet';
            const isCommunity = link.to === '/community'; 
            return (
              <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                  isAdmin ? 'text-amber-600 bg-amber-50' :
                  isWallet ? 'text-emerald-600 bg-emerald-50' :
                  isCommunity ? 'text-purple-600 bg-purple-50' : // ✅ TÔ MÀU NỔI BẬT CHO CỘNG ĐỒNG
                  'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {isProfile && userProfile?.avatar_url ? <img src={userProfile.avatar_url} className="h-6 w-6 rounded-full object-cover" alt="" /> : <Icon className="h-5 w-5 text-gray-400" />}
                {link.label}
              </Link>
            );
          })}
          {session && (
            <button onClick={handleLogout} className="mt-2 flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100">
              <LogOut className="h-5 w-5" />Đăng xuất
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}