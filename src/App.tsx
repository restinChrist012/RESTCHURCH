/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { 
  Home, 
  Info, 
  Video, 
  BookOpen, 
  Book, 
  UserCheck, 
  Users, 
  MessageSquare, 
  Heart, 
  Menu, 
  X, 
  ChevronRight,
  Send,
  Plus,
  LogOut,
  LogIn
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { auth, db } from './firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';

// --- Types ---
interface Post {
  id: string;
  title: string;
  content: string;
  category?: string;
  authorId: string;
  authorName: string;
  createdAt: any;
  imageUrl?: string;
  videoUrl?: string;
  boardType: string;
}

// --- Constants ---
const THEME = {
  green: '#1A362B',
  purple: '#5E2A84',
  accent: '#D4AF37', // Gold for a touch of luxury
};

const BOARDS = [
  { id: 'sermons', name: '말씀과 찬양', icon: Video, description: '주일 설교와 찬양 영상' },
  { id: 'commentary', name: '성경주석', icon: BookOpen, description: '깊이 있는 말씀 공부' },
  { id: 'thematic', name: '주제별성경통독', icon: Book, description: '주제별 성경 읽기' },
  { 
    id: 'growth', 
    name: '예수님 안에', 
    icon: UserCheck, 
    description: '단계별 신앙 성장 프로그램',
    subBoards: [
      { id: 'christianity', name: '그리스도인되기', description: '기초 신앙 훈련' },
      { id: 'growth-1', name: '예수님 안에 1', description: '1단계 훈련 강의안' },
      { id: 'growth-2', name: '예수님 안에 2', description: '2단계 훈련 강의안' },
      { id: 'growth-3', name: '예수님 안에 3', description: '3단계 훈련 강의안' },
    ]
  },
  { id: 'life', name: '삶나누기', icon: Users, description: '성도 간의 따뜻한 교제' },
  { id: 'rest', name: '예안숨터', icon: MessageSquare, description: '자유 소통 공간' },
];

const findBoard = (id: string | undefined) => {
  if (!id) return null;
  for (const board of BOARDS) {
    if (board.id === id) return board;
    if (board.subBoards) {
      const sub = board.subBoards.find(sb => sb.id === id);
      if (sub) return { ...sub, icon: board.icon };
    }
  }
  return null;
};

// --- Components ---

const Navbar = ({ user }: { user: User | null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);
  const location = useLocation();

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = () => signOut(auth);

  return (
    <nav className="bg-[#1A362B] text-white sticky top-0 z-50 shadow-lg border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#5E2A84] rounded-full flex items-center justify-center shadow-inner">
              <Home className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-sans font-bold tracking-tight text-white">주님의 쉼터 교회</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/about" className={`text-sm font-medium transition-colors hover:text-[#D4AF37] ${location.pathname === '/about' ? 'text-[#D4AF37]' : 'text-white/80'}`}>교회소개</Link>
            
            {BOARDS.map((board) => (
              <div 
                key={board.id} 
                className="relative group"
                onMouseEnter={() => board.subBoards && setActiveSubMenu(board.id)}
                onMouseLeave={() => setActiveSubMenu(null)}
              >
                <Link
                  to={board.subBoards ? '#' : `/board/${board.id}`}
                  className={`text-sm font-medium transition-colors hover:text-[#D4AF37] flex items-center space-x-1 ${
                    location.pathname.includes(board.id) ? 'text-[#D4AF37]' : 'text-white/80'
                  }`}
                >
                  <span>{board.name}</span>
                  {board.subBoards && <ChevronRight size={14} className="rotate-90" />}
                </Link>

                {board.subBoards && activeSubMenu === board.id && (
                  <div className="absolute top-full left-0 pt-2 w-48 z-50">
                    <div className="bg-[#1A362B] border border-white/10 rounded-xl shadow-2xl py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      {board.subBoards.map(sub => (
                        <Link
                          key={sub.id}
                          to={`/board/${sub.id}`}
                          className="block px-4 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-[#D4AF37] transition-colors"
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            <Link to="/prayer" className={`text-sm font-medium transition-colors hover:text-[#D4AF37] ${location.pathname === '/prayer' ? 'text-[#D4AF37]' : 'text-white/80'}`}>기도요청</Link>
            
            <div className="ml-4 pl-4 border-l border-white/10">
              {user ? (
                <button onClick={handleLogout} className="flex items-center space-x-1 text-sm text-white/60 hover:text-white transition-colors">
                  <LogOut size={16} />
                  <span>로그아웃</span>
                </button>
              ) : (
                <button onClick={handleLogin} className="flex items-center space-x-1 bg-[#5E2A84] px-4 py-2 rounded-full text-sm hover:bg-[#7A3EB0] transition-all shadow-md">
                  <LogIn size={16} />
                  <span>로그인</span>
                </button>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-white/10 focus:outline-none"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#1A362B] border-t border-white/10 overflow-hidden"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 max-h-[80vh] overflow-y-auto">
              <Link to="/about" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium hover:bg-white/10">교회소개</Link>
              
              {BOARDS.map((board) => (
                <div key={board.id} className="space-y-1">
                  {board.subBoards ? (
                    <>
                      <div className="px-3 py-2 text-xs font-bold text-white/40 uppercase tracking-widest">{board.name}</div>
                      {board.subBoards.map(sub => (
                        <Link
                          key={sub.id}
                          to={`/board/${sub.id}`}
                          onClick={() => setIsOpen(false)}
                          className="block px-6 py-2 rounded-md text-sm font-medium text-white/70 hover:bg-white/10"
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </>
                  ) : (
                    <Link
                      to={`/board/${board.id}`}
                      onClick={() => setIsOpen(false)}
                      className="block px-3 py-2 rounded-md text-base font-medium hover:bg-white/10"
                    >
                      {board.name}
                    </Link>
                  )}
                </div>
              ))}
              
              <Link to="/prayer" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium hover:bg-white/10">기도요청</Link>
              
              <div className="pt-4 mt-4 border-t border-white/10">
                {user ? (
                  <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-base font-medium text-white/60 hover:bg-white/10">
                    로그아웃
                  </button>
                ) : (
                  <button onClick={handleLogin} className="w-full text-left px-3 py-2 text-base font-medium bg-[#5E2A84] rounded-md">
                    로그인
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Footer = () => (
  <footer className="bg-[#1A362B] text-white/60 py-16 border-t border-white/10">
    <div className="max-w-7xl mx-auto px-4 text-center">
      <div className="flex flex-col items-center mb-10">
        {/* Church Name inside a prominent rounded badge */}
        <div className="inline-flex items-center justify-center bg-[#5E2A84] px-10 py-5 rounded-full mb-8 shadow-2xl border-2 border-[#D4AF37]/30">
          <h3 className="text-white text-2xl md:text-3xl font-sans font-black tracking-tighter">
            주님의 쉼터 교회
          </h3>
        </div>
        
        {/* Large, highly readable slogan for seniors */}
        <p className="text-3xl md:text-5xl font-sans font-extrabold text-[#D4AF37] leading-tight max-w-3xl mx-auto drop-shadow-sm">
          참된 평안과 영적 회복이 있는 곳
        </p>
      </div>
      
      <div className="pt-10 border-t border-white/5 flex flex-col items-center space-y-4">
        <span className="text-sm font-bold text-white/50 tracking-wide">© 2026 주님의 쉼터 교회. All rights reserved.</span>
        <div className="text-[10px] uppercase tracking-[0.4em] opacity-20 font-black">
          Deep Forest Green & Royal Purple
        </div>
      </div>
    </div>
  </footer>
);

const HomePage = () => (
  <div className="space-y-20 pb-20">
    {/* Hero Section */}
    <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <motion.img 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 20, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
          src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=1920" 
          alt="Forest Background" 
          className="w-full h-full object-cover opacity-50"
          referrerPolicy="no-referrer"
        />
        {/* Layered Gradients for Depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1A362B]/60 via-transparent to-[#1A362B]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,#1A362B_100%)] opacity-70" />
        
        {/* Sensible Decorative Particles (Floating Light) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                x: `${Math.random() * 100}%`, 
                y: `${Math.random() * 100}%`,
                opacity: 0.1
              }}
              animate={{ 
                y: ["-10px", "10px", "-10px"],
                opacity: [0.1, 0.4, 0.1],
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                duration: 7 + Math.random() * 7, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: Math.random() * 5
              }}
              className="absolute w-1.5 h-1.5 bg-[#D4AF37] rounded-full blur-[2px]"
            />
          ))}
        </div>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="relative z-10 text-center px-4 max-w-4xl"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="inline-block mb-6 px-4 py-1 border border-[#D4AF37]/30 rounded-full bg-[#D4AF37]/10 backdrop-blur-sm"
        >
          <span className="text-[#D4AF37] text-xs font-bold uppercase tracking-[0.3em]">Welcome to Lord's Rest</span>
        </motion.div>
        
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-sans font-black text-white mb-8 leading-[1.1] tracking-tighter drop-shadow-2xl">
          참된 평안이 머무는<br />
          <span className="text-[#D4AF37]">주님의 쉼터</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-white/70 max-w-2xl mx-auto mb-12 font-light leading-relaxed">
          바쁜 일상을 잠시 멈추고, <br className="hidden md:block" />
          깊은 숲속의 고요함처럼 임하는 하나님의 평강을 경험하세요.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <Link 
            to="/about" 
            className="group relative inline-flex items-center px-10 py-4 bg-[#5E2A84] text-white rounded-full overflow-hidden transition-all shadow-2xl"
          >
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <span className="relative font-medium">교회 소개 보기</span>
            <ChevronRight className="relative ml-2 group-hover:translate-x-1 transition-transform" size={20} />
          </Link>
          
          <Link 
            to="/board/sermons" 
            className="text-white/60 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium tracking-widest uppercase"
          >
            최근 설교 듣기 <div className="w-8 h-[1px] bg-white/20" />
          </Link>
        </div>
      </motion.div>
      
      {/* Scroll Indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-[10px] text-white/30 uppercase tracking-[0.2em]">Scroll</span>
        <div className="w-[1px] h-12 bg-gradient-to-b from-white/30 to-transparent" />
      </motion.div>
    </section>

    {/* Boards Grid */}
    <section className="max-w-7xl mx-auto px-4">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-sans font-black tracking-tighter text-white mb-4">영적 성장을 위한 공간</h2>
        <div className="w-20 h-1 bg-[#5E2A84] mx-auto rounded-full" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {BOARDS.map((board, idx) => (
          <motion.div
            key={board.id}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
          >
            <Link 
              to={board.subBoards ? `/board/${board.subBoards[0].id}` : `/board/${board.id}`}
              className="group block p-8 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all hover:-translate-y-2"
            >
              <div className="w-14 h-14 bg-[#5E2A84]/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#5E2A84] transition-colors">
                <board.icon className="text-[#5E2A84] group-hover:text-white transition-colors" size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{board.name}</h3>
              <p className="text-white/60 text-sm leading-relaxed">{board.description}</p>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>

    {/* Prayer CTA */}
    <section className="max-w-5xl mx-auto px-4">
      <div className="bg-gradient-to-r from-[#5E2A84] to-[#1A362B] rounded-3xl p-12 text-center shadow-2xl border border-white/10">
        <Heart className="text-[#D4AF37] mx-auto mb-6" size={48} />
        <h2 className="text-3xl font-sans font-black tracking-tighter text-white mb-6">당신의 기도를 함께 돕겠습니다</h2>
        <p className="text-white/80 mb-10 max-w-xl mx-auto">
          홀로 짊어지기 힘든 짐이 있다면 이곳에 기도 제목을 남겨주세요. 
          목회자가 한마음으로 기도하겠습니다.
        </p>
        <Link 
          to="/prayer" 
          className="inline-block px-10 py-4 bg-white text-[#1A362B] rounded-full hover:bg-[#D4AF37] hover:text-white transition-all font-bold"
        >
          기도 요청하기
        </Link>
      </div>
    </section>
  </div>
);

const AboutPage = () => (
  <div className="max-w-4xl mx-auto px-4 py-20">
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="space-y-12"
    >
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-sans font-black tracking-tighter text-white mb-4">교회 소개</h1>
        <div className="w-20 h-1 bg-[#5E2A84] mx-auto rounded-full" />
      </div>

      <div className="aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/10">
        <img 
          src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=1200&h=800" 
          alt="Peaceful Forest - Spiritual Rest" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>

      <div className="prose prose-invert max-w-none space-y-12 text-white/80 leading-relaxed font-sans">
        <section>
          <h2 className="text-2xl md:text-3xl font-sans font-extrabold tracking-tight text-[#D4AF37] mb-6">참된 평안이 머무는 곳</h2>
          <p className="text-lg font-light">
            바쁘고 지친 현대인의 삶 속에서, 진정한 안식은 오직 예수 그리스도 품 안에 있습니다.
            주님의 쉼터 교회는 깊이 있는 '말씀 공부'와 따뜻한 '삶의 나눔'을 통해 성도님들이 영적으로 회복되고 성장하는 커뮤니티입니다.
          </p>
        </section>

        <section className="bg-white/5 p-8 md:p-12 rounded-[2rem] border border-white/10 shadow-inner">
          <h2 className="text-2xl font-sans font-extrabold tracking-tight text-[#D4AF37] mb-8">우리의 비전</h2>
          <ul className="space-y-6 list-none p-0">
            <li className="flex items-start group">
              <div className="w-6 h-6 rounded-full bg-[#5E2A84]/20 flex items-center justify-center mr-4 mt-1 shrink-0 group-hover:bg-[#5E2A84] transition-colors">
                <ChevronRight className="text-[#D4AF37]" size={14} />
              </div>
              <span className="text-lg font-medium">짙은 녹음처럼 변치 않는 진리의 말씀 위에 서는 교회</span>
            </li>
            <li className="flex items-start group">
              <div className="w-6 h-6 rounded-full bg-[#5E2A84]/20 flex items-center justify-center mr-4 mt-1 shrink-0 group-hover:bg-[#5E2A84] transition-colors">
                <ChevronRight className="text-[#D4AF37]" size={14} />
              </div>
              <span className="text-lg font-medium">보랏빛 향기처럼 그리스도의 사랑을 세상에 퍼뜨리는 교회</span>
            </li>
            <li className="flex items-start group">
              <div className="w-6 h-6 rounded-full bg-[#5E2A84]/20 flex items-center justify-center mr-4 mt-1 shrink-0 group-hover:bg-[#5E2A84] transition-colors">
                <ChevronRight className="text-[#D4AF37]" size={14} />
              </div>
              <span className="text-lg font-medium">성령의 위로와 쉼이 있는 영적 안식처가 되는 교회</span>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-sans font-extrabold tracking-tight text-[#D4AF37] mb-6">예배 안내</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 p-8 rounded-2xl border border-white/5 hover:border-[#5E2A84]/50 transition-colors">
              <h3 className="text-xs font-black text-[#D4AF37] uppercase tracking-[0.2em] mb-3">주일모임</h3>
              <p className="text-2xl font-sans font-bold text-white">오전 11:00</p>
            </div>
            <div className="bg-white/5 p-8 rounded-2xl border border-white/5 hover:border-[#5E2A84]/50 transition-colors">
              <h3 className="text-xs font-black text-[#D4AF37] uppercase tracking-[0.2em] mb-3">수요모임</h3>
              <p className="text-2xl font-sans font-bold text-white">오후 7:30</p>
            </div>
            <div className="bg-white/5 p-8 rounded-2xl border border-white/5 hover:border-[#5E2A84]/50 transition-colors">
              <h3 className="text-xs font-black text-[#D4AF37] uppercase tracking-[0.2em] mb-3">새벽모임</h3>
              <p className="text-2xl font-sans font-bold text-white">오전 5:30</p>
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  </div>
);

const BoardPage = ({ user }: { user: User | null }) => {
  const { boardId } = useParams();
  const location = useLocation();
  const currentBoardId = boardId;
  const board = findBoard(currentBoardId);
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', category: '', videoUrl: '' });
  const [loading, setLoading] = useState(true);

  // Check if user is admin (simple check for demo, real check in rules)
  const isAdmin = user?.email === 'allplaces91@gmail.com';

  useEffect(() => {
    if (!currentBoardId) return;
    
    setLoading(true);
    const q = query(
      collection(db, 'posts'),
      where('boardType', '==', currentBoardId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      setPosts(fetchedPosts);
      setLoading(false);
    }, (error) => {
      console.error("Board load error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentBoardId]);

  const handleAddPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isAdmin) return;

    try {
      await addDoc(collection(db, 'posts'), {
        ...newPost,
        authorId: user.uid,
        authorName: user.displayName || '익명',
        boardType: currentBoardId,
        createdAt: serverTimestamp(),
      });
      setShowAddModal(false);
      setNewPost({ title: '', content: '', category: '', videoUrl: '' });
    } catch (error) {
      console.error("Add post error:", error);
    }
  };

  if (!board) return <div className="py-20 text-center text-white">게시판을 찾을 수 없습니다.</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Peaceful Header Image */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative h-64 md:h-80 rounded-[2.5rem] overflow-hidden mb-12 shadow-2xl border border-white/10"
      >
        <img 
          src={`https://picsum.photos/seed/${board.id}/1600/900`} 
          alt={board.name}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A362B] via-[#1A362B]/40 to-transparent" />
        <div className="absolute bottom-10 left-10">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-[#5E2A84] rounded-2xl flex items-center justify-center shadow-lg">
              <board.icon className="text-white" size={24} />
            </div>
            <h1 className="text-4xl md:text-5xl font-sans font-black tracking-tighter text-white">{board.name}</h1>
          </div>
          <p className="text-white/70 text-lg font-light max-w-xl">{board.description}</p>
        </div>
      </motion.div>

      <div className="flex justify-between items-center mb-12">
        <div className="space-y-1">
          <h2 className="text-xs font-black text-[#D4AF37] uppercase tracking-[0.2em] mb-1">Community Board</h2>
          <p className="text-white/40 text-sm">총 {posts.length}개의 글이 있습니다.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 bg-[#5E2A84] px-6 py-3 rounded-full hover:bg-[#7A3EB0] transition-all shadow-lg text-white font-medium"
          >
            <Plus size={20} />
            <span>새 글 작성</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5E2A84]" />
        </div>
      ) : posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <motion.div 
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 transition-all flex flex-col"
            >
              {post.videoUrl && (
                <div className="aspect-video bg-black">
                   <iframe
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${post.videoUrl.split('v=')[1] || post.videoUrl.split('/').pop()}`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              )}
              <div className="p-6 flex-grow">
                {post.category && (
                  <span className="inline-block px-3 py-1 bg-[#5E2A84]/20 text-[#D4AF37] text-[10px] font-bold uppercase tracking-widest rounded-full mb-4">
                    {post.category}
                  </span>
                )}
                <h3 className="text-xl font-bold text-white mb-3 line-clamp-2">{post.title}</h3>
                <div className="text-white/60 text-sm line-clamp-4 overflow-hidden">
                  <Markdown>{post.content}</Markdown>
                </div>
              </div>
              <div className="p-6 pt-0 mt-auto border-t border-white/5 flex items-center justify-between text-[10px] text-white/40 uppercase tracking-widest">
                <span>{post.authorName}</span>
                <span>{post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString() : '방금 전'}</span>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-32 bg-white/5 rounded-3xl border border-dashed border-white/10">
          <p className="text-white/40 italic">아직 게시물이 없습니다.</p>
        </div>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative z-10 bg-[#1A362B] border border-white/20 w-full max-w-2xl rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-serif italic text-white">새 글 작성</h2>
                <button onClick={() => setShowAddModal(false)} className="text-white/60 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleAddPost} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">제목</label>
                  <input 
                    required
                    value={newPost.title}
                    onChange={e => setNewPost({...newPost, title: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#5E2A84] transition-colors"
                    placeholder="제목을 입력하세요"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">카테고리</label>
                    <input 
                      value={newPost.category}
                      onChange={e => setNewPost({...newPost, category: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#5E2A84] transition-colors"
                      placeholder="예: 창세기, 나의 삶"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">영상 URL (선택)</label>
                    <input 
                      value={newPost.videoUrl}
                      onChange={e => setNewPost({...newPost, videoUrl: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#5E2A84] transition-colors"
                      placeholder="YouTube URL"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">내용 (Markdown 지원)</label>
                  <textarea 
                    required
                    rows={8}
                    value={newPost.content}
                    onChange={e => setNewPost({...newPost, content: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#5E2A84] transition-colors resize-none"
                    placeholder="말씀이나 나눔 내용을 적어주세요..."
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-[#5E2A84] py-4 rounded-xl text-white font-bold hover:bg-[#7A3EB0] transition-all shadow-lg"
                >
                  게시하기
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const PrayerPage = ({ user }: { user: User | null }) => {
  const [form, setForm] = useState({ name: '', contact: '', content: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Save to Firestore
      await addDoc(collection(db, 'prayer_requests'), {
        ...form,
        userId: user?.uid || null,
        createdAt: serverTimestamp(),
      });

      // 2. Send to Formspree
      await fetch('https://formspree.io/f/xgonnrjo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...form,
          _subject: `[주님의 쉼터 교회] 새로운 기도 요청: ${form.name || '익명'}`,
          userEmail: user?.email || '비회원'
        })
      });

      setSubmitted(true);
    } catch (error) {
      console.error("Prayer submit error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl"
      >
        <div className="text-center mb-12">
          <Heart className="text-[#D4AF37] mx-auto mb-4" size={40} />
          <h1 className="text-4xl font-serif italic text-white mb-4">온라인 기도요청</h1>
          <p className="text-white/60">
            홀로 짊어지기 힘든 짐이 있다면 이곳에 기도 제목을 남겨주세요.<br />
            남겨주신 내용은 목회자에게만 안전하게 전달됩니다.
          </p>
        </div>

        {submitted ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 bg-[#5E2A84]/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Send className="text-[#5E2A84]" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">기도 요청이 전달되었습니다</h2>
            <p className="text-white/60 mb-8">한마음으로 함께 기도하겠습니다.</p>
            <button 
              onClick={() => setSubmitted(false)}
              className="text-[#D4AF37] hover:underline font-medium"
            >
              추가로 요청하기
            </button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-3">이름 (또는 익명)</label>
                <input 
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-[#5E2A84] transition-colors"
                  placeholder="이름을 입력하세요"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-3">연락처 (선택)</label>
                <input 
                  value={form.contact}
                  onChange={e => setForm({...form, contact: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-[#5E2A84] transition-colors"
                  placeholder="010-0000-0000"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-3">기도 제목</label>
              <textarea 
                required
                rows={6}
                value={form.content}
                onChange={e => setForm({...form, content: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-[#5E2A84] transition-colors resize-none"
                placeholder="기도가 필요한 내용을 자유롭게 적어주세요..."
              />
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-[#5E2A84] py-5 rounded-xl text-white font-bold hover:bg-[#7A3EB0] transition-all shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <>
                  <Send size={20} />
                  <span>기도 요청하기</span>
                </>
              )}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#1A362B] flex items-center justify-center">
        <div className="animate-pulse text-white/20 font-serif italic text-2xl">주님의 쉼터...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-[#1A362B] font-sans selection:bg-[#5E2A84] selection:text-white">
        <Navbar user={user} />
        
        <main className="min-h-[calc(100vh-80px)]">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/board/:boardId" element={<BoardPage user={user} />} />
            <Route path="/prayer" element={<PrayerPage user={user} />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}
