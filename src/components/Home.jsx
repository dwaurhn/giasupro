import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDanhSachGiaSu } from '../services/authService'; 
import {
  Search, GraduationCap, Star, Quote, ChevronRight, BookOpen, Globe, 
  Cpu, BookMarked, Users, Award, Clock, MousePointerClick, CalendarCheck,
  CheckCircle2, TrendingUp
} from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const [realTutors, setRealTutors] = useState([]);
  const [loadingTutors, setLoadingTutors] = useState(true);

  // 1. GỌI DỮ LIỆU GIA SƯ THẬT TỪ SUPABASE
  useEffect(() => {
    const fetchTopTutors = async () => {
      const { data, error } = await getDanhSachGiaSu();
      if (!error && data) {
        setRealTutors(data.slice(0, 4));
      }
      setLoadingTutors(false);
    };
    fetchTopTutors();
  }, []);

  const topCourses = [
    { id: 1, name: 'Toán Học', icon: BookOpen, desc: 'Lấy lại căn bản, bứt phá điểm 9+' },
    { id: 2, name: 'Tiếng Anh', icon: Globe, desc: 'Tự tin giao tiếp, ôn thi IELTS/TOEIC' },
    { id: 3, name: 'Lập Trình', icon: Cpu, desc: 'ReactJS, Node.js, ESP32 & Firebase' },
    { id: 4, name: 'Triết Học', icon: BookMarked, desc: 'Vượt qua ác mộng đại học dễ dàng' },
  ];

  const mockTutors = [
    { id: 'mock1', name: 'Nguyễn Văn A', subject: 'Toán Cao Cấp', rating: 5, exp: '5 năm kinh nghiệm' },
    { id: 'mock2', name: 'Trần Thị B', subject: 'IELTS 8.0', rating: 5, exp: 'Cựu du học sinh Anh' },
    { id: 'mock3', name: 'Dương IT', subject: 'Lập trình Nhúng', rating: 5, exp: 'Chuyên gia IoT & React' },
    { id: 'mock4', name: 'Lê Minh C', subject: 'Vật Lý 12', rating: 4.9, exp: 'Giáo viên trường Chuyên' },
  ];

  const courseColors = [
    { bg: 'bg-blue-50', iconBg: 'bg-blue-600', hoverBorder: 'hover:border-blue-400' },
    { bg: 'bg-emerald-50', iconBg: 'bg-emerald-600', hoverBorder: 'hover:border-emerald-400' },
    { bg: 'bg-violet-50', iconBg: 'bg-violet-600', hoverBorder: 'hover:border-violet-400' },
    { bg: 'bg-amber-50', iconBg: 'bg-amber-600', hoverBorder: 'hover:border-amber-400' },
  ];

  const getAvatarUrl = (tutor) => {
    if (tutor.avatar_url) return tutor.avatar_url;
    const name = encodeURIComponent(tutor.ho_ten || tutor.name || 'User');
    return `https://ui-avatars.com/api/?name=${name}&background=10B981&color=fff&size=128&bold=true`;
  };

  const displayTutors = realTutors.length > 0 ? realTutors : mockTutors;

  const paddedTutors = [...displayTutors];
  while (paddedTutors.length < 4 && paddedTutors.length > 0) {
    paddedTutors.push(mockTutors[paddedTutors.length % mockTutors.length]);
  }

  return (
    <div className="min-h-screen bg-white font-sans overflow-hidden">

      {/* ============================================= */}
      {/* 1. HERO BANNER                                */}
      {/* ============================================= */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-500 text-white w-full">
        <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
        
        <div className="absolute top-1/4 left-[5%] hidden xl:flex animate-[bounce_3s_infinite] items-center gap-3 rounded-2xl bg-white/10 p-3 backdrop-blur-md border border-white/20 shadow-xl">
          <div className="bg-amber-400 p-2.5 rounded-full"><Star className="h-5 w-5 fill-white text-white" /></div>
          <div className="text-left"><p className="text-xs text-blue-100">Đánh giá trung bình</p><p className="font-bold text-white">4.9/5.0</p></div>
        </div>
        <div className="absolute bottom-1/3 right-[5%] hidden xl:flex animate-[bounce_4s_infinite] items-center gap-3 rounded-2xl bg-white/10 p-3 backdrop-blur-md border border-white/20 shadow-xl" style={{ animationDelay: '1s' }}>
          <div className="bg-emerald-400 p-2.5 rounded-full"><CheckCircle2 className="h-5 w-5 text-white" /></div>
          <div className="text-left"><p className="text-xs text-blue-100">100% Gia sư</p><p className="font-bold text-white">Đã xác thực</p></div>
        </div>
        <div className="absolute top-1/3 right-[15%] hidden lg:flex animate-[bounce_5s_infinite] items-center gap-3 rounded-2xl bg-white/10 p-3 backdrop-blur-md border border-white/20 shadow-xl" style={{ animationDelay: '0.5s' }}>
          <div className="bg-purple-400 p-2.5 rounded-full"><TrendingUp className="h-5 w-5 text-white" /></div>
          <div className="text-left"><p className="text-xs text-blue-100">Cải thiện điểm số</p><p className="font-bold text-white">Sau 1 tháng</p></div>
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-5 py-24 text-center md:py-36">
          <span className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-bold backdrop-blur-sm shadow-sm">
            <GraduationCap className="h-4 w-4" />
            Nền tảng Kết nối Gia sư #1 Việt Nam
          </span>

          <h1 className="mb-8 text-5xl font-black leading-tight tracking-tight md:text-6xl lg:text-7xl">
            Tìm Gia Sư Hoàn Hảo{' '}
            <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-cyan-200 to-white bg-clip-text text-transparent">
              Cho Tương Lai Của Bạn
            </span>
          </h1>

          <p className="mx-auto mb-12 max-w-2xl text-lg leading-relaxed text-blue-100 md:text-xl">
            Hàng ngàn gia sư ưu tú đã sẵn sàng đồng hành cùng bạn trên con đường chinh phục tri thức. Trải nghiệm học 1 kèm 1 chất lượng cao ngay hôm nay!
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              onClick={() => navigate('/tutors')}
              className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-bold text-blue-600 shadow-xl shadow-blue-900/20 transition-all hover:-translate-y-1 hover:shadow-2xl hover:bg-gray-50 active:translate-y-0"
            >
              <Search className="h-5 w-5" />
              Tìm Gia Sư Ngay
            </button>
            <button
              onClick={() => navigate('/register')}
              className="inline-flex items-center gap-2 rounded-full border-2 border-white/40 bg-white/10 px-8 py-4 text-base font-bold text-white backdrop-blur-sm transition-all hover:border-white hover:bg-white/20"
            >
              Trở thành Gia Sư
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-20 flex flex-wrap items-center justify-center gap-8 text-sm text-blue-100 md:gap-16 border-t border-white/10 pt-10">
            <div className="flex flex-col items-center gap-2"><Users className="h-8 w-8 text-cyan-300" /><span className="text-xl font-black text-white">2,500+</span><span>Gia sư</span></div>
            <div className="flex flex-col items-center gap-2"><Award className="h-8 w-8 text-cyan-300" /><span className="text-xl font-black text-white">10,000+</span><span>Học viên</span></div>
            <div className="flex flex-col items-center gap-2"><Clock className="h-8 w-8 text-cyan-300" /><span className="text-xl font-black text-white">50,000+</span><span>Buổi học</span></div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full leading-none z-10 pointer-events-none">
          <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-12 md:h-24 lg:h-32">
            <path d="M0 40L60 36.7C120 33 240 27 360 30C480 33 600 47 720 53.3C840 60 960 60 1080 53.3C1200 47 1320 33 1380 26.7L1440 20V100H1380C1320 100 1200 100 1080 100C960 100 840 100 720 100C600 100 480 100 360 100C240 100 120 100 60 100H0V40Z" fill="#ffffff"/>
          </svg>
        </div>
      </section>

      {/* =========================================== */}
      {/* 2. QUY TRÌNH HOẠT ĐỘNG (Nền Trắng)           */}
      {/* =========================================== */}
      <section className="w-full bg-white py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">Cách Thức Hoạt Động</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-500">Chỉ với 3 bước đơn giản để bắt đầu buổi học đầu tiên của bạn</p>
          </div>
          
          <div className="grid grid-cols-1 gap-12 md:grid-cols-3 relative mt-10">
            <div className="hidden md:block absolute top-12 left-[16%] w-[68%] h-1 bg-gradient-to-r from-blue-50 via-blue-200 to-blue-50 z-0 rounded-full"></div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-[2rem] bg-blue-50 text-blue-600 shadow-sm mb-6 border border-blue-100 transition-transform hover:scale-110 duration-300">
                <Search className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-3">1. Tìm kiếm Gia sư</h3>
              <p className="text-gray-500 px-4 leading-relaxed">Lựa chọn gia sư phù hợp với môn học và nhu cầu của bạn từ danh sách hàng ngàn hồ sơ chất lượng.</p>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-[2rem] bg-emerald-50 text-emerald-600 shadow-sm mb-6 border border-emerald-100 transition-transform hover:scale-110 duration-300">
                <CalendarCheck className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-3">2. Chọn Lịch & Đặt chỗ</h3>
              <p className="text-gray-500 px-4 leading-relaxed">Xem lịch rảnh của gia sư và gửi yêu cầu đặt lịch học vào khung giờ thuận tiện nhất cho bạn.</p>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-[2rem] bg-violet-50 text-violet-600 shadow-sm mb-6 border border-violet-100 transition-transform hover:scale-110 duration-300">
                <MousePointerClick className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-3">3. Bắt đầu học tập</h3>
              <p className="text-gray-500 px-4 leading-relaxed">Gia sư xác nhận yêu cầu. Tham gia lớp học trực tuyến và bắt đầu hành trình nâng cao kiến thức.</p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================== */}
      {/* 3. CÁC MÔN HỌC / KHÓA HỌC NỔI BẬT (Nền Xám) */}
      {/* =========================================== */}
      <section className="w-full bg-slate-50 py-20 md:py-28 border-y border-gray-100">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mb-16 text-center">
            <span className="mb-3 inline-block rounded-full bg-blue-100 px-4 py-1.5 text-sm font-bold text-blue-700 uppercase tracking-wider">Khám phá</span>
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">Các Môn Học Phổ Biến</h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {topCourses.map((course, idx) => {
              const color = courseColors[idx % courseColors.length];
              const IconComp = course.icon;
              return (
                <div
                  key={course.id}
                  onClick={() => navigate('/tutors')} 
                  className={`group relative cursor-pointer rounded-3xl border border-white bg-white p-8 text-center shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ${color.hoverBorder}`}
                >
                  <div className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ${color.iconBg} text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                    <IconComp className="h-8 w-8" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-gray-900">{course.name}</h3>
                  <p className="text-sm leading-relaxed text-gray-500">{course.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================== */}
      {/* 4. GIA SƯ TIÊU BIỂU (Nền Trắng)             */}
      {/* =========================================== */}
      <section className="w-full bg-white py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-5">
          <div className="mb-16 text-center">
            <span className="mb-3 inline-block rounded-full bg-green-100 px-4 py-1.5 text-sm font-bold text-green-700 uppercase tracking-wider">Gia sư nổi bật</span>
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">Đội Ngũ Gia Sư Ưu Tú</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-500">Những gia sư đang hoạt động tích cực nhất với đánh giá 5 sao tuyệt đối</p>
          </div>

          {loadingTutors ? (
             <div className="flex justify-center py-10"><div className="h-10 w-10 animate-spin rounded-full border-4 border-green-500 border-t-transparent"></div></div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {paddedTutors.map((tutor, index) => (
                <div key={`${tutor.id}-${index}`} className="group relative overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
                  <div className="h-2 w-full bg-gradient-to-r from-green-400 to-emerald-500" />
                  <div className="p-8 text-center">
                    <div className="mx-auto mb-5 h-28 w-28 overflow-hidden rounded-full shadow-lg ring-4 ring-green-50 transition-transform duration-300 group-hover:scale-110">
                      <img src={getAvatarUrl(tutor)} alt="Avatar" className="h-full w-full object-cover" />
                    </div>
                    <h3 className="mb-1 text-xl font-black text-gray-900">{tutor.ho_ten || tutor.name}</h3>
                    
                    <div className="mb-4 flex items-center justify-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>

                    <span className="mb-6 inline-block rounded-full bg-blue-50 border border-blue-100 px-4 py-1.5 text-sm font-bold text-blue-700">
                      {tutor.chi_tiet_gia_su?.mon_hoc || tutor.subject || 'Đa môn'}
                    </span>

                    <button
                      onClick={() => navigate(tutor.id.startsWith('mock') ? '/tutors' : `/tutor/${tutor.id}`)}
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-blue-600 hover:shadow-lg active:scale-95"
                    >
                      Xem Hồ Sơ <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-14 text-center">
             <button onClick={() => navigate('/tutors')} className="inline-flex items-center gap-2 rounded-full border-2 border-slate-200 px-8 py-3.5 text-base font-bold text-slate-600 transition-all hover:border-blue-600 hover:text-blue-600">Xem tất cả gia sư <ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      </section>

      {/* =========================================== */}
      {/* 5. ĐÁNH GIÁ THẬT TỪ CỘNG ĐỒNG                 */}
      {/* =========================================== */}
      <RealReviewsSection navigate={navigate} />

      {/* =========================================== */}
      {/* 6. CALL TO ACTION BOTTOM (Nền Trắng)        */}
      {/* =========================================== */}
      <section className="w-full bg-white pb-24 pt-10">
        <div className="mx-auto max-w-5xl px-5">
          <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-10 text-center text-white shadow-2xl md:p-20">
            {/* Decors */}
            <div className="absolute -left-20 top-0 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl"></div>
            <div className="absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl"></div>
            
            <div className="relative z-10">
              <h2 className="mb-6 text-4xl font-black md:text-5xl">Sẵn sàng bắt đầu?</h2>
              <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-300 leading-relaxed">Đăng ký ngay hôm nay để tìm kiếm người dẫn đường hoàn hảo, hoặc chia sẻ kiến thức của bạn với hàng ngàn học viên trên toàn quốc.</p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <button onClick={() => navigate('/tutors')} className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-1 hover:bg-blue-500 hover:shadow-xl">
                  <Search className="h-5 w-5" /> Tìm Gia Sư Ngay
                </button>
                <button onClick={() => navigate('/register')} className="inline-flex items-center gap-2 rounded-full border-2 border-slate-600 bg-transparent px-8 py-4 text-base font-bold text-white transition-all hover:border-white hover:bg-white/10 hover:-translate-y-1">
                  Đăng ký giảng dạy <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

// ===========================================
// COMPONENT CON: ĐÁNH GIÁ THẬT
// ===========================================
function RealReviewsSection({ navigate }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    import('../services/authService').then(({ layTatCaDanhGia }) => {
      layTatCaDanhGia().then(({ data }) => {
        if (data) setReviews(data.slice(0, 3));
        setLoading(false);
      });
    });
  }, []);

  const mockReviews = [
    { id: 1, hoc_vien: { ho_ten: 'Lê Hoàng C.' }, gia_su: { ho_ten: 'Nguyễn Văn A', chi_tiet_gia_su: { mon_hoc: 'Toán Cao Cấp' } }, so_sao: 5, nhan_xet: 'Gia sư dạy rất dễ hiểu, nhiệt tình. Mình đã pass môn Toán dễ dàng!' },
    { id: 2, hoc_vien: { ho_ten: 'Phạm Thị D.' }, gia_su: { ho_ten: 'Trần Thị B', chi_tiet_gia_su: { mon_hoc: 'IELTS' } }, so_sao: 5, nhan_xet: 'Đạt aim IELTS 7.5 chỉ sau 3 tháng ôn luyện. Cảm ơn gia sư rất nhiều!' },
    { id: 3, hoc_vien: { ho_ten: 'Trần Văn E.' }, gia_su: { ho_ten: 'Dương IT', chi_tiet_gia_su: { mon_hoc: 'Lập Trình' } }, so_sao: 5, nhan_xet: 'Đồ án ESP32 đạt điểm A+ nhờ các buổi học thực tế và tận tâm của gia sư.' },
  ];

  const displayReviews = reviews.length > 0 ? reviews : mockReviews;

  const getAvatarUrl = (obj) => {
    if (obj?.avatar_url) return obj.avatar_url;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(obj?.ho_ten || 'User')}&background=3B82F6&color=fff&size=128&bold=true`;
  };

  return (
    <section className="w-full bg-blue-50/50 py-20 md:py-28 border-t border-blue-100">
      <div className="mx-auto max-w-7xl px-5">
        <div className="mb-16 text-center">
          <span className="mb-3 inline-block rounded-full bg-amber-100 px-4 py-1.5 text-sm font-bold text-amber-700 uppercase tracking-wider">Cảm nhận thực tế</span>
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">Học Viên Nói Gì Về Chúng Tôi?</h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-500">Đánh giá thật từ những học viên đã trải nghiệm</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-400 border-t-transparent"></div></div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {displayReviews.map((rv, idx) => (
              <div key={rv.id || idx} className="relative overflow-hidden rounded-[2rem] border border-white bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
                <Quote className="absolute -top-4 right-4 h-32 w-32 text-blue-50/80 rotate-12" />
                <div className="relative z-10 flex flex-col h-full">
                  <div className="mb-4 flex items-center gap-1">
                    {[1,2,3,4,5].map(s => <Star key={s} className={`h-4 w-4 ${s <= (rv.so_sao || 5) ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-200'}`} />)}
                    <span className="ml-1 text-xs font-black text-amber-500">{rv.so_sao || 5}/5</span>
                  </div>
                  <p className="mb-6 text-base font-medium italic leading-relaxed text-gray-600 flex-1">"{rv.nhan_xet || 'Buổi học rất tuyệt vời!'}"</p>
                  
                  {/* Thông tin học viên */}
                  <div className="flex items-center gap-3 border-t border-slate-100 pt-5">
                    <img src={getAvatarUrl(rv.hoc_vien)} className="h-12 w-12 rounded-full border border-slate-200 object-cover" alt="" />
                    <div>
                      <span className="block font-black text-gray-900">{rv.hoc_vien?.ho_ten || 'Học viên'}</span>
                      <span className="text-xs text-slate-400">Đánh giá gia sư <b className="text-blue-600">{rv.gia_su?.ho_ten}</b></span>
                    </div>
                  </div>
                  
                  {/* Tag môn học */}
                  <div className="mt-3">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
                      {rv.gia_su?.chi_tiet_gia_su?.[0]?.mon_hoc || rv.gia_su?.chi_tiet_gia_su?.mon_hoc || 'Môn học'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-10 text-center">
          <button onClick={() => navigate('/community')} className="inline-flex items-center gap-2 rounded-full border-2 border-slate-200 px-8 py-3.5 text-base font-bold text-slate-600 transition-all hover:border-blue-600 hover:text-blue-600">
            Xem thêm đánh giá từ cộng đồng <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}