// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import CandidateCard from '@/components/CandidateCard';
// Import Icon
import { 
  Loader2, ShieldCheck, LogOut, User, LayoutDashboard, Lock, Menu, X, ChevronRight 
} from 'lucide-react';
// Import Animasi & Notifikasi
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner'; 

// Tipe Data
type Candidate = {
  id: number;
  name: string;
  vision: string;
  image_url: string;
  vote_count: number;
};

export default function Home() {
  const router = useRouter();

  // --- STATE MANAGEMENT ---
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [votingId, setVotingId] = useState<number | null>(null);
  const [userHasVoted, setUserHasVoted] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // State yang sebelumnya hilang/error
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // --- INIT ---
  useEffect(() => {
    checkSessionAndFetchData();
  }, []);

  async function checkSessionAndFetchData() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setCurrentUser(session.user);
        
        // Cek Role Admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        if (profile?.role === 'admin') {
          setIsAdmin(true);
        }

        await checkIfVoted(session.user.id);
      }

      await fetchCandidates();
      
    } catch (error) {
      console.error("Error init:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCandidates() {
    const { data } = await supabase
      .from('candidates')
      .select('*')
      .order('id', { ascending: true });
    if (data) setCandidates(data);
  }

  async function checkIfVoted(userId: string) {
    const { data } = await supabase
      .from('votes')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (data) setUserHasVoted(true);
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        toast.error("Gagal logout");
    } else {
        window.location.reload();
    }
  }

  // --- HANDLE VOTE (DENGAN SONNER) ---
  async function handleVote(candidateId: number) {
    // 1. Validasi Login
    if (!currentUser) {
      toast.error("🔒 Akses Terbatas", {
        description: "Silakan login terlebih dahulu untuk memberikan suara."
      });
      router.push('/login');
      return;
    }

    // 2. Validasi Admin
    if (isAdmin) {
      toast.warning("⛔ Akses Admin", {
        description: "Admin tidak diperbolehkan ikut voting demi netralitas."
      });
      return;
    }

    setVotingId(candidateId);

    // 3. Proses Vote dengan Toast Promise (Loading -> Success/Error otomatis)
    toast.promise(
      async () => {
        const response = await fetch('/api/vote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id,
            candidateId: candidateId,
            candidateName: candidates.find(c => c.id === candidateId)?.name
          }),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        
        return result; // Data yang dikirim ke 'success' message
      },
      {
        loading: 'Mengenkripsi suara ke Blockchain...',
        success: (result: any) => {
          setUserHasVoted(true);
          fetchCandidates(); // Refresh data realtime
          setVotingId(null);
          return `Suara Sah! Hash Blok: ${result.blockHash.substring(0, 8)}...`;
        },
        error: (err) => {
          setVotingId(null);
          return `Gagal: ${err.message}`;
        }
      }
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-blue-500/30 overflow-x-hidden">
      
      {/* --- NAVBAR RESPONSIVE --- */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            
            {/* Logo */}
            <div className="flex items-center gap-2 font-bold text-xl tracking-tight cursor-pointer" onClick={() => router.push('/')}>
              <div className="bg-blue-600/10 p-1.5 rounded-lg text-blue-600 border border-blue-600/10">
                 <ShieldCheck size={24} />
              </div>
              <span>Chain<span className="text-blue-600">Vote</span></span>
            </div>
            
            {/* DESKTOP MENU (Hidden on Mobile) */}
            <div className="hidden md:flex items-center gap-4">
              {currentUser ? (
                <>
                  {isAdmin && (
                    <button 
                      onClick={() => router.push('/admin')}
                      className="flex items-center gap-2 bg-zinc-900 dark:bg-white dark:text-zinc-900 text-white px-5 py-2 rounded-full font-medium text-sm hover:bg-black dark:hover:bg-zinc-200 transition shadow-lg"
                    >
                      <LayoutDashboard size={16} /> Dashboard
                    </button>
                  )}
                  <div className="flex items-center gap-3 bg-zinc-100 dark:bg-zinc-900 py-1.5 px-3 rounded-full border border-zinc-200 dark:border-zinc-800">
                    <div className="flex flex-col text-right mr-1">
                      <span className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">
                        {isAdmin ? 'Administrator' : 'Voter'}
                      </span>
                      <span className="text-xs font-mono max-w-[120px] truncate">{currentUser.email}</span>
                    </div>
                    <button onClick={handleLogout} className="p-2 bg-white dark:bg-zinc-800 rounded-full hover:text-red-500 transition shadow-sm" title="Logout">
                      <LogOut size={16} />
                    </button>
                  </div>
                </>
              ) : (
                // TOMBOL LOGIN PERBAIKAN (Warna Biru Konsisten)
                <button 
                  onClick={() => router.push('/login')}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full font-bold transition-all text-sm shadow-lg shadow-blue-500/20"
                >
                  <Lock size={16} /> Login Peserta
                </button>
              )}
            </div>

            {/* MOBILE HAMBURGER BUTTON (Visible on Mobile) */}
            <div className="md:hidden">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>

          </div>
        </div>

        {/* MOBILE MENU DROPDOWN (AnimatePresence) */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden"
            >
              <div className="p-4 space-y-4">
                {currentUser ? (
                  <div className="space-y-4">
                    {/* User Info Mobile */}
                    <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                        <User size={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase text-zinc-500">{isAdmin ? 'Administrator' : 'Registered Voter'}</span>
                        <span className="text-sm font-medium truncate max-w-[200px]">{currentUser.email}</span>
                      </div>
                    </div>

                    {/* Admin Dashboard Link */}
                    {isAdmin && (
                      <button 
                        onClick={() => router.push('/admin')}
                        className="w-full flex items-center justify-between bg-zinc-900 dark:bg-white dark:text-zinc-900 text-white p-3 rounded-xl font-medium shadow-lg active:scale-95 transition"
                      >
                        <span className="flex items-center gap-2"><LayoutDashboard size={18} /> Ke Dashboard Admin</span>
                        <ChevronRight size={18} />
                      </button>
                    )}

                    {/* Logout Button */}
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center justify-between bg-zinc-100 dark:bg-zinc-900 text-red-500 p-3 rounded-xl font-medium border border-zinc-200 dark:border-zinc-800 active:scale-95 transition hover:bg-red-50 dark:hover:bg-red-900/10"
                    >
                      <span className="flex items-center gap-2"><LogOut size={18} /> Keluar Aplikasi</span>
                    </button>
                  </div>
                ) : (
                  // TOMBOL LOGIN MOBILE (Warna Biru Konsisten)
                  <button 
                    onClick={() => router.push('/login')}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl font-bold shadow-lg transition-all"
                  >
                    <Lock size={18} /> Login Peserta
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        
        {/* HERO SECTION */}
        <div className="text-center mb-16 sm:mb-24 space-y-6 pt-8 sm:pt-12">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 font-medium text-xs border border-blue-200 dark:border-blue-800 uppercase tracking-wider"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Live Blockchain System
          </motion.div>
          
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-[1.1]">
            Suara Masa Depan <br className="hidden md:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500">
              Jujur & Terdesentralisasi
            </span>
          </h1>
          
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed px-4">
            Platform E-Voting berbasis Blockchain yang menjamin integritas data. 
            Setiap suara Anda dienkripsi SHA-256, transparan, dan abadi dalam rantai blok.
          </p>
        </div>

        {/* GRID KANDIDAT */}
        {candidates.length === 0 ? (
          <div className="text-center py-24 bg-zinc-100 dark:bg-zinc-900/50 rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-800 max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-zinc-200 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
               <ShieldCheck className="text-zinc-400" size={32} />
            </div>
            <p className="text-zinc-500 text-lg font-medium">Belum ada kandidat aktif.</p>
            <p className="text-zinc-400 text-sm mt-1">Sistem menunggu Admin memulai sesi pemilihan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {candidates.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                id={candidate.id}
                name={candidate.name}
                vision={candidate.vision}
                imageUrl={candidate.image_url}
                onVote={handleVote}
                isVoting={votingId === candidate.id}
                hasVoted={userHasVoted}
              />
            ))}
          </div>
        )}

        {/* FOOTER */}
        <div className="mt-32 pt-10 border-t border-zinc-200 dark:border-zinc-800 flex flex-col items-center gap-4 text-center pb-10">
          <div className="flex gap-2 text-zinc-400 text-sm font-mono bg-zinc-100 dark:bg-zinc-900 px-4 py-2 rounded-lg">
             <span>Blockchain Status:</span>
             <span className="text-emerald-500 flex items-center gap-1 font-bold">
               ● Connected
             </span>
          </div>
          <p className="text-xs text-zinc-500">
            © {new Date().getFullYear()} E-Voting Blockchain Project. Powered by Next.js 14 • Supabase • Custom Blockchain Logic
          </p>
        </div>

      </div>
    </div>
  );
}