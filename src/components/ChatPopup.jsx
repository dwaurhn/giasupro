import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { layLichSuTinNhan, guiTinNhan, danhDauDaDoc } from '../services/authService'; // Gộp chung vào 1 dòng import
import { X, Send, Loader2 } from 'lucide-react';

export default function ChatPopup({ session, partner, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // Tải lịch sử và thiết lập Real-time khi mở Chat
  useEffect(() => {
    if (!partner || !session) return;

    const fetchHistory = async () => {
      setLoading(true);
      const { data } = await layLichSuTinNhan(session.user.id, partner.id);
      if (data) setMessages(data);
      setLoading(false);
      scrollToBottom();
      
      // FIX: Đánh dấu đã đọc ngay khi vừa mở khung chat lên
      await danhDauDaDoc(session.user.id, partner.id);
    };

    fetchHistory();

    // Lắng nghe tin nhắn mới bằng Supabase Realtime
    const channel = supabase
      .channel('realtime_chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tin_nhan' }, (payload) => {
        const msg = payload.new;
        // Chỉ nhận tin nhắn thuộc về cuộc trò chuyện này
        const thuocVeCuocTroChuyen = 
          (msg.id_nguoi_gui === session.user.id && msg.id_nguoi_nhan === partner.id) ||
          (msg.id_nguoi_gui === partner.id && msg.id_nguoi_nhan === session.user.id);

        if (thuocVeCuocTroChuyen) {
          setMessages((prev) => {
            // Tránh trùng lặp nếu mình vừa gửi và đã tự add vào mảng
            if (prev.find((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          scrollToBottom();
          
          // FIX: Nếu mình đang mở khung chat mà có người nhắn tới -> Đánh dấu đã đọc luôn
          if (msg.id_nguoi_nhan === session.user.id) {
             danhDauDaDoc(session.user.id, partner.id);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [partner, session]);

  // Cuộn xuống tin nhắn mới nhất
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const tinNhanAo = {
      id: 'temp-' + Date.now(),
      id_nguoi_gui: session.user.id,
      id_nguoi_nhan: partner.id,
      noi_dung: newMessage,
      created_at: new Date().toISOString()
    };

    // Hiển thị ngay lập tức lên màn hình cho mượt
    setMessages((prev) => [...prev, tinNhanAo]);
    setNewMessage('');
    scrollToBottom();

    // Gửi lên server
    const { data } = await guiTinNhan(session.user.id, partner.id, tinNhanAo.noi_dung);
    
    // Thay thế tin nhắn ảo bằng tin nhắn thật có ID từ database
    if (data) {
      setMessages((prev) => prev.map(msg => msg.id === tinNhanAo.id ? data[0] : msg));
    }
  };

  const getAvatarUrl = (url, name) => {
    if (url) return url;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=3B82F6&color=fff`;
  };

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex h-[500px] w-[350px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 transition-all">
      
      {/* Header Chat */}
      <div className="flex items-center justify-between bg-blue-600 px-4 py-3 text-white">
        <div className="flex items-center gap-3">
          <img 
            src={getAvatarUrl(partner.avatar_url, partner.ho_ten)} 
            alt={partner.ho_ten} 
            className="h-10 w-10 rounded-full border-2 border-white/50 object-cover"
          />
          <div>
            <h3 className="text-sm font-bold">{partner.ho_ten}</h3>
            <span className="text-[10px] text-blue-100 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-400"></span> Đang hoạt động
            </span>
          </div>
        </div>
        <button onClick={onClose} className="rounded-full p-1.5 hover:bg-white/20 transition-all">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Body Chat (Lịch sử trò chuyện) */}
      <div className="flex-1 overflow-y-auto bg-slate-50 p-4 space-y-4">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
            <p className="text-sm">Chưa có tin nhắn nào.</p>
            <p className="text-xs">Hãy gửi lời chào đến {partner.ho_ten}!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.id_nguoi_gui === session.user.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'}`}>
                  {msg.noi_dung}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Footer Chat (Khung nhập) */}
      <form onSubmit={handleSend} className="border-t border-slate-100 bg-white p-3">
        <div className="flex items-center gap-2 rounded-full bg-slate-100 pr-2 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
          <input
            type="text"
            placeholder="Nhập tin nhắn..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 bg-transparent px-4 py-2.5 text-sm outline-none"
          />
          <button 
            type="submit" 
            disabled={!newMessage.trim()}
            className={`rounded-full p-2 text-white transition-all ${newMessage.trim() ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-300'}`}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}