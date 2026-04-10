import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { 
  layTatCaDanhGia, getDanhSachGiaSu, uploadAnhLenSupabase,
} from '../services/authService';
import { 
  layDanhSachBaiViet, taoBaiViet, toggleLikeBaiViet, 
  layBinhLuanCuaBaiViet, taoBinhLuan 
} from '../services/communityService';
import toast from 'react-hot-toast';
import {
  MessageSquare, Star, Search, Users, BookOpen, GraduationCap, 
  Lightbulb, HelpCircle, CheckCircle2, X, Send, Loader2, 
  ImageIcon, ShieldAlert, ThumbsUp, Clock, ChevronRight, MessageCircle
} from 'lucide-react';

// --- DỮ LIỆU CỐ ĐỊNH ---
const FAQ_DATA = [
  { q: 'Làm thế nào để chọn gia sư phù hợp?', a: 'Hãy xem xét môn học, học phí, đánh giá sao và đọc kỹ phần giới thiệu của gia sư.' },
  { q: 'Tiền của tôi có an toàn không?', a: 'Có! Chúng tôi giữ tiền an toàn và chỉ chuyển cho gia sư khi bạn xác nhận hoàn thành.' },
  { q: 'Nếu gia sư không dạy đúng giờ thì sao?', a: 'Bạn có thể bấm "Báo cáo" ngay trong Dashboard để Admin giải quyết.' },
];

const TIPS_DATA = [
  { icon: '📚', title: 'Chuẩn bị bài trước', content: 'Xem trước nội dung buổi học để tận dụng tối đa thời gian.' },
  { icon: '📝', title: 'Ghi chép đầy đủ', content: 'Ghi lại những điểm quan trọng giúp kiến thức được củng cố vững chắc.' },
];

export default function Community({ session, userProfile }) {
  const navigate = useNavigate();
  
  // States chung
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('thao_luan'); 
  
  // States cho Diễn đàn
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [isNotice, setIsNotice] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [expandedComments, setExpandedComments] = useState({});
  const [commentsData, setCommentsData] = useState({});
  const [newCommentText, setNewCommentText] = useState({});

  // States cho Thông tin
  const [reviews, setReviews] = useState([]);
  const [tutors, setTutors] = useState([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [reviewsRes, tutorsRes, postsRes] = await Promise.all([
      layTatCaDanhGia(),
      getDanhSachGiaSu(),
      layDanhSachBaiViet()
    ]);
    
    if (reviewsRes.data) setReviews(reviewsRes.data);
    if (tutorsRes.data) setTutors(tutorsRes.data.slice(0, 8));
    
    // KHÔI PHỤC: Logic đếm Like và Comment
    if (postsRes.data) {
      const { data: danhSachLike } = await supabase.from('thich_bai_viet').select('id_bai_viet, id_nguoi_dung');
      const { data: danhSachBinhLuan } = await supabase.from('binh_luan').select('id_bai_viet');
      
      const postsWithExtraInfo = postsRes.data.map(post => {
        const likesOfThisPost = danhSachLike?.filter(like => like.id_bai_viet === post.id) || [];
        const commentsOfThisPost = danhSachBinhLuan?.filter(cmt => cmt.id_bai_viet === post.id) || [];
        const isLikedByMe = likesOfThisPost.some(like => like.id_nguoi_dung === session?.user?.id);
        
        return {
          ...post,
          likeCount: likesOfThisPost.length,
          commentCount: commentsOfThisPost.length,
          isLikedByMe: isLikedByMe
        };
      });
      setPosts(postsWithExtraInfo);
    }
    setLoading(false);
  };

  // --- LOGIC XỬ LÝ DIỄN ĐÀN ---
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim() && !imageFile) return;
    setIsUploading(true);
    let hinhAnhUrl = null;

    if (imageFile) {
      toast.loading("Đang tải ảnh lên...", { id: "uploading" });
      const { url, error: uploadErr } = await uploadAnhLenSupabase(imageFile);
      if (uploadErr) {
        toast.error("Lỗi tải ảnh lên!", { id: "uploading" });
        setIsUploading(false);
        return;
      }
      hinhAnhUrl = url;
      toast.dismiss("uploading");
    }

    const loai = (isNotice && userProfile?.vai_tro === 'admin') ? 'thong_bao' : 'thao_luan';
    const { data, error } = await taoBaiViet(session.user.id, newPostContent.trim(), loai, hinhAnhUrl);
    
    if (!error && data) {
      toast.success("Đăng bài thành công!");
      setPosts([{ ...data[0], likeCount: 0, commentCount: 0, isLikedByMe: false }, ...posts]);
      setNewPostContent(''); 
      setImageFile(null);
      setIsNotice(false);
    } else {
      toast.error("Lỗi đăng bài: " + error.message);
    }
    setIsUploading(false);
  };

  const handleToggleLike = async (postId) => {
    // Đổi UI ngay lập tức
    setPosts(prev => prev.map(p => p.id === postId ? { 
      ...p, 
      isLikedByMe: !p.isLikedByMe, 
      likeCount: p.isLikedByMe ? p.likeCount - 1 : p.likeCount + 1 
    } : p));
    
    // Gọi API ngầm
    const { error } = await toggleLikeBaiViet(postId, session.user.id);
    if (error) {
      toast.error("Không thể thả tim!");
      loadData(); // Rollback nếu lỗi
    }
  };

  // KHÔI PHỤC: Xử lý mở/đóng bình luận
  const handleToggleComments = async (postId) => {
    if (expandedComments[postId]) {
      setExpandedComments({ ...expandedComments, [postId]: false });
      return;
    }
    setExpandedComments({ ...expandedComments, [postId]: true });
    if (!commentsData[postId]) {
      const { data, error } = await layBinhLuanCuaBaiViet(postId);
      if (!error && data) setCommentsData({ ...commentsData, [postId]: data });
    }
  };

  // KHÔI PHỤC: Xử lý gửi bình luận
  const handleSubmitComment = async (postId) => {
    const content = newCommentText[postId];
    if (!content || !content.trim()) return;

    const { data, error } = await taoBinhLuan(postId, session.user.id, content.trim());
    if (error) {
      toast.error("Lỗi gửi bình luận: " + error.message);
    } else if (data && data.length > 0) {
      const currentComments = commentsData[postId] || [];
      setCommentsData({ ...commentsData, [postId]: [...currentComments, data[0]] });
      setNewCommentText({ ...newCommentText, [postId]: '' });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, commentCount: (p.commentCount || 0) + 1 } : p));
    }
  };

  // --- UI HELPERS ---
  const getAvatarUrl = (obj) => obj?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(obj?.ho_ten || 'U')}&background=3B82F6&color=fff`;
  const timeAgo = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const tabs = [
    { id: 'thao_luan', label: 'Diễn đàn thảo luận', icon: MessageSquare },
    { id: 'danh_gia', label: 'Đánh giá học viên', icon: Star },
    { id: 'gia_su', label: 'Gia sư nổi bật', icon: GraduationCap },
    { id: 'faq_tips', label: 'Hỗ trợ & Mẹo', icon: Lightbulb },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HEADER */}
      <section className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-700 to-blue-600 pb-32 pt-16 text-white">
        <div className="relative z-10 mx-auto max-w-4xl px-5 text-center">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2 text-sm font-bold backdrop-blur-sm border border-white/20">
            <Users className="h-4 w-4" /> Cộng đồng GiaSuPro
          </span>
          <h1 className="mb-6 text-4xl font-black md:text-5xl">Kết Nối & Chia Sẻ Tri Thức</h1>
          <div className="flex justify-center gap-8 mt-8">
            <div className="text-center"><p className="text-2xl font-black">{posts.length}</p><p className="text-xs text-purple-200">Bài viết</p></div>
            <div className="text-center"><p className="text-2xl font-black">{reviews.length}</p><p className="text-xs text-purple-200">Review</p></div>
            <div className="text-center"><p className="text-2xl font-black">4.9/5</p><p className="text-xs text-purple-200">Uy tín</p></div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-12 bg-slate-50" style={{ clipPath: 'polygon(0 100%, 100% 100%, 100% 0)' }}></div>
      </section>

      <div className="mx-auto max-w-6xl px-5 pb-20 -mt-12 relative z-20">
        {/* TABS MENU */}
        <div className="mb-8 flex overflow-x-auto gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
              <tab.icon className="h-4 w-4" />{tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-violet-600" /></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* CỘT TRÁI */}
            <div className="lg:col-span-1 space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <img src={getAvatarUrl(userProfile)} className="h-12 w-12 rounded-full object-cover" />
                  <div>
                    <p className="font-bold text-slate-900 leading-none">{userProfile?.ho_ten || 'Khách'}</p>
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{userProfile?.vai_tro || 'Member'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CỘT PHẢI */}
            <div className="lg:col-span-3">
              
              {/* TAB 1: DIỄN ĐÀN */}
              {activeTab === 'thao_luan' && (
                <div className="space-y-6">
                  {/* FORM ĐĂNG BÀI */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <form onSubmit={handleCreatePost}>
                      <textarea value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} placeholder="Bạn muốn chia sẻ điều gì với cộng đồng?" 
                        className="w-full min-h-[100px] rounded-xl bg-slate-50 p-4 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-violet-100 transition-all border-none resize-none" />
                      
                      {/* KHÔI PHỤC: Xem trước ảnh tải lên */}
                      {imageFile && (
                        <div className="mt-3 relative inline-block">
                          <img src={URL.createObjectURL(imageFile)} alt="Preview" className="h-32 rounded-xl object-cover border border-slate-200 shadow-sm" />
                          <button type="button" onClick={() => setImageFile(null)} className="absolute -right-2 -top-2 rounded-full bg-rose-500 p-1 text-white hover:bg-rose-600 shadow-md">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}

                      <div className="mt-4 flex items-center justify-between border-t pt-4">
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 cursor-pointer text-slate-500 hover:text-violet-600 font-bold text-sm">
                            <input type="file" hidden accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} />
                            <ImageIcon className="h-5 w-5" /> Ảnh
                          </label>
                          {userProfile?.vai_tro === 'admin' && (
                            <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg">
                              <input type="checkbox" checked={isNotice} onChange={e => setIsNotice(e.target.checked)} className="rounded border-rose-300 text-rose-600 focus:ring-rose-500" />
                              Ghim làm Thông báo
                            </label>
                          )}
                        </div>
                        <button type="submit" disabled={(!newPostContent.trim() && !imageFile) || isUploading} className={`px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all ${(!newPostContent.trim() && !imageFile) || isUploading ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-violet-600 text-white hover:bg-violet-700 shadow-md'}`}>
                          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Đăng bài
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* DANH SÁCH BÀI VIẾT */}
                  {posts.map(post => (
                    <div key={post.id} className={`rounded-2xl border bg-white p-6 shadow-sm ${post.loai_bai_viet === 'thong_bao' ? 'border-rose-200 ring-1 ring-rose-50' : 'border-slate-200'}`}>
                      <div className="flex items-center gap-3 mb-4">
                        <img src={getAvatarUrl(post.nguoi_dang)} className="h-10 w-10 rounded-full border border-slate-100 object-cover" />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-900">{post.nguoi_dang?.ho_ten || 'Khách'}</p>
                            {post.nguoi_dang?.vai_tro === 'admin' && <span className="bg-rose-100 text-rose-700 p-0.5 rounded-full"><CheckCircle2 className="h-3 w-3" /></span>}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {timeAgo(post.created_at)}</span>
                            {post.loai_bai_viet === 'thong_bao' && <><span className="text-slate-300">•</span><span className="font-bold text-rose-600 uppercase">Thông báo</span></>}
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-slate-800 mb-4 whitespace-pre-wrap leading-relaxed">{post.noi_dung}</p>
                      
                      {/* KHÔI PHỤC: Hiển thị ảnh của bài viết */}
                      {post.hinh_anh_url && (
                        <div className="mb-4 rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                          <img src={post.hinh_anh_url} className="w-full max-h-[500px] object-contain" alt="Post content" />
                        </div>
                      )}

                      <div className="flex items-center gap-6 border-t pt-4">
                        <button onClick={() => handleToggleLike(post.id)} className={`flex items-center gap-2 text-sm font-bold transition-colors ${post.isLikedByMe ? 'text-rose-500' : 'text-slate-500 hover:text-rose-500'}`}>
                          <ThumbsUp className={`h-5 w-5 ${post.isLikedByMe ? 'fill-current' : ''}`} /> {post.likeCount > 0 ? post.likeCount : 'Thích'}
                        </button>
                        <button onClick={() => handleToggleComments(post.id)} className={`flex items-center gap-2 text-sm font-bold transition-colors ${expandedComments[post.id] ? 'text-violet-600' : 'text-slate-500 hover:text-violet-600'}`}>
                          <MessageCircle className={`h-5 w-5 ${expandedComments[post.id] ? 'fill-current opacity-20' : ''}`} /> {post.commentCount > 0 ? post.commentCount : 'Bình luận'}
                        </button>
                      </div>

                      {/* KHÔI PHỤC: Giao diện Bình luận */}
                      {expandedComments[post.id] && (
                        <div className="mt-4 pt-4 border-t border-slate-50">
                          {/* Ô nhập bình luận */}
                          <div className="flex items-center gap-3 mb-5">
                            <img src={getAvatarUrl(userProfile)} alt="" className="h-8 w-8 rounded-full border border-slate-200" />
                            <div className="flex flex-1 items-center bg-slate-100 rounded-full pr-1 overflow-hidden focus-within:ring-2 focus-within:ring-violet-100 focus-within:bg-white transition-all">
                              <input 
                                type="text" placeholder="Viết bình luận..." value={newCommentText[post.id] || ''}
                                onChange={(e) => setNewCommentText({ ...newCommentText, [post.id]: e.target.value })}
                                onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment(post.id)}
                                className="flex-1 bg-transparent px-4 py-2 text-sm outline-none"
                              />
                              <button onClick={() => handleSubmitComment(post.id)} disabled={!newCommentText[post.id]?.trim()} className={`h-7 w-7 rounded-full flex items-center justify-center transition-colors ${newCommentText[post.id]?.trim() ? 'bg-violet-500 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                                <Send className="h-3.5 w-3.5 ml-0.5" />
                              </button>
                            </div>
                          </div>

                          {/* Danh sách bình luận */}
                          <div className="space-y-4 pl-4 border-l-2 border-slate-100">
                            {!commentsData[post.id] ? (
                              <div className="flex justify-center py-2"><Loader2 className="h-5 w-5 animate-spin text-slate-300" /></div>
                            ) : commentsData[post.id].length === 0 ? (
                              <p className="text-xs text-slate-400 text-center italic">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                            ) : (
                              commentsData[post.id].map(comment => (
                                <div key={comment.id} className="flex items-start gap-3">
                                  <img src={getAvatarUrl(comment.nguoi_binh_luan)} alt="" className="h-8 w-8 rounded-full border border-slate-200 mt-0.5" />
                                  <div>
                                    <div className="bg-slate-100 px-3.5 py-2 rounded-2xl rounded-tl-none inline-block">
                                      <p className="text-xs font-bold text-slate-900">{comment.nguoi_binh_luan?.ho_ten}</p>
                                      <p className="text-sm text-slate-700 mt-0.5">{comment.noi_dung}</p>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1 ml-1">{timeAgo(comment.created_at)}</p>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 2: ĐÁNH GIÁ */}
              {activeTab === 'danh_gia' && (
                <div className="grid gap-6 sm:grid-cols-2">
                  {reviews.map(rv => (
                    <div key={rv.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex gap-1">
                          {[1,2,3,4,5].map(s => <Star key={s} className={`h-4 w-4 ${s <= rv.so_sao ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />)}
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">{timeAgo(rv.created_at).split(' ')[1]}</span>
                      </div>
                      <p className="text-sm italic text-slate-700 mb-5 leading-relaxed">"{rv.nhan_xet}"</p>
                      
                      <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                        <div className="flex items-center gap-2">
                          <img src={getAvatarUrl(rv.hoc_vien)} className="h-8 w-8 rounded-full object-cover border border-slate-100" />
                          <div>
                            <p className="text-xs font-bold text-slate-800">{rv.hoc_vien?.ho_ten}</p>
                            <p className="text-[10px] text-slate-400">Học viên</p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-300" />
                        <div className="flex items-center gap-2 text-right">
                          <div>
                            <p className="text-xs font-bold text-violet-700">{rv.gia_su?.ho_ten}</p>
                            <p className="text-[10px] text-violet-400">Gia sư {rv.gia_su?.chi_tiet_gia_su?.[0]?.mon_hoc || ''}</p>
                          </div>
                          <img src={getAvatarUrl(rv.gia_su)} className="h-8 w-8 rounded-full object-cover border border-violet-100" />
                        </div>
                      </div>
                    </div>
                  ))}
                  {reviews.length === 0 && <div className="col-span-full py-10 text-center text-slate-400">Chưa có đánh giá nào.</div>}
                </div>
              )}

              {/* TAB 4: FAQ & TIPS */}
              {activeTab === 'faq_tips' && (
                <div className="space-y-8">
                  <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                    <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2"><HelpCircle className="text-violet-600" /> Câu hỏi thường gặp</h3>
                    <div className="space-y-4">
                      {FAQ_DATA.map((f, i) => (
                        <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 p-4 hover:border-violet-200 transition-colors">
                          <p className="font-bold text-sm text-slate-800 flex gap-2"><span className="text-violet-600">Q:</span> {f.q}</p>
                          <p className="text-sm text-slate-600 mt-2 pl-6 border-l-2 border-violet-200 ml-1.5">{f.a}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                    <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2"><Lightbulb className="text-amber-500" /> Mẹo học tập</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {TIPS_DATA.map((t, i) => (
                        <div key={i} className="rounded-xl bg-amber-50 border border-amber-100 p-5 hover:-translate-y-1 transition-transform">
                          <span className="text-3xl mb-2 block">{t.icon}</span>
                          <h4 className="font-bold text-amber-900">{t.title}</h4>
                          <p className="text-xs text-amber-700 mt-2 leading-relaxed">{t.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  );
}