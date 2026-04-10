import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md text-center">
        <div className="mb-6 text-[120px] font-black leading-none text-slate-200">404</div>
        <h1 className="mb-3 text-2xl font-black text-slate-900">Trang không tồn tại</h1>
        <p className="mb-8 text-slate-500">Trang bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-5 py-3 font-bold text-slate-600 hover:bg-slate-50 transition-all">
            <ArrowLeft className="h-4 w-4" /> Quay lại
          </button>
          <button onClick={() => navigate('/')} className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all">
            <Home className="h-4 w-4" /> Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
}